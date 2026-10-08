import { Holiday } from '../types';

export const INDONESIAN_HOLIDAYS: Holiday[] = [
  // Tahun 2026
  { date: '2026-01-01', name: 'Tahun Baru 2026 Masehi', isCutiBersama: false },
  { date: '2026-01-16', name: 'Isra Mikraj Nabi Muhammad SAW', isCutiBersama: false },
  { date: '2026-02-17', name: 'Tahun Baru Imlek 2577 Kongzili', isCutiBersama: false },
  { date: '2026-02-18', name: 'Cuti Bersama Tahun Baru Imlek', isCutiBersama: true },
  { date: '2026-03-20', name: 'Hari Suci Nyepi Tahun Baru Saka 1948', isCutiBersama: false },
  { date: '2026-03-21', name: 'Hari Raya Idul Fitri 1447 Hijriah', isCutiBersama: false },
  { date: '2026-03-22', name: 'Hari Raya Idul Fitri 1447 Hijriah', isCutiBersama: false },
  { date: '2026-03-23', name: 'Cuti Bersama Idul Fitri 1447 H', isCutiBersama: true },
  { date: '2026-03-24', name: 'Cuti Bersama Idul Fitri 1447 H', isCutiBersama: true },
  { date: '2026-04-03', name: 'Wafat Yesus Kristus', isCutiBersama: false },
  { date: '2026-04-05', name: 'Kebangkitan Yesus Kristus (Paskah)', isCutiBersama: false },
  { date: '2026-05-01', name: 'Hari Buruh Internasional', isCutiBersama: false },
  { date: '2026-05-14', name: 'Kenaikan Yesus Kristus', isCutiBersama: false },
  { date: '2026-05-27', name: 'Hari Raya Idul Adha 1447 Hijriah', isCutiBersama: false },
  { date: '2026-05-31', name: 'Hari Raya Waisak 2570 BE', isCutiBersama: false },
  { date: '2026-06-01', name: 'Hari Lahir Pancasila', isCutiBersama: false },
  { date: '2026-06-16', name: 'Tahun Baru Islam 1448 Hijriah', isCutiBersama: false },
  { date: '2026-08-17', name: 'Hari Proklamasi Kemerdekaan RI ke-81', isCutiBersama: false },
  { date: '2026-08-25', name: 'Maulid Nabi Muhammad SAW', isCutiBersama: false },
  { date: '2026-12-25', name: 'Hari Raya Natal', isCutiBersama: false },
  { date: '2026-12-26', name: 'Cuti Bersama Hari Raya Natal', isCutiBersama: true },

  // Tahun 2025 (untuk riwayat logbook)
  { date: '2025-01-01', name: 'Tahun Baru 2025 Masehi', isCutiBersama: false },
  { date: '2025-01-27', name: 'Isra Mikraj Nabi Muhammad SAW', isCutiBersama: false },
  { date: '2025-01-29', name: 'Tahun Baru Imlek 2576 Kongzili', isCutiBersama: false },
  { date: '2025-03-29', name: 'Hari Suci Nyepi Saka 1947', isCutiBersama: false },
  { date: '2025-03-31', name: 'Hari Raya Idul Fitri 1446 Hijriah', isCutiBersama: false },
  { date: '2025-04-01', name: 'Hari Raya Idul Fitri 1446 Hijriah', isCutiBersama: false },
  { date: '2025-04-18', name: 'Wafat Yesus Kristus', isCutiBersama: false },
  { date: '2025-05-01', name: 'Hari Buruh Internasional', isCutiBersama: false },
  { date: '2025-05-12', name: 'Hari Raya Waisak 2569 BE', isCutiBersama: false },
  { date: '2025-05-29', name: 'Kenaikan Yesus Kristus', isCutiBersama: false },
  { date: '2025-06-01', name: 'Hari Lahir Pancasila', isCutiBersama: false },
  { date: '2025-06-07', name: 'Hari Raya Idul Adha 1446 Hijriah', isCutiBersama: false },
  { date: '2025-06-27', name: 'Tahun Baru Islam 1447 Hijriah', isCutiBersama: false },
  { date: '2025-08-17', name: 'Hari Kemerdekaan RI ke-80', isCutiBersama: false },
  { date: '2025-09-05', name: 'Maulid Nabi Muhammad SAW', isCutiBersama: false },
  { date: '2025-12-25', name: 'Hari Raya Natal', isCutiBersama: false }
];

export function getHolidayInfo(dateStr: string): Holiday | undefined {
  return INDONESIAN_HOLIDAYS.find(h => h.date === dateStr);
}

export function isHoliday(dateStr: string): boolean {
  return INDONESIAN_HOLIDAYS.some(h => h.date === dateStr);
}

export function isWeekend(dateStr: string): boolean {
  const d = new Date(dateStr + 'T00:00:00');
  const day = d.getDay();
  return day === 0 || day === 6; // 0 Minggu, 6 Sabtu
}

export function isWorkday(dateStr: string): boolean {
  return !isWeekend(dateStr) && !isHoliday(dateStr);
}

export function countEffectiveWorkdaysInMonth(year: number, month: number): number {
  const daysInMonth = new Date(year, month, 0).getDate();
  let count = 0;
  for (let day = 1; day <= daysInMonth; day++) {
    const dayStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    if (isWorkday(dayStr)) {
      count++;
    }
  }
  return count;
}
