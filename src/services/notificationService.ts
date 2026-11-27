import { LogbookEntry, ReminderSettings } from '../types';
import { formatIndonesianDate, getTodayString, isStandardWorkday } from '../utils/dateUtils';

const REMINDER_STORAGE_KEY = 'maganghub_reminder_settings_v1';

const DEFAULT_SETTINGS: ReminderSettings = {
  enabled: false,
  time: '16:00',
  onlyWorkdays: true,
  lastNotifiedDate: undefined
};

export class NotificationService {
  static getSettings(): ReminderSettings {
    try {
      const raw = localStorage.getItem(REMINDER_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          ...DEFAULT_SETTINGS,
          ...parsed
        };
      }
    } catch (e) {
      console.error('Failed to read reminder settings', e);
    }
    return { ...DEFAULT_SETTINGS };
  }

  static saveSettings(settings: ReminderSettings): ReminderSettings {
    try {
      localStorage.setItem(REMINDER_STORAGE_KEY, JSON.stringify(settings));
    } catch (e) {
      console.error('Failed to save reminder settings', e);
    }
    return settings;
  }

  static getBrowserPermission(): NotificationPermission | 'unsupported' {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'unsupported';
    }
    return Notification.permission;
  }

  static async requestBrowserPermission(): Promise<NotificationPermission | 'unsupported'> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'unsupported';
    }
    try {
      const permission = await Notification.requestPermission();
      return permission;
    } catch (e) {
      console.error('Failed to request notification permission', e);
      return Notification.permission;
    }
  }

  static hasFilledToday(entries: LogbookEntry[]): boolean {
    const today = getTodayString();
    return entries.some(entry => {
      if (entry.tanggal === today) return true;
      if (entry.tipeLogbook === 'mingguan' && entry.tanggalSelesai) {
        return today >= entry.tanggal && today <= entry.tanggalSelesai;
      }
      return false;
    });
  }

  static isTodayWorkday(): boolean {
    return isStandardWorkday(getTodayString());
  }

  static shouldRemindToday(entries: LogbookEntry[], settings: ReminderSettings): boolean {
    if (!settings.enabled) return false;
    if (this.hasFilledToday(entries)) return false;
    if (settings.onlyWorkdays && !this.isTodayWorkday()) return false;
    return true;
  }

  static sendBrowserNotification(title: string, body: string): boolean {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return false;
    }
    if (Notification.permission !== 'granted') {
      return false;
    }
    try {
      new Notification(title, {
        body,
        tag: 'maganghub-daily-logbook-reminder'
      });
      return true;
    } catch (e) {
      console.error('Unable to display browser notification', e);
      return false;
    }
  }

  static isTimeReached(targetTime: string): boolean {
    const now = new Date();
    const [targetH, targetM] = (targetTime || '16:00').split(':').map(Number);
    if (isNaN(targetH) || isNaN(targetM)) return true;
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const targetMinutes = targetH * 60 + targetM;
    return nowMinutes >= targetMinutes;
  }

  static checkAndTriggerScheduledReminder(entries: LogbookEntry[]): boolean {
    const settings = this.getSettings();
    const today = getTodayString();

    if (!this.shouldRemindToday(entries, settings)) {
      return false;
    }

    if (settings.lastNotifiedDate === today) {
      return false;
    }

    if (!this.isTimeReached(settings.time)) {
      return false;
    }

    const sent = this.sendBrowserNotification(
      'Pengingat Logbook MagangHub',
      `Anda belum mengisi logbook hari ini (${formatIndonesianDate(today, true)}). Yuk catat aktivitas magang Anda sekarang!`
    );

    if (sent) {
      this.saveSettings({
        ...settings,
        lastNotifiedDate: today
      });
    }

    return sent;
  }
}
