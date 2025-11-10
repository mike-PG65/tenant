import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import PaymentReceipt from "../components/PaymentReceipt";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export default function PaymentSection() {
  const [paymentMethod, setPaymentMethod] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [month, setMonth] = useState("");
  const [status, setStatus] = useState({ message: "", type: "" });
  const [loading, setLoading] = useState(false);
  const [rental, setRental] = useState(null);
  const [rentalLoading, setRentalLoading] = useState(true);
  const [payment, setPayment] = useState(JSON.parse(sessionStorage.getItem("latestPayment")));
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

  // Fetch latest payment
  useEffect(() => {
    const fetchLatestPayment = async () => {
      if (!tenantId || !token || !rental) return;
      try {
        const { data } = await axios.get(`${BASE_URL}/payment/my`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (data?.payments?.length > 0) {
          const latest = data.payments[0];
          setPayment(latest);
          sessionStorage.setItem("latestPayment", JSON.stringify(latest));
        }
      } catch (err) {
        console.error("Error fetching latest payment:", err);
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
      sessionStorage.setItem("latestPayment", JSON.stringify(updatedPayment));
      setStatus({
        message: "✅ Payment approved by admin! Your receipt is ready below.",
        type: "success",
      });
    });

    socket.on("disconnect", () => console.log("❌ Disconnected from socket"));

    return () => socket.disconnect();
  }, [tenantId, BASE_URL]);

  // Polling to ensure receipt shows even if WebSocket fails
  useEffect(() => {
    if (!payment?._id || payment.status === "successful") return;

    const interval = setInterval(async () => {
      try {
        const { data } = await axios.get(`${BASE_URL}/payment/${payment._id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (data?.payment?.status === "successful") {
          setPayment(data.payment);
          sessionStorage.setItem("latestPayment", JSON.stringify(data.payment));
          setStatus({ message: "✅ Payment approved! Your receipt is now available.", type: "success" });
        }
      } catch (err) {
        console.error("Approval check error:", err);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [payment, token, BASE_URL]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) return setStatus({ message: "You must be logged in.", type: "error" });
    if (!rental?._id) return setStatus({ message: "Rental details not found.", type: "error" });
    if (!paymentMethod) return setStatus({ message: "Select a payment method.", type: "error" });
    if (!month) return setStatus({ message: "Select a month.", type: "error" });
    if (paymentMethod === "mpesa" && !phoneNumber) return setStatus({ message: "Enter Mpesa phone number.", type: "error" });

    try {
      setLoading(true);
      setStatus({ message: "", type: "" });

      const paymentData = {
        rentalId: rental._id,
        amount: rental.amount, // always from rental
        method: paymentMethod,
        month,
        transactionId: paymentMethod === "mpesa" ? `TXN-${Date.now()}` : undefined,
      };

      const { data } = await axios.post(`${BASE_URL}/payment/add`, paymentData, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });

      setPayment(data.payment);
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
    const clone = element.cloneNode(true);
    document.body.appendChild(clone);
    clone.style.position = "fixed";
    clone.style.top = "-9999px";
    clone.style.left = "0";
    clone.style.width = "800px";
    clone.style.boxSizing = "border-box";
    clone.style.backgroundColor = "#ffffff";
    clone.style.overflow = "visible";

    const watermark = clone.querySelector(".absolute");
    if (watermark) watermark.remove();

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
      const canvas = await html2canvas(clone, { scale: 3, useCORS: true, backgroundColor: "#ffffff" });
      const imgData = canvas.toDataURL("image/jpeg", 1.0);
      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const imgWidth = pageWidth - 2 * margin;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, "JPEG", margin, 10, imgWidth, imgHeight);
      pdf.setFontSize(9);
      pdf.setTextColor(120);
      // pdf.text(`© ${new Date().getFullYear()} Tenant Portal — All rights reserved`, pageWidth / 2, pageHeight - 10, { align: "center" });

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

  return (
    <div>
      {/* Show form if no payment yet or payment not successful */}
      {!payment || payment.status !== "successful" ? (
        <div className="p-8 max-w-lg mx-auto bg-white rounded-3xl shadow-2xl space-y-6">
          <h2 className="text-3xl font-bold text-gray-800 text-center">Complete Your Payment</h2>

          {rentalLoading ? (
            <p className="text-center text-gray-500 animate-pulse">Loading your rental details...</p>
          ) : rental ? (
            <p className="text-center text-gray-600 text-lg">
              Amount to Pay: <span className="font-extrabold text-gray-900">Ksh {rental.amount.toLocaleString()}</span>
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
        // Payment successful → show receipt automatically
        <div ref={receiptRef} style={{ backgroundColor: "#fff", padding: "20px" }}>
          <PaymentReceipt payment={payment} onDownload={handleDownload} />
        </div>
      )}
    </div>
  );
}
