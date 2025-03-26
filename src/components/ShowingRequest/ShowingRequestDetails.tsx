import React, { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../../services/firebase";
import { ShowingRequestEscalation } from "./ShowingRequestEscalation";
import { UserProfile } from "../../services/authService";

interface ShowingRequestDetailsProps {
  requestId: string;
  preferredAgents: UserProfile[];
  allAgents: UserProfile[];
}

interface ShowingRequest {
  propertyId: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  preferredDate: Date;
  status: string;
  assignedAgentId?: string;
  createdAt: Date;
  updatedAt: Date;
  isPublic?: boolean;
  notifiedAgents?: string[];
}

export const ShowingRequestDetails: React.FC<ShowingRequestDetailsProps> = ({
  requestId,
  preferredAgents,
  allAgents,
}) => {
  const [request, setRequest] = useState<ShowingRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const requestRef = doc(db, "showingRequests", requestId);
    const unsubscribe = onSnapshot(
      requestRef,
      (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          setRequest({
            ...data,
            preferredDate: data.preferredDate?.toDate(),
            createdAt: data.createdAt?.toDate(),
            updatedAt: data.updatedAt?.toDate(),
          } as ShowingRequest);
        } else {
          setError("Request not found");
        }
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching request:", error);
        setError("Error loading request details");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [requestId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">{error}</p>
      </div>
    );
  }

  if (!request) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold mb-4">Showing Request Details</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="text-lg font-semibold mb-2">Client Information</h3>
            <div className="space-y-2">
              <p>
                <span className="font-medium">Name:</span> {request.clientName}
              </p>
              <p>
                <span className="font-medium">Email:</span> {request.clientEmail}
              </p>
              <p>
                <span className="font-medium">Phone:</span> {request.clientPhone}
              </p>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Request Details</h3>
            <div className="space-y-2">
              <p>
                <span className="font-medium">Property ID:</span>{" "}
                {request.propertyId}
              </p>
              <p>
                <span className="font-medium">Preferred Date:</span>{" "}
                {request.preferredDate.toLocaleString()}
              </p>
              <p>
                <span className="font-medium">Status:</span>{" "}
                <span className="capitalize">{request.status}</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      <ShowingRequestEscalation
        requestId={requestId}
        currentStatus={request.status}
        assignedAgentId={request.assignedAgentId}
        preferredAgents={preferredAgents}
        allAgents={allAgents}
      />
    </div>
  );
}; 