import React, { useEffect, useState } from "react";
import axios from "axios";

export default function PaymentsList() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState({ message: "", type: "" });

  const BASE_URL = import.meta.env.VITE_BASE_URL;
  const token = sessionStorage.getItem("token");

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const { data } = await axios.get(`${BASE_URL}/payment/all`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        setPayments(data.payments || []);
      } catch (err) {
        console.error("❌ Error fetching payments:", err);
        setStatus({
          message: err.response?.data?.message || "Failed to load payments.",
          type: "error",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen text-gray-500 text-lg">
        Loading payments...
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">
        Payment History
      </h2>

      {status.message && (
        <div
          className={`p-3 mb-4 rounded-lg text-center ${
            status.type === "error"
              ? "bg-red-100 text-red-700"
              : "bg-green-100 text-green-700"
          }`}
        >
          {status.message}
        </div>
      )}

      {payments.length === 0 ? (
        <p className="text-center text-gray-500 text-lg">
          No payments found.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white shadow-lg rounded-xl overflow-hidden">
            <thead className="bg-gray-800 text-white">
              <tr>
                <th className="py-3 px-5 text-left">Tenant</th>
                <th className="py-3 px-5 text-left">House</th>
                <th className="py-3 px-5 text-left">Method</th>
                <th className="py-3 px-5 text-left">Amount</th>
                <th className="py-3 px-5 text-left">Status</th>
                <th className="py-3 px-5 text-left">Date</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr
                  key={p._id}
                  className="border-b hover:bg-gray-50 transition-colors"
                >
                  <td className="py-3 px-5">
                    {p.tenantId?.name || "N/A"} <br />
                    <span className="text-xs text-gray-500">
                      {p.tenantId?.email}
                    </span>
                  </td>
                  <td className="py-3 px-5">{p.rentalId?.houseNumber || "N/A"}</td>
                  <td className="py-3 px-5 capitalize">{p.method}</td>
                  <td className="py-3 px-5 font-semibold text-gray-900">
                    Ksh {p.amount.toLocaleString()}
                  </td>
                  <td
                    className={`py-3 px-5 font-semibold ${
                      p.status === "successful"
                        ? "text-green-600"
                        : p.status === "pending"
                        ? "text-yellow-600"
                        : "text-red-600"
                    }`}
                  >
                    {p.status}
                  </td>
                  <td className="py-3 px-5 text-gray-600">
                    {new Date(p.paymentDate).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
