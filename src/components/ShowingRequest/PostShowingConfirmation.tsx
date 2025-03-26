import React, { useState } from 'react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../contexts/AuthContext';

interface PostShowingConfirmationProps {
  requestId: string;
  acceptedBy: string;
  onComplete?: () => void;
}

export const PostShowingConfirmation: React.FC<PostShowingConfirmationProps> = ({
  requestId,
  acceptedBy,
  onComplete,
}) => {
  const { user } = useAuth();
  const [isCompleted, setIsCompleted] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Only show if the current user is the one who accepted the request
  if (!user || user.uid !== acceptedBy) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isCompleted) return;

    setIsSubmitting(true);
    try {
      const requestRef = doc(db, 'showingRequests', requestId);
      await updateDoc(requestRef, {
        completed: true,
        completedAt: serverTimestamp(),
        feedback: feedback.trim() || null,
        updatedAt: serverTimestamp(),
      });

      if (onComplete) {
        onComplete();
      }
    } catch (error) {
      console.error('Error updating showing completion:', error);
      // You might want to show an error message to the user here
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Post-Showing Confirmation</h3>
      
      <div className="flex items-start space-x-3">
        <input
          type="checkbox"
          id="completed"
          checked={isCompleted}
          onChange={(e) => setIsCompleted(e.target.checked)}
          className="mt-1 h-5 w-5 text-green-600 focus:ring-green-500 border-gray-300 rounded"
        />
        <label htmlFor="completed" className="text-gray-700">
          ✅ I completed this showing
        </label>
      </div>

      <div>
        <label htmlFor="feedback" className="block text-sm font-medium text-gray-700">
          Feedback (optional)
        </label>
        <textarea
          id="feedback"
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          rows={3}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
          placeholder="How did the showing go? Any notes or feedback?"
        />
      </div>

      <button
        type="submit"
        disabled={!isCompleted || isSubmitting}
        className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${
          isCompleted && !isSubmitting
            ? 'bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500'
            : 'bg-gray-400 cursor-not-allowed'
        }`}
      >
        {isSubmitting ? 'Submitting...' : 'Confirm Completion'}
      </button>
    </form>
  );
}; 