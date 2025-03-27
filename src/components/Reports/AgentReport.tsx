import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, parseISO } from 'date-fns';

interface ShowingRequest {
  id: string;
  propertyAddress: string;
  preferredDate: Date;
  showingAgentId: string;
  showingAgentName: string;
  status: string;
}

type FilterType = 'week' | 'month' | 'custom';

export const AgentReport: React.FC = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<ShowingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<FilterType>('week');
  const [dateRange, setDateRange] = useState({
    start: new Date(),
    end: new Date(),
  });

  const fetchRequests = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      let startDate: Date;
      let endDate: Date;

      switch (filterType) {
        case 'week':
          startDate = startOfWeek(new Date());
          endDate = endOfWeek(new Date());
          break;
        case 'month':
          startDate = startOfMonth(new Date());
          endDate = endOfMonth(new Date());
          break;
        case 'custom':
          startDate = dateRange.start;
          endDate = dateRange.end;
          break;
      }

      const q = query(
        collection(db, 'showingRequests'),
        where('agentId', '==', user.uid),
        where('status', '==', 'completed'),
        where('preferredDate', '>=', Timestamp.fromDate(startDate)),
        where('preferredDate', '<=', Timestamp.fromDate(endDate))
      );

      const querySnapshot = await getDocs(q);
      const showingRequests: ShowingRequest[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        showingRequests.push({
          id: doc.id,
          propertyAddress: data.propertyAddress,
          preferredDate: data.preferredDate.toDate(),
          showingAgentId: data.acceptedBy,
          showingAgentName: data.acceptedByName || 'Unknown Agent',
          status: data.status,
        });
      });

      setRequests(showingRequests);
    } catch (err) {
      console.error('Error fetching requests:', err);
      setError('Failed to load showing requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [user, filterType, dateRange]);

  const handleDownloadCSV = () => {
    const headers = ['Property Address', 'Date/Time', 'Showing Agent', 'Status'];
    const csvContent = [
      headers.join(','),
      ...requests.map((request) => [
        `"${request.propertyAddress}"`,
        format(request.preferredDate, 'MM/dd/yyyy hh:mm a'),
        `"${request.showingAgentName}"`,
        request.status,
      ].join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `showing-report-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex gap-2">
          <button
            onClick={() => setFilterType('week')}
            className={`px-4 py-2 rounded-md ${
              filterType === 'week'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            This Week
          </button>
          <button
            onClick={() => setFilterType('month')}
            className={`px-4 py-2 rounded-md ${
              filterType === 'month'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            This Month
          </button>
          <button
            onClick={() => setFilterType('custom')}
            className={`px-4 py-2 rounded-md ${
              filterType === 'custom'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Custom Range
          </button>
        </div>
        <button
          onClick={handleDownloadCSV}
          disabled={requests.length === 0}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          Download CSV
        </button>
      </div>

      {filterType === 'custom' && (
        <div className="flex gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Start Date</label>
            <input
              type="date"
              value={format(dateRange.start, 'yyyy-MM-dd')}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: parseISO(e.target.value) }))}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">End Date</label>
            <input
              type="date"
              value={format(dateRange.end, 'yyyy-MM-dd')}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: parseISO(e.target.value) }))}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
        </div>
      )}

      {requests.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
          <p className="text-gray-500">No completed showings found for the selected period.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Property Address
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date/Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Showing Agent
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {requests.map((request) => (
                <tr key={request.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {request.propertyAddress}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {format(request.preferredDate, 'MM/dd/yyyy hh:mm a')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {request.showingAgentName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      Completed
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}; 