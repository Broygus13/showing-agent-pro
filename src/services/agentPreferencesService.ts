import { collection, doc, setDoc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../firebase';

export interface PreferredAgent {
  agentId: string;
  name: string;
  email: string;
  responseTimeout: number; // in minutes
  order: number;
}

export interface AgentPreferences {
  agentId: string;
  preferredAgents: PreferredAgent[];
  defaultResponseTimeout: number; // in minutes
  maxEscalationTime: number; // in minutes
}

export const agentPreferencesService = {
  // Create or update agent preferences
  async setPreferences(preferences: AgentPreferences): Promise<void> {
    const docRef = doc(db, 'agentPreferences', preferences.agentId);
    await setDoc(docRef, preferences, { merge: true });
  },

  // Get agent preferences
  async getPreferences(agentId: string): Promise<AgentPreferences | null> {
    const docRef = doc(db, 'agentPreferences', agentId);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? docSnap.data() as AgentPreferences : null;
  },

  // Add a preferred agent
  async addPreferredAgent(agentId: string, preferredAgent: PreferredAgent): Promise<void> {
    const docRef = doc(db, 'agentPreferences', agentId);
    await updateDoc(docRef, {
      preferredAgents: arrayUnion(preferredAgent)
    });
  },

  // Remove a preferred agent
  async removePreferredAgent(agentId: string, preferredAgentId: string): Promise<void> {
    const docRef = doc(db, 'agentPreferences', agentId);
    const preferences = await this.getPreferences(agentId);
    if (preferences) {
      const updatedAgents = preferences.preferredAgents.filter(
        agent => agent.agentId !== preferredAgentId
      );
      await updateDoc(docRef, {
        preferredAgents: updatedAgents
      });
    }
  },

  // Update response timeout
  async updateResponseTimeout(agentId: string, timeout: number): Promise<void> {
    const docRef = doc(db, 'agentPreferences', agentId);
    await updateDoc(docRef, {
      defaultResponseTimeout: timeout
    });
  },

  // Update max escalation time
  async updateMaxEscalationTime(agentId: string, time: number): Promise<void> {
    const docRef = doc(db, 'agentPreferences', agentId);
    await updateDoc(docRef, {
      maxEscalationTime: time
    });
  }
}; 