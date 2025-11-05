import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { ArrowLeft, Loader2, AlertCircle } from "lucide-react";

const ViewComplaint = () => {
  const { id } = useParams(); // Get complaint ID from URL
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const apiUrl = import.meta.env.VITE_BASE_URL

  useEffect(() => {
    const fetchComplaint = async () => {
      try {
        const { data } = await axios.get(
          `${apiUrl}complaints/my/${id}`,
          {
            headers: {
              Authorization: `Bearer ${sessionStorage.getItem("token")}`,
            },
          }
        );

        setComplaint(data.complaint);
      } catch (err) {
        console.error("Error fetching complaint:", err);
        setError("Failed to fetch complaint details.");
      } finally {
        setLoading(false);
      }
    };

    fetchComplaint();
  }, [id]);

  if (loading)
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <Loader2 className="animate-spin text-blue-600" size={32} />
      </div>
    );

  if (error)
    return (
      <div className="text-center text-red-600 py-10">
        <AlertCircle size={24} className="inline mr-2" />
        {error}
      </div>
    );

  if (!complaint)
    return <p className="text-center py-10">Complaint not found.</p>;

  return (
    <div className="max-w-3xl mx-auto p-6">
      <Link
        to="/tenant/my-complaints"
        className="flex items-center text-blue-600 hover:text-blue-800 mb-4"
      >
        <ArrowLeft size={18} className="mr-2" /> Back to My Complaints
      </Link>

      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
        <h1 className="text-2xl font-semibold text-gray-800 mb-2">
          {complaint.subject}
        </h1>
        <p className="text-sm text-gray-500 mb-4">
          Submitted on{" "}
          {new Date(complaint.createdAt).toLocaleDateString()} at{" "}
          {new Date(complaint.createdAt).toLocaleTimeString()}
        </p>

        <div className="text-gray-700 whitespace-pre-line leading-relaxed border-t border-b py-4">
          {complaint.description}
        </div>

        <div className="mt-4 text-sm text-gray-600">
          <p>
            <span className="font-medium">Status:</span>{" "}
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

          {complaint.houseId && (
            <p>
              <span className="font-medium">House:</span>{" "}
              {complaint.houseId.houseNo}
            </p>
          )}
          {complaint.rentalId && (
            <p>
              <span className="font-medium">Payment:</span>{" "}
              {complaint.rentalId.amount} KSh (next due:{" "}
              {new Date(
                complaint.rentalId.nextPaymentDate
              ).toLocaleDateString()}
              )
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ViewComplaint;
