import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import HospitalList from './components/HospitalList';
import HospitalDetail from './components/HospitalDetail';
import Settings from './components/Settings';
import { Loader } from 'lucide-react';
import { Hospital, Note, Contact, UsageRecord, SalesStage } from './types';
import {
  fetchHospitals,
  fetchNotes,
  fetchContacts,
  fetchUsageRecords,
  createHospital,
  updateHospital,
  createNote,
  updateNote,
  updateContact,
  createUsageRecord
} from './services/databaseService';

const AppContent: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedHospitalId, setSelectedHospitalId] = useState<string | null>(null);
  
  // 資料狀態
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [usageRecords, setUsageRecords] = useState<UsageRecord[]>([]);
  
  // 載入狀態 - 只有首次載入才顯示
  const [initialLoading, setInitialLoading] = useState(true);
  const hasLoadedOnce = useRef(false);

  // 從資料庫載入資料
  const loadData = useCallback(async (showLoading: boolean = false) => {
    if (!user) {
      setInitialLoading(false);
      return;
    }

    // 只在首次載入時顯示 loading
    if (showLoading && !hasLoadedOnce.current) {
      setInitialLoading(true);
    }

    try {
      const [hospitalsData, notesData, contactsData, usageData] = await Promise.all([
        fetchHospitals(),
        fetchNotes(),
        fetchContacts(),
        fetchUsageRecords()
      ]);

      setHospitals(hospitalsData);
      setNotes(notesData);
      setContacts(contactsData);
      setUsageRecords(usageData);
      hasLoadedOnce.current = true;
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setInitialLoading(false);
    }
  }, [user]);

  // 首次載入
  useEffect(() => {
    loadData(true);
  }, [loadData]);

  // 視窗重新獲得焦點時，背景更新資料（不顯示 loading）
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && hasLoadedOnce.current && user) {
        // 背景靜默更新
        loadData(false);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user, loadData]);

  // 更新醫院 (樂觀更新)
  const handleUpdateHospital = async (updatedHospital: Hospital) => {
    // 先更新 UI
    setHospitals(prev => prev.map(h => h.id === updatedHospital.id ? updatedHospital : h));
    
    const success = await updateHospital(updatedHospital);
    if (!success) {
      // 失敗時重新載入
      loadData(false);
    }
  };

  // 更新聯絡人 (樂觀更新)
  const handleUpdateContact = async (updatedContact: Contact) => {
    setContacts(prev => prev.map(c => c.id === updatedContact.id ? updatedContact : c));
    
    const success = await updateContact(updatedContact);
    if (!success) {
      loadData(false);
    }
  };

  // 更新筆記 (樂觀更新)
  const handleUpdateNote = async (updatedNote: Note) => {
    setNotes(prev => prev.map(n => n.id === updatedNote.id ? updatedNote : n));
    
    const success = await updateNote(updatedNote);
    if (!success) {
      loadData(false);
    }
  };

  // 新增醫院
  const handleAddHospital = async (newHospitalData: Pick<Hospital, 'name' | 'region' | 'address' | 'stage' | 'level'>) => {
    const newHospital = await createHospital(newHospitalData);
    if (newHospital) {
      setHospitals(prev => [newHospital, ...prev]);
    }
  };

  // 新增筆記
  const handleAddNote = async (newNote: Note) => {
    const created = await createNote({
      hospitalId: newNote.hospitalId,
      content: newNote.content,
      date: newNote.date,
      author: newNote.author,
      activityType: newNote.activityType
    });
    if (created) {
      setNotes(prev => [created, ...prev]);
    }
  };

  // 新增使用記錄
  const handleAddUsageRecord = async (newRecord: UsageRecord) => {
    const created = await createUsageRecord({
      hospitalId: newRecord.hospitalId,
      productCode: newRecord.productCode,
      quantity: newRecord.quantity,
      date: newRecord.date,
      type: newRecord.type
    });
    if (created) {
      setUsageRecords(prev => [created, ...prev]);
    }
  };

  // 顯示載入中 - 只在首次載入時顯示
  if (authLoading || (user && initialLoading && !hasLoadedOnce.current)) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader size={48} className="animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-slate-600 font-medium">
            {authLoading ? '載入中...' : '正在載入資料...'}
          </p>
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
