import React from "react";

export default function PaymentReceipt({ payment, onDownload }) {
  if (!payment) return null;

  return (
    <div className="max-w-lg mx-auto mt-10 bg-white shadow-2xl rounded-2xl p-8 border border-gray-200">
      <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
        Tenant Rent Payment Receipt
      </h2>

      <div className="space-y-3 text-gray-700">
        <div className="flex justify-between">
          <span className="font-semibold">Tenant Name:</span>
          <span>{payment.tenantName || "N/A"}</span>
        </div>

        <div className="flex justify-between">
          <span className="font-semibold">House:</span>
          <span>{payment.houseName || "N/A"}</span>
        </div>

        <div className="flex justify-between">
          <span className="font-semibold">Payment Method:</span>
          <span className="capitalize">{payment.method}</span>
        </div>

        {/* ✅ Show phone only for M-Pesa */}
        {payment.method === "mpesa" && (
          <div className="flex justify-between">
            <span className="font-semibold">Phone Number:</span>
            <span>{payment.phoneNumber || "N/A"}</span>
          </div>
        )}

        {/* ✅ Show Transaction ID only for non-cash methods */}
        {payment.method !== "cash" && payment.transactionId && (
          <div className="flex justify-between">
            <span className="font-semibold">Transaction ID:</span>
            <span>{payment.transactionId}</span>
          </div>
        )}

        <div className="flex justify-between">
          <span className="font-semibold">Amount Paid:</span>
          <span>Ksh {payment.amount.toLocaleString()}</span>
        </div>

        <div className="flex justify-between">
          <span className="font-semibold">Balance:</span>
          <span>
            {payment.balance >= 0
              ? `Ksh ${payment.balance.toLocaleString()} (Overpaid)`
              : `Ksh ${Math.abs(payment.balance).toLocaleString()} (Pending)`}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="font-semibold">Status:</span>
          <span
            className={`${
              payment.status === "successful"
                ? "text-green-600"
                : "text-yellow-600"
            } font-semibold`}
          >
            {payment.status.toUpperCase()}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="font-semibold">Date:</span>
          <span>{new Date(payment.paymentDate).toLocaleString()}</span>
        </div>
      </div>

      <hr className="my-6" />

      <p className="text-center text-gray-600 italic">
        Thank you for your payment!
      </p>

      <div className="flex justify-center mt-6">
        <button
          onClick={onDownload}
          className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-md transition-colors"
        >
          Download Receipt (PDF)
        </button>
      </div>
    </div>
  );
}
