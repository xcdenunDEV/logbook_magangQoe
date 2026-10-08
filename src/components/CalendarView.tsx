import React, { useState, useMemo } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Calendar as CalendarIcon,
  LayoutList,
  Calendar
} from 'lucide-react';
import { LogbookEntry, PesertaProfile } from '../types';
import { getHolidayInfo, isWeekend } from '../data/holidays';
import { formatDuration, formatIndonesianDate, NAMA_BULAN, NAMA_HARI } from '../utils/dateUtils';

interface CalendarViewProps {
  entries: LogbookEntry[];
  profile: PesertaProfile;
  onAddEntryForDate: (dateStr: string) => void;
  onViewEntry: (entry: LogbookEntry) => void;
  currentView?: 'table' | 'calendar';
  onToggleView?: (view: 'table' | 'calendar') => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  entries,
  profile,
  onAddEntryForDate,
  onViewEntry,
  currentView = 'calendar',
  onToggleView
}) => {
  const currentDate = new Date();
  const [currentYear, setCurrentYear] = useState<number>(currentDate.getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(currentDate.getMonth() + 1);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const prevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const entriesByDate = useMemo(() => {
    const map = new Map<string, LogbookEntry[]>();
    entries.forEach(entry => {
      const existing = map.get(entry.tanggal) || [];
      existing.push(entry);
      map.set(entry.tanggal, existing);
    });
    return map;
  }, [entries]);

  const calendarCells = useMemo(() => {
    const firstDayOfMonth = new Date(currentYear, currentMonth - 1, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();

    const cells: Array<{
      dateStr: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      isWeekendDay: boolean;
      holiday: ReturnType<typeof getHolidayInfo>;
      entries: LogbookEntry[];
      totalMinutes: number;
    }> = [];

    const prevMonthDays = new Date(currentYear, currentMonth - 1, 0).getDate();
    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
      const dayNum = prevMonthDays - i;
      const prevM = currentMonth === 1 ? 12 : currentMonth - 1;
      const prevY = currentMonth === 1 ? currentYear - 1 : currentYear;
      const dateStr = `${prevY}-${String(prevM).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      cells.push({
        dateStr,
        dayNumber: dayNum,
        isCurrentMonth: false,
        isWeekendDay: isWeekend(dateStr),
        holiday: getHolidayInfo(dateStr),
        entries: entriesByDate.get(dateStr) || [],
        totalMinutes: (entriesByDate.get(dateStr) || []).reduce((acc, e) => acc + (e.durasiMenit || 0), 0)
      });
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayEntries = entriesByDate.get(dateStr) || [];
      const totalMinutes = dayEntries.reduce((acc, e) => acc + (e.durasiMenit || 0), 0);

      cells.push({
        dateStr,
        dayNumber: day,
        isCurrentMonth: true,
        isWeekendDay: isWeekend(dateStr),
        holiday: getHolidayInfo(dateStr),
        entries: dayEntries,
        totalMinutes
      });
    }

    const totalRemaining = 42 - cells.length;
    if (totalRemaining > 0 && totalRemaining < 7) {
      for (let day = 1; day <= totalRemaining; day++) {
        const nextM = currentMonth === 12 ? 1 : currentMonth + 1;
        const nextY = currentMonth === 12 ? currentYear + 1 : currentYear;
        const dateStr = `${nextY}-${String(nextM).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        cells.push({
          dateStr,
          dayNumber: day,
          isCurrentMonth: false,
          isWeekendDay: isWeekend(dateStr),
          holiday: getHolidayInfo(dateStr),
          entries: entriesByDate.get(dateStr) || [],
          totalMinutes: (entriesByDate.get(dateStr) || []).reduce((acc, e) => acc + (e.durasiMenit || 0), 0)
        });
      }
    }

    return cells;
  }, [currentYear, currentMonth, entriesByDate]);

  const selectedEntries = useMemo(() => {
    if (!selectedDate) return [];
    return entriesByDate.get(selectedDate) || [];
  }, [selectedDate, entriesByDate]);

  return (
    <div className="space-y-4">
      {/* Calendar Header */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-800 flex items-center justify-center">
            <CalendarIcon className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900">
              Kalender Aktivitas: {NAMA_BULAN[currentMonth - 1]} {currentYear}
            </h2>
            <p className="text-xs text-slate-500">
              Jadwal dan rekam pengisian logbook pemagangan harian
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Month Stepper */}
          <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg p-0.5">
            <button
              onClick={prevMonth}
              className="p-1.5 hover:bg-white rounded-md text-slate-600 hover:text-slate-900 transition-colors"
              title="Bulan sebelumnya"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                const now = new Date();
                setCurrentMonth(now.getMonth() + 1);
                setCurrentYear(now.getFullYear());
              }}
              className="px-2.5 py-1 text-xs font-semibold text-slate-700 hover:text-slate-900"
            >
              Bulan Ini
            </button>
            <button
              onClick={nextMonth}
              className="p-1.5 hover:bg-white rounded-md text-slate-600 hover:text-slate-900 transition-colors"
              title="Bulan berikutnya"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* View Switcher: Table vs Calendar */}
          {onToggleView && (
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
              <button
                onClick={() => onToggleView('table')}
                className={`p-1.5 rounded-md transition-all ${
                  currentView === 'table'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Tampilan Tabel"
              >
                <LayoutList className="w-4 h-4" />
              </button>
              <button
                onClick={() => onToggleView('calendar')}
                className={`p-1.5 rounded-md transition-all ${
                  currentView === 'calendar'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Tampilan Kalender"
              >
                <Calendar className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Quiet Status Legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 bg-white px-4 py-2.5 rounded-xl border border-slate-200/80">
        <span className="font-semibold text-slate-700">Keterangan:</span>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
          <span>Tersinkron ke Sheet</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-sky-500"></span>
          <span>Logbook Tercatat</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-400"></span>
          <span>Hari Libur Nasional</span>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        {/* Day header */}
        <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 text-center text-xs font-bold text-slate-600">
          {NAMA_HARI.map((day, idx) => (
            <div 
              key={day} 
              className={`py-2.5 ${idx === 0 || idx === 6 ? 'text-rose-600' : ''}`}
            >
              {day}
            </div>
          ))}
        </div>

        {/* Date cells */}
        <div className="grid grid-cols-7 divide-x divide-y divide-slate-100">
          {calendarCells.map((cell, idx) => {
            const hasSynced = cell.entries.some(e => e.isSyncedToSheet);
            const isToday = cell.dateStr === new Date().toISOString().slice(0, 10);

            return (
              <div
                key={idx}
                onClick={() => setSelectedDate(cell.dateStr)}
                className={`min-h-[105px] p-2 flex flex-col justify-between transition-colors cursor-pointer relative group ${
                  !cell.isCurrentMonth
                    ? 'bg-slate-50/40 text-slate-300'
                    : cell.holiday
                    ? 'bg-rose-50/30'
                    : cell.isWeekendDay
                    ? 'bg-slate-50/70 text-slate-500'
                    : 'bg-white hover:bg-sky-50/30'
                } ${selectedDate === cell.dateStr ? 'ring-2 ring-sky-600 z-10' : ''}`}
              >
                {/* Cell Top Header */}
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full ${
                      isToday
                        ? 'bg-[#003B73] text-white shadow-xs'
                        : cell.holiday
                        ? 'text-rose-600 font-extrabold'
                        : cell.isWeekendDay
                        ? 'text-rose-500'
                        : 'text-slate-800'
                    }`}
                  >
                    {cell.dayNumber}
                  </span>

                  {cell.entries.length > 0 && (
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        hasSynced ? 'bg-emerald-500' : 'bg-sky-500'
                      }`}
                      title={hasSynced ? 'Tersinkron ke Sheet' : 'Logbook Tercatat'}
                    />
                  )}
                </div>

                {/* Holiday label */}
                {cell.holiday && (
                  <div className="mt-1 text-[10px] text-rose-700 font-semibold line-clamp-1 leading-tight">
                    {cell.holiday.name}
                  </div>
                )}

                {/* Activity title preview */}
                <div className="mt-1 space-y-1 flex-1 overflow-hidden">
                  {cell.entries.slice(0, 1).map((item) => (
                    <div
                      key={item.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewEntry(item);
                      }}
                      className="p-1 rounded bg-slate-50 hover:bg-sky-100/60 border border-slate-200 text-[10px] font-medium text-slate-800 truncate"
                    >
                      {item.uraianAktivitas}
                    </div>
                  ))}
                  {cell.entries.length > 1 && (
                    <div className="text-[10px] font-semibold text-slate-400">
                      +{cell.entries.length - 1} aktivitas
                    </div>
                  )}
                </div>

                {/* Add button on hover */}
                <div className="mt-1 flex items-center justify-between pt-1 border-t border-slate-100 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-[10px] font-mono text-slate-400">
                    {cell.totalMinutes > 0 ? formatDuration(cell.totalMinutes) : ''}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddEntryForDate(cell.dateStr);
                    }}
                    className="p-1 rounded bg-[#003B73] text-white hover:bg-sky-800 shadow-xs"
                    title={`Isi laporan untuk ${cell.dateStr}`}
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Date Detail Drawer / Panel */}
      {selectedDate && (
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs animate-in fade-in">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
            <div className="flex items-center gap-2.5">
              <CalendarIcon className="w-5 h-5 text-sky-700" />
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  {formatIndonesianDate(selectedDate)}
                </h3>
                <p className="text-xs text-slate-500">
                  {getHolidayInfo(selectedDate)?.name || (isWeekend(selectedDate) ? 'Akhir Pekan' : 'Hari Pemagangan Aktif')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onAddEntryForDate(selectedDate)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-[#003B73] hover:bg-sky-800 transition-colors shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Isi Logbook Tanggal Ini</span>
              </button>
              <button
                onClick={() => setSelectedDate(null)}
                className="text-xs text-slate-400 hover:text-slate-600 px-2 py-1"
              >
                Tutup
              </button>
            </div>
          </div>

          {selectedEntries.length === 0 ? (
            <p className="text-xs text-slate-500 italic py-2">
              Belum ada logbook yang dicatat pada tanggal ini.
            </p>
          ) : (
            <div className="space-y-2">
              {selectedEntries.map(entry => (
                <div
                  key={entry.id}
                  onClick={() => onViewEntry(entry)}
                  className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-sky-300 hover:bg-sky-50/30 transition-colors cursor-pointer"
                >
                  <div className="space-y-1 max-w-[70%]">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                        {entry.jamMulai} - {entry.jamSelesai}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-600">
                        {entry.kategori}
                      </span>
                    </div>
                    <h4 className="text-xs font-semibold text-slate-900 line-clamp-1">
                      {entry.uraianAktivitas}
                    </h4>
                  </div>
                  <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${
                    entry.isSyncedToSheet
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}>
                    {entry.isSyncedToSheet ? 'Tersinkron Sheet' : 'Catatan Pribadi'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CalendarView;
