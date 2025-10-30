import React, { useState } from "react";

export default function PaymentSection({ totalAmount = 0, onSubmit }) {
  const [paymentMethod, setPaymentMethod] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [status, setStatus] = useState({ message: "", type: "" }); // success or error
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (paymentMethod === "mpesa" && !phoneNumber) {
      setStatus({ message: "Please enter your phone number for Mpesa payment.", type: "error" });
      return;
    }

    try {
      setLoading(true);
      await onSubmit({ paymentMethod, phoneNumber });
      setStatus({ message: "Payment submitted successfully!", type: "success" });
      setPhoneNumber("");
      setPaymentMethod("");
    } catch (err) {
      setStatus({ message: err.message || "Payment failed. Try again.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-lg mx-auto bg-gradient-to-br from-gray-50 to-white rounded-3xl shadow-2xl space-y-6">
      <h2 className="text-3xl font-bold text-gray-800 text-center">Complete Your Payment</h2>
      
      <p className="text-center text-gray-600 text-lg">
        Total Amount: <span className="font-extrabold text-gray-900">Ksh {totalAmount.toLocaleString()}</span>
      </p>

      {/* Status message */}
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
  );
}
