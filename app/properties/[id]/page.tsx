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
import {
  Loader2,
  ExternalLink,
  Fingerprint,
  KeyRound,
  Calendar,
  FileBadge,
  Users,
  ArrowLeftRight,
} from "lucide-react";

const IPFS_GATEWAY = "http://localhost:8080/ipfs/";

export default function PropertyInfoPage() {
  const params = useParams();
  const propertyId = Number(params.id);

  const [loadingInfo, setLoadingInfo] = useState(false);
  const [loadingExtra, setLoadingExtra] = useState(false);

  const [property, setProperty] = useState<any>(null);
  const [ownerUser, setOwnerUser] = useState<any>(null);

  const [previousOwner, setPreviousOwner] = useState<any>(null);
  const [previousOwnerUser, setPreviousOwnerUser] = useState<any>(null);

  const [historyWithUsers, setHistoryWithUsers] = useState<any[]>([]);

  const [infoLoaded, setInfoLoaded] = useState(false);
  const [extraLoaded, setExtraLoaded] = useState(false);

  const [error, setError] = useState("");

  function formatDate(ts: number) {
    if (!ts || ts === 0) return "—";
    return new Date(ts * 1000).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  }

  // LOAD BASIC INFO
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

  // LOAD EXTRA INFO
  async function loadExtraDetails() {
    try {
      setLoadingExtra(true);

      const prev = await getPreviousOwner(propertyId);
      let prevUser = null;

      if (prev?.previousOwner)
        prevUser = await getUserByAddress(prev.previousOwner);

      const hist = await getOwnershipHistory(propertyId);

      const histUsers: any[] = [];
      for (const h of hist) {
        const prevU = h.previousOwner
          ? await getUserByAddress(h.previousOwner)
          : null;
        const newU = h.newOwner
          ? await getUserByAddress(h.newOwner)
          : null;

        histUsers.push({
          ...h,
          previousOwnerUser: prevU,
          newOwnerUser: newU,
        });
      }

      setPreviousOwner(prev);
      setPreviousOwnerUser(prevUser);
      setHistoryWithUsers(histUsers);
      setExtraLoaded(true);
    } catch (err) {
      console.error(err);
      alert("Failed to load ownership history.");
    } finally {
      setLoadingExtra(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto mt-10 space-y-10 pb-10 text-white">

      {/* ---------------------- PROPERTY OVERVIEW ---------------------- */}
      <Card className="border border-white/10 bg-[#0c0f1a]/90 rounded-2xl shadow-xl backdrop-blur">
        <CardContent className="p-8 space-y-6">
          <h2 className="text-3xl font-bold text-[#F5C542] flex items-center gap-2">
            <FileBadge className="w-7 h-7 text-[#F5C542]" /> Property Overview
          </h2>

          <p className="text-gray-300 text-lg flex items-center gap-2">
            <Fingerprint className="w-5 h-5 text-[#F5C542]" />
            <b className="text-[#F5C542]">Property ID:</b> {propertyId}
          </p>

          {!infoLoaded && (
            <button
              onClick={loadPropertyInfo}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition flex items-center gap-2 shadow-md"
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

      {/* ---------------------- PROPERTY DETAILS ---------------------- */}
      {infoLoaded && property && (
        <Card className="border border-white/10 bg-[#0c0f1a]/90 rounded-2xl shadow-xl backdrop-blur">
          <CardContent className="p-8 space-y-8">
            <h2 className="text-2xl font-bold text-[#F5C542] flex items-center gap-2">
              <FileBadge className="w-6 h-6 text-[#F5C542]" /> Property Information
            </h2>

            {/* CID */}
            <div className="space-y-1">
              <p className="text-gray-200 flex items-center gap-2">
                <Fingerprint className="w-5 h-5 text-[#F5C542]" />
                <b className="text-[#F5C542]">CID:</b> {property.cid}
              </p>

              {property.cid && (
                <a
                  href={`${IPFS_GATEWAY}${property.cid}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 transition rounded-md text-sm"
                >
                  Open in IPFS <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </div>

            {/* OWNER DETAILS */}
            <div className="p-5 rounded-xl bg-white/10 border border-white/20">
              <p className="font-semibold text-lg mb-2 text-[#F5C542] flex items-center gap-2">
                <Users className="w-5 h-5 text-[#F5C542]" /> Current Owner
              </p>

              <p className="text-gray-300">
                <b className="text-[#F5C542]">Name:</b> {ownerUser?.username || "N/A"}
              </p>
              <p className="text-gray-300">
                <b className="text-[#F5C542]">PAN:</b> {ownerUser?.pan || "N/A"}
              </p>
              <p className="text-gray-300 break-all flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-[#F5C542]" />
                <b className="text-[#F5C542]">Wallet:</b> {property.owner}
              </p>
            </div>

            {/* DATES */}
            <div className="space-y-2 text-gray-300">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[#F5C542]" />
                <b className="text-[#F5C542]">Registered At:</b> {formatDate(property.registeredAt)}
              </div>

              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[#F5C542]" />
                <b className="text-[#F5C542]">Last Transfer:</b> {formatDate(property.dateOfLastTransfer)}
              </div>

              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[#F5C542]" />
                <b className="text-[#F5C542]">Ownership Change:</b> {formatDate(property.dateOfOwnershipChange)}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ---------------------- LOAD EXTRA DETAILS BUTTON ---------------------- */}
      {infoLoaded && !extraLoaded && (
        <div className="text-center">
          <button
            onClick={loadExtraDetails}
            className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition flex items-center justify-center gap-2 shadow-md"
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

      {/* ---------------------- PREVIOUS OWNER ---------------------- */}
      {extraLoaded && (
        <>
          <Card className="border border-white/10 bg-[#0c0f1a]/90 rounded-2xl shadow-xl backdrop-blur">
            <CardContent className="p-8 space-y-5">
              <h2 className="text-2xl font-bold text-[#F5C542] flex items-center gap-2">
                <Users className="w-6 h-6 text-[#F5C542]" /> Previous Owner
              </h2>

              <div className="p-5 rounded-xl bg-white/10 border border-white/20">
                {previousOwnerUser ? (
                  <>
                    <p className="text-gray-200">
                      <b className="text-[#F5C542]">Name:</b> {previousOwnerUser.username}
                    </p>
                    <p className="text-gray-200">
                      <b className="text-[#F5C542]">PAN:</b> {previousOwnerUser.pan}
                    </p>
                    <p className="text-gray-200 break-all">
                      <b className="text-[#F5C542]">Wallet:</b> {previousOwner.previousOwner}
                    </p>
                  </>
                ) : (
                  <p className="text-gray-300 italic">
                    Contract is registered (no previous seller)
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 text-gray-300">
                <Calendar className="w-5 h-5 text-[#F5C542]" />
                <b className="text-[#F5C542]">Transfer Date:</b>{" "}
                {previousOwner?.transferDate
                  ? formatDate(previousOwner.transferDate)
                  : "N/A"}
              </div>
            </CardContent>
          </Card>

          {/* ---------------------- OWNERSHIP HISTORY ---------------------- */}
          <Card className="rounded-2xl bg-white shadow-xl border border-gray-300">
            <CardContent className="p-8 space-y-8 text-black">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <ArrowLeftRight className="w-6 h-6 text-black" /> Ownership History
              </h2>

              {historyWithUsers.length === 0 && (
                <p className="text-gray-600 text-center">No ownership history available.</p>
              )}

              {historyWithUsers.map((h, index) => (
                <div
                  key={index}
                  className="p-6 rounded-xl bg-gray-50 border border-gray-300 shadow-sm"
                >
                  <p className="text-lg font-semibold text-gray-800 mb-4">
                    Transfer #{index + 1}
                  </p>

                  <div className="grid grid-cols-2 gap-6 items-start relative">

                    {/* SELLER (left) */}
                    <div className="space-y-1">
                      <p className="font-semibold text-red-700">Seller (Previous Owner)</p>

                      {h.previousOwnerUser ? (
                        <>
                          <p><b>Name:</b> {h.previousOwnerUser.username}</p>
                          <p><b>PAN:</b> {h.previousOwnerUser.pan}</p>
                          <p className="break-all text-sm text-gray-600">
                            <b>Wallet:</b> {h.previousOwner}
                          </p>
                        </>
                      ) : (
                        <p className="italic text-gray-700">
                          Contract is registered (no previous seller)
                        </p>
                      )}
                    </div>

                    {/* BUYER (right) */}
                    <div className="text-right space-y-1">
                      <p className="font-semibold text-green-700">Buyer (New Owner)</p>
                      <p><b>Name:</b> {h.newOwnerUser?.username || "N/A"}</p>
                      <p><b>PAN:</b> {h.newOwnerUser?.pan || "N/A"}</p>
                      <p className="break-all text-sm text-gray-600">
                        <b>Wallet:</b> {h.newOwner}
                      </p>
                    </div>

                    <div className="absolute left-1/2 top-0 h-full w-[1px] bg-gray-300 -translate-x-1/2"></div>
                  </div>

                  <p className="text-center mt-6 text-gray-700 flex items-center justify-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-700" />
                    <b>Date:</b> {formatDate(h.transferDate)}
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
