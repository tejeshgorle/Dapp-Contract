"use client";

import React, { useEffect, useState } from "react";
import {
  getContractInfo,
  getUserByAddress,
  hasUserSigned,
  hasUserDenied
} from "@/utils/contract";

import { useParams, useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import {
  ArrowLeft,
  FileText,
  User,
  Users,
  ExternalLink,
  ClipboardList,
  ShieldCheck,
  ShieldX,
  Clock
} from "lucide-react";

export default function ContractInfoPage() {
  const { id } = useParams();
  const router = useRouter();

  const [info, setInfo] = useState<any>(null);
  const [owner, setOwner] = useState<string>("Loading...");
  const [signers, setSigners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    async function load() {
      try {
        const c = await getContractInfo(Number(id));
        setInfo(c);

        let ownerName = c.creator;
        const ownerUser = await getUserByAddress(c.creator);
        if (ownerUser?.username) ownerName = ownerUser.username;
        setOwner(ownerName);

        const signerDetails = await Promise.all(
          c.signers.map(async (addr: string) => {
            const u = await getUserByAddress(addr);

            const signed = await hasUserSigned(Number(id), addr);
            const denied = await hasUserDenied(Number(id), addr);

            let status = "Pending";
            if (signed) status = "Signed";
            if (denied) status = "Denied";

            return {
              wallet: addr,
              username: u?.username || addr,
              status
            };
          })
        );

        setSigners(signerDetails);
      } catch (err) {
        console.error("Contract info error:", err);
      }

      setLoading(false);
    }

    load();
  }, [id]);

  if (loading) return <p className="text-white p-6">Loading contract...</p>;
  if (!info) return <p className="text-white p-6">Contract not found.</p>;

  return (
    <main className="p-10 text-white min-h-screen bg-[#05070d] space-y-8">

      {/* BACK BUTTON */}
      <Button
        className="flex items-center gap-2 bg-[#11172d] text-gray-200 hover:bg-[#1b2647] border border-white/10"
        onClick={() => router.back()}
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </Button>

      {/* TITLE */}
      <div className="flex items-center gap-3">
        <ClipboardList className="w-8 h-8 text-[#F5C542]" />
        <h1 className="text-3xl font-extrabold text-[#F5C542]">
          Contract #{info.id}
        </h1>
      </div>

      {/* MAIN CARD */}
      <Card className="bg-[#0c1020] border border-white/10 shadow-xl rounded-2xl">
        <CardContent className="p-8 space-y-8">

          {/* OWNER */}
          <div className="space-y-2">
            <p className="flex items-center gap-2 text-lg">
              <User className="w-5 h-5 text-[#F5C542]" />
              <span className="text-gray-300">Owner:</span>{" "}
              <span className="text-blue-300">{owner}</span>
            </p>
          </div>

          {/* CID */}
          <div>
            <p className="flex items-center gap-2 text-gray-300 text-sm">
              <FileText className="w-4 h-4 text-[#F5C542]" />
              CID:
              <span className="ml-2 text-blue-400 break-all">{info.cid}</span>
            </p>

            <div className="flex flex-col mt-3 gap-2">
              <a
                href={`http://127.0.0.1:8080/ipfs/${info.cid}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow"
              >
                <ExternalLink className="w-4 h-4" /> View on Local IPFS
              </a>

              {/* <a
                href={`https://ipfs.io/ipfs/${info.cid}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-blue-300 underline text-xs"
              >
                View on ipfs.io (public)
              </a> */}
            </div>
          </div>

          {/* STATUS */}
          <div className="flex items-center gap-2 text-sm mt-4">
            <Clock className="w-4 h-4 text-[#F5C542]" />
            <span className="text-gray-400">Status:</span>
            <span className="text-gray-200">
              {info.status === 0
                ? "Pending"
                : info.status === 1
                ? "Completed"
                : "Canceled"}
            </span>
          </div>

          {/* SIGNERS */}
          <div>
            <h3 className="text-xl font-semibold flex items-center gap-2 text-[#F5C542] mt-4">
              <Users className="w-6 h-6" /> Signers
            </h3>

            <ul className="mt-5 space-y-4">
              {signers.map((s, i) => (
                <li
                  key={i}
                  className="p-4 bg-[#11172d] rounded-xl border border-white/10 flex justify-between items-center shadow"
                >
                  <div>
                    <p className="text-[#F5C542] text-lg">{s.username}</p>
                    <p className="text-xs text-gray-400">{s.wallet}</p>
                  </div>

                  <span
                    className={
                      "px-3 py-1 text-sm rounded-lg flex items-center gap-2 " +
                      (s.status === "Signed"
                        ? "bg-green-700 text-green-100"
                        : s.status === "Denied"
                        ? "bg-red-700 text-red-200"
                        : "bg-yellow-600 text-yellow-100")
                    }
                  >
                    {s.status === "Signed" && <ShieldCheck className="w-4 h-4" />}
                    {s.status === "Denied" && <ShieldX className="w-4 h-4" />}
                    {s.status === "Pending" && <Clock className="w-4 h-4" />}
                    {s.status}
                  </span>
                </li>
              ))}
            </ul>
          </div>

        </CardContent>
      </Card>
    </main>
  );
}
