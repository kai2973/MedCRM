import React, { useState, useEffect, useRef, useCallback } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useParams, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import HospitalList from './components/HospitalList';
import HospitalDetail from './components/HospitalDetail';
import Settings from './components/Settings';
import Calendar from './components/Calendar';
import { Loader } from 'lucide-react';
import { Hospital, Note, Contact, UsageRecord, SalesStage, InstalledEquipment } from './types';
import {
  fetchHospitals,
  fetchNotes,
  fetchContacts,
  fetchUsageRecords,
  createHospital,
  updateHospital,
  createNote,
  updateNote,
  deleteNote,
  createContact,
  updateContact,
  createUsageRecord,
  updateUsageRecord,
  createInstalledEquipment,
  updateInstalledEquipment,
  deleteInstalledEquipment,
  fetchAllProfiles,
  ProfileSummary
} from './services/databaseService';

// 醫院詳情頁面包裝元件
const HospitalDetailWrapper: React.FC<{
  hospitals: Hospital[];
  notes: Note[];
  contacts: Contact[];
  usageRecords: UsageRecord[];
  onUpdateHospital: (hospital: Hospital) => void;
  onAddNote: (note: Note) => void;
  onUpdateNote: (note: Note) => void;
  onDeleteNote: (noteId: string) => void;
  onUpdateContact: (contact: Contact) => void;
  onAddContact: (contact: Contact) => void;
  onAddUsageRecord: (record: UsageRecord) => void;
  onUpdateUsageRecord: (record: UsageRecord) => void;
  onAddEquipment: (equipment: InstalledEquipment) => void;
  onUpdateEquipment: (equipment: InstalledEquipment) => void;
  onDeleteEquipment: (equipmentId: string) => void;
}> = ({
  hospitals,
  notes,
  contacts,
  usageRecords,
  onUpdateHospital,
  onAddNote,
  onUpdateNote,
  onDeleteNote,
  onUpdateContact,
  onAddContact,
  onAddUsageRecord,
  onUpdateUsageRecord,
  onAddEquipment,
  onUpdateEquipment,
  onDeleteEquipment
}) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const hospital = hospitals.find(h => h.id === id);

  if (!hospital) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-500 mb-4">找不到此醫院</p>
          <button
            onClick={() => navigate('/hospitals')}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            返回醫院列表
          </button>
        </div>
      </div>
    );
  }

  const hospitalNotes = notes.filter(n => n.hospitalId === hospital.id);
  const hospitalContacts = contacts.filter(c => c.hospitalId === hospital.id);
  const hospitalUsage = usageRecords.filter(u => u.hospitalId === hospital.id);

  return (
    <HospitalDetail
      hospital={hospital}
      notes={hospitalNotes}
      contacts={hospitalContacts}
      usageHistory={hospitalUsage}
      onUpdateHospital={onUpdateHospital}
      onAddNote={onAddNote}
      onUpdateNote={onUpdateNote}
      onDeleteNote={onDeleteNote}
      onUpdateContact={onUpdateContact}
      onAddContact={onAddContact}
      onAddUsageRecord={onAddUsageRecord}
      onUpdateUsageRecord={onUpdateUsageRecord}
      onAddEquipment={onAddEquipment}
      onUpdateEquipment={onUpdateEquipment}
      onDeleteEquipment={onDeleteEquipment}
      onBack={() => navigate('/hospitals')}
    />
  );
};

// 醫院列表包裝元件
const HospitalListWrapper: React.FC<{
  hospitals: Hospital[];
  onAddHospital: (data: Pick<Hospital, 'name' | 'region' | 'address' | 'stage' | 'level'>) => void;
}> = ({ hospitals, onAddHospital }) => {
  const navigate = useNavigate();

  return (
    <HospitalList
      hospitals={hospitals}
      onSelectHospital={(id) => navigate(`/hospitals/${id}`)}
      onAddHospital={onAddHospital}
    />
  );
};

