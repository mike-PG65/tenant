import React, { useState, useRef } from "react";
import axios from "axios";
import PaymentReceipt from "../components/PaymentReceipt";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export default function PaymentSection({ totalAmount = 0, tenantId, rentalId }) {
  const [paymentMethod, setPaymentMethod] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState({ message: "", type: "" });
  const [loading, setLoading] = useState(false);
  const [payment, setPayment] = useState(null);
  const receiptRef = useRef();

 const handleSubmit = async (e) => {
  e.preventDefault();
  console.log("Submitting payment to:", `${import.meta.env.VITE_BASE_URL}/payment/add`);

  if (!tenantId) {
    setStatus({ message: "You must be logged in to make a payment.", type: "error" });
    return;
  }

  if (!paymentMethod) {
    setStatus({ message: "Please select a payment method.", type: "error" });
    return;
  }

  if (!amount || isNaN(amount) || Number(amount) <= 0) {
    setStatus({ message: "Please enter a valid amount.", type: "error" });
    return;
  }

  if (paymentMethod === "mpesa" && !phoneNumber) {
    setStatus({ message: "Please enter your Mpesa phone number.", type: "error" });
    return;
  }

  try {
    setLoading(true);
    setStatus({ message: "", type: "" });

    // 🔹 Get token from sessionStorage
    const token = sessionStorage.getItem("token");

    // 🔹 Construct payment data
    const paymentData = {
      tenantId,
      rentalId,
      amount: Number(amount),
      method: paymentMethod,
      transactionId: paymentMethod === "mpesa" ? `TXN-${Date.now()}` : undefined,
    };

    // 🔹 Send POST request to backend
    const { data } = await axios.post(
      `${import.meta.env.VITE_BASE_URL}/payment/add`,
      paymentData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    // ✅ Success response
    setStatus({ message: "Payment recorded successfully!", type: "success" });
    setPayment(data.payment); // Store payment for receipt
    setAmount("");
    setPhoneNumber("");
    setPaymentMethod("");
  } catch (err) {
    console.error(err);
    setStatus({
      message: err.response?.data?.message || "Payment failed. Try again.",
      type: "error",
    });
  } finally {
    setLoading(false);
  }
};


  // 🔹 Generate downloadable PDF
  const handleDownload = async () => {
    const element = receiptRef.current;
    const canvas = await html2canvas(element);
    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF();
    pdf.addImage(imgData, "PNG", 10, 10, 190, 0);
    pdf.save(`Tenant_Receipt_${Date.now()}.pdf`);
  };

  return (
    <div>
      {!payment ? (
        <div className="p-8 max-w-lg mx-auto bg-white rounded-3xl shadow-2xl space-y-6">
          <h2 className="text-3xl font-bold text-gray-800 text-center">
            Complete Your Payment
          </h2>

          <p className="text-center text-gray-600 text-lg">
            Total Amount Due:{" "}
            <span className="font-extrabold text-gray-900">
              Ksh {totalAmount.toLocaleString()}
            </span>
          </p>

          {status.message && (
            <div
              className={`p-3 rounded-lg text-center font-medium ${
                status.type === "success"
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {status.message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Payment Method */}
            <div>
              <label className="block font-semibold mb-2 text-gray-700">
                Payment Method
              </label>
              <select
                className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-blue-400 focus:outline-none"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                required
              >
                <option value="">Select Method</option>
                <option value="cash">Cash</option>
                <option value="mpesa">Mpesa</option>
              </select>
            </div>

            {/* Amount */}
            {paymentMethod && (
              <div>
                <label className="block font-semibold mb-2 text-gray-700">
                  Amount to Pay
                </label>
                <input
                  type="number"
                  placeholder="Enter amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-blue-400 focus:outline-none"
                  required
                />
              </div>
            )}

            {/* Mpesa Number */}
            {paymentMethod === "mpesa" && (
              <div>
                <label className="block font-semibold mb-2 text-gray-700">
                  Mpesa Phone Number
                </label>
                <input
                  type="tel"
                  placeholder="07XXXXXXXX"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-blue-400 focus:outline-none"
                  required
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 rounded-2xl text-white font-semibold shadow-lg transition-colors ${
                loading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {loading ? "Processing..." : "Pay Now"}
            </button>
          </form>
        </div>
      ) : (
        <div ref={receiptRef}>
          <PaymentReceipt payment={payment} onDownload={handleDownload} />
        </div>
      )}
    </div>
  );
}
