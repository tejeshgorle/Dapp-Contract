"use client";

import { useEffect, useState } from "react";
import { History } from "lucide-react";
import { getSigner } from "@/utils/web3";
import {
  getFullContractsWhereUserIsParty,
  getUserByAddress,
  hasUserSigned,
  hasUserDenied
} from "@/utils/contract";

import { Card, CardContent } from "@/components/ui/card";

interface UIContract {
  id: number;
  cidHash: string;
  creator: string;
  signers: string[];
  signedCount: number;
  status: number; // 0=pending,1=completed,2=canceled
  ownerName?: string;

  // added fields
  userSigned?: boolean;
  userDenied?: boolean;

  deniedBy?: string | null;
  canceledBy?: string | null;
}

export default function ContractHistoryPage() {
  const [history, setHistory] = useState<UIContract[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  async function loadHistory() {
    try {
      setLoading(true);

      const signer = await getSigner();
      const myWallet = (await signer.getAddress()).toLowerCase();

      // Fetch all contracts where user is a party
      let all = (await getFullContractsWhereUserIsParty(myWallet)) as UIContract[];

      // Filter: only show completed, canceled, denied contracts
      let completed = all.filter((c) => c.status !== 0);

      // Collect creator addresses for username lookup
      const addressSet = new Set<string>();
      for (const c of completed) addressSet.add(c.creator.toLowerCase());

      const addressToName: Record<string, string> = {};
      await Promise.all(
        Array.from(addressSet).map(async (addr) => {
          const user = await getUserByAddress(addr);
          addressToName[addr] = user?.username || addr;
        })
      );

      // Build final contract list with extra data
      const result: UIContract[] = [];

      for (const c of completed) {
        c.ownerName = addressToName[c.creator.toLowerCase()] || c.creator;

        // Did the user sign or deny?
        const signed = await hasUserSigned(c.id, myWallet);
        const denied = await hasUserDenied(c.id, myWallet);

        c.userSigned = signed;
        c.userDenied = denied;

        // Determine who canceled or denied
        c.deniedBy = null;
        c.canceledBy = null;

        // If contract is canceled, the creator canceled it
        if (c.status === 2) {
          c.canceledBy = addressToName[c.creator.toLowerCase()] || c.creator;
        }

        // Identify who denied it (loop through signers)
        if (c.status !== 1) {
          for (const addr of c.signers) {
            const d = await hasUserDenied(c.id, addr);
            if (d) {
              const u = await getUserByAddress(addr);
              c.deniedBy = u?.username || addr;
              break;
            }
          }
        }

        result.push(c);
      }

      setHistory(result);
    } catch (err) {
      console.error("History load error:", err);
    }

    setLoading(false);
  }

  if (loading)
    return <p className="text-white p-6">Loading contract history...</p>;

  return (
    <main className="p-8">
      <h1 className="text-3xl font-semibold text-white mb-6">
        Contract History
      </h1>

      <div
        className="p-6 rounded-xl bg-gradient-to-br from-[#1c2240]/80 to-[#0d1328]/80
      border border-white/10 shadow-lg max-w-4xl"
      >
        <div className="flex items-center gap-4 mb-4">
          <History className="w-10 h-10 text-[#F5C542]" />
          <h2 className="text-xl font-semibold text-white">
            Completed & Archived Contracts
          </h2>
        </div>

        {history.length === 0 ? (
          <p className="text-gray-400">No completed or canceled contracts.</p>
        ) : (
          <div className="space-y-4">
            {history.map((c) => (
              <Card
                key={c.id}
                onClick={() =>
                  (window.location.href = `/contract-info/${c.id}`)
                }
                className="bg-[#131a33] border border-white/10 text-white cursor-pointer 
                           hover:bg-[#1a2345] transition"
              >
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">
                      Contract #{c.id}
                    </h3>

                    {/* STATUS LABEL */}
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        c.status === 1
                          ? "text-green-400 bg-green-700/30"
                          : c.deniedBy
                          ? "text-red-400 bg-red-700/30"
                          : "text-orange-400 bg-orange-700/30"
                      }`}
                    >
                      {c.status === 1
                        ? "Completed"
                        : c.deniedBy
                        ? `Denied by ${c.deniedBy}`
                        : `Canceled by ${c.canceledBy}`}
                    </span>
                  </div>

                  <div className="mt-3 space-y-1 text-sm text-gray-300">
                    <p>
                      <b>Owner:</b> {c.ownerName}
                    </p>

                    <p>
                      <b>Total Parties:</b> {c.signers.length}
                    </p>

                    <p>
                      <b>Signed Count:</b> {c.signedCount} / {c.signers.length}
                    </p>

                    <p>
                      <b>Your Action:</b>{" "}
                      {c.userSigned ? (
                        <span className="text-green-400">Signed</span>
                      ) : c.userDenied ? (
                        <span className="text-red-400">Denied</span>
                      ) : (
                        <span className="text-gray-400">No Action</span>
                      )}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
