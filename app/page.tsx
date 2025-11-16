"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { isCurrentUserRegistered } from "@/utils/contract";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    async function run() {
      try {
        const registered = await isCurrentUserRegistered();

        if (registered) {
          router.replace("/dashboard");
        } else {
          router.replace("/register");
        }
      } catch (err) {
        console.error("Error while checking user:", err);
        router.replace("/register"); // fallback route
      }
    }

    run();
  }, [router]);

  return <p className="text-gray-300">Redirecting…</p>;
}
