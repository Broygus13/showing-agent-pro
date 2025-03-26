import { 
  getAuth,
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

export interface UserProfile {
  uid: string;
  email: string | null;
  name: string;
  role: 'agent' | 'showing_agent';
}

class AuthService {
  private auth = getAuth();
  private googleProvider = new GoogleAuthProvider();

  constructor() {
    // Configure Google provider
    this.googleProvider.setCustomParameters({
      prompt: 'select_account'
    });
  }

  // Sign up new user
  async signUp(email: string, password: string, name: string, role: 'agent' | 'showing_agent'): Promise<UserProfile> {
    try {
      console.log('Attempting to sign up user:', { email, name, role });
      const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);
      const user = userCredential.user;
      
      // Create user profile in Firestore
      const userProfile: UserProfile = {
        uid: user.uid,
        email: user.email,
        name,
        role
      };
      
      await setDoc(doc(db, 'users', user.uid), userProfile);
      console.log('User signed up successfully:', { uid: user.uid });
      return userProfile;
    } catch (error: any) {
      console.error('Sign up error:', error);
      throw new Error(error.message || 'Failed to create account');
    }
  }

  // Sign in with Google
  async signInWithGoogle(): Promise<UserProfile> {
    try {
      console.log('Attempting Google sign in');
      const result = await signInWithPopup(this.auth, this.googleProvider);
      const user = result.user;

      // Check if user profile exists in Firestore
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (!userDoc.exists()) {
        console.log('Creating new user profile for Google user');
        // Create new user profile if it doesn't exist
        const userProfile: UserProfile = {
          uid: user.uid,
          email: user.email,
          name: user.displayName || 'User',
          role: 'agent' // Default role for Google sign-in users
        };
        
        await setDoc(doc(db, 'users', user.uid), userProfile);
        return userProfile;
      }

      console.log('Retrieved existing user profile');
      return userDoc.data() as UserProfile;
    } catch (error: any) {
      console.error('Google sign in error:', error);
      throw new Error(error.message || 'Failed to sign in with Google');
    }
  }

  // Sign in existing user
  async signIn(email: string, password: string): Promise<UserProfile> {
    try {
      console.log('Attempting email/password sign in');
      const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
      const user = userCredential.user;

      // Fetch user profile from Firestore
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (!userDoc.exists()) {
        console.error('User profile not found in Firestore');
        throw new Error('User profile not found');
      }

      console.log('User signed in successfully');
      return userDoc.data() as UserProfile;
    } catch (error: any) {
      console.error('Sign in error:', error);
      throw new Error(error.message || 'Failed to sign in');
    }
  }

  // Sign out
  async signOut(): Promise<void> {
    try {
      console.log('Attempting to sign out');
      await firebaseSignOut(this.auth);
      console.log('User signed out successfully');
    } catch (error: any) {
      console.error('Sign out error:', error);
      throw new Error(error.message || 'Failed to sign out');
    }
  }

  // Get current user
  getCurrentUser(): User | null {
    return this.auth.currentUser;
  }

  // Subscribe to auth state changes
  onAuthStateChange(callback: (user: UserProfile | null) => void): () => void {
    return onAuthStateChanged(this.auth, async (user) => {
      if (user) {
        try {
          console.log('Auth state changed: user logged in');
          // Fetch user profile from Firestore
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          
          if (userDoc.exists()) {
            callback(userDoc.data() as UserProfile);
          } else {
            console.log('Creating default profile for existing user');
            // Create default profile if it doesn't exist
            const userProfile: UserProfile = {
              uid: user.uid,
              email: user.email,
              name: user.displayName || 'User',
              role: 'agent'
            };
            
            await setDoc(doc(db, 'users', user.uid), userProfile);
            callback(userProfile);
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
          callback(null);
        }
      } else {
        console.log('Auth state changed: user logged out');
        callback(null);
      }
    });
  }
}

export const authService = new AuthService(); 