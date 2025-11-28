import { Contract, InfuraProvider, type Provider, type Signer, ethers } from "ethers";
import { getSigner } from "./web3";
import { CONTRACT_ADDRESS, INFURA_PROJECT_KEY, NETWORK_NAME } from "./keyConstants";
import { abi as registryAbi } from "./contractConfig";

/* --------------------------------------------------
   PROVIDER + CONTRACT INSTANCE
----------------------------------------------------- */
const provider = new InfuraProvider(NETWORK_NAME as any, INFURA_PROJECT_KEY);

export function getContract(signerOrProvider?: Signer | Provider): Contract {
  return new Contract(CONTRACT_ADDRESS!, registryAbi, signerOrProvider ?? provider);
}

/* --------------------------------------------------
   HELPERS
----------------------------------------------------- */
export function toBytes32String(input: string): string {
  return ethers.encodeBytes32String(input);
}

export function fromBytes32String(b32: string): string {
  try {
    return ethers.decodeBytes32String(b32);
  } catch {
    return String(b32);
  }
}


export function ipfsCidToBytes32Hash(cid: string): string {
  return ethers.keccak256(ethers.toUtf8Bytes(cid));
}

/* --------------------------------------------------
   USERS
----------------------------------------------------- */
export async function registerUser(username: string, panNumber: string) {
  const signer = await getSigner();
  const contract = getContract(signer);

  const tx = await contract.registerUser(
    toBytes32String(username),
    toBytes32String(panNumber)
  );
  return tx.wait();
}

export async function isRegisteredUser(addr: string): Promise<boolean> {
  const contract = getContract();
  return contract.isUserRegistered(addr);
}

export async function isCurrentUserRegistered(): Promise<boolean> {
  const signer = await getSigner();
  const addr = await signer.getAddress();
  return isRegisteredUser(addr);
}

export async function getUserByAddress(addr: string) {
  const contract = getContract();

  try {
    const u: any = await contract.fetchUserDetail(addr);

    if (!(u.exists ?? u[3])) return null;

    return {
      username: fromBytes32String(u.username ?? u[0]),
      pan: fromBytes32String(u.panHash ?? u[1]),
      wallet: String(u.wallet ?? u[2]),
      exists: Boolean(u.exists ?? u[3])
    };
  } catch {
    return null;
  }
}

/* --------------------------------------------------
   CONTACTS
----------------------------------------------------- */
export async function addContactByAddress(contactAddr: string) {
  const signer = await getSigner();
  const contract = getContract(signer);
  return (await contract.addToMyContacts(contactAddr)).wait();
}

export async function getContactsForWallet(walletAddr: string) {
  const contract = getContract();
  const contacts: any[] = await contract.fetchMyContacts(walletAddr);

  return contacts.map((u: any) => ({
    username: fromBytes32String(u.username ?? u[0]),
    pan: fromBytes32String(u.panHash ?? u[1]),
    wallet: String(u.wallet ?? u[2]),
    exists: Boolean(u.exists ?? u[3])
  }));
}

/* --------------------------------------------------
   MULTI-PARTY CONTRACTS
----------------------------------------------------- */

export async function createMPContract(ipfsCID: string, partyAddresses: string[]) {
  const signer = await getSigner();
  const contract = getContract(signer);

  return (
    await contract.createContract(ipfsCID, partyAddresses)
  ).wait();
}

export async function signMPContract(contractId: number) {
  const signer = await getSigner();
  const contract = getContract(signer);
  return (await contract.signContract(contractId)).wait();
}

export async function denyMPContract(contractId: number) {
  const signer = await getSigner();
  const contract = getContract(signer);
  return (await contract.denyContract(contractId)).wait();
}

export async function cancelMPContract(contractId: number) {
  const signer = await getSigner();
  const contract = getContract(signer);
  return (await contract.cancelContract(contractId)).wait();
}

/* --------------------------------------------------
   CONTRACT INFO
----------------------------------------------------- */
export async function getContractStatus(contractId: number) {
  const contract = getContract();
  const info = await contract.retrieveContractInfo(contractId);
  return Number(info[4]);
}

