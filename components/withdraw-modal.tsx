"use client"

interface WithdrawModalProps {
  onClose: () => void
  onWithdraw: () => void
  amount: number
  buttonStyle?: string
  loading?: boolean
}

export default function WithdrawModal({ onClose, onWithdraw, amount, buttonStyle, loading }: WithdrawModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-black border border-white rounded-3xl p-6 max-w-xs w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center mb-6 text-xl">🐄 {amount} uxion deposit</div>

        <button 
          onClick={onWithdraw} 
          className={`w-full rounded-xl py-3 font-bold ${buttonStyle || "bg-white text-black"}`}
        >
          {loading ? "LOADING..." : "WITHDRAW"}
        </button>
      </div>
    </div>
  )
}
