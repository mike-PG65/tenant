import React, { useState } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";

const AuthForm = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  const toggleForm = () => {
    setIsLogin(!isLogin);
    setMessage("");
    setIsError(false);
    setFormData({
      name: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
    });
  };

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isLogin && formData.password !== formData.confirmPassword) {
      setMessage("⚠️ Passwords do not match!");
      setIsError(true);
      return;
    }

    try {
      const endpoint = isLogin
        ? "http://localhost:4050/api/auth/login"
        : "http://localhost:4050/api/auth/register";

      const payload = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
      };

      const res = await axios.post(endpoint, payload, {
        withCredentials: true,
      });

      setIsError(false);
      setMessage(res.data.message || "Success!");

      if (isLogin) {
        // ✅ Save token & user in sessionStorage
        sessionStorage.setItem("token", res.data.token);
        sessionStorage.setItem("user", JSON.stringify(res.data.user));

        setMessage("✅ Login successful! Redirecting...");
        setTimeout(() => navigate("/"), 1500);
      } else {
        // After registration, go back to login view
        setTimeout(() => {
          toggleForm();
          setMessage("🎉 Registration successful! Please log in.");
          setIsError(false);
        }, 1500);
      }

      setFormData({
        name: "",
        email: "",
        phone: "",
        password: "",
        confirmPassword: "",
      });
    } catch (err) {
      setIsError(true);
      setMessage(err.response?.data?.error || "Something went wrong");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 via-white to-indigo-50">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white shadow-2xl rounded-2xl p-8 w-full max-w-md transition-all duration-500 border border-gray-100"
      >
        <h2 className="text-3xl font-bold text-center text-indigo-600 mb-6">
          {isLogin ? "Welcome Back" : "Join Jefrika Cabs"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <>
              <input
                type="text"
                name="name"
                placeholder="Full Name"
                value={formData.name}
                onChange={handleChange}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-400 outline-none"
                required
              />

              <input
                type="text"
                name="phone"
                placeholder="Phone Number"
                value={formData.phone}
                onChange={handleChange}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-400 outline-none"
                required
              />
            </>
          )}

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

          {!isLogin && (
            <input
              type="password"
              name="confirmPassword"
              placeholder="Confirm Password"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-400 outline-none"
              required
            />
          )}

          <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-lg font-medium transition-all duration-300"
          >
            {isLogin ? "Login" : "Register"}
          </button>
        </form>

        <AnimatePresence>
          {message && (
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`text-center text-sm mt-4 px-3 py-2 rounded-lg ${
                isError
                  ? "bg-red-100 text-red-600 border border-red-300"
                  : "bg-green-100 text-green-600 border border-green-300"
              }`}
            >
              {message}
            </motion.p>
          )}
        </AnimatePresence>

        <div className="text-center mt-6">
          <p className="text-sm text-gray-500">
            {isLogin
              ? "Don’t have an account?"
              : "Already have an account?"}{" "}
            <button
              onClick={toggleForm}
              className="text-indigo-600 hover:underline font-medium"
            >
              {isLogin ? "Register" : "Login"}
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default AuthForm;
