import { MagangPeriod } from '../types';
import { getHolidayInfo, isWeekend } from '../data/holidays';

export const NAMA_BULAN = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export const NAMA_BULAN_SINGKAT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
];

export const NAMA_HARI = [
  'Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'
];

/**
 * Menghasilkan 6 periode magang dimulai dari 10 Agustus hingga 9 Februari tahun berikutnya.
 * Periode 1: 10 Agustus - 9 September
 * Periode 2: 10 September - 9 Oktober
 * Periode 3: 10 Oktober - 9 November
 * Periode 4: 10 November - 9 Desember
 * Periode 5: 10 Desember - 9 Januari
 * Periode 6: 10 Januari - 9 Februari
 */
export function getMagangPeriods(startYear = 2026): MagangPeriod[] {
  const periods: MagangPeriod[] = [];
  // Month indices (0-based): 7 = Agustus
  const baseMonthIndex = 7;

  for (let i = 0; i < 6; i++) {
    const startTotalMonths = startYear * 12 + baseMonthIndex + i;
    const endTotalMonths = startTotalMonths + 1;

    const sYear = Math.floor(startTotalMonths / 12);
    const sMonth = startTotalMonths % 12; // 0..11
    const eYear = Math.floor(endTotalMonths / 12);
    const eMonth = endTotalMonths % 12; // 0..11

    const startDate = `${sYear}-${String(sMonth + 1).padStart(2, '0')}-10`;
    const endDate = `${eYear}-${String(eMonth + 1).padStart(2, '0')}-09`;

    const sameYear = sYear === eYear;
    const shortRange = sameYear
      ? `10 ${NAMA_BULAN_SINGKAT[sMonth]} – 9 ${NAMA_BULAN_SINGKAT[eMonth]} ${eYear}`
      : `10 ${NAMA_BULAN_SINGKAT[sMonth]} ${sYear} – 9 ${NAMA_BULAN_SINGKAT[eMonth]} ${eYear}`;

    const fullRange = sameYear
      ? `10 ${NAMA_BULAN[sMonth]} – 9 ${NAMA_BULAN[eMonth]} ${eYear}`
      : `10 ${NAMA_BULAN[sMonth]} ${sYear} – 9 ${NAMA_BULAN[eMonth]} ${eYear}`;

    periods.push({
      id: i + 1,
      label: `Periode ${i + 1}`,
      shortRange,
      fullRange,
      startDate,
      endDate
    });
  }

  return periods;
}

export const MAGANG_PERIODS: MagangPeriod[] = getMagangPeriods(2026);

export function getPeriodById(id: number): MagangPeriod {
  return MAGANG_PERIODS.find(p => p.id === id) || MAGANG_PERIODS[0];
}

export function isDateInPeriod(dateStr: string, period: MagangPeriod): boolean {
  if (!dateStr) return false;
  return dateStr >= period.startDate && dateStr <= period.endDate;
}

export function getPeriodForDate(dateStr: string): MagangPeriod | null {
  if (!dateStr) return null;
  return MAGANG_PERIODS.find(p => isDateInPeriod(dateStr, p)) || null;
}

export function getDefaultPeriodId(): number {
  const today = getTodayString();
  const matched = getPeriodForDate(today);
  return matched ? matched.id : 1;
}

export function getDatesInRange(startDate: string, endDate: string): string[] {
  const dates: string[] = [];
  const [sy, sm, sd] = startDate.split('-').map(Number);
  const [ey, em, ed] = endDate.split('-').map(Number);
  const current = new Date(sy, sm - 1, sd);
  const end = new Date(ey, em - 1, ed);

  while (current <= end) {
    const y = current.getFullYear();
    const m = String(current.getMonth() + 1).padStart(2, '0');
    const d = String(current.getDate()).padStart(2, '0');
    dates.push(`${y}-${m}-${d}`);
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

export function getDayOfWeek(dateStr: string): number {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).getDay();
}

export function getDayName(dateStr: string): string {
  if (!dateStr) return '';
  return NAMA_HARI[getDayOfWeek(dateStr)] || '';
}

/**
 * Hari kerja standar adalah Senin-Jumat dan bukan hari libur nasional.
 */
export function isStandardWorkday(dateStr: string): boolean {
  if (!dateStr) return true;
  if (isWeekend(dateStr)) return false;
  if (getHolidayInfo(dateStr)) return false;
  return true;
}

export function countWorkdaysInPeriod(period: MagangPeriod): number {
  return getDatesInRange(period.startDate, period.endDate).filter(d => isStandardWorkday(d)).length;
}

/**
 * Mengembalikan jam kerja standar berdasarkan hari:
 * - Senin s.d. Kamis: 07:30 - 16:00 (510 menit / 8.5 jam)
 * - Jumat: 07:30 - 16:30 (540 menit / 9 jam)
 * - Sabtu/Minggu (jika kegiatan luar hari kerja): default 07:30 - 16:00 (510 menit)
 */
export function getDefaultWorkHours(dateStr: string): {
  jamMulai: string;
  jamSelesai: string;
  durasiMenit: number;
  scheduleLabel: string;
} {
  const dow = dateStr ? getDayOfWeek(dateStr) : 1;
  if (dow === 5) {
    return {
      jamMulai: '07:30',
      jamSelesai: '16:30',
      durasiMenit: 540,
      scheduleLabel: 'Jam Kerja Jumat (07:30 – 16:30)'
    };
  }
  if (dow >= 1 && dow <= 4) {
    return {
      jamMulai: '07:30',
      jamSelesai: '16:00',
      durasiMenit: 510,
      scheduleLabel: 'Jam Kerja Senin–Kamis (07:30 – 16:00)'
    };
  }
  return {
    jamMulai: '07:30',
    jamSelesai: '16:00',
    durasiMenit: 510,
    scheduleLabel: 'Kegiatan Luar Hari Kerja (Default 07:30 – 16:00)'
  };
}

export function getTodayString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatDateDDMMYYYY(dateStr?: string): string {
  if (!dateStr) return '-';
  const clean = dateStr.trim();
  const isoMatch = clean.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    return `${isoMatch[3]}/${isoMatch[2]}/${isoMatch[1]}`;
  }
  const ddmmyyyyMatch = clean.match(/^(\d{2})[/-](\d{2})[/-](\d{4})$/);
  if (ddmmyyyyMatch) {
    return `${ddmmyyyyMatch[1]}/${ddmmyyyyMatch[2]}/${ddmmyyyyMatch[3]}`;
  }
  return clean;
}

