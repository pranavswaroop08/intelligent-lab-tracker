import React, { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import ChemicalInventory from './pages/ChemicalInventory';
import AssetInventory from './pages/AssetInventory';
import StorageLocations from './pages/StorageLocations';
import CompatibilityMatrix from './pages/CompatibilityMatrix';
import Dispensations from './pages/Dispensations';
import MaintenanceSchedule from './pages/MaintenanceSchedule';
import AuditLogs from './pages/AuditLogs';
import AIAssistantModal from './components/AIAssistantModal';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiContext, setAiContext] = useState({});

  const handleOpenAIWithContext = (context = {}) => {
    setAiContext(context);
    setShowAIModal(true);
  };

  return (
    <AuthProvider>
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-black">
        {/* Top Navigation */}
        <Navbar
          onOpenAI={() => handleOpenAIWithContext()}
        />

        {/* Main Body with Sidebar + Content */}
        <div className="flex-1 flex overflow-hidden">
          <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
              {activeTab === 'dashboard' && (
                <Dashboard
                  setActiveTab={setActiveTab}
                  onOpenAI={handleOpenAIWithContext}
                />
              )}

              {activeTab === 'chemicals' && (
                <ChemicalInventory
                  onOpenAI={handleOpenAIWithContext}
                />
              )}

              {activeTab === 'assets' && (
                <AssetInventory
                  onOpenAI={handleOpenAIWithContext}
                />
              )}

              {activeTab === 'locations' && (
                <StorageLocations />
              )}

              {activeTab === 'compatibility' && (
                <CompatibilityMatrix
                  onOpenAI={handleOpenAIWithContext}
                />
              )}

              {activeTab === 'dispensations' && (
                <Dispensations />
              )}

              {activeTab === 'maintenance' && (
                <MaintenanceSchedule />
              )}

              {activeTab === 'audit' && (
                <AuditLogs />
              )}
            </div>
          </main>
        </div>

        {/* Gemini Safety AI Assistant Drawer */}
        {showAIModal && (
          <AIAssistantModal
            chemicalContext={aiContext.chemical}
            assetContext={aiContext.asset}
            onClose={() => setShowAIModal(false)}
          />
        )}
      </div>
    </AuthProvider>
  );
}
