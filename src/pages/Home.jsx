import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Home,
  CreditCard,
  Calendar,
  AlertTriangle,
  Loader2,
  LogIn,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const TenantDashboard = () => {
  const [rentals, setRentals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const storedUser = sessionStorage.getItem("user");
  const token = sessionStorage.getItem("token");
  const user = storedUser ? JSON.parse(storedUser) : null;
  const tenantId = user?.id;

  const apiUrl = import.meta.env.VITE_BASE_URL

  useEffect(() => {
    if (!token || !tenantId) {
      setError("You must be logged in to view your dashboard.");
      setLoading(false);
      return;
    }

    const fetchRentals = async () => {
      try {
        const res = await axios.get(
          `${apiUrl}/rental/tenant/${tenantId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setRentals(res.data);
      } catch (err) {
        console.error("Error fetching rentals:", err);
        setError("Failed to load your rental data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    fetchRentals();
  }, [tenantId, token]);

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] text-gray-600">
        <Loader2 size={40} className="animate-spin mb-4 text-blue-500" />
        <p className="text-lg font-medium">Loading your dashboard...</p>
      </div>
    );

  if (error)
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] text-center text-gray-500 px-6">
        <LogIn size={60} className="mb-4 text-blue-500" />
        <h3 className="text-xl font-semibold mb-2">Access Restricted</h3>
        <p className="text-gray-600 mb-6 max-w-md mx-auto">
          {error === "You must be logged in to view your dashboard."
            ? "Please log in to access your tenant dashboard and view your rental information."
            : error}
        </p>
        <button
          onClick={() => (window.location.href = "/auth/login")}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg shadow-md transition duration-200"
        >
          Go to Login
        </button>
      </div>
    );

  const totalRent = rentals.reduce((sum, r) => sum + (r.amount || 0), 0);
  const activeRentals = rentals.filter((r) => r.rentalStatus === "active").length;

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
      const overdueDays = Math.ceil((today - due) / (1000 * 60 * 60 * 24));
      return {
        label: `Overdue by ${overdueDays} day${overdueDays > 1 ? "s" : ""} (was due ${due.toLocaleDateString()})`,
        color: "text-red-600",
        sub: "Your rent payment is late ⚠️ Please pay immediately.",
      };
    }

    return { label: "No payment info", color: "text-gray-500", sub: "" };
  };

  return (
    <div className="bg-gradient-to-b from-blue-50 via-gray-50 to-white min-h-screen p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-8 sm:mb-10 text-center px-2"
      >
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-800 mb-2 tracking-tight">
          Welcome back,{" "}
          <span className="text-blue-600 font-bold">{user?.name}</span> 👋
        </h1>
        <p className="text-gray-500 text-base sm:text-lg">
          Here’s your latest rental summary and payment updates.
        </p>
      </motion.header>

      {/* Stats Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-10 sm:mb-12"
      >
        {[
          {
            icon: <Home className="text-blue-600" size={36} />,
            title: "Active Rentals",
            value: activeRentals,
          },
          {
            icon: <CreditCard className="text-green-600" size={36} />,
            title: "Total Monthly Rent",
            value: `Ksh ${totalRent}`,
          },
          {
            icon: <Calendar className="text-yellow-600" size={36} />,
            title: "Next Payment Cycle",
            value:
              rentals.length > 0
                ? getNextPaymentInfo(
                    rentals[0].dueDate,
                    rentals[0].nextPaymentDate,
                    rentals[0].paymentStatus
                  ).label
                : "N/A",
          },
        ].map((item, idx) => (
          <motion.div
            key={idx}
            whileHover={{ scale: 1.03 }}
            className="bg-white shadow-md hover:shadow-xl rounded-2xl p-5 sm:p-6 flex flex-col items-center justify-center text-center border border-gray-100 transition-all duration-300"
          >
            <div className="mb-3">{item.icon}</div>
            <p className="text-gray-500 text-sm sm:text-base mb-1">{item.title}</p>
            <h3 className="text-xl sm:text-2xl font-bold text-gray-800 break-words">
              {item.value}
            </h3>
          </motion.div>
        ))}
      </motion.div>

      {/* Rentals Section */}
      <AnimatePresence>
        {rentals.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-16 sm:py-20 px-4 text-center"
          >
            <AlertTriangle className="text-gray-400 mb-4" size={50} />
            <p className="text-gray-600 text-base sm:text-lg">
              You currently have no active rentals.
            </p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {rentals.map((rental, index) => {
              const nextInfo = getNextPaymentInfo(
                rental.dueDate,
                rental.nextPaymentDate,
                rental.paymentStatus
              );

              return (
                <motion.div
                  key={rental._id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white border border-gray-100 shadow-md hover:shadow-xl rounded-2xl p-5 sm:p-6 transition-all duration-300"
                >
                  <div className="flex flex-wrap items-center justify-between mb-3 gap-2">
                    <h3 className="text-lg sm:text-xl font-semibold text-blue-700">
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

                  <div className="space-y-2 text-gray-700 text-sm sm:text-base">
                    <p>
                      <strong>Rent Amount:</strong> Ksh {rental.amount}
                    </p>
                    <p>
                      <strong>Start Date:</strong>{" "}
                      {new Date(rental.startDate).toLocaleDateString()}
                    </p>
                    <p>
                      <strong>
                        {rental.paymentStatus === "late"
                          ? "Missed Payment:"
                          : "Next Payment:"}
                      </strong>{" "}
                      <span className={`${nextInfo.color} font-semibold`}>
                        {nextInfo.label}
                      </span>
                    </p>
                    {nextInfo.sub && (
                      <p className="text-gray-500 text-xs italic">{nextInfo.sub}</p>
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TenantDashboard;
