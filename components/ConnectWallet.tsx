"use client";

import { useEffect, useState } from "react";
import { getAccount, getNetwork } from "@/utils/web3";
import toast from "react-hot-toast";

export default function WalletConnect() {
  const [account, setAccount] = useState<string | null>(null);
  const [network, setNetwork] = useState<string>("");

  useEffect(() => {
    async function connect() {
      try {
        const acc = await getAccount();
        setAccount(acc);
        const net = await getNetwork();
        setNetwork(net);
        toast.success("Wallet connected");
      } catch (err: any) {
        console.error(err);
        toast.error(err.message);
      }
    }
    connect();
  }, []);

  return (
    <button
      onClick={async () => {
        try {
          const acc = await getAccount();
          setAccount(acc);
          const net = await getNetwork();
          setNetwork(net);
          toast.success("Wallet connected");
        } catch (err: any) {
          toast.error(err.message);
        }
      }}
      className="bg-blue-600 text-white px-4 py-2 rounded-xl font-semibold hover:bg-blue-700 transition-all"
    >
      {account ? `${account.slice(0, 6)}...${account.slice(-4)}` : "Connect Wallet"}
    </button>
  );
}
