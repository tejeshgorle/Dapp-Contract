import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Convert File → Blob → Buffer
    const arrayBuffer = await file.arrayBuffer();
    const blob = new Blob([arrayBuffer], { type: file.type });

    // Create form for IPFS
    const ipfsForm = new FormData();
    ipfsForm.append("file", blob, file.name);

    // Call local IPFS node directly
    const res = await fetch("http://127.0.0.1:5001/api/v0/add?pin=true", {
      method: "POST",
      body: ipfsForm,
    });

    const text = await res.text();

    // Response is NOT JSON → parse CID manually
    const cid = text.match(/"Hash":"([^"]+)"/)?.[1] ||
                text.match(/Added ([A-Za-z0-9]+)/)?.[1];

    if (!cid) {
      console.error("IPFS raw response:", text);
      return NextResponse.json({ error: "Could not parse CID" }, { status: 500 });
    }

    return NextResponse.json({ cid });

  } catch (err) {
    console.error("IPFS Upload API Error:", err);
    return NextResponse.json({ error: "IPFS upload failed" }, { status: 500 });
  }
}
