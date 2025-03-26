import React, { useState } from 'react';
import { ShowingRequestForm, ShowingRequest } from './components/ShowingRequestForm';
import { ShowingRequestsList } from './components/ShowingRequestsList';
import './App.css';

function App() {
  const [showingRequests, setShowingRequests] = useState<ShowingRequest[]>([]);

  const handleNewRequest = (request: ShowingRequest) => {
    setShowingRequests(prev => [...prev, request]);
  };

  const handleAcceptRequest = (id: string) => {
    setShowingRequests(prev =>
      prev.map(request =>
        request.id === id ? { ...request, status: 'accepted' } : request
      )
    );
  };

  const handleCompleteRequest = (id: string) => {
    setShowingRequests(prev =>
      prev.map(request =>
        request.id === id ? { ...request, status: 'completed' } : request
      )
    );
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">ShowingAgent Pro</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <ShowingRequestForm onSubmit={handleNewRequest} />
          <div className="mt-8">
            <ShowingRequestsList
              requests={showingRequests}
              onAcceptRequest={handleAcceptRequest}
              onCompleteRequest={handleCompleteRequest}
            />
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
