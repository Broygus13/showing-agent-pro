import React from 'react';
import { ShowingRequest } from './ShowingRequestForm';

interface ShowingRequestsListProps {
  requests: ShowingRequest[];
  onAcceptRequest: (id: string) => void;
  onCompleteRequest: (id: string) => void;
}

export function ShowingRequestsList({ requests, onAcceptRequest, onCompleteRequest }: ShowingRequestsListProps) {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Showing Requests</h2>
      
      <div className="space-y-4">
        {requests.map(request => (
          <div
            key={request.id}
            className="bg-white rounded-lg shadow-md p-6 border border-gray-200"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">{request.propertyAddress}</h3>
                <p className="text-sm text-gray-600">
                  Buyer: {request.buyerName} | Date: {new Date(request.dateTime).toLocaleString()}
                </p>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                request.status === 'accepted' ? 'bg-green-100 text-green-800' :
                'bg-blue-100 text-blue-800'
              }`}>
                {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
              </span>
            </div>

            {request.notes && (
              <p className="text-gray-600 mb-4">{request.notes}</p>
            )}

            <div className="flex justify-end space-x-3">
              {request.status === 'pending' && (
                <button
                  onClick={() => onAcceptRequest(request.id)}
                  className="bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                >
                  Accept Request
                </button>
              )}
              {request.status === 'accepted' && (
                <button
                  onClick={() => onCompleteRequest(request.id)}
                  className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Mark as Completed
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 