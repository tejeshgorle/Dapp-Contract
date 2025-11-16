// app/profile/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAccount } from "@/utils/web3";
import { getUserByAddress } from "@/utils/contract";
import { User as UserIcon } from "lucide-react";



export default function ProfilePage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadProfile() {
      try {
        setLoading(true);
        setError(null);

        const addr = await getAccount();
        if (!addr) {
          setError("Wallet not connected");
          setLoading(false);
          return;
        }

        const u = await getUserByAddress(addr);

        // if contract helper returned null/undefined -> redirect to register
        if (!u) {
          router.replace("/register");
          return;
        }

        // normalize user object from many possible shapes
        const normalized = normalizeUser(u, addr);

        // If normalized says not exists, assume not registered
        if (!normalized.exists) {
          router.replace("/register");
          return;
        }

        setUser(normalized);
      } catch (err: any) {
        console.error("loadProfile error:", err);
        setError(err?.message ?? String(err) ?? "Error fetching profile");
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  if (loading)
    return (
      <main className="p-8">
        <p className="text-gray-300">Loading profile...</p>
      </main>
    );

  if (error)
    return (
      <main className="p-8">
        <p className="text-red-400">{error}</p>
      </main>
    );

  if (!user)
    return (
      <main className="p-8">
        <p className="text-gray-300">No profile found.</p>
      </main>
    );

  return (
    <main className="p-8">
      <h1 className="text-3xl font-semibold text-white mb-8">Profile</h1>

      <div className="p-6 rounded-xl bg-gradient-to-br from-[#1c2240]/80 to-[#0d1328]/80 border border-white/10 shadow-lg max-w-xl">
        <UserIcon className="w-12 h-12 text-[#F5C542] mb-4" />
        <h2 className="text-xl font-semibold text-white mb-6">{user.username ?? "Unnamed user"}</h2>

        <div className="space-y-4 text-gray-300 text-sm">
          <div>
            <span className="font-semibold text-white">Wallet:</span>
            <p className="break-all">{user.wallet}</p>
          </div>

          <div>
            <span className="font-semibold text-white">PAN:</span>
            <p>{user.pan ?? "—"}</p>
          </div>

          <div>
            <span className="font-semibold text-white">Registered At:</span>
            <p>{user.registeredAt ? new Date(user.registeredAt * 1000).toLocaleString() : "—"}</p>
          </div>
        </div>
      </div>
    </main>
  );
}

/**
 * Normalize a contract-returned `u` into:
 * { username, wallet, pan, registeredAt, exists }
 *
 * Accepts:
 * - named-object { username, panNumber, wallet, registeredAt, exists }
 * - tuple-like [ wallet, username, panNumber, registeredAt, exists ]
 * - other similar permutations
 */
function normalizeUser(u: any, fallbackAddr: string) {
  // default result
  const res = {
    username: "Unnamed user",
    wallet: fallbackAddr,
    pan: "—",
    registeredAt: 0,
    exists: false,
  };

  if (!u) return res;

  // If object with named keys (most likely)
  if (typeof u === "object" && !Array.isArray(u)) {
    // some ABIs return named fields: username, panHash, panNumber, wallet, createdAt, registeredAt, exists
    // prefer commonly-used names
    const username =
      safeString(u.username) ||
      safeString(u.usernameHash) ||
      safeString(u.name) ||
      safeString(u[1]) ||
      undefined;

    const wallet =
      safeString(u.wallet) ||
      safeString(u[0]) ||
      safeString(u.address) ||
      fallbackAddr;

    // pan may be panNumber or panHash
    const pan = safeString(u.panNumber) || safeString(u.pan) || safeString(u.panHash) || undefined;

    // created/registered
    const registeredAt =
      toNumber(u.registeredAt) || toNumber(u.createdAt) || toNumber(u[3]) || 0;

    // exists flag may be boolean or derived from fields
    const exists = typeof u.exists === "boolean" ? u.exists : Boolean(username && wallet);

    if (username) res.username = username;
    if (wallet) res.wallet = wallet;
    if (pan) res.pan = pan;
    res.registeredAt = registeredAt;
    res.exists = exists;
    return res;
  }

  // If array/tuple-like structure
  if (Array.isArray(u)) {
    // common tuple: [wallet, username, pan, createdAt, exists]
    const wallet = safeString(u[0]) || fallbackAddr;
    const username = safeString(u[1]) || "Unnamed user";
    const pan = safeString(u[2]) || "—";
    const registeredAt = toNumber(u[3]) || 0;
    const exists = typeof u[4] === "boolean" ? u[4] : Boolean(username && wallet);

    return {
      username,
      wallet,
      pan,
      registeredAt,
      exists,
    };
  }

  // fallback: whatever the value is, stringify it
  try {
    const s = String(u);
    return { username: s, wallet: fallbackAddr, pan: "—", registeredAt: 0, exists: true };
  } catch {
    return res;
  }
}

function safeString(v: any): string | undefined {
  if (v === undefined || v === null) return undefined;
  if (typeof v === "string") {
    // try decode bytes32-like values (0x...32) gracefully in client or keep raw
    // but we cannot depend on ethers here; just return the string
    return v;
  }
  // some fields might be bytes (hex) or BigNumber — convert safely
  try {
    return String(v);
  } catch {
    return undefined;
  }
}

function toNumber(v: any): number {
  if (v === undefined || v === null) return 0;
  if (typeof v === "number") return v;
  if (typeof v === "string" && v !== "") {
    const n = Number(v);
    return Number.isNaN(n) ? 0 : n;
  }
  // BigNumber-like (ethers v6) handled here if it has toNumber method
  try {
    if (typeof v.toNumber === "function") return v.toNumber();
    if (typeof v.toBigInt === "function") return Number(v.toBigInt());
  } catch {}
  return 0;
}
