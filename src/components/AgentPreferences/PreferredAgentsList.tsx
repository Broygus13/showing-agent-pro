import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../firebase';
import { collection, query, where, getDocs, doc, getDoc, updateDoc, arrayUnion, arrayRemove, DocumentData } from 'firebase/firestore';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';

interface Agent {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface PreferredAgent {
  id: string;
  name: string;
  email: string;
  order: number;
}

interface AgentPreferences {
  preferredAgents: PreferredAgent[];
}

export const PreferredAgentsList: React.FC = () => {
  const { user } = useAuth();
  const [preferredAgents, setPreferredAgents] = useState<PreferredAgent[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Agent[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Load preferred agents
  useEffect(() => {
    const loadPreferredAgents = async () => {
      if (!user) return;

      const preferencesRef = doc(db, 'users', user.uid, 'preferences', 'agentPreferences');
      const preferencesDoc = await getDoc(preferencesRef);
      
      if (preferencesDoc.exists()) {
        const data = preferencesDoc.data() as AgentPreferences;
        setPreferredAgents(data.preferredAgents || []);
      }
    };

    loadPreferredAgents();
  }, [user]);

  // Search for agents
  const searchAgents = async (searchText: string) => {
    if (!searchText.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    const usersRef = collection(db, 'users');
    const q = query(
      usersRef,
      where('role', '==', 'showing_agent'),
      where('name', '>=', searchText),
      where('name', '<=', searchText + '\uf8ff')
    );

    const querySnapshot = await getDocs(q);
    const results = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Agent[];

    setSearchResults(results);
    setIsSearching(false);
  };

  // Add agent to preferences
  const addAgent = async (agent: Agent) => {
    if (!user) return;

    const newPreferredAgent: PreferredAgent = {
      id: agent.id,
      name: agent.name,
      email: agent.email,
      order: preferredAgents.length
    };

    const preferencesRef = doc(db, 'users', user.uid, 'preferences', 'agentPreferences');
    await updateDoc(preferencesRef, {
      preferredAgents: arrayUnion(newPreferredAgent)
    });

    setPreferredAgents([...preferredAgents, newPreferredAgent]);
    setSearchResults([]);
    setSearchQuery('');
  };

  // Remove agent from preferences
  const removeAgent = async (agentId: string) => {
    if (!user) return;

    const agentToRemove = preferredAgents.find(agent => agent.id === agentId);
    if (!agentToRemove) return;

    const preferencesRef = doc(db, 'users', user.uid, 'preferences', 'agentPreferences');
    await updateDoc(preferencesRef, {
      preferredAgents: arrayRemove(agentToRemove)
    });

    setPreferredAgents(preferredAgents.filter(agent => agent.id !== agentId));
  };

  // Move agent up or down
  const moveAgent = async (index: number, direction: 'up' | 'down') => {
    if (!user) return;

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= preferredAgents.length) return;

    const newPreferredAgents = [...preferredAgents];
    const [movedAgent] = newPreferredAgents.splice(index, 1);
    newPreferredAgents.splice(newIndex, 0, movedAgent);

    // Update order numbers
    const updatedAgents = newPreferredAgents.map((agent, idx) => ({
      ...agent,
      order: idx
    }));

    const preferencesRef = doc(db, 'users', user.uid, 'preferences', 'agentPreferences');
    await updateDoc(preferencesRef, {
      preferredAgents: updatedAgents
    });

    setPreferredAgents(updatedAgents);
  };

  // Handle drag and drop
  const onDragEnd = async (result: DropResult) => {
    if (!result.destination || !user) return;

    const items = Array.from(preferredAgents);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update order numbers
    const updatedAgents = items.map((agent, idx) => ({
      ...agent,
      order: idx
    }));

    const preferencesRef = doc(db, 'users', user.uid, 'preferences', 'agentPreferences');
    await updateDoc(preferencesRef, {
      preferredAgents: updatedAgents
    });

    setPreferredAgents(updatedAgents);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col space-y-2">
        <label htmlFor="search" className="text-sm font-medium text-gray-700">
          Search Agents
        </label>
        <div className="flex space-x-2">
          <input
            type="text"
            id="search"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              searchAgents(e.target.value);
            }}
            placeholder="Search by name or email..."
            className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="mt-2 space-y-2">
          <h3 className="text-sm font-medium text-gray-700">Search Results</h3>
          <div className="space-y-1">
            {searchResults.map((agent) => (
              <div
                key={agent.id}
                className="flex items-center justify-between p-2 bg-white border rounded-md shadow-sm"
              >
                <div>
                  <p className="font-medium">{agent.name}</p>
                  <p className="text-sm text-gray-500">{agent.email}</p>
                </div>
                <button
                  onClick={() => addAgent(agent)}
                  className="px-3 py-1 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                  Add
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Preferred Agents List */}
      <div className="mt-4">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Preferred Agents</h3>
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="preferred-agents">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="space-y-2"
              >
                {preferredAgents.map((agent, index) => (
                  <Draggable key={agent.id} draggableId={agent.id} index={index}>
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className="flex items-center justify-between p-3 bg-white border rounded-md shadow-sm"
                      >
                        <div className="flex items-center space-x-3">
                          <div {...provided.dragHandleProps} className="cursor-move">
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                            </svg>
                          </div>
                          <div>
                            <p className="font-medium">{agent.name}</p>
                            <p className="text-sm text-gray-500">{agent.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => moveAgent(index, 'up')}
                            disabled={index === 0}
                            className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-50"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                            </svg>
                          </button>
                          <button
                            onClick={() => moveAgent(index, 'down')}
                            disabled={index === preferredAgents.length - 1}
                            className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-50"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                          <button
                            onClick={() => removeAgent(agent.id)}
                            className="p-1 text-red-500 hover:text-red-700"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>
    </div>
  );
}; 