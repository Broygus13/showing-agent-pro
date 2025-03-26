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
  id: string;
  name: string;
  email: string;
  order: number;
}

interface AgentPreferences {
  preferredAgents: PreferredAgent[];
}

interface ShowingRequest {
  propertyId: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  preferredDate: string;
  status: "pending" | "accepted";
  assignedAgentId?: string;
  createdAt: admin.firestore.Timestamp;
  updatedAt: admin.firestore.Timestamp;
  escalationStartTime?: admin.firestore.Timestamp;
  currentEscalationIndex?: number;
  isPublic?: boolean;
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
 * @return {Promise<PreferredAgent[]>} The agent's preferences
 */
async function getAgentPreferences(agentId: string): Promise<PreferredAgent[]> {
  const preferencesRef = admin.firestore()
      .collection("users")
      .doc(agentId)
      .collection("preferences")
      .doc("agentPreferences");

  const preferencesDoc = await preferencesRef.get();
  if (!preferencesDoc.exists) {
    return [];
  }

  const data = preferencesDoc.data() as AgentPreferences;
  return data.preferredAgents || [];
}

/**
 * Get all showing agents from the users collection
 * @return {Promise<PreferredAgent[]>} Array of showing agent details
 */
async function getAllShowingAgents(): Promise<PreferredAgent[]> {
  const usersRef = admin.firestore().collection("users");
  const snapshot = await usersRef.where("role", "==", "showing_agent").get();

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    name: doc.data().name,
    email: doc.data().email,
    order: 0, // Default order for public requests
  }));
}

/**
 * Send notification to an agent
 * @param {string} agentId - The ID of the agent
 * @param {string} requestId - The ID of the showing request
 * @return {Promise<void>}
 */
async function sendNotificationToAgent(agentId: string, requestId: string): Promise<void> {
  const notificationRef = admin.firestore()
      .collection("users")
      .doc(agentId)
      .collection("notifications")
      .doc();

  await notificationRef.set({
    type: "showing_request",
    requestId,
    status: "pending",
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
}

/**
 * Escalate a showing request to the next agent in the preference list
 * @param {string} requestId - The ID of the showing request
 * @param {number} currentIndex - The current index of the agent in the preference list
 * @param {PreferredAgent[]} preferredAgents - The list of preferred agents
 * @return {Promise<void>}
 */
async function escalateToNextAgent(
    requestId: string,
    currentIndex: number,
    preferredAgents: PreferredAgent[],
): Promise<void> {
  const requestRef = admin.firestore().collection("showingRequests").doc(requestId);
  const requestDoc = await requestRef.get();

  if (!requestDoc.exists) return;

  const request = requestDoc.data() as ShowingRequest;
  if (request.status !== "pending") return;

  // If we've gone through all preferred agents, mark as public
  if (currentIndex >= preferredAgents.length) {
    const allAgents = await getAllShowingAgents();
    await requestRef.update({
      isPublic: true,
      currentEscalationIndex: 0,
      escalationStartTime: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Notify first available agent
    if (allAgents.length > 0) {
      await sendNotificationToAgent(allAgents[0].id, requestId);
    }
    return;
  }

  // Update request with next agent
  await requestRef.update({
    currentEscalationIndex: currentIndex + 1,
    assignedAgentId: preferredAgents[currentIndex + 1].id,
  });

  // Send notification to next agent
  await sendNotificationToAgent(preferredAgents[currentIndex + 1].id, requestId);
}

// Function to handle new showing request
export const onNewShowingRequest = onDocumentCreated(
    "showingRequests/{requestId}",
    async (event) => {
      const requestId = event.params.requestId;
      const request = event.data?.data() as ShowingRequest;

      if (!request) return;

      // Get requesting agent's preferences
      const preferredAgents = await getAgentPreferences(request.assignedAgentId || "");

      // Initialize escalation
      await event.data?.ref.update({
        currentEscalationIndex: 0,
        escalationStartTime: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Send notification to first preferred agent
      if (preferredAgents.length > 0) {
        await sendNotificationToAgent(preferredAgents[0].id, requestId);
      } else {
      // If no preferred agents, mark as public immediately
        const allAgents = await getAllShowingAgents();
        await event.data?.ref.update({
          isPublic: true,
          currentEscalationIndex: 0,
        });

        if (allAgents.length > 0) {
          await sendNotificationToAgent(allAgents[0].id, requestId);
        }
      }
    },
);

// Function to handle request status changes
export const onRequestStatusChange = onDocumentUpdated(
    "showingRequests/{requestId}",
    async (event) => {
      const requestId = event.params.requestId;
      const beforeData = event.data?.before.data() as ShowingRequest;
      const afterData = event.data?.after.data() as ShowingRequest;

      // Only proceed if status changed to accepted
      if (beforeData?.status !== "accepted" && afterData?.status === "accepted") {
      // Request was accepted, no need to escalate further
        return;
      }

      // Check if we need to escalate
      const now = admin.firestore.Timestamp.now();
      const escalationStartTime = afterData.escalationStartTime || now;
      const timeSinceEscalation = now.toMillis() - escalationStartTime.toMillis();

      // If 5 minutes have passed since last escalation
      if (timeSinceEscalation >= 5 * 60 * 1000) {
        if (afterData.isPublic) {
        // For public requests, escalate to next available agent
          const allAgents = await getAllShowingAgents();
          const currentIndex = afterData.currentEscalationIndex || 0;

          if (currentIndex < allAgents.length - 1) {
            await escalateToNextAgent(requestId, currentIndex, allAgents);
          }
        } else {
        // For preferred agent requests, escalate to next preferred agent
          const preferredAgents = await getAgentPreferences(afterData.assignedAgentId || "");
          const currentIndex = afterData.currentEscalationIndex || 0;

          await escalateToNextAgent(requestId, currentIndex, preferredAgents);
        }
      }

      // If 15 minutes have passed since request creation and still pending
      const timeSinceCreation = now.toMillis() - afterData.createdAt.toMillis();
      if (timeSinceCreation >= 15 * 60 * 1000 && afterData.status === "pending" && !afterData.isPublic) {
      // Mark as public and notify all available agents
        const allAgents = await getAllShowingAgents();
        await event.data?.after.ref.update({
          isPublic: true,
          currentEscalationIndex: 0,
          escalationStartTime: now,
        });

        if (allAgents.length > 0) {
          await sendNotificationToAgent(allAgents[0].id, requestId);
        }
      }
    },
);
