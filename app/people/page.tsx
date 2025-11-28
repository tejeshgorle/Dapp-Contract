"use client";

import React, { useEffect, useState } from "react";
import {
  getAllUsers,
  addContactByAddress,
  getContactsForWallet,
} from "@/utils/contract";
import { getSigner } from "@/utils/web3";
import { ethers } from "ethers";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import {
  Users,
  UserPlus,
  UserCheck,
  Search,
  Wallet,
} from "lucide-react";

export default function PeoplePage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [addrToAdd, setAddrToAdd] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  const [me, setMe] = useState<string | null>(null);
  const [contacts, setContacts] = useState<any[]>([]);

  /* LOAD ALL USERS + CONTACTS */
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const allUsers = await getAllUsers();
        setUsers(allUsers);

        const signer = await getSigner();
        const wallet = await signer.getAddress();
        setMe(wallet);

        const myContacts = await getContactsForWallet(wallet);
        setContacts(myContacts || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /* ADD CONTACT */
  async function addContact(address: string) {
    setMsg(null);
    if (!ethers.isAddress(address)) return setMsg("Invalid wallet address");

    try {
      setLoading(true);
      const receipt = await addContactByAddress(address);
      setMsg(`Contact added — Tx: ${receipt.transactionHash}`);

      if (me) {
        const updated = await getContactsForWallet(me);
        setContacts(updated);
      }
    } catch (err: any) {
      console.error(err);
      setMsg(err?.message || "Failed to add contact.");
    } finally {
      setLoading(false);
    }
  }

  async function onAddContact(e: React.FormEvent) {
    e.preventDefault();
    if (!addrToAdd) return;
    await addContact(addrToAdd);
    setAddrToAdd("");
  }

  return (
    <main className="p-8 min-h-screen bg-[#05070d] text-white">
      <div className="flex gap-6">

        {/* LEFT PANEL — ALL USERS */}
        <Card className="flex-1 bg-[#0c1020] border border-white/20 shadow-xl rounded-2xl p-6 max-h-[85vh] overflow-y-auto">
          <CardContent className="space-y-6">

            <div className="flex items-center gap-3">
              <Users className="w-7 h-7 text-[#F5C542]" />
              <h2 className="text-2xl font-bold text-[#F5C542]">All Registered Users</h2>
            </div>

            {loading && users.length === 0 ? (
              <p className="text-gray-400">Loading users…</p>
            ) : (
              <div className="grid gap-4">
                {users.length === 0 && (
                  <p className="text-gray-400">No users found.</p>
                )}

                {users.map((u, idx) => {
                  const username = u.username ?? u[1] ?? u[0];
                  const wallet = u.wallet ?? u[0] ?? "—";

                  let prettyName = username;
                  try {
                    prettyName = ethers.decodeBytes32String(username);
                  } catch {}

                  const alreadyAdded = contacts.some((c: any) => {
                    const cw = typeof c === "string" ? c : c.wallet ?? c[0];
                    return cw?.toLowerCase() === wallet?.toLowerCase();
                  });

                  return (
                    <div
                      key={idx}
                      className="p-4 bg-[#111729] rounded-xl border border-white/10 shadow hover:border-[#F5C542] transition flex justify-between items-center"
                    >
                      <div>
                        <p className="font-semibold text-lg text-white">{prettyName}</p>

                        <p className="flex items-center gap-2 text-gray-400 text-sm break-all">
                          <Wallet className="w-4 h-4 text-[#F5C542]" />
                          {wallet}
                        </p>
                      </div>

                      {me?.toLowerCase() !== wallet?.toLowerCase() && (
                        <Button
                          onClick={() => addContact(wallet)}
                          disabled={loading || alreadyAdded}
                          className={`${
                            alreadyAdded
                              ? "bg-green-700 hover:bg-green-800"
                              : "bg-[#F5C542] text-gray-900 hover:bg-[#d5a52f]"
                          }`}
                        >
                          {alreadyAdded ? (
                            <span className="flex items-center gap-2">
                              <UserCheck className="w-4 h-4" /> Added
                            </span>
                          ) : (
                            <span className="flex items-center gap-2">
                              <UserPlus className="w-4 h-4" /> Add
                            </span>
                          )}
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* ADD CONTACT MANUALLY */}
            <div className="mt-6 p-4 bg-[#111729] rounded-xl border border-white/10 shadow">
              <h4 className="font-semibold text-lg mb-2 flex items-center gap-2">
                <Search className="w-5 h-5 text-[#F5C542]" /> Add Contact by Address
              </h4>

              <form onSubmit={onAddContact} className="flex gap-3 mt-3">
                <input
                  value={addrToAdd}
                  onChange={(e) => setAddrToAdd(e.target.value)}
                  className="flex-1 bg-[#0d1323] border border-white/20 rounded-xl px-4 py-2 text-gray-200 focus:border-[#F5C542]"
                  placeholder="0xabc..."
                />
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-[#F5C542] text-gray-900 hover:bg-[#d5a52f]"
                >
                  Add
                </Button>
              </form>

              {msg && <p className="text-red-400 text-sm mt-3">{msg}</p>}
            </div>
          </CardContent>
        </Card>

        {/* RIGHT PANEL — CONTACTS */}
        <Card className="w-[35%] bg-[#0c1020] border border-white/20 shadow-xl rounded-2xl p-6 max-h-[85vh] overflow-y-auto">
          <CardContent className="space-y-6">

            <div className="flex items-center gap-3">
              <UserCheck className="w-7 h-7 text-[#F5C542]" />
              <h2 className="text-2xl font-bold text-[#F5C542]">My Contacts</h2>
            </div>

            {contacts.length === 0 ? (
              <p className="text-gray-400">You have no contacts added yet.</p>
            ) : (
              <div className="grid gap-4">
                {contacts.map((c, idx) => {
                  const addr =
                    typeof c === "string"
                      ? c
                      : c.wallet ?? c[0] ?? String(c);

                  const rawName = c.username ?? c[1] ?? "";
                  let uname = rawName;
                  try {
                    uname = ethers.decodeBytes32String(rawName);
                  } catch {}

                  return (
                    <div
                      key={idx}
                      className="p-4 bg-[#111729] rounded-xl border border-white/10 shadow"
                    >
                      <p className="font-semibold text-lg text-white">{uname}</p>

                      <p className="flex items-center gap-2 text-gray-400 text-sm break-all mt-1">
                        <Wallet className="w-4 h-4 text-[#F5C542]" />
                        {addr}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
