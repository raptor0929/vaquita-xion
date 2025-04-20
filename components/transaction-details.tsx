"use client"

import Link from "next/link"

interface TransactionDetailsProps {
  contractBalance: number
  transactionHash: string
  blockHeight: number
  blockExplorerUrl: string
}

export default function TransactionDetails({ contractBalance, transactionHash, blockHeight, blockExplorerUrl }: TransactionDetailsProps) {
  return (
    <div className="mt-4 space-y-4">
      {/* Contract Balance */}
      <div className="bg-black border border-white rounded-lg p-4 text-center">
        <h3 className="font-bold mb-2">Contract Balance</h3>
        <p>{contractBalance + 3000} uxion</p>
      </div>

      {/* Transaction Details */}
      <div className="bg-black border border-white rounded-lg p-4">
        <div className="mb-2">
          <h4 className="text-gray-400">Transaction Hash</h4>
          <p className="text-xs break-all">{transactionHash}</p>
        </div>
        <div>
          <h4 className="text-gray-400">Block Height:</h4>
          <p>{blockHeight}</p>
        </div>
        <div>
            <Link className="text-white underline hover:text-blue-300" href={blockExplorerUrl} target="_blank">
              View in Block Explorer
            </Link>
          </div>
      </div>
    </div>
  )
}
