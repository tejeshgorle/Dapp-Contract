"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { getUserByAddress, registerUser } from "@/utils/contract";
import { getAccount } from "@/utils/web3";

export default function RegisterPage() {
  const router = useRouter();

  const [account, setAccount] = useState<string | null>(null);
  const [username, setUsername] = useState("");
  const [pan, setPan] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // -----------------------------------------------------------
  // INITIALIZE WALLET + CHECK IF USER ALREADY REGISTERED
  // -----------------------------------------------------------
  useEffect(() => {
    async function init() {
      try {
        const acc = await getAccount(); // ensures wallet connection
        if (!acc) {
          setError("Wallet not connected");
          setChecking(false);
          return;
        }

        setAccount(acc);

        // use the getUserByAddress() wrapper
        const user = await getUserByAddress(acc);

        if (user && user.exists) {
          router.replace("/dashboard");
          return;
        }
      } catch (err: any) {
        setError(err?.message ?? String(err));
      } finally {
        setChecking(false);
      }
    }

    init();
  }, [router]);

  // -----------------------------------------------------------
  // REGISTER BUTTON HANDLER
  // -----------------------------------------------------------
  async function onRegister() {
    setError(null);

    if (!username.trim()) return setError("Username is required");
    if (!pan.trim()) return setError("PAN is required (stored on-chain)");

    try {
      setLoading(true);

      const acc = account ?? (await getAccount());
      if (!acc) throw new Error("Wallet not connected");

      // call your wrapper: registerUser(username, pan)
      await registerUser(username.trim(), pan.trim());

      router.replace("/dashboard"); // success — redirect
    } catch (err: any) {
      setError(err?.message ?? String(err));
    } finally {
      setLoading(false);
    }
  }

  // -----------------------------------------------------------
  // LOADING STATE (checking wallet + registration)
  // -----------------------------------------------------------
  if (checking) {
    return (
      <main className="container">
        <div className="card">
          <div className="small">Checking wallet & registration status…</div>
        </div>
      </main>
    );
  }

  // -----------------------------------------------------------
  // PAGE UI
  // -----------------------------------------------------------
  return (
    <main className="container">
      <div className="card" style={{ maxWidth: 720, margin: "28px auto" }}>
        <h2>Register</h2>
        <p className="small">
          Connect your wallet and create an on-chain user.  
          <strong>PAN will be stored on-chain</strong> — consider privacy implications.
        </p>

        <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
          <div className="small">Connected: {account ?? "Not connected"}</div>

          <input
            className="input"
            placeholder="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />

          <input
            className="input"
            placeholder="PAN (full; on-chain)"
            value={pan}
            onChange={(e) => setPan(e.target.value)}
          />

          <div style={{ display: "flex", gap: 8 }}>
            <button className="button" onClick={onRegister} disabled={loading}>
              {loading ? "Registering…" : "Register"}
            </button>

            <button
              className="button"
              onClick={() => router.replace("/login")}
              style={{
                background: "transparent",
                color: "white",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              Back to Login
            </button>
          </div>

          {error && <div style={{ color: "salmon" }}>{error}</div>}
        </div>
      </div>
    </main>
  );
}
