import { BrowserProvider } from "ethers";

/**
 Sepolia Testnet configuration**/
export const SEPOLIA_CHAIN_ID_HEX = "0xaa36a7"; // Sepolia in hex
export const SEPOLIA_CHAIN_ID_DEC = BigInt(11155111); // Sepolia as bigint

/**
 *  Listen for network or account changes
 * This ensures the dApp reloads and rebinds to the correct provider.
 */
if (typeof window !== "undefined" && window.ethereum) {
  const ethereum = window.ethereum;

  ethereum.on("chainChanged", (chainId: string) => {
    console.log(`🔄 Network changed to ${chainId}. Reloading app...`);
    window.location.reload();
  });

  ethereum.on("accountsChanged", (accounts: string[]) => {
    console.log("👤 Accounts changed:", accounts);
    window.location.reload();
  });
}

let cachedProvider: BrowserProvider | null = null;

export async function getSigner() {
  if (typeof window === "undefined" || !window.ethereum) {
    throw new Error("MetaMask not detected. Please install MetaMask and try again.");
  }

  const ethereum = window.ethereum;

  // Request wallet connection
  await ethereum.request({ method: "eth_requestAccounts" });

  // Reuse cached provider if valid
  const provider = cachedProvider ?? new BrowserProvider(ethereum);
  cachedProvider = provider;

  const network = await provider.getNetwork();

  if (BigInt(network.chainId) !== SEPOLIA_CHAIN_ID_DEC) {
    try {
      console.warn(`⚠️ Wrong network (${network.chainId}). Switching to Sepolia...`);
      await ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: SEPOLIA_CHAIN_ID_HEX }],
      });
      window.location.reload();
    } catch (switchError: any) {
      console.error(" Failed to switch network:", switchError);
      throw new Error("Please switch MetaMask network to Sepolia Testnet to continue.");
    }
  }

  return provider.getSigner();
}

/**
 * Get currently connected account address
 */
export async function getAccount(): Promise<string> {
  if (typeof window === "undefined" || !window.ethereum) {
    throw new Error("MetaMask not detected. Please install MetaMask and try again.");
  }

  const ethereum = window.ethereum;
  const accounts: string[] = await ethereum.request({ method: "eth_requestAccounts" });

  if (!accounts || accounts.length === 0) {
    throw new Error("No Ethereum accounts found. Please connect MetaMask.");
  }

  return accounts[0];
}

/**
 * Get current network chain ID
 */
export async function getNetwork(): Promise<string> {
  if (typeof window === "undefined" || !window.ethereum) {
    throw new Error("MetaMask not detected.");
  }

  const provider = new BrowserProvider(window.ethereum);
  const network = await provider.getNetwork();
  return `Connected to chain ${network.chainId.toString()}`;
}
