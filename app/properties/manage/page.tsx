"use client";

import React, { useEffect, useState } from "react";
import { ChevronLeft } from "lucide-react";

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

  // Transfer Panel State
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

        // Fetch properties for owner
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

        // Fetch user profile
        const profile = await getUserByAddress(addr);
        setOwnerDetails(profile);

        // Fetch contacts
        const contacts = await getContactsForWallet(addr);
        setOwnerContacts(contacts);
      } catch (err) {
        console.error("Failed:", err);
        setProperties([]);
        setOwnerDetails(null);
        setOwnerContacts([]);
      }

      setLoading(false);
    })();
  }, []);

  return (
    <main className="bg-[#0b0f19] min-h-screen p-8 text-white">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* HEADER */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-2 text-sm text-gray-300"
          >
            <ChevronLeft size={18} /> Back
          </button>

          <h1 className="text-3xl font-extrabold text-[#F5C542]">
            My Properties
          </h1>

          <Button onClick={() => window.location.reload()}>Refresh</Button>
        </div>

        {/* USER PROFILE */}
        {ownerDetails && (
          <Card className="border border-[#1b2240] p-1 rounded-xl">
            <CardContent className="p-4 bg-[#071022] rounded-lg">
              <div className="text-lg font-semibold mb-2">Your Profile</div>

              <div className="text-sm text-gray-300 space-y-1">
                <div>
                  Username:{" "}
                  <span className="text-[#9ad1ff]">
                    {ownerDetails.username}
                  </span>
                </div>

                <div>
                  PAN Hash:{" "}
                  <span className="text-[#9ad1ff]">{ownerDetails.pan}</span>
                </div>

                <div>
                  Wallet:{" "}
                  <span className="text-[#9ad1ff]">
                    {ownerDetails.wallet}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* CONTACTS */}
        <Card className="border border-[#1b2240] p-1 rounded-xl">
          <CardContent className="p-4 bg-[#071022] rounded-lg">
            <div className="text-lg font-semibold mb-2">Your Contacts</div>

            {ownerContacts.length === 0 ? (
              <div className="text-gray-500 text-sm">
                You have no saved contacts.
              </div>
            ) : (
              <div className="space-y-3">
                {ownerContacts.map((c, idx) => (
                  <div
                    key={idx}
                    className="p-2 rounded border border-[#12203a] text-sm"
                  >
                    <div>
                      Username:{" "}
                      <span className="text-[#7fb7ff]">{c.username}</span>
                    </div>
                    <div>PAN Hash: {c.pan}</div>
                    <div className="text-xs text-gray-500">
                      Wallet: {c.wallet}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* PROPERTIES LIST */}
        <Card className="border border-[#1b2240] p-1 rounded-xl">
          <CardContent className="p-4 bg-[#071022] rounded-lg">
            {loading ? (
              <div className="text-gray-400">Loading properties…</div>
            ) : properties.length === 0 ? (
              <div className="text-gray-400 py-6">You have no properties.</div>
            ) : (
              <div className="flex flex-col gap-4">
                {properties.map((p) => (
                  <div
                    key={p.id}
                    className="relative p-4 rounded-lg bg-[#061021] border border-[#12203a] grid grid-cols-2 gap-4"
                  >
                    {/* LEFT SIDE — PROPERTY DETAILS */}
                    <div>
                      <div className="text-xs text-gray-400">Property</div>
                      <div className="text-lg font-semibold">#{p.id}</div>

                      <div className="text-xs text-[#7fb7ff] break-all mt-1">
                        {p.cid}
                      </div>

                      <div className="mt-3 text-sm text-gray-300 space-y-1">
                        <div>
                          Owner Wallet:{" "}
                          <span className="text-[#9ad1ff]">{p.owner}</span>
                        </div>

                        <hr className="border-[#1b2a40] my-2" />

                        <div>
                          Registered At:{" "}
                          {new Date(
                            p.registeredAt * 1000
                          ).toLocaleString()}
                        </div>

                        <div>
                          Last Transfer:{" "}
                          {p.dateOfLastTransfer === 0
                            ? "Never transferred"
                            : new Date(
                              p.dateOfLastTransfer * 1000
                            ).toLocaleString()}
                        </div>

                        <div>
                          Ownership Updated:{" "}
                          {new Date(
                            p.dateOfOwnershipChange * 1000
                          ).toLocaleString()}
                        </div>

                        <div>Exists: {p.exists ? "Yes" : "No"}</div>
                      </div>

                      {/* ACTION BUTTONS */}
                      <div className="mt-4 flex gap-3">
                        <Button
                          variant="secondary"
                          onClick={() => {
                            window.location.href = `/properties/${p.id}`;
                          }}
                        >
                          View
                        </Button>


                        <Button
                          onClick={() =>
                            setTransferState({
                              propertyId: p.id,
                              open: true,
                              selectedWallet: "",
                            })
                          }
                        >
                          Transfer
                        </Button>
                      </div>
                    </div>

                    {/* RIGHT SIDE — TRANSFER PANEL */}
                    {transferState.open &&
                      transferState.propertyId === p.id && (
                        <div className="p-4 bg-[#0c1a33] border border-[#123] rounded-lg">
                          <div className="text-lg font-bold mb-3 text-[#F5C542]">
                            Transfer Property #{p.id}
                          </div>

                          {/* CONTACT SELECT */}
                          <label className="text-sm text-gray-300">
                            Select New Owner
                          </label>
                          <select
                            className="w-full mt-2 p-2 rounded bg-[#0a1629] border border-[#1d3355] text-sm"
                            value={transferState.selectedWallet}
                            onChange={(e) =>
                              setTransferState((prev) => ({
                                ...prev,
                                selectedWallet: e.target.value,
                              }))
                            }
                          >
                            <option value="">-- Choose Contact --</option>
                            {ownerContacts.map((c, idx) => (
                              <option key={idx} value={c.wallet}>
                                {c.username} — {c.wallet}
                              </option>
                            ))}
                          </select>

                          {/* CONFIRM BUTTON */}
                          <Button
                            className="mt-4 w-full"
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
                                alert("Transfer failed: " + err.message);
                              }
                            }}
                          >
                            Confirm Transfer
                          </Button>

                          {/* CANCEL BUTTON */}
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
