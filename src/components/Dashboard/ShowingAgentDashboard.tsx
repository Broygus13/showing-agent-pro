import React, { useState, useEffect } from 'react';
import { ShowingRequestsList } from '../ShowingRequestsList';
import { SearchAndFilter } from '../SearchAndFilter';
import { Header } from '../Navigation/Header';
import { NotificationSystem } from '../Notifications/NotificationSystem';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';
import { ShowingRequest } from '../ShowingRequestForm';
import { EditProfile } from '../Profile/EditProfile';

export const ShowingAgentDashboard: React.FC = () => {
  const [availableRequests, setAvailableRequests] = useState<ShowingRequest[]>([]);
  const [myRequests, setMyRequests] = useState<ShowingRequest[]>([]);
  const [filteredAvailableRequests, setFilteredAvailableRequests] = useState<ShowingRequest[]>([]);
  const [filteredMyRequests, setFilteredMyRequests] = useState<ShowingRequest[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({ status: 'all', dateRange: 'all' });
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    // Subscribe to available showing requests (pending status)
    const availableQuery = query(
      collection(db, 'showingRequests'),
      where('status', '==', 'pending')
    );

    // Subscribe to requests assigned to this showing agent
    const myRequestsQuery = query(
      collection(db, 'showingRequests'),
      where('assignedTo', '==', user.uid)
    );

    const unsubscribeAvailable = onSnapshot(availableQuery, (snapshot) => {
      const requests = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ShowingRequest[];
      setAvailableRequests(requests);
      filterRequests(requests, searchQuery, filters, setFilteredAvailableRequests);
    });

    const unsubscribeMyRequests = onSnapshot(myRequestsQuery, (snapshot) => {
      const requests = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ShowingRequest[];
      setMyRequests(requests);
      filterRequests(requests, searchQuery, filters, setFilteredMyRequests);
    });

    return () => {
      unsubscribeAvailable();
      unsubscribeMyRequests();
    };
  }, [user, searchQuery, filters]);

  useEffect(() => {
    filterRequests(availableRequests, searchQuery, filters, setFilteredAvailableRequests);
    filterRequests(myRequests, searchQuery, filters, setFilteredMyRequests);
  }, [availableRequests, myRequests, searchQuery, filters]);

  const filterRequests = (
    requests: ShowingRequest[],
    query: string,
    filters: { status: string; dateRange: string },
    setFiltered: (requests: ShowingRequest[]) => void
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

    setFiltered(filtered);
  };

  const handleAcceptRequest = async (id: string) => {
    const requestRef = doc(db, 'showingRequests', id);
    await updateDoc(requestRef, {
      status: 'accepted',
      assignedTo: user?.uid,
      assignedAt: new Date().toISOString()
    });
  };

  const handleCompleteRequest = async (id: string) => {
    const requestRef = doc(db, 'showingRequests', id);
    await updateDoc(requestRef, {
      status: 'completed',
      completedAt: new Date().toISOString()
    });
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Showing Agent Dashboard</h1>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main content area */}
            <div className="lg:col-span-2">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Available Showing Requests</h2>
                <NotificationSystem />
              </div>
              
              <div className="mb-8">
                <SearchAndFilter
                  onSearch={setSearchQuery}
                  onFilterChange={setFilters}
                />
                <ShowingRequestsList
                  requests={filteredAvailableRequests}
                  onAcceptRequest={handleAcceptRequest}
                  onCompleteRequest={handleCompleteRequest}
                  showAcceptButton={true}
                />
              </div>
              
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">My Assigned Showings</h2>
                <ShowingRequestsList
                  requests={filteredMyRequests}
                  onAcceptRequest={handleAcceptRequest}
                  onCompleteRequest={handleCompleteRequest}
                  showAcceptButton={false}
                />
              </div>
            </div>

            {/* Sidebar with profile */}
            <div className="lg:col-span-1">
              <EditProfile />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 