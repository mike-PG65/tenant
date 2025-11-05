import React, { useState } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";

const AuthForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const apiUrl = import.meta.env.VITE_BASE_URL

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage("");
    setIsError(false);
    setLoading(true);

    try {
      const res = await axios.post(`${apiUrl}/auth/login`, formData, {
        withCredentials: true,
      });

      sessionStorage.setItem("token", res.data.token);
      sessionStorage.setItem("user", JSON.stringify(res.data.user));

      setMessage("✅ Login successful! Redirecting...");
      setTimeout(() => navigate("/"), 1500);
    } catch (err) {
      setIsError(true);
      setMessage(err.response?.data?.error || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    setMessage("");
    setIsError(false);
    setLoading(true);

    try {
      const res = await axios.post(`${apiUrl}/auth/forgot-password`, {
        email: resetEmail,
      });

      setMessage(res.data.message || "✅ Password reset email sent!");
      setShowReset(false);
      setResetEmail("");
    } catch (err) {
      setIsError(true);
      setMessage(err.response?.data?.error || "Email not found or failed to send.");
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
          Tenant Portal Login
        </h2>

        {/* Normal Login Form */}
        {!showReset ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="email"
              name="email"
              placeholder="Email Address"
              value={formData.email}
              onChange={handleChange}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-400 outline-none"
              required
            />

            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-400 outline-none"
              required
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-lg font-medium transition-all duration-300"
            >
              {loading ? "Logging in..." : "Login"}
            </button>

            <div className="text-center mt-3">
              <button
                type="button"
                onClick={() => setShowReset(true)}
                className="text-sm text-indigo-600 hover:underline"
              >
                Forgot Password?
              </button>
            </div>
          </form>
        ) : (
          /* Forgot Password Form */
          <form onSubmit={handlePasswordReset} className="space-y-4">
            <h3 className="text-lg font-semibold text-center text-gray-700">
              Reset Your Password
            </h3>
            <input
              type="email"
              placeholder="Enter your registered email"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-400 outline-none"
              required
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-lg font-medium transition-all duration-300"
            >
              {loading ? "Sending..." : "Send Reset Link"}
            </button>

            <div className="text-center mt-3">
              <button
                type="button"
                onClick={() => setShowReset(false)}
                className="text-sm text-gray-500 hover:underline"
              >
                ← Back to Login
              </button>
            </div>
          </form>
        )}

        {/* Feedback Message */}
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

export default AuthForm;
