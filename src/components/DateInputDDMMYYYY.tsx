import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react';
import {
  formatDateDDMMYYYY,
  formatMaskedDDMMYYYY,
  getDatesInRange,
  getDayOfWeek,
  getDefaultPeriodId,
  getPeriodById,
  getPeriodForDate,
  getTodayString,
  MAGANG_PERIODS,
  NAMA_BULAN,
  NAMA_BULAN_SINGKAT,
  parseDDMMYYYYToISO
} from '../utils/dateUtils';
import { getHolidayInfo, isWeekend } from '../data/holidays';

interface DateInputDDMMYYYYProps {
  value: string; // ISO YYYY-MM-DD
  onChange: (isoDate: string) => void;
  placeholder?: string;
  className?: string;
  hasError?: boolean;
  ariaLabel?: string;
  /** Optional set of ISO dates (YYYY-MM-DD) that already have logbook entries */
  loggedDates?: Set<string>;
  /** Optional weekly range highlight (ISO YYYY-MM-DD) */
  rangeStart?: string;
  rangeEnd?: string;
}

const WEEKDAY_LABELS = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

function toMonIndex(dateStr: string): number {
  const dow = getDayOfWeek(dateStr);
  return dow === 0 ? 6 : dow - 1;
}

function addDaysISO(dateStr: string, offset: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d + offset);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
}

