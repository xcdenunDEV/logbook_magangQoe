import React, { useState, useMemo, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar as CalendarIcon,
  LayoutList,
  Briefcase,
  Edit3,
  Eye,
  Image as ImageIcon,
  Layers,
  CheckCircle2,
  AlertCircle,
  Clock
} from 'lucide-react';
import { LogbookEntry, PesertaProfile } from '../types';
import { getHolidayInfo, isWeekend } from '../data/holidays';
import {
  countWorkdaysInPeriod,
  formatDateDDMMYYYY,
  formatDuration,
  formatIndonesianDate,
  getDatesInRange,
  getDayOfWeek,
  getDefaultPeriodId,
  getDefaultWorkHours,
  getPeriodById,
  getTodayString,
  isStandardWorkday,
  MAGANG_PERIODS,
  NAMA_BULAN_SINGKAT
} from '../utils/dateUtils';

interface CalendarViewProps {
  entries: LogbookEntry[];
  profile: PesertaProfile;
  selectedPeriodId?: number;
  onSelectPeriod?: (periodId: number) => void;
  onAddEntryForDate: (dateStr: string) => void;
  onEditEntry?: (entry: LogbookEntry) => void;
  onViewEntry: (entry: LogbookEntry) => void;
  currentView?: 'table' | 'calendar';
  onToggleView?: (view: 'table' | 'calendar') => void;
}

const WEEKDAY_HEADERS = [
  { short: 'Sen', full: 'Senin', isWeekend: false },
  { short: 'Sel', full: 'Selasa', isWeekend: false },
  { short: 'Rab', full: 'Rabu', isWeekend: false },
  { short: 'Kam', full: 'Kamis', isWeekend: false },
  { short: 'Jum', full: 'Jumat', isWeekend: false },
  { short: 'Sab', full: 'Sabtu', isWeekend: true },
  { short: 'Min', full: 'Minggu', isWeekend: true }
];

