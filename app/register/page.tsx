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
        const acc = await getAccount();
        if (!acc) {
          setError("Wallet not connected");
          setChecking(false);
          return;
        }

        setAccount(acc);

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

      await registerUser(username.trim(), pan.trim());
      router.replace("/dashboard");
    } catch (err: any) {
      setError(err?.message ?? String(err));
    } finally {
      setLoading(false);
    }
  }

  // -----------------------------------------------------------
  // WHILE CHECKING WALLET
  // -----------------------------------------------------------
  if (checking) {
    return (
      <main className="container">
        <div className="card enhanced-card">
          <div className="loading-text">Checking wallet & registration…</div>
        </div>
      </main>
    );
  }

  // -----------------------------------------------------------
  // PAGE UI
  // -----------------------------------------------------------
  return (
    <main className="container enhanced-container">
      <div className="card enhanced-card" style={{ maxWidth: 720 }}>
        <h2 className="title">Register</h2>

        <p className="subtitle">
          Connect your wallet and create your on-chain profile.
          <br />
          <span className="highlight">
            PAN will be stored permanently, please be aware.
          </span>
        </p>

        <div className="form-grid">
          <div className="connection">
            <span className="label">Wallet:</span> {account ?? "Not connected"}
          </div>

          <input
            className="input enhanced-input"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />

          <input
            className="input enhanced-input"
            placeholder="PAN (stored on-chain)"
            value={pan}
            onChange={(e) => setPan(e.target.value)}
          />

          <div className="button-row">
            <button
              className="button enhanced-button"
              onClick={onRegister}
              disabled={loading}
            >
              {loading ? "Registering…" : "Register"}
            </button>
          </div>

          {error && <div className="error-text">{error}</div>}
        </div>
      </div>

      <style jsx>{`
        .enhanced-container {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px 16px;
        }

        .enhanced-card {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(12px);
          padding: 32px;
          border-radius: 16px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow: 0 4px 18px rgba(0, 0, 0, 0.15);
          animation: fadeIn 0.4s ease-out;
        }

        .title {
          margin: 0 0 8px;
          font-size: 1.8rem;
          font-weight: 600;
          letter-spacing: -0.5px;
        }

        .subtitle {
          margin: 0 0 18px;
          opacity: 0.85;
          line-height: 1.5;
        }

        .highlight {
          color: #ffbfbf;
          font-size: 0.9rem;
        }

        .form-grid {
          display: grid;
          gap: 14px;
        }

        .connection {
          font-size: 0.9rem;
          opacity: 0.85;
          margin-bottom: 4px;
        }

        .label {
          font-weight: 600;
        }

        .enhanced-input {
          padding: 12px 14px;
          border-radius: 10px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(255, 255, 255, 0.05);
          transition: 0.2s ease;
        }

        .enhanced-input:focus {
          outline: none;
          border-color: rgba(255, 255, 255, 0.3);
          background: rgba(255, 255, 255, 0.08);
        }

        .button-row {
          display: flex;
          gap: 10px;
          margin-top: 6px;
        }

        .enhanced-button {
          flex: 1;
          padding: 12px;
          background: #4b82f5;
          border-radius: 10px;
          transition: 0.2s ease;
        }

        .enhanced-button:hover {
          background: #3b6bd8;
        }

        .enhanced-secondary {
          flex: 1;
          padding: 12px;
          background: transparent;
          border-radius: 10px;
          border: 1px solid rgba(255, 255, 255, 0.12);
          transition: 0.2s ease;
        }

        .enhanced-secondary:hover {
          border-color: rgba(255, 255, 255, 0.25);
          background: rgba(255, 255, 255, 0.06);
        }

        .error-text {
          margin-top: 4px;
          color: #ff8a8a;
          font-size: 0.9rem;
        }

        .loading-text {
          font-size: 0.95rem;
          opacity: 0.85;
          text-align: center;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </main>
  );
}
