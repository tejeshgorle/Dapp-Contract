"use client";

import { useEffect, useState } from "react";
import {
  getContractInfo,
  getUserByAddress,
  hasUserSigned,
  hasUserDenied
} from "@/utils/contract";

import { useParams, useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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

        // Creator / owner
        let ownerName = c.creator;
        const ownerUser = await getUserByAddress(c.creator);
        if (ownerUser?.username) ownerName = ownerUser.username;
        setOwner(ownerName);

        // Fetch signer details with SIGN STATUS
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
    <main className="p-8 text-white space-y-6">
      <Button
        className="bg-gray-700 hover:bg-gray-600"
        onClick={() => router.back()}
      >
        ← Back
      </Button>

      <h1 className="text-3xl font-bold text-[#F5C542]">
        Contract #{info.id}
      </h1>

      <Card className="bg-[#11172d] border border-white/10">
        <CardContent className="p-6">

          <p className="text-lg">
            <span className="text-gray-400">Owner:</span>{" "}
            <span className="text-blue-300">{owner}</span>
          </p>

          <p className="mt-2 text-sm text-gray-300">
            CID Hash (bytes32):
            <span className="ml-2 text-blue-400 break-all">{info.cidHash}</span>
          </p>

          <p className="mt-4 text-sm text-gray-400">
            Status:{" "}
            {info.status === 0
              ? "Pending"
              : info.status === 1
              ? "Completed"
              : "Canceled"}
          </p>

          <h3 className="text-xl font-semibold mt-6">Signers</h3>

          <ul className="mt-3 space-y-3">
            {signers.map((s, i) => (
              <li
                key={i}
                className="p-3 bg-[#0d1328] rounded-lg flex justify-between items-center"
              >
                <div>
                  <p className="text-[#F5C542]">{s.username}</p>
                  <p className="text-xs text-gray-400">{s.wallet}</p>
                </div>

                {/* STATUS BADGE */}
                <span
                  className={
                    "px-3 py-1 text-sm rounded-lg " +
                    (s.status === "Signed"
                      ? "bg-green-700 text-green-200"
                      : s.status === "Denied"
                      ? "bg-red-700 text-red-200"
                      : "bg-yellow-600 text-yellow-100")
                  }
                >
                  {s.status}
                </span>
              </li>
            ))}
          </ul>

        </CardContent>
      </Card>
    </main>
  );
}
