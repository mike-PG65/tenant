import React, { useState, useEffect } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, CheckCircle } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";

const ComplaintForm = ({ isEdit = false }) => {
  const [formData, setFormData] = useState({ subject: "", description: "" });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const { id } = useParams();
  const navigate = useNavigate();
  const token = sessionStorage.getItem("token");

  const apiUrl = import.meta.env.VITE_BASE_URL

  useEffect(() => {
    if (isEdit && id) {
      const fetchComplaint = async () => {
        try {
          const { data } = await axios.get(
            `${apiUrl}/complaints/my/${id}`,
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
        await axios.put(
          `${apiUrl}/complaints/my/${id}`,
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setMessage({
          type: "success",
          text: "Your complaint has been updated successfully!",
        });
      } else {
        await axios.post(`${apiUrl}/complaints/add`, formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setMessage({
          type: "success",
          text: "Your complaint has been submitted successfully!",
        });
        setFormData({ subject: "", description: "" });
      }

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
    <div className="min-h-screen flex justify-center items-center bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 px-4 sm:px-6 md:px-8 py-10">
      <motion.div
        className="w-full max-w-md sm:max-w-lg md:max-w-2xl bg-white p-6 sm:p-8 md:p-10 rounded-2xl shadow-lg border border-gray-200"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Header */}
        <h2 className="text-center text-2xl sm:text-3xl font-bold text-gray-800 mb-6">
          {isEdit ? "Edit Complaint" : "Submit a Complaint"}
        </h2>

        {/* Animated Message Alert */}
        <AnimatePresence>
          {message.text && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className={`flex items-center gap-2 p-3 mb-5 rounded-md text-sm sm:text-base ${
                message.type === "success"
                  ? "bg-green-50 text-green-700 border border-green-200"
                  : "bg-red-50 text-red-700 border border-red-200"
              }`}
            >
              {message.type === "success" ? <CheckCircle /> : <AlertCircle />}
              <p>{message.text}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="space-y-5 sm:space-y-6 text-sm sm:text-base"
        >
          {/* Subject */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Complaint Subject
            </label>
            <input
              type="text"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              required
              placeholder="e.g., Water leakage, electricity issue..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 sm:py-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Complaint Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              placeholder="Describe your issue in detail..."
              rows={5}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 sm:py-2.5 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
            />
          </div>

          {/* Submit Button */}
          <motion.button
            whileTap={{ scale: 0.97 }}
            disabled={loading}
            type="submit"
            className="w-full bg-blue-600 text-white font-semibold py-2.5 sm:py-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-60"
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
    </div>
  );
};

export default ComplaintForm;