export async function getContractSigningProgress(contractId: number) {
  const contract = getContract();
  const info = await contract.retrieveContractInfo(contractId);

  return {
    total: info[3].length,
    signed: Number(info[5])
  };
}

export async function getUserContractState(contractId: number, user: string) {
  const contract = getContract();

  if (await contract.hasUserSigned(contractId, user)) return "SIGNED";
  if (await contract.hasUserDenied(contractId, user)) return "DENIED";

  return "PENDING";
}

export async function hasUserSigned(contractId: number, addr: string) {
  const contract = getContract();
  return contract.hasUserSigned(contractId, addr);
}

export async function hasUserDenied(contractId: number, addr: string) {
  const contract = getContract();
  return contract.hasUserDenied(contractId, addr);
}

export async function getContractInfo(contractId: number) {
  const contract = getContract();
  const info = await contract.retrieveContractInfo(contractId);

  return {
    id: Number(info[0]),
    cid: String(info[1]),          
    creator: String(info[2]),
    signers: info[3].map((s: string) => String(s)),
    status: Number(info[4]),
    signedCount: Number(info[5])
  };
}

/* --------------------------------------------------
   CONTRACT ENUMERATORS
----------------------------------------------------- */
export async function getContractsWhereUserIsParty(wallet: string) {
  const contract = getContract();
  const ids: bigint[] = await contract.getContractsWhereUserIsParty(wallet);

  return ids.map(id => Number(id));
}

export async function getFullContractsWhereUserIsParty(wallet: string) {
  const ids = await getContractsWhereUserIsParty(wallet);
  return Promise.all(ids.map(id => getContractInfo(id)));
}

export async function getMyPendingContracts() {
  const signer = await getSigner();
  const addr = await signer.getAddress();

  const ids = await getContractsWhereUserIsParty(addr);
  const contracts = await Promise.all(ids.map(id => getContractInfo(id)));

  return contracts.filter(c => c.status === 0);
}

/* --------------------------------------------------
   PROPERTIES — CORE
----------------------------------------------------- */

export async function registerProperty(ipfsCID: string) {
  const signer = await getSigner();
  const contract = getContract(signer);

  const tx = await contract.registerProperty(ipfsCID);
  return tx.wait();
}

export async function getUserProperties(ownerAddress: string) {
  const contract = getContract();
  const props: any[] = await contract.retrieveUserProperties(ownerAddress);

  return props.map((p: any) => ({
    id: Number(p.id ?? p[0]),
    cid: p.cid ?? p[1],
    owner: String(p.owner ?? p[2]),
    registeredAt: Number(p.registeredAt ?? p[3]),
    dateOfLastTransfer: Number(p.dateOfLastTransfer ?? p[4]),
    dateOfOwnershipChange: Number(p.dateOfOwnershipChange ?? p[5]),
    exists: Boolean(p.exists ?? p[6])
  }));
}

/** FULL PROPERTY INFO w/ HISTORY */
export async function getPropertyInfo(propertyId: number) {
  if (isNaN(propertyId)) throw new Error("Invalid propertyId");

  const contract = getContract();

  const [
    id,
    cid,
    owner,
    registeredAt,
    dateOfLastTransfer,
    dateOfOwnershipChange
  ] = await contract.retrievePropertyInfo(propertyId);

  return {
    id: Number(id),
    cid: String(cid),
    owner: String(owner),
    registeredAt: Number(registeredAt),
    dateOfLastTransfer: Number(dateOfLastTransfer),
    dateOfOwnershipChange: Number(dateOfOwnershipChange)
  };
}


export async function getPreviousOwner(propertyId: number) {
  if (isNaN(propertyId)) throw new Error("Invalid propertyId");

  const contract = getContract();

  const [previousOwner, transferDate] =
    await contract.getPreviousOwner(propertyId);

  return {
    previousOwner: String(previousOwner),
    transferDate: Number(transferDate)
  };
}

export async function getOwnershipHistory(propertyId: number) {
  if (isNaN(propertyId)) throw new Error("Invalid propertyId");

  const contract = getContract();

  const history = await contract.getOwnershipHistory(propertyId);

  return history.map((h: any) => ({
    previousOwner: String(h.previousOwner ?? h[0]),
    newOwner: String(h.newOwner ?? h[1]),
    transferDate: Number(h.transferDate ?? h[2])
  }));
}