const AppContent: React.FC = () => {
  const { user, loading: authLoading, isManagerOrAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // 從 URL 取得當前 tab
  const getActiveTabFromPath = (pathname: string): string => {
    if (pathname.startsWith('/hospitals')) return 'hospitals';
    if (pathname.startsWith('/calendar')) return 'calendar';
    if (pathname.startsWith('/settings')) return 'settings';
    return 'dashboard';
  };

  const activeTab = getActiveTabFromPath(location.pathname);

  // 資料狀態
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [usageRecords, setUsageRecords] = useState<UsageRecord[]>([]);
  const [allProfiles, setAllProfiles] = useState<ProfileSummary[]>([]);

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

  // 載入所有 profiles（僅 manager/admin）
  const loadProfiles = useCallback(async () => {
    if (!user || !isManagerOrAdmin) return;
    
    try {
      const profiles = await fetchAllProfiles();
      setAllProfiles(profiles);
    } catch (error) {
      console.error('Error loading profiles:', error);
    }
  }, [user, isManagerOrAdmin]);

  // 首次載入
  useEffect(() => {
    loadData(true);
  }, [loadData]);

  // 載入 profiles
  useEffect(() => {
    loadProfiles();
  }, [loadProfiles]);

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
    } else {
      // Check and update hospital lastVisit locally
      const hospital = hospitals.find(h => h.id === updatedNote.hospitalId);
      if (hospital) {
        const noteDate = new Date(updatedNote.date);
        const lastVisit = hospital.lastVisit === 'Never' ? new Date(0) : new Date(hospital.lastVisit);

        if (noteDate > lastVisit) {
          setHospitals(prev => prev.map(h =>
            h.id === updatedNote.hospitalId ? { ...h, lastVisit: updatedNote.date } : h
          ));
        }
      }
    }
  };

  // 刪除筆記 (樂觀更新)
  const handleDeleteNote = async (noteId: string) => {
    // 先更新 UI
    setNotes(prev => prev.filter(n => n.id !== noteId));

    const success = await deleteNote(noteId);
    if (!success) {
      // 失敗時重新載入
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

      // Check and update hospital lastVisit locally
      const hospital = hospitals.find(h => h.id === newNote.hospitalId);
      if (hospital) {
        const noteDate = new Date(newNote.date);
        const lastVisit = hospital.lastVisit === 'Never' ? new Date(0) : new Date(hospital.lastVisit);

        if (noteDate > lastVisit) {
          setHospitals(prev => prev.map(h =>
            h.id === newNote.hospitalId ? { ...h, lastVisit: newNote.date } : h
          ));
        }
      }
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

  // 更新使用記錄
  const handleUpdateUsageRecord = async (updatedRecord: UsageRecord) => {
    setUsageRecords(prev => prev.map(u => u.id === updatedRecord.id ? updatedRecord : u));

    const success = await updateUsageRecord(updatedRecord);
    if (!success) {
      loadData(false);
    }
  };

  // 新增聯絡人
  const handleAddContact = async (newContact: Contact) => {
    const created = await createContact({
      hospitalId: newContact.hospitalId,
      name: newContact.name,
      role: newContact.role,
      email: newContact.email,
      phone: newContact.phone,
      isKeyDecisionMaker: newContact.isKeyDecisionMaker
    });
    if (created) {
      setContacts(prev => [created, ...prev]);
    }
  };

  // ============== 設備管理 ==============

  // 新增設備
  const handleAddEquipment = async (equipment: InstalledEquipment) => {
    const created = await createInstalledEquipment(equipment);
    if (created) {
      // 更新對應醫院的 installedEquipment
      setHospitals(prev => prev.map(h => {
        if (h.id === equipment.hospitalId) {
          return {
            ...h,
            installedEquipment: [...h.installedEquipment, created],
            equipmentInstalled: true
          };
        }
        return h;
      }));
    }
  };

  // 更新設備
  const handleUpdateEquipment = async (equipment: InstalledEquipment) => {
    // 樂觀更新
    setHospitals(prev => prev.map(h => {
      const updatedEquipment = h.installedEquipment.map(eq =>
        eq.id === equipment.id ? equipment : eq
      );
      if (updatedEquipment.some(eq => eq.id === equipment.id)) {
        return { ...h, installedEquipment: updatedEquipment };
      }
      return h;
    }));

    const success = await updateInstalledEquipment(equipment);
    if (!success) {
      loadData(false);
    }
  };

  // 刪除設備
  const handleDeleteEquipment = async (equipmentId: string) => {
    // 樂觀更新
    setHospitals(prev => prev.map(h => {
      const updatedEquipment = h.installedEquipment.filter(eq => eq.id !== equipmentId);
      return {
        ...h,
        installedEquipment: updatedEquipment,
        equipmentInstalled: updatedEquipment.length > 0
      };
    }));

    const success = await deleteInstalledEquipment(equipmentId);
    if (!success) {
      loadData(false);
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

  const handleTabChange = (tab: string) => {
    switch (tab) {
      case 'dashboard':
        navigate('/');
        break;
      case 'hospitals':
        navigate('/hospitals');
        break;
      case 'calendar':
        navigate('/calendar');
        break;
      case 'settings':
        navigate('/settings');
        break;
      default:
        navigate('/');
    }
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={handleTabChange}>
      <Routes>
        <Route path="/" element={<Dashboard hospitals={hospitals} usageRecords={usageRecords} notes={notes} />} />
        <Route
          path="/hospitals"
          element={
            <HospitalListWrapper
              hospitals={hospitals}
              onAddHospital={handleAddHospital}
            />
          }
        />
        <Route
          path="/hospitals/:id"
          element={
            <HospitalDetailWrapper
              hospitals={hospitals}
              notes={notes}
              contacts={contacts}
              usageRecords={usageRecords}
              onUpdateHospital={handleUpdateHospital}
              onAddNote={handleAddNote}
              onUpdateNote={handleUpdateNote}
              onDeleteNote={handleDeleteNote}
              onUpdateContact={handleUpdateContact}
              onAddContact={handleAddContact}
              onAddUsageRecord={handleAddUsageRecord}
              onUpdateUsageRecord={handleUpdateUsageRecord}
              onAddEquipment={handleAddEquipment}
              onUpdateEquipment={handleUpdateEquipment}
              onDeleteEquipment={handleDeleteEquipment}
            />
          }
        />
        <Route 
          path="/calendar" 
          element={
            <Calendar 
              notes={notes} 
              hospitals={hospitals} 
              allProfiles={allProfiles}
            />
          } 
        />
        <Route path="/settings" element={<Settings />} />
        <Route path="/settings/:section" element={<Settings />} />
      </Routes>
    </Layout>
  );
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
