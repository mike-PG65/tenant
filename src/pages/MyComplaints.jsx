import React, { useEffect, useState } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, X, Pencil } from "lucide-react";
import { useNavigate } from "react-router-dom";

const MyComplaints = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedComplaint, setSelectedComplaint] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchComplaints = async () => {
      try {
        const { data } = await axios.get("http://localhost:4050/api/complaints/my", {
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem("token")}`,
          },
        });

        console.log(data);
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

  const handleComplaintClick = async (id) => {
    try {
      const { data } = await axios.get(`http://localhost:4050/api/complaints/my/${id}`, {
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem("token")}`,
        },
      });
      setSelectedComplaint(data.complaint);
    } catch (err) {
      console.error("Error fetching complaint details:", err);
    }
  };

  if (loading) return <p className="text-center py-10">Loading complaints...</p>;
  if (error) return <p className="text-center py-10 text-red-600">{error}</p>;
  if (complaints.length === 0)
    return <p className="text-center py-10">No complaints submitted yet.</p>;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-4">
      <h2 className="text-2xl font-bold text-gray-700 flex items-center gap-2">
        <AlertCircle size={24} /> My Complaints
      </h2>

      <AnimatePresence>
        {complaints.map((complaint) => (
          <motion.div
            key={complaint._id}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow"
          >
            <div
              onClick={() => handleComplaintClick(complaint._id)}
              className="cursor-pointer"
            >
              <p className="font-semibold text-gray-800">{complaint.subject}</p>

              {/* Truncated description */}
              <p
                className="text-gray-700 mt-1 overflow-hidden text-ellipsis line-clamp-2"
                style={{
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                }}
              >
                {complaint.description}
              </p>

              <p className="mt-2 text-sm text-gray-500">
                Status:{" "}
                <span
                  className={`font-semibold ${
                    complaint.status === "resolved"
                      ? "text-green-600"
                      : complaint.status === "inprogress"
                      ? "text-blue-600"
                      : "text-yellow-600"
                  }`}
                >
                  {complaint.status}
                </span>
              </p>
              <p className="mt-1 text-xs text-gray-400">
                Submitted: {new Date(complaint.createdAt).toLocaleDateString()}
              </p>
            </div>

            {/* ✅ Edit button (visible only if complaint is pending) */}
            {complaint.status === "pending" && (
              <div className="flex justify-end mt-3">
                <button
                  onClick={() => navigate(`/tenant/edit-complaint/${complaint._id}`)}
                  className="flex items-center gap-1 text-blue-600 text-sm font-medium hover:underline"
                >
                  <Pencil size={14} /> Edit
                </button>
              </div>
            )}
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Complaint Details Modal */}
      <AnimatePresence>
        {selectedComplaint && (
          <motion.div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedComplaint(null)}
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl shadow-lg max-w-md w-full p-6 relative"
            >
              <button
                onClick={() => setSelectedComplaint(null)}
                className="absolute top-3 right-3 text-gray-500 hover:text-gray-800"
              >
                <X size={20} />
              </button>

              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                {selectedComplaint.subject}
              </h3>
              <p className="text-gray-700 mb-4 whitespace-pre-line overflow-y-auto max-h-60">
                {selectedComplaint.description}
              </p>

              <div className="text-sm text-gray-600 space-y-1">
                <p>
                  <span className="font-medium">Status:</span>{" "}
                  <span
                    className={`${
                      selectedComplaint.status === "resolved"
                        ? "text-green-600"
                        : selectedComplaint.status === "inprogress"
                        ? "text-blue-600"
                        : "text-yellow-600"
                    } font-semibold`}
                  >
                    {selectedComplaint.status}
                  </span>
                </p>
                <p>
                  <span className="font-medium">Submitted:</span>{" "}
                  {new Date(selectedComplaint.createdAt).toLocaleString()}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MyComplaints;
