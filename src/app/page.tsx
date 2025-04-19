"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import {
  Abstraxion,
  useAbstraxionAccount,
  useAbstraxionSigningClient,
  useAbstraxionClient,
  useModal
} from "@burnt-labs/abstraxion";
import { Button } from "@burnt-labs/ui";
import "@burnt-labs/ui/dist/index.css";
import type { ExecuteResult } from "@cosmjs/cosmwasm-stargate";

const contractAddress = "xion1huwf4ymlcdchl0y44f6qhlrdpp943m2pz8qtssfvt805rjfr0s0qh7zd7c";
const treasuryAddress = "xion1gu5kdeglgpy76pfxy5g9ckaf8wen7esjyz8yvy3wv6x87h3r0s0q3ps72s";

type ExecuteResultOrUndefined = ExecuteResult | undefined;

export default function Page(): JSX.Element {
  // Abstraxion hooks
  const { data: account } = useAbstraxionAccount();
  const { client, signArb, logout } = useAbstraxionSigningClient();
  const { client: queryClient } = useAbstraxionClient();

  // State variables
  const [count, setCount] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [executeResult, setExecuteResult] = useState<ExecuteResultOrUndefined>(undefined);
  const [, setShowModal]: [boolean, React.Dispatch<React.SetStateAction<boolean>>] = useModal();

  const blockExplorerUrl = `https://www.mintscan.io/xion-testnet/tx/${executeResult?.transactionHash}`;

  // Fetch the contract balance from the smart contract
  const getBalance = async () => {
    try {
      const response = await queryClient?.queryContractSmart(contractAddress, { get_balance: { address: account?.bech32Address } });
      setCount(response?.balance?.[0]?.amount || "0");
      console.log("Get Balance:", response);
    } catch (error) {
      console.error("Error querying contract:", error);
    }
  };

  const deposit = async () => {
    setLoading(true);
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
            amount: "1000"
          }]
        },
        "",      // Empty memo
        [{      // Explicitly pass funds as the 6th parameter
          denom: "uxion",
          amount: "1000"
        }]
      );
      setExecuteResult(res);
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
            amount: "1000"
          }]
        },
        "",
        []
      );
      setExecuteResult(res);
      console.log("Withdrawal successful:", res);
      await getBalance(); // Refresh balance after successful withdrawal
    } catch (error) {
      console.error("Error executing withdrawal:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch balances on page load or when account/client changes
  useEffect(() => {
    if (queryClient && account?.bech32Address) {
      getBalance();
    }
  }, [queryClient, account]);

  return (
    <main className="m-auto flex min-h-screen max-w-xs flex-col items-center justify-center gap-4 p-4">
      <h1 className="text-2xl font-bold tracking-tighter text-white">ABSTRAXION</h1>

      <Button fullWidth onClick={() => setShowModal(true)} structure="base">
        {account?.bech32Address ? <div className="flex items-center justify-center">VIEW ACCOUNT</div> : "CONNECT"}
      </Button>

      {client && (
        <>
          <Button disabled={loading} fullWidth onClick={getBalance} structure="base">
            {loading ? "LOADING..." : "Get Balance"}
          </Button>
          <Button disabled={loading} fullWidth onClick={deposit} structure="base">
            {loading ? "LOADING..." : "DEPOSIT"}
          </Button>
          <Button disabled={loading} fullWidth onClick={withdraw} structure="base">
            {loading ? "LOADING..." : "WITHDRAW"}
          </Button>
          {logout && (
            <Button disabled={loading} fullWidth onClick={logout} structure="base">
              LOGOUT
            </Button>
          )}
        </>
      )}

      <Abstraxion onClose={() => setShowModal(false)} />

      {account?.bech32Address && (
        <div className="w-full">
          {/* Contract Balance Display */}
          {count !== null && (
            <div className="border-2 border-primary rounded-md p-4 flex flex-col gap-2">
              <div className="text-center font-bold">Contract Balance</div>
              <div className="flex flex-row justify-center gap-2">
                <div>{count} uxion</div>
              </div>
            </div>
          )}
        </div>
      )}

      {executeResult && (
        <div className="flex flex-col rounded border-2 border-black p-2 dark:border-white">
          <div className="mt-2">
            <p className="text-zinc-500"><span className="font-bold">Transaction Hash</span></p>
            <p className="text-sm">{executeResult.transactionHash}</p>
          </div>
          <div className="mt-2">
            <p className=" text-zinc-500"><span className="font-bold">Block Height:</span></p>
            <p className="text-sm">{executeResult.height}</p>
          </div>
          <div className="mt-2">
            <Link className="text-black underline visited:text-purple-600 dark:text-white" href={blockExplorerUrl} target="_blank">
              View in Block Explorer
            </Link>
          </div>
        </div>
      )}
    </main>
  );
}