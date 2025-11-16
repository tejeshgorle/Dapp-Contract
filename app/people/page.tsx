"use client";

import React, { useEffect, useState } from "react";
import { getAllUsers, addContactByAddress, getContactsForWallet } from "@/utils/contract";
import { getSigner } from "@/utils/web3";
import { ethers } from "ethers";

export default function PeoplePage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [addrToAdd, setAddrToAdd] = useState("");
  const [me, setMe] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [contacts, setContacts] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const arr = await getAllUsers();
        setUsers(arr);
        try {
          const s = await getSigner();
          const a = await s.getAddress();
          setMe(a);
          const myContacts = await getContactsForWallet(a);
          setContacts(myContacts || []);
        } catch (err) {
          // not connected or getSigner not present
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function onAddContact(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    if (!addrToAdd) return setMsg("address required");
    if (!ethers.isAddress(addrToAdd)) return setMsg("invalid address");

    try {
      setLoading(true);
      const receipt = await addContactByAddress(addrToAdd);
      setMsg(`Contact added — tx ${receipt.transactionHash}`);
      setAddrToAdd("");
      // refresh contacts if we have me
      try {
        if (me) {
          const updated = await getContactsForWallet(me);
          setContacts(updated);
        }
      } catch {}
    } catch (err: any) {
      console.error(err);
      setMsg(err?.message || "failed to add");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ padding: 24 }}>
      <h1>People</h1>

      <section style={{ marginBottom: 18 }}>
        <h3>All registered users</h3>
        {loading && users.length === 0 ? (
          <div>Loading users…</div>
        ) : (
          <div style={{ display: "grid", gap: 8 }}>
            {users.length === 0 && <div>No users found.</div>}
            {users.map((u, i) => {
              const username = u.username ?? u[1] ?? u[0];
              const wallet = u.wallet ?? u[0] ?? "—";
              let pretty = username;
              try {
                pretty = ethers.decodeBytes32String(username);
              } catch {}
              return (
                <div key={i} style={{ padding: 10, border: "1px solid #eee", borderRadius: 8 }}>
                  <div><strong>{pretty}</strong></div>
                  <div style={{ fontSize: 13, color: "#666" }}>{String(wallet)}</div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section style={{ marginBottom: 18 }}>
        <h3>Add a contact</h3>
        <form onSubmit={onAddContact} style={{ display: "flex", gap: 8, maxWidth: 640 }}>
          <input
            value={addrToAdd}
            onChange={(e) => setAddrToAdd(e.target.value)}
            placeholder="0xabc..."
            style={{ padding: 8, flex: 1 }}
          />
          <button type="submit" disabled={loading}>Add</button>
        </form>
        {msg && <div style={{ marginTop: 8, color: "#a33" }}>{msg}</div>}
      </section>

      <section>
        <h3>Your contacts</h3>
        {contacts.length === 0 ? (
          <div>No contacts yet.</div>
        ) : (
          <div style={{ display: "grid", gap: 8 }}>
            {contacts.map((c: any, idx: number) => {
              // c might be full User struct or address string depending on contract ABI shape
              const addr = typeof c === "string" ? c : (c.wallet ?? c[0] ?? String(c));
              const usernameRaw = (c.username ?? c[1] ?? "") as string;
              let uname = usernameRaw;
              try { uname = ethers.decodeBytes32String(usernameRaw); } catch {}
              return (
                <div key={idx} style={{ padding: 8, border: "1px solid #eee", borderRadius: 8 }}>
                  <div><strong>{uname}</strong></div>
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
