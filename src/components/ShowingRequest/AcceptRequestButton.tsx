import React from 'react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../contexts/AuthContext';

interface AcceptRequestButtonProps {
  requestId: string;
  currentStatus: string;
  onAccept?: () => void;
}

export const AcceptRequestButton: React.FC<AcceptRequestButtonProps> = ({
  requestId,
  currentStatus,
  onAccept,
}) => {
  const { user } = useAuth();

  const handleAccept = async () => {
    if (!user || user.role !== 'showing_agent') {
      return;
    }

    try {
      const requestRef = doc(db, 'showingRequests', requestId);
      await updateDoc(requestRef, {
        status: 'accepted',
        acceptedBy: user.uid,
        acceptedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      if (onAccept) {
        onAccept();
      }
    } catch (error) {
      console.error('Error accepting request:', error);
      // You might want to show an error message to the user here
    }
  };

  // Only show the button if the user is a showing agent and the request is pending
  if (!user || user.role !== 'showing_agent' || currentStatus !== 'pending') {
    return null;
  }

  return (
    <button
      onClick={handleAccept}
      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200"
    >
      Accept Request
    </button>
  );
}; 