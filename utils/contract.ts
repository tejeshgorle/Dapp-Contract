// utils/contract.ts
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
   PROPERTIES
----------------------------------------------------- */
export async function registerProperty(ipfsCID: string) {
  const signer = await getSigner();
  const contract = getContract(signer);
  const tx = await contract.registerProperty(ipfsCidToBytes32Hash(ipfsCID));
  return tx.wait();
}

/* ⭐ FIXED: retrieveUserProperties returns struct[] */
export async function getUserProperties(ownerAddress: string) {
  const contract = getContract();
  const props: any[] = await contract.retrieveUserProperties(ownerAddress);

  return props.map((p: any) => ({
    id: Number(p.id ?? p[0]),
    cid: p.cid ?? p[1],
    owner: String(p.owner ?? p[2]),
    exists: Boolean(p.exists ?? p[3])
  }));
}

/* Single property */
export async function getProperty(propertyId: number) {
  if (isNaN(propertyId)) throw new Error("Invalid propertyId");

  const contract = getContract();
  const p: any = await contract.retrievePropertyInfo(propertyId);

  return {
    id: Number(p.id ?? p[0]),
    cid: p.cid ?? p[1],
    owner: String(p.owner ?? p[2]),
    exists: Boolean(p.exists ?? p[3])
  };
}

/* Property ownership history */
export async function getPropertyOwnershipHistory(propertyId: number) {
  const contract = getContract();
  return contract.getPropertyOwnershipHistory(propertyId);
}

/* --------------------------------------------------
   PROPERTY TRANSFERS (ESCROW)
----------------------------------------------------- */
export async function createOffer(propertyId: number, priceWei: string) {
  const signer = await getSigner();
  const contract = getContract(signer);

  return (await contract.initiatePropertyTransfer(propertyId, { value: priceWei })).wait();
}

export async function acceptOffer(propertyId: number) {
  const signer = await getSigner();
  const contract = getContract(signer);

  return (await contract.acceptPropertyTransfer(propertyId)).wait();
}

export async function rejectOffer(propertyId: number) {
  const signer = await getSigner();
  const contract = getContract(signer);

  return (await contract.denyPropertyTransfer(propertyId)).wait();
}

/* ⭐ FIXED: Struct parsing for transfers */
export async function getPropertyTransfer(propertyId: number) {
  const contract = getContract();
  const t: any = await contract.getPropertyTransfer(propertyId);

  return {
    buyer: String(t.buyer ?? t[0]),
    price: BigInt(t.price ?? t[1]),
    active: Boolean(t.active ?? t[2])
  };
}

export async function isPropertyUnderTransfer(propertyId: number) {
  const t = await getPropertyTransfer(propertyId);
  return t.active && t.price > 0;
}

/* Pending transfers per user */
export async function getPendingOfferForUser(wallet: string) {
  const contract = getContract();
  const ids: bigint[] = await contract.getPropertiesUnderTransfer(wallet);

  return ids.map(id => Number(id));
}

/* --------------------------------------------------
   MULTI-PARTY CONTRACTS
----------------------------------------------------- */
export async function createMPContract(ipfsCID: string, partyAddresses: string[]) {
  const signer = await getSigner();
  const contract = getContract(signer);

  return (
    await contract.createContract(ipfsCidToBytes32Hash(ipfsCID), partyAddresses)
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

/* Status + signing info */
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

/* --------------------------------------------------
   FULL CONTRACT INFO
----------------------------------------------------- */
export async function getContractInfo(contractId: number) {
  const contract = getContract();
  const info = await contract.retrieveContractInfo(contractId);

  return {
    id: Number(info[0]),
    cidHash: info[1],
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
