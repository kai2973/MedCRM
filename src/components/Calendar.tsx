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
  User,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Building2,
  TrendingUp,
  Smile,
  Meh,
  Frown,
  AlertTriangle,
  Target,
  LayoutGrid,
  Rows3,
  Square,
  PanelRightClose,
  PanelRight
} from 'lucide-react';
import { Note, Hospital } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

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
  sentiment?: 'positive' | 'neutral' | 'negative';
}

interface TodoItem {
  id: string;
  hospitalId: string;
  hospitalName: string;
  nextStep: string;
  nextStepDate: string;
  activityDate: string;
  isOverdue: boolean;
  isDueSoon: boolean;
  daysUntilDue: number;
}

type ViewMode = 'month' | 'week' | 'day';

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];

const ACTIVITY_COLORS: Record<string, string> = {
  '拜訪': 'bg-blue-100 text-blue-700 border-blue-200',
  '電話': 'bg-green-100 text-green-700 border-green-200',
  'Email': 'bg-cyan-100 text-cyan-700 border-cyan-200',
  '會議': 'bg-purple-100 text-purple-700 border-purple-200',
  '展示': 'bg-amber-100 text-amber-700 border-amber-200',
  '教育訓練': 'bg-pink-100 text-pink-700 border-pink-200',
  '其他': 'bg-slate-100 text-slate-700 border-slate-200',
};

const SENTIMENT_COLORS: Record<string, string> = {
  'positive': 'ring-2 ring-emerald-400 ring-offset-1',
  'negative': 'ring-2 ring-red-400 ring-offset-1',
  'neutral': '',
};

const getHeatmapColor = (count: number, max: number): string => {
  if (count === 0) return '';
  const intensity = Math.min(count / Math.max(max, 1), 1);
  if (intensity <= 0.25) return 'bg-blue-50';
  if (intensity <= 0.5) return 'bg-blue-100';
  if (intensity <= 0.75) return 'bg-blue-200';
  return 'bg-blue-300';
};

