import React, { useState, useEffect } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { PricingData } from '../../services/authService';

export const EditProfile: React.FC = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    fullName: '',
    phoneNumber: '',
    licenseNumber: '',
    brokerage: '',
  });
  const [pricingData, setPricingData] = useState<PricingData>({
    baseLocation: {
      addressOrZip: '',
    },
    pricingMode: 'flat',
    flatRate: 0,
    distanceTiers: {
      tier1: 0,
      tier2: 0,
      tier3: 0,
    },
    valueTiers: {
      under750k: 0,
      midRange: 0,
      over1_5m: 0,
    },
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Initialize form with current user data
  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.fullName || '',
        phoneNumber: user.phoneNumber || '',
        licenseNumber: user.licenseNumber || '',
        brokerage: user.brokerage || '',
      });

      // Initialize pricing data if it exists
      if (user.pricing) {
        setPricingData(user.pricing);
      }
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name.startsWith('pricing.')) {
      const pricingField = name.split('.')[1];
      setPricingData(prev => ({
        ...prev,
        [pricingField]: value
      }));
    } else if (name.startsWith('distanceTiers.') || name.startsWith('valueTiers.')) {
      const [_, tier, field] = name.split('.');
      setPricingData(prev => ({
        ...prev,
        [tier]: {
          ...prev[tier as keyof PricingData],
          [field]: Number(value)
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSubmitting(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      const updateData = {
        ...formData,
        pricing: pricingData,
        updatedAt: new Date(),
      };
      await updateDoc(userRef, updateData);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Edit Profile</h2>
        {showSuccess && (
          <div className="bg-green-50 border border-green-200 rounded-md px-4 py-2">
            <p className="text-green-800">Profile updated successfully!</p>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Profile Information */}
        <div>
          <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
            Full Name
          </label>
          <input
            type="text"
            id="fullName"
            name="fullName"
            required
            value={formData.fullName}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>

        <div>
          <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">
            Phone Number
          </label>
          <input
            type="tel"
            id="phoneNumber"
            name="phoneNumber"
            required
            value={formData.phoneNumber}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>

        <div>
          <label htmlFor="licenseNumber" className="block text-sm font-medium text-gray-700">
            License Number
          </label>
          <input
            type="text"
            id="licenseNumber"
            name="licenseNumber"
            value={formData.licenseNumber}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>

        <div>
          <label htmlFor="brokerage" className="block text-sm font-medium text-gray-700">
            Brokerage
          </label>
          <input
            type="text"
            id="brokerage"
            name="brokerage"
            value={formData.brokerage}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>

        {/* Showing Preferences Section */}
        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Showing Preferences</h3>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="baseLocation" className="block text-sm font-medium text-gray-700">
                Base Location (ZIP Code or Address)
              </label>
              <input
                type="text"
                id="baseLocation"
                name="pricing.baseLocation.addressOrZip"
                value={pricingData.baseLocation.addressOrZip}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>

            <div>
              <label htmlFor="pricingMode" className="block text-sm font-medium text-gray-700">
                Pricing Mode
              </label>
              <select
                id="pricingMode"
                name="pricing.pricingMode"
                value={pricingData.pricingMode}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="flat">Flat Rate</option>
                <option value="distance">Distance-Based</option>
                <option value="value">Property Value-Based</option>
              </select>
            </div>

            {/* Pricing Fields based on mode */}
            {pricingData.pricingMode === 'flat' && (
              <div>
                <label htmlFor="flatRate" className="block text-sm font-medium text-gray-700">
                  Flat Rate ($ per showing)
                </label>
                <input
                  type="number"
                  id="flatRate"
                  name="pricing.flatRate"
                  min="0"
                  step="0.01"
                  value={pricingData.flatRate}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            )}

            {pricingData.pricingMode === 'distance' && (
              <div className="space-y-4">
                <div>
                  <label htmlFor="tier1" className="block text-sm font-medium text-gray-700">
                    0-5 miles ($)
                  </label>
                  <input
                    type="number"
                    id="tier1"
                    name="distanceTiers.tier1"
                    min="0"
                    step="0.01"
                    value={pricingData.distanceTiers.tier1}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="tier2" className="block text-sm font-medium text-gray-700">
                    5-10 miles ($)
                  </label>
                  <input
                    type="number"
                    id="tier2"
                    name="distanceTiers.tier2"
                    min="0"
                    step="0.01"
                    value={pricingData.distanceTiers.tier2}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="tier3" className="block text-sm font-medium text-gray-700">
                    10+ miles ($)
                  </label>
                  <input
                    type="number"
                    id="tier3"
                    name="distanceTiers.tier3"
                    min="0"
                    step="0.01"
                    value={pricingData.distanceTiers.tier3}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
              </div>
            )}

            {pricingData.pricingMode === 'value' && (
              <div className="space-y-4">
                <div>
                  <label htmlFor="under750k" className="block text-sm font-medium text-gray-700">
                    Under $750,000 ($)
                  </label>
                  <input
                    type="number"
                    id="under750k"
                    name="valueTiers.under750k"
                    min="0"
                    step="0.01"
                    value={pricingData.valueTiers.under750k}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="midRange" className="block text-sm font-medium text-gray-700">
                    $750,000 - $1.5M ($)
                  </label>
                  <input
                    type="number"
                    id="midRange"
                    name="valueTiers.midRange"
                    min="0"
                    step="0.01"
                    value={pricingData.valueTiers.midRange}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="over1_5m" className="block text-sm font-medium text-gray-700">
                    Over $1.5M ($)
                  </label>
                  <input
                    type="number"
                    id="over1_5m"
                    name="valueTiers.over1_5m"
                    min="0"
                    step="0.01"
                    value={pricingData.valueTiers.over1_5m}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}; 