
import React, { useState, useMemo } from 'react';
import { Search, Filter, ChevronRight, Plus, X, ArrowUpDown, ArrowUp, ArrowDown, MapPin, Building, DollarSign } from 'lucide-react';
import { Hospital, SalesStage, HospitalLevel, Region } from '../types';

interface HospitalListProps {
  hospitals: Hospital[];
  onSelectHospital: (id: string) => void;
  onAddHospital: (data: Pick<Hospital, 'name' | 'region' | 'address' | 'stage' | 'level'>) => void;
}

type SortKey = 'name' | 'region' | 'stage' | 'level' | 'chargePerUse';
type SortDirection = 'asc' | 'desc';

const HospitalList: React.FC<HospitalListProps> = ({ hospitals, onSelectHospital, onAddHospital }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Filter State
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState({
    stage: 'All',
    region: 'All'
  });

  // Sorting State
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection } | null>(null);

  // Create new hospital state
  const [newHospital, setNewHospital] = useState({
    name: '',
    address: '',
    region: Region.NORTH,
    level: HospitalLevel.LOCAL,
    stage: SalesStage.LEAD
  });

  // 格式化日期的 helper function
  const formatLastVisit = (lastVisit: string): string => {
    if (lastVisit === 'Never') return '尚未拜訪';
    try {
      return new Date(lastVisit).toLocaleDateString('zh-TW');
    } catch {
      return lastVisit;
    }
  };

  // 格式化金額
  const formatCurrency = (amount: number | undefined): string => {
    if (!amount) return '-';
    return new Intl.NumberFormat('zh-TW', {
      style: 'currency',
      currency: 'TWD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Derive unique regions for filter dropdown
  const uniqueRegions = useMemo(() => {
    const regions = new Set(hospitals.map(h => h.region));
    return ['All', ...Array.from(regions).sort()];
  }, [hospitals]);

  const sortedHospitals = useMemo(() => {
    // 1. Filter
    const filtered = hospitals.filter(h => {
      const matchesSearch = h.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        h.region.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStage = activeFilters.stage === 'All' || h.stage === activeFilters.stage;
      const matchesRegion = activeFilters.region === 'All' || h.region === activeFilters.region;

      return matchesSearch && matchesStage && matchesRegion;
    });

    // 2. Sort
    if (!sortConfig) return filtered;

    const regionOrder: Record<string, number> = { '北區': 1, '中區': 2, '南區': 3, '東區': 4 };
    const levelOrder: Record<string, number> = {
      [HospitalLevel.MEDICAL_CENTER]: 1,
      [HospitalLevel.REGIONAL]: 2,
      [HospitalLevel.LOCAL]: 3
    };
    const stageOrder: Record<string, number> = {
      [SalesStage.LEAD]: 1,
      [SalesStage.QUALIFICATION]: 2,
      [SalesStage.TRIAL]: 3,
      [SalesStage.NEGOTIATION]: 4,
      [SalesStage.CLOSED_WON]: 5,
      [SalesStage.CLOSED_LOST]: 6
    };

    return [...filtered].sort((a, b) => {
      let comparison = 0;

      if (sortConfig.key === 'region') {
        const aVal = regionOrder[a.region] || 99;
        const bVal = regionOrder[b.region] || 99;
        comparison = aVal - bVal;
      } else if (sortConfig.key === 'level') {
        const aVal = levelOrder[a.level] || 99;
        const bVal = levelOrder[b.level] || 99;
        comparison = aVal - bVal;
        // 次要排序：相同等級時按區域排序（固定北→中→南→東）
        if (comparison === 0) {
          const aRegion = regionOrder[a.region] || 99;
          const bRegion = regionOrder[b.region] || 99;
          comparison = aRegion - bRegion;
        }
      } else if (sortConfig.key === 'stage') {
        const aVal = stageOrder[a.stage] || 99;
        const bVal = stageOrder[b.stage] || 99;
        comparison = aVal - bVal;
        // 次要排序：相同狀態時按區域排序（固定北→中→南→東）
        if (comparison === 0) {
          const aRegion = regionOrder[a.region] || 99;
          const bRegion = regionOrder[b.region] || 99;
          comparison = aRegion - bRegion;
        }
      } else if (sortConfig.key === 'chargePerUse') {
        const aVal = a.chargePerUse || 0;
        const bVal = b.chargePerUse || 0;
        comparison = aVal - bVal;
      } else {
        // 名稱使用中文筆畫排序
        comparison = a.name.localeCompare(b.name, 'zh-TW-u-co-stroke');
      }

      // 主要排序方向（次要排序區域始終固定北→中→南→東）
      if (sortConfig.key === 'level' || sortConfig.key === 'stage') {
        // 只對主要排序欄位套用方向，區域次要排序保持固定
        const primaryComparison = sortConfig.key === 'level'
          ? (levelOrder[a.level] || 99) - (levelOrder[b.level] || 99)
          : (stageOrder[a.stage] || 99) - (stageOrder[b.stage] || 99);
        
        const regionComparison = (regionOrder[a.region] || 99) - (regionOrder[b.region] || 99);
        
        if (primaryComparison !== 0) {
          return sortConfig.direction === 'asc' ? primaryComparison : -primaryComparison;
        }
        return regionComparison; // 區域始終固定順序
      }

      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });

  }, [hospitals, searchTerm, activeFilters, sortConfig]);

  const handleSort = (key: SortKey) => {
    setSortConfig(current => {
      if (current?.key === key) {
        return { key, direction: current.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'asc' };
    });
  };

  const getSortIcon = (key: SortKey) => {
    if (sortConfig?.key !== key) return <ArrowUpDown size={14} className="ml-1 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />;
    return sortConfig.direction === 'asc'
      ? <ArrowDown size={14} className="ml-1 text-blue-600" />
      : <ArrowUp size={14} className="ml-1 text-blue-600" />;
  };

  const handleCreate = () => {
    if (!newHospital.name || !newHospital.region) return;
    onAddHospital(newHospital);
    setIsModalOpen(false);
    setNewHospital({ name: '', address: '', region: Region.NORTH, level: HospitalLevel.LOCAL, stage: SalesStage.LEAD });
  };

  const resetFilters = () => {
    setActiveFilters({ stage: 'All', region: 'All' });
    setSearchTerm('');
    setSortConfig(null);
  };

  const getStageBadge = (stage: SalesStage) => {
    const colors: Record<SalesStage, string> = {
      [SalesStage.LEAD]: 'bg-slate-100 text-slate-600 ring-slate-200',
      [SalesStage.QUALIFICATION]: 'bg-blue-50 text-blue-600 ring-blue-100',
      [SalesStage.TRIAL]: 'bg-amber-50 text-amber-600 ring-amber-100',
      [SalesStage.NEGOTIATION]: 'bg-purple-50 text-purple-600 ring-purple-100',
      [SalesStage.CLOSED_WON]: 'bg-emerald-50 text-emerald-600 ring-emerald-100',
      [SalesStage.CLOSED_LOST]: 'bg-red-50 text-red-600 ring-red-100',
    };
    return (
      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ring-1 ring-inset ${colors[stage]}`}>
        {stage}
      </span>
    );
  };

  const getEquipmentSummary = (hospital: Hospital) => {
    if (!hospital.installedEquipment || hospital.installedEquipment.length === 0) {
      return <span className="text-slate-400 text-sm italic">無</span>;
    }

    const summary = hospital.installedEquipment.reduce((acc, curr) => {
      acc[curr.productCode] = (acc[curr.productCode] || 0) + curr.quantity;
      return acc;
    }, {} as Record<string, number>);

    return (
      <div className="flex flex-wrap gap-2">
        {Object.entries(summary).map(([code, qty]) => (
          <div key={code} className="flex items-center bg-slate-50 border border-slate-100 rounded-md px-1.5 py-0.5 text-xs font-medium text-slate-700">
            <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${code === 'MR810' ? 'bg-blue-500' : 'bg-indigo-500'}`}></span>
            <span>{code} <span className="text-slate-400 ml-0.5">x{qty}</span></span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="p-6 lg:p-10 max-w-[1600px] mx-auto h-full flex flex-col relative overflow-hidden">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 space-y-4 md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">醫院列表</h1>
          <p className="text-slate-500 mt-2">管理您的客戶關係並追蹤進行中的銷售機會。</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="hidden md:flex w-full md:w-auto bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white px-5 py-2.5 rounded-xl font-medium items-center justify-center space-x-2 shadow-lg shadow-blue-600/20 transition-all hover:-translate-y-0.5"
        >
          <Plus size={20} />
          <span>新增醫院</span>
        </button>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-white p-4 md:p-5 rounded-2xl shadow-sm border border-slate-200/60 mb-6 transition-all focus-within:ring-2 focus-within:ring-blue-100">
        <div className="flex gap-3 items-center">
          <div className="relative flex-1 group">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
            <input
              type="text"
              placeholder="搜尋醫院、區域..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all text-slate-900 placeholder:text-slate-400 text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className={`shrink-0 flex items-center justify-center w-11 h-11 md:w-auto md:h-auto md:px-4 md:py-2.5 rounded-xl border font-medium transition-colors ${isFilterOpen || activeFilters.stage !== 'All' || activeFilters.region !== 'All'
                ? 'bg-blue-50 border-blue-200 text-blue-700'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
          >
            <Filter size={18} />
            <span className="hidden md:inline ml-2">篩選</span>
            {(activeFilters.stage !== 'All' || activeFilters.region !== 'All') && (
              <span className="hidden md:flex h-2 w-2 rounded-full bg-blue-600 ml-1 ring-2 ring-white"></span>
            )}
          </button>
          {/* Mobile Add Button */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="md:hidden shrink-0 flex items-center justify-center w-11 h-11 rounded-xl bg-blue-600 text-white shadow-md shadow-blue-600/20 active:scale-95 transition-transform"
          >
            <Plus size={20} />
          </button>
        </div>

        {/* Mobile Sort Bar - Inside the search box */}
        <div className="md:hidden mt-4 pt-4 border-t border-slate-100 flex items-center gap-2 overflow-x-auto no-scrollbar">
          <span className="text-xs text-slate-500 font-medium shrink-0">排序：</span>
          {([
            { key: 'name', label: '名稱' },
            { key: 'region', label: '區域' },
            { key: 'level', label: '等級' },
            { key: 'chargePerUse', label: '收費' },
            { key: 'stage', label: '狀態' }
          ] as { key: SortKey; label: string }[]).map((item) => (
            <button
              key={item.key}
              onClick={() => handleSort(item.key)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium shrink-0 transition-colors ${
                sortConfig?.key === item.key
                  ? 'bg-blue-100 text-blue-700 border border-blue-200'
                  : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              {item.label}
              {sortConfig?.key === item.key && (
                sortConfig.direction === 'asc' 
                  ? <ArrowUp size={12} /> 
                  : <ArrowDown size={12} />
              )}
            </button>
          ))}
        </div>

        {/* Expandable Filter Panel */}
        {isFilterOpen && (
          <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 animate-fade-in">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">銷售階段</label>
              <select
                className="w-full text-sm border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-slate-50/50 hover:bg-white transition-colors"
                value={activeFilters.stage}
                onChange={(e) => setActiveFilters({ ...activeFilters, stage: e.target.value })}
              >
                <option value="All">所有階段</option>
                {Object.values(SalesStage).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">區域</label>
              <select
                className="w-full text-sm border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-slate-50/50 hover:bg-white transition-colors"
                value={activeFilters.region}
                onChange={(e) => setActiveFilters({ ...activeFilters, region: e.target.value })}
              >
                {uniqueRegions.map(r => <option key={r} value={r}>{r === 'All' ? '所有區域' : r}</option>)}
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={resetFilters}
                className="text-sm font-medium text-slate-500 hover:text-blue-600 hover:bg-blue-50 px-4 py-3 rounded-lg transition-colors w-full md:w-auto"
              >
                重置篩選
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Desktop Table View (Hidden on Mobile) */}
      <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-slate-200/60 flex-1 min-h-0 overflow-hidden">
        <div className="overflow-auto h-full">
          <table className="w-full text-left">
            <thead className="bg-slate-50/80 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors select-none group" onClick={() => handleSort('name')}>
                  <div className="flex items-center">醫院名稱 {getSortIcon('name')}</div>
                </th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors select-none group" onClick={() => handleSort('region')}>
                  <div className="flex items-center">區域 {getSortIcon('region')}</div>
                </th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors select-none group" onClick={() => handleSort('level')}>
                  <div className="flex items-center">等級 {getSortIcon('level')}</div>
                </th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors select-none group" onClick={() => handleSort('chargePerUse')}>
                  <div className="flex items-center">收費金額 {getSortIcon('chargePerUse')}</div>
                </th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">設備安裝</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors select-none group" onClick={() => handleSort('stage')}>
                  <div className="flex items-center">狀態 {getSortIcon('stage')}</div>
                </th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">上次拜訪</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedHospitals.map((hospital) => (
                <tr
                  key={hospital.id}
                  onClick={() => onSelectHospital(hospital.id)}
                  className="hover:bg-blue-50/30 transition-colors cursor-pointer group"
                >
                  <td className="px-6 py-5">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-slate-600 text-xs font-bold shadow-inner ring-1 ring-white">
                        {hospital.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <span className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors block">{hospital.name}</span>
                        <span className="text-xs text-slate-400">{hospital.address}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-sm text-slate-600 font-medium">{hospital.region}</td>
                  <td className="px-6 py-5 text-sm text-slate-600">
                    <span className="bg-slate-50 text-slate-700 px-2.5 py-1 rounded-md text-xs font-medium border border-slate-200">{hospital.level}</span>
                  </td>
                  <td className="px-6 py-5 text-sm text-slate-600 font-medium">
                    {hospital.chargePerUse ? (
                      <span className="text-amber-600 font-semibold">{formatCurrency(hospital.chargePerUse)}</span>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-5">
                    {getEquipmentSummary(hospital)}
                  </td>
                  <td className="px-6 py-5">
                    {getStageBadge(hospital.stage)}
                  </td>
                  <td className="px-6 py-5 text-sm text-slate-500 font-medium">{formatLastVisit(hospital.lastVisit)}</td>
                  <td className="px-6 py-5 text-slate-400 text-right">
                    <ChevronRight size={18} className="group-hover:text-blue-500 inline-block transition-transform group-hover:translate-x-1" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card View (Hidden on Desktop) */}
      <div className="md:hidden flex-1 min-h-0 overflow-auto space-y-4 pb-4">
        {sortedHospitals.map((hospital) => (
          <div
            key={hospital.id}
            onClick={() => onSelectHospital(hospital.id)}
            className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 active:scale-[0.98] transition-transform cursor-pointer"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 font-bold shadow-sm">
                  {hospital.name.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 leading-tight text-lg">{hospital.name}</h3>
                  <div className="flex items-center text-xs text-slate-500 mt-1">
                    <MapPin size={12} className="mr-1" />
                    {hospital.region}
                  </div>
                </div>
              </div>
              <div className="mt-1">
                {getStageBadge(hospital.stage)}
              </div>
            </div>

            <div className="space-y-3 mt-4 pt-4 border-t border-slate-100">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 flex items-center"><Building size={14} className="mr-1.5" /> 等級</span>
                <span className="text-slate-900 font-medium">{hospital.level}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 flex items-center"><DollarSign size={14} className="mr-1.5" /> 收費</span>
                <span className={hospital.chargePerUse ? "text-amber-600 font-semibold" : "text-slate-400"}>
                  {hospital.chargePerUse ? formatCurrency(hospital.chargePerUse) : '-'}
                </span>
              </div>
              <div className="flex justify-between text-sm items-start">
                <span className="text-slate-500 mt-0.5">設備</span>
                <div className="text-right">{getEquipmentSummary(hospital)}</div>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">上次拜訪</span>
                <span className="text-slate-900 font-medium">{formatLastVisit(hospital.lastVisit)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {sortedHospitals.length === 0 && (
        <div className="p-16 text-center text-slate-400">
          <div className="flex flex-col items-center justify-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <Search size={24} className="text-slate-300" />
            </div>
            <p className="mb-2 text-lg font-medium text-slate-600">找不到醫院</p>
            <p className="text-sm mb-6">請嘗試調整篩選條件或搜尋關鍵字</p>
            <button onClick={resetFilters} className="text-blue-600 hover:text-blue-700 text-sm font-semibold hover:underline">清除篩選</button>
          </div>
        </div>
      )}

      {/* Add Hospital Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in max-h-[90vh] overflow-y-auto border border-slate-200">
            <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h3 className="font-bold text-xl text-slate-900">新增醫院</h3>
                <p className="text-sm text-slate-500 mt-1">輸入新客戶的詳細資訊。</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 bg-white hover:bg-slate-100 p-2 rounded-lg transition-all border border-transparent hover:border-slate-200">
                <X size={20} />
              </button>
            </div>
            <div className="p-8 space-y-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">醫院名稱</label>
                <input
                  type="text"
                  className="w-full border border-slate-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400"
                  placeholder="例如：台大醫院"
                  value={newHospital.name}
                  onChange={(e) => setNewHospital({ ...newHospital, name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">區域</label>
                  <div className="relative">
                    <select
                      className="w-full border border-slate-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white appearance-none cursor-pointer"
                      value={newHospital.region}
                      onChange={(e) => setNewHospital({ ...newHospital, region: e.target.value as Region })}
                    >
                      {Object.values(Region).map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">等級</label>
                  <div className="relative">
                    <select
                      className="w-full border border-slate-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white appearance-none cursor-pointer"
                      value={newHospital.level}
                      onChange={(e) => setNewHospital({ ...newHospital, level: e.target.value as HospitalLevel })}
                    >
                      {Object.values(HospitalLevel).map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">地址</label>
                <input
                  type="text"
                  className="w-full border border-slate-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400"
                  placeholder="完整地址"
                  value={newHospital.address}
                  onChange={(e) => setNewHospital({ ...newHospital, address: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">初始階段</label>
                <div className="relative">
                  <select
                    className="w-full border border-slate-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white appearance-none cursor-pointer"
                    value={newHospital.stage}
                    onChange={(e) => setNewHospital({ ...newHospital, stage: e.target.value as SalesStage })}
                  >
                    {Object.values(SalesStage).map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
              <div className="pt-4 flex space-x-4">
                <button
                  onClick={handleCreate}
                  disabled={!newHospital.name || !newHospital.region}
                  className="flex-1 bg-blue-600 text-white py-3.5 rounded-xl font-semibold hover:bg-blue-700 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-600/20"
                >
                  建立醫院
                </button>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-slate-100 text-slate-700 py-3.5 rounded-xl font-semibold hover:bg-slate-200 transition-colors"
                >
                  取消
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HospitalList;
