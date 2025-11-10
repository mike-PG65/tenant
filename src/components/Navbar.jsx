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
  List,
  Menu,
  X,
} from "lucide-react";

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  const storedUser = sessionStorage.getItem("user");
  const user = storedUser ? JSON.parse(storedUser) : null;

  const handleLogout = () => {
    sessionStorage.clear();
    navigate("/auth/login");
  };

  // ✅ Get display name or fallback
  const displayName = user
    ? user.name || (user.role === "admin" ? "Admin" : "Tenant")
    : null;

  return (
    <nav className="bg-white shadow-md px-4 sm:px-6 py-3 flex items-center justify-between sticky top-0 z-50">
      {/* Logo */}
      <div className="text-xl sm:text-2xl font-bold text-blue-600">
        🏠 Tenant Portal
      </div>

      {/* Desktop Menu */}
      <div className="hidden md:flex items-center space-x-6 lg:space-x-8 text-gray-700 font-medium">
        <Link
          to="/"
          className="flex items-center gap-2 hover:text-blue-600 transition-colors"
        >
          <Home size={20} /> Home
        </Link>

        {/* Only show tenant/admin links if logged in */}
        {user && (
          <>
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
          </>
        )}
      </div>

      {/* Mobile Menu Button */}
      <button
        className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
        onClick={() => setMenuOpen((prev) => !prev)}
      >
        {menuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Profile Dropdown (Desktop) */}
      <div className="relative hidden md:block">
        {user ? (
          <>
            <button
              onClick={() => setOpen((prev) => !prev)}
              className="flex items-center gap-2 bg-gray-100 px-3 py-2 rounded-full hover:bg-gray-200 transition-colors"
            >
              <User className="text-gray-700" size={20} />
              <span className="text-gray-800 font-medium">{displayName}</span>
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
          </>
        ) : (
          <Link
            to="/auth/login"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-full transition-colors"
          >
            Login
          </Link>
        )}
      </div>

      {/* Mobile Menu Drawer */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 w-full bg-white shadow-md border-t border-gray-100 flex flex-col items-start p-4 space-y-3 md:hidden z-40"
          >
            {user ? (
              <>
                <div className="w-full flex items-center justify-between border-b border-gray-200 pb-3 mb-2">
                  <div className="flex items-center gap-2">
                    <User size={20} className="text-blue-600" />
                    <span className="text-gray-800 font-medium text-lg">
                      {displayName}
                    </span>
                  </div>
                </div>

                <Link
                  to="/"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition-colors w-full"
                >
                  <Home size={20} /> Home
                </Link>

                <Link
                  to="/tenant/complaints"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition-colors w-full"
                >
                  <AlertCircle size={20} /> Submit Complaint
                </Link>

                <Link
                  to="/tenant/my-complaints"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition-colors w-full"
                >
                  <List size={20} /> My Complaints
                </Link>

                <Link
                  to="/tenant/messages"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition-colors w-full"
                >
                  <MessageSquare size={20} /> Messages
                </Link>

                <Link
                  to="/tenant/payment"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition-colors w-full"
                >
                  <CreditCard size={20} /> Payment
                </Link>

                <div className="border-t border-gray-200 pt-3 w-full">
                  <Link
                    to="/tenant/profile"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition-colors w-full"
                  >
                    <User size={20} /> Profile
                  </Link>

                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 text-red-600 hover:text-red-700 transition-colors w-full mt-2"
                  >
                    <LogOut size={20} /> Logout
                  </button>
                </div>
              </>
            ) : (
              <Link
                to="/auth/login"
                onClick={() => setMenuOpen(false)}
                className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-full text-center"
              >
                Login
              </Link>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
