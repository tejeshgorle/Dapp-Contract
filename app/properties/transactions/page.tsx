"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

import {
  proposePropertySale,
  getIncomingSaleRequests,
  getOutgoingSaleRequests,
  getSaleDetails,
  buyerAcceptSale,
  buyerDeclineSale,
  buyerPay,
  sellerCancelSale,
  finalizeSale,
  getUserProperties,
  getUserByAddress,
} from "@/utils/contract";

import { getSigner } from "@/utils/web3";
import { getContactsForWallet } from "@/utils/contract";

import {
  Home,
  User,
  BadgeDollarSign,
  Tags,
  AlarmClock,
  ArrowRightLeft,
} from "lucide-react";

export enum SaleStatus {
  INITIATED = 0,
  ACCEPTED = 1,
  PAID = 2,
  DENIED_BY_BUYER = 3,
  CANCELLED = 4,
  COMPLETED = 5,
}

interface ExtendedSaleData {
  propertyId: number;
  seller: string;
  buyer: string;
  price: bigint;
  status: number;
  sellerUser?: { username: string; pan: string; wallet: string } | null;
  buyerUser?: { username: string; pan: string; wallet: string } | null;
}

export default function TransactionPage() {
  const router = useRouter();

  const [wallet, setWallet] = useState<string>("");

  const [contacts, setContacts] = useState<any[]>([]);
  const [properties, setProperties] = useState<any[]>([]);
  const [incoming, setIncoming] = useState<number[]>([]);
  const [outgoing, setOutgoing] = useState<number[]>([]);
  const [salePackets, setSalePackets] = useState<ExtendedSaleData[]>([]);

  const [selectedProperty, setSelectedProperty] = useState<string>("");
  const [selectedBuyer, setSelectedBuyer] = useState<string>("");
  const [priceWei, setPriceWei] = useState<string>("");

  const [actionLock, setActionLock] = useState<string | null>(null);

  const safeUser = async (addr: string) => {
    try {
      return await getUserByAddress(addr);
    } catch {
      return null;
    }
  };

  const loadEverything = async () => {
    const signer = await getSigner();
    const addr = await signer.getAddress();
    setWallet(addr);

    const userProps = await getUserProperties(addr);
    const c = await getContactsForWallet(addr);
    const inc = await getIncomingSaleRequests(addr);
    const out = await getOutgoingSaleRequests(addr);

    setProperties(userProps);
    setContacts(c);
    setIncoming(inc);
    setOutgoing(out);

    const unique = [...new Set([...inc, ...out])];
    const packets: ExtendedSaleData[] = [];

    for (let id of unique) {
      const d: any = await getSaleDetails(id);
      if (!d) continue;
      if (d.status > SaleStatus.PAID) continue;

      packets.push({
        ...d,
        sellerUser: await safeUser(d.seller),
        buyerUser: await safeUser(d.buyer),
      });
    }

    setSalePackets(packets);
  };

  useEffect(() => {
    loadEverything();
  }, []);

  const statusText = (s: number) => {
    switch (s) {
      case 0:
        return "INITIATED — Awaiting buyer response";
      case 1:
        return "ACCEPTED — Buyer must pay";
      case 2:
        return "PAID — Seller must finalize";
      default:
        return "Unknown";
    }
  };

  const runLocked = async (lockId: string, fn: () => Promise<void>) => {
    if (actionLock) return;
    setActionLock(lockId);
    try {
      await fn();
      await loadEverything();
    } catch (e) {
      console.error(e);
    }
    setActionLock(null);
  };

  return (
    <div className="p-6 space-y-10 text-white bg-[#05070d] min-h-screen">

      {/* ------------------------------------------------------------- */}
      {/* 🔥 PROPOSE NEW SALE */}
      {/* ------------------------------------------------------------- */}
      <Card className="p-6 rounded-2xl bg-[#0b0f19] border border-white/20 shadow-2xl">
        <h2 className="text-3xl font-bold text-[#F5C542] mb-5 flex items-center gap-3">
          <Tags className="w-7 h-7 text-[#F5C542]" />
          Propose Property Sale
        </h2>

        <CardContent className="space-y-6">

          {/* ICON INPUTS — Property | Price | Buyer */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

            {/* PROPERTY SELECT */}
            <div className="relative">
              <Home className="absolute left-3 top-1/2 -translate-y-1/2 text-[#F5C542] w-5 h-5" />
              <select
                className="w-full bg-[#0F1629] border border-white/20 text-gray-200 p-3 pl-10 rounded-xl focus:border-[#F5C542]"
                value={selectedProperty}
                onChange={(e) => setSelectedProperty(e.target.value)}
              >
                <option value="" className="text-gray-200">Select Property</option>
                {properties.map((p) => (
                  <option key={p.id} className="text-gray-200" value={p.id}>
                    Property #{p.id}
                  </option>
                ))}
              </select>
            </div>

            {/* PRICE INPUT */}
            <div className="relative">
              <BadgeDollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-[#F5C542] w-5 h-5" />
              <input
                placeholder="Price (Wei)"
                value={priceWei}
                onChange={(e) => setPriceWei(e.target.value)}
                className="w-full bg-[#0F1629] border border-white/20 text-gray-200 p-3 pl-10 rounded-xl focus:border-[#F5C542]"
              />
            </div>

            {/* BUYER SELECT */}
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-[#F5C542] w-5 h-5" />
              <select
                className="w-full bg-[#0F1629] border border-white/20 text-gray-200 p-3 pl-10 rounded-xl focus:border-[#F5C542]"
                value={selectedBuyer}
                onChange={(e) => setSelectedBuyer(e.target.value)}
              >
                <option value="" className="text-gray-200">Select Buyer</option>
                {contacts.map((c, idx) => (
                  <option key={idx} className="text-gray-200" value={c.wallet}>
                    {c.username} ({c.wallet})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* BUTTON */}
          <Button
            className="w-full mt-4 py-3 text-lg bg-[#F5C542] text-gray-900 hover:bg-[#e6b93d]"
            disabled={actionLock !== null}
            onClick={async () =>
              runLocked("propose", async () => {
                if (!selectedProperty || !priceWei || !selectedBuyer)
                  return alert("Fill all fields!");

                const res = await proposePropertySale(
                  Number(selectedProperty),
                  priceWei,
                  selectedBuyer
                );
                if (res.success) alert("Sale proposed!");
              })
            }
          >
            {actionLock === "propose" ? "Processing..." : "Propose Sale"}
          </Button>
        </CardContent>
      </Card>

      {/* ------------------------------------------------------------- */}
      {/* 🔥 ACTIVE SALES */}
      {/* ------------------------------------------------------------- */}
      <Card className="p-6 rounded-2xl bg-[#0b0f19] border border-white/20 shadow-2xl">
        <h2 className="text-3xl font-bold text-[#F5C542] mb-6 flex items-center gap-3">
          <ArrowRightLeft className="w-7 h-7 text-[#F5C542]" />
          Active Sales
        </h2>

        {salePackets.length === 0 && (
          <p className="text-gray-400 text-center py-5">No active sales.</p>
        )}

        <div className="space-y-6">
          {salePackets.map((sale) => {
            const pid = sale.propertyId;

            return (
              <motion.div
                key={pid}
                className="p-6 rounded-xl bg-[#0F1629] border border-white/10 shadow-lg"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <h3 className="text-xl font-bold flex items-center gap-2 text-white">
                  <Home className="w-5 h-5 text-[#F5C542]" />
                  Property #{pid}
                </h3>

                {/* SELLER + BUYER */}
                <div className="grid grid-cols-2 gap-4 mt-4">

                  {/* SELLER CARD */}
                  <div className="p-4 bg-[#0b1324] rounded-xl border border-white/10">
                    <p className="font-semibold text-red-400 flex items-center gap-2">
                      <User className="w-4 h-4" /> Seller
                    </p>
                    <p className="text-gray-200"><b>Name:</b> {sale.sellerUser?.username ?? "Unknown"}</p>
                    <p className="text-gray-200"><b>PAN:</b> {sale.sellerUser?.pan ?? "Unknown"}</p>
                    <p className="text-xs break-all text-gray-400">{sale.seller}</p>
                  </div>

                  {/* BUYER CARD */}
                  <div className="p-4 bg-[#0b1324] rounded-xl border border-white/10">
                    <p className="font-semibold text-green-400 flex items-center gap-2">
                      <User className="w-4 h-4" /> Buyer
                    </p>
                    <p className="text-gray-200"><b>Name:</b> {sale.buyerUser?.username ?? "Unknown"}</p>
                    <p className="text-gray-200"><b>PAN:</b> {sale.buyerUser?.pan ?? "Unknown"}</p>
                    <p className="text-xs break-all text-gray-400">{sale.buyer}</p>
                  </div>
                </div>

                {/* PRICE */}
                <p className="mt-4 flex items-center gap-2 text-gray-300">
                  <BadgeDollarSign className="w-5 h-5 text-[#F5C542]" />
                  <b className="text-gray-200">Price:</b> {String(sale.price)} Wei
                </p>

                {/* STATUS */}
                <div className="mt-3 p-3 bg-[#1b2033] rounded-xl text-center font-bold border border-white/10 text-gray-200 flex items-center justify-center gap-2">
                  <AlarmClock className="w-5 h-5 text-[#F5C542]" />
                  {statusText(sale.status)}
                </div>

                {/* ACTION BUTTONS */}
                <div className="mt-5 space-y-3">

                  {/* VIEW PROPERTY */}
                  <Button
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                    onClick={() => router.push(`/properties/${pid}`)}
                  >
                    View Property Details
                  </Button>

                  {/* BUYER ACCEPT/DECLINE */}
                  {sale.buyer === wallet && sale.status === SaleStatus.INITIATED && (
                    <div className="flex gap-3">
                      <Button
                        className="w-full bg-green-600 hover:bg-green-700 text-white"
                        disabled={actionLock !== null}
                        onClick={() =>
                          runLocked(`accept-${pid}`, async () => {
                            await buyerAcceptSale(pid);
                          })
                        }
                      >
                        {actionLock === `accept-${pid}` ? "..." : "Accept"}
                      </Button>

                      <Button
                        variant="destructive"
                        className="w-full"
                        disabled={actionLock !== null}
                        onClick={() =>
                          runLocked(`decline-${pid}`, async () => {
                            await buyerDeclineSale(pid);
                          })
                        }
                      >
                        {actionLock === `decline-${pid}` ? "..." : "Decline"}
                      </Button>
                    </div>
                  )}

                  {/* BUYER PAY */}
                  {sale.buyer === wallet && sale.status === SaleStatus.ACCEPTED && (
                    <Button
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                      disabled={actionLock !== null}
                      onClick={() =>
                        runLocked(`pay-${pid}`, async () => {
                          await buyerPay(pid);
                        })
                      }
                    >
                      {actionLock === `pay-${pid}` ? "..." : `Pay ${String(sale.price)} Wei`}
                    </Button>
                  )}

                  {/* SELLER CANCEL */}
                  {sale.seller === wallet && sale.status === SaleStatus.INITIATED && (
                    <Button
                      variant="destructive"
                      className="w-full"
                      disabled={actionLock !== null}
                      onClick={() =>
                        runLocked(`cancel-${pid}`, async () => {
                          await sellerCancelSale(pid);
                        })
                      }
                    >
                      {actionLock === `cancel-${pid}` ? "..." : "Cancel Sale"}
                    </Button>
                  )}

                  {/* SELLER FINALIZE */}
                  {sale.seller === wallet && sale.status === SaleStatus.PAID && (
                    <Button
                      className="w-full bg-green-600 hover:bg-green-700 text-white"
                      disabled={actionLock !== null}
                      onClick={() =>
                        runLocked(`finalize-${pid}`, async () => {
                          await finalizeSale(pid);
                        })
                      }
                    >
                      {actionLock === `finalize-${pid}` ? "..." : "Finalize Sale"}
                    </Button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