export const CalendarView: React.FC<CalendarViewProps> = ({
  entries,
  selectedPeriodId: controlledPeriodId,
  onSelectPeriod,
  onAddEntryForDate,
  onEditEntry,
  onViewEntry,
  onToggleView
}) => {
  const [internalPeriodId, setInternalPeriodId] = useState<number>(getDefaultPeriodId());
  const activePeriodId = controlledPeriodId ?? internalPeriodId;

  const setPeriodId = (nextId: number) => {
    setInternalPeriodId(nextId);
    onSelectPeriod?.(nextId);
  };

  const currentPeriod = useMemo(() => getPeriodById(activePeriodId), [activePeriodId]);
  const todayStr = getTodayString();

  const [tipeFilter, setTipeFilter] = useState<'all' | 'harian' | 'mingguan'>('all');
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    if (todayStr >= currentPeriod.startDate && todayStr <= currentPeriod.endDate) {
      return todayStr;
    }
    return currentPeriod.startDate;
  });

  // Keep selectedDate inside the active period whenever period switches
  useEffect(() => {
    if (selectedDate < currentPeriod.startDate || selectedDate > currentPeriod.endDate) {
      if (todayStr >= currentPeriod.startDate && todayStr <= currentPeriod.endDate) {
        setSelectedDate(todayStr);
      } else {
        setSelectedDate(currentPeriod.startDate);
      }
    }
  }, [currentPeriod, selectedDate, todayStr]);

  // Daily entries indexed by exact tanggal
  const dailyByDate = useMemo(() => {
    const map = new Map<string, LogbookEntry[]>();
    entries.forEach(entry => {
      if (entry.tipeLogbook !== 'harian') return;
      const list = map.get(entry.tanggal) || [];
      list.push(entry);
      map.set(entry.tanggal, list);
    });
    return map;
  }, [entries]);

  // Weekly entries indexed across every date in [tanggal .. tanggalSelesai]
  const weeklyByDate = useMemo(() => {
    const map = new Map<string, LogbookEntry[]>();
    entries.forEach(entry => {
      if (entry.tipeLogbook !== 'mingguan') return;
      const end = entry.tanggalSelesai && entry.tanggalSelesai >= entry.tanggal ? entry.tanggalSelesai : entry.tanggal;
      const spanDates = getDatesInRange(entry.tanggal, end);
      spanDates.forEach(d => {
        const list = map.get(d) || [];
        list.push(entry);
        map.set(d, list);
      });
    });
    return map;
  }, [entries]);

  // Precompute stats for all 6 periods (used by the Periode 1–6 quick switcher strip)
  const allPeriodSummaries = useMemo(() => {
    return MAGANG_PERIODS.map(period => {
      const dates = getDatesInRange(period.startDate, period.endDate);
      const totalWorkdays = countWorkdaysInPeriod(period);
      let filledWorkdays = 0;
      let totalDailyEntries = 0;

      dates.forEach(d => {
        const dayDaily = dailyByDate.get(d) || [];
        if (dayDaily.length > 0) {
          totalDailyEntries += dayDaily.length;
          if (isStandardWorkday(d)) filledWorkdays++;
        }
      });

      const pct = totalWorkdays > 0 ? Math.min(100, Math.round((filledWorkdays / totalWorkdays) * 100)) : 0;
      return {
        period,
        totalWorkdays,
        filledWorkdays,
        totalDailyEntries,
        pct
      };
    });
  }, [dailyByDate]);

  // Detailed metrics for the currently active period
  const periodStats = useMemo(() => {
    const dates = getDatesInRange(currentPeriod.startDate, currentPeriod.endDate);
    const totalWorkdays = countWorkdaysInPeriod(currentPeriod);
    let filledWorkdays = 0;
    let nonWorkdayLogs = 0;
    let totalMinutes = 0;
    const missingWorkdays: string[] = [];

    dates.forEach(d => {
      const dayDaily = dailyByDate.get(d) || [];
      totalMinutes += dayDaily.reduce((sum, e) => sum + (e.durasiMenit || 0), 0);

      if (dayDaily.length > 0) {
        if (isStandardWorkday(d)) {
          filledWorkdays++;
        } else {
          nonWorkdayLogs += dayDaily.length;
        }
      } else if (isStandardWorkday(d) && d <= todayStr) {
        missingWorkdays.push(d);
      }
    });

    const weeklyInPeriod = entries.filter(
      e =>
        e.tipeLogbook === 'mingguan' &&
        e.tanggal <= currentPeriod.endDate &&
        (e.tanggalSelesai || e.tanggal) >= currentPeriod.startDate
    ).length;

    const pct = totalWorkdays > 0 ? Math.min(100, Math.round((filledWorkdays / totalWorkdays) * 100)) : 0;

    return {
      totalWorkdays,
      filledWorkdays,
      nonWorkdayLogs,
      totalMinutes,
      weeklyInPeriod,
      missingWorkdays,
      pct
    };
  }, [currentPeriod, dailyByDate, entries, todayStr]);

  // Build Monday-first 7-column calendar cells spanning currentPeriod.startDate .. currentPeriod.endDate
  const calendarCells = useMemo(() => {
    const periodDates = getDatesInRange(currentPeriod.startDate, currentPeriod.endDate);
    if (periodDates.length === 0) return [];

    // Convert JS getDay (0=Sun..6=Sat) to Monday-first index (0=Mon..6=Sun)
    const toMonIndex = (dateStr: string) => {
      const dow = getDayOfWeek(dateStr);
      return dow === 0 ? 6 : dow - 1;
    };

    const startMonIdx = toMonIndex(periodDates[0]);
    const endMonIdx = toMonIndex(periodDates[periodDates.length - 1]);

    const addDays = (dateStr: string, offset: number): string => {
      const [y, m, d] = dateStr.split('-').map(Number);
      const dt = new Date(y, m - 1, d + offset);
      return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
    };

    const allDates: Array<{ dateStr: string; isInPeriod: boolean }> = [];

    for (let i = startMonIdx; i > 0; i--) {
      allDates.push({ dateStr: addDays(periodDates[0], -i), isInPeriod: false });
    }

    periodDates.forEach(d => {
      allDates.push({ dateStr: d, isInPeriod: true });
    });

    const trailing = 6 - endMonIdx;
    for (let i = 1; i <= trailing; i++) {
      allDates.push({ dateStr: addDays(periodDates[periodDates.length - 1], i), isInPeriod: false });
    }

    return allDates.map(({ dateStr, isInPeriod }, index) => {
      const [, mStr, dStr] = dateStr.split('-');
      const dayNumber = parseInt(dStr, 10);
      const monthIndex = parseInt(mStr, 10) - 1;

      const dailyEntries = tipeFilter === 'mingguan' ? [] : dailyByDate.get(dateStr) || [];
      const weeklyEntries = tipeFilter === 'harian' ? [] : weeklyByDate.get(dateStr) || [];
      const totalMinutes = dailyEntries.reduce((acc, e) => acc + (e.durasiMenit || 0), 0);
      const photoCount = dailyEntries.reduce((acc, e) => acc + (e.fotoDokumentasi?.length || 0), 0);

      const holiday = getHolidayInfo(dateStr);
      const weekend = isWeekend(dateStr);
      const isWorkday = !weekend && !holiday;
      const isMissedWorkday =
        isInPeriod &&
        isWorkday &&
        dateStr <= todayStr &&
        (dailyByDate.get(dateStr)?.length || 0) === 0;

      const showMonthTag = dayNumber === 1 || dateStr === currentPeriod.startDate || index === 0;

      return {
        dateStr,
        dayNumber,
        monthTag: showMonthTag ? NAMA_BULAN_SINGKAT[monthIndex] : null,
        isInPeriod,
        isWeekendDay: weekend,
        holiday,
        isWorkday,
        isMissedWorkday,
        dailyEntries,
        weeklyEntries,
        totalMinutes,
        photoCount
      };
    });
  }, [currentPeriod, dailyByDate, weeklyByDate, tipeFilter, todayStr]);

  const selectedDailyEntries = useMemo(
    () => (selectedDate ? dailyByDate.get(selectedDate) || [] : []),
    [selectedDate, dailyByDate]
  );

  const selectedWeeklyEntries = useMemo(
    () => (selectedDate ? weeklyByDate.get(selectedDate) || [] : []),
    [selectedDate, weeklyByDate]
  );

  const selectedDateWorkHours = useMemo(
    () => getDefaultWorkHours(selectedDate || todayStr),
    [selectedDate, todayStr]
  );

  const prevPeriod = () => {
    if (activePeriodId > 1) setPeriodId(activePeriodId - 1);
  };

  const nextPeriod = () => {
    if (activePeriodId < MAGANG_PERIODS.length) setPeriodId(activePeriodId + 1);
  };

  return (
    <div className="space-y-4">
      {/* Periode 1–6 Quick Selector Strip */}
      <div className="bg-white dark:bg-slate-900/90 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-3 transition-colors duration-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0"
              style={{ color: 'var(--theme-accent)' }}
            >
              <CalendarIcon className="w-4.5 h-4.5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white tracking-tight">
                Kalender {currentPeriod.label} · {currentPeriod.fullRange}
              </h2>
              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-xs text-slate-500 dark:text-slate-400 mt-0.5 tabular-nums">
                <span>
                  {formatDateDDMMYYYY(currentPeriod.startDate)} – {formatDateDDMMYYYY(currentPeriod.endDate)}
                </span>
                <span aria-hidden="true">·</span>
                <span>
                  Hari kerja terisi:{' '}
                  <strong className="text-slate-800 dark:text-slate-200">
                    {periodStats.filledWorkdays}/{periodStats.totalWorkdays}
                  </strong>{' '}
                  ({periodStats.pct}%)
                </span>
                <span aria-hidden="true">·</span>
                <span>
                  Total:{' '}
                  <strong className="text-slate-800 dark:text-slate-200">
                    {(periodStats.totalMinutes / 60).toFixed(1)} jam
                  </strong>
                </span>
                {periodStats.weeklyInPeriod > 0 && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span>
                      Rekap mingguan:{' '}
                      <strong className="text-purple-700 dark:text-purple-300">
                        {periodStats.weeklyInPeriod}
                      </strong>
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Segmented Filter: Semua / Harian / Mingguan */}
            <div className="flex items-center p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
              {(['all', 'harian', 'mingguan'] as const).map(mode => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setTipeFilter(mode)}
                  className={`px-2.5 py-1 text-xs font-bold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    tipeFilter === mode
                      ? 'text-white shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                  style={tipeFilter === mode ? { backgroundColor: 'var(--theme-primary)' } : undefined}
                >
                  {mode === 'all' ? 'Semua' : mode === 'harian' ? 'Harian' : 'Mingguan'}
                </button>
              ))}
            </div>

            {/* Prev / Current / Next Period */}
            <div className="flex items-center bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-0.5">
              <button
                type="button"
                onClick={prevPeriod}
                disabled={activePeriodId === 1}
                className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-md text-slate-600 dark:text-slate-300 disabled:opacity-40 transition-colors cursor-pointer"
                title="Periode sebelumnya"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  const defId = getDefaultPeriodId();
                  setPeriodId(defId);
                  setSelectedDate(todayStr);
                }}
                className="px-2 py-1 text-[11px] font-bold text-slate-700 dark:text-slate-200 hover:text-[var(--theme-accent)] whitespace-nowrap shrink-0 cursor-pointer"
                title="Kembali ke periode saat ini"
              >
                Periode Aktif
              </button>
              <button
                type="button"
                onClick={nextPeriod}
                disabled={activePeriodId === MAGANG_PERIODS.length}
                className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-md text-slate-600 dark:text-slate-300 disabled:opacity-40 transition-colors cursor-pointer"
                title="Periode berikutnya"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {onToggleView && (
              <button
                type="button"
                onClick={() => onToggleView('table')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <LayoutList className="w-3.5 h-3.5" />
                <span>Tampilan Tabel</span>
              </button>
            )}
          </div>
        </div>

        {/* 6-Period Interactive Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-1">
          {allPeriodSummaries.map(({ period, filledWorkdays, totalWorkdays, pct }) => {
            const isActive = period.id === activePeriodId;
            return (
              <button
                key={period.id}
                type="button"
                onClick={() => setPeriodId(period.id)}
                className={`text-left px-3 py-2 rounded-xl border transition-all cursor-pointer ${
                  isActive
                    ? 'bg-slate-900 dark:bg-slate-800 text-white border-transparent shadow-xs'
                    : 'bg-slate-50/80 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
                style={isActive ? { backgroundColor: 'var(--theme-primary)' } : undefined}
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs font-bold whitespace-nowrap">{period.label}</span>
                  <span
                    className={`text-[11px] font-mono tabular-nums font-semibold ${
                      isActive ? 'text-white/90' : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {filledWorkdays}/{totalWorkdays}
                  </span>
                </div>
                <div
                  className={`text-[10px] truncate mt-0.5 ${
                    isActive ? 'text-white/80' : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {period.shortRange}
                </div>
                <div
                  className={`h-1 w-full rounded-full mt-2 overflow-hidden ${
                    isActive ? 'bg-white/25' : 'bg-slate-200 dark:bg-slate-700'
                  }`}
                >
                  <div
                    className={`h-full rounded-full transition-all ${
                      isActive ? 'bg-white' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Split Workspace: Calendar Grid (8 cols) + Sticky Date Inspector (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Left: Period Calendar Grid */}
        <div className="lg:col-span-8 space-y-3">
          <div className="bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden">
            {/* Weekday Header (Senin – Minggu) */}
            <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 text-center text-xs font-bold text-slate-600 dark:text-slate-300">
              {WEEKDAY_HEADERS.map(day => (
                <div
                  key={day.short}
                  className={`py-2.5 ${day.isWeekend ? 'text-rose-600 dark:text-rose-400' : ''}`}
                >
                  <span className="hidden sm:inline">{day.full}</span>
                  <span className="sm:hidden">{day.short}</span>
                </div>
              ))}
            </div>

            {/* Date Cells */}
            <div className="grid grid-cols-7 divide-x divide-y divide-slate-100 dark:divide-slate-800">
              {calendarCells.map(cell => {
                const isToday = cell.dateStr === todayStr;
                const isSelected = selectedDate === cell.dateStr;
                const hasDaily = cell.dailyEntries.length > 0;
                const hasWeekly = cell.weeklyEntries.length > 0;
                const hasSynced = cell.dailyEntries.some(e => e.isSyncedToSheet);
                const hasNonWorkdayEntry = cell.dailyEntries.some(
                  e => e.isDiluarHariKerja || !cell.isWorkday
                );

                return (
                  <div
                    key={cell.dateStr}
                    onClick={() => setSelectedDate(cell.dateStr)}
                    className={`min-h-[104px] sm:min-h-[116px] p-1.5 sm:p-2 flex flex-col justify-between transition-colors cursor-pointer relative group ${
                      !cell.isInPeriod
                        ? 'bg-slate-50/50 dark:bg-slate-950/60 text-slate-400 dark:text-slate-600 opacity-50'
                        : cell.holiday
                        ? 'bg-rose-50/40 dark:bg-rose-950/20'
                        : cell.isWeekendDay
                        ? 'bg-slate-50/80 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400'
                        : 'bg-white dark:bg-slate-900 hover:bg-slate-50/80 dark:hover:bg-slate-800/60'
                    } ${isSelected ? 'ring-2 ring-inset ring-[var(--theme-accent)] z-10' : ''}`}
                  >
                    {/* Top Row: Day Number + Month Tag + Add Shortcut */}
                    <div className="flex items-start justify-between gap-1">
                      <div className="flex items-center gap-1 min-w-0">
                        <span
                          className={`text-xs font-bold tabular-nums w-6 h-6 flex items-center justify-center rounded-lg shrink-0 ${
                            isToday
                              ? 'text-white shadow-2xs'
                              : cell.holiday
                              ? 'text-rose-600 dark:text-rose-400 font-extrabold'
                              : cell.isWeekendDay
                              ? 'text-rose-500 dark:text-rose-400/80'
                              : 'text-slate-800 dark:text-slate-200'
                          }`}
                          style={isToday ? { backgroundColor: 'var(--theme-primary)' } : undefined}
                        >
                          {cell.dayNumber}
                        </span>
                        {cell.monthTag && (
                          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 truncate">
                            {cell.monthTag}
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={e => {
                          e.stopPropagation();
                          setSelectedDate(cell.dateStr);
                          onAddEntryForDate(cell.dateStr);
                        }}
                        className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-1 rounded-md text-white shadow-2xs transition-opacity cursor-pointer shrink-0"
                        style={{ backgroundColor: 'var(--theme-primary)' }}
                        title={`Isi logbook untuk ${formatDateDDMMYYYY(cell.dateStr)}`}
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Middle: Holiday / Daily Entries / Weekly Indicator / Missed Hint */}
                    <div className="mt-1 space-y-1 flex-1 overflow-hidden">
                      {cell.holiday && (
                        <div className="text-[10px] text-rose-700 dark:text-rose-400 font-semibold line-clamp-1 leading-tight">
                          {cell.holiday.name}
                        </div>
                      )}

                      {hasDaily &&
                        cell.dailyEntries.slice(0, 1).map(item => (
                          <div
                            key={item.id}
                            onClick={e => {
                              e.stopPropagation();
                              setSelectedDate(cell.dateStr);
                              onViewEntry(item);
                            }}
                            className={`px-1.5 py-1 rounded-md border text-[10px] font-medium leading-tight truncate ${
                              hasNonWorkdayEntry
                                ? 'bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200'
                                : hasSynced
                                ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/80 text-emerald-900 dark:text-emerald-200'
                                : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200'
                            }`}
                            title={item.uraianAktivitas}
                          >
                            {item.uraianAktivitas}
                          </div>
                        ))}

                      {cell.dailyEntries.length > 1 && (
                        <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 pl-0.5 tabular-nums">
                          +{cell.dailyEntries.length - 1} catatan lain
                        </div>
                      )}

                      {hasWeekly && (
                        <div
                          onClick={e => {
                            e.stopPropagation();
                            setSelectedDate(cell.dateStr);
                            onViewEntry(cell.weeklyEntries[0]);
                          }}
                          className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-purple-50 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-800/70 text-[10px] font-semibold text-purple-800 dark:text-purple-200 truncate"
                          title="Logbook Mingguan mencakup tanggal ini"
                        >
                          <Layers className="w-2.5 h-2.5 shrink-0" />
                          <span className="truncate">Rekap Mingguan</span>
                        </div>
                      )}

                      {!hasDaily && cell.isMissedWorkday && tipeFilter !== 'mingguan' && (
                        <div className="text-[10px] text-amber-700/80 dark:text-amber-400/80 font-medium pt-0.5">
                          Belum diisi
                        </div>
                      )}
                    </div>

                    {/* Footer: Duration & Photo count (tabular-nums) */}
                    <div className="mt-1 pt-1 border-t border-slate-100/80 dark:border-slate-800/80 flex items-center justify-between gap-1 text-[10px] text-slate-400 dark:text-slate-500 tabular-nums">
                      <span className="font-mono truncate">
                        {cell.totalMinutes > 0 ? formatDuration(cell.totalMinutes) : ''}
                      </span>
                      {cell.photoCount > 0 && (
                        <span className="inline-flex items-center gap-0.5 text-sky-600 dark:text-sky-400 font-semibold shrink-0">
                          <ImageIcon className="w-2.5 h-2.5" />
                          {cell.photoCount}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quiet Legend Row */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900/90 px-4 py-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800">
            <span className="font-bold text-slate-700 dark:text-slate-200">Keterangan:</span>
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Tersinkron Sheet</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
              <span>Rekap Mingguan</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>Luar Hari Kerja</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
              <span>Libur Nasional / Akhir Pekan</span>
            </span>
          </div>
        </div>

        {/* Right: Sticky Selected Date Inspector + Missing Workdays Helper */}
        <div className="lg:col-span-4 space-y-4 lg:sticky lg:top-24">
          {/* Date Inspector Panel */}
          <div className="bg-white dark:bg-slate-900/95 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-3.5">
            <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white tabular-nums">
                  {formatIndonesianDate(selectedDate, true)}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {getHolidayInfo(selectedDate)
                    ? `Libur Nasional: ${getHolidayInfo(selectedDate)?.name}`
                    : isWeekend(selectedDate)
                    ? 'Akhir Pekan · Di luar hari kerja Senin–Jumat'
                    : selectedDateWorkHours.scheduleLabel}
                </p>
              </div>
              {selectedDate === todayStr && (
                <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 shrink-0">
                  Hari Ini
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={() => onAddEntryForDate(selectedDate)}
              className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white shadow-xs hover:opacity-95 transition-opacity cursor-pointer"
              style={{ backgroundColor: 'var(--theme-primary)' }}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>
                {isStandardWorkday(selectedDate)
                  ? 'Isi Logbook Tanggal Ini'
                  : 'Catat Kegiatan Luar Hari Kerja'}
              </span>
            </button>

            {/* Daily Entries on Selected Date */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700 dark:text-slate-200">
                  Catatan Harian ({selectedDailyEntries.length})
                </span>
                {selectedDailyEntries.length > 0 && (
                  <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
                    {formatDuration(
                      selectedDailyEntries.reduce((sum, e) => sum + (e.durasiMenit || 0), 0)
                    )}
                  </span>
                )}
              </div>

              {selectedDailyEntries.length === 0 ? (
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-dashed border-slate-200 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400">
                  Belum ada catatan logbook harian pada tanggal{' '}
                  <strong className="font-mono text-slate-700 dark:text-slate-200">
                    {formatDateDDMMYYYY(selectedDate)}
                  </strong>
                  .
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedDailyEntries.map(entry => (
                    <div
                      key={entry.id}
                      className="p-3 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-800/40 space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                        <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                          {entry.kategori}
                        </span>
                        <span className="inline-flex items-center gap-1 font-mono tabular-nums shrink-0">
                          <Clock className="w-3 h-3" />
                          {formatDuration(entry.durasiMenit)}
                        </span>
                      </div>

                      <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed line-clamp-3">
                        {entry.uraianAktivitas}
                      </p>

                      {entry.fotoDokumentasi && entry.fotoDokumentasi.length > 0 && (
                        <div className="flex items-center gap-1.5 pt-0.5">
                          {entry.fotoDokumentasi.slice(0, 3).map(photo => (
                            <img
                              key={photo.id}
                              src={photo.dataUrl}
                              alt={photo.name}
                              className="w-11 h-11 rounded-lg object-cover border border-slate-200 dark:border-slate-700"
                            />
                          ))}
                          {entry.fotoDokumentasi.length > 3 && (
                            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 pl-1">
                              +{entry.fotoDokumentasi.length - 3} foto
                            </span>
                          )}
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-1.5 border-t border-slate-200/70 dark:border-slate-700/70 text-[11px]">
                        <span
                          className={`font-semibold ${
                            entry.isSyncedToSheet
                              ? 'text-emerald-700 dark:text-emerald-400'
                              : 'text-slate-500 dark:text-slate-400'
                          }`}
                        >
                          {entry.isSyncedToSheet ? 'Tersinkron Sheet' : 'Tersimpan Lokal'}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => onViewEntry(entry)}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-slate-700 dark:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-slate-700 font-semibold transition-colors cursor-pointer"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Detail</span>
                          </button>
                          {onEditEntry && (
                            <button
                              type="button"
                              onClick={() => onEditEntry(entry)}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-slate-700 dark:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-slate-700 font-semibold transition-colors cursor-pointer"
                            >
                              <Edit3 className="w-3 h-3" />
                              <span>Edit</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Weekly Recaps Spanning Selected Date */}
              {selectedWeeklyEntries.length > 0 && (
                <div className="pt-2 space-y-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="text-xs font-bold text-purple-800 dark:text-purple-300 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5" />
                    <span>Rekap Mingguan Mencakup Tanggal Ini ({selectedWeeklyEntries.length})</span>
                  </div>
                  {selectedWeeklyEntries.map(entry => (
                    <div
                      key={entry.id}
                      className="p-3 rounded-xl border border-purple-200/80 dark:border-purple-900/60 bg-purple-50/50 dark:bg-purple-950/25 space-y-1.5"
                    >
                      <div className="flex items-center justify-between text-[11px] text-purple-900 dark:text-purple-200 font-mono tabular-nums">
                        <span>
                          {formatDateDDMMYYYY(entry.tanggal)} –{' '}
                          {formatDateDDMMYYYY(entry.tanggalSelesai || entry.tanggal)}
                        </span>
                        <span>{formatDuration(entry.durasiMenit)}</span>
                      </div>
                      <p className="text-xs text-slate-700 dark:text-slate-300 line-clamp-2">
                        {entry.uraianAktivitas}
                      </p>
                      <div className="flex items-center justify-end gap-1 pt-1">
                        <button
                          type="button"
                          onClick={() => onViewEntry(entry)}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold text-purple-800 dark:text-purple-200 hover:bg-purple-100 dark:hover:bg-purple-900/50 cursor-pointer"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Detail</span>
                        </button>
                        {onEditEntry && (
                          <button
                            type="button"
                            onClick={() => onEditEntry(entry)}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold text-purple-800 dark:text-purple-200 hover:bg-purple-100 dark:hover:bg-purple-900/50 cursor-pointer"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>Edit</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Missing Workdays Quick Catch-Up Panel */}
          {periodStats.missingWorkdays.length > 0 && (
            <div className="bg-white dark:bg-slate-900/95 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100">
                  Hari Kerja Belum Terisi ({periodStats.missingWorkdays.length})
                </h4>
                <span className="text-[11px] text-amber-700 dark:text-amber-400 font-semibold">
                  {currentPeriod.label}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Klik tanggal di bawah untuk langsung melihat atau mengisi logbook yang terlewat.
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                {periodStats.missingWorkdays.slice(0, 8).map(dateStr => (
                  <button
                    key={dateStr}
                    type="button"
                    onClick={() => {
                      setSelectedDate(dateStr);
                      onAddEntryForDate(dateStr);
                    }}
                    className="flex items-center justify-between gap-1 px-2.5 py-1.5 rounded-lg bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/70 text-[11px] font-mono tabular-nums font-semibold text-amber-900 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors cursor-pointer"
                  >
                    <span>{formatDateDDMMYYYY(dateStr)}</span>
                    <Plus className="w-3 h-3 shrink-0" />
                  </button>
                ))}
              </div>
              {periodStats.missingWorkdays.length > 8 && (
                <p className="text-[11px] text-slate-400 dark:text-slate-500">
                  +{periodStats.missingWorkdays.length - 8} hari kerja lainnya di periode ini
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CalendarView;
