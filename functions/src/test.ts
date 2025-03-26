import * as admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import * as path from "path";

// Initialize Firebase Admin with service account
const serviceAccount = require(path.join(__dirname, "../service-account.json"));
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: "showing-agent-pro"
});

const db = getFirestore();

/**
 * Helper function to add timeout to promises
 * @param {Promise<T>} promise - The promise to add timeout to
 * @param {number} timeoutMs - Timeout in milliseconds
 * @return {Promise<T>} Promise that rejects after timeout
 */
const withTimeout = <T>(promise: Promise<T>, timeoutMs: number): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs}ms`)), timeoutMs)
    ),
  ]);
};

/**
 * Main test function
 * @return {Promise<void>}
 */
async function main() {
  try {
    console.log("Starting test...");

    // Test document creation
    console.log("Creating test document...");
    await withTimeout(
        db.collection("test").doc("test").set({test: true}),
        5000
    );
    console.log("Test document created successfully");

    // Test document read
    console.log("Reading test document...");
    const doc = await withTimeout(
        db.collection("test").doc("test").get(),
        5000
    );
    console.log("Test document read successfully:", doc.data());

    // Test document deletion
    console.log("Deleting test document...");
    await withTimeout(
        db.collection("test").doc("test").delete(),
        5000
    );
    console.log("Test document deleted successfully");

    console.log("All tests completed successfully!");
  } catch (error) {
    console.error("Test failed:", error);
    process.exit(1);
  }
}

// Run the test with a timeout
withTimeout(main(), 30000).catch((error) => {
  console.error("Test timed out:", error);
  process.exit(1);
});

/**
 * Creates a new showing request in Firestore
 * @param {string} propertyId - The ID of the property
 * @param {string} clientName - The name of the client
 * @param {string} clientEmail - The email of the client
 * @param {string} clientPhone - The phone number of the client
 * @param {string} preferredDate - The preferred showing date
 * @return {Promise<string>} The ID of the created request
 */
async function createTestRequest() {
  try {
    const requestData = {
      propertyId: "test-property-123",
      clientName: "Test Client",
      clientEmail: "test@example.com",
      clientPhone: "+1234567890",
      preferredDate: admin.firestore.Timestamp.now(),
      status: "pending",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const docRef = await db.collection("showingRequests").add(requestData);
    console.log("Test request created with ID:", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("Error creating test request:", error);
    throw error;
  }
}

/**
 * Updates the status of a showing request
 * @param {string} requestId - The ID of the showing request
 * @param {string} status - The new status of the request
 * @return {Promise<void>}
 */
async function updateRequestStatus(requestId: string, status: string): Promise<void> {
  try {
    await db
        .collection("showingRequests")
        .doc(requestId)
        .update({
          status,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

    console.log(`Request status updated to: ${status}`);
  } catch (error) {
    console.error("Error updating request status:", error);
    throw error;
  }
}

/**
 * Tests the showing request functions
 * @return {Promise<void>}
 */
async function testShowingRequests(): Promise<void> {
  try {
    console.log("Starting showing request tests...");

    // Create new showing request
    console.log("Creating new showing request...");
    const requestId = await createTestRequest();
    console.log(`Created showing request with ID: ${requestId}`);

    // Wait to see the onNewShowingRequest function logs
    console.log("Waiting 10 seconds to see onNewShowingRequest function logs...");
    await new Promise((resolve) => setTimeout(resolve, 10000));

    // Update request status
    console.log("Updating request status to accepted...");
    await updateRequestStatus(requestId, "accepted");

    // Wait to see the onRequestStatusChange function logs
    console.log("Waiting 10 seconds to see onRequestStatusChange function logs...");
    await new Promise((resolve) => setTimeout(resolve, 10000));

    console.log("Tests completed! Check the Firebase Console logs for function execution details.");
  } catch (error) {
    console.error("Error running tests:", error);
    process.exit(1);
  }
}

// Run the tests
console.log("Starting test script...");
testShowingRequests()
  .then(() => {
    console.log("Test script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Test script failed:", error);
    process.exit(1);
  });
