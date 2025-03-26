import { 
  getAuth, 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

const auth = getAuth();

export interface UserProfile {
  uid: string;
  email: string;
  role: 'agent' | 'showing_agent';
  name: string;
}

export const authService = {
  // Sign up new user
  async signUp(email: string, password: string, name: string, role: UserProfile['role']): Promise<UserProfile> {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Create user profile in Firestore
      const userProfile: UserProfile = {
        uid: user.uid,
        email: user.email!,
        role,
        name
      };
      
      await setDoc(doc(db, 'users', user.uid), userProfile);
      return userProfile;
    } catch (error) {
      console.error('Error signing up:', error);
      throw error;
    }
  },

  // Sign in existing user
  async signIn(email: string, password: string): Promise<User> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return userCredential.user;
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    }
  },

  // Sign out
  async signOut(): Promise<void> {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  },

  // Get current user
  getCurrentUser(): User | null {
    return auth.currentUser;
  },

  // Subscribe to auth state changes
  onAuthStateChanged(callback: (user: User | null) => void) {
    return onAuthStateChanged(auth, callback);
  }
}; 