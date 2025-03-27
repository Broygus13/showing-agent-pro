import React, { useState, useEffect } from 'react';
import { showingService } from '../services/showingService';
import { PricingService, AgentPricing } from '../services/pricingService';

interface ShowingRequestFormProps {
  onSubmit: (request: ShowingRequest) => void;
}

export interface ShowingRequest {
  id: string;
  propertyAddress: string;
  propertyPrice: number;
  dateTime: string;
  buyerName: string;
  notes: string;
  selectedAgents: string[];
  status: 'pending' | 'accepted' | 'completed';
  price?: number;
  pricingMode?: string;
}

interface FormErrors {
  propertyAddress?: string;
  propertyPrice?: string;
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
    propertyPrice: '',
    dateTime: '',
    buyerName: '',
    notes: '',
    selectedAgents: [] as string[],
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [agentPricing, setAgentPricing] = useState<AgentPricing[]>([]);
  const [isLoadingPricing, setIsLoadingPricing] = useState(false);

  // Fetch agent pricing when property address or price changes
  useEffect(() => {
    const fetchAgentPricing = async () => {
      if (!formData.propertyAddress || !formData.propertyPrice) {
        setAgentPricing([]);
        return;
      }

      setIsLoadingPricing(true);
      try {
        const pricing = await PricingService.getAvailableAgentsPricing(
          formData.propertyAddress,
          Number(formData.propertyPrice),
          MOCK_AGENTS.map(agent => agent.id)
        );
        setAgentPricing(pricing);
      } catch (error) {
        console.error('Error fetching agent pricing:', error);
      } finally {
        setIsLoadingPricing(false);
      }
    };

    fetchAgentPricing();
  }, [formData.propertyAddress, formData.propertyPrice]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    
    if (!formData.propertyAddress.trim()) {
      newErrors.propertyAddress = 'Property address is required';
    }

    if (!formData.propertyPrice.trim()) {
      newErrors.propertyPrice = 'Property price is required';
    } else if (isNaN(Number(formData.propertyPrice)) || Number(formData.propertyPrice) <= 0) {
      newErrors.propertyPrice = 'Please enter a valid property price';
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
      // Find the pricing for the first selected agent
      const selectedAgentPricing = agentPricing.find(
        pricing => pricing.agentId === formData.selectedAgents[0]
      );

      // Create the request object
      const request = {
        ...formData,
        propertyPrice: Number(formData.propertyPrice),
        status: 'pending' as const,
        price: selectedAgentPricing?.price,
        pricingMode: selectedAgentPricing?.pricingMode,
      };

      // Save to Firestore
      const id = await showingService.createRequest(request);

      // Call the onSubmit prop with the new request
      onSubmit({
        ...request,
        id,
      });

      // Reset form
      setFormData({
        propertyAddress: '',
        propertyPrice: '',
        dateTime: '',
        buyerName: '',
        notes: '',
        selectedAgents: [],
      });
      setAgentPricing([]);
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

  const getPricingDisplay = (pricing: AgentPricing) => {
    switch (pricing.pricingMode) {
      case 'flat':
        return `$${pricing.price} (Flat Rate)`;
      case 'distance':
        return `$${pricing.price} (${pricing.distance?.toFixed(1)} miles away)`;
      case 'value':
        return `$${pricing.price} (property listed at $${pricing.propertyValue?.toLocaleString()})`;
      default:
        return `$${pricing.price}`;
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
          <label htmlFor="propertyPrice" className="block text-sm font-medium text-gray-700">
            Property Price
          </label>
          <input
            type="number"
            id="propertyPrice"
            name="propertyPrice"
            min="0"
            step="1000"
            value={formData.propertyPrice}
            onChange={handleChange}
            className={`mt-1 block w-full rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
              errors.propertyPrice ? 'border-red-300' : 'border-gray-300'
            }`}
          />
          {errors.propertyPrice && (
            <p className="mt-1 text-sm text-red-600">{errors.propertyPrice}</p>
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
          <div className="mt-2 space-y-2">
            {MOCK_AGENTS.map(agent => {
              const pricing = agentPricing.find(p => p.agentId === agent.id);
              return (
                <div key={agent.id} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={`agent-${agent.id}`}
                    checked={formData.selectedAgents.includes(agent.id)}
                    onChange={(e) => {
                      const newSelectedAgents = e.target.checked
                        ? [...formData.selectedAgents, agent.id]
                        : formData.selectedAgents.filter(id => id !== agent.id);
                      setFormData(prev => ({ ...prev, selectedAgents: newSelectedAgents }));
                    }}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor={`agent-${agent.id}`} className="text-sm text-gray-700">
                    {agent.name} ({agent.email})
                    {isLoadingPricing ? (
                      <span className="ml-2 text-gray-500">Calculating price...</span>
                    ) : pricing ? (
                      <span className="ml-2 text-green-600">— {getPricingDisplay(pricing)}</span>
                    ) : null}
                  </label>
                </div>
              );
            })}
          </div>
          {errors.selectedAgents && (
            <p className="mt-1 text-sm text-red-600">{errors.selectedAgents}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Creating Request...' : 'Create Showing Request'}
        </button>
      </div>
    </form>
  );
} 