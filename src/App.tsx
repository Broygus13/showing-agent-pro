import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { SignIn } from './components/Auth/SignIn';
import { SignUp } from './components/Auth/SignUp';
import { ProtectedRoute } from './components/Auth/ProtectedRoute';
import { AgentDashboard } from './components/Dashboard/AgentDashboard';
import { ShowingAgentDashboard } from './components/Dashboard/ShowingAgentDashboard';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import './App.css';

function Dashboard() {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return user.role === 'agent' ? <AgentDashboard /> : <ShowingAgentDashboard />;
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<SignIn onSignIn={() => {}} />} />
          <Route path="/signup" element={<SignUp onSignUp={() => {}} />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
