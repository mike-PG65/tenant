import React, { useEffect, useState } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2,
  AlertCircle,
  Pencil,
  Calendar,
  Wrench,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const MyComplaints = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const apiUrl = import.meta.env.VITE_BASE_URL

  useEffect(() => {
    const fetchComplaints = async () => {
      try {
        const { data } = await axios.get(`${apiUrl}/complaints/my`, {
          headers: { Authorization: `Bearer ${sessionStorage.getItem("token")}` },
        });
        setComplaints(data.complaints || []);
      } catch (err) {
        console.error(err);
        setError("Failed to fetch complaints");
      } finally {
        setLoading(false);
      }
    };
    fetchComplaints();
  }, []);

  const getStatusBadge = (status) => {
    switch (status) {
      case "resolved":
        return (
          <span className="flex items-center text-green-700 bg-green-100 px-3 py-1 rounded-full text-xs font-semibold">
            <CheckCircle className="w-4 h-4 mr-1" /> Resolved
          </span>
        );
      case "in progress":
        return (
          <span className="flex items-center text-blue-700 bg-blue-100 px-3 py-1 rounded-full text-xs font-semibold">
            <Wrench className="w-4 h-4 mr-1" /> In Progress
          </span>
        );
      case "pending":
        return (
          <span className="flex items-center text-yellow-700 bg-yellow-100 px-3 py-1 rounded-full text-xs font-semibold">
            <AlertTriangle className="w-4 h-4 mr-1" /> Pending
          </span>
        );
      default:
        return (
          <span className="text-gray-600 bg-gray-100 px-3 py-1 rounded-full text-xs font-semibold">
            Unknown
          </span>
        );
    }
  };

  // 🌀 Loading
  if (loading)
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] text-gray-600">
        <Loader2 size={40} className="animate-spin mb-3 text-blue-600" />
        <p className="text-lg font-medium">Loading your complaints...</p>
      </div>
    );

  // ❌ Error
  if (error)
    return (
      <div className="text-center py-10 text-red-600 font-medium">{error}</div>
    );

  // 🪶 No Complaints
  if (complaints.length === 0)
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] text-gray-600">
        <AlertCircle size={40} className="text-blue-500 mb-3" />
        <p className="text-lg">You haven’t submitted any complaints yet.</p>
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 p-8">
      <header className="mb-10 text-center">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">My Complaints</h1>
        <p className="text-gray-500 text-lg">
          View and track the progress of all complaints you’ve submitted.
        </p>
      </header>

      {/* Complaint Cards Grid */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        <AnimatePresence>
          {complaints.map((complaint, i) => (
            <motion.div
              key={complaint._id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white border border-gray-100 shadow-md hover:shadow-xl rounded-2xl p-6 transition-all duration-300 cursor-pointer hover:-translate-y-1 flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-lg font-semibold text-blue-700">
                    {complaint.subject}
                  </h3>
                  {getStatusBadge(complaint.status)}
                </div>

                <p className="text-gray-700 text-sm mb-4 leading-relaxed line-clamp-3">
                  {complaint.description}
                </p>
              </div>

              <div className="text-sm text-gray-600 border-t pt-3 flex justify-between items-center">
                <div className="flex items-center gap-1">
                  <Calendar size={14} />
                  {new Date(complaint.createdAt).toLocaleDateString()}
                </div>

                {complaint.status === "pending" && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/tenant/edit-complaint/${complaint._id}`);
                    }}
                    className="flex items-center gap-1 text-blue-600 text-sm font-medium hover:underline"
                  >
                    <Pencil size={14} /> Edit
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default MyComplaints;
