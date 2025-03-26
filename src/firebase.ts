import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBj5AsIpORcurwnnK59ePiyAx1pbVvlYh4",
  authDomain: "showing-agent-pro.firebaseapp.com",
  projectId: "showing-agent-pro",
  storageBucket: "showing-agent-pro.firebasestorage.app",
  messagingSenderId: "95757860889",
  appId: "1:95757860889:web:b70c14fdbee19837beaa88",
  measurementId: "G-DKKMN42XL4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Analytics
const analytics = getAnalytics(app);

// Initialize Firestore
export const db = getFirestore(app);

// Export app instance if needed elsewhere
export default app; 