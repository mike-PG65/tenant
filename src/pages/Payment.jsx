import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import PaymentReceipt from "../components/PaymentReceipt";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export default function PaymentSection() {
  const [paymentMethod, setPaymentMethod] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState({ message: "", type: "" });
  const [loading, setLoading] = useState(false);
  const [rental, setRental] = useState(null);
  const [rentalLoading, setRentalLoading] = useState(true);
  const receiptRef = useRef();

  const BASE_URL = import.meta.env.VITE_BASE_URL;
  const token = sessionStorage.getItem("token");
  const tenant = JSON.parse(sessionStorage.getItem("user"));
  const tenantId = tenant?.id;

  // ✅ Load last saved payment
  const savedPayment = JSON.parse(sessionStorage.getItem("latestPayment"));
  const [payment, setPayment] = useState(savedPayment);

  // ✅ Fetch latest payment from backend
  useEffect(() => {
    const fetchLatestPayment = async () => {
      try {
        if (!tenantId || !token) return;

        const { data } = await axios.get(`${BASE_URL}/payment/my`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (data?.payments?.length > 0) {
          // Assuming backend returns payments sorted descending by createdAt
          const latest = data.payments[0];
          setPayment(latest);
          sessionStorage.setItem("latestPayment", JSON.stringify(latest));
        }
      } catch (err) {
        console.error("Error fetching latest payment:", err);
      }
    };

    if (!savedPayment) fetchLatestPayment();
  }, [tenantId, token, BASE_URL]);

  // ✅ SOCKET.IO — Listen for approval updates
  useEffect(() => {
    if (!tenantId || !BASE_URL) return;

    const SOCKET_URL = BASE_URL.replace("/api", "");

    const socket = io(SOCKET_URL, {
      withCredentials: true,
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socket.on("connect", () => {
      console.log("⚡ Connected to socket:", socket.id);
      socket.emit("registerTenant", tenantId);
    });

    socket.on("paymentApproved", (updatedPayment) => {
      console.log("💰 Payment approved event received:", updatedPayment);
      setPayment(updatedPayment);
      sessionStorage.setItem("latestPayment", JSON.stringify(updatedPayment));
      setStatus({
        message: "✅ Payment approved by admin! Your receipt is ready below.",
        type: "success",
      });
    });

    socket.on("disconnect", () => console.log("❌ Disconnected from socket"));

    return () => socket.disconnect();
  }, [tenantId, BASE_URL]);

  // ✅ Poll every 5s as fallback
  useEffect(() => {
    const checkForApproval = async () => {
      if (!payment?._id || payment.status === "successful") return;

      try {
        const { data } = await axios.get(`${BASE_URL}/payment/${payment._id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (data?.payment?.status === "successful") {
          setPayment(data.payment);
          sessionStorage.setItem("latestPayment", JSON.stringify(data.payment));
          setStatus({
            message: "✅ Payment approved! Your receipt is now available.",
            type: "success",
          });
        }
      } catch (err) {
        console.error("Approval check error:", err);
      }
    };

    const interval = setInterval(checkForApproval, 5000);
    return () => clearInterval(interval);
  }, [payment, BASE_URL, token]);

  // ✅ Fetch rental info
  useEffect(() => {
    const fetchRental = async () => {
      try {
        if (!tenantId || !token) return setRentalLoading(false);

        const { data } = await axios.get(`${BASE_URL}/rental/tenant/${tenantId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (Array.isArray(data) && data.length > 0) setRental(data[0]);
        else if (data?.rental) setRental(data.rental);
        else setStatus({ message: "No rental found for your account.", type: "error" });
      } catch (err) {
        console.error("Error fetching rental:", err);
        setStatus({
          message: err.response?.data?.message || "Failed to load rental info.",
          type: "error",
        });
      } finally {
        setRentalLoading(false);
      }
    };

    fetchRental();
  }, [tenantId, token, BASE_URL]);

  // ✅ Handle payment submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!token)
      return setStatus({ message: "You must be logged in to make a payment.", type: "error" });
    if (!rental?._id)
      return setStatus({ message: "Rental details not found.", type: "error" });
    if (!paymentMethod)
      return setStatus({ message: "Please select a payment method.", type: "error" });
    if (!amount || isNaN(amount) || Number(amount) <= 0)
      return setStatus({ message: "Please enter a valid amount.", type: "error" });
    if (paymentMethod === "mpesa" && !phoneNumber)
      return setStatus({ message: "Please enter your Mpesa phone number.", type: "error" });

    try {
      setLoading(true);
      setStatus({ message: "", type: "" });

      const paymentData = {
        rentalId: rental._id,
        amount: Number(amount),
        method: paymentMethod,
        transactionId: paymentMethod === "mpesa" ? `TXN-${Date.now()}` : undefined,
      };

      const { data } = await axios.post(`${BASE_URL}/payment/add`, paymentData, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });

      setPayment(data.payment);
      sessionStorage.setItem("latestPayment", JSON.stringify(data.payment));

      if (data.payment.status === "successful") {
        setStatus({ message: "Payment successful! Receipt ready below.", type: "success" });
      } else {
        setStatus({
          message:
            data.payment.method === "cash"
              ? "Your payment is pending admin approval."
              : "Processing your payment... You’ll receive a receipt soon.",
          type: "warning",
        });
      }

      setAmount("");
      setPhoneNumber("");
      setPaymentMethod("");
    } catch (err) {
      console.error("Payment error:", err);
      setStatus({
        message: err.response?.data?.message || "Payment failed. Try again.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  // ✅ Download receipt as PDF
  const handleDownload = async () => {
    const element = receiptRef.current;
    const canvas = await html2canvas(element);
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF();
    pdf.addImage(imgData, "PNG", 10, 10, 190, 0);
    pdf.save(`Tenant_Receipt_${Date.now()}.pdf`);
  };

  // ✅ Reset payment for new one
  const handleNewPayment = () => {
    sessionStorage.removeItem("latestPayment");
    setPayment(null);
    setStatus({ message: "", type: "" });
  };

  // ✅ Compute remaining balance
  const remainingBalance = rental ? rental.amount - (payment?.amountPaid || 0) : 0;

  // ✅ RENDER
  return (
    <div>
      {!payment ? (
        <div className="p-8 max-w-lg mx-auto bg-white rounded-3xl shadow-2xl space-y-6">
          <h2 className="text-3xl font-bold text-gray-800 text-center">
            Complete Your Payment
          </h2>

          {rentalLoading ? (
            <p className="text-center text-gray-500 animate-pulse">
              Loading your rental details...
            </p>
          ) : rental ? (
            <p className="text-center text-gray-600 text-lg">
              {remainingBalance > 0 ? (
                <>Balance Remaining: <span className="font-extrabold text-gray-900">Ksh {remainingBalance.toLocaleString()}</span></>
              ) : (
                <>No outstanding balance. <span className="font-extrabold text-gray-900">Ksh 0</span></>
              )}
            </p>
          ) : (
            <p className="text-center text-red-600">No rental record found.</p>
          )}

          {status.message && (
            <div
              className={`p-3 rounded-lg text-center font-medium ${status.type === "success"
                ? "bg-green-100 text-green-700"
                : status.type === "warning"
                  ? "bg-yellow-100 text-yellow-700"
                  : "bg-red-100 text-red-700"
                }`}
            >
              {status.message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
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
                  max={remainingBalance}
                />
              </div>
            )}

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
              disabled={loading || remainingBalance <= 0}
              className={`w-full py-3 rounded-2xl text-white font-semibold shadow-lg transition-colors ${loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
                }`}
            >
              {loading ? "Processing..." : "Pay Now"}
            </button>
          </form>
        </div>
      ) : payment.status === "successful" ? (
        <div ref={receiptRef}>
          <PaymentReceipt payment={payment} onDownload={handleDownload} />
          <div className="text-center mt-6">
            <button
              onClick={handleNewPayment}
              className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700"
            >
              Make Another Payment
            </button>
          </div>
        </div>
      ) : (
        <div className="p-8 max-w-lg mx-auto bg-white rounded-3xl shadow-lg text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Payment Pending ⏳ Waiting for admin approval...
          </h2>
          <p className="text-gray-600">
            Your payment is currently{" "}
            <span className="font-semibold text-yellow-600">{payment.status}</span>.
            You’ll receive your receipt as soon as the admin approves it.
          </p>
        </div>
      )}
    </div>
  );
}
