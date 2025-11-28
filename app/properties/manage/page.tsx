"use client";

import React, { useEffect, useState } from "react";
import { ChevronLeft, Info, Calendar, Database, KeyRound } from "lucide-react";

import { getSigner } from "@/utils/web3";
import {
  getUserProperties,
  getUserByAddress,
  getContactsForWallet,
  directTransferOwnership,
} from "@/utils/contract";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function ManagePropertiesPage() {
  const [properties, setProperties] = useState<any[]>([]);
  const [ownerDetails, setOwnerDetails] = useState<any | null>(null);
  const [ownerContacts, setOwnerContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [transferState, setTransferState] = useState({
    propertyId: null as number | null,
    open: false,
    selectedWallet: "",
  });

  useEffect(() => {
    (async () => {
      setLoading(true);

      try {
        const signer = await getSigner();
        const addr = await signer.getAddress();

        const raw = await getUserProperties(addr);

        const parsed = raw.map((p: any) => ({
          id: Number(p.id),
          cid: p.cid,
          owner: p.owner,
          registeredAt: Number(p.registeredAt),
          dateOfLastTransfer: Number(p.dateOfLastTransfer),
          dateOfOwnershipChange: Number(p.dateOfOwnershipChange),
          exists: p.exists,
        }));

        setProperties(parsed);

        const profile = await getUserByAddress(addr);
        setOwnerDetails(profile);

        const contacts = await getContactsForWallet(addr);
        setOwnerContacts(contacts);
      } catch (err) {
        setProperties([]);
        setOwnerDetails(null);
        setOwnerContacts([]);
      }

      setLoading(false);
    })();
  }, []);

  function formatDate(timestamp: number) {
    if (!timestamp || timestamp === 0) return "—";
    return new Date(timestamp * 1000).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  }

  return (
    <main className="bg-[#05070d] min-h-screen p-8 text-white">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* HEADER */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-2 text-sm text-gray-300 hover:text-white transition"
          >
            <ChevronLeft size={18} /> Back
          </button>

          <h1 className="text-3xl font-extrabold text-[#F5C542] tracking-wide">
            My Properties
          </h1>

          <Button
            className="font-semibold"
            onClick={() => window.location.reload()}
          >
            Refresh
          </Button>
        </div>

        {/* USER PROFILE */}
        {ownerDetails && (
          <Card className="border border-white/20 bg-[#0d1323]/80 backdrop-blur-xl rounded-xl shadow-xl">
            <CardContent className="p-6 space-y-3">
              <div className="text-xl font-semibold text-[#F5C542]">
                Your Profile
              </div>

              <div className="text-sm space-y-1">
                <p>
                  <span className="text-gray-400">Username:</span>{" "}
                  <span className="text-[#9ad1ff]">
                    {ownerDetails.username}
                  </span>
                </p>

                <p>
                  <span className="text-gray-400">User PAN:</span>{" "}
                  <span className="text-[#9ad1ff]">{ownerDetails.pan}</span>
                </p>

                <p>
                  <span className="text-gray-400">Wallet:</span>{" "}
                  <span className="text-[#9ad1ff]">
                    {ownerDetails.wallet}
                  </span>
                </p>
              </div>

              
            </CardContent>
          </Card>
        )}
        {/* NOTE BOX */}
              <div className="mt-4 p-4 rounded-lg bg-[#101b33]/70 border border-white/20 flex items-start gap-3">
                <Info className="w-5 h-5 text-[#F5C542] flex-shrink-0" />
                <p className="text-gray-300 text-sm leading-relaxed">
                  Tap <span className="text-[#F5C542] font-semibold">
                    View
                  </span>{" "}
                  to open full property details.  
                  Use{" "}
                  <span className="text-[#F5C542] font-semibold">
                    Transfer Ownership
                  </span>{" "}
                  to transfer ownership only to people saved in your contacts.
                </p>
              </div>

        {/* PROPERTIES */}
        <Card className="border border-white/20 bg-[#0d1323]/80 backdrop-blur-xl rounded-xl shadow-xl">
          <CardContent className="p-5">
            {loading ? (
              <div className="text-gray-400">Loading properties…</div>
            ) : properties.length === 0 ? (
              <div className="py-6 text-center text-gray-400">
                You have no properties.
              </div>
            ) : (
              <div className="flex flex-col gap-5">
                {properties.map((p) => (
                  <div
                    key={p.id}
                    className="
                      p-5 rounded-xl 
                      bg-[#0a0f1c]/90 
                      border border-white/20 
                      shadow-lg 
                      hover:shadow-[#F5C542]/30 
                      hover:border-[#F5C542]/40 
                      transition
                    "
                  >
                    {/* TOP SECTION */}
                    <div className="flex justify-between">
                      <div>
                        <p className="text-sm text-gray-400">
                          Property Number:
                        </p>
                        <p className="text-xl font-bold text-white">
                          #{p.id}
                        </p>

                        <p className="text-xs text-[#7fb7ff] break-all mt-2">
                          CID: {p.cid}
                        </p>
                      </div>

                      <div className="flex gap-3">
                        <Button
                          variant="secondary"
                          onClick={() =>
                            (window.location.href = `/properties/${p.id}`)
                          }
                        >
                          View
                        </Button>
                      </div>
                    </div>

                    {/* DETAILS */}
                    <div className="mt-5 space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-gray-300">
                        <KeyRound className="w-4 h-4 text-[#F5C542]" />
                        <span>
                          <span className="text-gray-400">
                            Owner Wallet:
                          </span>{" "}
                          <span className="text-[#9ad1ff]">
                            {p.owner}
                          </span>
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-gray-300">
                        <Calendar className="w-4 h-4 text-[#F5C542]" />
                        <span>
                          <span className="text-gray-400">
                            Registered At:
                          </span>{" "}
                          {formatDate(p.registeredAt)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-gray-300">
                        <Calendar className="w-4 h-4 text-[#F5C542]" />
                        <span>
                          <span className="text-gray-400">
                            Last Transfer:
                          </span>{" "}
                          {p.dateOfLastTransfer === 0
                            ? "Never transferred"
                            : formatDate(p.dateOfLastTransfer)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-gray-300">
                        <Database className="w-4 h-4 text-[#F5C542]" />
                        <span>
                          <span className="text-gray-400">
                            Ownership Updated:
                          </span>{" "}
                          {formatDate(p.dateOfOwnershipChange)}
                        </span>
                      </div>
                    </div>

                    {/* ACTION BUTTON */}
                    <div className="mt-5">
                      <Button
                        onClick={() =>
                          setTransferState({
                            propertyId: p.id,
                            open: true,
                            selectedWallet: "",
                          })
                        }
                        className="bg-[#F5C542] text-black hover:bg-[#e5b632] w-full"
                      >
                        Transfer Ownership
                      </Button>
                    </div>

                    {/* TRANSFER PANEL */}
                    {transferState.open &&
                      transferState.propertyId === p.id && (
                        <div className="mt-5 p-5 rounded-xl bg-[#0C1A33] border border-white/20 shadow-xl">
                          <div className="text-lg font-bold text-[#F5C542] mb-3">
                            Transfer Property #{p.id}
                          </div>

                          <label className="text-sm text-gray-300">
                            Select New Owner
                          </label>

                          <select
                            className="
                              w-full mt-2 p-2 rounded 
                              bg-[#0b1527] 
                              border border-white/20 
                              text-sm 
                              text-white 
                              focus:border-[#F5C542] 
                              focus:ring-2 
                              focus:ring-[#F5C542]/40 
                              transition
                            "
                            value={transferState.selectedWallet}
                            onChange={(e) =>
                              setTransferState((prev) => ({
                                ...prev,
                                selectedWallet: e.target.value,
                              }))
                            }
                          >
                            <option className="text-black bg-white" value="">
                              -- Choose Contact --
                            </option>

                            {ownerContacts.map((c, idx) => (
                              <option
                                key={idx}
                                value={c.wallet}
                                className="text-black bg-white"
                              >
                                {c.username} — {c.wallet}
                              </option>
                            ))}
                          </select>

                          <Button
                            className="mt-4 w-full bg-green-600 hover:bg-green-700"
                            disabled={!transferState.selectedWallet}
                            onClick={async () => {
                              if (
                                !confirm(
                                  `Confirm transfer of Property #${p.id} to ${transferState.selectedWallet}?`
                                )
                              )
                                return;

                              try {
                                await directTransferOwnership(
                                  p.id,
                                  transferState.selectedWallet
                                );
                                alert("Transfer Completed!");
                                window.location.reload();
                              } catch (err: any) {
                                alert(
                                  "Transfer failed: " + err.message
                                );
                              }
                            }}
                          >
                            Confirm Transfer
                          </Button>

                          <Button
                            variant="destructive"
                            className="mt-2 w-full"
                            onClick={() =>
                              setTransferState({
                                propertyId: null,
                                open: false,
                                selectedWallet: "",
                              })
                            }
                          >
                            Cancel
                          </Button>
                        </div>
                      )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
