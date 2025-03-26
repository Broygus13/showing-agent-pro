import React from "react";
import { ShowingRequestEscalation } from "./ShowingRequestEscalation";
import { AcceptRequestButton } from "./AcceptRequestButton";
import { UserProfile } from "../../services/authService";
import { useRequestListener } from "../../hooks/useRequestListener";

interface ShowingRequestDetailsProps {
  requestId: string;
  preferredAgents: UserProfile[];
  allAgents: UserProfile[];
}

export const ShowingRequestDetails: React.FC<ShowingRequestDetailsProps> = ({
  requestId,
  preferredAgents,
  allAgents,
}) => {
  const { request, loading, error } = useRequestListener(requestId);

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

  // Find the accepting agent's name
  const acceptingAgent = request.acceptedBy 
    ? allAgents.find(agent => agent.uid === request.acceptedBy)
    : null;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Showing Request Details</h2>
          {request.status === 'accepted' ? (
            <div className="bg-green-50 border border-green-200 rounded-md px-4 py-2">
              <p className="text-green-800">
                This request has been accepted by{' '}
                <span className="font-semibold">
                  {acceptingAgent?.name || 'an agent'}
                </span>
                {request.acceptedAt && (
                  <span className="text-sm text-green-600 block">
                    on {request.acceptedAt.toLocaleString()}
                  </span>
                )}
              </p>
            </div>
          ) : (
            <AcceptRequestButton 
              requestId={requestId}
              currentStatus={request.status}
              onAccept={() => {
                // The status change will be handled by the Firestore listener
                // No need for additional logic here
              }}
            />
          )}
        </div>
        
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