/* --------------------------------------------------
   PROPERTIES — TRANSFERS (OWNERSHIP TRANSFER)
----------------------------------------------------- */

export async function directTransferOwnership(propertyId: number, newOwner: string) {
  try {
    const signer = await getSigner();
    const contract = getContract(signer);

    // Execute the transaction
   const tx = await contract["transferOwnership(uint256,address)"](propertyId, newOwner);
    console.log("Transfer TX sent:", tx.hash);

    // Wait for confirmation
    const receipt = await tx.wait();
    console.log("Transfer confirmed:", receipt.transactionHash);

    return {
      success: true,
      txHash: receipt.transactionHash,
    };

  } catch (error: any) {
    console.error("Transfer failed:", error);
    return {
      success: false,
      error: error?.reason || error?.message || "Unknown error",
    };
  }
}
/* --------------------------------------------------
   PROPERTIES — TRANSFERS (ESCROW)
----------------------------------------------------- */


export type TxResult = { success: true; txHash?: string; receipt?: any } | { success: false; error: any };
export enum SaleStatus {
  NONE = 0,            // No sale exists
  INITIATED = 1,       // Seller proposed sale, buyer not accepted yet
  ACCEPTED = 2,        // Buyer accepted, waiting for payment
  PAID = 3,            // Buyer paid, funds locked in escrow
  COMPLETED = 4,       // Seller finalized transfer
  DENIED_BY_BUYER = 5, // Buyer declined
  CANCELLED = 6        // Seller cancelled before payment
}

export interface SaleData {
  propertyId: number;
  seller: string;
  buyer: string;
  price: bigint;
  status: SaleStatus;
  initiatedAt: number;
}

/** Utility: convert any numeric input to bigint for contract calls */
function toBigInt(value: number | string | bigint): bigint {
  if (typeof value === "bigint") return value;
  if (typeof value === "number") return BigInt(value);
  // string
  if (/^\d+$/.test(value)) return BigInt(value);
  // allow decimal ETH strings? Not converting — expect wei string or integer
  throw new Error("price must be integer (wei) as number|string|bigint");
}

export async function proposePropertySale(
  propertyId: number,
  priceWei: number | string | bigint,
  buyerAddress: string
): Promise<TxResult> {
  try {
    const signer = await getSigner();
    const contract = getContract(signer);

    const price = toBigInt(priceWei);

    // Call contract: ensure argument order matches ABI (propertyId, price, buyer)
    const tx = await contract.proposePropertySale(propertyId, price, buyerAddress);
    const receipt = await tx.wait();
    return { success: true, txHash: tx.hash, receipt };
  } catch (error) {
    console.error("proposePropertySale failed:", error);
    return { success: false, error };
  }
}

// -----------------------------
// Buyer: fetch incoming sale propertyIds (buyer => propertyIds[])
// -----------------------------
export async function getIncomingSaleRequests(buyerAddress: string): Promise<number[]> {
  try {
    const contract = getContract();
    const ids: any[] = await contract.getIncomingSaleRequests(buyerAddress);
    // ids will be BigInts or strings depending on provider; map to numbers for UI
    return ids.map((i: any) => Number(i));
  } catch (error) {
    console.error("getIncomingSaleRequests failed:", error);
    return [];
  }
}


export async function getOutgoingSaleRequests(seller: string): Promise<number[]> {
  try {
    const contract = getContract(); // read-only

    const result: bigint[] = await contract.getOutgoingSaleRequests(seller);

    // Convert bigint → number
    return result.map(id => Number(id));
  } catch (error) {
    console.error("getOutgoingSaleRequests failed:", error);
    return [];
  }
}
export async function getSaleDetails(propertyId: number): Promise<SaleData | null> {
  try {
    const contract = getContract();

    let s: any;
    // Prefer explicit getter if available
    if (typeof contract.getPropertySaleDetails === "function") {
      s = await contract.getPropertySaleDetails(propertyId);
    } else {
      // fallback to public mapping accessor (if ABI exposes it)
      s = await contract.sales(propertyId);
    }

    // Some getters return struct with numeric fields as BigInt; normalize:
    if (!s) return null;

    return {
      propertyId: Number(s.propertyId ?? propertyId),
      seller: String(s.seller),
      buyer: String(s.buyer),
      price: BigInt(s.price ?? 0),
      status: Number(s.status ?? 0),
      initiatedAt: Number(s.initiatedAt ?? 0)
    };
  } catch (error) {
    console.error("getSaleDetails failed:", error);
    return null;
  }
}




