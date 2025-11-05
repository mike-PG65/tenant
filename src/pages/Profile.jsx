import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  User,
  Mail,
  Phone,
  Loader2,
  Edit,
  Save,
  Upload,
  Camera,
} from "lucide-react";
import { motion } from "framer-motion";
import { toast, Toaster } from "react-hot-toast";

const Profile = () => {
  const [user, setUser] = useState(null);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", phone: "" });
  const [loading, setLoading] = useState(true);
  const [idScan, setIdScan] = useState(null);
  const [uploading, setUploading] = useState(false);

  const token = sessionStorage.getItem("token");
  const userInfo = JSON.parse(sessionStorage.getItem("user"));
  const userId = userInfo?.id;

  const API_BASE = import.meta.env.VITE_BASE_URL;

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get(`${API_BASE}/auth/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(res.data);
        setFormData({
          name: res.data.name,
          email: res.data.email,
          phone: res.data.phone || "",
        });
      } catch (err) {
        console.error("Error fetching profile:", err);
        toast.error("Failed to load profile!");
      } finally {
        setLoading(false);
      }
    };

    if (userId && token) fetchProfile();
  }, [userId, token]);

  const handleChange = (e) =>
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleUpdate = async () => {
    try {
      const res = await axios.put(`${API_BASE}/auth/edit/${userId}`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser(res.data.user);
      toast.success("Profile updated successfully!");
      setEditing(false);
    } catch (err) {
      console.error("Error updating profile:", err);
      toast.error("Failed to update profile!");
    }
  };

  const handleIdScanUpload = async (e) => {
    e.preventDefault();
    if (!idScan) return toast.error("Please select a file first!");

    const formData = new FormData();
    formData.append("idScan", idScan);

    try {
      setUploading(true);
      const res = await axios.patch(`${API_BASE}/auth/idscan`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      setUser(res.data.user);
      setIdScan(null);
      toast.success("ID Scan uploaded successfully!");
    } catch (err) {
      console.error("Error uploading ID scan:", err);
      toast.error(
        err.response?.data?.error || "Failed to upload ID scan!"
      );
    } finally {
      setUploading(false);
    }
  };

  if (loading)
    return (
      <div className="flex justify-center items-center h-screen bg-gradient-to-br from-blue-50 to-blue-100">
        <Loader2 className="animate-spin text-blue-600" size={48} />
      </div>
    );

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : "U";

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 flex justify-center items-center p-4">
      <Toaster position="top-right" reverseOrder={false} />
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-2xl bg-white/70 backdrop-blur-lg shadow-xl rounded-3xl p-10 border border-gray-100"
      >
        <div className="text-center mb-8">
          {/* Avatar */}
          <div className="relative w-28 h-28 mx-auto mb-4">
            <div className="w-full h-full bg-blue-600 text-white flex items-center justify-center text-3xl font-bold rounded-full shadow-lg">
              {initials}
            </div>
            <button className="absolute bottom-1 right-1 bg-blue-500 p-2 rounded-full text-white hover:bg-blue-600 transition">
              <Camera size={16} />
            </button>
          </div>
          <h2 className="text-3xl font-bold text-gray-800">{user?.name}</h2>
          <p className="text-gray-500 capitalize">{user?.role}</p>
        </div>

        {/* Profile Info */}
        <div className="space-y-5">
          <ProfileField
            icon={<User className="text-blue-500" />}
            label="Name"
            editing={editing}
            name="name"
            value={formData.name}
            handleChange={handleChange}
          />
          <ProfileField
            icon={<Mail className="text-blue-500" />}
            label="Email"
            editing={editing}
            name="email"
            value={formData.email}
            handleChange={handleChange}
          />
          <ProfileField
            icon={<Phone className="text-blue-500" />}
            label="Phone"
            editing={editing}
            name="phone"
            value={formData.phone}
            handleChange={handleChange}
          />
        </div>

        {/* ID Scan Upload */}
        <div className="mt-8 bg-blue-50 border border-blue-100 rounded-xl p-5">
          <h3 className="text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <Upload className="text-blue-500" size={18} /> ID Scan
          </h3>

          {user?.idScan ? (
            <p className="text-green-600 mb-2">✔️ ID Scan already uploaded</p>
          ) : (
            <p className="text-gray-500 mb-2">No ID scan uploaded yet</p>
          )}

          <form
            onSubmit={handleIdScanUpload}
            className="flex flex-col md:flex-row items-center gap-4"
          >
            <input
              type="file"
              accept="image/*,.pdf"
              onChange={(e) => setIdScan(e.target.files[0])}
              className="block w-full text-sm text-gray-700 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200 transition"
            />
            <button
              type="submit"
              disabled={uploading}
              className="px-5 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2 hover:bg-blue-700 transition disabled:opacity-50"
            >
              {uploading ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <Upload size={18} />
              )}
              {uploading ? "Uploading..." : "Upload"}
            </button>
          </form>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex justify-end gap-4">
          {editing ? (
            <>
              <button
                onClick={() => setEditing(false)}
                className="px-5 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdate}
                className="px-5 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2 hover:bg-blue-700 transition"
              >
                <Save size={18} /> Save
              </button>
            </>
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="px-5 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2 hover:bg-blue-700 transition"
            >
              <Edit size={18} /> Edit Profile
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
};

// Reusable field component
const ProfileField = ({ icon, label, editing, name, value, handleChange }) => (
  <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4 border-b border-gray-100 pb-3">
    <div className="flex items-center gap-2 w-32 text-gray-700 font-medium">
      {icon}
      {label}
    </div>
    {editing ? (
      <input
        type="text"
        name={name}
        value={value}
        onChange={handleChange}
        className="flex-1 border-b-2 border-gray-200 focus:border-blue-500 outline-none p-1 text-gray-800 bg-transparent"
      />
    ) : (
      <p className="text-gray-600 flex-1">{value || "—"}</p>
    )}
  </div>
);

export default Profile;