const Calendar: React.FC<CalendarProps> = ({ notes, hospitals, allProfiles = [] }) => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const isManagerOrAdmin = profile?.role_type === 'manager' || profile?.role_type === 'admin';

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(new Date().toISOString().split('T')[0]);
  const [selectedUserId, setSelectedUserId] = useState<string>('all');
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [showSidePanel, setShowSidePanel] = useState(true);
  const [unvisitedDaysThreshold, setUnvisitedDaysThreshold] = useState(30);
  // 手機版：點擊日期時顯示的 Modal
  const [showMobileDayModal, setShowMobileDayModal] = useState(false);

  const getHospitalName = (hospitalId: string): string => {
    const hospital = hospitals.find(h => h.id === hospitalId);
    return hospital?.name || '未知醫院';
  };

  const events: CalendarEvent[] = useMemo(() => {
    return notes.map(note => ({
      id: note.id,
      date: note.date.split('T')[0],
      hospitalId: note.hospitalId,
      hospitalName: getHospitalName(note.hospitalId),
      activityType: note.activityType,
      content: note.content,
      author: note.author,
      userId: (note as any).userId,
      nextStep: note.nextStep,
      nextStepDate: note.nextStepDate,
      sentiment: note.sentiment
    }));
  }, [notes, hospitals]);

  const filteredEvents = useMemo(() => {
    let filtered = events;
    if (isManagerOrAdmin && selectedUserId !== 'all') {
      filtered = filtered.filter(e => e.userId === selectedUserId);
    }
    return filtered;
  }, [events, isManagerOrAdmin, selectedUserId]);

  const monthlyStats = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const monthEvents = filteredEvents.filter(e => {
      const eventDate = new Date(e.date);
      return eventDate.getFullYear() === year && eventDate.getMonth() === month;
    });

    const uniqueHospitals = new Set(monthEvents.map(e => e.hospitalId));
    const sentimentBreakdown = { positive: 0, neutral: 0, negative: 0 };
    
    monthEvents.forEach(e => {
      if (e.sentiment) {
        sentimentBreakdown[e.sentiment]++;
      } else {
        sentimentBreakdown.neutral++;
      }
    });

    return {
      totalActivities: monthEvents.length,
      uniqueHospitals: uniqueHospitals.size,
      sentimentBreakdown
    };
  }, [currentDate, filteredEvents]);

  const todoItems: TodoItem[] = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const items: TodoItem[] = [];
    
    filteredEvents.forEach(event => {
      if (event.nextStep && event.nextStepDate) {
        const dueDate = new Date(event.nextStepDate);
        dueDate.setHours(0, 0, 0, 0);
        const diffTime = dueDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        items.push({
          id: event.id,
          hospitalId: event.hospitalId,
          hospitalName: event.hospitalName,
          nextStep: event.nextStep,
          nextStepDate: event.nextStepDate,
          activityDate: event.date,
          isOverdue: diffDays < 0,
          isDueSoon: diffDays >= 0 && diffDays <= 3,
          daysUntilDue: diffDays
        });
      }
    });

    return items.sort((a, b) => {
      if (a.isOverdue && !b.isOverdue) return -1;
      if (!a.isOverdue && b.isOverdue) return 1;
      return a.daysUntilDue - b.daysUntilDue;
    });
  }, [filteredEvents]);

  const unvisitedHospitals = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const hospitalLastVisit: Record<string, Date> = {};
    
    filteredEvents.forEach(event => {
      const eventDate = new Date(event.date);
      if (!hospitalLastVisit[event.hospitalId] || eventDate > hospitalLastVisit[event.hospitalId]) {
        hospitalLastVisit[event.hospitalId] = eventDate;
      }
    });

    const unvisited: { hospital: Hospital; daysSinceVisit: number; lastVisitDate: string | null }[] = [];
    
    hospitals.forEach(hospital => {
      const lastVisit = hospitalLastVisit[hospital.id];
      if (lastVisit) {
        const diffTime = today.getTime() - lastVisit.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays >= unvisitedDaysThreshold) {
          unvisited.push({
            hospital,
            daysSinceVisit: diffDays,
            lastVisitDate: lastVisit.toISOString().split('T')[0]
          });
        }
      } else {
        unvisited.push({
          hospital,
          daysSinceVisit: Infinity,
          lastVisitDate: null
        });
      }
    });

    return unvisited.sort((a, b) => b.daysSinceVisit - a.daysSinceVisit);
  }, [hospitals, filteredEvents, unvisitedDaysThreshold]);

  const monthCalendarData = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const endDate = new Date(lastDay);
    endDate.setDate(endDate.getDate() + (6 - lastDay.getDay()));
    
    const days: { date: Date; isCurrentMonth: boolean; events: CalendarEvent[]; todos: TodoItem[] }[] = [];
    const current = new Date(startDate);
    let maxEvents = 0;
    
    while (current <= endDate) {
      const dateStr = current.toISOString().split('T')[0];
      const dayEvents = filteredEvents.filter(e => e.date === dateStr);
      const dayTodos = todoItems.filter(t => t.nextStepDate === dateStr);
      
      if (dayEvents.length > maxEvents) maxEvents = dayEvents.length;
      
      days.push({
        date: new Date(current),
        isCurrentMonth: current.getMonth() === month,
        events: dayEvents,
        todos: dayTodos
      });
      
      current.setDate(current.getDate() + 1);
    }
    
    return { days, maxEvents };
  }, [currentDate, filteredEvents, todoItems]);

  const weekCalendarData = useMemo(() => {
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
    
    const days: { date: Date; events: CalendarEvent[]; todos: TodoItem[] }[] = [];
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      
      days.push({
        date,
        events: filteredEvents.filter(e => e.date === dateStr),
        todos: todoItems.filter(t => t.nextStepDate === dateStr)
      });
    }
    
    return days;
  }, [currentDate, filteredEvents, todoItems]);

  const dayEvents = useMemo(() => {
    const dateStr = currentDate.toISOString().split('T')[0];
    return filteredEvents.filter(e => e.date === dateStr);
  }, [currentDate, filteredEvents]);

  const dayTodos = useMemo(() => {
    const dateStr = currentDate.toISOString().split('T')[0];
    return todoItems.filter(t => t.nextStepDate === dateStr);
  }, [currentDate, todoItems]);

  const selectedDateEvents = useMemo(() => {
    if (!selectedDate) return [];
    return filteredEvents.filter(e => e.date === selectedDate);
  }, [selectedDate, filteredEvents]);

  const selectedDateTodos = useMemo(() => {
    if (!selectedDate) return [];
    return todoItems.filter(t => t.nextStepDate === selectedDate);
  }, [selectedDate, todoItems]);

  const navigate_prev = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setDate(newDate.getDate() - 1);
    }
    setCurrentDate(newDate);
  };

  const navigate_next = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() + 1);
    } else if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + 7);
    } else {
      newDate.setDate(newDate.getDate() + 1);
    }
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(new Date().toISOString().split('T')[0]);
  };

  const getWeekRange = () => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - dayOfWeek);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    return { start: startOfWeek, end: endOfWeek };
  };

  const getMonthRange = () => {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    return { start: startOfMonth, end: endOfMonth };
  };

  const getEventsInRange = (start: Date, end: Date) => {
    return filteredEvents.filter(e => {
      const eventDate = new Date(e.date);
      return eventDate >= start && eventDate <= end;
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  const exportToExcel = (range: 'week' | 'month') => {
    const { start, end } = range === 'week' ? getWeekRange() : getMonthRange();
    const eventsToExport = getEventsInRange(start, end);
    
    const data = eventsToExport.map(e => ({
      '日期': e.date,
      '醫院名稱': e.hospitalName,
      '活動類型': e.activityType,
      '內容': e.content,
      '情緒': e.sentiment === 'positive' ? '正向' : e.sentiment === 'negative' ? '負向' : '中立',
      '下一步行動': e.nextStep || '',
      '下一步日期': e.nextStepDate || '',
      '記錄者': e.author
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '拜訪記錄');
    
    ws['!cols'] = [
      { wch: 12 }, { wch: 20 }, { wch: 10 }, { wch: 50 },
      { wch: 8 }, { wch: 30 }, { wch: 12 }, { wch: 12 }
    ];

    const rangeText = range === 'week' ? '本週' : '本月';
    const fileName = `拜訪記錄_${rangeText}_${start.toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
    setShowExportMenu(false);
  };

  const exportToPDF = (range: 'week' | 'month') => {
    const { start, end } = range === 'week' ? getWeekRange() : getMonthRange();
    const eventsToExport = getEventsInRange(start, end);
    
    const doc = new jsPDF('landscape');
    const rangeText = range === 'week' ? '本週' : '本月';
    doc.setFontSize(16);
    doc.text(`拜訪記錄 - ${rangeText}`, 14, 20);
    doc.setFontSize(10);
    doc.text(`${start.toLocaleDateString('zh-TW')} ~ ${end.toLocaleDateString('zh-TW')}`, 14, 28);
    
    const tableData = eventsToExport.map(e => [
      e.date,
      e.hospitalName,
      e.activityType,
      e.content.substring(0, 40) + (e.content.length > 40 ? '...' : ''),
      e.sentiment === 'positive' ? '😊' : e.sentiment === 'negative' ? '😟' : '😐',
      e.nextStep ? (e.nextStep.substring(0, 20) + (e.nextStep.length > 20 ? '...' : '')) : '',
      e.nextStepDate || '',
      e.author
    ]);

    doc.autoTable({
      head: [['日期', '醫院', '類型', '內容', '情緒', '下一步', '截止日', '記錄者']],
      body: tableData,
      startY: 35,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [59, 130, 246], textColor: 255 },
      columnStyles: {
        0: { cellWidth: 22 }, 1: { cellWidth: 32 }, 2: { cellWidth: 18 },
        3: { cellWidth: 55 }, 4: { cellWidth: 12 }, 5: { cellWidth: 40 },
        6: { cellWidth: 22 }, 7: { cellWidth: 18 }
      }
    });

    const fileName = `拜訪記錄_${rangeText}_${start.toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
    setShowExportMenu(false);
  };

  const formatDateHeader = () => {
    if (viewMode === 'month') {
      return `${currentDate.getFullYear()} 年 ${currentDate.getMonth() + 1} 月`;
    } else if (viewMode === 'week') {
      const startOfWeek = new Date(currentDate);
      startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      return `${startOfWeek.getMonth() + 1}/${startOfWeek.getDate()} - ${endOfWeek.getMonth() + 1}/${endOfWeek.getDate()}`;
    } else {
      return currentDate.toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });
    }
  };

  const navigateToHospital = (hospitalId: string) => {
    navigate(`/hospitals/${hospitalId}`);
  };

  const renderSentimentIcon = (sentiment: string | undefined, size = 14) => {
    switch (sentiment) {
      case 'positive': return <Smile size={size} className="text-emerald-500" />;
      case 'negative': return <Frown size={size} className="text-red-500" />;
      default: return <Meh size={size} className="text-slate-400" />;
    }
  };

  // 手機版點擊日期
  const handleMobileDateClick = (dateStr: string) => {
    setSelectedDate(dateStr);
    // 在手機上顯示 modal
    if (window.innerWidth < 1024) {
      setShowMobileDayModal(true);
    }
  };

  const renderMonthView = () => (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="grid grid-cols-7 border-b border-slate-200">
        {WEEKDAYS.map(day => (
          <div key={day} className="text-center text-xs lg:text-sm font-semibold text-slate-500 py-2 lg:py-3">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 flex-1 auto-rows-fr">
        {monthCalendarData.days.map((day, index) => {
          const dateStr = day.date.toISOString().split('T')[0];
          const isToday = dateStr === new Date().toISOString().split('T')[0];
          const isSelected = dateStr === selectedDate;
          const heatmapColor = getHeatmapColor(day.events.length, monthCalendarData.maxEvents);
          const hasOverdueTodo = day.todos.some(t => t.isOverdue);
          const hasDueSoonTodo = day.todos.some(t => t.isDueSoon);
          
          return (
            <div
              key={index}
              onClick={() => handleMobileDateClick(dateStr)}
              className={`
                border-r border-b border-slate-200 p-1 lg:p-2 cursor-pointer transition-all relative overflow-hidden
                ${day.isCurrentMonth ? heatmapColor || 'bg-white' : 'bg-slate-50/50'}
                ${isSelected ? 'ring-2 ring-blue-500 ring-inset' : ''}
                hover:bg-blue-50/50
              `}
            >
              {(hasOverdueTodo || hasDueSoonTodo) && (
                <div className={`absolute top-0.5 right-0.5 lg:top-1 lg:right-1 w-1.5 h-1.5 lg:w-2 lg:h-2 rounded-full ${hasOverdueTodo ? 'bg-red-500' : 'bg-amber-500'}`} />
              )}
              
              <div className={`
                text-xs lg:text-sm font-medium mb-0.5 lg:mb-1
                ${isToday ? 'w-5 h-5 lg:w-7 lg:h-7 bg-blue-600 text-white rounded-full flex items-center justify-center text-[10px] lg:text-sm' : ''}
                ${!isToday && day.isCurrentMonth ? 'text-slate-900' : ''}
                ${!isToday && !day.isCurrentMonth ? 'text-slate-400' : ''}
              `}>
                {day.date.getDate()}
              </div>
              
              {/* 手機版只顯示活動數量 */}
              <div className="lg:hidden">
                {day.events.length > 0 && (
                  <div className="text-[10px] text-blue-600 font-medium">{day.events.length}項</div>
                )}
              </div>
              
              {/* 桌面版顯示活動詳情 */}
              <div className="hidden lg:block space-y-0.5">
                {day.events.slice(0, 3).map((event, i) => (
                  <div
                    key={i}
                    className={`
                      text-xs px-1.5 py-0.5 rounded truncate border
                      ${ACTIVITY_COLORS[event.activityType] || ACTIVITY_COLORS['其他']}
                      ${SENTIMENT_COLORS[event.sentiment || 'neutral']}
                    `}
                    title={`${event.hospitalName} - ${event.activityType}`}
                  >
                    {event.hospitalName}
                  </div>
                ))}
                {day.events.length > 3 && (
                  <div className="text-xs text-slate-500 pl-1">+{day.events.length - 3}</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderWeekView = () => (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="grid grid-cols-7 border-b border-slate-200">
        {weekCalendarData.map((day, i) => {
          const dateStr = day.date.toISOString().split('T')[0];
          const isToday = dateStr === new Date().toISOString().split('T')[0];
          const isSelected = dateStr === selectedDate;
          
          return (
            <div
              key={i}
              onClick={() => handleMobileDateClick(dateStr)}
              className={`text-center py-2 lg:py-3 cursor-pointer transition-colors ${isSelected ? 'bg-blue-50' : 'hover:bg-slate-50'}`}
            >
              <div className="text-xs lg:text-sm text-slate-500">{WEEKDAYS[i]}</div>
              <div className={`
                text-sm lg:text-lg font-bold mt-0.5 lg:mt-1 mx-auto
                ${isToday ? 'w-6 h-6 lg:w-8 lg:h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs lg:text-base' : 'text-slate-900'}
              `}>
                {day.date.getDate()}
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-7 flex-1 divide-x divide-slate-200 overflow-hidden">
        {weekCalendarData.map((day, i) => {
          const dateStr = day.date.toISOString().split('T')[0];
          const isSelected = dateStr === selectedDate;
          const hasOverdueTodo = day.todos.some(t => t.isOverdue);
          const hasDueSoonTodo = day.todos.some(t => t.isDueSoon);
          
          return (
            <div
              key={i}
              onClick={() => handleMobileDateClick(dateStr)}
              className={`p-1 lg:p-2 overflow-auto cursor-pointer relative ${isSelected ? 'bg-blue-50/50' : 'hover:bg-slate-50/50'}`}
            >
              {(hasOverdueTodo || hasDueSoonTodo) && (
                <div className={`absolute top-1 right-1 w-1.5 h-1.5 lg:w-2 lg:h-2 rounded-full ${hasOverdueTodo ? 'bg-red-500' : 'bg-amber-500'}`} />
              )}
              
              {/* 手機版只顯示數量 */}
              <div className="lg:hidden text-center py-2">
                {day.events.length > 0 ? (
                  <span className="text-xs text-blue-600 font-medium">{day.events.length}</span>
                ) : (
                  <span className="text-xs text-slate-300">-</span>
                )}
              </div>
              
              {/* 桌面版顯示詳情 */}
              <div className="hidden lg:block space-y-2">
                {day.events.map((event, j) => (
                  <div
                    key={j}
                    onClick={(e) => { e.stopPropagation(); navigateToHospital(event.hospitalId); }}
                    className={`p-2 rounded-lg border text-xs cursor-pointer hover:shadow-sm transition-shadow ${ACTIVITY_COLORS[event.activityType] || ACTIVITY_COLORS['其他']}`}
                  >
                    <div className="font-medium truncate flex items-center gap-1">
                      {renderSentimentIcon(event.sentiment, 12)}
                      {event.hospitalName}
                    </div>
                    <div className="text-[10px] opacity-75 mt-0.5">{event.activityType}</div>
                  </div>
                ))}
                {day.events.length === 0 && (
                  <div className="text-xs text-slate-400 text-center py-4">無活動</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderDayView = () => (
    <div className="flex-1 overflow-auto p-4">
      {dayTodos.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-slate-500 uppercase mb-3">待辦事項</h3>
          <div className="space-y-2">
            {dayTodos.map(todo => (
              <div
                key={todo.id}
                onClick={() => navigateToHospital(todo.hospitalId)}
                className={`p-4 rounded-xl border cursor-pointer transition-colors ${
                  todo.isOverdue ? 'bg-red-50 border-red-200 hover:bg-red-100' : 'bg-amber-50 border-amber-200 hover:bg-amber-100'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  {todo.isOverdue ? <AlertCircle size={16} className="text-red-500" /> : <Clock size={16} className="text-amber-500" />}
                  <span className="font-semibold text-slate-900">{todo.hospitalName}</span>
                  <span className={`text-xs ml-auto ${todo.isOverdue ? 'text-red-600' : 'text-amber-600'}`}>
                    {todo.isOverdue ? `過期 ${Math.abs(todo.daysUntilDue)} 天` : '今天到期'}
                  </span>
                </div>
                <p className="text-sm text-slate-600 flex items-center gap-1 ml-6">
                  <ArrowRight size={12} />
                  {todo.nextStep}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h3 className="text-sm font-semibold text-slate-500 uppercase mb-3">活動記錄</h3>
        {dayEvents.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <CalendarIcon size={48} className="mx-auto mb-3 opacity-50" />
            <p>這天沒有活動記錄</p>
          </div>
        ) : (
          <div className="space-y-3">
            {dayEvents.map(event => (
              <div
                key={event.id}
                onClick={() => navigateToHospital(event.hospitalId)}
                className="p-4 bg-white rounded-xl border border-slate-200 cursor-pointer hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <MapPin size={16} className="text-slate-400" />
                    <span className="font-semibold text-slate-900">{event.hospitalName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {renderSentimentIcon(event.sentiment, 16)}
                    <span className={`text-xs px-2 py-1 rounded-full border ${ACTIVITY_COLORS[event.activityType] || ACTIVITY_COLORS['其他']}`}>
                      {event.activityType}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-slate-600 mb-3">{event.content}</p>
                {event.nextStep && (
                  <div className="text-sm text-amber-700 bg-amber-50 px-3 py-2 rounded-lg flex items-center gap-2 mb-3">
                    <ArrowRight size={14} />
                    <span>{event.nextStep}</span>
                    {event.nextStepDate && <span className="text-amber-500 ml-auto">截止：{event.nextStepDate}</span>}
                  </div>
                )}
                <div className="flex items-center text-xs text-slate-400">
                  <User size={12} className="mr-1" />
                  <span>{event.author}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  // 手機版日期詳情 Modal
  const renderMobileDayModal = () => {
    if (!showMobileDayModal || !selectedDate) return null;
    
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-end lg:hidden">
        <div className="bg-white w-full rounded-t-2xl max-h-[80vh] overflow-hidden flex flex-col animate-slide-up">
          <div className="flex items-center justify-between p-4 border-b border-slate-200 shrink-0">
            <h3 className="font-bold text-slate-900">
              {new Date(selectedDate + 'T00:00:00').toLocaleDateString('zh-TW', { month: 'long', day: 'numeric', weekday: 'long' })}
            </h3>
            <button onClick={() => setShowMobileDayModal(false)} className="p-2 text-slate-400 hover:text-slate-600">
              <X size={20} />
            </button>
          </div>
          
          <div className="flex-1 overflow-auto p-4">
            {selectedDateTodos.length > 0 && (
              <div className="mb-4">
                <h4 className="text-xs font-semibold text-slate-500 uppercase mb-2">待辦事項</h4>
                <div className="space-y-2">
                  {selectedDateTodos.map(todo => (
                    <div
                      key={todo.id}
                      onClick={() => { navigateToHospital(todo.hospitalId); setShowMobileDayModal(false); }}
                      className={`p-3 rounded-xl border cursor-pointer ${
                        todo.isOverdue ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        {todo.isOverdue ? <AlertCircle size={14} className="text-red-500" /> : <Clock size={14} className="text-amber-500" />}
                        <span className="font-medium text-slate-900 text-sm">{todo.hospitalName}</span>
                      </div>
                      <p className="text-xs text-slate-600 ml-5">{todo.nextStep}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {selectedDateEvents.length === 0 && selectedDateTodos.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <CalendarIcon size={32} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">這天沒有活動記錄</p>
              </div>
            ) : selectedDateEvents.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-slate-500 uppercase mb-2">活動記錄</h4>
                <div className="space-y-2">
                  {selectedDateEvents.map(event => (
                    <div
                      key={event.id}
                      onClick={() => { navigateToHospital(event.hospitalId); setShowMobileDayModal(false); }}
                      className="p-3 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-slate-900 text-sm">{event.hospitalName}</span>
                        <span className={`px-2 py-0.5 rounded text-xs ${ACTIVITY_COLORS[event.activityType] || ACTIVITY_COLORS['其他']}`}>
                          {event.activityType}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 line-clamp-2">{event.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-4 lg:p-6 h-full flex flex-col">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 space-y-3 sm:space-y-0">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-slate-900 tracking-tight">行事曆</h1>
          <p className="text-slate-500 text-xs lg:text-sm mt-1">查看拜訪記錄、待辦事項與統計。</p>
        </div>
        
        <div className="flex items-center space-x-2 flex-wrap gap-y-2">
          {/* 視圖切換 */}
          <div className="flex bg-slate-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('month')}
              className={`px-2 lg:px-2.5 py-1.5 rounded-md text-xs lg:text-sm font-medium transition-colors flex items-center gap-1 ${
                viewMode === 'month' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutGrid size={14} />
              <span className="hidden sm:inline">月</span>
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-2 lg:px-2.5 py-1.5 rounded-md text-xs lg:text-sm font-medium transition-colors flex items-center gap-1 ${
                viewMode === 'week' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Rows3 size={14} />
              <span className="hidden sm:inline">週</span>
            </button>
            <button
              onClick={() => setViewMode('day')}
              className={`px-2 lg:px-2.5 py-1.5 rounded-md text-xs lg:text-sm font-medium transition-colors flex items-center gap-1 ${
                viewMode === 'day' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Square size={14} />
              <span className="hidden sm:inline">日</span>
            </button>
          </div>

          {/* 側邊面板切換 - 只在桌面版顯示 */}
          <button
            onClick={() => setShowSidePanel(!showSidePanel)}
            className={`hidden lg:flex p-2 rounded-lg border transition-colors ${
              showSidePanel ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
            title={showSidePanel ? '隱藏側邊面板' : '顯示側邊面板'}
          >
            {showSidePanel ? <PanelRightClose size={18} /> : <PanelRight size={18} />}
          </button>

          {/* Manager/Admin 篩選器 */}
          {isManagerOrAdmin && allProfiles.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setShowFilterMenu(!showFilterMenu)}
                className={`flex items-center space-x-1.5 px-2 lg:px-3 py-2 rounded-lg border font-medium transition-colors ${
                  selectedUserId !== 'all' ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Filter size={16} />
                <span className="hidden lg:inline text-sm">
                  {selectedUserId === 'all' ? '所有人員' : allProfiles.find(p => p.id === selectedUserId)?.full_name || '篩選'}
                </span>
              </button>
              
              {showFilterMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-200 z-50 py-1 max-h-64 overflow-auto">
                  <button
                    onClick={() => { setSelectedUserId('all'); setShowFilterMenu(false); }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 ${selectedUserId === 'all' ? 'text-blue-600 font-medium' : 'text-slate-700'}`}
                  >
                    所有人員
                  </button>
                  {allProfiles.map(p => (
                    <button
                      key={p.id}
                      onClick={() => { setSelectedUserId(p.id); setShowFilterMenu(false); }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 ${selectedUserId === p.id ? 'text-blue-600 font-medium' : 'text-slate-700'}`}
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
              className="flex items-center space-x-1.5 px-2 lg:px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-sm transition-all"
            >
              <Download size={16} />
              <span className="hidden sm:inline text-sm">匯出</span>
            </button>
            
            {showExportMenu && (
              <div className="absolute right-0 mt-2 w-44 bg-white rounded-xl shadow-lg border border-slate-200 z-50 py-1">
                <div className="px-3 py-1.5 text-xs font-semibold text-slate-500 uppercase">本週</div>
                <button onClick={() => exportToExcel('week')} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center space-x-2">
                  <FileSpreadsheet size={14} className="text-green-600" />
                  <span>Excel</span>
                </button>
                <button onClick={() => exportToPDF('week')} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center space-x-2">
                  <FileText size={14} className="text-red-600" />
                  <span>PDF</span>
                </button>
                <div className="border-t border-slate-100 my-1"></div>
                <div className="px-3 py-1.5 text-xs font-semibold text-slate-500 uppercase">本月</div>
                <button onClick={() => exportToExcel('month')} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center space-x-2">
                  <FileSpreadsheet size={14} className="text-green-600" />
                  <span>Excel</span>
                </button>
                <button onClick={() => exportToPDF('month')} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center space-x-2">
                  <FileText size={14} className="text-red-600" />
                  <span>PDF</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 月度統計卡片 - 手機版 2x2 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 lg:gap-3 mb-4">
        <div className="bg-white rounded-xl p-2 lg:p-3 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] lg:text-xs text-slate-500">本月活動</p>
              <p className="text-lg lg:text-xl font-bold text-slate-900">{monthlyStats.totalActivities}</p>
            </div>
            <div className="w-7 h-7 lg:w-8 lg:h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <CalendarIcon size={14} className="text-blue-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-2 lg:p-3 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] lg:text-xs text-slate-500">涵蓋醫院</p>
              <p className="text-lg lg:text-xl font-bold text-slate-900">{monthlyStats.uniqueHospitals}</p>
            </div>
            <div className="w-7 h-7 lg:w-8 lg:h-8 bg-purple-100 rounded-lg flex items-center justify-center">
              <Building2 size={14} className="text-purple-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-2 lg:p-3 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] lg:text-xs text-slate-500">待辦事項</p>
              <p className="text-lg lg:text-xl font-bold text-slate-900">
                {todoItems.length}
                {todoItems.filter(t => t.isOverdue).length > 0 && (
                  <span className="text-[10px] lg:text-xs text-red-500 ml-1">({todoItems.filter(t => t.isOverdue).length})</span>
                )}
              </p>
            </div>
            <div className="w-7 h-7 lg:w-8 lg:h-8 bg-amber-100 rounded-lg flex items-center justify-center">
              <Target size={14} className="text-amber-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-2 lg:p-3 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] lg:text-xs text-slate-500">情緒分布</p>
              <div className="flex items-center space-x-1 lg:space-x-1.5 mt-0.5">
                <div className="flex items-center"><Smile size={12} className="text-emerald-500" /><span className="text-xs lg:text-sm font-medium ml-0.5">{monthlyStats.sentimentBreakdown.positive}</span></div>
                <div className="flex items-center"><Meh size={12} className="text-slate-400" /><span className="text-xs lg:text-sm font-medium ml-0.5">{monthlyStats.sentimentBreakdown.neutral}</span></div>
                <div className="flex items-center"><Frown size={12} className="text-red-500" /><span className="text-xs lg:text-sm font-medium ml-0.5">{monthlyStats.sentimentBreakdown.negative}</span></div>
              </div>
            </div>
            <div className="w-7 h-7 lg:w-8 lg:h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
              <TrendingUp size={14} className="text-emerald-600" />
            </div>
          </div>
        </div>
      </div>

      {/* 主要內容區 */}
      <div className="flex-1 flex flex-col lg:flex-row gap-4 min-h-0 overflow-hidden">
        {/* 日曆主體 */}
        <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col min-w-0">
          {/* 導航列 */}
          <div className="flex items-center justify-between px-3 lg:px-4 py-2 lg:py-3 border-b border-slate-200 bg-slate-50 shrink-0">
            <div className="flex items-center space-x-2 lg:space-x-3">
              <h2 className="text-sm lg:text-lg font-bold text-slate-900">{formatDateHeader()}</h2>
              <button onClick={goToToday} className="text-xs lg:text-sm text-blue-600 hover:text-blue-700 font-medium px-2 py-1 rounded hover:bg-blue-50">今天</button>
            </div>
            <div className="flex items-center space-x-1">
              <button onClick={navigate_prev} className="p-1.5 lg:p-2 hover:bg-slate-200 rounded-lg transition-colors"><ChevronLeft size={18} className="text-slate-600" /></button>
              <button onClick={navigate_next} className="p-1.5 lg:p-2 hover:bg-slate-200 rounded-lg transition-colors"><ChevronRight size={18} className="text-slate-600" /></button>
            </div>
          </div>

          {viewMode === 'month' && renderMonthView()}
          {viewMode === 'week' && renderWeekView()}
          {viewMode === 'day' && renderDayView()}
        </div>

        {/* 側邊面板 - 只在桌面版顯示 */}
        {showSidePanel && (
          <div className="hidden lg:block w-72 space-y-3 overflow-auto shrink-0">
            {viewMode !== 'day' && selectedDate && (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-3">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-slate-900 text-sm">
                    {new Date(selectedDate + 'T00:00:00').toLocaleDateString('zh-TW', { month: 'short', day: 'numeric', weekday: 'short' })}
                  </h3>
                  <button onClick={() => setSelectedDate(null)} className="text-slate-400 hover:text-slate-600"><X size={14} /></button>
                </div>

                {selectedDateTodos.length > 0 && (
                  <div className="mb-2">
                    <h4 className="text-[10px] font-semibold text-slate-500 uppercase mb-1.5">待辦</h4>
                    <div className="space-y-1">
                      {selectedDateTodos.slice(0, 3).map(todo => (
                        <div key={todo.id} onClick={() => navigateToHospital(todo.hospitalId)} className={`p-2 rounded-lg border cursor-pointer text-xs ${todo.isOverdue ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'}`}>
                          <div className="font-medium text-slate-900 truncate">{todo.hospitalName}</div>
                          <div className="text-slate-600 truncate">{todo.nextStep}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedDateEvents.length === 0 && selectedDateTodos.length === 0 ? (
                  <div className="text-center py-4 text-slate-400">
                    <CalendarIcon size={20} className="mx-auto mb-1 opacity-50" />
                    <p className="text-xs">這天沒有記錄</p>
                  </div>
                ) : selectedDateEvents.length > 0 && (
                  <div>
                    <h4 className="text-[10px] font-semibold text-slate-500 uppercase mb-1.5">活動</h4>
                    <div className="space-y-1.5">
                      {selectedDateEvents.slice(0, 5).map(event => (
                        <div key={event.id} onClick={() => navigateToHospital(event.hospitalId)} className="p-2 bg-slate-50 rounded-lg border border-slate-100 cursor-pointer hover:bg-slate-100 text-xs">
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="font-medium text-slate-900 truncate">{event.hospitalName}</span>
                            <span className={`px-1.5 py-0.5 rounded text-[10px] shrink-0 ${ACTIVITY_COLORS[event.activityType] || ACTIVITY_COLORS['其他']}`}>{event.activityType}</span>
                          </div>
                          <p className="text-slate-600 line-clamp-2">{event.content}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-3 py-2 flex items-center justify-between bg-slate-50 border-b border-slate-200">
                <div className="flex items-center gap-1.5">
                  <Target size={14} className="text-amber-600" />
                  <span className="font-semibold text-slate-900 text-sm">待辦事項</span>
                  {todoItems.filter(t => t.isOverdue).length > 0 && (
                    <span className="px-1.5 py-0.5 bg-red-100 text-red-600 text-[10px] rounded-full font-medium">{todoItems.filter(t => t.isOverdue).length}</span>
                  )}
                </div>
                <span className="text-[10px] text-slate-500">{todoItems.length} 項</span>
              </div>
              
              <div className="p-2 max-h-[180px] overflow-auto">
                {todoItems.length === 0 ? (
                  <div className="text-center py-3 text-slate-400">
                    <CheckCircle2 size={16} className="mx-auto mb-1 opacity-50" />
                    <p className="text-xs">沒有待辦</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {todoItems.slice(0, 6).map(todo => (
                      <div key={todo.id} onClick={() => navigateToHospital(todo.hospitalId)} className={`p-2 rounded-lg border cursor-pointer transition-colors text-xs ${todo.isOverdue ? 'bg-red-50 border-red-200 hover:bg-red-100' : todo.isDueSoon ? 'bg-amber-50 border-amber-200 hover:bg-amber-100' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'}`}>
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="font-medium text-slate-900 truncate">{todo.hospitalName}</span>
                          <span className={`text-[10px] shrink-0 ml-1 ${todo.isOverdue ? 'text-red-600' : todo.isDueSoon ? 'text-amber-600' : 'text-slate-500'}`}>
                            {todo.isOverdue ? `過期${Math.abs(todo.daysUntilDue)}天` : todo.daysUntilDue === 0 ? '今天' : `${todo.daysUntilDue}天`}
                          </span>
                        </div>
                        <p className="text-slate-600 truncate">{todo.nextStep}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-3 py-2 flex items-center justify-between bg-slate-50 border-b border-slate-200">
                <div className="flex items-center gap-1.5">
                  <AlertTriangle size={14} className="text-orange-600" />
                  <span className="font-semibold text-slate-900 text-sm">未拜訪</span>
                  {unvisitedHospitals.length > 0 && (
                    <span className="px-1.5 py-0.5 bg-orange-100 text-orange-600 text-[10px] rounded-full font-medium">{unvisitedHospitals.length}</span>
                  )}
                </div>
              </div>
              
              <div className="p-2">
                <div className="flex items-center gap-1 mb-2 text-xs">
                  <span className="text-slate-500">超過</span>
                  <select value={unvisitedDaysThreshold} onChange={(e) => setUnvisitedDaysThreshold(Number(e.target.value))} className="border border-slate-200 rounded px-1.5 py-0.5 text-xs bg-white">
                    <option value={14}>14天</option>
                    <option value={30}>30天</option>
                    <option value={60}>60天</option>
                    <option value={90}>90天</option>
                  </select>
                </div>
                
                <div className="max-h-[150px] overflow-auto">
                  {unvisitedHospitals.length === 0 ? (
                    <div className="text-center py-3 text-slate-400">
                      <CheckCircle2 size={16} className="mx-auto mb-1 opacity-50" />
                      <p className="text-xs">都有定期拜訪</p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {unvisitedHospitals.slice(0, 6).map(item => (
                        <div key={item.hospital.id} onClick={() => navigateToHospital(item.hospital.id)} className="p-2 bg-orange-50 rounded-lg border border-orange-200 cursor-pointer hover:bg-orange-100 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-slate-900 truncate">{item.hospital.name}</span>
                            <span className="text-orange-600 shrink-0 ml-1 text-[10px]">{item.lastVisitDate === null ? '從未' : `${item.daysSinceVisit}天`}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* 手機版日期詳情 Modal */}
      {renderMobileDayModal()}
      
      {/* 動畫樣式 */}
      <style>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default Calendar;
