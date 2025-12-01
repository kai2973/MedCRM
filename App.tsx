import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import HospitalList from './components/HospitalList';
import HospitalDetail from './components/HospitalDetail';
import Settings from './components/Settings';
import { Loader } from 'lucide-react';
import { MOCK_HOSPITALS, MOCK_NOTES, MOCK_CONTACTS, MOCK_USAGE } from './constants';
import { Hospital, Note, Contact, UsageRecord, SalesStage } from './types';

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedHospitalId, setSelectedHospitalId] = useState<string | null>(null);
  
  const [hospitals, setHospitals] = useState<Hospital[]>(MOCK_HOSPITALS);
  const [notes, setNotes] = useState<Note[]>(MOCK_NOTES);
  const [contacts, setContacts] = useState<Contact[]>(MOCK_CONTACTS);
  const [usageRecords, setUsageRecords] = useState<UsageRecord[]>(MOCK_USAGE);

  const handleUpdateHospital = (updatedHospital: Hospital) => {
    setHospitals(prev => prev.map(h => h.id === updatedHospital.id ? updatedHospital : h));
  };

  const handleUpdateContact = (updatedContact: Contact) => {
    setContacts(prev => prev.map(c => c.id === updatedContact.id ? updatedContact : c));
  };

  const handleUpdateNote = (updatedNote: Note) => {
    setNotes(prev => prev.map(n => n.id === updatedNote.id ? updatedNote : n));
  };

  const handleAddHospital = (newHospitalData: Pick<Hospital, 'name' | 'region' | 'address' | 'stage' | 'level'>) => {
    const newHospital: Hospital = {
      id: `h-${Date.now()}`,
      ...newHospitalData,
      equipmentInstalled: false,
      installedEquipment: [],
      lastVisit: 'Never'
    };
    setHospitals(prev => [newHospital, ...prev]);
  };

  const handleAddNote = (newNote: Note) => {
    setNotes(prev => [newNote, ...prev]);
  };

  const handleAddUsageRecord = (newRecord: UsageRecord) => {
    setUsageRecords(prev => [...prev, newRecord]);
  };

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader size={48} className="animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-slate-600 font-medium">載入中...</p>
        </div>
      </div>
    );
  }
  
  if (!user) {
    return <Login />;
  }

  const renderContent = () => {
    if (selectedHospitalId) {
      const hospital = hospitals.find(h => h.id === selectedHospitalId);
      if (hospital) {
        const hospitalNotes = notes.filter(n => n.hospitalId === hospital.id);
        const hospitalContacts = contacts.filter(c => c.hospitalId === hospital.id);
        const hospitalUsage = usageRecords.filter(u => u.hospitalId === hospital.id);
        
        return (
          <HospitalDetail 
            hospital={hospital} 
            notes={hospitalNotes}
            contacts={hospitalContacts}
            usageHistory={hospitalUsage}
            onUpdateHospital={handleUpdateHospital}
            onAddNote={handleAddNote}
            onUpdateNote={handleUpdateNote}
            onUpdateContact={handleUpdateContact}
            onAddUsageRecord={handleAddUsageRecord}
            onBack={() => setSelectedHospitalId(null)} 
          />
        );
      }
    }

    switch (activeTab) {
      case 'dashboard':
        return <Dashboard hospitals={hospitals} usageRecords={usageRecords} notes={notes} />;
      case 'hospitals':
        return (
          <HospitalList 
            hospitals={hospitals}
            onSelectHospital={(id) => setSelectedHospitalId(id)}
            onAddHospital={handleAddHospital}
          />
        );
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard hospitals={hospitals} usageRecords={usageRecords} notes={notes} />;
    }
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setSelectedHospitalId(null);
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={handleTabChange}>
      {renderContent()}
    </Layout>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;