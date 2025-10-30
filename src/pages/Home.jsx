import React, { useEffect, useState } from "react";
import axios from "axios";
import { Home, CreditCard, Calendar, AlertTriangle, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

const TenantDashboard = () => {
  const [rentals, setRentals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const storedUser = sessionStorage.getItem("user");
  const user = storedUser ? JSON.parse(storedUser) : null;
  const tenantId = user?.id;
  const token = sessionStorage.getItem("token");

  useEffect(() => {
    const fetchRentals = async () => {
      try {
        const res = await axios.get(
          `http://localhost:4050/api/rental/tenant/${tenantId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setRentals(res.data);
      } catch (err) {
        console.error("Error fetching rentals:", err);
        setError("Failed to load your rental data.");
      } finally {
        setLoading(false);
      }
    };
    if (tenantId) fetchRentals();
  }, [tenantId, token]);

  if (loading)
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="animate-spin text-blue-600" size={48} />
      </div>
    );

  if (error)
    return (
      <div className="flex justify-center items-center h-screen text-red-600 font-semibold">
        {error}
      </div>
    );

  // ✅ Derived stats
  const totalRent = rentals.reduce((sum, r) => sum + (r.amount || 0), 0);
  const activeRentals = rentals.filter((r) => r.rentalStatus === "active").length;

  // ✅ Updated Helper Function
  const getNextPaymentInfo = (dueDate, nextPaymentDate, paymentStatus) => {
    const today = new Date();
    const due = new Date(dueDate);
    const nextPay = new Date(nextPaymentDate);
    const diffTime = due - today;
    const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (paymentStatus === "paid") {
      return {
        label: `Paid. Next rent due on ${nextPay.toLocaleDateString()}`,
        color: "text-green-600",
        sub: "All payments are up to date ✅",
      };
    }

    if (paymentStatus === "pending") {
      if (daysLeft > 0) {
        return {
          label: `Due in ${daysLeft} day${daysLeft > 1 ? "s" : ""} (${due.toLocaleDateString()})`,
          color: "text-yellow-600",
          sub: "Please make payment soon.",
        };
      } else if (daysLeft === 0) {
        return {
          label: `Due today (${due.toLocaleDateString()})`,
          color: "text-yellow-700",
          sub: "Please pay before the end of the day to avoid penalty.",
        };
      }
    }

    if (paymentStatus === "late") {
      // ✅ Show the date the rent was supposed to be paid
      const overdueDays = Math.ceil((today - due) / (1000 * 60 * 60 * 24));
      return {
        label: `Overdue by ${overdueDays} day${overdueDays > 1 ? "s" : ""} (was due ${due.toLocaleDateString()})`,
        color: "text-red-600",
        sub: "Your rent payment is late ⚠️ Please pay immediately.",
      };
    }

    return {
      label: "No payment info",
      color: "text-gray-500",
      sub: "",
    };
  };

  return (
    <div className="bg-gradient-to-b from-gray-50 to-gray-100 min-h-screen p-8">
      {/* Header */}
      <header className="mb-10">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">
          Welcome back, <span className="text-blue-600">{user?.name}</span> 👋
        </h1>
        <p className="text-gray-500 text-lg">
          Here’s your latest rental summary and payment updates.
        </p>
      </header>

      {/* Stats Section */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="bg-white shadow-lg rounded-xl p-6 flex items-center space-x-4 border border-gray-100"
        >
          <Home className="text-blue-600" size={40} />
          <div>
            <p className="text-gray-500 text-sm">Active Rentals</p>
            <h3 className="text-3xl font-bold text-gray-800">{activeRentals}</h3>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.05 }}
          className="bg-white shadow-lg rounded-xl p-6 flex items-center space-x-4 border border-gray-100"
        >
          <CreditCard className="text-green-600" size={40} />
          <div>
            <p className="text-gray-500 text-sm">Total Monthly Rent</p>
            <h3 className="text-3xl font-bold text-gray-800">Ksh {totalRent}</h3>
          </div>
        </motion.div>

        {/* ✅ Next Payment Cycle Card */}
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="bg-white shadow-lg rounded-xl p-6 flex items-center space-x-4 border border-gray-100"
        >
          <Calendar className="text-yellow-600" size={40} />
          <div>
            <p className="text-gray-500 text-sm">Next Payment Cycle</p>
            {rentals.length > 0 ? (
              (() => {
                const nextInfo = getNextPaymentInfo(
                  rentals[0].dueDate,
                  rentals[0].nextPaymentDate,
                  rentals[0].paymentStatus
                );
                return (
                  <>
                    <h3 className={`text-xl font-bold ${nextInfo.color}`}>
                      {nextInfo.label}
                    </h3>
                    {nextInfo.sub && (
                      <p className="text-gray-500 text-xs italic mt-1">
                        {nextInfo.sub}
                      </p>
                    )}
                  </>
                );
              })()
            ) : (
              <h3 className="text-2xl font-bold text-gray-800">N/A</h3>
            )}
          </div>
        </motion.div>
      </div>

      {/* Rentals Section */}
      <div>
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">
          Your Current Rentals
        </h2>

        {rentals.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <AlertTriangle className="text-gray-400 mb-4" size={50} />
            <p className="text-gray-600 text-lg">
              You currently have no active rentals.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {rentals.map((rental, index) => {
              const nextInfo = getNextPaymentInfo(
                rental.dueDate,
                rental.nextPaymentDate,
                rental.paymentStatus
              );

              return (
                <motion.div
                  key={rental._id}
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white border border-gray-100 shadow-md hover:shadow-xl rounded-2xl p-6 transition-all duration-300"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xl font-semibold text-blue-700">
                      House No: {rental.houseId?.houseNo || "N/A"}
                    </h3>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        rental.paymentStatus === "paid"
                          ? "bg-green-100 text-green-700"
                          : rental.paymentStatus === "late"
                          ? "bg-red-100 text-red-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {rental.paymentStatus}
                    </span>
                  </div>

                  <div className="space-y-2 text-gray-700 text-sm">
                    <p>
                      <strong>Rent Amount:</strong> Ksh {rental.amount}
                    </p>
                    <p>
                      <strong>Start Date:</strong>{" "}
                      {new Date(rental.startDate).toLocaleDateString()}
                    </p>
                    <p>
                      <strong>
                        {rental.paymentStatus === "late" ? "Missed Payment:" : "Next Payment:"}
                      </strong>{" "}
                      <span className={`${nextInfo.color} font-semibold`}>
                        {nextInfo.label}
                      </span>
                    </p>
                    {nextInfo.sub && (
                      <p className="text-gray-500 text-xs italic">
                        {nextInfo.sub}
                      </p>
                    )}
                    <p>
                      <strong>Rental Status:</strong>{" "}
                      <span
                        className={`font-semibold ${
                          rental.rentalStatus === "active"
                            ? "text-green-600"
                            : "text-gray-500"
                        }`}
                      >
                        {rental.rentalStatus}
                      </span>
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default TenantDashboard;
