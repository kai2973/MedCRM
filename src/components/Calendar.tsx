import React, { useState, useMemo } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Download,
  FileSpreadsheet,
  FileText,
  Filter,
  X,
  MapPin,
  Clock,
  User
} from 'lucide-react';
import { Note, Hospital } from '../types';
import { useAuth } from '../contexts/AuthContext';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// 擴展 jsPDF 類型
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

interface CalendarProps {
  notes: Note[];
  hospitals: Hospital[];
  allProfiles?: { id: string; full_name: string; email: string }[];
}

interface CalendarEvent {
  id: string;
  date: string;
  hospitalId: string;
  hospitalName: string;
  activityType: string;
  content: string;
  author: string;
  userId?: string;
  nextStep?: string;
  nextStepDate?: string;
}

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];
const ACTIVITY_COLORS: Record<string, string> = {
  '拜訪': 'bg-blue-100 text-blue-700 border-blue-200',
  '電話': 'bg-green-100 text-green-700 border-green-200',
  '會議': 'bg-purple-100 text-purple-700 border-purple-200',
  '展示': 'bg-amber-100 text-amber-700 border-amber-200',
  '其他': 'bg-slate-100 text-slate-700 border-slate-200',
};

const Calendar: React.FC<CalendarProps> = ({ notes, hospitals, allProfiles = [] }) => {
  const { profile } = useAuth();
  const isManagerOrAdmin = profile?.role_type === 'manager' || profile?.role_type === 'admin';

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string>('all');
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  // 取得醫院名稱的 helper
  const getHospitalName = (hospitalId: string): string => {
    const hospital = hospitals.find(h => h.id === hospitalId);
    return hospital?.name || '未知醫院';
  };

  // 轉換 notes 為 calendar events
  const events: CalendarEvent[] = useMemo(() => {
    return notes.map(note => ({
      id: note.id,
      date: note.date.split('T')[0], // 只取日期部分
      hospitalId: note.hospitalId,
      hospitalName: getHospitalName(note.hospitalId),
      activityType: note.activityType,
      content: note.content,
      author: note.author,
      userId: (note as any).userId,
      nextStep: note.nextStep,
      nextStepDate: note.nextStepDate
    }));
  }, [notes, hospitals]);

  // 根據權限和篩選過濾事件
  const filteredEvents = useMemo(() => {
    let filtered = events;
    
    // Manager/Admin 可以篩選特定使用者
    if (isManagerOrAdmin && selectedUserId !== 'all') {
      filtered = filtered.filter(e => e.userId === selectedUserId);
    }
    
    return filtered;
  }, [events, isManagerOrAdmin, selectedUserId]);

  // 取得當月的日曆資料
  const calendarData = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const endDate = new Date(lastDay);
    endDate.setDate(endDate.getDate() + (6 - lastDay.getDay()));
    
    const days: { date: Date; isCurrentMonth: boolean; events: CalendarEvent[] }[] = [];
    const current = new Date(startDate);
    
    while (current <= endDate) {
      const dateStr = current.toISOString().split('T')[0];
      const dayEvents = filteredEvents.filter(e => e.date === dateStr);
      
      days.push({
        date: new Date(current),
        isCurrentMonth: current.getMonth() === month,
        events: dayEvents
      });
      
      current.setDate(current.getDate() + 1);
    }
    
    return days;
  }, [currentDate, filteredEvents]);

  // 選中日期的事件
  const selectedDateEvents = useMemo(() => {
    if (!selectedDate) return [];
    return filteredEvents.filter(e => e.date === selectedDate);
  }, [selectedDate, filteredEvents]);

  // 上一個月
  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  // 下一個月
  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  // 回到今天
  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // 取得本週日期範圍
  const getWeekRange = () => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - dayOfWeek);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    return { start: startOfWeek, end: endOfWeek };
  };

  // 取得本月日期範圍
  const getMonthRange = () => {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    return { start: startOfMonth, end: endOfMonth };
  };

  // 篩選指定範圍的事件
  const getEventsInRange = (start: Date, end: Date) => {
    return filteredEvents.filter(e => {
      const eventDate = new Date(e.date);
      return eventDate >= start && eventDate <= end;
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  // 匯出為 Excel
  const exportToExcel = (range: 'week' | 'month') => {
    const { start, end } = range === 'week' ? getWeekRange() : getMonthRange();
    const eventsToExport = getEventsInRange(start, end);
    
    const data = eventsToExport.map(e => ({
      '日期': e.date,
      '醫院名稱': e.hospitalName,
      '活動類型': e.activityType,
      '內容': e.content,
      '下一步行動': e.nextStep || '',
      '下一步日期': e.nextStepDate || '',
      '記錄者': e.author
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '拜訪記錄');
    
    // 設定欄寬
    ws['!cols'] = [
      { wch: 12 },  // 日期
      { wch: 20 },  // 醫院名稱
      { wch: 10 },  // 活動類型
      { wch: 50 },  // 內容
      { wch: 30 },  // 下一步行動
      { wch: 12 },  // 下一步日期
      { wch: 12 }   // 記錄者
    ];

    const rangeText = range === 'week' ? '本週' : '本月';
    const fileName = `拜訪記錄_${rangeText}_${start.toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
    setShowExportMenu(false);
  };

  // 匯出為 PDF
  const exportToPDF = (range: 'week' | 'month') => {
    const { start, end } = range === 'week' ? getWeekRange() : getMonthRange();
    const eventsToExport = getEventsInRange(start, end);
    
    const doc = new jsPDF('landscape'); // 改為橫向以容納更多欄位
    
    // 標題
    const rangeText = range === 'week' ? '本週' : '本月';
    doc.setFontSize(16);
    doc.text(`拜訪記錄 - ${rangeText}`, 14, 20);
    doc.setFontSize(10);
    doc.text(`${start.toLocaleDateString('zh-TW')} ~ ${end.toLocaleDateString('zh-TW')}`, 14, 28);
    
    // 表格資料
    const tableData = eventsToExport.map(e => [
      e.date,
      e.hospitalName,
      e.activityType,
      e.content.substring(0, 40) + (e.content.length > 40 ? '...' : ''),
      e.nextStep ? (e.nextStep.substring(0, 20) + (e.nextStep.length > 20 ? '...' : '')) : '',
      e.nextStepDate || '',
      e.author
    ]);

    doc.autoTable({
      head: [['日期', '醫院', '類型', '內容', '下一步行動', '下一步日期', '記錄者']],
      body: tableData,
      startY: 35,
      styles: { 
        fontSize: 8,
        cellPadding: 2
      },
      headStyles: {
        fillColor: [59, 130, 246],
        textColor: 255
      },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 35 },
        2: { cellWidth: 18 },
        3: { cellWidth: 60 },
        4: { cellWidth: 45 },
        5: { cellWidth: 25 },
        6: { cellWidth: 20 }
      }
    });

    const fileName = `拜訪記錄_${rangeText}_${start.toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
    setShowExportMenu(false);
  };

  const formatDate = (date: Date) => {
    return `${date.getFullYear()} 年 ${date.getMonth() + 1} 月`;
  };

  return (
    <div className="p-6 lg:p-10 max-w-[1600px] mx-auto h-full flex flex-col">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 space-y-4 md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">行事曆</h1>
          <p className="text-slate-500 mt-2">查看拜訪記錄並匯出報告。</p>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Manager/Admin 篩選器 */}
          {isManagerOrAdmin && allProfiles.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setShowFilterMenu(!showFilterMenu)}
                className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl border font-medium transition-colors ${
                  selectedUserId !== 'all'
                    ? 'bg-blue-50 border-blue-200 text-blue-700'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Filter size={18} />
                <span className="hidden md:inline">
                  {selectedUserId === 'all' 
                    ? '所有人員' 
                    : allProfiles.find(p => p.id === selectedUserId)?.full_name || '篩選'}
                </span>
              </button>
              
              {showFilterMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-200 z-20 py-2">
                  <button
                    onClick={() => { setSelectedUserId('all'); setShowFilterMenu(false); }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 ${
                      selectedUserId === 'all' ? 'text-blue-600 font-medium' : 'text-slate-700'
                    }`}
                  >
                    所有人員
                  </button>
                  {allProfiles.map(p => (
                    <button
                      key={p.id}
                      onClick={() => { setSelectedUserId(p.id); setShowFilterMenu(false); }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 ${
                        selectedUserId === p.id ? 'text-blue-600 font-medium' : 'text-slate-700'
                      }`}
                    >
                      {p.full_name || p.email}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          
          {/* 匯出按鈕 */}
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="flex items-center space-x-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium shadow-lg shadow-blue-600/20 transition-all"
            >
              <Download size={18} />
              <span className="hidden md:inline">匯出</span>
            </button>
            
            {showExportMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-200 z-20 py-2">
                <div className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase">本週</div>
                <button
                  onClick={() => exportToExcel('week')}
                  className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center space-x-2"
                >
                  <FileSpreadsheet size={16} className="text-green-600" />
                  <span>Excel (.xlsx)</span>
                </button>
                <button
                  onClick={() => exportToPDF('week')}
                  className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center space-x-2"
                >
                  <FileText size={16} className="text-red-600" />
                  <span>PDF</span>
                </button>
                
                <div className="border-t border-slate-100 my-2"></div>
                
                <div className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase">本月</div>
                <button
                  onClick={() => exportToExcel('month')}
                  className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center space-x-2"
                >
                  <FileSpreadsheet size={16} className="text-green-600" />
                  <span>Excel (.xlsx)</span>
                </button>
                <button
                  onClick={() => exportToPDF('month')}
                  className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center space-x-2"
                >
                  <FileText size={16} className="text-red-600" />
                  <span>PDF</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
        {/* 日曆主體 */}
        <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 p-6 overflow-hidden flex flex-col">
          {/* 月份導航 */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <h2 className="text-xl font-bold text-slate-900">{formatDate(currentDate)}</h2>
              <button
                onClick={goToToday}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                今天
              </button>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={prevMonth}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <ChevronLeft size={20} className="text-slate-600" />
              </button>
              <button
                onClick={nextMonth}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <ChevronRight size={20} className="text-slate-600" />
              </button>
            </div>
          </div>

          {/* 星期標題 */}
          <div className="grid grid-cols-7 mb-2">
            {WEEKDAYS.map(day => (
              <div key={day} className="text-center text-sm font-semibold text-slate-500 py-2">
                {day}
              </div>
            ))}
          </div>

          {/* 日曆格子 */}
          <div className="grid grid-cols-7 flex-1 border-t border-l border-slate-200">
            {calendarData.map((day, index) => {
              const dateStr = day.date.toISOString().split('T')[0];
              const isToday = dateStr === new Date().toISOString().split('T')[0];
              const isSelected = dateStr === selectedDate;
              
              return (
                <div
                  key={index}
                  onClick={() => setSelectedDate(dateStr)}
                  className={`
                    border-r border-b border-slate-200 p-2 min-h-[80px] md:min-h-[100px] cursor-pointer transition-colors
                    ${day.isCurrentMonth ? 'bg-white' : 'bg-slate-50'}
                    ${isSelected ? 'ring-2 ring-blue-500 ring-inset' : ''}
                    hover:bg-blue-50/50
                  `}
                >
                  <div className={`
                    text-sm font-medium mb-1
                    ${isToday ? 'w-7 h-7 bg-blue-600 text-white rounded-full flex items-center justify-center' : ''}
                    ${!isToday && day.isCurrentMonth ? 'text-slate-900' : ''}
                    ${!isToday && !day.isCurrentMonth ? 'text-slate-400' : ''}
                  `}>
                    {day.date.getDate()}
                  </div>
                  
                  {/* 事件點點 */}
                  <div className="space-y-1">
                    {day.events.slice(0, 3).map((event, i) => (
                      <div
                        key={i}
                        className={`
                          text-xs px-1.5 py-0.5 rounded truncate border
                          ${ACTIVITY_COLORS[event.activityType] || ACTIVITY_COLORS['其他']}
                        `}
                        title={`${event.hospitalName} - ${event.activityType}`}
                      >
                        <span className="hidden md:inline">{event.hospitalName}</span>
                        <span className="md:hidden">{event.hospitalName.substring(0, 2)}</span>
                      </div>
                    ))}
                    {day.events.length > 3 && (
                      <div className="text-xs text-slate-500 pl-1">
                        +{day.events.length - 3} 更多
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 側邊詳情 */}
        <div className="lg:w-80 bg-white rounded-2xl shadow-sm border border-slate-200 p-6 overflow-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900">
              {selectedDate 
                ? new Date(selectedDate + 'T00:00:00').toLocaleDateString('zh-TW', { 
                    month: 'long', 
                    day: 'numeric',
                    weekday: 'long'
                  })
                : '選擇日期查看詳情'
              }
            </h3>
            {selectedDate && (
              <button
                onClick={() => setSelectedDate(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            )}
          </div>

          {selectedDate && selectedDateEvents.length === 0 && (
            <div className="text-center py-8 text-slate-400">
              <CalendarIcon size={32} className="mx-auto mb-2 opacity-50" />
              <p>這天沒有記錄</p>
            </div>
          )}

          <div className="space-y-4">
            {selectedDateEvents.map(event => (
              <div
                key={event.id}
                className="p-4 bg-slate-50 rounded-xl border border-slate-100"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <MapPin size={14} className="text-slate-400" />
                    <span className="font-semibold text-slate-900">{event.hospitalName}</span>
                  </div>
                  <span className={`
                    text-xs px-2 py-0.5 rounded-full border
                    ${ACTIVITY_COLORS[event.activityType] || ACTIVITY_COLORS['其他']}
                  `}>
                    {event.activityType}
                  </span>
                </div>
                
                <p className="text-sm text-slate-600 mb-3 line-clamp-3">
                  {event.content}
                </p>
                
                <div className="flex items-center text-xs text-slate-400 space-x-3">
                  <div className="flex items-center space-x-1">
                    <User size={12} />
                    <span>{event.author}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock size={12} />
                    <span>{event.date}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Calendar;
