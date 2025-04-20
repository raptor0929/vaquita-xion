"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import WithdrawModal from "@/components/withdraw-modal"
import TransactionDetails from "@/components/transaction-details"
import { Button as AbstraxionButton } from "@burnt-labs/ui";
import { cn } from "@/lib/utils"

// import Link from "next/link";
import {
  Abstraxion,
  useAbstraxionAccount,
  useAbstraxionSigningClient,
  useAbstraxionClient,
  useModal
} from "@burnt-labs/abstraxion";
// import { Button } from "@burnt-labs/ui";
// import "@burnt-labs/ui/dist/index.css";
import type { ExecuteResult } from "@cosmjs/cosmwasm-stargate";
import { Button } from "@/components/ui/button"

const contractAddress = "xion1huwf4ymlcdchl0y44f6qhlrdpp943m2pz8qtssfvt805rjfr0s0qh7zd7c";
const treasuryAddress = "xion1gu5kdeglgpy76pfxy5g9ckaf8wen7esjyz8yvy3wv6x87h3r0s0q3ps72s";

type ExecuteResultOrUndefined = ExecuteResult | undefined;

export default function Home() {
  const [cowCount, setCowCount] = useState(0)
  const [amount, setAmount] = useState("0")
  const [showModal, setShowModal] = useState(false)
  const [showTransactionDetails, setShowTransactionDetails] = useState(false)
  const [contractBalance, setContractBalance] = useState(0)
  const [transactionHash, setTransactionHash] = useState("")
  const [blockHeight, setBlockHeight] = useState(0)

  // Abstraxion hooks
  const { data: account } = useAbstraxionAccount();
  const { client, signArb, logout } = useAbstraxionSigningClient();
  const { client: queryClient } = useAbstraxionClient();

  // State variables
  const [balance, setBalance] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [executeResult, setExecuteResult] = useState<ExecuteResultOrUndefined>(undefined);
  const [, setShowAbstraxionModal]: [boolean, React.Dispatch<React.SetStateAction<boolean>>] = useModal();

  const blockExplorerUrl = `https://www.mintscan.io/xion-testnet/tx/${executeResult?.transactionHash}`;

  // Fetch the contract balance from the smart contract
  const getBalance = async () => {
    try {
      const response = await queryClient?.queryContractSmart(contractAddress, { get_balance: { address: account?.bech32Address } });
      setBalance(response?.balance?.[0]?.amount || "0");
      console.log("Get Balance:", response);
    } catch (error) {
      console.error("Error querying contract:", error);
    }
  };

  const deposit = async () => {
    setLoading(true);
    const depositAmount = Number.parseInt(amount)
    console.log("Deposit amount:", depositAmount)
    if (isNaN(depositAmount) || depositAmount <= 0) return

    const msg = { deposit: {} };

    try {
      // Make sure to send funds with the deposit message
      // The contract requires funds to be sent using must_pay, which fails if no funds are sent
      const res = await client?.execute(
        account.bech32Address, 
        contractAddress, 
        msg, 
        {
          gas: "500000",
          granter: treasuryAddress,
          amount: [{
            denom: "uxion",
            amount: "5000"
          }]
        },
        "",      // Empty memo
        [{      // Explicitly pass funds as the 6th parameter
          denom: "uxion",
          amount: depositAmount.toString()
        }]
      );
      setExecuteResult(res);
      setCowCount(cowCount + 1)
      console.log("Deposit successful:", res);
      await getBalance(); // Refresh balance after successful deposit
    } catch (error) {
      console.error("Error executing deposit:", error);
      alert(`Deposit failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  const withdraw = async () => {
    setLoading(true);
    const msg = { withdraw: {} };

    try {
      const res = await client?.execute(account.bech32Address, 
        contractAddress, 
        msg, 
        {
          gas: "500000",
          granter: treasuryAddress,
          amount: [{
            denom: "uxion",
            amount: "5000"
          }]
        },
        "",
        []
      );
      setExecuteResult(res);
      setCowCount(cowCount - 1)
      console.log("Withdrawal successful:", res);
      await getBalance(); // Refresh balance after successful withdrawal
    } catch (error) {
      console.error("Error executing withdrawal:", error);
    } finally {
      setLoading(false);
      setShowModal(false);
    }
  };

  // Fetch balances on page load or when account/client changes
  useEffect(() => {
    if (queryClient && account?.bech32Address) {
      getBalance();
    }
  }, [queryClient, account]);

  const handleDeposit = () => {
    // Simulate deposit transaction
    const depositAmount = Number.parseInt(amount)
    if (isNaN(depositAmount) || depositAmount <= 0) return

    setCowCount(4) // Increase cow count
    setContractBalance((prev) => prev + depositAmount)
    setTransactionHash("5BFF8BAE16E525E4BF4ABC6D18CAD30AC13FC2008095ADBD01B30A7C91BE13A5")
    setBlockHeight(2453638)
    setShowTransactionDetails(true)
  }

  const handleWithdraw = () => {
    // Simulate withdraw transaction
    setCowCount(3) // Decrease cow count
    setContractBalance((prev) => Math.max(0, prev - 1000))
    setTransactionHash("7CFF9BAE16E525E4BF4ABC6D18CAD30AC13FC2008095ADBD01B30A7C91BE13C7")
    setBlockHeight(2453639)
    setShowTransactionDetails(true)
    setShowModal(false)
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-black text-white">
      <h1 className="text-2xl font-bold tracking-tighter text-white">VAQUITA-XION</h1>
      <Abstraxion onClose={() => setShowAbstraxionModal(false)} />
      { !account?.bech32Address ? (
        <>
      <Button onClick={() => setShowAbstraxionModal(true)}>
        CONNECT
      </Button>
      </>
      ) : (
      <>
      <div className="w-full max-w-md rounded-3xl p-6 relative">
      {/* <AbstraxionButton fullWidth onClick={() => setShowAbstraxionModal(true)} structure="base">
        VIEW ACCOUNT
      </AbstraxionButton> */}
        {/* Cow Field */}
        <div
          className="w-full border border-white rounded-xl mb-4 overflow-hidden cursor-pointer relative"
          style={{ height: "300px" }}
          onClick={() => setShowModal(true)}
        >
          <div className="relative w-full h-full bg-[#86b336]">
            <Image
              src="/images/three-cows.png"
              alt="Cow field with three cows"
              fill
              sizes="(max-width: 768px) 100vw, 400px"
              style={{ 
                objectFit: "contain",
                objectPosition: "center center",
                opacity: cowCount === 0 ? 1 : 0,
                transition: "opacity 0.5s ease"
              }}
              priority
            />
            <Image
              src="/images/four-cows.png"
              alt="Cow field with four cows"
              fill
              sizes="(max-width: 768px) 100vw, 400px"
              style={{ 
                objectFit: "contain",
                objectPosition: "center center",
                opacity: cowCount === 1 ? 1 : 0,
                transition: "opacity 0.5s ease"
              }}
              priority
            />
          </div>
        </div>

        {/* Info Boxes */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="p-2">
            <p className="text-sm mb-1">Duration:</p>
            <div className="border border-white bg-black text-white rounded-lg p-2 text-center font-bold">3 MONTHS</div>
          </div>
          <div className="p-2">
            <p className="text-sm mb-1">Number of deposits</p>
            <div className="border border-white bg-black text-white rounded-lg p-2 text-center font-bold">
              🐄 {cowCount + 3}
            </div>
          </div>
        </div>

        {/* Deposit Section */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="p-2">
            <p className="text-sm mb-1">Amount in uxion:</p>
            <input
              type="text"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-white text-black rounded-lg p-2 text-center font-bold"
            />
          </div>
          <div className="p-2">
            <p className="text-sm mb-1">&nbsp;</p>
            <button 
              onClick={deposit} 
              className="w-full bg-green-600 text-white border border-white rounded-lg p-2 text-center font-bold hover:bg-green-700 transition-colors"
            >
              {loading ? "LOADING..." : "DEPOSIT"}
            </button>
          </div>
        </div>

        {/* Transaction Details */}
        <div className="h-[215px]">
          {executeResult ? (
            <TransactionDetails
              contractBalance={Number.parseInt(balance || "0")}
              transactionHash={executeResult.transactionHash}
              blockHeight={executeResult.height}
              blockExplorerUrl={blockExplorerUrl}
            />
          ) : (
            <div className="mt-4 space-y-4">
              {/* Placeholder Contract Balance */}
              <div className="bg-black border border-black rounded-lg p-4 text-center">
                <h3 className="font-bold mb-2 text-black">Contract Balance</h3>
                <p className="text-black">-- uxion</p>
              </div>
              
              {/* Placeholder Transaction Details */}
              <div className="bg-black border border-black rounded-lg p-4">
                <div className="mb-2">
                  <h4 className="text-black">Transaction Hash</h4>
                  <p className="text-xs text-black">--</p>
                </div>
                <div>
                  <h4 className="text-black">Block Height:</h4>
                  <p className="text-black">--</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Withdraw Modal */}
      {showModal && (
        <WithdrawModal 
          onClose={() => setShowModal(false)} 
          onWithdraw={withdraw} 
          amount={Number.parseInt(amount)}
          buttonStyle="bg-red-600 text-white border border-white hover:bg-red-700 transition-colors" 
          loading={loading}
        />
      )}
      </>
      )}
    </main>
  )
}