export function parseDDMMYYYYToISO(input: string): string | null {
  const clean = (input || '').trim();
  if (!clean) return null;

  // Support YYYY-MM-DD passthrough
  const isoMatch = clean.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    const y = Number(isoMatch[1]);
    const m = Number(isoMatch[2]);
    const d = Number(isoMatch[3]);
    const check = new Date(y, m - 1, d);
    if (check.getFullYear() === y && check.getMonth() === m - 1 && check.getDate() === d) {
      return clean;
    }
    return null;
  }

  let dayStr = '';
  let monthStr = '';
  let yearStr = '';

  const sepMatch = clean.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (sepMatch) {
    dayStr = sepMatch[1].padStart(2, '0');
    monthStr = sepMatch[2].padStart(2, '0');
    yearStr = sepMatch[3];
  } else if (/^\d{8}$/.test(clean)) {
    dayStr = clean.slice(0, 2);
    monthStr = clean.slice(2, 4);
    yearStr = clean.slice(4, 8);
  } else {
    return null;
  }

  const d = Number(dayStr);
  const m = Number(monthStr);
  const y = Number(yearStr);
  if (y < 1900 || y > 2100 || m < 1 || m > 12 || d < 1 || d > 31) return null;

  const check = new Date(y, m - 1, d);
  if (check.getFullYear() !== y || check.getMonth() !== m - 1 || check.getDate() !== d) {
    return null;
  }

  return `${yearStr}-${monthStr}-${dayStr}`;
}

export function formatMaskedDDMMYYYY(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

export function getWeekRangeForDate(dateStr?: string): { startDate: string; endDate: string } {
  const baseStr = dateStr && /^\d{4}-\d{2}-\d{2}$/.test(dateStr) ? dateStr : getTodayString();
  const [y, m, d] = baseStr.split('-').map(Number);
  const dateObj = new Date(y, m - 1, d);
  const dow = dateObj.getDay(); // 0 = Sun, 1 = Mon, ... 6 = Sat
  const diffToMonday = dow === 0 ? -6 : 1 - dow;

  const monday = new Date(dateObj);
  monday.setDate(dateObj.getDate() + diffToMonday);

  const friday = new Date(monday);
  friday.setDate(monday.getDate() + 4);

  const toISO = (dt: Date) =>
    `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;

  return {
    startDate: toISO(monday),
    endDate: toISO(friday)
  };
}

export function formatIndonesianDate(dateStr: string, includeDay = true): string {
  if (!dateStr) return '-';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;

  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);

  const dateObj = new Date(year, month, day);
  const dayName = NAMA_HARI[dateObj.getDay()];
  const formattedNumeric = `${String(day).padStart(2, '0')}/${String(month + 1).padStart(2, '0')}/${year}`;

  if (includeDay) {
    return `${dayName}, ${formattedNumeric}`;
  }
  return formattedNumeric;
}

export function formatShortDate(dateStr: string): string {
  if (!dateStr) return '-';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const day = parseInt(parts[2], 10);
  const month = parseInt(parts[1], 10) - 1;
  return `${day} ${NAMA_BULAN_SINGKAT[month] || ''}`;
}

export function calculateDurationMinutes(start: string, end: string): number {
  if (!start || !end) return 0;
  const [startH, startM] = start.split(':').map(Number);
  const [endH, endM] = end.split(':').map(Number);

  if (isNaN(startH) || isNaN(startM) || isNaN(endH) || isNaN(endM)) return 0;

  const startTotal = startH * 60 + startM;
  const endTotal = endH * 60 + endM;

  if (endTotal < startTotal) return 0;
  return endTotal - startTotal;
}

export function formatDuration(minutes: number): string {
  if (!minutes || minutes <= 0) return '0 menit';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours > 0 && mins > 0) {
    return `${hours} jam ${mins} mnt`;
  }
  if (hours > 0) {
    return `${hours} jam`;
  }
  return `${mins} menit`;
}

export function minutesToDecimalHours(minutes: number): number {
  return parseFloat((minutes / 60).toFixed(1));
}
