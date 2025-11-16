"use client";

import "./globals.css";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [wallet, setWallet] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && (window as any).ethereum) {
      (async () => {
        try {
          const accounts = await (window as any).ethereum.request({ method: "eth_accounts" });
          if (accounts?.length > 0) setWallet(accounts[0]);
        } catch {}
      })();
    }
  }, []);

  const handleConnect = async () => {
    try {
      const accounts = await (window as any).ethereum.request({ method: "eth_requestAccounts" });
      setWallet(accounts[0]);
    } catch {
      alert("Please install MetaMask to continue.");
    }
  };

  const navItems = [
    { href: "/", label: "Dashboard" },
    { href: "/contracts", label: "Contracts" },
    { href: "/properties", label: "Properties" },
    { href: "/transfers", label: "Transfers" },
     { href: "/people", label: "People" },
  ];

  return (
    <html lang="en">
      <body className="min-h-screen bg-gradient-to-br from-[#0b0e1a] via-[#101631] to-[#1b2745] text-gray-100">
        <header className="sticky top-0 z-50 border-b border-white/10 bg-gradient-to-r from-[#141b34] to-[#101631] backdrop-blur-xl shadow-lg">
          <nav className="container mx-auto flex justify-between items-center px-6 py-4">
            <Link href="/" className="text-2xl font-bold tracking-wide text-[#F5C542]">
              PropertyChain
            </Link>
            <ul className="flex gap-8 text-gray-300 font-medium">
              {navItems.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`hover:text-[#F5C542] transition ${
                      pathname === item.href ? "text-[#F5C542]" : ""
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
            <button
              onClick={handleConnect}
              className="rounded-full bg-gradient-to-r from-[#F5C542] to-[#e5a400] text-black px-5 py-2 text-sm font-semibold shadow-lg hover:brightness-110 transition"
            >
              {wallet ? `${wallet.slice(0, 6)}...${wallet.slice(-4)}` : "Connect Wallet"}
            </button>
          </nav>
        </header>

        <main className="container mx-auto p-8">
          <div className="rounded-2xl bg-white/5 backdrop-blur-2xl p-10 shadow-2xl border border-white/10 transition-all duration-500 hover:border-[#F5C542]/30">
            {children}
          </div>
        </main>

        <footer className="text-center py-6 border-t border-white/10 text-gray-400 text-sm backdrop-blur-md bg-[#0b0e1a]/50">
          © {new Date().getFullYear()} PropertyChain — Built for Secure Real Estate on Blockchain
        </footer>
      </body>
    </html>
  );
}
