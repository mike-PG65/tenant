import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import PaymentReceipt from "../components/PaymentReceipt";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import html2pdf from "html2pdf.js";

export default function PaymentSection() {
  const [paymentMethod, setPaymentMethod] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [month, setMonth] = useState("");
  const [status, setStatus] = useState({ message: "", type: "" });
  const [loading, setLoading] = useState(false);
  const [rental, setRental] = useState(null);
  const [rentalLoading, setRentalLoading] = useState(true);
  const [payment, setPayment] = useState(JSON.parse(sessionStorage.getItem("latestPayment")));
  const [remainingBalance, setRemainingBalance] = useState(0);
  const receiptRef = useRef();

  const BASE_URL = import.meta.env.VITE_BASE_URL;
  const token = sessionStorage.getItem("token");
  const tenant = JSON.parse(sessionStorage.getItem("user"));
  const tenantId = tenant?.id;

  // Fetch rental info
  useEffect(() => {
    const fetchRental = async () => {
      if (!tenantId || !token) return setRentalLoading(false);
      try {
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

  // Fetch latest payment and compute remaining balance
  useEffect(() => {
    const fetchLatestPayment = async () => {
      if (!tenantId || !token || !rental) return;
      try {
        const { data } = await axios.get(`${BASE_URL}/payment/my`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        let balance = rental.amount;
        if (data?.payments?.length > 0) {
          // Take the latest payment
          const latest = data.payments[0];
          setPayment(latest);
          balance = latest.balance;
          sessionStorage.setItem("latestPayment", JSON.stringify(latest));
        }
        setRemainingBalance(balance);
      } catch (err) {
        console.error("Error fetching latest payment:", err);
        setRemainingBalance(rental.amount || 0);
      }
    };

    fetchLatestPayment();
  }, [tenantId, token, BASE_URL, rental]);

  // Socket for real-time payment approval
  useEffect(() => {
    if (!tenantId || !BASE_URL) return;
    const SOCKET_URL = BASE_URL.replace("/api", "");
    const socket = io(SOCKET_URL, { withCredentials: true, transports: ["websocket"] });

    socket.on("connect", () => {
      console.log("⚡ Connected to socket:", socket.id);
      socket.emit("registerTenant", tenantId);
    });

    socket.on("paymentApproved", (updatedPayment) => {
      setPayment(updatedPayment);
      setRemainingBalance(updatedPayment.balance);
      sessionStorage.setItem("latestPayment", JSON.stringify(updatedPayment));
      setStatus({
        message: "✅ Payment approved by admin! Your receipt is ready below.",
        type: "success",
      });
    });

    socket.on("disconnect", () => console.log("❌ Disconnected from socket"));

    return () => socket.disconnect();
  }, [tenantId, BASE_URL]);

  // Poll for pending payment approval
  useEffect(() => {
    const interval = setInterval(async () => {
      if (!payment?._id || payment.status === "successful") return;
      try {
        const { data } = await axios.get(`${BASE_URL}/payment/${payment._id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (data?.payment?.status === "successful") {
          setPayment(data.payment);
          setRemainingBalance(data.payment.balance);
          sessionStorage.setItem("latestPayment", JSON.stringify(data.payment));
          setStatus({ message: "✅ Payment approved! Your receipt is now available.", type: "success" });
        }
      } catch (err) {
        console.error("Approval check error:", err);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [payment, BASE_URL, token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) return setStatus({ message: "You must be logged in.", type: "error" });
    if (!rental?._id) return setStatus({ message: "Rental details not found.", type: "error" });
    if (!paymentMethod) return setStatus({ message: "Select a payment method.", type: "error" });
    if (!month) return setStatus({ message: "Select a month.", type: "error" });
    if (!amount || Number(amount) <= 0 || Number(amount) > remainingBalance)
      return setStatus({ message: "Enter a valid amount not exceeding remaining balance.", type: "error" });
    if (paymentMethod === "mpesa" && !phoneNumber) return setStatus({ message: "Enter Mpesa phone number.", type: "error" });

    try {
      setLoading(true);
      setStatus({ message: "", type: "" });

      const paymentData = {
        rentalId: rental._id,
        amount: Number(amount),
        method: paymentMethod,
        month,
        transactionId: paymentMethod === "mpesa" ? `TXN-${Date.now()}` : undefined,
      };

      const { data } = await axios.post(`${BASE_URL}/payment/add`, paymentData, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });

      setPayment(data.payment);
      setRemainingBalance(data.payment.balance);
      sessionStorage.setItem("latestPayment", JSON.stringify(data.payment));

      setStatus({
        message:
          data.payment.status === "successful"
            ? "✅ Payment successful! Receipt ready below."
            : paymentMethod === "cash"
            ? "⏳ Your payment is pending admin approval."
            : "Processing your payment... You’ll receive a receipt soon.",
        type: data.payment.status === "successful" ? "success" : "warning",
      });

      setAmount("");
      setPhoneNumber("");
      setPaymentMethod("");
      setMonth("");
    } catch (err) {
      console.error("Payment error:", err);
      setStatus({ message: err.response?.data?.message || "Payment failed. Try again.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

const handleDownload = async () => {
  if (!receiptRef.current) return;
  const element = receiptRef.current;

  // Clone and prepare for PDF
  const clone = element.cloneNode(true);
  document.body.appendChild(clone);
  clone.style.position = "fixed";
  clone.style.top = "-9999px";
  clone.style.left = "0";
  clone.style.width = "800px"; // fixed width to keep layout consistent
  clone.style.boxSizing = "border-box";
  clone.style.backgroundColor = "#ffffff";
  clone.style.overflow = "visible";

  // Remove absolute watermark to prevent html2canvas issues
  const watermark = clone.querySelector(".absolute");
  if (watermark) watermark.remove();

  // Sanitize colors (avoid oklch/lab issues)
  const sanitizeColors = (el) => {
    el.querySelectorAll("*").forEach((node) => {
      const style = window.getComputedStyle(node);
      if (style.color.includes("oklch") || style.color.includes("lab")) node.style.color = "black";
      if (style.backgroundColor.includes("oklch") || style.backgroundColor.includes("lab"))
        node.style.backgroundColor = style.backgroundColor.includes("gray") ? "#f3f4f6" : "#ffffff";
      if (style.borderColor.includes("oklch") || style.borderColor.includes("lab")) node.style.borderColor = "#ccc";
    });
  };
  sanitizeColors(clone);

  try {
    const canvas = await html2canvas(clone, {
      scale: 3,
      useCORS: true,
      backgroundColor: "#ffffff",
      logging: true,
    });

    const imgData = canvas.toDataURL("image/jpeg", 1.0);
    const pdf = new jsPDF("p", "mm", "a4");

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    // Fit canvas to page width
    const margin = 10;
    const imgWidth = pageWidth - 2 * margin;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    pdf.addImage(imgData, "JPEG", margin, 10, imgWidth, imgHeight);

    // Footer
    pdf.setFontSize(9);
    pdf.setTextColor(120);
    pdf.text(
      `© ${new Date().getFullYear()} Tenant Portal — All rights reserved`,
      pageWidth / 2,
      pageHeight - 10,
      { align: "center" }
    );

    const date = new Date().toISOString().slice(0, 10);
    const fileName = `Rent_Receipt_${payment?.tenantName || "Tenant"}_${payment?.month || date}.pdf`;
    pdf.save(fileName);
  } catch (err) {
    console.error("Error generating PDF:", err);
    alert("⚠️ Failed to generate PDF. Please try again.");
  } finally {
    document.body.removeChild(clone);
  }
};













  const handleNewPayment = () => {
    sessionStorage.removeItem("latestPayment");
    setPayment(null);
    setRemainingBalance(rental?.amount || 0);
    setStatus({ message: "", type: "" });
  };

  return (
    <div>
      {!payment ? (
        <div className="p-8 max-w-lg mx-auto bg-white rounded-3xl shadow-2xl space-y-6">
          <h2 className="text-3xl font-bold text-gray-800 text-center">Complete Your Payment</h2>

          {rentalLoading ? (
            <p className="text-center text-gray-500 animate-pulse">Loading your rental details...</p>
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
            <div className={`p-3 rounded-lg text-center font-medium ${
              status.type === "success" ? "bg-green-100 text-green-700" :
              status.type === "warning" ? "bg-yellow-100 text-yellow-700" :
              "bg-red-100 text-red-700"
            }`}>
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
              <>
                <div>
                  <label className="block font-semibold mb-2 text-gray-700">Select Month</label>
                  <input
                    type="month"
                    className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-blue-400 focus:outline-none"
                    value={month}
                    onChange={(e) => setMonth(e.target.value)}
                    required
                    min={new Date().toISOString().slice(0, 7)}
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-2 text-gray-700">Amount to Pay</label>
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
              </>
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
              disabled={loading || remainingBalance <= 0}
              className={`w-full py-3 rounded-2xl text-white font-semibold shadow-lg transition-colors ${
                loading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {loading ? "Processing..." : "Pay Now"}
            </button>
          </form>
        </div>
      ) : payment.status === "successful" ? (
        <div ref={receiptRef} style={{ backgroundColor: "#fff", padding: "20px" }}>
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
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Payment Pending ⏳ Waiting for admin approval...</h2>
          <p className="text-gray-600">
            Your payment is currently <span className="font-semibold text-yellow-600">{payment.status}</span>.
            You’ll receive your receipt as soon as the admin approves it.
          </p>
        </div>
      )}
    </div>
  );
}
