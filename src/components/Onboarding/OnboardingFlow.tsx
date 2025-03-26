import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RoleSelection } from './RoleSelection';
import { ProfileSetupForm } from './ProfileSetupForm';

export const OnboardingFlow: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<'role' | 'profile'>('role');

  const handleRoleComplete = () => {
    setStep('profile');
  };

  const handleProfileComplete = () => {
    // Navigate to the appropriate dashboard based on role
    // This will be handled by the router guard
    navigate('/dashboard');
  };

  return (
    <div>
      {step === 'role' ? (
        <RoleSelection onComplete={handleRoleComplete} />
      ) : (
        <ProfileSetupForm onComplete={handleProfileComplete} />
      )}
    </div>
  );
}; 