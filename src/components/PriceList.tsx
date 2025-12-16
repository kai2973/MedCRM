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
  AlertCircle,
  Download,
  FileSpreadsheet,
  FileText
} from 'lucide-react';
import { Hospital, Region, HospitalLevel, ProductType } from '../types';
import { PRODUCTS } from '../constants';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

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
  const [showExportMenu, setShowExportMenu] = useState(false);

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

  // 點擊外部關閉選單
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('[data-dropdown]')) {
        setShowExportMenu(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

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

  // ============== 匯出功能 ==============
  
  // 匯出 Excel
  const exportToExcel = () => {
    // 準備矩陣格式的資料
    const data = matrixData.map(hospital => {
      const row: Record<string, string | number> = {
        '醫院名稱': hospital.name,
        '區域': hospital.region,
        '等級': hospital.level
      };
      
      // 加入各產品價格
      productsWithPrices.forEach(product => {
        const price = getHospitalProductPrice(hospital, product.code);
        row[product.code] = price || '-';
      });
      
      return row;
    });

    // 加入統計列
    if (data.length > 0) {
      const avgRow: Record<string, string | number> = {
        '醫院名稱': '【平均價格】',
        '區域': '',
        '等級': ''
      };
      const minRow: Record<string, string | number> = {
        '醫院名稱': '【最低價格】',
        '區域': '',
        '等級': ''
      };
      const maxRow: Record<string, string | number> = {
        '醫院名稱': '【最高價格】',
        '區域': '',
        '等級': ''
      };

      productsWithPrices.forEach(product => {
        const stats = productStats[product.code];
        avgRow[product.code] = stats ? stats.avg : '-';
        minRow[product.code] = stats ? stats.min : '-';
        maxRow[product.code] = stats ? stats.max : '-';
      });

      data.push({ '醫院名稱': '', '區域': '', '等級': '' }); // 空行
      data.push(avgRow);
      data.push(minRow);
      data.push(maxRow);
    }

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '價格清單');
    
    // 設定欄寬
    const colWidths = [
      { wch: 20 }, // 醫院名稱
      { wch: 8 },  // 區域
      { wch: 10 }, // 等級
      ...productsWithPrices.map(() => ({ wch: 10 })) // 各產品
    ];
    ws['!cols'] = colWidths;

    const today = new Date().toISOString().split('T')[0];
    const fileName = `價格清單_${today}.xlsx`;
    XLSX.writeFile(wb, fileName);
    setShowExportMenu(false);
  };

  // 匯出 PDF
  const exportToPDF = () => {
    const doc = new jsPDF('landscape');
    
    // 標題
    doc.setFontSize(16);
    doc.text('耗材價格清單', 14, 20);
    doc.setFontSize(10);
    doc.text(`匯出日期：${new Date().toLocaleDateString('zh-TW')}`, 14, 28);
    doc.text(`共 ${matrixData.length} 家醫院`, 14, 34);
    
    // 準備表格資料
    const headers = ['醫院名稱', '區域', '等級', ...productsWithPrices.map(p => p.code)];
    
    const tableData = matrixData.map(hospital => {
      const row = [
        hospital.name,
        hospital.region,
        hospital.level
      ];
      
      productsWithPrices.forEach(product => {
        const price = getHospitalProductPrice(hospital, product.code);
        row.push(price ? `$${price}` : '-');
      });
      
      return row;
    });

    // 加入統計列
    if (tableData.length > 0) {
      const avgRow = ['【平均】', '', ''];
      const minRow = ['【最低】', '', ''];
      const maxRow = ['【最高】', '', ''];

      productsWithPrices.forEach(product => {
        const stats = productStats[product.code];
        avgRow.push(stats ? `$${stats.avg}` : '-');
        minRow.push(stats ? `$${stats.min}` : '-');
        maxRow.push(stats ? `$${stats.max}` : '-');
      });

      tableData.push(['', '', '', ...productsWithPrices.map(() => '')]); // 空行
      tableData.push(avgRow);
      tableData.push(minRow);
      tableData.push(maxRow);
    }

    doc.autoTable({
      head: [headers],
      body: tableData,
      startY: 40,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [59, 130, 246], textColor: 255 },
      columnStyles: {
        0: { cellWidth: 40 },
        1: { cellWidth: 18 },
        2: { cellWidth: 22 }
      }
    });

    const today = new Date().toISOString().split('T')[0];
    const fileName = `價格清單_${today}.pdf`;
    doc.save(fileName);
    setShowExportMenu(false);
  };

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
        
        <div className="flex items-center gap-2">
          {/* 匯出按鈕 */}
          <div className="relative" data-dropdown>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowExportMenu(!showExportMenu);
              }}
              className="flex items-center space-x-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium shadow-sm transition-all"
            >
              <Download size={16} />
              <span className="text-sm">匯出</span>
            </button>
            
            {showExportMenu && (
              <div className="absolute right-0 top-full mt-2 w-40 bg-white rounded-xl shadow-xl border border-slate-200 z-[9999] py-1">
                <button 
                  onClick={exportToExcel} 
                  className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 flex items-center space-x-2"
                >
                  <FileSpreadsheet size={16} className="text-green-600" />
                  <span>匯出 Excel</span>
                </button>
                <button 
                  onClick={exportToPDF} 
                  className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 flex items-center space-x-2"
                >
                  <FileText size={16} className="text-red-600" />
                  <span>匯出 PDF</span>
                </button>
              </div>
            )}
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
      </div>

      {/* Product Tabs - 清單模式 */}
      {viewMode === 'list' && (
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2 md:pb-0">
          {consumableProducts.map(product => (
            <button
              key={product.code}
              onClick={() => setSelectedProduct(product.code)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
                selectedProduct === product.code
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-blue-300'
              }`}
            >
              {product.code}
            </button>
          ))}
        </div>
      )}

      {/* Stats Cards - 清單模式 */}
      {viewMode === 'list' && currentStats && (
        <div className="grid grid-cols-3 gap-2 md:gap-4 mb-4">
          <div className="bg-white rounded-xl p-3 md:p-4 border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 text-slate-500 text-xs md:text-sm mb-1">
              <TrendingDown size={14} className="text-emerald-500" />
              <span>最低價</span>
            </div>
            <p className="text-lg md:text-2xl font-bold text-emerald-600">{formatCurrency(currentStats.min)}</p>
          </div>
          <div className="bg-white rounded-xl p-3 md:p-4 border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 text-slate-500 text-xs md:text-sm mb-1">
              <Minus size={14} className="text-blue-500" />
              <span>平均價</span>
            </div>
            <p className="text-lg md:text-2xl font-bold text-blue-600">{formatCurrency(currentStats.avg)}</p>
          </div>
          <div className="bg-white rounded-xl p-3 md:p-4 border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 text-slate-500 text-xs md:text-sm mb-1">
              <TrendingUp size={14} className="text-amber-500" />
              <span>最高價</span>
            </div>
            <p className="text-lg md:text-2xl font-bold text-amber-600">{formatCurrency(currentStats.max)}</p>
          </div>
        </div>
      )}

      {/* 缺少價格提示 */}
      {viewMode === 'list' && missingCount > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-4 flex items-center gap-2">
          <AlertCircle size={16} className="text-amber-600" />
          <span className="text-sm text-amber-700">
            尚有 <strong>{missingCount}</strong> 家醫院未設定 {selectedProduct} 價格
          </span>
        </div>
      )}

      {/* Search and Filter Bar */}
      <div className="bg-white p-3 md:p-4 rounded-xl shadow-sm border border-slate-200/60 mb-4">
        <div className="flex gap-2 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="搜尋醫院..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className={`shrink-0 p-2.5 rounded-xl border transition-colors ${
              isFilterOpen || hasFilters
                ? 'bg-blue-50 border-blue-200 text-blue-600'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Filter size={18} />
          </button>
        </div>

        {/* Filter Panel */}
        {isFilterOpen && (
          <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">區域</label>
              <select
                className="w-full text-sm border border-slate-200 rounded-xl p-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-slate-50"
                value={activeFilters.region}
                onChange={(e) => setActiveFilters({ ...activeFilters, region: e.target.value })}
              >
                <option value="All">所有區域</option>
                {Object.values(Region).map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">等級</label>
              <select
                className="w-full text-sm border border-slate-200 rounded-xl p-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-slate-50"
                value={activeFilters.level}
                onChange={(e) => setActiveFilters({ ...activeFilters, level: e.target.value })}
              >
                <option value="All">所有等級</option>
                {Object.values(HospitalLevel).map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div className="flex items-end col-span-2 md:col-span-1">
              <button
                onClick={resetFilters}
                className="text-sm font-medium text-slate-500 hover:text-blue-600 hover:bg-blue-50 px-4 py-2.5 rounded-lg transition-colors w-full"
              >
                重置篩選
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Desktop List View */}
      {viewMode === 'list' && (
        <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-slate-200/60 flex-1 min-h-0 overflow-hidden">
          <div className="overflow-x-auto h-full">
            <table className="w-full text-left">
              <thead className="bg-slate-50/80 border-b border-slate-200 sticky top-0 z-10">
                <tr>
                  <th 
                    className="px-5 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors"
                    onClick={() => handleSort('hospital')}
                  >
                    <div className="flex items-center">醫院名稱 {getSortIcon('hospital')}</div>
                  </th>
                  <th 
                    className="px-4 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors"
                    onClick={() => handleSort('region')}
                  >
                    <div className="flex items-center">區域 {getSortIcon('region')}</div>
                  </th>
                  <th 
                    className="px-4 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors"
                    onClick={() => handleSort('level')}
                  >
                    <div className="flex items-center">等級 {getSortIcon('level')}</div>
                  </th>
                  <th 
                    className="px-4 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors"
                    onClick={() => handleSort('price')}
                  >
                    <div className="flex items-center">價格 {getSortIcon('price')}</div>
                  </th>
                  <th className="px-4 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    相較平均
                  </th>
                  <th className="px-3 py-4"></th>
                </tr>
              </thead>
              <tbody>
                {sortedPriceData.map((item, index) => {
                  const status = getPriceStatus(item.price, item.productCode);
                  const stats = productStats[item.productCode];
                  const diffPercent = stats ? Math.round((item.price - stats.avg) / stats.avg * 100) : 0;
                  
                  return (
                    <tr 
                      key={`${item.hospitalId}-${item.productCode}-${index}`}
                      onClick={() => goToHospital(item.hospitalId)}
                      className="border-b border-slate-100 hover:bg-blue-50/50 cursor-pointer group transition-colors"
                    >
                      <td className="px-5 py-4">
                        <span className="font-medium text-slate-900">{item.hospitalName}</span>
                      </td>
                      <td className="px-4 py-4 text-slate-500">{item.region}</td>
                      <td className="px-4 py-4">
                        <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                          {item.level}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`font-bold ${
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
          <div className="overflow-auto h-full relative">
            <table className="w-full border-collapse min-w-max">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th 
                    className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-left cursor-pointer hover:bg-slate-100 transition-colors sticky top-0 left-0 z-30 bg-slate-50 border-r border-slate-200"
                    onClick={() => handleSort('hospital')}
                  >
                    <div className="flex items-center gap-1">醫院 {getSortIcon('hospital')}</div>
                  </th>
                  <th 
                    className="px-3 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-left cursor-pointer hover:bg-slate-100 transition-colors sticky top-0 bg-slate-50 z-20"
                    onClick={() => handleSort('region')}
                  >
                    <div className="flex items-center gap-1">區域 {getSortIcon('region')}</div>
                  </th>
                  <th 
                    className="px-3 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-left cursor-pointer hover:bg-slate-100 transition-colors sticky top-0 bg-slate-50 z-20 border-r border-slate-200"
                    onClick={() => handleSort('level')}
                  >
                    <div className="flex items-center gap-1">等級 {getSortIcon('level')}</div>
                  </th>
                  {productsWithPrices.map(product => (
                    <th 
                      key={product.code}
                      className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-center sticky top-0 bg-slate-50 z-20"
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
              <tbody>
                {matrixData.map(hospital => (
                  <tr 
                    key={hospital.id}
                    onClick={() => goToHospital(hospital.id)}
                    className="border-b border-slate-100 hover:bg-blue-50/50 cursor-pointer group transition-colors"
                  >
                    <td className="px-4 py-3 sticky left-0 bg-white group-hover:bg-blue-50/50 transition-colors z-10 border-r border-slate-100">
                      <span className="font-medium text-slate-900 text-sm whitespace-nowrap">{hospital.name}</span>
                    </td>
                    <td className="px-3 py-3 text-sm text-slate-500 whitespace-nowrap">{hospital.region}</td>
                    <td className="px-3 py-3 border-r border-slate-100">
                      <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-600 whitespace-nowrap">
                        {hospital.level}
                      </span>
                    </td>
                    {productsWithPrices.map(product => {
                      const price = getHospitalProductPrice(hospital, product.code);
                      const status = price ? getPriceStatus(price, product.code) : null;
                      
                      return (
                        <td key={product.code} className="px-4 py-3 text-center">
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
      <div className="md:hidden flex-1 min-h-0 overflow-auto space-y-3 pb-4">
        {sortedPriceData.length > 0 ? (
          sortedPriceData.map((item, index) => {
            const status = getPriceStatus(item.price, item.productCode);
            
            return (
              <div
                key={`${item.hospitalId}-${item.productCode}-${index}`}
                onClick={() => goToHospital(item.hospitalId)}
                className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 active:scale-[0.98] transition-transform cursor-pointer"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-900 truncate">{item.hospitalName}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">{item.region} · {item.level}</p>
                  </div>
                  <div className="text-right ml-3">
                    <span className={`text-lg font-bold ${
                      status === 'high' ? 'text-amber-600' :
                      status === 'low' ? 'text-emerald-600' :
                      'text-slate-900'
                    }`}>
                      {formatCurrency(item.price)}
                    </span>
                    <div className={`flex items-center justify-end text-xs font-medium ${
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
          <div className="absolute bottom-full right-0 mb-2 w-64 bg-slate-800 text-white text-xs rounded-xl p-4 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            <p className="font-semibold mb-2">價格狀態說明</p>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <TrendingUp size={14} className="text-amber-400" />
                <span>高於平均 10% 以上</span>
              </div>
              <div className="flex items-center gap-2">
                <Minus size={14} className="text-slate-400" />
                <span>接近平均價格</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingDown size={14} className="text-emerald-400" />
                <span>低於平均 10% 以上</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PriceList;
