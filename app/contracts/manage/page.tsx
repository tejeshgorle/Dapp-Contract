"use client";

import { useEffect, useState } from "react";
import { getSigner } from "@/utils/web3";
import {
  getMyPendingContracts,
  getFullContractsWhereUserIsParty,
  signMPContract,
  denyMPContract,
  hasUserSigned,
  hasUserDenied,
  cancelMPContract,
  getUserByAddress
} from "@/utils/contract";

import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

/* -------------------------------------------------
   TYPE FIX — prevents “ownerName does not exist”
-------------------------------------------------- */
type UIContract = {
  id: number;
  cidHash: string;
  creator: string;
  signers: string[];
  status: number;
  signedCount: number;
  ownerName?: string; // <-- used everywhere
};

/* ------------------------------------------------- */

export default function ManageContractsPage() {
  const router = useRouter();

  const [pendingContracts, setPendingContracts] = useState<UIContract[]>([]);
  const [allContracts, setAllContracts] = useState<UIContract[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [wallet, setWallet] = useState<string>("");

  useEffect(() => {
    loadContracts();
  }, []);

  /* -------------------------------------------------
        LOAD CONTRACTS (IMPROVED + FIXED)
  -------------------------------------------------- */
  async function loadContracts() {
    setLoading(true);

    try {
      const signer = await getSigner();
      const userWallet = await signer.getAddress();
      setWallet(userWallet);

      // Fetch contracts
      let pending = (await getMyPendingContracts()) as UIContract[];
      let all = (await getFullContractsWhereUserIsParty(
        userWallet
      )) as UIContract[];

      // Collect unique creators to lookup names once
      const addressSet = new Set<string>();
      for (const c of [...pending, ...all]) {
        if (c.creator) addressSet.add(c.creator.toLowerCase());
      }

      // Lookup names (single call per address)
      const addressToName: Record<string, string> = {};

      await Promise.all(
        Array.from(addressSet).map(async (addr) => {
          const user = await getUserByAddress(addr);
          addressToName[addr] = user?.username || addr;
        })
      );

      // Assign ownerName
      pending.forEach(
        (c) => (c.ownerName = addressToName[c.creator.toLowerCase()])
      );
      all.forEach(
        (c) => (c.ownerName = addressToName[c.creator.toLowerCase()])
      );

      // Filter out already signed/denied
      const filteredPending: UIContract[] = [];

      for (const c of pending) {
        const signed = await hasUserSigned(c.id, userWallet);
        const denied = await hasUserDenied(c.id, userWallet);

        if (!signed && !denied && c.status === 0) {
          filteredPending.push(c);
        }
      }

      setPendingContracts(filteredPending);
      setAllContracts(all);
    } catch (err) {
      console.error("Load error:", err);
    }

    setLoading(false);
  }

  /* -------------------------------------------------
                    ACTIONS
  -------------------------------------------------- */

  const handleSign = async (id: number) => {
    setActionLoading(id);
    try {
      await signMPContract(id);
      await loadContracts();
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeny = async (id: number) => {
    setActionLoading(id);
    try {
      await denyMPContract(id);
      await loadContracts();
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = async (id: number) => {
    setActionLoading(id);
    try {
      await cancelMPContract(id);
      await loadContracts();
    } finally {
      setActionLoading(null);
    }
  };

  /* -------------------------------------------------
                    RENDER
  -------------------------------------------------- */

  if (loading)
    return <p className="text-white p-6">Loading...</p>;

  return (
    <main className="grid grid-cols-1 md:grid-cols-2 gap-6 p-8 text-white">

      {/* LEFT SECTION - PENDING CONTRACTS */}
      <section>
        <h1 className="text-2xl font-bold mb-4">Contracts To Sign</h1>

        {pendingContracts.length === 0 && (
          <p className="text-gray-400">No pending contracts requiring your action.</p>
        )}

        {pendingContracts.map((c: UIContract) => (
          <Card key={c.id} className="bg-[#11172d] border border-white/10 mb-4">
            <CardContent className="p-4">

              <h2 className="text-xl text-[#F5C542] font-semibold">
                Contract #{c.id}
              </h2>

              <p className="text-sm mt-2 text-gray-300">
                Owner: <span className="text-blue-300">{c.ownerName}</span>
              </p>

              <p className="text-sm text-gray-400">
                Parties: {c.signers.length}
              </p>

              <p className="text-sm text-gray-400">
                Signed: {c.signedCount} / {c.signers.length}
              </p>

              <div className="flex gap-4 mt-4">
                <Button
                  disabled={actionLoading === c.id}
                  onClick={() => handleSign(c.id)}
                  className="w-full"
                >
                  {actionLoading === c.id ? "Processing..." : "Sign"}
                </Button>

                <Button
                  disabled={actionLoading === c.id}
                  onClick={() => handleDeny(c.id)}
                  className="w-full bg-red-600 hover:bg-red-700"
                >
                  {actionLoading === c.id ? "Processing..." : "Deny"}
                </Button>
              </div>

              <Button
                className="w-full mt-3 bg-blue-600 hover:bg-blue-700"
                onClick={() => router.push(`/contract-info/${c.id}`)}
              >
                View Details
              </Button>
            </CardContent>
          </Card>
        ))}
      </section>

      {/* RIGHT SECTION - ALL CONTRACTS */}
      <section>
        <h1 className="text-2xl font-bold mb-4">My Contracts Overview</h1>

        {allContracts.length === 0 && (
          <p className="text-gray-400">You are not part of any contracts.</p>
        )}

        {allContracts.map((c: UIContract) => (
          <Card
            key={c.id}
            className="bg-[#11172d] border border-white/10 mb-4 cursor-pointer hover:bg-[#162040]"
            onClick={() => router.push(`/contract-info/${c.id}`)}
          >
            <CardContent className="p-4">
              <h2 className="text-xl text-[#F5C542] font-semibold">
                Contract #{c.id}
              </h2>

              <p className="text-sm text-gray-300 mt-1">
                Owner: <span className="text-blue-300">{c.ownerName}</span>
              </p>

              <p className="text-sm text-gray-400">
                Parties: {c.signers.length}
              </p>

              <p className="text-sm text-gray-400">
                Signed: {c.signedCount} / {c.signers.length}
              </p>

              <p className="text-sm text-gray-400 mt-1">
                Status:{" "}
                {c.status === 0
                  ? "Pending"
                  : c.status === 1
                  ? "Completed"
                  : "Canceled"}
              </p>

              {c.creator?.toLowerCase() === wallet.toLowerCase() &&
                c.status === 0 && (
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCancel(c.id);
                    }}
                    disabled={actionLoading === c.id}
                    className="w-full mt-3 bg-red-700 hover:bg-red-800"
                  >
                    Cancel Contract
                  </Button>
                )}
            </CardContent>
          </Card>
        ))}
      </section>

    </main>
  );
}
