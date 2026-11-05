import React, { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
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
  const [searchQuery, setSearchQuery] = useState('');

  const handleOpenAIWithContext = (context = {}) => {
    setAiContext(context);
    setShowAIModal(true);
  };

  return (
    <AuthProvider>
      <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col font-sans selection:bg-[#13b5ea] selection:text-white">
        {/* Full-width 3-Tier Header matching Stanford Chemicals Template */}
        <Navbar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onOpenAI={() => handleOpenAIWithContext()}
          onOpenDispenseQuote={() => setActiveTab('dispensations')}
          onSearch={(q) => setSearchQuery(q)}
          searchQuery={searchQuery}
        />

        {/* Main Content View Container */}
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
          {activeTab === 'dashboard' && (
            <Dashboard
              setActiveTab={setActiveTab}
              onOpenAI={handleOpenAIWithContext}
            />
          )}

          {activeTab === 'chemicals' && (
            <ChemicalInventory
              onOpenAI={handleOpenAIWithContext}
              initialSearch={searchQuery}
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
        </main>

        {/* Clean Website Footer matching the template */}
        <footer className="bg-[#272b30] text-slate-400 text-xs py-8 border-t border-slate-700/60 mt-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="font-bold text-white tracking-wider">STANFORD CHEMICALS</span>
              <span className="text-slate-600">|</span>
              <span className="text-slate-300">PES University Laboratory Division</span>
            </div>

            <div className="text-slate-400 text-center md:text-right font-mono text-[11px]">
              Developed by Pranav Swaroop S (PES2UG24CS365) & Pranav Kaushal J (PES2UG24CS363)
              <div className="text-slate-500 mt-0.5">© 2026 All Rights Reserved · DBMS Course Project</div>
            </div>
          </div>
        </footer>

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
