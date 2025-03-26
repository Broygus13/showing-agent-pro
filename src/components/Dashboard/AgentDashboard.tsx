import React, { useState, useEffect } from 'react';
import { ShowingRequestForm, ShowingRequest } from '../ShowingRequestForm';
import { ShowingRequestsList } from '../ShowingRequestsList';
import { SearchAndFilter } from '../SearchAndFilter';
import { Header } from '../Navigation/Header';
import { NotificationSystem } from '../Notifications/NotificationSystem';
import { collection, query, where, onSnapshot, addDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';

export function AgentDashboard() {
  const [showingRequests, setShowingRequests] = useState<ShowingRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<ShowingRequest[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({ status: 'all', dateRange: 'all' });
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    // Subscribe to showing requests where the agent is the creator
    const q = query(
      collection(db, 'showingRequests'),
      where('createdBy', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const requests = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ShowingRequest[];
      setShowingRequests(requests);
      filterRequests(requests, searchQuery, filters);
    });

    return () => unsubscribe();
  }, [user, searchQuery, filters]);

  useEffect(() => {
    filterRequests(showingRequests, searchQuery, filters);
  }, [showingRequests, searchQuery, filters]);

  const filterRequests = (
    requests: ShowingRequest[],
    query: string,
    filters: { status: string; dateRange: string }
  ) => {
    let filtered = [...requests];

    // Apply search filter
    if (query) {
      const searchLower = query.toLowerCase();
      filtered = filtered.filter(request =>
        request.propertyAddress.toLowerCase().includes(searchLower) ||
        request.buyerName.toLowerCase().includes(searchLower)
      );
    }

    // Apply status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(request => request.status === filters.status);
    }

    // Apply date range filter
    if (filters.dateRange !== 'all') {
      const now = new Date();
      const requestDate = new Date();
      
      filtered = filtered.filter(request => {
        requestDate.setTime(new Date(request.dateTime).getTime());
        
        switch (filters.dateRange) {
          case 'today':
            return requestDate.toDateString() === now.toDateString();
          case 'week':
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            return requestDate >= weekAgo;
          case 'month':
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            return requestDate >= monthAgo;
          default:
            return true;
        }
      });
    }

    setFilteredRequests(filtered);
  };

  const handleNewRequest = async (request: ShowingRequest) => {
    const newRequest = {
      ...request,
      createdBy: user?.uid,
      createdAt: new Date().toISOString(),
      status: 'pending'
    };
    
    await addDoc(collection(db, 'showingRequests'), newRequest);
  };

  const handleAcceptRequest = async (id: string) => {
    const requestRef = doc(db, 'showingRequests', id);
    await updateDoc(requestRef, { status: 'accepted' });
  };

  const handleCompleteRequest = async (id: string) => {
    const requestRef = doc(db, 'showingRequests', id);
    await updateDoc(requestRef, { status: 'completed' });
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Create New Showing Request</h2>
            <NotificationSystem />
          </div>
          
          <div className="mb-8">
            <ShowingRequestForm onSubmit={handleNewRequest} />
          </div>
          
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Your Showing Requests</h2>
            <SearchAndFilter
              onSearch={setSearchQuery}
              onFilterChange={setFilters}
            />
            <ShowingRequestsList
              requests={filteredRequests}
              onAcceptRequest={handleAcceptRequest}
              onCompleteRequest={handleCompleteRequest}
            />
          </div>
        </div>
      </div>
    </div>
  );
} 