export const DateInputDDMMYYYY: React.FC<DateInputDDMMYYYYProps> = ({
  value,
  onChange,
  placeholder = 'DD/MM/YYYY',
  className = '',
  hasError = false,
  ariaLabel = 'Tanggal (DD/MM/YYYY)',
  loggedDates,
  rangeStart,
  rangeEnd
}) => {
  const [displayText, setDisplayText] = useState<string>(() =>
    value ? formatDateDDMMYYYY(value) : ''
  );
  const [localInvalid, setLocalInvalid] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [pickerMode, setPickerMode] = useState<'periode' | 'bulan'>('periode');
  const [activePeriodId, setActivePeriodId] = useState<number>(() => {
    const matched = value ? getPeriodForDate(value) : null;
    return matched ? matched.id : getDefaultPeriodId();
  });

  // Fallback month view state (for dates outside Periode 1–6)
  const [viewYearMonth, setViewYearMonth] = useState<{ year: number; month: number }>(() => {
    const base = value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : getTodayString();
    const [y, m] = base.split('-').map(Number);
    return { year: y, month: m - 1 };
  });

  const containerRef = useRef<HTMLDivElement | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);
  const [popoverStyle, setPopoverStyle] = useState<React.CSSProperties>({});

  const todayStr = getTodayString();

  useEffect(() => {
    setDisplayText(value ? formatDateDDMMYYYY(value) : '');
    setLocalInvalid(false);
  }, [value]);

  // Synchronize displayed period/month automatically whenever popover opens or value changes
  const syncViewToValue = useCallback((isoDate?: string) => {
    const target = isoDate && /^\d{4}-\d{2}-\d{2}$/.test(isoDate) ? isoDate : getTodayString();
    const matchedPeriod = getPeriodForDate(target);
    if (matchedPeriod) {
      setActivePeriodId(matchedPeriod.id);
      setPickerMode('periode');
    } else {
      setActivePeriodId(getDefaultPeriodId());
      setPickerMode('periode');
    }
    const [y, m] = target.split('-').map(Number);
    setViewYearMonth({ year: y, month: m - 1 });
  }, []);

  const updatePopoverPosition = useCallback(() => {
    const anchor = containerRef.current;
    if (!anchor) return;
    const rect = anchor.getBoundingClientRect();
    const viewportW = window.innerWidth;
    const viewportH = window.innerHeight;
    const width = Math.min(340, viewportW - 24);
    const estimatedHeight = 376;

    const spaceBelow = viewportH - rect.bottom;
    const openAbove = spaceBelow < estimatedHeight && rect.top > estimatedHeight;

    let left = rect.left;
    if (left + width > viewportW - 12) {
      left = Math.max(12, viewportW - width - 12);
    }

    const top = openAbove
      ? Math.max(12, rect.top - estimatedHeight - 6)
      : Math.min(viewportH - estimatedHeight - 12, rect.bottom + 6);

    setPopoverStyle({
      position: 'fixed',
      top,
      left,
      width,
      zIndex: 120
    });
  }, []);

  const openPicker = () => {
    syncViewToValue(value);
    updatePopoverPosition();
    setIsOpen(true);
  };

  const togglePicker = () => {
    if (isOpen) {
      setIsOpen(false);
    } else {
      openPicker();
    }
  };

  // Reposition on scroll/resize and close on Escape or outside click
  useEffect(() => {
    if (!isOpen) return;

    updatePopoverPosition();

    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        containerRef.current?.contains(target) ||
        popoverRef.current?.contains(target)
      ) {
        return;
      }
      setIsOpen(false);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    const handleReposition = () => updatePopoverPosition();

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', handleReposition);
    window.addEventListener('scroll', handleReposition, true);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleReposition);
      window.removeEventListener('scroll', handleReposition, true);
    };
  }, [isOpen, updatePopoverPosition]);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;

    if (!raw.trim()) {
      setDisplayText('');
      setLocalInvalid(false);
      onChange('');
      return;
    }

    const masked = formatMaskedDDMMYYYY(raw);
    setDisplayText(masked);

    if (masked.length === 10) {
      const iso = parseDDMMYYYYToISO(masked);
      if (iso) {
        setLocalInvalid(false);
        onChange(iso);
        const matched = getPeriodForDate(iso);
        if (matched) setActivePeriodId(matched.id);
      } else {
        setLocalInvalid(true);
      }
    } else {
      setLocalInvalid(false);
    }
  };

  const handleBlur = () => {
    if (!displayText.trim()) {
      setLocalInvalid(false);
      return;
    }
    const iso = parseDDMMYYYYToISO(displayText);
    if (iso) {
      setDisplayText(formatDateDDMMYYYY(iso));
      setLocalInvalid(false);
      if (iso !== value) {
        onChange(iso);
      }
    } else {
      setLocalInvalid(true);
    }
  };

  const handleSelectDate = (isoDate: string) => {
    setDisplayText(formatDateDDMMYYYY(isoDate));
    setLocalInvalid(false);
    onChange(isoDate);
    setIsOpen(false);
  };

  const activePeriod = useMemo(() => getPeriodById(activePeriodId), [activePeriodId]);

  // Build Monday-first calendar cells for either Periode mode or Bulan mode
  const calendarCells = useMemo(() => {
    let rangeDates: string[] = [];
    let periodStart = '';

    if (pickerMode === 'periode') {
      rangeDates = getDatesInRange(activePeriod.startDate, activePeriod.endDate);
      periodStart = activePeriod.startDate;
    } else {
      const { year, month } = viewYearMonth;
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const start = `${year}-${String(month + 1).padStart(2, '0')}-01`;
      const end = `${year}-${String(month + 1).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`;
      rangeDates = getDatesInRange(start, end);
      periodStart = start;
    }

    if (rangeDates.length === 0) return [];

    const startMon = toMonIndex(rangeDates[0]);
    const endMon = toMonIndex(rangeDates[rangeDates.length - 1]);

    const allDates: Array<{ dateStr: string; inRange: boolean }> = [];
    for (let i = startMon; i > 0; i--) {
      allDates.push({ dateStr: addDaysISO(rangeDates[0], -i), inRange: false });
    }
    rangeDates.forEach(d => allDates.push({ dateStr: d, inRange: true }));
    for (let i = 1; i <= 6 - endMon; i++) {
      allDates.push({ dateStr: addDaysISO(rangeDates[rangeDates.length - 1], i), inRange: false });
    }

    return allDates.map(({ dateStr, inRange }) => {
      const [, mStr, dStr] = dateStr.split('-');
      const dayNum = parseInt(dStr, 10);
      const monthIdx = parseInt(mStr, 10) - 1;
      const showMonthTag =
        pickerMode === 'periode' &&
        inRange &&
        (dayNum === 1 || dateStr === periodStart);

      return {
        dateStr,
        dayNum,
        monthTag: showMonthTag ? NAMA_BULAN_SINGKAT[monthIdx] : null,
        inRange,
        isWeekendDay: isWeekend(dateStr),
        holiday: getHolidayInfo(dateStr),
        hasEntry: loggedDates?.has(dateStr) || false
      };
    });
  }, [pickerMode, activePeriod, viewYearMonth, loggedDates]);

  const shiftMonth = (delta: number) => {
    setViewYearMonth(prev => {
      const dt = new Date(prev.year, prev.month + delta, 1);
      return { year: dt.getFullYear(), month: dt.getMonth() };
    });
  };

  const popoverNode = isOpen
    ? createPortal(
        <div
          ref={popoverRef}
          style={popoverStyle}
          onClick={(e) => e.stopPropagation()}
          className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 select-none"
        >
          {/* Popover Header */}
          <div
            className="px-3.5 py-2.5 text-white flex items-center justify-between gap-2"
            style={{ backgroundColor: 'var(--theme-header-bg)' }}
          >
            <div className="min-w-0">
              <div className="text-xs font-bold leading-tight truncate">
                {pickerMode === 'periode'
                  ? `Kalender ${activePeriod.label}`
                  : `${NAMA_BULAN[viewYearMonth.month]} ${viewYearMonth.year}`}
              </div>
              <div className="text-[10px] text-slate-300 truncate mt-0.5 tabular-nums">
                {pickerMode === 'periode'
                  ? `${formatDateDDMMYYYY(activePeriod.startDate)} – ${formatDateDDMMYYYY(activePeriod.endDate)}`
                  : 'Mode Kalender Bulanan'}
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <div className="flex items-center bg-white/10 p-0.5 rounded-lg text-[10px] font-bold">
                <button
                  type="button"
                  onClick={() => setPickerMode('periode')}
                  className={`px-2 py-0.5 rounded-md transition-colors cursor-pointer ${
                    pickerMode === 'periode'
                      ? 'bg-white text-slate-900'
                      : 'text-slate-200 hover:text-white'
                  }`}
                >
                  Periode
                </button>
                <button
                  type="button"
                  onClick={() => setPickerMode('bulan')}
                  className={`px-2 py-0.5 rounded-md transition-colors cursor-pointer ${
                    pickerMode === 'bulan'
                      ? 'bg-white text-slate-900'
                      : 'text-slate-200 hover:text-white'
                  }`}
                >
                  Bulan
                </button>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-md text-slate-300 hover:text-white hover:bg-white/10 cursor-pointer"
                aria-label="Tutup kalender"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Period / Month Navigation Bar */}
          <div className="px-3 py-2 bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-800 space-y-2">
            {pickerMode === 'periode' ? (
              <>
                <div className="flex items-center justify-between gap-1">
                  <button
                    type="button"
                    disabled={activePeriodId === 1}
                    onClick={() => setActivePeriodId(p => Math.max(1, p - 1))}
                    className="p-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white disabled:opacity-40 cursor-pointer"
                    title="Periode sebelumnya"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>

                  <span className="text-[11px] font-bold text-slate-800 dark:text-slate-100 text-center truncate">
                    {activePeriod.shortRange}
                  </span>

                  <button
                    type="button"
                    disabled={activePeriodId === MAGANG_PERIODS.length}
                    onClick={() => setActivePeriodId(p => Math.min(MAGANG_PERIODS.length, p + 1))}
                    className="p-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white disabled:opacity-40 cursor-pointer"
                    title="Periode berikutnya"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Quick Periode 1–6 Switcher */}
                <div className="grid grid-cols-6 gap-1">
                  {MAGANG_PERIODS.map(p => {
                    const isSelectedP = p.id === activePeriodId;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setActivePeriodId(p.id)}
                        title={`${p.label}: ${p.fullRange}`}
                        className={`py-1 rounded-md text-[10px] font-bold transition-colors cursor-pointer ${
                          isSelectedP
                            ? 'text-white shadow-2xs'
                            : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600'
                        }`}
                        style={isSelectedP ? { backgroundColor: 'var(--theme-primary)' } : undefined}
                      >
                        P{p.id}
                      </button>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-between gap-1">
                <button
                  type="button"
                  onClick={() => shiftMonth(-1)}
                  className="p-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                  title="Bulan sebelumnya"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>

                <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                  {NAMA_BULAN[viewYearMonth.month]} {viewYearMonth.year}
                </span>

                <button
                  type="button"
                  onClick={() => shiftMonth(1)}
                  className="p-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                  title="Bulan berikutnya"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Weekday Headers (Senin–Minggu) */}
          <div className="grid grid-cols-7 px-2.5 pt-2 pb-1 text-center text-[10px] font-bold text-slate-500 dark:text-slate-400">
            {WEEKDAY_LABELS.map((label, idx) => (
              <div
                key={label}
                className={idx >= 5 ? 'text-rose-500 dark:text-rose-400' : ''}
              >
                {label}
              </div>
            ))}
          </div>

          {/* Date Cells */}
          <div className="grid grid-cols-7 gap-0.5 px-2.5 pb-2.5">
            {calendarCells.map(cell => {
              const isSelected = value === cell.dateStr;
              const isToday = cell.dateStr === todayStr;
              const isInSelectedWeekRange =
                Boolean(rangeStart && rangeEnd) &&
                cell.dateStr >= rangeStart! &&
                cell.dateStr <= rangeEnd!;

              const tooltipParts = [formatDateDDMMYYYY(cell.dateStr)];
              if (cell.holiday) tooltipParts.push(cell.holiday.name);
              else if (cell.isWeekendDay) tooltipParts.push('Akhir Pekan');
              if (cell.hasEntry) tooltipParts.push('Sudah ada logbook');

              return (
                <button
                  key={cell.dateStr}
                  type="button"
                  onClick={() => handleSelectDate(cell.dateStr)}
                  title={tooltipParts.join(' · ')}
                  className={`relative h-9 rounded-lg flex flex-col items-center justify-center text-xs tabular-nums transition-all cursor-pointer ${
                    isSelected
                      ? 'text-white font-bold shadow-xs'
                      : isInSelectedWeekRange
                      ? 'bg-purple-100/80 dark:bg-purple-950/60 text-purple-900 dark:text-purple-200 font-semibold'
                      : !cell.inRange
                      ? 'text-slate-300 dark:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                      : cell.holiday
                      ? 'bg-rose-50/70 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 font-bold hover:bg-rose-100/70 dark:hover:bg-rose-950/50'
                      : cell.isWeekendDay
                      ? 'text-rose-500 dark:text-rose-400/90 hover:bg-slate-100 dark:hover:bg-slate-800'
                      : 'text-slate-800 dark:text-slate-200 font-medium hover:bg-slate-100 dark:hover:bg-slate-800'
                  } ${
                    isToday && !isSelected
                      ? 'ring-1 ring-[var(--theme-accent)] font-bold'
                      : ''
                  }`}
                  style={isSelected ? { backgroundColor: 'var(--theme-primary)' } : undefined}
                >
                  {cell.monthTag && (
                    <span
                      className={`text-[8px] font-bold leading-none uppercase tracking-tight ${
                        isSelected ? 'text-white/85' : 'text-slate-400 dark:text-slate-500'
                      }`}
                    >
                      {cell.monthTag}
                    </span>
                  )}
                  <span className="leading-none">{cell.dayNum}</span>
                  {cell.hasEntry && (
                    <span
                      className={`w-1.5 h-1.5 rounded-full mt-0.5 ${
                        isSelected ? 'bg-white' : 'bg-emerald-500'
                      }`}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Popover Footer */}
          <div className="px-3 py-2 bg-slate-50 dark:bg-slate-800/70 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 text-[10px]">
            <div className="flex items-center gap-2.5 text-slate-500 dark:text-slate-400">
              {loggedDates && (
                <span className="inline-flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>Terisi</span>
                </span>
              )}
              <span className="inline-flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                <span>Libur/Akhir Pekan</span>
              </span>
            </div>

            <button
              type="button"
              onClick={() => handleSelectDate(todayStr)}
              className="font-bold hover:underline cursor-pointer shrink-0"
              style={{ color: 'var(--theme-accent)' }}
            >
              Hari Ini ({formatDateDDMMYYYY(todayStr)})
            </button>
          </div>
        </div>,
        document.body
      )
    : null;

  return (
    <div ref={containerRef} className="relative flex items-center">
      <input
        type="text"
        inputMode="numeric"
        maxLength={10}
        value={displayText}
        onChange={handleTextChange}
        onBlur={handleBlur}
        onClick={() => {
          if (!isOpen) openPicker();
        }}
        placeholder={placeholder}
        aria-label={ariaLabel}
        className={`w-full pr-10 px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-lg font-mono font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-800 focus:ring-1 focus:ring-[var(--theme-accent)] focus:outline-hidden ${
          hasError || localInvalid
            ? 'border-rose-500 dark:border-rose-500'
            : isOpen
            ? 'border-[var(--theme-accent)] ring-1 ring-[var(--theme-accent)]'
            : 'border-slate-300 dark:border-slate-700'
        } ${className}`}
      />

      <button
        type="button"
        onClick={togglePicker}
        className={`absolute right-1.5 p-1.5 rounded-md transition-colors cursor-pointer ${
          isOpen
            ? 'text-white shadow-2xs'
            : 'text-slate-500 dark:text-slate-400 hover:text-[var(--theme-accent)] hover:bg-slate-200/70 dark:hover:bg-slate-700/70'
        }`}
        style={isOpen ? { backgroundColor: 'var(--theme-primary)' } : undefined}
        title="Buka Kalender Periode"
        aria-label="Buka Kalender Periode"
        aria-expanded={isOpen}
      >
        <Calendar className="w-4 h-4" />
      </button>

      {popoverNode}
    </div>
  );
};

export default DateInputDDMMYYYY;
