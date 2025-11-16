"use client";

import Link from "next/link";
import { FilePlus2, PenTool, History } from "lucide-react";

export default function ContractsPage() {
  const cardStyles =
    "p-6 rounded-xl bg-gradient-to-br from-[#1c2240]/80 to-[#0d1328]/80 " +
    "border border-white/10 shadow-lg hover:shadow-[#F5C542]/30 " +
    "transition-all cursor-pointer block group";

  const iconStyles =
    "w-10 h-10 text-[#F5C542] group-hover:scale-110 transition-transform";

  return (
    <main className="p-8">
      <h1 className="text-3xl font-semibold text-white mb-8">
        Contracts
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

        {/* 1. PROPOSE CONTRACT */}
        <Link href="/contracts/propose" className={cardStyles}>
          <FilePlus2 className={iconStyles} />
          <h2 className="text-xl font-semibold mt-4 mb-2 text-white group-hover:text-[#F5C542] transition">
            Propose Contract
          </h2>
          <p className="text-gray-400 text-sm">
            Create and send new multi-party contract proposals to stakeholders.
          </p>
        </Link>

        {/* 2. SIGN / MANAGE CONTRACTS */}
        <Link href="/contracts/manage" className={cardStyles}>
          <PenTool className={iconStyles} />
          <h2 className="text-xl font-semibold mt-4 mb-2 text-white group-hover:text-[#F5C542] transition">
            Sign / Manage Contracts
          </h2>
          <p className="text-gray-400 text-sm">
            Review pending contracts, sign, decline, or monitor their status.
          </p>
        </Link>

        {/* 3. CONTRACT HISTORY */}
        <Link href="/contracts/history" className={cardStyles}>
          <History className={iconStyles} />
          <h2 className="text-xl font-semibold mt-4 mb-2 text-white group-hover:text-[#F5C542] transition">
            Contract History
          </h2>
          <p className="text-gray-400 text-sm">
            View your previously signed and completed contract records.
          </p>
        </Link>

      </div>
    </main>
  );
}
