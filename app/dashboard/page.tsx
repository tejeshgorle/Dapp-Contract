"use client";

import Link from "next/link";
import {
  User,
  Building2,
  ScrollText,
  Users,
  Receipt,
} from "lucide-react";

export default function DashboardPage() {
  const cardStyles =
    "p-6 rounded-xl bg-gradient-to-br from-[#1c2240]/80 to-[#0d1328]/80 " +
    "border border-white/10 shadow-lg hover:shadow-[#F5C542]/30 " +
    "transition-all cursor-pointer block group";

  const iconStyles =
    "w-10 h-10 text-[#F5C542] group-hover:scale-110 transition-transform";

  return (
    <main className="p-8">
      <h1 className="text-3xl font-semibold text-white mb-8">
        Dashboard
      </h1>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

        {/* 1. PROFILE */}
        <Link href="/profile" className={cardStyles}>
          <User className={iconStyles} />
          <h2 className="text-xl font-semibold mt-4 mb-2 text-white group-hover:text-[#F5C542] transition">
            Profile
          </h2>
          <p className="text-gray-400 text-sm">
            Manage your identity, metadata, account details and KYC data on-chain.
          </p>
        </Link>

        {/* 2. PROPERTY MANAGEMENT */}
        <Link href="/properties" className={cardStyles}>
          <Building2 className={iconStyles} />
          <h2 className="text-xl font-semibold mt-4 mb-2 text-white group-hover:text-[#F5C542] transition">
            Property Management
          </h2>
          <p className="text-gray-400 text-sm">
            Enroll, track and manage your properties and ownership history.
          </p>
        </Link>

        {/* 3. CONTRACTS */}
        <Link href="/contracts" className={cardStyles}>
          <ScrollText className={iconStyles} />
          <h2 className="text-xl font-semibold mt-4 mb-2 text-white group-hover:text-[#F5C542] transition">
            Contracts
          </h2>
          <p className="text-gray-400 text-sm">
            Create, sign, and manage multi-party agreements seamlessly.
          </p>
        </Link>

        {/* 4. PEOPLE */}
        <Link href="/people" className={cardStyles}>
          <Users className={iconStyles} />
          <h2 className="text-xl font-semibold mt-4 mb-2 text-white group-hover:text-[#F5C542] transition">
            People
          </h2>
          <p className="text-gray-400 text-sm">
            Add contacts, verify users, and collaborate with other stakeholders.
          </p>
        </Link>

        {/* 5. TRANSACTIONS */}
        <Link href="/transactions" className={cardStyles}>
          <Receipt className={iconStyles} />
          <h2 className="text-xl font-semibold mt-4 mb-2 text-white group-hover:text-[#F5C542] transition">
            Transactions
          </h2>
          <p className="text-gray-400 text-sm">
            View all property-related transfers and on-chain transaction records.
          </p>
        </Link>

      </div>
    </main>
  );
}
