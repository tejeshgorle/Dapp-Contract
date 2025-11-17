"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";

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
  const [wallet, setWallet] = useState<string>("");

  const [contacts, setContacts] = useState<any[]>([]);
  const [properties, setProperties] = useState<any[]>([]);
  const [incoming, setIncoming] = useState<number[]>([]);
  const [outgoing, setOutgoing] = useState<number[]>([]);
  const [salePackets, setSalePackets] = useState<ExtendedSaleData[]>([]);

  const [selectedProperty, setSelectedProperty] = useState<string>("");
  const [selectedBuyer, setSelectedBuyer] = useState<string>("");
  const [priceWei, setPriceWei] = useState<string>("");

  // 🔒 ACTION LOCK — prevents double-clicks
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

  // 🔧 WRAPPER to auto-lock buttons
  const runLocked = async (lockId: string, fn: () => Promise<void>) => {
    if (actionLock) return; // already processing
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
    <div className="p-6 space-y-10">

      {/* ░░ PROPOSE SALE SECTION ░░ */}
      <Card className="p-6 shadow-xl rounded-2xl">
        <h2 className="text-2xl font-semibold mb-4">Propose a New Sale</h2>

        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <select
              className="w-full p-3 rounded-xl border bg-gray-100"
              value={selectedProperty}
              onChange={(e) => setSelectedProperty(e.target.value)}
            >
              <option value="">Select Property</option>
              {properties.map((p) => (
                <option key={p.id} value={p.id}>
                  Property #{p.id}
                </option>
              ))}
            </select>

            <input
              placeholder="Price in Wei"
              value={priceWei}
              onChange={(e) => setPriceWei(e.target.value)}
              className="w-full p-3 rounded-xl border bg-gray-100"
            />

            <select
              className="w-full p-3 rounded-xl border bg-gray-100"
              value={selectedBuyer}
              onChange={(e) => setSelectedBuyer(e.target.value)}
            >
              <option value="">Select Buyer</option>
              {contacts.map((c, idx) => (
                <option key={idx} value={c.wallet}>
                  {c.username} ({c.wallet})
                </option>
              ))}
            </select>
          </div>

          <Button
            className="w-full mt-4 py-3 text-lg"
            disabled={actionLock !== null}
            onClick={async () =>
              runLocked("propose", async () => {
                if (!selectedProperty || !priceWei || !selectedBuyer)
                  return alert("Fill all fields");

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

      {/* ░░ ACTIVE SALES ░░ */}
      <Card className="p-6 shadow-xl rounded-2xl">
        <h2 className="text-2xl font-semibold mb-4">Active Sale Details</h2>

        {salePackets.length === 0 && (
          <p className="text-gray-500">
            No active (INITIATED / ACCEPTED / PAID) sales.
          </p>
        )}

        <div className="space-y-6 mt-4">
          {salePackets.map((sale) => {
            const pid = sale.propertyId;

            return (
              <motion.div
                key={pid}
                className="p-5 bg-gray-100 rounded-xl shadow-md border"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <h3 className="text-xl font-semibold mb-3">
                  Property #{pid}
                </h3>

                {/* USER DETAILS */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="p-3 bg-white rounded-xl border">
                    <p className="font-semibold text-blue-600">Seller</p>
                    <p><b>Name:</b> {sale.sellerUser?.username ?? "Unknown"}</p>
                    <p><b>PAN:</b> {sale.sellerUser?.pan ?? "Unknown"}</p>
                    <p className="text-xs break-all">{sale.seller}</p>
                  </div>

                  <div className="p-3 bg-white rounded-xl border">
                    <p className="font-semibold text-green-600">Buyer</p>
                    <p><b>Name:</b> {sale.buyerUser?.username ?? "Unknown"}</p>
                    <p><b>PAN:</b> {sale.buyerUser?.pan ?? "Unknown"}</p>
                    <p className="text-xs break-all">{sale.buyer}</p>
                  </div>
                </div>

                <p><b>Price:</b> {String(sale.price)} Wei</p>

                <div className="mt-3 p-2 bg-white rounded text-center font-bold border">
                  {statusText(sale.status)}
                </div>

                {/* ACTIONS */}
                <div className="mt-4 space-y-3">

                  {/* BUYER — Accept/Decline */}
                  {sale.buyer === wallet &&
                    sale.status === SaleStatus.INITIATED && (
                      <div className="flex gap-3">
                        <Button
                          className="w-full"
                          disabled={actionLock !== null}
                          onClick={() =>
                            runLocked(`accept-${pid}`, async () => {
                              await buyerAcceptSale(pid);
                            })
                          }
                        >
                          {actionLock === `accept-${pid}`
                            ? "Processing..."
                            : "Accept"}
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
                          {actionLock === `decline-${pid}`
                            ? "Processing..."
                            : "Decline"}
                        </Button>
                      </div>
                    )}

                  {/* BUYER — Pay */}
                  {sale.buyer === wallet &&
                    sale.status === SaleStatus.ACCEPTED && (
                      <Button
                        className="w-full"
                        disabled={actionLock !== null}
                        onClick={() =>
                          runLocked(`pay-${pid}`, async () => {
                            await buyerPay(pid);
                          })
                        }
                      >
                        {actionLock === `pay-${pid}`
                          ? "Processing..."
                          : `Pay ${String(sale.price)} Wei`}
                      </Button>
                    )}

                  {/* SELLER — Cancel */}
                  {sale.seller === wallet &&
                    sale.status === SaleStatus.INITIATED && (
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
                        {actionLock === `cancel-${pid}`
                          ? "Processing..."
                          : "Cancel Sale"}
                      </Button>
                    )}

                  {/* SELLER — Finalize */}
                  {sale.seller === wallet &&
                    sale.status === SaleStatus.PAID && (
                      <Button
                        className="w-full"
                        disabled={actionLock !== null}
                        onClick={() =>
                          runLocked(`finalize-${pid}`, async () => {
                            await finalizeSale(pid);
                          })
                        }
                      >
                        {actionLock === `finalize-${pid}`
                          ? "Processing..."
                          : "Finalize Sale"}
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
