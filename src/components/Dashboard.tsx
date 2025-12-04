
import React, { useMemo, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend, PieChart, Pie, Cell
} from 'recharts';
import { Users, ShoppingCart, TrendingUp, AlertCircle, Clock, Calendar, CheckCircle, ArrowUpRight, Activity, Filter, Info } from 'lucide-react';
import { Hospital, UsageRecord, Note, SalesStage } from '../types';

interface DashboardProps {
  hospitals: Hospital[];
  usageRecords: UsageRecord[];
  notes: Note[];
}

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#6366f1'];

const Dashboard: React.FC<DashboardProps> = ({ hospitals, usageRecords, notes }) => {
  const [timeRange, setTimeRange] = useState<'all' | '1y' | '90d'>('all');
  const [activeTooltip, setActiveTooltip] = useState<number | null>(null);

  // Close tooltip when clicking outside
  React.useEffect(() => {
    const handleClickOutside = () => setActiveTooltip(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Date Filtering Logic
  const filterByDate = (dateStr: string) => {
    if (timeRange === 'all') return true;
    const date = new Date(dateStr);

    const cutoff = new Date();
    if (timeRange === '90d') cutoff.setDate(cutoff.getDate() - 90);
    if (timeRange === '1y') cutoff.setFullYear(cutoff.getFullYear() - 1);

    return date >= cutoff;
  };

  // Memoized Filtered Data
  const filteredSales = useMemo(() =>
    usageRecords.filter(r => r.type !== '樣品' && filterByDate(r.date)),
    [usageRecords, timeRange]);

  const filteredNotes = useMemo(() =>
    notes.filter(n => filterByDate(n.date)),
    [notes, timeRange]);

  // 1. Sales Trends (Bar Chart)
  const usageData = useMemo(() => {
    const groupedByDate: Record<string, any> = {};
    filteredSales.forEach(record => {
      if (!groupedByDate[record.date]) {
        groupedByDate[record.date] = { name: record.date };
      }
      if (!groupedByDate[record.date][record.productCode]) {
        groupedByDate[record.date][record.productCode] = 0;
      }
      groupedByDate[record.date][record.productCode] += record.quantity;
    });
    return Object.values(groupedByDate).sort((a: any, b: any) =>
      new Date(a.name).getTime() - new Date(b.name).getTime()
    );
  }, [filteredSales]);

  // 2. Regional Performance (Bar Chart)
  const regionData = useMemo(() => {
    const regionMap: Record<string, number> = {};
    filteredSales.forEach(r => {
      const hospital = hospitals.find(h => h.id === r.hospitalId);
      if (hospital) {
        regionMap[hospital.region] = (regionMap[hospital.region] || 0) + r.quantity;
      }
    });
    return Object.keys(regionMap).map(region => ({
      name: region,
      sales: regionMap[region]
    })).sort((a, b) => b.sales - a.sales);
  }, [filteredSales, hospitals]);

  // 3. Pipeline Distribution (Pie/Donut)
  const pipelineData = useMemo(() => {
    const stageCounts: Record<string, number> = {};
    hospitals.forEach(h => {
      stageCounts[h.stage] = (stageCounts[h.stage] || 0) + 1;
    });

    // Ensure order
    const order = [SalesStage.LEAD, SalesStage.QUALIFICATION, SalesStage.TRIAL, SalesStage.NEGOTIATION, SalesStage.CLOSED_WON];
    return order.map(stage => ({
      name: stage,
      value: stageCounts[stage] || 0
    })).filter(d => d.value > 0);
  }, [hospitals]);

  // 4. Product Mix (Pie)
  const productMixData = useMemo(() => {
    const productCounts: Record<string, number> = {};
    filteredSales.forEach(r => {
      productCounts[r.productCode] = (productCounts[r.productCode] || 0) + r.quantity;
    });
    return Object.entries(productCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredSales]);

  // 5. KPI Stats
  const activeTrials = hospitals.filter(h => h.stage === SalesStage.TRIAL).length;
  const inNegotiation = hospitals.filter(h => h.stage === SalesStage.NEGOTIATION).length;
  const openOpportunities = hospitals.filter(h =>
    [SalesStage.LEAD, SalesStage.QUALIFICATION, SalesStage.TRIAL, SalesStage.NEGOTIATION].includes(h.stage)
  ).length;

  const stats = [
    { label: '醫院總數', value: hospitals.length, icon: Users, color: 'text-blue-600', bg: 'bg-blue-100', trend: '+2%' },
    { label: '耗材銷售量', value: filteredSales.reduce((acc, r) => acc + r.quantity, 0), icon: ShoppingCart, color: 'text-indigo-600', bg: 'bg-indigo-100', trend: '+15%' },
    {
      label: '未結案機會',
      value: openOpportunities,
      icon: ArrowUpRight,
      color: 'text-emerald-600',
      bg: 'bg-emerald-100',
      trend: 'Active',
      info: '包含潛在客戶、資格審查、試用及協商階段'
    },
  ];

  // 6. Actionable Lists
  const attentionNeeded = hospitals.filter(h => {
    // Logic: No visit recorded in "Last Visit" > 60 days
    // If "Never", it's high priority.
    if (h.lastVisit === 'Never') return true;
    const lastVisitDate = new Date(h.lastVisit);
    const diffTime = Math.abs(new Date().getTime() - lastVisitDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 60;
  });

  return (
    <div className="p-6 lg:p-10 space-y-8 max-w-[1600px] mx-auto">

      {/* Top Header & Filter */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">區域總覽</h1>
          <p className="text-slate-500 mt-2 text-sm lg:text-base max-w-2xl">
            歡迎回來，以下是您負責區域的最新動態。目前有 <span className="font-semibold text-blue-600">{attentionNeeded.length} 家客戶</span> 需要關注。
          </p>
        </div>

        <div className="flex bg-white rounded-xl p-1.5 border border-slate-200 shadow-sm">
          {(['all', '1y', '90d'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-5 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${timeRange === range
                ? 'bg-slate-900 text-white shadow-md transform scale-[1.02]'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                }`}
            >
              {range === 'all' ? '所有時間' : range === '1y' ? '今年' : '過去 90 天'}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          const isTooltipOpen = activeTooltip === idx;

          return (
            <div key={idx} className="bg-white rounded-2xl p-6 border border-slate-200/60 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group">
              <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-2xl ${stat.bg} ${stat.color} bg-opacity-50 group-hover:bg-opacity-100 transition-all`}>
                  <Icon className="w-6 h-6" />
                </div>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${stat.trend.includes('+') ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                  {stat.trend}
                </span>
              </div>
              <div>
                <div className="flex items-center gap-1 mb-1 relative">
                  <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                  {/* @ts-ignore - info property exists in our new stats object */}
                  {stat.info && (
                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveTooltip(isTooltipOpen ? null : idx);
                        }}
                        className="text-slate-400 hover:text-blue-500 transition-colors p-0.5 rounded-full hover:bg-blue-50 focus:outline-none"
                      >
                        <Info size={14} />
                      </button>

                      {isTooltipOpen && (
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-slate-800 text-white text-xs rounded-lg shadow-xl whitespace-nowrap z-50 animate-fade-in">
                          {stat.info}
                          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-800"></div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <p className="text-3xl font-bold text-slate-900 tracking-tight">{stat.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sales Trend (2/3 width) */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6 lg:p-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                <TrendingUp size={20} />
              </div>
              <h2 className="text-lg font-bold text-slate-900">銷售績效</h2>
            </div>
          </div>
          <div className="h-80 w-full">
            {usageData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={usageData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                  <Tooltip
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }}
                  />
                  <Legend iconType="circle" />
                  <Bar dataKey="AA001" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={24} />
                  <Bar dataKey="AA031" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                <AlertCircle size={32} className="mb-2 opacity-50" />
                <p className="text-sm">無所選期間的銷售數據</p>
              </div>
            )}
          </div>
        </div>

        {/* Pipeline Funnel (1/3 width) */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6 lg:p-8">
          <h2 className="text-lg font-bold text-slate-900 mb-6">銷售漏斗</h2>
          <div className="h-80 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pipelineData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  cornerRadius={6}
                >
                  {pipelineData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '8px 12px' }} />
                <Legend verticalAlign="bottom" height={36} iconType="circle" iconSize={8} formatter={(value) => <span className="text-slate-600 text-sm ml-1">{value}</span>} />
              </PieChart>
            </ResponsiveContainer>
            {/* Center Text */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-[60%] text-center pointer-events-none">
              <p className="text-3xl font-bold text-slate-900">{hospitals.length}</p>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">總數</p>
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Charts & Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Regional Performance */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6 lg:p-8">
          <h2 className="text-lg font-bold text-slate-900 mb-6">區域銷售表現</h2>
          <div className="h-64">
            {regionData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={regionData} layout="vertical" margin={{ left: 10, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 13, fill: '#475569', fontWeight: 500 }} axisLine={false} tickLine={false} />
                  <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                  <Bar dataKey="sales" fill="#3b82f6" radius={[0, 6, 6, 0]} barSize={28} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm bg-slate-50 rounded-xl">尚無區域數據</div>
            )}
          </div>
        </div>

        {/* Product Mix */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6 lg:p-8">
          <h2 className="text-lg font-bold text-slate-900 mb-6">產品組合</h2>
          <div className="flex items-center justify-center h-64">
            <div className="w-full h-full flex gap-8">
              <div className="flex-1">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={productMixData}
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      innerRadius={50}
                      dataKey="value"
                      cornerRadius={4}
                    >
                      {productMixData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="white" strokeWidth={2} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 flex flex-col justify-center space-y-4">
                {productMixData.slice(0, 4).map((item, idx) => (
                  <div key={item.name} className="flex justify-between items-center text-sm group">
                    <div className="flex items-center">
                      <span className="w-3 h-3 rounded-full mr-3 ring-2 ring-white shadow-sm" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                      <span className="text-slate-600 font-medium group-hover:text-slate-900 transition-colors">{item.name}</span>
                    </div>
                    <span className="font-bold text-slate-900">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section: Activity & Action Items */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Recent Activity Feed */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200/60 flex flex-col h-full">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Clock size={20} className="text-slate-400" />
              <h2 className="text-lg font-bold text-slate-900">最新活動</h2>
            </div>
            <span className="text-xs font-bold text-blue-700 bg-blue-50 border border-blue-100 px-3 py-1 rounded-full">
              {filteredNotes.length} 則新訊息
            </span>
          </div>
          <div className="flex-1 p-6 overflow-y-auto max-h-[500px] custom-scrollbar">
            <div className="space-y-6">
              {filteredNotes.length > 0 ? (
                filteredNotes.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5).map((note, index) => {
                  const hospital = hospitals.find(h => h.id === note.hospitalId);
                  return (
                    <div key={note.id} className="flex gap-4 group">
                      <div className="flex flex-col items-center">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-sm border border-white ring-4 ring-slate-50 transition-all group-hover:scale-110 ${note.activityType === '會議' ? 'bg-purple-100 text-purple-600' :
                          note.activityType === '通話' ? 'bg-emerald-100 text-emerald-600' :
                            'bg-blue-100 text-blue-600'
                          }`}>
                          {note.activityType === '會議' ? <Users size={16} /> :
                            note.activityType === '通話' ? <Activity size={16} /> :
                              <Calendar size={16} />}
                        </div>
                        {index !== filteredNotes.length - 1 && <div className="w-0.5 h-full bg-slate-100 mt-2"></div>}
                      </div>
                      <div className="flex-1 pb-6 border-b border-slate-50 last:border-0 last:pb-0">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-sm font-bold text-slate-900">{hospital?.name || '未知醫院'}</p>
                            <p className="text-xs text-slate-500 font-medium uppercase tracking-wide mt-0.5">{note.activityType}</p>
                          </div>
                          <span className="text-xs text-slate-400 bg-slate-50 px-2 py-1 rounded-md font-medium border border-slate-100">
                            {new Date(note.date).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="bg-slate-50 rounded-xl p-3 mt-3 text-sm text-slate-600 leading-relaxed border border-slate-100 group-hover:border-slate-200 transition-colors">
                          {note.content}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-12 text-slate-400">尚無近期活動。</div>
              )}
            </div>
          </div>
        </div>

        {/* Action Items / Attention Needed */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 flex flex-col h-full">
          <div className="p-6 border-b border-slate-100 bg-amber-50/30 rounded-t-2xl">
            <h2 className="text-lg font-bold text-slate-900 flex items-center">
              <AlertCircle size={20} className="text-amber-500 mr-2" />
              需關注項目
            </h2>
          </div>
          <div className="p-6 flex-1 overflow-y-auto max-h-[500px] custom-scrollbar">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">久未拜訪 (60+ 天)</p>
            <div className="space-y-3">
              {attentionNeeded.length > 0 ? (
                attentionNeeded.map(h => (
                  <div key={h.id} className="flex items-center justify-between p-3.5 bg-white rounded-xl border border-slate-100 shadow-sm hover:border-amber-200 hover:shadow-md transition-all group cursor-pointer">
                    <div className="flex items-center space-x-3 overflow-hidden">
                      <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xs shadow-inner flex-shrink-0">
                        {h.name.substring(0, 2)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-900 truncate group-hover:text-blue-600 transition-colors">{h.name}</p>
                        <p className="text-xs text-slate-500">上次拜訪: <span className="text-amber-600 font-medium">{h.lastVisit}</span></p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center bg-emerald-50/50 rounded-xl border border-dashed border-emerald-100">
                  <CheckCircle size={32} className="text-emerald-500 mb-3" />
                  <p className="text-sm text-slate-800 font-medium">一切正常！</p>
                  <p className="text-xs text-slate-500 mt-1">目前沒有需要緊急關注的醫院。</p>
                </div>
              )}
            </div>

            {inNegotiation > 0 && (
              <div className="mt-8 pt-6 border-t border-slate-100">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">進行中案件</p>
                <div className="space-y-2">
                  {hospitals.filter(h => h.stage === SalesStage.NEGOTIATION).map(h => (
                    <div key={h.id} className="flex justify-between items-center text-sm p-2 hover:bg-slate-50 rounded-lg transition-colors">
                      <span className="text-slate-700 font-medium truncate">{h.name}</span>
                      <span className="text-xs bg-purple-100 text-purple-700 border border-purple-200 px-2 py-0.5 rounded-full font-semibold">協商中</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
