import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import PaymentReceipt from "../components/PaymentReceipt";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export default function PaymentSection() {
  const [paymentMethod, setPaymentMethod] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState({ message: "", type: "" });
  const [loading, setLoading] = useState(false);
  const [payment, setPayment] = useState(null);
  const [rental, setRental] = useState(null);
  const receiptRef = useRef();

  const BASE_URL = import.meta.env.VITE_BASE_URL;
  const token = sessionStorage.getItem("token");
  const tenant = JSON.parse(sessionStorage.getItem("user")); // stored at login
  const tenantId = tenant?._id;

  // 🔹 Fetch rental info automatically
  useEffect(() => {
    const fetchRental = async () => {
      try {
        if (!tenantId || !token) return;

        console.log("Fetching rental for tenant:", tenantId);
        const { data } = await axios.get(`${BASE_URL}/rental/tenant/${tenantId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setRental(data.rental);
      } catch (err) {
        console.error("Error fetching rental:", err);
        setStatus({ message: "Failed to load rental info.", type: "error" });
      }
    };
    fetchRental();
  }, [tenantId]);

  // 🔹 Handle payment submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Submitting payment to:", `${BASE_URL}/payment/add`);

    if (!token) {
      setStatus({ message: "You must be logged in to make a payment.", type: "error" });
      return;
    }

    if (!rental?._id) {
      setStatus({ message: "Rental details not found.", type: "error" });
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

      // 🚫 Removed tenantId – backend gets it from the token
      const paymentData = {
        rentalId: rental._id,
        amount: Number(amount),
        method: paymentMethod,
        transactionId: paymentMethod === "mpesa" ? `TXN-${Date.now()}` : undefined,
      };

      console.log("Payment payload:", paymentData);

      const { data } = await axios.post(`${BASE_URL}/payment/add`, paymentData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      console.log("✅ Payment response:", data);

      setStatus({ message: "Payment recorded successfully!", type: "success" });
      setPayment(data.payment);
      setAmount("");
      setPhoneNumber("");
      setPaymentMethod("");
    } catch (err) {
      console.error("❌ Payment error:", err.response || err);
      setStatus({
        message: err.response?.data?.message || "Payment failed. Try again.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Handle receipt download
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
          <h2 className="text-3xl font-bold text-gray-800 text-center">Complete Your Payment</h2>

          {rental ? (
            <p className="text-center text-gray-600 text-lg">
              Total Amount Due:{" "}
              <span className="font-extrabold text-gray-900">
                Ksh {rental.amount?.toLocaleString()}
              </span>
            </p>
          ) : (
            <p className="text-center text-gray-600">Loading your rental details...</p>
          )}

          {status.message && (
            <div
              className={`p-3 rounded-lg text-center font-medium ${
                status.type === "success" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
              }`}
            >
              {status.message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block font-semibold mb-2 text-gray-700">Payment Method</label>
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

            {paymentMethod && (
              <div>
                <label className="block font-semibold mb-2 text-gray-700">Amount to Pay</label>
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

            {paymentMethod === "mpesa" && (
              <div>
                <label className="block font-semibold mb-2 text-gray-700">Mpesa Phone Number</label>
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
                loading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
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
