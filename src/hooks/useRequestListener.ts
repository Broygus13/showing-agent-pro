import { useState, useEffect } from 'react';
import { doc, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '../services/firebase';

export interface ShowingRequest {
  propertyId: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  preferredDate: Date;
  status: string;
  assignedAgentId?: string;
  acceptedBy?: string;
  acceptedAt?: Date;
  completed?: boolean;
  completedAt?: Date;
  feedback?: string;
  createdAt: Date;
  updatedAt: Date;
  isPublic?: boolean;
  notifiedAgents?: string[];
}

export function useRequestListener(requestId: string) {
  const [request, setRequest] = useState<ShowingRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const requestRef = doc(db, 'showingRequests', requestId);
    
    const unsubscribe = onSnapshot(
      requestRef,
      (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          setRequest({
            ...data,
            preferredDate: data.preferredDate?.toDate(),
            createdAt: data.createdAt?.toDate(),
            updatedAt: data.updatedAt?.toDate(),
            acceptedAt: data.acceptedAt?.toDate(),
            completedAt: data.completedAt?.toDate(),
          } as ShowingRequest);
        } else {
          setError('Request not found');
        }
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching request:', error);
        setError('Error loading request details');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [requestId]);

  return { request, loading, error };
} 