// -----------------------------
// Buyer: Accept sale (marks intent). Solidity: buyerAcceptSale(propertyId)
// -----------------------------
export async function buyerAcceptSale(propertyId: number): Promise<TxResult> {
  try {
    const signer = await getSigner();
    const contract = getContract(signer);

    const tx = await contract.buyerAcceptSale(propertyId);
    const receipt = await tx.wait();
    return { success: true, txHash: tx.hash, receipt };
  } catch (error) {
    console.error("buyerAcceptSale failed:", error);
    return { success: false, error };
  }
}

// -----------------------------
// Buyer: Decline sale. Solidity: buyerDeclineSale(propertyId)
// -----------------------------
export async function buyerDeclineSale(propertyId: number): Promise<TxResult> {
  try {
    const signer = await getSigner();
    const contract = getContract(signer);

    const tx = await contract.buyerDeclineSale(propertyId);
    const receipt = await tx.wait();
    return { success: true, txHash: tx.hash, receipt };
  } catch (error) {
    console.error("buyerDeclineSale failed:", error);
    return { success: false, error };
  }
}

// -----------------------------
// Buyer: Pay (escrow) — send exact wei amount. Solidity: buyerPay(propertyId) payable
// -----------------------------
export async function buyerPay(propertyId: number): Promise<TxResult> {
  try {
    const signer = await getSigner();
    const contract = getContract(signer);

    // Correct getter
    const sale = await contract.getPropertySaleDetails(propertyId);

    // Extract exact price (Wei)
    const price = sale.price;

    // Buyer pays EXACT Wei price
    const tx = await contract.buyerPay(propertyId, { value: price });
    const receipt = await tx.wait();

    return { success: true, txHash: tx.hash, receipt };
  } catch (error) {
    console.error("buyerPay failed:", error);
    return { success: false, error };
  }
}



// -----------------------------
// Seller: Cancel sale (before payment). Solidity: sellerCancelSale(propertyId)
// -----------------------------
export async function sellerCancelSale(propertyId: number): Promise<TxResult> {
  try {
    const signer = await getSigner();
    const contract = getContract(signer);

    const tx = await contract.sellerCancelSale(propertyId);
    const receipt = await tx.wait();
    return { success: true, txHash: tx.hash, receipt };
  } catch (error) {
    console.error("sellerCancelSale failed:", error);
    return { success: false, error };
  }
}

// -----------------------------
// Seller: Finalize sale — transfer ownership + release escrow. Solidity: finalizeSale(propertyId)
// -----------------------------
export async function finalizeSale(propertyId: number): Promise<TxResult> {
  try {
    const signer = await getSigner();
    const contract = getContract(signer);

    const tx = await contract.finalizeSale(propertyId);
    const receipt = await tx.wait();
    return { success: true, txHash: tx.hash, receipt };
  } catch (error) {
    console.error("finalizeSale failed:", error);
    return { success: false, error };
  }
}











/* --------------------------------------------------
   ADMIN
----------------------------------------------------- */
export async function getUserCount() {
  const contract = getContract();
  const arr: any[] = await contract.fetchAllUsers();
  return arr.length;
}

export async function getAllUsers() {
  const contract = getContract();
  const arr: any[] = await contract.fetchAllUsers();

  return arr.map(u => ({
    username: fromBytes32String(u.username ?? u[0]),
    pan: fromBytes32String(u.panHash ?? u[1]),
    wallet: String(u.wallet ?? u[2]),
    exists: Boolean(u.exists ?? u[3])
  }));
}

export async function getContactsForUserByWallet(walletAddr: string) {
  return getContactsForWallet(walletAddr);
}
