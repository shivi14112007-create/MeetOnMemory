import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import AppContent from "../context/AppContent";
import Navbar from "../components/Navbar.jsx";
import { knowledgeApi } from "../services";

const KnowledgeTimeline = () => {
  const { decisionId } = useParams();

  const [lineage, setLineage] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLineage = async () => {
      try {
        const res = await knowledgeApi.getDecisionLineage(decisionId);

        if (res.data?.success) {
          setLineage(res.data.lineage);
        }
      } catch (err) {
        console.error("Failed to load decision lineage", err);
      } finally {
        setLoading(false);
      }
    };

    fetchLineage();
  }, [decisionId]);

  return (
    <div>
      <Navbar />

      <div className="p-6 max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Decision Timeline</h1>

        {loading && <p>Loading...</p>}

        {!loading && lineage.length === 0 && <p>No history found.</p>}

        <div className="space-y-4">
          {lineage.map((d) => (
            <div key={d._id} className="border-l-2 border-blue-500 pl-4 py-2">
              <p className="text-sm text-gray-500">
                {new Date(d.createdAt).toLocaleDateString()} —{" "}
                {d.sourceMeetingId?.title}
              </p>

              <p className="font-medium">{d.text}</p>

              <span className="text-xs uppercase text-gray-400">
                {d.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default KnowledgeTimeline;
