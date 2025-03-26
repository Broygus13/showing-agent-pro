import { collection, addDoc, updateDoc, doc, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { ShowingRequest } from '../components/ShowingRequestForm';

const COLLECTION_NAME = 'showingRequests';

export const showingService = {
  // Create a new showing request
  async createRequest(request: Omit<ShowingRequest, 'id'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, COLLECTION_NAME), request);
      return docRef.id;
    } catch (error) {
      console.error('Error creating request:', error);
      throw error;
    }
  },

  // Get all showing requests
  async getAllRequests(): Promise<ShowingRequest[]> {
    try {
      const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as ShowingRequest));
    } catch (error) {
      console.error('Error getting requests:', error);
      throw error;
    }
  },

  // Update request status
  async updateRequestStatus(id: string, status: ShowingRequest['status']): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      await updateDoc(docRef, { status });
    } catch (error) {
      console.error('Error updating request status:', error);
      throw error;
    }
  },

  // Get requests by agent
  async getRequestsByAgent(agentId: string): Promise<ShowingRequest[]> {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where('selectedAgents', 'array-contains', agentId)
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as ShowingRequest));
    } catch (error) {
      console.error('Error getting requests by agent:', error);
      throw error;
    }
  }
}; 