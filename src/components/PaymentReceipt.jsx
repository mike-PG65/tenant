import React from "react";

export default function PaymentReceipt({ payment, onDownload }) {
  if (!payment) return null;

  const isCash = payment.method === "cash";
  const isMpesa = payment.method === "mpesa";

  // Format month nicely (e.g., "November 2025")
  const formattedMonth = payment.month
    ? new Date(payment.month + "-01").toLocaleString("en-US", { month: "long", year: "numeric" })
    : "N/A";

  return (
    <div className="max-w-2xl mx-auto mt-10 bg-gradient-to-b from-white to-gray-50 shadow-2xl rounded-2xl p-10 border border-gray-200 relative overflow-hidden">
      {/* Watermark */}
      <div className="absolute inset-0 opacity-5 pointer-events-none flex items-center justify-center text-6xl font-bold text-gray-400 rotate-[-30deg]">
        RECEIPT
      </div>

      {/* Header */}
      <div className="flex justify-between items-center mb-8 relative">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Tenant Rent Receipt</h2>
          <p className="text-gray-500 text-sm">Official Payment Confirmation</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-600">Receipt Date</p>
          <p className="font-semibold text-gray-800">
            {new Date(payment.paymentDate).toLocaleDateString()}
          </p>
        </div>
      </div>

      <hr className="mb-6 border-gray-300" />

      {/* Tenant Details */}
      <div className="grid grid-cols-2 gap-y-3 text-gray-700 mb-6">
        <p className="font-semibold">Tenant Name:</p>
        <p>{payment.tenantName || "N/A"}</p>

        <p className="font-semibold">House:</p>
        <p>{payment.houseName || "N/A"}</p>

        <p className="font-semibold">Payment Month:</p> {/* New */}
        <p>{formattedMonth}</p>

        <p className="font-semibold">Payment Method:</p>
        <p className="capitalize">{payment.method}</p>

        {isMpesa && (
          <>
            <p className="font-semibold">Phone Number:</p>
            <p>{payment.phoneNumber || "N/A"}</p>
          </>
        )}

        {!isCash && payment.transactionId && (
          <>
            <p className="font-semibold">Transaction ID:</p>
            <p>{payment.transactionId}</p>
          </>
        )}
      </div>

      {/* Payment Summary Box */}
      <div className="bg-gray-100 rounded-xl p-6 shadow-inner mb-8">
        <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b border-gray-300 pb-2">
          Payment Summary
        </h3>
        <div className="flex justify-between py-2 text-gray-700">
          <span>Amount Paid:</span>
          <span className="font-semibold text-gray-900">
            Ksh {payment.amount.toLocaleString()}
          </span>
        </div>

        <div className="flex justify-between py-2 text-gray-700">
          <span>Balance:</span>
          <span
            className={`font-semibold ${
              payment.balance === 0 ? "text-green-700" : "text-red-600"
            }`}
          >
            {payment.balance === 0
              ? `Ksh 0 (Paid in full)`
              : `Ksh ${payment.balance.toLocaleString()} (Pending)`}
          </span>
        </div>

        <div className="flex justify-between py-2 text-gray-700">
          <span>Status:</span>
          <span
            className={`font-semibold uppercase ${
              payment.status === "successful"
                ? "text-green-700"
                : payment.status === "pending"
                ? "text-yellow-600"
                : "text-red-600"
            }`}
          >
            {payment.status}
          </span>
        </div>
      </div>

      {/* Footer */}
      <p className="text-center text-gray-600 italic mb-4">
        Thank you for your timely payment!
      </p>

      <div className="flex justify-center">
        <button
          onClick={onDownload}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-md transition-transform transform hover:scale-105"
        >
          Download Receipt (PDF)
        </button>
      </div>

      <div className="text-center mt-8 text-xs text-gray-400">
        © {new Date().getFullYear()} Tenant Portal — All rights reserved
      </div>
    </div>
  );
}
