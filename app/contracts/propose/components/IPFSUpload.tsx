"use client";

import React, { useState, DragEvent } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";

export default function IPFSUpload({ onCID }: { onCID: (cid: string) => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [cid, setCid] = useState("");
  const [loading, setLoading] = useState(false);

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) setFile(dropped);
  };

  // ---- Generate fake CID locally ----
  async function generateFakeCID(file: File): Promise<string> {
    const buffer = await file.arrayBuffer();

    // SHA-256
    const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));

    // Convert to Base32
    const base32 = hashArray
      .map((b) => b.toString(32).padStart(2, "0"))
      .join("")
      .slice(0, 46) // make it similar length to CIDv1
      .toUpperCase();

    // Return mock CIDv1 (prefix 'bafy' used by IPFS)
    return `bafy${base32}`;
  }

  const upload = async () => {
    if (!file) return;

    try {
      setLoading(true);

      // Generate local hash-based CID
      const fakeCID = await generateFakeCID(file);

      setCid(fakeCID);
      onCID(fakeCID);

    } catch (err) {
      console.error("Local CID error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-4 shadow-lg">
      <CardContent>

        <h2 className="text-lg font-semibold mb-3">Upload Contract File</h2>

        <motion.div
          whileHover={{ scale: 1.02 }}
          className="border-2 border-dashed border-gray-500 rounded-xl p-8 text-center cursor-pointer"
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
        >
          <p className="text-sm text-gray-300">Drag & drop your PDF/TXT file here</p>
          <p className="text-xs text-gray-500 mt-1">or choose manually</p>

          <Input
            type="file"
            accept=".pdf,.txt"
            className="mt-4"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </motion.div>

        {file && <p className="text-sm mt-3 text-green-400">Selected: {file.name}</p>}

        <Button className="mt-4 w-full" onClick={upload} disabled={!file || loading}>
          {loading ? "Generating CID..." : "Generate CID"}
        </Button>

        {cid && (
          <div className="mt-4">
            <label className="text-sm text-gray-200">Generated Test CID</label>
            <Input value={cid} readOnly className="mt-1" />
          </div>
        )}

      </CardContent>
    </Card>
  );
}
