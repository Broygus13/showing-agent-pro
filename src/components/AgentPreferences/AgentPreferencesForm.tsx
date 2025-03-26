import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { agentPreferencesService, PreferredAgent, AgentPreferences } from '../../services/agentPreferencesService';

export function AgentPreferencesForm() {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<AgentPreferences>({
    agentId: user?.uid || '',
    preferredAgents: [],
    defaultResponseTimeout: 5,
    maxEscalationTime: 15
  });
  const [newAgent, setNewAgent] = useState<Omit<PreferredAgent, 'order'>>({
    agentId: '',
    name: '',
    email: '',
    responseTimeout: 5
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (user?.uid) {
      loadPreferences();
    }
  }, [user]);

  const loadPreferences = async () => {
    try {
      const prefs = await agentPreferencesService.getPreferences(user!.uid);
      if (prefs) {
        setPreferences(prefs);
      }
    } catch (err) {
      console.error('Error loading preferences:', err);
      setError('Failed to load preferences');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      await agentPreferencesService.setPreferences(preferences);
      setSuccess('Preferences updated successfully');
    } catch (err) {
      console.error('Error saving preferences:', err);
      setError('Failed to save preferences');
    }
  };

  const handleAddAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!newAgent.agentId || !newAgent.name || !newAgent.email) {
      setError('Please fill in all fields');
      return;
    }

    try {
      const agentToAdd: PreferredAgent = {
        ...newAgent,
        order: preferences.preferredAgents.length
      };
      await agentPreferencesService.addPreferredAgent(user!.uid, agentToAdd);
      setPreferences(prev => ({
        ...prev,
        preferredAgents: [...prev.preferredAgents, agentToAdd]
      }));
      setNewAgent({
        agentId: '',
        name: '',
        email: '',
        responseTimeout: 5
      });
      setSuccess('Agent added successfully');
    } catch (err) {
      console.error('Error adding agent:', err);
      setError('Failed to add agent');
    }
  };

  const handleRemoveAgent = async (agentId: string) => {
    try {
      await agentPreferencesService.removePreferredAgent(user!.uid, agentId);
      setPreferences(prev => ({
        ...prev,
        preferredAgents: prev.preferredAgents.filter(agent => agent.agentId !== agentId)
      }));
      setSuccess('Agent removed successfully');
    } catch (err) {
      console.error('Error removing agent:', err);
      setError('Failed to remove agent');
    }
  };

  const handleTimeoutChange = async (timeout: number) => {
    try {
      await agentPreferencesService.updateResponseTimeout(user!.uid, timeout);
      setPreferences(prev => ({ ...prev, defaultResponseTimeout: timeout }));
      setSuccess('Response timeout updated');
    } catch (err) {
      console.error('Error updating timeout:', err);
      setError('Failed to update timeout');
    }
  };

  const handleMaxEscalationChange = async (time: number) => {
    try {
      await agentPreferencesService.updateMaxEscalationTime(user!.uid, time);
      setPreferences(prev => ({ ...prev, maxEscalationTime: time }));
      setSuccess('Max escalation time updated');
    } catch (err) {
      console.error('Error updating max escalation time:', err);
      setError('Failed to update max escalation time');
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Agent Preferences</h2>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Default Response Timeout (minutes)
          </label>
          <input
            type="number"
            min="1"
            value={preferences.defaultResponseTimeout}
            onChange={(e) => handleTimeoutChange(Number(e.target.value))}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Maximum Escalation Time (minutes)
          </label>
          <input
            type="number"
            min="1"
            value={preferences.maxEscalationTime}
            onChange={(e) => handleMaxEscalationChange(Number(e.target.value))}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div>
          <h3 className="text-lg font-medium mb-4">Add Preferred Agent</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <input
              type="text"
              placeholder="Agent ID"
              value={newAgent.agentId}
              onChange={(e) => setNewAgent(prev => ({ ...prev, agentId: e.target.value }))}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
            <input
              type="text"
              placeholder="Name"
              value={newAgent.name}
              onChange={(e) => setNewAgent(prev => ({ ...prev, name: e.target.value }))}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
            <input
              type="email"
              placeholder="Email"
              value={newAgent.email}
              onChange={(e) => setNewAgent(prev => ({ ...prev, email: e.target.value }))}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
            <input
              type="number"
              placeholder="Response Timeout (minutes)"
              value={newAgent.responseTimeout}
              onChange={(e) => setNewAgent(prev => ({ ...prev, responseTimeout: Number(e.target.value) }))}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <button
            type="button"
            onClick={handleAddAgent}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Add Agent
          </button>
        </div>

        <div>
          <h3 className="text-lg font-medium mb-4">Preferred Agents</h3>
          <div className="space-y-4">
            {preferences.preferredAgents.map((agent) => (
              <div
                key={agent.agentId}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div>
                  <p className="font-medium">{agent.name}</p>
                  <p className="text-sm text-gray-500">{agent.email}</p>
                  <p className="text-sm text-gray-500">
                    Response Timeout: {agent.responseTimeout} minutes
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveAgent(agent.agentId)}
                  className="text-red-600 hover:text-red-800"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>
      </form>
    </div>
  );
} 