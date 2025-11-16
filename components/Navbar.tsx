"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
// import WalletConnect from "./WalletConnect";

export default function Navbar() {
  const pathname = usePathname();

  const navLinks = [
    { href: "/", label: "Dashboard" },
    { href: "/contracts", label: "Contracts" },
    { href: "/properties", label: "Properties" },
    { href: "/transfers", label: "Transfers" },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="text-2xl font-bold tracking-tight text-blue-600">
          PropChain
        </Link>
        <div className="flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`font-medium transition-colors ${
                pathname === link.href ? "text-blue-600" : "text-gray-700 hover:text-blue-500"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>
        {/* <WalletConnect /> */}
      </div>
    </nav>
  );
}
