import React, { useState, useEffect } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { AlertCircle, CheckCircle } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";

const ComplaintForm = ({ isEdit = false }) => {
  const [formData, setFormData] = useState({ subject: "", description: "" });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const { id } = useParams(); // complaintId for editing
  const navigate = useNavigate();
  const token = sessionStorage.getItem("token");

  // ✅ Fetch complaint details if editing
  useEffect(() => {
    if (isEdit && id) {
      const fetchComplaint = async () => {
        try {
          const { data } = await axios.get(
            `http://localhost:4050/api/complaints/my/${id}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          setFormData({
            subject: data.complaint.subject,
            description: data.complaint.description,
          });
        } catch (err) {
          console.error("Error fetching complaint:", err);
          setMessage({
            type: "error",
            text: "Failed to load complaint details.",
          });
        }
      };
      fetchComplaint();
    }
  }, [isEdit, id, token]);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      if (isEdit) {
        // ✅ Update existing complaint
        await axios.put(
          `http://localhost:4050/api/complaints/my/${id}`,
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setMessage({
          type: "success",
          text: "Your complaint has been updated successfully!",
        });
      } else {
        // ✅ Add new complaint
        await axios.post("http://localhost:4050/api/complaints/add", formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setMessage({
          type: "success",
          text: "Your complaint has been submitted successfully!",
        });
        setFormData({ subject: "", description: "" });
      }

      // Redirect after short delay
      setTimeout(() => navigate("/tenant/my-complaints"), 1500);
    } catch (err) {
      console.error("Error submitting complaint:", err);
      setMessage({
        type: "error",
        text: "Failed to submit complaint. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      className="max-w-xl mx-auto bg-white p-6 mt-6 rounded-2xl shadow-md border"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">
        {isEdit ? "Edit Complaint" : "Submit a Complaint"}
      </h2>

      {message.text && (
        <div
          className={`flex items-center gap-2 p-3 mb-4 rounded-md ${
            message.type === "success"
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}
        >
          {message.type === "success" ? <CheckCircle /> : <AlertCircle />}
          <p className="text-sm">{message.text}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Subject */}
        <div>
          <label className="block text-gray-600 font-medium mb-1">
            Complaint Subject
          </label>
          <input
            type="text"
            name="subject"
            value={formData.subject}
            onChange={handleChange}
            required
            placeholder="e.g., Water leakage, electricity issue..."
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-gray-600 font-medium mb-1">
            Complaint Description
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
            placeholder="Describe your issue in detail..."
            rows={4}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
          />
        </div>

        {/* Submit Button */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          disabled={loading}
          type="submit"
          className="w-full bg-blue-600 text-white font-medium py-2 rounded-md hover:bg-blue-700 transition disabled:opacity-60"
        >
          {loading
            ? isEdit
              ? "Updating..."
              : "Submitting..."
            : isEdit
            ? "Update Complaint"
            : "Submit Complaint"}
        </motion.button>
      </form>
    </motion.div>
  );
};

export default ComplaintForm;
