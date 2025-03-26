import React, { useEffect, useState } from "react";
import { doc, updateDoc, onSnapshot } from "firebase/firestore";
import { db } from "../../services/firebase";
import { UserProfile } from "../../services/authService";

interface ShowingRequestEscalationProps {
  requestId: string;
  currentStatus: string;
  assignedAgentId?: string;
  preferredAgents: UserProfile[];
  allAgents: UserProfile[];
}

const ESCALATION_TIMEOUT = 30 * 1000; // 30 seconds for testing
const PUBLIC_TIMEOUT = 2 * 60 * 1000; // 2 minutes for testing

export const ShowingRequestEscalation: React.FC<ShowingRequestEscalationProps> = ({
  requestId,
  currentStatus,
  assignedAgentId,
  preferredAgents,
  allAgents,
}) => {
  const [timeLeft, setTimeLeft] = useState<number>(ESCALATION_TIMEOUT);
  const [notifiedAgents, setNotifiedAgents] = useState<string[]>([]);
  const [isPublic, setIsPublic] = useState(false);

  useEffect(() => {
    const requestRef = doc(db, "showingRequests", requestId);
    const unsubscribe = onSnapshot(requestRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setIsPublic(data.isPublic || false);
        setNotifiedAgents(data.notifiedAgents || []);
      }
    });

    return () => unsubscribe();
  }, [requestId]);

  useEffect(() => {
    if (currentStatus === "pending" && !isPublic) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 0) {
            handleEscalation();
            return ESCALATION_TIMEOUT;
          }
          return prev - 1000;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [currentStatus, isPublic]);

  const handleEscalation = async () => {
    const requestRef = doc(db, "showingRequests", requestId);
    const currentNotifiedAgents = [...notifiedAgents];
    let nextAgentId: string | undefined;

    // Find the next agent to notify
    if (preferredAgents.length > 0) {
      // Try preferred agents first
      nextAgentId = preferredAgents.find(
        (agent) => !currentNotifiedAgents.includes(agent.uid)
      )?.uid;
    }

    if (!nextAgentId && allAgents.length > 0) {
      // If no preferred agents available, try all agents
      nextAgentId = allAgents.find(
        (agent) => !currentNotifiedAgents.includes(agent.uid)
      )?.uid;
    }

    if (nextAgentId) {
      // Add notification for the next agent
      currentNotifiedAgents.push(nextAgentId);
      await updateDoc(requestRef, {
        notifiedAgents: currentNotifiedAgents,
        updatedAt: new Date(),
      });

      // Create notification for the agent
      await updateDoc(doc(db, "users", nextAgentId, "notifications", requestId), {
        type: "showing_request",
        requestId,
        status: "pending",
        createdAt: new Date(),
        read: false,
      });
    } else {
      // No more agents to notify, mark as public
      await updateDoc(requestRef, {
        isPublic: true,
        updatedAt: new Date(),
      });
    }
  };

  const handleManualEscalation = async () => {
    await handleEscalation();
  };

  const formatTime = (ms: number) => {
    const seconds = Math.ceil(ms / 1000);
    return `${seconds}s`;
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="text-lg font-semibold mb-4">Request Escalation</h3>
      
      <div className="space-y-4">
        <div>
          <p className="text-sm text-gray-600">Current Status:</p>
          <p className="font-medium capitalize">{currentStatus}</p>
        </div>

        {!isPublic && currentStatus === "pending" && (
          <div>
            <p className="text-sm text-gray-600">Time until next escalation:</p>
            <p className="font-medium">{formatTime(timeLeft)}</p>
          </div>
        )}

        <div>
          <p className="text-sm text-gray-600">Notified Agents:</p>
          <ul className="mt-1 space-y-1">
            {notifiedAgents.map((agentId) => {
              const agent = [...preferredAgents, ...allAgents].find(
                (a) => a.uid === agentId
              );
              return (
                <li key={agentId} className="text-sm">
                  {agent?.name || "Unknown Agent"}
                </li>
              );
            })}
          </ul>
        </div>

        {!isPublic && currentStatus === "pending" && (
          <button
            onClick={handleManualEscalation}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
          >
            Escalate Now
          </button>
        )}

        {isPublic && (
          <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
            <p className="text-sm text-yellow-800">
              This request is now public and available to all agents.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}; 