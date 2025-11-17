"use client";

import React, { useEffect, useState } from "react";
import {
  getAllUsers,
  addContactByAddress,
  getContactsForWallet,
} from "@/utils/contract";
import { getSigner } from "@/utils/web3";
import { ethers } from "ethers";

export default function PeoplePage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [addrToAdd, setAddrToAdd] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  const [me, setMe] = useState<string | null>(null);
  const [contacts, setContacts] = useState<any[]>([]);

  /* Load all users + my contacts */
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

  /* Add contact using button OR input field */
  async function addContact(address: string) {
    setMsg(null);
    if (!ethers.isAddress(address)) return setMsg("Invalid address");

    try {
      setLoading(true);
      const receipt = await addContactByAddress(address);
      setMsg(`Contact added — tx ${receipt.transactionHash}`);

      if (me) {
        const updated = await getContactsForWallet(me);
        setContacts(updated);
      }
    } catch (err: any) {
      console.error(err);
      setMsg(err?.message || "Failed to add");
    } finally {
      setLoading(false);
    }
  }

  /* Submit form for manual entry */
  async function onAddContact(e: React.FormEvent) {
    e.preventDefault();
    if (!addrToAdd) return;
    await addContact(addrToAdd);
    setAddrToAdd("");
  }

  return (
    <main style={{ padding: 24, display: "flex", gap: 20 }}>

      {/* LEFT SIDE — ALL USERS */}
      <section
        style={{
          flex: 1,
          padding: 16,
          border: "1px solid #ddd",
          borderRadius: 10,
          height: "85vh",
          overflowY: "auto",
        }}
      >
        <h2>All Registered Users</h2>

        {loading && users.length === 0 ? (
          <div>Loading users…</div>
        ) : (
          <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
            {users.length === 0 && <div>No users found.</div>}
            {users.map((u, i) => {
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
                  key={i}
                  style={{
                    padding: 12,
                    border: "1px solid #eee",
                    borderRadius: 8,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <strong>{prettyName}</strong>
                    <div style={{ fontSize: 13, color: "#666" }}>{wallet}</div>
                  </div>

                  {me?.toLowerCase() !== wallet?.toLowerCase() && (
                    <button
                      onClick={() => addContact(wallet)}
                      disabled={loading || alreadyAdded}
                    >
                      {alreadyAdded ? "Added" : "Add"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Optional manual address entry */}
        <div style={{ marginTop: 20 }}>
          <h4>Add Contact by Address</h4>
          <form
            onSubmit={onAddContact}
            style={{ display: "flex", gap: 8, marginTop: 8 }}
          >
            <input
              value={addrToAdd}
              onChange={(e) => setAddrToAdd(e.target.value)}
              placeholder="0xabc..."
              style={{ padding: 8, flex: 1 }}
            />
            <button type="submit" disabled={loading}>
              Add
            </button>
          </form>
        </div>

        {msg && (
          <div style={{ marginTop: 10, color: "#a33", fontSize: 14 }}>
            {msg}
          </div>
        )}
      </section>

      {/* RIGHT SIDE — MY CONTACTS */}
      <section
        style={{
          width: "40%",
          padding: 16,
          border: "1px solid #ddd",
          borderRadius: 10,
          height: "85vh",
          overflowY: "auto",
        }}
      >
        <h2>My Contacts</h2>

        {contacts.length === 0 ? (
          <div style={{ marginTop: 10 }}>No contacts yet.</div>
        ) : (
          <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
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
                  style={{
                    padding: 10,
                    border: "1px solid #eee",
                    borderRadius: 8,
                  }}
                >
                  <strong>{uname}</strong>
                  <div style={{ fontSize: 13, color: "#666" }}>{addr}</div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
