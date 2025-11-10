import React, { forwardRef } from "react";

const PaymentReceipt = forwardRef(({ payment, onDownload }, ref) => {
  if (!payment) return null;

  const isCash = payment.method === "cash";
  const isMpesa = payment.method === "mpesa";

  const formattedMonth = payment.month
    ? new Date(payment.month + "-01").toLocaleString("en-US", {
        month: "long",
        year: "numeric",
      })
    : "N/A";

  return (
    <div
      ref={ref}
      className="max-w-2xl w-full mx-auto mt-6 sm:mt-10 bg-white rounded-2xl shadow-2xl p-6 sm:p-10 overflow-hidden"
    >
      {/* Watermark */}
      <div className="absolute inset-0 opacity-5 pointer-events-none flex items-center justify-center text-6xl font-bold text-gray-300 -rotate-30">
        RECEIPT
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 sm:mb-8 text-center sm:text-left">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Tenant Rent Receipt</h2>
          <p className="text-gray-600 text-sm">Official Payment Confirmation</p>
        </div>
        <div className="mt-3 sm:mt-0 text-gray-700">
          <p className="text-xs sm:text-sm text-gray-600">Receipt Date</p>
          <p className="font-semibold text-gray-800">{new Date(payment.paymentDate).toLocaleDateString()}</p>
        </div>
      </div>

      <hr className="mb-6 border-gray-300" />

      {/* Tenant Details */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 sm:gap-y-4 text-gray-700 mb-6 text-sm sm:text-base">
        <p className="font-semibold">Tenant Name:</p>
        <p>{payment.tenantId?.name || "N/A"}</p>

        <p className="font-semibold">House:</p>
        <p>{payment.rentalId?.houseId?.houseNo || "N/A"}</p>

        <p className="font-semibold">Payment Month:</p>
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

      {/* Payment Summary - single page */}
      <div className="bg-gray-100 rounded-xl p-6 shadow-inner mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b border-gray-300 pb-2">
          Payment Summary
        </h3>

        <div className="flex justify-between py-2 text-gray-700">
          <span>Amount Paid:</span>
          <span className="font-semibold text-gray-900">Ksh {payment.amount.toLocaleString()}</span>
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
      <p className="text-center text-gray-600 italic mb-4 text-sm sm:text-base">
        Thank you for your timely payment!
      </p>

      <div className="flex justify-center mb-6">
        <button
          onClick={onDownload}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-md transition-transform transform hover:scale-105"
        >
          Download Receipt (PDF)
        </button>
      </div>

      <div className="text-center text-[10px] sm:text-xs text-gray-400">
        © {new Date().getFullYear()} Gonye Enterprices — All rights reserved
      </div>
    </div>
  );
});

export default PaymentReceipt;
