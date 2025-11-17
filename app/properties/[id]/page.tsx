"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";

import {
  getPropertyInfo,
  getPreviousOwner,
  getOwnershipHistory,
  getUserByAddress,
} from "@/utils/contract";

import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export default function PropertyInfoPage() {
  const params = useParams();
  const propertyId = Number(params.id);

  const [loadingInfo, setLoadingInfo] = useState(false);
  const [loadingExtra, setLoadingExtra] = useState(false);

  const [property, setProperty] = useState<any>(null);
  const [ownerUser, setOwnerUser] = useState<any>(null);

  const [previousOwner, setPreviousOwner] = useState<any>(null);
  const [previousOwnerUser, setPreviousOwnerUser] = useState<any>(null);

  const [history, setHistory] = useState<any[]>([]);
  const [historyWithUsers, setHistoryWithUsers] = useState<any[]>([]);

  const [infoLoaded, setInfoLoaded] = useState(false);
  const [extraLoaded, setExtraLoaded] = useState(false);

  const [error, setError] = useState("");

  // -----------------------------------------------------------------------
  // LOAD BASIC PROPERTY DETAILS + USER INFO FOR OWNER
  // -----------------------------------------------------------------------
  async function loadPropertyInfo() {
    try {
      setLoadingInfo(true);

      const info = await getPropertyInfo(propertyId);
      setProperty(info);

      const user = await getUserByAddress(info.owner);
      setOwnerUser(user);

      setInfoLoaded(true);
    } catch (err) {
      console.error(err);
      setError("Failed to load property details.");
    } finally {
      setLoadingInfo(false);
    }
  }

  // -----------------------------------------------------------------------
  // LOAD PREVIOUS OWNER + HISTORY → Also fetch user profiles
  // -----------------------------------------------------------------------
  async function loadExtraDetails() {
    try {
      setLoadingExtra(true);

      // PREVIOUS OWNER
      const prev = await getPreviousOwner(propertyId);
      setPreviousOwner(prev);

      const prevUser = await getUserByAddress(prev.previousOwner);
      setPreviousOwnerUser(prevUser);

      // HISTORY
      const hist = await getOwnershipHistory(propertyId);
      setHistory(hist);

      const histUsers: any[] = [];

      for (const h of hist) {
        const prevU = await getUserByAddress(h.previousOwner);
        const newU = await getUserByAddress(h.newOwner);

        histUsers.push({
          ...h,
          previousOwnerUser: prevU,
          newOwnerUser: newU,
        });
      }

      setHistoryWithUsers(histUsers);

      setExtraLoaded(true);
    } catch (err) {
      console.error(err);
      alert("Failed to load ownership history.");
    } finally {
      setLoadingExtra(false);
    }
  }

  // -----------------------------------------------------------------------
  // RENDER
  // -----------------------------------------------------------------------
  return (
    <div className="max-w-3xl mx-auto mt-8 space-y-8 pb-10">

      {/* STEP 1 — Initial Property Card */}
      <Card className="shadow-lg border rounded-2xl">
        <CardContent className="p-6 space-y-4">
          <h2 className="text-2xl font-bold">Property Overview</h2>

          <p className="text-lg">
            <b>Property ID:</b> {propertyId}
          </p>

          {!infoLoaded && (
            <button
              onClick={loadPropertyInfo}
              className="px-6 py-3 mt-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition flex items-center gap-2"
              disabled={loadingInfo}
            >
              {loadingInfo ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> Loading…
                </>
              ) : (
                "Load Property Details"
              )}
            </button>
          )}
        </CardContent>
      </Card>

      {/* STEP 2 — Property details + owner info */}
      {infoLoaded && property && (
        <Card className="shadow-lg border rounded-2xl">
          <CardContent className="p-6 space-y-4">
            <h2 className="text-2xl font-bold">Property Information</h2>

            <p><b>CID:</b> {property.cid}</p>

            {/* OWNER CARD */}
            <div className="mt-4 p-4 rounded-xl bg-gray-100">
              <p className="font-semibold text-lg mb-1">Current Owner</p>
              <p><b>Name:</b> {ownerUser?.username || "N/A"}</p>
              <p><b>PAN:</b> {ownerUser?.pan || "N/A"}</p>
              <p><b>Wallet:</b> {property.owner}</p>
            </div>

            <p><b>Registered At:</b> {new Date(property.registeredAt * 1000).toLocaleString()}</p>
            <p><b>Last Transfer:</b> {new Date(property.dateOfLastTransfer * 1000).toLocaleString()}</p>
            <p><b>Ownership Change:</b> {new Date(property.dateOfOwnershipChange * 1000).toLocaleString()}</p>
          </CardContent>
        </Card>
      )}

      {/* STEP 3 — Load extra details */}
      {infoLoaded && !extraLoaded && (
        <div className="text-center">
          <button
            onClick={loadExtraDetails}
            className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition flex items-center justify-center gap-2"
            disabled={loadingExtra}
          >
            {loadingExtra ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" /> Loading…
              </>
            ) : (
              "Load Previous Owner & Ownership History"
            )}
          </button>
        </div>
      )}

      {/* STEP 4 — Previous Owner */}
      {extraLoaded && (
        <>
          <Card className="shadow-lg border rounded-2xl">
            <CardContent className="p-6 space-y-3">
              <h2 className="text-2xl font-bold">Previous Owner</h2>

              <div className="p-4 rounded-xl bg-gray-100">
                <p><b>Name:</b> {previousOwnerUser?.username || "N/A"}</p>
                <p><b>PAN:</b> {previousOwnerUser?.pan || "N/A"}</p>
                <p><b>Wallet:</b> {previousOwner?.previousOwner}</p>
              </div>

              <p>
                <b>Transfer Date:</b>{" "}
                {previousOwner?.transferDate
                  ? new Date(previousOwner.transferDate * 1000).toLocaleString()
                  : "N/A"}
              </p>
            </CardContent>
          </Card>

          {/* -----------------------------------------------------------------------
              OWNERSHIP HISTORY (Buyer Left — Seller Right)
              ----------------------------------------------------------------------- */}
          <Card className="shadow-lg border rounded-2xl">
            <CardContent className="p-6 space-y-6">
              <h2 className="text-2xl font-bold">Ownership History</h2>

              {historyWithUsers.length === 0 && (
                <p className="text-gray-500 text-center">No ownership history available.</p>
              )}

              {historyWithUsers.map((h, index) => (
                <div
                  key={index}
                  className="p-6 rounded-2xl border bg-white shadow-sm"
                >
                  {/* Heading */}
                  <p className="text-lg font-semibold mb-4">
                    Transfer #{index + 1}
                  </p>

                  <div className="grid grid-cols-2 gap-6 items-center relative">

                    {/* LEFT — BUYER */}
                    <div className="space-y-1">
                      <p className="font-semibold text-green-700">Buyer (New Owner)</p>
                      <p><b>Name:</b> {h.newOwnerUser?.username || "N/A"}</p>
                      <p><b>PAN:</b> {h.newOwnerUser?.pan || "N/A"}</p>
                      <p className="text-sm text-gray-600 break-all">
                        <b>Wallet:</b> {h.newOwner}
                      </p>
                    </div>

                    {/* RIGHT — SELLER */}
                    <div className="text-right space-y-1">
                      <p className="font-semibold text-red-700">Seller (Previous Owner)</p>
                      <p><b>Name:</b> {h.previousOwnerUser?.username || "N/A"}</p>
                      <p><b>PAN:</b> {h.previousOwnerUser?.pan || "N/A"}</p>
                      <p className="text-sm text-gray-600 break-all">
                        <b>Wallet:</b> {h.previousOwner}
                      </p>
                    </div>

                    {/* Center Divider */}
                    <div className="absolute left-1/2 top-0 h-full w-0.5 bg-gray-300 -translate-x-1/2"></div>
                  </div>

                  {/* Date */}
                  <p className="text-center mt-6 text-gray-700">
                    <b>Date:</b>{" "}
                    {new Date(h.transferDate * 1000).toLocaleString()}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
