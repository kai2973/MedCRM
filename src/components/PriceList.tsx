import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  DollarSign, 
  Search, 
  Filter, 
  X, 
  ChevronRight, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Building2,
  Package,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Info
} from 'lucide-react';
import { Hospital, Region, HospitalLevel, ProductType } from '../types';
import { PRODUCTS } from '../constants';

interface PriceListProps {
  hospitals: Hospital[];
}

type ViewMode = 'matrix' | 'list';
type SortKey = 'hospital' | 'product' | 'price';
type SortDirection = 'asc' | 'desc';

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
  const [selectedProduct, setSelectedProduct] = useState<string>('all');

  // 取得耗材產品列表
  const consumableProducts = useMemo(() => 
    PRODUCTS.filter(p => p.type === ProductType.CONSUMABLE),
    []
  );

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
    }> = {};

    priceData.forEach(item => {
      if (!stats[item.productCode]) {
        stats[item.productCode] = {
          min: item.price,
          max: item.price,
          avg: 0,
          count: 0,
          prices: []
        };
      }
      stats[item.productCode].min = Math.min(stats[item.productCode].min, item.price);
      stats[item.productCode].max = Math.max(stats[item.productCode].max, item.price);
      stats[item.productCode].prices.push(item.price);
      stats[item.productCode].count++;
    });

    // 計算平均
    Object.keys(stats).forEach(code => {
      const total = stats[code].prices.reduce((sum, p) => sum + p, 0);
      stats[code].avg = Math.round(total / stats[code].count);
    });

    return stats;
  }, [priceData]);

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
      if (selectedProduct !== 'all' && item.productCode !== selectedProduct) {
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
        case 'product':
          comparison = a.productCode.localeCompare(b.productCode);
          break;
        case 'price':
          comparison = a.price - b.price;
          break;
      }
      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });
  }, [filteredPriceData, sortConfig]);

  // 矩陣視圖資料
  const matrixData = useMemo(() => {
    const hospitalsWithPrices = hospitals.filter(h => 
      h.consumables && h.consumables.length > 0 && h.consumables.some(c => c.price > 0)
    );

    // 套用篩選
    return hospitalsWithPrices.filter(h => {
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        if (!h.name.toLowerCase().includes(term)) return false;
      }
      if (activeFilters.region !== 'All' && h.region !== activeFilters.region) return false;
      if (activeFilters.level !== 'All' && h.level !== activeFilters.level) return false;
      return true;
    });
  }, [hospitals, searchTerm, activeFilters]);

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
    setSelectedProduct('all');
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

  const hasFilters = activeFilters.region !== 'All' || activeFilters.level !== 'All' || selectedProduct !== 'all';

  return (
    <div className="p-6 lg:p-10 max-w-[1600px] mx-auto h-full flex flex-col relative overflow-hidden">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 space-y-4 md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">價格清單</h1>
          <p className="text-slate-500 mt-2">查看各醫院的耗材價格與統計分析。</p>
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

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
              <Building2 size={20} />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">有價格資料</p>
              <p className="text-xl font-bold text-slate-900">
                {new Set(priceData.map(d => d.hospitalId)).size}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <Package size={20} />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">耗材種類</p>
              <p className="text-xl font-bold text-slate-900">
                {Object.keys(productStats).length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center">
              <DollarSign size={20} />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">價格紀錄</p>
              <p className="text-xl font-bold text-slate-900">{priceData.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center">
              <TrendingUp size={20} />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">平均價差</p>
              <p className="text-xl font-bold text-slate-900">
                {Object.keys(productStats).length > 0 
                  ? Math.round(
                      Object.values(productStats).reduce((sum, s) => 
                        sum + ((s.max - s.min) / s.avg * 100), 0
                      ) / Object.keys(productStats).length
                    ) + '%'
                  : '-'
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-white p-4 md:p-5 rounded-2xl shadow-sm border border-slate-200/60 mb-6 transition-all focus-within:ring-2 focus-within:ring-blue-100">
        <div className="flex gap-3 items-center">
          <div className="relative flex-1 group">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
            <input
              type="text"
              placeholder="搜尋醫院、產品..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all text-slate-900 placeholder:text-slate-400 text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          {/* Product Filter - Desktop */}
          <div className="hidden md:block">
            <select
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all text-slate-900 text-sm min-w-[140px]"
            >
              <option value="all">所有產品</option>
              {consumableProducts.map(p => (
                <option key={p.code} value={p.code}>{p.code}</option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className={`shrink-0 flex items-center justify-center w-11 h-11 md:w-auto md:h-auto md:px-4 md:py-2.5 rounded-xl border font-medium transition-colors ${
              isFilterOpen || hasFilters
                ? 'bg-blue-50 border-blue-200 text-blue-700'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <Filter size={18} />
            <span className="hidden md:inline ml-2">篩選</span>
            {hasFilters && (
              <span className="hidden md:flex h-2 w-2 rounded-full bg-blue-600 ml-1 ring-2 ring-white"></span>
            )}
          </button>
        </div>

        {/* Mobile Product Filter */}
        <div className="md:hidden mt-3 pt-3 border-t border-slate-100">
          <select
            value={selectedProduct}
            onChange={(e) => setSelectedProduct(e.target.value)}
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-blue-500 text-slate-900 text-sm"
          >
            <option value="all">所有產品</option>
            {consumableProducts.map(p => (
              <option key={p.code} value={p.code}>{p.code} - {p.name}</option>
            ))}
          </select>
        </div>

        {/* Mobile Sort Bar */}
        <div className="md:hidden mt-3 pt-3 border-t border-slate-100 flex items-center gap-2 overflow-x-auto no-scrollbar">
          <span className="text-xs text-slate-500 font-medium shrink-0">排序：</span>
          {([
            { key: 'hospital' as SortKey, label: '醫院' },
            { key: 'product' as SortKey, label: '產品' },
            { key: 'price' as SortKey, label: '價格' }
          ]).map((item) => (
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

        {/* Filter Panel */}
        {isFilterOpen && (
          <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">區域</label>
              <select
                value={activeFilters.region}
                onChange={(e) => setActiveFilters(prev => ({ ...prev, region: e.target.value }))}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-blue-500 text-slate-900 text-sm"
              >
                {['All', ...Object.values(Region)].map(r => (
                  <option key={r} value={r}>{r === 'All' ? '所有區域' : r}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">等級</label>
              <select
                value={activeFilters.level}
                onChange={(e) => setActiveFilters(prev => ({ ...prev, level: e.target.value }))}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-blue-500 text-slate-900 text-sm"
              >
                {['All', ...Object.values(HospitalLevel)].map(l => (
                  <option key={l} value={l}>{l === 'All' ? '所有等級' : l}</option>
                ))}
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

      {/* Product Stats Summary - Show when a specific product is selected */}
      {selectedProduct !== 'all' && productStats[selectedProduct] && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 md:p-5 rounded-2xl border border-blue-100 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center">
                <Package size={24} className="text-blue-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">{selectedProduct}</h3>
                <p className="text-sm text-slate-500">
                  {consumableProducts.find(p => p.code === selectedProduct)?.name}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-6">
              <div className="text-center">
                <p className="text-xs text-slate-500 font-medium">最低價</p>
                <p className="text-lg font-bold text-emerald-600">
                  {formatCurrency(productStats[selectedProduct].min)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-slate-500 font-medium">平均價</p>
                <p className="text-lg font-bold text-slate-900">
                  {formatCurrency(productStats[selectedProduct].avg)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-slate-500 font-medium">最高價</p>
                <p className="text-lg font-bold text-amber-600">
                  {formatCurrency(productStats[selectedProduct].max)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-slate-500 font-medium">資料筆數</p>
                <p className="text-lg font-bold text-slate-900">
                  {productStats[selectedProduct].count}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

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
                  <th className="px-4 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">區域</th>
                  <th className="px-4 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">等級</th>
                  <th 
                    className="px-4 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors select-none"
                    onClick={() => handleSort('product')}
                  >
                    <div className="flex items-center">產品 {getSortIcon('product')}</div>
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
                        <div>
                          <span className="font-medium text-slate-900">{item.productCode}</span>
                          <p className="text-xs text-slate-400">{item.productName}</p>
                        </div>
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
            <table className="w-full text-left">
              <thead className="bg-slate-50/80 border-b border-slate-200 sticky top-0 z-10">
                <tr>
                  <th className="px-5 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider sticky left-0 bg-slate-50/80 z-20 min-w-[200px]">
                    醫院
                  </th>
                  {productsWithPrices.map(product => (
                    <th 
                      key={product.code}
                      className="px-4 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center min-w-[100px]"
                    >
                      <div>{product.code}</div>
                      {productStats[product.code] && (
                        <div className="text-[10px] font-normal text-slate-400 mt-1">
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
                    <td className="px-5 py-4 sticky left-0 bg-white group-hover:bg-slate-50 transition-colors z-10">
                      <div>
                        <span className="font-medium text-slate-900">{hospital.name}</span>
                        <p className="text-xs text-slate-400">{hospital.region} · {hospital.level}</p>
                      </div>
                    </td>
                    {productsWithPrices.map(product => {
                      const price = getHospitalProductPrice(hospital, product.code);
                      const status = price ? getPriceStatus(price, product.code) : null;
                      
                      return (
                        <td key={product.code} className="px-4 py-4 text-center">
                          {price ? (
                            <span className={`font-semibold ${
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
      <div className="md:hidden flex-1 min-h-0 overflow-auto space-y-3 pb-4">
        {sortedPriceData.length > 0 ? (
          sortedPriceData.map((item, index) => {
            const status = getPriceStatus(item.price, item.productCode);
            const stats = productStats[item.productCode];
            const diffPercent = stats ? Math.round((item.price - stats.avg) / stats.avg * 100) : 0;

            return (
              <div
                key={`${item.hospitalId}-${item.productCode}-${index}`}
                onClick={() => goToHospital(item.hospitalId)}
                className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 active:scale-[0.98] transition-transform cursor-pointer"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-900 leading-tight truncate">{item.hospitalName}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">{item.region} · {item.level}</p>
                  </div>
                  <div className="text-right ml-3">
                    <span className={`text-xl font-bold ${
                      status === 'high' ? 'text-amber-600' :
                      status === 'low' ? 'text-emerald-600' :
                      'text-slate-900'
                    }`}>
                      {formatCurrency(item.price)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium">
                      {item.productCode}
                    </span>
                    <span className="text-xs text-slate-400 truncate max-w-[120px]">
                      {item.productName}
                    </span>
                  </div>
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
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-16 text-center text-slate-400">
            <div className="flex flex-col items-center justify-center">
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
          </div>
        )}
      </div>

      {/* Empty State for Desktop */}
      {sortedPriceData.length === 0 && (
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

      {/* Info Tooltip for Price Status */}
      <div className="fixed bottom-6 right-6 md:bottom-10 md:right-10">
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
