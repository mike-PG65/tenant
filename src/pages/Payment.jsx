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
  const [rental, setRental] = useState(null);
  const [rentalLoading, setRentalLoading] = useState(true);
  const receiptRef = useRef();

  const savedPayment = JSON.parse(sessionStorage.getItem("latestPayment"));
  const [payment, setPayment] = useState(savedPayment);

  const BASE_URL = import.meta.env.VITE_BASE_URL;
  const token = sessionStorage.getItem("token");
  const tenant = JSON.parse(sessionStorage.getItem("user"));
  const tenantId = tenant?.id;

  // ✅ NEW: Fetch latest payment status if a saved payment exists
  useEffect(() => {
    const fetchLatestPayment = async () => {
      if (!savedPayment?._id || !token) return;

      try {
        const { data } = await axios.get(`${BASE_URL}/payment/${savedPayment._id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (data?.payment) {
          setPayment(data.payment);
          sessionStorage.setItem("latestPayment", JSON.stringify(data.payment));

          if (data.payment.status === "successful") {
            setStatus({
              message: "Your payment was approved! Receipt ready below.",
              type: "success",
            });
          } else {
            setStatus({
              message: "Your payment is still pending approval.",
              type: "warning",
            });
          }
        }
      } catch (err) {
        console.error("Error fetching latest payment:", err.response || err);
      }
    };

    fetchLatestPayment();
  }, [savedPayment?._id]);

  useEffect(() => {
    const fetchRental = async () => {
      try {
        if (!tenantId || !token) {
          console.warn("Missing tenantId or token", { tenantId, token });
          setRentalLoading(false);
          return;
        }

        console.log("Fetching rental for tenant:", tenantId);
        const { data } = await axios.get(`${BASE_URL}/rental/tenant/${tenantId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (Array.isArray(data) && data.length > 0) {
          setRental(data[0]);
        } else if (data?.rental) {
          setRental(data.rental);
        } else {
          setStatus({ message: "No rental found for your account.", type: "error" });
        }
      } catch (err) {
        console.error("❌ Error fetching rental:", err.response || err);
        setStatus({
          message: err.response?.data?.message || "Failed to load rental info.",
          type: "error",
        });
      } finally {
        setRentalLoading(false);
      }
    };

    fetchRental();
  }, [tenantId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
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

      const paymentData = {
        rentalId: rental._id,
        amount: Number(amount),
        method: paymentMethod,
        transactionId: paymentMethod === "mpesa" ? `TXN-${Date.now()}` : undefined,
      };

      const { data } = await axios.post(`${BASE_URL}/payment/add`, paymentData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      setPayment(data.payment);
      sessionStorage.setItem("latestPayment", JSON.stringify(data.payment));

      if (data.payment.status === "successful") {
        setStatus({ message: "Payment successful! Receipt ready below.", type: "success" });
      } else {
        setStatus({
          message:
            data.payment.method === "cash"
              ? "Your payment is pending approval by the admin."
              : "Payment is processing. You will receive a receipt once confirmed.",
          type: "warning",
        });
      }

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

  const handleDownload = async () => {
    const element = receiptRef.current;
    const canvas = await html2canvas(element);
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF();
    pdf.addImage(imgData, "PNG", 10, 10, 190, 0);
    pdf.save(`Tenant_Receipt_${Date.now()}.pdf`);
  };

  const handleNewPayment = () => {
    sessionStorage.removeItem("latestPayment");
    setPayment(null);
    setStatus({ message: "", type: "" });
  };

  return (
    <div>
      {!payment ? (
        // 🧾 Payment form
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
              Total Amount Due:{" "}
              <span className="font-extrabold text-gray-900">
                Ksh {rental.amount?.toLocaleString()}
              </span>
            </p>
          ) : (
            <p className="text-center text-red-600">No rental record found.</p>
          )}

          {status.message && (
            <div
              className={`p-3 rounded-lg text-center font-medium ${
                status.type === "success"
                  ? "bg-green-100 text-green-700"
                  : status.type === "warning"
                  ? "bg-yellow-100 text-yellow-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {status.message}
            </div>
          )}

          {/* payment form */}
          {/* ... same as before ... */}
        </div>
      ) : payment.status === "successful" ? (
        // ✅ Show receipt if approved
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
        // ⏳ Pending payment
        <div className="p-8 max-w-lg mx-auto bg-white rounded-3xl shadow-lg text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Payment Pending</h2>
          <p className="text-gray-600">
            Your payment is currently{" "}
            <span className="font-semibold text-yellow-600">{payment.status}</span>.
            You’ll receive your receipt once it’s marked as{" "}
            <span className="font-semibold text-green-700">successful</span>.
          </p>

          <div className="mt-6">
            <button
              onClick={handleNewPayment}
              className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700"
            >
              Back to Payment Form
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
