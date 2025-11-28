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

  const upload = async () => {
    if (!file) return;

    try {
      setLoading(true);

      const form = new FormData();
      form.append("file", file);

      const res = await fetch("/api/ipfs/upload", {
        method: "POST",
        body: form,
      });

      const data = await res.json();

      if (data.cid) {
        setCid(data.cid);
        onCID(data.cid);
      } else {
        alert("IPFS upload failed");
      }
    } catch (err) {
      console.error(err);
      alert("Upload error");
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
          {loading ? "Uploading..." : "Upload to IPFS"}
        </Button>

        {cid && (
          <div className="mt-4">
            <label className="text-sm text-gray-200">CID Generated</label>
            <Input value={cid} readOnly className="mt-1" />
          </div>
        )}

      </CardContent>
    </Card>
  );
}
