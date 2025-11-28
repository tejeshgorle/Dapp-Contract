"use client";

import { useEffect, useState } from "react";
import {
  History,
  User,
  Users,
  ShieldCheck,
  ShieldX,
  MinusCircle,
  FileText,
} from "lucide-react";

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
  cid: string;
  creator: string;
  signers: string[];
  signedCount: number;
  status: number; 
  ownerName?: string;
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

      let all = (await getFullContractsWhereUserIsParty(myWallet)) as UIContract[];
      let completed = all.filter((c) => c.status !== 0);

      const addressSet = new Set<string>();
      for (const c of completed) addressSet.add(c.creator.toLowerCase());

      const addressToName: Record<string, string> = {};
      await Promise.all(
        Array.from(addressSet).map(async (addr) => {
          const user = await getUserByAddress(addr);
          addressToName[addr] = user?.username || addr;
        })
      );

      const final: UIContract[] = [];

      for (const c of completed) {
        c.ownerName = addressToName[c.creator.toLowerCase()] || c.creator;

        const signed = await hasUserSigned(c.id, myWallet);
        const denied = await hasUserDenied(c.id, myWallet);

        c.userSigned = signed;
        c.userDenied = denied;

        c.deniedBy = null;
        c.canceledBy = null;

        if (c.status === 2) {
          c.canceledBy = c.creator;
        }

        if (c.status !== 1) {
          for (const addr of c.signers) {
            const d = await hasUserDenied(c.id, addr);
            if (d) {
              const usr = await getUserByAddress(addr);
              c.deniedBy = usr?.username || addr;
              break;
            }
          }
        }

        final.push(c);
      }

      setHistory(final);
    } catch (err) {
      console.error("History loading failed:", err);
    }

    setLoading(false);
  }

  if (loading)
    return <p className="text-white p-6">Loading contract history...</p>;

  return (
    <main className="p-10 min-h-screen bg-[#05070d] text-white">

      {/* HEADER */}
      <div className="flex items-center gap-4 mb-8">
        <History className="w-10 h-10 text-[#F5C542]" />
        <h1 className="text-3xl font-extrabold text-[#F5C542] tracking-wide">
          Contract History
        </h1>
      </div>

      <div className="p-8 rounded-2xl bg-[#0c1020] border border-white/10 shadow-xl max-w-5xl">

        {/* SECTION TITLE */}
        <div className="flex items-center gap-3 mb-6">
          <FileText className="w-7 h-7 text-[#F5C542]" />
          <h2 className="text-xl font-semibold text-white">
            Completed, Denied & Cancelled Contracts
          </h2>
        </div>

        {history.length === 0 ? (
          <p className="text-gray-400">No archived contracts yet.</p>
        ) : (
          <div className="space-y-5">
            {history.map((c) => (
              <Card
                key={c.id}
                onClick={() =>
                  (window.location.href = `/contract-info/${c.id}`)
                }
                className="bg-[#131a33] border border-white/10 text-white cursor-pointer 
                           rounded-xl hover:shadow-xl hover:border-[#F5C542] hover:bg-[#1a2345] 
                           transition"
              >
                <CardContent className="p-5 space-y-4">

                  {/* TOP ROW */}
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">
                      Contract #{c.id}
                    </h3>

                    {/* STATUS BADGE */}
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-2 ${
                        c.status === 1
                          ? "text-green-300 bg-green-700/30"
                          : c.deniedBy
                          ? "text-red-300 bg-red-700/30"
                          : "text-orange-300 bg-orange-700/30"
                      }`}
                    >
                      {c.status === 1 && <ShieldCheck className="w-4 h-4" />}
                      {c.deniedBy && <ShieldX className="w-4 h-4" />}
                      {!c.deniedBy && c.status !== 1 && (
                        <MinusCircle className="w-4 h-4" />
                      )}

                      {c.status === 1
                        ? "Completed"
                        : c.deniedBy
                        ? `Denied by ${c.deniedBy}`
                        : `Canceled by ${c.canceledBy}`}
                    </span>
                  </div>

                  {/* DETAILS SECTION WITH ICONS */}
                  <div className="space-y-2 text-sm text-gray-300">

                    {/* OWNER */}
                    <p className="flex items-center gap-2">
                      <User className="w-4 h-4 text-[#F5C542]" />
                      <span className="text-gray-400">Owner:</span>
                      {c.ownerName}
                    </p>

                    {/* TOTAL PARTIES */}
                    <p className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-[#F5C542]" />
                      <span className="text-gray-400">Total Parties:</span>
                      {c.signers.length}
                    </p>

                    {/* SIGNED COUNT */}
                    <p className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-[#F5C542]" />
                      <span className="text-gray-400">Signed Count:</span>
                      {c.signedCount} / {c.signers.length}
                    </p>

                    {/* USER ACTION */}
                    <p className="flex items-center gap-2">
                      {c.userSigned ? (
                        <ShieldCheck className="w-4 h-4 text-green-400" />
                      ) : c.userDenied ? (
                        <ShieldX className="w-4 h-4 text-red-400" />
                      ) : (
                        <MinusCircle className="w-4 h-4 text-gray-400" />
                      )}

                      <span className="text-gray-400">Your Action:</span>
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
