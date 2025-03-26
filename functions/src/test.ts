import * as admin from "firebase-admin";

// Initialize Firebase Admin with emulator settings
admin.initializeApp({
  projectId: "showing-agent-pro",
  storageBucket: "showing-agent-pro.appspot.com",
});

// Connect to Firestore emulator
const db = admin.firestore();
db.settings({
  host: "localhost:8080",
  ssl: false,
});

/**
 * Creates a new showing request in Firestore
 * @param {string} propertyId - The ID of the property
 * @param {string} clientName - The name of the client
 * @param {string} clientEmail - The email of the client
 * @param {string} clientPhone - The phone number of the client
 * @param {string} preferredDate - The preferred showing date
 * @return {Promise<void>}
 */
async function createShowingRequest(
    propertyId: string,
    clientName: string,
    clientEmail: string,
    clientPhone: string,
    preferredDate: string,
) {
  try {
    // Create a test showing request
    const showingRequest = {
      propertyId: propertyId,
      clientName: clientName,
      clientEmail: clientEmail,
      clientPhone: clientPhone,
      preferredDate: preferredDate,
      status: "pending",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    // Add the document to Firestore
    const docRef = await db
        .collection("showingRequests")
        .add(showingRequest);

    console.log("Test showing request created with ID:", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("Error creating test showing request:", error);
    throw error;
  }
}

/**
 * Updates the status of a showing request
 * @param {string} requestId - The ID of the showing request
 * @param {string} status - The new status of the request
 * @return {Promise<void>}
 */
async function updateRequestStatus(requestId: string, status: string) {
  try {
    // Update the showing request status to accepted
    await db
        .collection("showingRequests")
        .doc(requestId)
        .update({
          status: status,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

    console.log("Test showing request status updated to accepted");
  } catch (error) {
    console.error("Error updating test showing request:", error);
    throw error;
  }
}

/**
 * Tests the showing request functions
 * @return {Promise<void>}
 */
async function testShowingRequests() {
  try {
    console.log("Starting Cloud Functions tests...");

    // Test new showing request
    const requestId = await createShowingRequest(
        "test-property-123",
        "Test Client",
        "test@example.com",
        "+1234567890",
        new Date().toISOString(),
    );

    // Wait a bit to see the first function's logs
    await new Promise((resolve) => setTimeout(resolve, 5000));

    // Test request accepted
    await updateRequestStatus(requestId, "accepted");

    console.log("All tests completed successfully!");
  } catch (error) {
    console.error("Error running tests:", error);
  }
}

testShowingRequests();
