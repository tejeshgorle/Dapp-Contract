"use client";

import { useEffect, useState } from "react";
import { getUserByAddress, registerProperty } from "@/utils/contract";
import { getSigner } from "@/utils/web3";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import IPFSUpload from "@/app/contracts/propose/components/IPFSUpload";



export default function PropertyRegistrationPage() {
  const [currentUser, setCurrentUser] = useState<string>("");
  const [currentUserInfo, setCurrentUserInfo] = useState<any>(null);

  const [cid, setCid] = useState<string>("");
  const [registering, setRegistering] = useState(false);

  /* Load user info */
  useEffect(() => {
    async function init() {
      try {
        const signer = await getSigner();
        const wallet = await signer.getAddress();
        setCurrentUser(wallet);

        const userData = await getUserByAddress(wallet);
        if (userData) setCurrentUserInfo(userData);

      } catch (err) {
        console.error(err);
      }
    }
    init();
  }, []);

  /* Register property */
  async function registerNewProperty() {
    if (!cid) return alert("Upload a file first to generate CID.");

    try {
      setRegistering(true);

      const tx = await registerProperty(cid);
      console.log("TX:", tx);

      alert("Property registered successfully!");
      setCid("");

    } catch (err) {
      console.error(err);
      alert("Error registering property");
    }

    setRegistering(false);
  }

  return (
    <main className="p-8 grid grid-cols-1 lg:grid-cols-2 gap-6 text-white bg-[#0B0F19] min-h-screen">

      {/* LEFT SIDE — Property Registration */}
      <Card className="bg-[#131A2E] border border-[#2A3558] shadow-xl">
        <CardContent className="p-6">

          <h2 className="text-2xl font-bold mb-4 text-[#F5C542]">
            Register New Property
          </h2>

          {/* Current user */}
          {currentUserInfo && (
            <div className="mb-4 p-3 bg-[#0F1527] rounded-lg border border-[#2A3558]">
              <p className="font-semibold text-[#F5C542] text-lg">
                {currentUserInfo.username}
              </p>
              <p className="text-xs text-gray-300">{currentUser}</p>
            </div>
          )}

          {/* CID area */}
          <div className="mb-4">
            <label className="text-sm text-gray-300">Property Document CID</label>
            <Input
              value={cid}
              readOnly
              className="bg-[#0F1527] text-white mt-1 border border-[#2A3558]"
            />
          </div>

          {/* Register Button */}
          <Button
            className="w-full mt-4 bg-[#F5C542] text-black font-semibold hover:bg-[#e0b637]"
            onClick={registerNewProperty}
            disabled={registering}
          >
            {registering ? "Registering..." : "Register Property"}
          </Button>

        </CardContent>
      </Card>

      {/* RIGHT SIDE — IPFS Upload */}
      <div className="flex flex-col gap-6">
        <IPFSUpload onCID={(cid: string) => setCid(cid)} />
      </div>

    </main>
  );
}
