import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home,
  MessageSquare,
  AlertCircle,
  User,
  LogOut,
  ChevronDown,
  CreditCard,
  List, // New icon for My Complaints
} from "lucide-react";

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const storedUser = sessionStorage.getItem("user");
  const user = storedUser ? JSON.parse(storedUser) : null;

  const handleLogout = () => {
    sessionStorage.clear();
    navigate("/auth/login");
  };

  return (
    <nav className="bg-white shadow-md px-6 py-3 flex items-center justify-between sticky top-0 z-50">
      {/* Logo / Brand */}
      <div className="text-2xl font-bold text-blue-600">🏠 Tenant Portal</div>

      {/* Main Menu */}
      <div className="flex items-center space-x-8 text-gray-700 font-medium">
        <Link
          to="/"
          className="flex items-center gap-2 hover:text-blue-600 transition-colors"
        >
          <Home size={20} /> Home
        </Link>

        <Link
          to="/tenant/complaints"
          className="flex items-center gap-2 hover:text-blue-600 transition-colors"
        >
          <AlertCircle size={20} /> Submit Complaint
        </Link>

        <Link
          to="/tenant/my-complaints"
          className="flex items-center gap-2 hover:text-blue-600 transition-colors"
        >
          <List size={20} /> My Complaints
        </Link>

        <Link
          to="/tenant/messages"
          className="flex items-center gap-2 hover:text-blue-600 transition-colors"
        >
          <MessageSquare size={20} /> Messages
        </Link>

        <Link
          to="/tenant/payment"
          className="flex items-center gap-2 hover:text-blue-600 transition-colors"
        >
          <CreditCard size={20} /> Payment
        </Link>
      </div>

      {/* Profile Dropdown */}
      <div className="relative">
        <button
          onClick={() => setOpen((prev) => !prev)}
          className="flex items-center gap-2 bg-gray-100 px-3 py-2 rounded-full hover:bg-gray-200 transition-colors"
        >
          <User className="text-gray-700" size={20} />
          <span className="text-gray-800 font-medium">{user?.name || "Tenant"}</span>
          <ChevronDown
            size={16}
            className={`transition-transform ${open ? "rotate-180" : ""}`}
          />
        </button>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="absolute right-0 mt-2 w-44 bg-white border border-gray-100 rounded-lg shadow-lg overflow-hidden z-50"
            >
              <Link
                to="/tenant/profile"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <User size={18} /> Profile
              </Link>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-4 py-3 text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut size={18} /> Logout
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
};

export default Navbar;
