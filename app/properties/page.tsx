"use client";

import Link from "next/link";
import { Home, Wrench, ShoppingCart } from "lucide-react";

export default function PropertiesPage() {
  const cardStyles =
    "p-6 rounded-xl bg-gradient-to-br from-[#1c2240]/80 to-[#0d1328]/80 " +
    "border border-white/10 shadow-lg hover:shadow-[#F5C542]/30 " +
    "transition-all cursor-pointer block group";

  const iconStyles =
    "w-10 h-10 text-[#F5C542] group-hover:scale-110 transition-transform";

  return (
    <main className="p-8">
      <h1 className="text-3xl font-semibold text-white mb-8">
        Properties
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

        {/* 1. REGISTER PROPERTY */}
        <Link href="/properties/register" className={cardStyles}>
          <Home className={iconStyles} />
          <h2 className="text-xl font-semibold mt-4 mb-2 text-white group-hover:text-[#F5C542] transition">
            Register Property
          </h2>
          <p className="text-gray-400 text-sm">
            Add a new property to the system, assign ownership and metadata.
          </p>
        </Link>

        {/* 2. MANAGE PROPERTY */}
        <Link href="/properties/manage" className={cardStyles}>
          <Wrench className={iconStyles} />
          <h2 className="text-xl font-semibold mt-4 mb-2 text-white group-hover:text-[#F5C542] transition">
            Manage Property
          </h2>
          <p className="text-gray-400 text-sm">
            Update property information, transfer ownership, or manage records.
          </p>
        </Link>

        {/* 3. PROPERTY TRANSACTIONS / SELL */}
        <Link href="/properties/transactions" className={cardStyles}>
          <ShoppingCart className={iconStyles} />
          <h2 className="text-xl font-semibold mt-4 mb-2 text-white group-hover:text-[#F5C542] transition">
            Transactions / Sell Property
          </h2>
          <p className="text-gray-400 text-sm">
            View, initiate, or approve property sales and transaction history.
          </p>
        </Link>

      </div>
    </main>
  );
}
