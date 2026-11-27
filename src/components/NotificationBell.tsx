import React, { useState, useRef, useEffect } from 'react';
import {
  Bell,
  BellOff,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Send,
  CalendarCheck,
  Plus
} from 'lucide-react';
import { LogbookEntry, ReminderSettings } from '../types';
import { NotificationService } from '../services/notificationService';
import { formatIndonesianDate, getTodayString } from '../utils/dateUtils';

interface NotificationBellProps {
  entries: LogbookEntry[];
  settings: ReminderSettings;
  onUpdateSettings: (next: ReminderSettings) => void;
  onOpenNewLogbookToday: () => void;
  onNotifyFeedback?: (message: string, type?: 'success' | 'info' | 'error') => void;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({
  entries,
  settings,
  onUpdateSettings,
  onOpenNewLogbookToday,
  onNotifyFeedback
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>(
    NotificationService.getBrowserPermission()
  );
  const containerRef = useRef<HTMLDivElement>(null);

  const todayStr = getTodayString();
  const hasFilledToday = NotificationService.hasFilledToday(entries);
  const isWorkdayToday = NotificationService.isTodayWorkday();
  const needsAttentionToday = NotificationService.shouldRemindToday(entries, settings);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggleEnabled = async () => {
    const nextEnabled = !settings.enabled;

    if (nextEnabled) {
      const perm = await NotificationService.requestBrowserPermission();
      setPermission(perm);
      const updated = NotificationService.saveSettings({
        ...settings,
        enabled: true
      });
      onUpdateSettings(updated);

      if (perm === 'granted') {
        onNotifyFeedback?.('Pengingat harian logbook aktif dengan notifikasi browser.', 'success');
      } else {
        onNotifyFeedback?.('Pengingat harian aktif di aplikasi (banner pengingat otomatis).', 'info');
      }
    } else {
      const updated = NotificationService.saveSettings({
        ...settings,
        enabled: false
      });
      onUpdateSettings(updated);
      onNotifyFeedback?.('Pengingat harian logbook dinonaktifkan.', 'info');
    }
  };

  const handleTimeChange = (newTime: string) => {
    const updated = NotificationService.saveSettings({
      ...settings,
      time: newTime
    });
    onUpdateSettings(updated);
  };

  const handleOnlyWorkdaysToggle = () => {
    const updated = NotificationService.saveSettings({
      ...settings,
      onlyWorkdays: !settings.onlyWorkdays
    });
    onUpdateSettings(updated);
  };

  const handleTestNotification = async () => {
    const perm = await NotificationService.requestBrowserPermission();
    setPermission(perm);

    if (perm === 'granted') {
      const ok = NotificationService.sendBrowserNotification(
        'Tes Pengingat Logbook MagangHub',
        hasFilledToday
          ? 'Mantap! Logbook hari ini sudah tercatat.'
          : `Pengingat: Anda belum mengisi logbook untuk ${formatIndonesianDate(todayStr, true)}.`
      );
      if (ok) {
        onNotifyFeedback?.('Notifikasi uji coba berhasil dikirim ke perangkat Anda.', 'success');
        return;
      }
    }

    onNotifyFeedback?.(
      hasFilledToday
        ? 'Status hari ini: Logbook sudah terisi.'
        : `Pengingat: Anda belum mengisi logbook hari ini (${formatIndonesianDate(todayStr, true)}).`,
      'info'
    );
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        className={`relative p-2 rounded-xl border transition-all cursor-pointer ${
          settings.enabled
            ? 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700'
            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
        }`}
        title={
          settings.enabled
            ? needsAttentionToday
              ? 'Pengingat Aktif: Anda belum mengisi logbook hari ini'
              : 'Pengingat Logbook Harian Aktif'
            : 'Aktifkan Notifikasi Pengingat Logbook'
        }
      >
        {settings.enabled ? (
          <Bell className="w-4 h-4" style={{ color: needsAttentionToday ? '#D97706' : 'var(--theme-accent)' }} />
        ) : (
          <BellOff className="w-4 h-4" />
        )}

        {needsAttentionToday && (
          <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500 border border-white dark:border-slate-900"></span>
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-4 z-50 space-y-3.5 text-xs animate-in fade-in zoom-in-95 duration-150">
          {/* Header & Main Switch */}
          <div className="flex items-start justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-1.5">
                <Bell className="w-4 h-4" style={{ color: 'var(--theme-accent)' }} />
                <span>Pengingat Logbook Harian</span>
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Ingatkan otomatis jika logbook hari ini belum diisi.
              </p>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={settings.enabled}
              onClick={handleToggleEnabled}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-hidden ${
                settings.enabled ? '' : 'bg-slate-200 dark:bg-slate-700'
              }`}
              style={settings.enabled ? { backgroundColor: 'var(--theme-accent)' } : undefined}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ${
                  settings.enabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Today's Status Card */}
          <div
            className={`p-3 rounded-xl border flex items-start gap-2.5 ${
              hasFilledToday
                ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/80 text-emerald-900 dark:text-emerald-200'
                : !isWorkdayToday
                ? 'bg-slate-50 dark:bg-slate-800/70 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                : 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/80 text-amber-900 dark:text-amber-200'
            }`}
          >
            {hasFilledToday ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            ) : !isWorkdayToday ? (
              <CalendarCheck className="w-4 h-4 text-slate-500 dark:text-slate-400 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            )}

            <div className="space-y-1 flex-1">
              <div className="font-bold leading-snug">
                {hasFilledToday
                  ? 'Logbook hari ini sudah terisi'
                  : !isWorkdayToday
                  ? 'Hari ini di luar hari kerja (Senin–Jumat)'
                  : 'Anda belum mengisi logbook hari ini'}
              </div>
              <div className="text-[11px] opacity-80">
                {formatIndonesianDate(todayStr, true)}
              </div>
              {!hasFilledToday && (
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    onOpenNewLogbookToday();
                  }}
                  className="mt-1.5 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold text-white shadow-2xs cursor-pointer"
                  style={{ backgroundColor: 'var(--theme-primary)' }}
                >
                  <Plus className="w-3 h-3" />
                  <span>Isi Logbook Hari Ini</span>
                </button>
              )}
            </div>
          </div>

          {/* Schedule Settings */}
          <div className="space-y-2.5 pt-1">
            <div className="flex items-center justify-between gap-2">
              <label className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Jam Pengingat</span>
              </label>
              <input
                type="time"
                value={settings.time}
                onChange={(e) => handleTimeChange(e.target.value)}
                className="px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 font-mono text-xs focus:outline-hidden"
              />
            </div>

            <label className="flex items-center gap-2 cursor-pointer select-none text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={settings.onlyWorkdays}
                onChange={handleOnlyWorkdaysToggle}
                className="rounded border-slate-300 dark:border-slate-600 accent-[var(--theme-accent)]"
              />
              <span>Hanya ingatkan pada hari kerja (Senin–Jumat)</span>
            </label>
          </div>

          {/* Footer Permission & Test */}
          <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
            <span className="text-[10px] text-slate-500 dark:text-slate-400">
              Browser:{' '}
              <strong className={permission === 'granted' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-300'}>
                {permission === 'granted'
                  ? 'Diizinkan'
                  : permission === 'denied'
                  ? 'Diblokir (pakai banner)'
                  : permission === 'unsupported'
                  ? 'Pakai banner'
                  : 'Belum diminta'}
              </strong>
            </span>

            <button
              type="button"
              onClick={handleTestNotification}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-[11px] transition-colors cursor-pointer"
            >
              <Send className="w-3 h-3" />
              <span>Tes Notifikasi</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
