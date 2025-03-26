/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import * as admin from "firebase-admin";
import {onDocumentCreated, onDocumentUpdated} from "firebase-functions/v2/firestore";

admin.initializeApp();

interface PreferredAgent {
  agentId: string;
  name: string;
  email: string;
  responseTimeout: number;
  order: number;
}

interface AgentPreferences {
  agentId: string;
  preferredAgents: PreferredAgent[];
  defaultResponseTimeout: number;
  maxEscalationTime: number;
}

interface ShowingRequest {
  id: string;
  propertyAddress: string;
  dateTime: string;
  buyerName: string;
  notes: string;
  status: "pending" | "accepted" | "completed";
  createdBy: string;
  createdAt: string;
  assignedTo?: string;
  assignedAt?: string;
  currentAgentIndex?: number;
  escalationStartTime?: string;
}

// Start writing functions
// https://firebase.google.com/docs/functions/typescript

// export const helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

/**
 * Get agent preferences from Firestore
 * @param {string} agentId - The ID of the agent
 * @return {Promise<AgentPreferences | null>} The agent's preferences or null
 */
async function getAgentPreferences(agentId: string): Promise<AgentPreferences | null> {
  const doc = await admin.firestore()
      .collection("agentPreferences")
      .doc(agentId)
      .get();
  return doc.exists ? doc.data() as AgentPreferences : null;
}

/**
 * Get all showing agents from the users collection
 * @return {Promise<string[]>} Array of showing agent IDs
 */
async function getAllShowingAgents(): Promise<string[]> {
  const snapshot = await admin.firestore()
      .collection("users")
      .where("role", "==", "showing_agent")
      .get();
  return snapshot.docs.map((doc) => doc.id);
}

/**
 * Escalate a showing request to the next agent in the preference list
 * @param {ShowingRequest} request - The showing request to escalate
 * @return {Promise<void>}
 */
async function escalateToNextAgent(request: ShowingRequest): Promise<void> {
  const preferences = await getAgentPreferences(request.createdBy);
  if (!preferences) {
    console.error("No preferences found for agent:", request.createdBy);
    return;
  }

  const currentIndex = request.currentAgentIndex || -1;
  const nextIndex = currentIndex + 1;

  // If we've gone through all preferred agents
  if (nextIndex >= preferences.preferredAgents.length) {
    // Check if we've exceeded max escalation time
    const escalationStartTime = new Date(
        request.escalationStartTime || request.createdAt
    );
    const now = new Date();
    const escalationDuration =
      (now.getTime() - escalationStartTime.getTime()) / (1000 * 60);

    if (escalationDuration >= preferences.maxEscalationTime) {
      // Get all showing agents and assign to a random one
      const allAgents = await getAllShowingAgents();
      if (allAgents.length > 0) {
        const randomIndex = Math.floor(Math.random() * allAgents.length);
        const randomAgentId = allAgents[randomIndex];
        await admin.firestore()
            .collection("showingRequests")
            .doc(request.id)
            .update({
              assignedTo: randomAgentId,
              assignedAt: now.toISOString(),
              status: "pending",
            });
      }
      return;
    }
  }

  // Get next preferred agent
  const nextAgent = preferences.preferredAgents[nextIndex];
  if (!nextAgent) return;

  // Update request with next agent
  await admin.firestore()
      .collection("showingRequests")
      .doc(request.id)
      .update({
        assignedTo: nextAgent.agentId,
        assignedAt: new Date().toISOString(),
        currentAgentIndex: nextIndex,
        status: "pending",
      });

  // Schedule next escalation
  const timeout = nextAgent.responseTimeout * 60 * 1000;
  setTimeout(() => {
    escalateToNextAgent({
      ...request,
      currentAgentIndex: nextIndex,
      assignedTo: nextAgent.agentId,
    });
  }, timeout);
}

// Function to handle new showing request
export const onNewShowingRequest = onDocumentCreated(
    "showingRequests/{requestId}",
    async (event) => {
      const request = event.data?.data() as ShowingRequest;
      if (!request) return;
      const preferences = await getAgentPreferences(request.createdBy);
      if (!preferences || preferences.preferredAgents.length === 0) {
      // If no preferences or no preferred agents, assign to random agent
        const allAgents = await getAllShowingAgents();
        if (allAgents.length > 0) {
          const randomIndex = Math.floor(Math.random() * allAgents.length);
          const randomAgentId = allAgents[randomIndex];
          await event.data?.ref.update({
            assignedTo: randomAgentId,
            assignedAt: new Date().toISOString(),
            status: "pending",
          });
        }
        return;
      }

      // Start with first preferred agent
      const firstAgent = preferences.preferredAgents[0];
      await event.data?.ref.update({
        assignedTo: firstAgent.agentId,
        assignedAt: new Date().toISOString(),
        currentAgentIndex: 0,
        escalationStartTime: new Date().toISOString(),
        status: "pending",
      });

      // Schedule first escalation
      const timeout = firstAgent.responseTimeout * 60 * 1000;
      setTimeout(() => {
        escalateToNextAgent({
          ...request,
          currentAgentIndex: 0,
          assignedTo: firstAgent.agentId,
        });
      }, timeout);
    }
);

// Function to handle request acceptance
export const onRequestAccepted = onDocumentUpdated(
    "showingRequests/{requestId}",
    async (event) => {
      const newData = event.data?.after.data() as ShowingRequest;
      const previousData = event.data?.before.data() as ShowingRequest;
      if (!newData || !previousData) return;

      // Check if status changed to "accepted"
      if (newData.status === "accepted" && previousData.status === "pending") {
      // Update the request with acceptance time
        await event.data?.after.ref.update({
          acceptedAt: new Date().toISOString(),
        });
      }
    }
);
