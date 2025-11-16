"use client";

import { useEffect, useState } from "react";
import {
  createMPContract,
  getContactsForUserByWallet,
  getUserByAddress,
} from "@/utils/contract";
import { getSigner } from "@/utils/web3";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";

import IPFSUpload from "./components/IPFSUpload";

export default function ProposeContractPage() {
  const [currentUser, setCurrentUser] = useState<string>("");
  const [currentUserInfo, setCurrentUserInfo] = useState<any>(null);

  const [contacts, setContacts] = useState<any[]>([]);
  const [signers, setSigners] = useState<any[]>([]);

  const [cid, setCid] = useState<string>("");
  const [creating, setCreating] = useState(false);

  /* Load User + Contacts */
  useEffect(() => {
    async function init() {
      try {
        const signer = await getSigner();
        const wallet = await signer.getAddress();
        setCurrentUser(wallet);

        const userData = await getUserByAddress(wallet);
        if (userData) {
          setCurrentUserInfo(userData);
          setSigners([userData]);
        }

        const c = await getContactsForUserByWallet(wallet);

        const enriched: any[] = [];
        for (const ct of c) {
          const info = await getUserByAddress(ct.wallet);
          if (info) enriched.push(info);
        }
        setContacts(enriched);
      } catch (err) {
        console.error(err);
      }
    }
    init();
  }, []);

  /* add/remove signers */
  function addSigner(contact: any) {
    if (signers.find((s) => s.wallet === contact.wallet)) return;
    setSigners([...signers, contact]);
  }

  function removeSigner(wallet: string) {
    if (wallet === currentUser) return;
    setSigners(signers.filter((s) => s.wallet !== wallet));
  }

  /* Create contract */
  async function createContract() {
    if (!cid) return alert("Upload a file first to generate CID.");

    try {
      setCreating(true);

      const signerAddresses = signers.map((s) => s.wallet);
      const tx = await createMPContract(cid, signerAddresses);

      console.log("TX:", tx);
      alert("Contract created successfully!");
    } catch (err) {
      console.error(err);
      alert("Error creating contract");
    }

    setCreating(false);
  }

  return (
    <main className="p-8 grid grid-cols-1 lg:grid-cols-2 gap-6 text-white bg-[#0B0F19] min-h-screen">

      {/* LEFT SIDE — CREATE CONTRACT */}
      <Card className="bg-[#131A2E] border border-[#2A3558] shadow-xl">
        <CardContent className="p-6">

          <h2 className="text-2xl font-bold mb-4 text-[#F5C542]">
            Create Multi-Party Contract
          </h2>

          {/* CID field */}
          <div className="mb-4">
            <label className="text-sm text-gray-300">Contract CID</label>
            <Input
              value={cid}
              readOnly
              className="bg-[#0F1527] text-white mt-1 border border-[#2A3558]"
            />
          </div>

          {/* Signers */}
          <div className="mb-4">
            <label className="text-sm text-gray-300">Signers</label>

            <div className="space-y-3 mt-3">
              {signers.map((s) => (
                <div
                  key={s.wallet}
                  className="p-3 bg-[#0F1527] rounded-lg flex justify-between items-center border border-[#2A3558]"
                >
                  <div>
                    <p className="font-semibold text-[#F5C542] text-lg">
                      {s.username}
                    </p>
                    <p className="text-xs text-gray-300">{s.wallet}</p>
                  </div>

                  {s.wallet !== currentUser && (
                    <Button
                      variant="destructive"
                      className="bg-red-600 hover:bg-red-700"
                      onClick={() => removeSigner(s.wallet)}
                    >
                      Remove
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Create Contract Button */}
          <Button
            className="w-full mt-4 bg-[#F5C542] text-black font-semibold hover:bg-[#e0b637]"
            onClick={createContract}
            disabled={creating}
          >
            {creating ? "Creating..." : "Create Contract"}
          </Button>
        </CardContent>
      </Card>

      {/* RIGHT SIDE */}
      <div className="flex flex-col gap-6">

        {/* IPFS Upload */}
        <IPFSUpload onCID={(cid: string) => setCid(cid)} />

        {/* Contacts */}
        <Card className="bg-[#131A2E] border border-[#2A3558] shadow-xl h-[50%] overflow-y-auto">
          <CardContent className="p-6">

            <h2 className="text-xl font-bold mb-3 text-[#F5C542]">
              My Contacts
            </h2>

            {contacts.length === 0 ? (
              <p className="text-gray-400 text-sm">No contacts found.</p>
            ) : (
              <div className="space-y-3">
                {contacts.map((c) => (
                  <motion.div
                    key={c.wallet}
                    className="p-3 bg-[#0F1527] rounded-lg border border-[#2A3558] cursor-pointer hover:bg-[#1B2240] transition"
                    whileHover={{ scale: 1.02 }}
                    onClick={() => addSigner(c)}
                  >
                    <p className="font-semibold text-[#F5C542] text-lg">
                      {c.username}
                    </p>
                    <p className="text-xs text-gray-300">{c.wallet}</p>
                  </motion.div>
                ))}
              </div>
            )}

          </CardContent>
        </Card>
      </div>

    </main>
  );
}
