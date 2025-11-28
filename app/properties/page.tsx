"use client";

import Link from "next/link";
import { Home, Wrench, ShoppingCart } from "lucide-react";

export default function PropertiesPage() {
  const cardStyles =
    "p-6 rounded-2xl bg-gradient-to-br from-[#1a2038]/80 to-[#0b1024]/80 " +
    "border border-white/10 shadow-xl hover:shadow-2xl hover:shadow-[#F5C542]/20 " +
    "backdrop-blur-sm transition-all cursor-pointer block group " +
    "hover:-translate-y-1 hover:border-[#F5C542]/40";

  const iconStyles =
    "w-10 h-10 text-[#F5C542] group-hover:scale-110 transition-transform drop-shadow-md";

  return (
    <main className="p-8">
      <h1 className="text-3xl font-semibold text-white mb-10 tracking-wide">
        Properties
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">

        {/* REGISTER PROPERTY */}
        <Link href="/properties/register" className={cardStyles}>
          <div className="flex items-center gap-3">
            <Home className={iconStyles} />
            <h2 className="text-xl font-semibold text-white group-hover:text-[#F5C542] transition-colors">
              Register Property
            </h2>
          </div>

          <p className="text-gray-400 text-sm mt-3 leading-relaxed">
            Add a new property, set ownership, and add key metadata to the chain.
          </p>
        </Link>

        {/* MANAGE PROPERTY */}
        <Link href="/properties/manage" className={cardStyles}>
          <div className="flex items-center gap-3">
            <Wrench className={iconStyles} />
            <h2 className="text-xl font-semibold text-white group-hover:text-[#F5C542] transition-colors">
              Manage Property
            </h2>
          </div>

          <p className="text-gray-400 text-sm mt-3 leading-relaxed">
            Update property details, transfer ownership, and maintain records.
          </p>
        </Link>

        {/* TRANSACTIONS / SELL PROPERTY */}
        <Link href="/properties/transactions" className={cardStyles}>
          <div className="flex items-center gap-3">
            <ShoppingCart className={iconStyles} />
            <h2 className="text-xl font-semibold text-white group-hover:text-[#F5C542] transition-colors">
              Transactions / Sell Property
            </h2>
          </div>

          <p className="text-gray-400 text-sm mt-3 leading-relaxed">
            Start or review property sale requests and manage transaction history.
          </p>
        </Link>

      </div>
    </main>
  );
}
