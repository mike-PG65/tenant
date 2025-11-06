import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);

  const apiUrl = import.meta.env.VITE_BASE_URL

  const handleReset = async (e) => {
    e.preventDefault();
    setMessage("");
    setIsError(false);

    if (password !== confirmPassword) {
      setIsError(true);
      setMessage("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(
        `${apiUrl}/auth/reset-password/${token}`,
        { password }
      );

      setMessage(res.data.message || "✅ Password reset successful!");
      setTimeout(() => navigate("/auth/login"), 2000);
    } catch (err) {
      setIsError(true);
      setMessage(err.response?.data?.error || "Invalid or expired reset link.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 via-white to-indigo-50 px-4">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white shadow-2xl rounded-2xl p-8 w-full max-w-md border border-gray-100"
      >
        <h2 className="text-3xl font-bold text-center text-indigo-600 mb-6">
          Reset Password
        </h2>

        <form onSubmit={handleReset} className="space-y-4">
          <input
            type="password"
            placeholder="New Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-400 outline-none"
            required
          />

          <input
            type="password"
            placeholder="Confirm New Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-400 outline-none"
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-lg font-medium transition-all duration-300"
          >
            {loading ? "Resetting..." : "Reset Password"}
          </button>
        </form>

        <AnimatePresence>
          {message && (
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`text-center text-sm mt-5 px-3 py-2 rounded-lg ${
                isError
                  ? "bg-red-100 text-red-600 border border-red-300"
                  : "bg-green-100 text-green-600 border border-green-300"
              }`}
            >
              {message}
            </motion.p>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default ResetPassword;
