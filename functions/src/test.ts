import * as admin from "firebase-admin";

// Initialize Firebase Admin with emulator settings
admin.initializeApp({
  projectId: "showing-agent-pro",
  storageBucket: "showing-agent-pro.appspot.com"
});

// Connect to Firestore emulator
const db = admin.firestore();
db.settings({
  host: "localhost:8080",
  ssl: false
});

async function testNewShowingRequest() {
  try {
    // Create a test showing request
    const showingRequest = {
      propertyId: "test-property-123",
      clientName: "Test Client",
      clientEmail: "test@example.com",
      clientPhone: "+1234567890",
      preferredDate: new Date().toISOString(),
      status: "pending",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
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

async function testRequestAccepted(requestId: string) {
  try {
    // Update the showing request status to accepted
    await db
      .collection("showingRequests")
      .doc(requestId)
      .update({
        status: "accepted",
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

    console.log("Test showing request status updated to accepted");
  } catch (error) {
    console.error("Error updating test showing request:", error);
    throw error;
  }
}

// Run the tests
async function runTests() {
  try {
    console.log("Starting Cloud Functions tests...");
    
    // Test new showing request
    const requestId = await testNewShowingRequest();
    
    // Wait a bit to see the first function's logs
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Test request accepted
    await testRequestAccepted(requestId);
    
    console.log("All tests completed successfully!");
  } catch (error) {
    console.error("Test failed:", error);
  }
}

runTests(); 