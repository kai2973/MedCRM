import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  DollarSign, 
  Search, 
  Filter, 
  ChevronRight, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Package,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Info,
  AlertCircle
} from 'lucide-react';
import { Hospital, Region, HospitalLevel, ProductType } from '../types';
import { PRODUCTS } from '../constants';

interface PriceListProps {
  hospitals: Hospital[];
}

type ViewMode = 'matrix' | 'list';
type SortKey = 'hospital' | 'region' | 'level' | 'price';
type SortDirection = 'asc' | 'desc';

// 區域排序順序
const REGION_ORDER: Record<string, number> = {
  [Region.NORTH]: 1,
  [Region.CENTRAL]: 2,
  [Region.SOUTH]: 3,
  [Region.EAST]: 4
};

// 等級排序順序
const LEVEL_ORDER: Record<string, number> = {
  [HospitalLevel.MEDICAL_CENTER]: 1,
  [HospitalLevel.REGIONAL]: 2,
  [HospitalLevel.LOCAL]: 3
};

const PriceList: React.FC<PriceListProps> = ({ hospitals }) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState({
    region: 'All',
    level: 'All'
  });
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection } | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<string>('');

  // 取得耗材產品列表
  const consumableProducts = useMemo(() => 
    PRODUCTS.filter(p => p.type === ProductType.CONSUMABLE),
    []
  );

  // 預設選擇第一個耗材
  React.useEffect(() => {
    if (!selectedProduct && consumableProducts.length > 0) {
      setSelectedProduct(consumableProducts[0].code);
    }
  }, [consumableProducts, selectedProduct]);

  // 彙整所有價格資料
  const priceData = useMemo(() => {
    const data: Array<{
      hospitalId: string;
      hospitalName: string;
      region: Region;
      level: HospitalLevel;
      productCode: string;
      productName: string;
      price: number;
    }> = [];

    hospitals.forEach(hospital => {
      if (hospital.consumables && hospital.consumables.length > 0) {
        hospital.consumables.forEach(consumable => {
          if (consumable.price > 0) {
            const product = consumableProducts.find(p => p.code === consumable.code);
            data.push({
              hospitalId: hospital.id,
              hospitalName: hospital.name,
              region: hospital.region,
              level: hospital.level,
              productCode: consumable.code,
              productName: product?.name || consumable.code,
              price: consumable.price
            });
          }
        });
      }
    });

    return data;
  }, [hospitals, consumableProducts]);

  // 計算各產品的統計資料
  const productStats = useMemo(() => {
    const stats: Record<string, {
      min: number;
      max: number;
      avg: number;
      count: number;
      prices: number[];
      hospitalsWithPrice: Set<string>;
    }> = {};

    priceData.forEach(item => {
      if (!stats[item.productCode]) {
        stats[item.productCode] = {
          min: item.price,
          max: item.price,
          avg: 0,
          count: 0,
          prices: [],
          hospitalsWithPrice: new Set()
        };
      }
      stats[item.productCode].min = Math.min(stats[item.productCode].min, item.price);
      stats[item.productCode].max = Math.max(stats[item.productCode].max, item.price);
      stats[item.productCode].prices.push(item.price);
      stats[item.productCode].count++;
      stats[item.productCode].hospitalsWithPrice.add(item.hospitalId);
    });

    // 計算平均
    Object.keys(stats).forEach(code => {
      const total = stats[code].prices.reduce((sum, p) => sum + p, 0);
      stats[code].avg = Math.round(total / stats[code].count);
    });

    return stats;
  }, [priceData]);

  // 計算未建立價格的醫院數
  const getMissingPriceCount = (productCode: string): number => {
    const stats = productStats[productCode];
    const hospitalsWithPrice = stats?.hospitalsWithPrice?.size || 0;
    return hospitals.length - hospitalsWithPrice;
  };

  // 篩選後的價格資料
  const filteredPriceData = useMemo(() => {
    return priceData.filter(item => {
      // 搜尋篩選
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        if (!item.hospitalName.toLowerCase().includes(term) && 
            !item.productCode.toLowerCase().includes(term) &&
            !item.productName.toLowerCase().includes(term)) {
          return false;
        }
      }

      // 區域篩選
      if (activeFilters.region !== 'All' && item.region !== activeFilters.region) {
        return false;
      }

      // 等級篩選
      if (activeFilters.level !== 'All' && item.level !== activeFilters.level) {
        return false;
      }

      // 產品篩選
      if (selectedProduct && item.productCode !== selectedProduct) {
        return false;
      }

      return true;
    });
  }, [priceData, searchTerm, activeFilters, selectedProduct]);

  // 排序後的資料
  const sortedPriceData = useMemo(() => {
    if (!sortConfig) return filteredPriceData;

    return [...filteredPriceData].sort((a, b) => {
      let comparison = 0;
      switch (sortConfig.key) {
        case 'hospital':
          comparison = a.hospitalName.localeCompare(b.hospitalName, 'zh-TW');
          break;
        case 'region':
          comparison = (REGION_ORDER[a.region] || 99) - (REGION_ORDER[b.region] || 99);
          break;
        case 'level':
          comparison = (LEVEL_ORDER[a.level] || 99) - (LEVEL_ORDER[b.level] || 99);
          break;
        case 'price':
          comparison = a.price - b.price;
          break;
      }
      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });
  }, [filteredPriceData, sortConfig]);

  // 矩陣視圖資料（含排序）
  const matrixData = useMemo(() => {
    let hospitalsWithPrices = hospitals.filter(h => 
      h.consumables && h.consumables.length > 0 && h.consumables.some(c => c.price > 0)
    );

    // 套用篩選
    hospitalsWithPrices = hospitalsWithPrices.filter(h => {
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        if (!h.name.toLowerCase().includes(term)) return false;
      }
      if (activeFilters.region !== 'All' && h.region !== activeFilters.region) return false;
      if (activeFilters.level !== 'All' && h.level !== activeFilters.level) return false;
      return true;
    });

    // 套用排序
    if (sortConfig) {
      hospitalsWithPrices = [...hospitalsWithPrices].sort((a, b) => {
        let comparison = 0;
        switch (sortConfig.key) {
          case 'hospital':
            comparison = a.name.localeCompare(b.name, 'zh-TW');
            break;
          case 'region':
            comparison = (REGION_ORDER[a.region] || 99) - (REGION_ORDER[b.region] || 99);
            break;
          case 'level':
            comparison = (LEVEL_ORDER[a.level] || 99) - (LEVEL_ORDER[b.level] || 99);
            break;
          case 'price':
            // 依選擇的產品價格排序
            const priceA = a.consumables?.find(c => c.code === selectedProduct)?.price || 0;
            const priceB = b.consumables?.find(c => c.code === selectedProduct)?.price || 0;
            comparison = priceA - priceB;
            break;
        }
        return sortConfig.direction === 'asc' ? comparison : -comparison;
      });
    }

    return hospitalsWithPrices;
  }, [hospitals, searchTerm, activeFilters, sortConfig, selectedProduct]);

  // 格式化金額
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('zh-TW', {
      style: 'currency',
      currency: 'TWD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // 取得價格相對於平均的狀態
  const getPriceStatus = (price: number, productCode: string): 'high' | 'low' | 'normal' => {
    const stats = productStats[productCode];
    if (!stats) return 'normal';
    
    const threshold = stats.avg * 0.1; // 10% 差異
    if (price > stats.avg + threshold) return 'high';
    if (price < stats.avg - threshold) return 'low';
    return 'normal';
  };

  // 排序處理
  const handleSort = (key: SortKey) => {
    setSortConfig(prev => {
      if (prev?.key === key) {
        if (prev.direction === 'asc') return { key, direction: 'desc' };
        return null;
      }
      return { key, direction: 'asc' };
    });
  };

  // 取得排序圖示
  const getSortIcon = (key: SortKey) => {
    if (sortConfig?.key !== key) {
      return <ArrowUpDown size={14} className="ml-1 text-slate-300" />;
    }
    return sortConfig.direction === 'asc' 
      ? <ArrowUp size={14} className="ml-1 text-blue-600" />
      : <ArrowDown size={14} className="ml-1 text-blue-600" />;
  };

  // 重置篩選
  const resetFilters = () => {
    setActiveFilters({ region: 'All', level: 'All' });
    setSearchTerm('');
  };

  // 跳轉到醫院詳情
  const goToHospital = (hospitalId: string) => {
    navigate(`/hospitals/${hospitalId}`);
  };

  // 取得醫院的某產品價格
  const getHospitalProductPrice = (hospital: Hospital, productCode: string): number | null => {
    const consumable = hospital.consumables?.find(c => c.code === productCode);
    return consumable?.price && consumable.price > 0 ? consumable.price : null;
  };

  // 有價格的產品列表（用於矩陣表頭）
  const productsWithPrices = useMemo(() => {
    const codes = new Set<string>();
    hospitals.forEach(h => {
      h.consumables?.forEach(c => {
        if (c.price > 0) codes.add(c.code);
      });
    });
    return consumableProducts.filter(p => codes.has(p.code));
  }, [hospitals, consumableProducts]);

  const hasFilters = activeFilters.region !== 'All' || activeFilters.level !== 'All';
  const currentStats = selectedProduct ? productStats[selectedProduct] : null;
  const missingCount = selectedProduct ? getMissingPriceCount(selectedProduct) : 0;

  return (
    <div className="p-4 md:p-6 lg:p-10 max-w-[1600px] mx-auto h-full flex flex-col relative overflow-hidden">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-4 md:mb-8 space-y-2 md:space-y-0">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">價格清單</h1>
          <p className="text-slate-500 text-sm md:text-base mt-1">查看各醫院的耗材價格與統計分析。</p>
        </div>
        
        {/* View Mode Toggle - Desktop */}
        <div className="hidden md:flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setViewMode('list')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              viewMode === 'list' 
                ? 'bg-white text-slate-900 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            清單檢視
          </button>
          <button
            onClick={() => setViewMode('matrix')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              viewMode === 'matrix' 
                ? 'bg-white text-slate-900 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            矩陣檢視
          </button>
        </div>
      </div>

      {/* Mobile: Product Selector + Stats Bar */}
      <div className="md:hidden mb-4">
        {/* Product Tabs */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
          {consumableProducts.map(p => (
            <button
              key={p.code}
              onClick={() => setSelectedProduct(p.code)}
              className={`px-3 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                selectedProduct === p.code
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white text-slate-600 border border-slate-200'
              }`}
            >
              {p.code}
            </button>
          ))}
        </div>

        {/* Stats for Selected Product */}
        {currentStats ? (
          <div className="mt-3 bg-gradient-to-r from-blue-50 to-indigo-50 p-3 rounded-xl border border-blue-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <p className="text-[10px] text-slate-500 font-medium">最低</p>
                  <p className="text-sm font-bold text-emerald-600">{formatCurrency(currentStats.min)}</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] text-slate-500 font-medium">平均</p>
                  <p className="text-sm font-bold text-slate-900">{formatCurrency(currentStats.avg)}</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] text-slate-500 font-medium">最高</p>
                  <p className="text-sm font-bold text-amber-600">{formatCurrency(currentStats.max)}</p>
                </div>
              </div>
              {missingCount > 0 && (
                <div className="flex items-center gap-1.5 bg-amber-100 text-amber-700 px-2 py-1 rounded-lg">
                  <AlertCircle size={12} />
                  <span className="text-xs font-medium">{missingCount} 家未建立</span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="mt-3 bg-slate-50 p-3 rounded-xl border border-slate-200 text-center">
            <p className="text-sm text-slate-500">尚無價格資料</p>
          </div>
        )}
      </div>

      {/* Desktop Stats Cards */}
      <div className="hidden md:grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
              <Package size={20} />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">選擇耗材</p>
              <select
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
                className="text-lg font-bold text-slate-900 bg-transparent border-none p-0 focus:outline-none cursor-pointer"
              >
                {consumableProducts.map(p => (
                  <option key={p.code} value={p.code}>{p.code}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
        
        {currentStats ? (
          <>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
                  <TrendingDown size={20} />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium">最低價</p>
                  <p className="text-xl font-bold text-emerald-600">{formatCurrency(currentStats.min)}</p>
                </div>
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center">
                  <TrendingUp size={20} />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium">最高價</p>
                  <p className="text-xl font-bold text-amber-600">{formatCurrency(currentStats.max)}</p>
                </div>
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-red-100 text-red-600 flex items-center justify-center">
                  <AlertCircle size={20} />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium">未建立價格</p>
                  <p className="text-xl font-bold text-slate-900">
                    {missingCount} <span className="text-sm font-normal text-slate-400">家醫院</span>
                  </p>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm col-span-3 flex items-center justify-center">
            <p className="text-slate-400">選擇耗材以查看統計</p>
          </div>
        )}
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-white p-3 md:p-4 rounded-xl md:rounded-2xl shadow-sm border border-slate-200/60 mb-4 md:mb-6">
        <div className="flex gap-2 items-center">
          <div className="relative flex-1 group">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={16} />
            <input
              type="text"
              placeholder="搜尋醫院..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all text-slate-900 placeholder:text-slate-400 text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <button
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className={`shrink-0 flex items-center justify-center px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
              isFilterOpen || hasFilters
                ? 'bg-blue-50 border-blue-200 text-blue-700'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Filter size={16} />
            <span className="hidden sm:inline ml-1.5">篩選</span>
            {hasFilters && (
              <span className="ml-1 h-1.5 w-1.5 rounded-full bg-blue-600"></span>
            )}
          </button>
        </div>

        {/* Mobile Sort Bar */}
        <div className="md:hidden mt-2 pt-2 border-t border-slate-100 flex items-center gap-2 overflow-x-auto no-scrollbar">
          <span className="text-xs text-slate-500 font-medium shrink-0">排序：</span>
          {([
            { key: 'hospital' as SortKey, label: '醫院' },
            { key: 'region' as SortKey, label: '區域' },
            { key: 'level' as SortKey, label: '等級' },
            { key: 'price' as SortKey, label: '價格' }
          ]).map((item) => (
            <button
              key={item.key}
              onClick={() => handleSort(item.key)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium shrink-0 transition-colors ${
                sortConfig?.key === item.key
                  ? 'bg-blue-100 text-blue-700 border border-blue-200'
                  : 'bg-slate-50 text-slate-600 border border-slate-200'
              }`}
            >
              {item.label}
              {sortConfig?.key === item.key && (
                sortConfig.direction === 'asc' 
                  ? <ArrowUp size={10} />
                  : <ArrowDown size={10} />
              )}
            </button>
          ))}
        </div>

        {/* Filter Panel */}
        {isFilterOpen && (
          <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-2 md:grid-cols-3 gap-3 animate-fade-in">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">區域</label>
              <select
                value={activeFilters.region}
                onChange={(e) => setActiveFilters(prev => ({ ...prev, region: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-blue-500 text-slate-900 text-sm"
              >
                {['All', ...Object.values(Region)].map(r => (
                  <option key={r} value={r}>{r === 'All' ? '所有區域' : r}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">等級</label>
              <select
                value={activeFilters.level}
                onChange={(e) => setActiveFilters(prev => ({ ...prev, level: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-blue-500 text-slate-900 text-sm"
              >
                {['All', ...Object.values(HospitalLevel)].map(l => (
                  <option key={l} value={l}>{l === 'All' ? '所有等級' : l}</option>
                ))}
              </select>
            </div>
            <div className="col-span-2 md:col-span-1 flex items-end">
              <button
                onClick={resetFilters}
                className="text-sm font-medium text-slate-500 hover:text-blue-600 hover:bg-blue-50 px-3 py-2 rounded-lg transition-colors w-full md:w-auto"
              >
                重置篩選
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Desktop Table View (List Mode) */}
      {viewMode === 'list' && (
        <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-slate-200/60 flex-1 min-h-0 overflow-hidden">
          <div className="overflow-x-auto h-full">
            <table className="w-full text-left">
              <thead className="bg-slate-50/80 border-b border-slate-200 sticky top-0">
                <tr>
                  <th 
                    className="px-5 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors select-none"
                    onClick={() => handleSort('hospital')}
                  >
                    <div className="flex items-center">醫院 {getSortIcon('hospital')}</div>
                  </th>
                  <th 
                    className="px-4 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors select-none"
                    onClick={() => handleSort('region')}
                  >
                    <div className="flex items-center">區域 {getSortIcon('region')}</div>
                  </th>
                  <th 
                    className="px-4 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors select-none"
                    onClick={() => handleSort('level')}
                  >
                    <div className="flex items-center">等級 {getSortIcon('level')}</div>
                  </th>
                  <th 
                    className="px-4 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors select-none"
                    onClick={() => handleSort('price')}
                  >
                    <div className="flex items-center">價格 {getSortIcon('price')}</div>
                  </th>
                  <th className="px-4 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">相對平均</th>
                  <th className="px-3 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sortedPriceData.map((item, index) => {
                  const status = getPriceStatus(item.price, item.productCode);
                  const stats = productStats[item.productCode];
                  const diffPercent = stats ? Math.round((item.price - stats.avg) / stats.avg * 100) : 0;
                  
                  return (
                    <tr 
                      key={`${item.hospitalId}-${item.productCode}-${index}`}
                      onClick={() => goToHospital(item.hospitalId)}
                      className="hover:bg-slate-50 cursor-pointer group transition-colors"
                    >
                      <td className="px-5 py-4">
                        <span className="font-medium text-slate-900">{item.hospitalName}</span>
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-500">{item.region}</td>
                      <td className="px-4 py-4">
                        <span className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-600">
                          {item.level}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`font-bold text-lg ${
                          status === 'high' ? 'text-amber-600' :
                          status === 'low' ? 'text-emerald-600' :
                          'text-slate-900'
                        }`}>
                          {formatCurrency(item.price)}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className={`flex items-center gap-1 text-sm font-medium ${
                          status === 'high' ? 'text-amber-600' :
                          status === 'low' ? 'text-emerald-600' :
                          'text-slate-400'
                        }`}>
                          {status === 'high' && <TrendingUp size={14} />}
                          {status === 'low' && <TrendingDown size={14} />}
                          {status === 'normal' && <Minus size={14} />}
                          <span>{diffPercent > 0 ? '+' : ''}{diffPercent}%</span>
                        </div>
                      </td>
                      <td className="px-3 py-4 text-slate-400 text-right">
                        <ChevronRight size={18} className="group-hover:text-blue-500 inline-block transition-transform group-hover:translate-x-1" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Desktop Matrix View */}
      {viewMode === 'matrix' && (
        <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-slate-200/60 flex-1 min-h-0 overflow-hidden">
          <div className="overflow-auto h-full">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50/80 border-b border-slate-200 sticky top-0 z-10">
                <tr>
                  <th 
                    className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider sticky left-0 bg-slate-50 z-20 min-w-[180px] cursor-pointer hover:bg-slate-100 transition-colors border-r border-slate-200"
                    onClick={() => handleSort('hospital')}
                  >
                    <div className="flex items-center">醫院 {getSortIcon('hospital')}</div>
                  </th>
                  <th 
                    className="px-3 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors w-[70px]"
                    onClick={() => handleSort('region')}
                  >
                    <div className="flex items-center">區域 {getSortIcon('region')}</div>
                  </th>
                  <th 
                    className="px-3 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors w-[80px] border-r border-slate-200"
                    onClick={() => handleSort('level')}
                  >
                    <div className="flex items-center">等級 {getSortIcon('level')}</div>
                  </th>
                  {productsWithPrices.map(product => (
                    <th 
                      key={product.code}
                      className="px-3 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-center min-w-[90px]"
                    >
                      <div>{product.code}</div>
                      {productStats[product.code] && (
                        <div className="text-[10px] font-normal text-slate-400 mt-0.5">
                          平均 {formatCurrency(productStats[product.code].avg)}
                        </div>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {matrixData.map(hospital => (
                  <tr 
                    key={hospital.id}
                    onClick={() => goToHospital(hospital.id)}
                    className="hover:bg-slate-50 cursor-pointer group transition-colors"
                  >
                    <td className="px-4 py-3 sticky left-0 bg-white group-hover:bg-slate-50 transition-colors z-10 border-r border-slate-100">
                      <span className="font-medium text-slate-900 text-sm">{hospital.name}</span>
                    </td>
                    <td className="px-3 py-3 text-xs text-slate-500">{hospital.region}</td>
                    <td className="px-3 py-3 border-r border-slate-100">
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">
                        {hospital.level}
                      </span>
                    </td>
                    {productsWithPrices.map(product => {
                      const price = getHospitalProductPrice(hospital, product.code);
                      const status = price ? getPriceStatus(price, product.code) : null;
                      
                      return (
                        <td key={product.code} className="px-3 py-3 text-center">
                          {price ? (
                            <span className={`font-semibold text-sm ${
                              status === 'high' ? 'text-amber-600' :
                              status === 'low' ? 'text-emerald-600' :
                              'text-slate-700'
                            }`}>
                              {formatCurrency(price)}
                            </span>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Mobile Card View */}
      <div className="md:hidden flex-1 min-h-0 overflow-auto space-y-2 pb-4">
        {sortedPriceData.length > 0 ? (
          sortedPriceData.map((item, index) => {
            const status = getPriceStatus(item.price, item.productCode);

            return (
              <div
                key={`${item.hospitalId}-${item.productCode}-${index}`}
                onClick={() => goToHospital(item.hospitalId)}
                className="bg-white p-3 rounded-xl shadow-sm border border-slate-200 active:scale-[0.98] transition-transform cursor-pointer"
              >
                <div className="flex justify-between items-center">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-900 truncate">{item.hospitalName}</h3>
                    <p className="text-xs text-slate-500">{item.region} · {item.level}</p>
                  </div>
                  <div className="text-right ml-3 flex items-center gap-2">
                    <span className={`text-lg font-bold ${
                      status === 'high' ? 'text-amber-600' :
                      status === 'low' ? 'text-emerald-600' :
                      'text-slate-900'
                    }`}>
                      {formatCurrency(item.price)}
                    </span>
                    <div className={`flex items-center text-xs font-medium ${
                      status === 'high' ? 'text-amber-500' :
                      status === 'low' ? 'text-emerald-500' :
                      'text-slate-400'
                    }`}>
                      {status === 'high' && <TrendingUp size={12} />}
                      {status === 'low' && <TrendingDown size={12} />}
                      {status === 'normal' && <Minus size={12} />}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-8 text-center text-slate-400">
            <div className="flex flex-col items-center justify-center">
              <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                <DollarSign size={20} className="text-slate-300" />
              </div>
              <p className="text-sm font-medium text-slate-600">尚無價格資料</p>
              <p className="text-xs text-slate-400 mt-1">請先在各醫院設定耗材價格</p>
            </div>
          </div>
        )}
      </div>

      {/* Empty State for Desktop */}
      {((viewMode === 'list' && sortedPriceData.length === 0) || (viewMode === 'matrix' && matrixData.length === 0)) && (
        <div className="hidden md:flex p-16 text-center text-slate-400 flex-col items-center justify-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
            <DollarSign size={24} className="text-slate-300" />
          </div>
          <p className="mb-2 text-lg font-medium text-slate-600">尚無價格資料</p>
          <p className="text-sm mb-6">請先在各醫院設定耗材價格</p>
          {hasFilters && (
            <button onClick={resetFilters} className="text-blue-600 hover:text-blue-700 text-sm font-semibold hover:underline">
              清除篩選
            </button>
          )}
        </div>
      )}

      {/* Info Tooltip for Price Status - Desktop Only */}
      <div className="hidden md:block fixed bottom-10 right-10">
        <div className="group relative">
          <button className="w-10 h-10 bg-white rounded-full shadow-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors">
            <Info size={18} />
          </button>
          <div className="absolute bottom-full right-0 mb-2 w-64 p-4 bg-white rounded-xl shadow-xl border border-slate-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
            <h4 className="font-bold text-slate-900 text-sm mb-2">價格標示說明</h4>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <TrendingUp size={14} className="text-amber-600" />
                <span className="text-slate-600">高於平均 10% 以上</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingDown size={14} className="text-emerald-600" />
                <span className="text-slate-600">低於平均 10% 以上</span>
              </div>
              <div className="flex items-center gap-2">
                <Minus size={14} className="text-slate-400" />
                <span className="text-slate-600">接近平均值</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PriceList;
