import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/Auth/ProtectedRoute';
import { OnboardingFlow } from './components/Onboarding/OnboardingFlow';
import { SignIn } from './components/Auth/SignIn';
import { SignUp } from './components/Auth/SignUp';
import { AgentDashboard } from './components/Dashboard/AgentDashboard';
import { ShowingAgentDashboard } from './components/Dashboard/ShowingAgentDashboard';
import './App.css';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<SignIn onSignIn={() => {}} />} />
          <Route path="/signup" element={<SignUp onSignUp={() => {}} />} />
          <Route path="/onboarding" element={<OnboardingFlow />} />
          
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <AgentDashboard />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/showing-dashboard"
            element={
              <ProtectedRoute>
                <ShowingAgentDashboard />
              </ProtectedRoute>
            }
          />
          
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
