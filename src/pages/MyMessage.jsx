import React, { useEffect, useState } from "react";
import axios from "axios";
import { Mail, Inbox, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const MyMessages = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  const apiUrl = import.meta.env.VITE_BASE_URL

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const { data } = await axios.get(`${apiUrl}/messages/my`, {
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem("token")}`,
          },
        });
        setMessages(data.messages || []);
      } catch (err) {
        console.error("Error fetching messages:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchMessages();
  }, []);

  // Loading state
  if (loading)
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] text-gray-600">
        <Mail size={40} className="animate-bounce mb-4 text-blue-500" />
        <p className="text-lg font-medium">Loading your messages...</p>
      </div>
    );

  // Empty state
  if (messages.length === 0)
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] text-center text-gray-500">
        <Inbox size={60} className="mb-4 text-gray-400" />
        <h3 className="text-xl font-semibold mb-2">No Messages Yet</h3>
        <p className="text-gray-600">
          When your landlord or admin sends you a message, it will appear here.
        </p>
      </div>
    );

  // Messages list
  return (
    <div className="max-w-4xl mx-auto mt-10 p-6 bg-gray-50 rounded-xl shadow-inner">
      <h2 className="text-3xl font-bold mb-6 text-gray-800 flex items-center gap-2">
        <Mail className="text-blue-600" size={28} /> My Messages
      </h2>

      <div className="space-y-4">
        <AnimatePresence>
          {messages.map((msg) => (
            <motion.div
              key={msg._id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-lg shadow-sm hover:shadow-md transition-all p-5 border border-gray-200"
            >
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                {msg.subject}
              </h3>
              <p className="text-gray-700 mb-4 whitespace-pre-line leading-relaxed">
                {msg.body}
              </p>

              <div className="flex justify-between items-center text-sm text-gray-500">
                <p className="flex items-center gap-1">
                  <User size={15} className="text-gray-400" />
                  From: <span className="font-medium">{msg.senderId?.name || "Admin"}</span>
                </p>
                <span>{new Date(msg.createdAt).toLocaleString()}</span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default MyMessages;
