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

import {
  FilePlus,
  UserPlus,
  Users,
  FileText,
  Info,
  Trash2,
} from "lucide-react";

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
          setSigners([userData]); // user is default signer
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

      {/* LEFT SIDE COLUMN */}
      <div className="flex flex-col gap-6">

        {/* CREATE CONTRACT SECTION */}
        <Card className="bg-[#131A2E] border border-[#2A3558] shadow-xl rounded-2xl">
          <CardContent className="p-6 space-y-6">

            {/* Header */}
            <div className="flex items-center gap-3">
              <FilePlus className="w-7 h-7 text-[#F5C542]" />
              <h2 className="text-2xl font-bold text-[#F5C542]">
                Create Multi-Party Contract
              </h2>
            </div>

            {/* CID field */}
            <div>
              <label className="text-sm text-gray-300 flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#F5C542]" />
                Contract CID
              </label>

              <Input
                value={cid}
                readOnly
                className="bg-[#0F1527] text-white mt-2 border border-[#2A3558]"
              />
            </div>

            {/* Signers */}
            <div>
              <label className="text-sm text-gray-300 flex items-center gap-2">
                <Users className="w-4 h-4 text-[#F5C542]" />
                Signers
              </label>

              <div className="space-y-3 mt-3">
                {signers.map((s) => (
                  <div
                    key={s.wallet}
                    className="p-3 bg-[#0F1527] rounded-xl border border-[#2A3558] flex justify-between items-center"
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
                        className="bg-red-600 hover:bg-red-700 flex items-center gap-1"
                        onClick={() => removeSigner(s.wallet)}
                      >
                        <Trash2 className="w-4 h-4" /> Remove
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Create Contract Button */}
            <Button
              className="w-full bg-[#F5C542] text-gray-900 text-lg font-semibold hover:bg-[#e5c34d]"
              onClick={createContract}
              disabled={creating}
            >
              {creating ? "Creating..." : "Create Contract"}
            </Button>
          </CardContent>
        </Card>

        {/* LEFT BOTTOM — NOTE / INFO SECTION */}
        <Card className="bg-[#131A2E] border border-[#2A3558] shadow-xl rounded-2xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <Info className="w-6 h-6 text-[#F5C542]" />
              <h3 className="text-lg font-semibold text-[#F5C542]">
                How to Create a Contract
              </h3>
            </div>

            <ul className="text-gray-300 text-sm space-y-2 leading-relaxed">
              <li>
                • First, <b className="text-[#F5C542]">upload your contract file</b> to get a unique <b className="text-[#F5C542]">CID</b>.
              </li>
              <li>
                • Tap on people in the <b className="text-[#F5C542]">Contacts list</b> to add them as signers.
              </li>
              <li>
                • You can remove signers anytime before creation.
              </li>
              <li>
                • Finally tap <b className="text-[#F5C542]">Create Contract</b> to publish it on-chain.
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* RIGHT SIDE COLUMN */}
      <div className="flex flex-col gap-6">

        {/* IPFS Upload */}
        <IPFSUpload onCID={(cid: string) => setCid(cid)} />

        {/* Contacts List */}
        <Card className="bg-[#131A2E] border border-[#2A3558] shadow-xl rounded-2xl h-[50%] overflow-y-auto">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <UserPlus className="w-6 h-6 text-[#F5C542]" />
              <h2 className="text-xl font-bold text-[#F5C542]">My Contacts</h2>
            </div>

            {contacts.length === 0 ? (
              <p className="text-gray-400 text-sm">No contacts found.</p>
            ) : (
              <div className="space-y-3">
                {contacts.map((c) => (
                  <motion.div
                    key={c.wallet}
                    className="p-3 bg-[#0F1527] rounded-xl border border-[#2A3558] cursor-pointer hover:bg-[#1B2240] transition"
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
