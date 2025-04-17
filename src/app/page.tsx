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

const contractAddress = "";

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

  // Fetch the count from the smart contract
  const getCount = async () => {
    setLoading(true);
    try {
      const response = await queryClient?.queryContractSmart(contractAddress, { get_count: {} });
      setCount(response.count);
      console.log("Get Count:", response);
    } catch (error) {
      console.error("Error querying contract:", error);
    } finally {
      setLoading(false);
    }
  };

  // Increment the count in the smart contract
  const increment = async () => {
    setLoading(true);
    const msg = { increment: {} };

    try {
      const res = await client?.execute(account.bech32Address, contractAddress, msg, {
        amount: [{
          denom: "uxion",
          amount: "1000"
        }],
        gas: "500000",
        granter: "",
      });
      setExecuteResult(res);
      console.log("Transaction successful:", res);
      await getCount(); // Refresh count after successful increment
    } catch (error) {
      console.error("Error executing transaction:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch count on page load
  useEffect(() => {
    if (queryClient) {
      getCount();
    }
  }, [queryClient]);

  return (
    <main className="m-auto flex min-h-screen max-w-xs flex-col items-center justify-center gap-4 p-4">
      <h1 className="text-2xl font-bold tracking-tighter text-white">ABSTRAXION</h1>

      <Button fullWidth onClick={() => setShowModal(true)} structure="base">
        {account?.bech32Address ? <div className="flex items-center justify-center">VIEW ACCOUNT</div> : "CONNECT"}
      </Button>

      {client && (
        <>
          <Button disabled={loading} fullWidth onClick={getCount} structure="base">
            {loading ? "LOADING..." : "Get Count"}
          </Button>
          <Button disabled={loading} fullWidth onClick={increment} structure="base">
            {loading ? "LOADING..." : "INCREMENT"}
          </Button>
          {logout && (
            <Button disabled={loading} fullWidth onClick={logout} structure="base">
              LOGOUT
            </Button>
          )}
        </>
      )}

      <Abstraxion onClose={() => setShowModal(false)} />

      {count !== null && (
        <div className="border-2 border-primary rounded-md p-4 flex flex-row gap-4">
          <div className="flex flex-row gap-6">
            <div>Count:</div>
            <div>{count}</div>
          </div>
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