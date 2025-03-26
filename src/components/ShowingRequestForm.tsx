import React, { useState } from 'react';
import { showingService } from '../services/showingService';

interface ShowingRequestFormProps {
  onSubmit: (request: ShowingRequest) => void;
}

export interface ShowingRequest {
  id: string;
  propertyAddress: string;
  dateTime: string;
  buyerName: string;
  notes: string;
  selectedAgents: string[];
  status: 'pending' | 'accepted' | 'completed';
}

interface FormErrors {
  propertyAddress?: string;
  dateTime?: string;
  buyerName?: string;
  selectedAgents?: string;
}

const MOCK_AGENTS = [
  { id: '1', name: 'John Smith', email: 'john@example.com' },
  { id: '2', name: 'Sarah Johnson', email: 'sarah@example.com' },
  { id: '3', name: 'Mike Wilson', email: 'mike@example.com' },
];

export function ShowingRequestForm({ onSubmit }: ShowingRequestFormProps) {
  const [formData, setFormData] = useState({
    propertyAddress: '',
    dateTime: '',
    buyerName: '',
    notes: '',
    selectedAgents: [] as string[],
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    
    if (!formData.propertyAddress.trim()) {
      newErrors.propertyAddress = 'Property address is required';
    }

    if (!formData.dateTime) {
      newErrors.dateTime = 'Date and time are required';
    } else {
      const selectedDate = new Date(formData.dateTime);
      if (selectedDate < new Date()) {
        newErrors.dateTime = 'Date and time must be in the future';
      }
    }

    if (!formData.buyerName.trim()) {
      newErrors.buyerName = 'Buyer name is required';
    }

    if (formData.selectedAgents.length === 0) {
      newErrors.selectedAgents = 'At least one agent must be selected';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Create the request object
      const request = {
        ...formData,
        status: 'pending' as const,
      };

      // Save to Firestore
      const id = await showingService.createRequest(request);

      // Log form data to console with better formatting
      console.log('Form Data:', {
        ...request,
        id,
        selectedAgents: formData.selectedAgents.map(id => 
          MOCK_AGENTS.find(agent => agent.id === id)
        ),
      });

      // Call the onSubmit prop with the new request
      onSubmit({
        ...request,
        id,
      });

      // Reset form
      setFormData({
        propertyAddress: '',
        dateTime: '',
        buyerName: '',
        notes: '',
        selectedAgents: [],
      });
    } catch (error) {
      console.error('Error submitting form:', error);
      setSubmitError('Failed to submit request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'selectedAgents') {
      const select = e.target as HTMLSelectElement;
      const selectedOptions = Array.from(select.selectedOptions, option => option.value);
      setFormData(prev => ({ ...prev, [name]: selectedOptions }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    // Clear error when field is modified
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Create New Showing Request</h2>
      
      {submitError && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {submitError}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label htmlFor="propertyAddress" className="block text-sm font-medium text-gray-700">
            Property Address
          </label>
          <input
            type="text"
            id="propertyAddress"
            name="propertyAddress"
            value={formData.propertyAddress}
            onChange={handleChange}
            className={`mt-1 block w-full rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
              errors.propertyAddress ? 'border-red-300' : 'border-gray-300'
            }`}
          />
          {errors.propertyAddress && (
            <p className="mt-1 text-sm text-red-600">{errors.propertyAddress}</p>
          )}
        </div>

        <div>
          <label htmlFor="dateTime" className="block text-sm font-medium text-gray-700">
            Date & Time
          </label>
          <input
            type="datetime-local"
            id="dateTime"
            name="dateTime"
            value={formData.dateTime}
            onChange={handleChange}
            className={`mt-1 block w-full rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
              errors.dateTime ? 'border-red-300' : 'border-gray-300'
            }`}
          />
          {errors.dateTime && (
            <p className="mt-1 text-sm text-red-600">{errors.dateTime}</p>
          )}
        </div>

        <div>
          <label htmlFor="buyerName" className="block text-sm font-medium text-gray-700">
            Buyer Name
          </label>
          <input
            type="text"
            id="buyerName"
            name="buyerName"
            value={formData.buyerName}
            onChange={handleChange}
            className={`mt-1 block w-full rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
              errors.buyerName ? 'border-red-300' : 'border-gray-300'
            }`}
          />
          {errors.buyerName && (
            <p className="mt-1 text-sm text-red-600">{errors.buyerName}</p>
          )}
        </div>

        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
            Notes
          </label>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows={3}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label htmlFor="selectedAgents" className="block text-sm font-medium text-gray-700">
            Select Showing Agents
          </label>
          <select
            id="selectedAgents"
            name="selectedAgents"
            multiple
            value={formData.selectedAgents}
            onChange={handleChange}
            className={`mt-1 block w-full rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
              errors.selectedAgents ? 'border-red-300' : 'border-gray-300'
            }`}
          >
            {MOCK_AGENTS.map(agent => (
              <option key={agent.id} value={agent.id}>
                {agent.name} ({agent.email})
              </option>
            ))}
          </select>
          {errors.selectedAgents && (
            <p className="mt-1 text-sm text-red-600">{errors.selectedAgents}</p>
          )}
          <p className="mt-1 text-sm text-gray-500">
            Hold Ctrl (Windows) or Cmd (Mac) to select multiple agents
          </p>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className={`w-full py-2 px-4 rounded-md text-white font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 ${
            isSubmitting
              ? 'bg-blue-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
          }`}
        >
          {isSubmitting ? 'Creating Request...' : 'Create Showing Request'}
        </button>
      </div>
    </form>
  );
} 