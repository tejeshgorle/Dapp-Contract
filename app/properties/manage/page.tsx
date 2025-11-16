"use client";

import { useEffect, useState } from "react";
import { getSigner } from "@/utils/web3";

import {
  getUserProperties,
  getPropertyTransfer,
  isPropertyUnderTransfer,
  getPendingOfferForUser,
  createOffer,
  acceptOffer,
  rejectOffer,
  getContactsForWallet
} from "@/utils/contract";

export default function ManageProperties() {
  const [wallet, setWallet] = useState("");
  const [ownedProperties, setOwnedProperties] = useState<any[]>([]);
  const [sellProposals, setSellProposals] = useState<any[]>([]);
  const [buyProposals, setBuyProposals] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    try {
      const signer = await getSigner();
      const address = await signer.getAddress();
      setWallet(address);

      /* Get owned properties */
      const props = await getUserProperties(address);

      const enriched = [];
      for (const p of props) {
        const transfer = await getPropertyTransfer(p.id);
        const active = await isPropertyUnderTransfer(p.id);

        enriched.push({
          ...p,
          transfer,
          isUnderTransfer: active
        });
      }
      setOwnedProperties(enriched);

      /** BUY PROPOSALS */
      const buying = await getPendingOfferForUser(address);
      setBuyProposals(buying.map(id => ({ propertyId: id })));

      /** CONTACT LIST */
      const cl = await getContactsForWallet(address);
      setContacts(cl);

      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  }

  /* CREATE OFFER — contract expects NO buyer argument */
  async function proposeToSell(propertyId: number) {
    const price = prompt("Enter selling price (in WEI):");
    if (!price || isNaN(Number(price))) return alert("Invalid price.");

    try {
      await createOffer(propertyId, price);
      alert("Offer Created!");
      loadAll();
    } catch (err) {
      alert("Failed to create offer");
      console.error(err);
    }
  }

  async function acceptBuying(propertyId: number) {
    try {
      await acceptOffer(propertyId);
      alert("Offer accepted!");
      loadAll();
    } catch (err) {
      alert("Error accepting offer");
      console.error(err);
    }
  }

  async function rejectBuying(propertyId: number) {
    try {
      await rejectOffer(propertyId);
      alert("Offer rejected!");
      loadAll();
    } catch (err) {
      alert("Error rejecting offer");
      console.error(err);
    }
  }

  /** DIALOG OPEN FIX */
  function openDialog(id: number) {
    const dlg = document.getElementById(`dlg-${id}`) as HTMLDialogElement;
    dlg?.showModal();
  }

  function closeDialog(id: number) {
    const dlg = document.getElementById(`dlg-${id}`) as HTMLDialogElement;
    dlg?.close();
  }

  if (loading) return <p className="text-white p-6">Loading...</p>;

  return (
    <main className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8">

      {/* LEFT SIDE */}
      <section className="space-y-8">

        {/* SELL PROPOSALS */}
        <div className="bg-[#0f1629] p-6 rounded-xl">
          <h2 className="text-white text-xl mb-4">
            🟦 Your Sell Proposals
          </h2>

          {ownedProperties.filter(p => p.isUnderTransfer).length === 0 && (
            <p className="text-gray-400">No active proposals.</p>
          )}

          {ownedProperties
            .filter(p => p.isUnderTransfer)
            .map(p => (
              <div key={p.id} className="p-4 bg-[#1b233a] rounded-lg mb-4 border border-white/10">
                <p className="text-gray-200 text-lg">Property #{p.id}</p>
                <p className="text-gray-400">
                  Buyer: {p.transfer.buyer}
                </p>
                <p className="text-gray-400">
                  Price: {String(p.transfer.price)}
                </p>

                <button
                  className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg"
                  onClick={() => rejectBuying(p.id)} // treat as cancel
                >
                  Cancel Deal
                </button>
              </div>
            ))}
        </div>

        {/* BUY PROPOSALS */}
        <div className="bg-[#0f1629] p-6 rounded-xl">
          <h2 className="text-white text-xl mb-4">
            🟩 Proposals TO YOU (Buyer)
          </h2>

          {buyProposals.length === 0 && (
            <p className="text-gray-400">No proposals.</p>
          )}

          {buyProposals.map(b => (
            <div
              className="p-4 bg-[#1b233a] rounded-lg border border-white/10 mb-4"
              key={b.propertyId}
            >
              <p className="text-gray-200 text-lg">
                Property #{b.propertyId}
              </p>

              <div className="flex gap-4 mt-3">
                <button
                  className="px-4 py-2 bg-green-600 text-white rounded-lg"
                  onClick={() => acceptBuying(b.propertyId)}
                >
                  Accept & Pay
                </button>

                <button
                  className="px-4 py-2 bg-red-600 text-white rounded-lg"
                  onClick={() => rejectBuying(b.propertyId)}
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* RIGHT SIDE */}
      <section className="space-y-8">

        {/* OWNED PROPERTIES */}
        <div className="bg-[#0f1629] p-6 rounded-xl">
          <h2 className="text-white text-xl mb-4">🏡 Your Properties</h2>

          {ownedProperties.length === 0 && (
            <p className="text-gray-400">No properties owned.</p>
          )}

          {ownedProperties.map(p => (
            <div
              className="p-4 bg-[#1b233a] border border-white/10 rounded-lg mb-4"
              key={p.id}
            >
              <p className="text-gray-200 text-lg">Property #{p.id}</p>
              <p className="text-gray-400">CID: {p.cid}</p>

              {/* Open modal */}
              <button
                className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg"
                onClick={() => openDialog(p.id)}
              >
                Propose to Sell
              </button>

              {/* CONTACT MODAL */}
              <dialog
                id={`dlg-${p.id}`}
                className="bg-[#0f1629] p-6 rounded-xl border border-white/20"
              >
                <h3 className="text-white mb-4 text-lg">
                  Choose Buyer
                </h3>

                {contacts.map(c => (
                  <button
                    key={c.wallet}
                    className="block w-full text-left px-4 py-2 bg-gray-700 text-white rounded mb-2"
                    onClick={() => {
                      closeDialog(p.id);
                      proposeToSell(p.id);
                    }}
                  >
                    {c.username} – {c.wallet}
                  </button>
                ))}

                <button
                  className="mt-4 px-4 py-2 bg-red-500 text-white rounded"
                  onClick={() => closeDialog(p.id)}
                >
                  Close
                </button>
              </dialog>
            </div>
          ))}
        </div>

        {/* CONTACT LIST */}
        <div className="bg-[#0f1629] p-6 rounded-xl">
          <h2 className="text-white text-xl mb-4">📒 Your Contacts</h2>

          {contacts.length === 0 && (
            <p className="text-gray-400">You have no saved contacts.</p>
          )}

          {contacts.map(c => (
            <div
              key={c.wallet}
              className="p-3 bg-[#1b233a] rounded-lg border border-white/10 mb-2"
            >
              {c.username} — {c.wallet}
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
