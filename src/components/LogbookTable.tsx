import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, 
  ExternalLink, 
  Edit3, 
  Trash2, 
  Copy, 
  Eye, 
  CheckCircle2, 
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Filter,
  X,
  Plus,
  RefreshCw,
  LayoutList,
  Calendar,
  Image as ImageIcon
} from 'lucide-react';
import { AuthUser, LogbookEntry } from '../types';
import {
  formatDateDDMMYYYY,
  formatIndonesianDate,
  getDefaultPeriodId,
  getPeriodById,
  isDateInPeriod,
  isStandardWorkday,
  MAGANG_PERIODS
} from '../utils/dateUtils';
import { IntegrationService } from '../services/integrationService';
import { UserService } from '../services/userService';

interface LogbookTableProps {
  entries: LogbookEntry[];
  currentUser: AuthUser | null;
  categories?: string[];
  selectedPeriodId?: number;
  onSelectPeriod?: (periodId: number) => void;
  onAddEntry: () => void;
  onEditEntry: (entry: LogbookEntry) => void;
  onDeleteEntry: (id: string) => void;
  onViewDetail: (entry: LogbookEntry) => void;
  onDuplicateEntry: (entry: LogbookEntry) => void;
  onSyncSingleEntry?: (entry: LogbookEntry) => void;
  onSyncAllToSheet?: () => void;
  currentView?: 'table' | 'calendar';
  onToggleView?: (view: 'table' | 'calendar') => void;
  externalSearchQuery?: string;
}

export const LogbookTable: React.FC<LogbookTableProps> = ({
  entries,
  categories,
  selectedPeriodId: externalPeriodId,
  onSelectPeriod,
  onAddEntry,
  onEditEntry,
  onDeleteEntry,
  onViewDetail,
  onDuplicateEntry,
  onSyncSingleEntry,
  onSyncAllToSheet,
  currentView = 'table',
  onToggleView,
  externalSearchQuery
}) => {
  const [selectedPeriodId, setSelectedPeriodId] = useState<number | 'all'>(
    externalPeriodId ?? getDefaultPeriodId()
  );
  const [selectedTipe, setSelectedTipe] = useState<'all' | 'harian' | 'mingguan'>('all');

  useEffect(() => {
    if (externalPeriodId !== undefined) {
      setSelectedPeriodId(externalPeriodId);
    }
  }, [externalPeriodId]);

  const updatePeriod = (next: number | 'all') => {
    setSelectedPeriodId(next);
    if (typeof next === 'number') {
      onSelectPeriod?.(next);
    }
  };
  
  // Secondary Filters
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSyncStatus, setSelectedSyncStatus] = useState<string>('all');
  const [searchKeyword, setSearchKeyword] = useState<string>(externalSearchQuery || '');

  useEffect(() => {
    if (externalSearchQuery !== undefined) {
      setSearchKeyword(externalSearchQuery);
    }
  }, [externalSearchQuery]);

  const currentPeriod = useMemo(() => {
    return selectedPeriodId === 'all' ? null : getPeriodById(selectedPeriodId);
  }, [selectedPeriodId]);

  const hasActiveSecondaryFilters =
    selectedCategory !== 'all' ||
    selectedSyncStatus !== 'all' ||
    searchKeyword.trim() !== '';

  const availableCategories = useMemo(() => {
    const base = categories && categories.length > 0 ? categories : UserService.getCategories();
    const set = new Set<string>(base);
    entries.forEach(e => {
      if (e.kategori) set.add(e.kategori);
    });
    return Array.from(set);
  }, [entries, categories]);

  const handlePrevPeriod = () => {
    if (selectedPeriodId === 'all') {
      updatePeriod(MAGANG_PERIODS[MAGANG_PERIODS.length - 1].id);
    } else if (selectedPeriodId > 1) {
      updatePeriod(selectedPeriodId - 1);
    }
  };

  const handleNextPeriod = () => {
    if (selectedPeriodId === 'all') {
      updatePeriod(1);
    } else if (selectedPeriodId < MAGANG_PERIODS.length) {
      updatePeriod(selectedPeriodId + 1);
    }
  };

  const handleResetSecondaryFilters = () => {
    setSelectedCategory('all');
    setSelectedSyncStatus('all');
    setSearchKeyword('');
  };

  // Filter entries by selected Periode (1..6) or all periods
  const filteredEntries = useMemo(() => {
    return entries.filter(item => {
      if (currentPeriod && !isDateInPeriod(item.tanggal, currentPeriod)) {
        return false;
      }

      if (selectedTipe !== 'all' && item.tipeLogbook !== selectedTipe) return false;
      if (selectedCategory !== 'all' && item.kategori !== selectedCategory) return false;
      if (selectedSyncStatus === 'synced' && !item.isSyncedToSheet) return false;
      if (selectedSyncStatus === 'unsynced' && item.isSyncedToSheet) return false;

      if (searchKeyword.trim()) {
        const query = searchKeyword.toLowerCase();
        const inUraian = (item.uraianAktivitas || '').toLowerCase().includes(query);
        const inPelajaran = (item.pelajaranDiperoleh || '').toLowerCase().includes(query);
        const inKendala = (item.kendalaDihadapi || '').toLowerCase().includes(query);
        const inKategori = (item.kategori || '').toLowerCase().includes(query);
        if (!inUraian && !inPelajaran && !inKendala && !inKategori) return false;
      }

      return true;
    }).sort((a, b) => {
      const dateA = new Date(`${a.tanggal}T${a.jamMulai || '00:00'}`).getTime();
      const dateB = new Date(`${b.tanggal}T${b.jamMulai || '00:00'}`).getTime();
      return dateB - dateA;
    });
  }, [entries, currentPeriod, selectedTipe, selectedCategory, selectedSyncStatus, searchKeyword]);

  const totalMinutes = useMemo(() => {
    return filteredEntries.reduce((sum, item) => sum + (item.durasiMenit || 0), 0);
  }, [filteredEntries]);

  const totalPhotos = useMemo(() => {
    return filteredEntries.reduce((sum, item) => sum + (item.fotoDokumentasi?.length || 0), 0);
  }, [filteredEntries]);

  const syncedCount = useMemo(() => {
    return filteredEntries.filter(e => e.isSyncedToSheet).length;
  }, [filteredEntries]);

  return (
    <div className="space-y-4">
      {/* Streamlined Primary Control Bar */}
      <div className="bg-white dark:bg-slate-900/90 backdrop-blur-xs p-3 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-3 transition-colors duration-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          {/* Left: Periode 1-6 Navigator */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={handlePrevPeriod}
              disabled={selectedPeriodId === 1}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors cursor-pointer"
              title="Periode sebelumnya"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-800 dark:text-slate-100">
              <CalendarIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <select
                value={selectedPeriodId}
                onChange={(e) => {
                  const val = e.target.value;
                  updatePeriod(val === 'all' ? 'all' : Number(val));
                }}
                className="bg-transparent font-bold text-slate-800 dark:text-slate-100 focus:outline-hidden cursor-pointer pr-1"
                aria-label="Pilih Periode Magang"
              >
                {MAGANG_PERIODS.map(p => (
                  <option key={p.id} value={p.id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                    {p.label} ({p.shortRange})
                  </option>
                ))}
                <option value="all" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                  Semua Periode (1–6)
                </option>
              </select>
            </div>

            <button
              onClick={handleNextPeriod}
              disabled={selectedPeriodId === MAGANG_PERIODS.length}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors cursor-pointer"
              title="Periode berikutnya"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Center: Clean Segmented Control (Semua, Harian, Mingguan) */}
          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800/90 rounded-xl self-start md:self-center border border-slate-200/50 dark:border-slate-700/50">
            <button
              onClick={() => setSelectedTipe('all')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                selectedTipe === 'all'
                  ? 'text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              style={selectedTipe === 'all' ? { backgroundColor: 'var(--theme-primary)' } : undefined}
            >
              Semua
            </button>
            <button
              onClick={() => setSelectedTipe('harian')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                selectedTipe === 'harian'
                  ? 'text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              style={selectedTipe === 'harian' ? { backgroundColor: 'var(--theme-primary)' } : undefined}
            >
              Logbook Harian
            </button>
            <button
              onClick={() => setSelectedTipe('mingguan')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                selectedTipe === 'mingguan'
                  ? 'text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              style={selectedTipe === 'mingguan' ? { backgroundColor: 'var(--theme-primary)' } : undefined}
            >
              Logbook Mingguan
            </button>
          </div>

          {/* Right: Search, Filter Toggle & View Switcher */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-48">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="Cari aktivitas..."
                className="w-full pl-8 pr-2.5 py-1.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-[var(--theme-accent)] focus:bg-white dark:focus:bg-slate-800"
              />
            </div>

            {/* Filter Drawer Toggle */}
            <button
              onClick={() => setIsFilterExpanded(!isFilterExpanded)}
              className={`p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg border text-xs font-bold flex items-center gap-1.5 transition-colors ${
                hasActiveSecondaryFilters || isFilterExpanded
                  ? 'bg-slate-100 dark:bg-slate-800 border-[var(--theme-accent)] text-[var(--theme-accent)]'
                  : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
              title="Filter tambahan (Kategori & Status Sheet)"
            >
              <Filter className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Filter</span>
              {hasActiveSecondaryFilters && (
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--theme-accent)' }} />
              )}
            </button>

            {/* View Switcher: Table vs Kalender Periode */}
            {onToggleView && (
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => onToggleView('table')}
                  className={`inline-flex items-center gap-1 px-2 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    currentView === 'table'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
                  }`}
                  title="Tampilan Tabel"
                >
                  <LayoutList className="w-3.5 h-3.5" />
                  <span className="hidden lg:inline">Tabel</span>
                </button>
                <button
                  type="button"
                  onClick={() => onToggleView('calendar')}
                  className={`inline-flex items-center gap-1 px-2 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    currentView === 'calendar'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
                  }`}
                  title="Buka Kalender Periode"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span className="hidden lg:inline">Kalender</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Collapsible Secondary Filters */}
        {isFilterExpanded && (
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-2.5 animate-in fade-in">
            {/* Category Filter */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                Kategori Kegiatan
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-800 dark:text-slate-100 focus:outline-hidden"
              >
                <option value="all">Semua Kategori</option>
                {availableCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Sheet Sync Status */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                Status Google Sheet
              </label>
              <div className="flex items-center gap-2">
                <select
                  value={selectedSyncStatus}
                  onChange={(e) => setSelectedSyncStatus(e.target.value)}
                  className="flex-1 px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-800 dark:text-slate-100 focus:outline-hidden"
                >
                  <option value="all">Semua Status</option>
                  <option value="synced">Tersinkron ke Sheet</option>
                  <option value="unsynced">Belum Disinkronkan</option>
                </select>

                {hasActiveSecondaryFilters && (
                  <button
                    onClick={handleResetSecondaryFilters}
                    className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                    title="Reset Filter"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Quiet Typographic Summary Stats */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex flex-wrap items-center gap-2 font-medium">
            <span className="text-slate-800 dark:text-slate-100 font-bold">{filteredEntries.length} logbook</span>
            <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">·</span>
            <span>{(totalMinutes / 60).toFixed(1)} jam aktivitas</span>
            <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">·</span>
            <span>{totalPhotos} foto lampiran</span>
            <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">·</span>
            <span className="text-emerald-700 dark:text-emerald-400 font-semibold">{syncedCount} tersinkron ke Sheet</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {IntegrationService.getConfig().sheetUrl && (
              <a
                href={IntegrationService.getConfig().sheetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 border border-emerald-200 dark:border-emerald-800 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 shadow-2xs"
                title="Buka file Google Spreadsheet di Google Drive Anda"
              >
                <span>Buka Google Sheet</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}

            {onSyncAllToSheet && (
              <button
                onClick={onSyncAllToSheet}
                className="text-[11px] font-bold text-slate-800 dark:text-slate-100 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
                title="Kirim seluruh data logbook langsung ke Google Sheet Anda"
              >
                <RefreshCw className="w-3 h-3" style={{ color: 'var(--theme-accent)' }} />
                <span>
                  {syncedCount < filteredEntries.length 
                    ? `Sinkronkan ke Sheet (${filteredEntries.length - syncedCount} Belum)`
                    : `Sinkronkan ke Google Sheet (${filteredEntries.length})`}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Table Content */}
      <div className="bg-white dark:bg-slate-900/90 backdrop-blur-xs rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden transition-colors duration-200">
        {filteredEntries.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mx-auto">
              <CalendarIcon className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
              Tidak Ada Catatan Logbook
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              Belum ada aktivitas yang dicatat untuk{' '}
              {currentPeriod ? `${currentPeriod.label} (${currentPeriod.fullRange})` : 'seluruh periode'}.
            </p>
            <button
              onClick={onAddEntry}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white transition-all shadow-2xs hover:opacity-95 cursor-pointer"
              style={{ backgroundColor: 'var(--theme-primary)' }}
            >
              <Plus className="w-4 h-4" />
              <span>Catat Logbook Baru</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50/80 dark:bg-slate-800/70 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wide">
                <tr>
                  <th className="py-3 px-3.5 text-center w-12">No</th>
                  <th className="py-3 px-3 w-44">Tanggal & Jenis</th>
                  <th className="py-3 px-3">Uraian & Refleksi Tugas</th>
                  <th className="py-3 px-3 w-28 text-center">Lampiran</th>
                  <th className="py-3 px-3 w-28 text-center">Sheet</th>
                  <th className="py-3 px-3 text-center w-28">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {filteredEntries.map((item, index) => {
                  const periodeStr = item.tipeLogbook === 'mingguan'
                    ? `${formatDateDDMMYYYY(item.tanggal)} s.d. ${formatDateDDMMYYYY(item.tanggalSelesai || item.tanggal)}`
                    : formatIndonesianDate(item.tanggal, true);
                  const isNonWorkdayEntry = Boolean(item.isDiluarHariKerja) || !isStandardWorkday(item.tanggal);

                  return (
                    <tr 
                      key={item.id} 
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors group cursor-pointer"
                      onClick={() => onViewDetail(item)}
                    >
                      {/* No */}
                      <td className="py-3.5 px-3.5 text-center font-medium text-slate-400 dark:text-slate-500">
                        {index + 1}
                      </td>

                      {/* Tanggal & Jenis */}
                      <td className="py-3.5 px-3">
                        <div className="font-bold text-slate-900 dark:text-white leading-tight">
                          {periodeStr}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex flex-wrap items-center gap-1">
                          <span className="font-semibold text-slate-700 dark:text-slate-300 uppercase text-[10px]">
                            {item.tipeLogbook}
                          </span>
                          {isNonWorkdayEntry && (
                            <span
                              className="text-[9.5px] font-bold px-1.5 py-0.2 rounded bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                              title={item.alasanLuarHariKerja || 'Kegiatan di luar hari kerja Senin–Jumat'}
                            >
                              Luar Hari Kerja
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Uraian Aktivitas */}
                      <td className="py-3.5 px-3 space-y-1">
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
                          {item.kategori}
                        </div>
                        <p className="text-slate-800 dark:text-slate-200 font-medium text-xs line-clamp-2 leading-relaxed">
                          {item.uraianAktivitas}
                        </p>
                        {item.pelajaranDiperoleh && (
                          <p className="text-slate-500 dark:text-slate-400 text-[11px] line-clamp-1 italic">
                            {item.pelajaranDiperoleh}
                          </p>
                        )}
                      </td>

                      {/* Foto Lampiran */}
                      <td className="py-3.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                        {item.fotoDokumentasi && item.fotoDokumentasi.length > 0 ? (
                          <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-700 dark:text-slate-300">
                            <ImageIcon className="w-3.5 h-3.5" style={{ color: 'var(--theme-accent)' }} />
                            <span>{item.fotoDokumentasi.length} Foto</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px]">—</span>
                        )}
                      </td>

                      {/* Sheet Status */}
                      <td className="py-3.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                        {item.isSyncedToSheet ? (
                          <button
                            type="button"
                            onClick={() => onSyncSingleEntry && onSyncSingleEntry(item)}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 hover:text-emerald-900 dark:hover:text-emerald-300 group/btn transition-colors"
                            title="Tersinkron. Klik untuk menyinkronkan ulang ke Google Sheet."
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 group-hover/btn:scale-110 transition-transform" />
                            <span>Tersinkron</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onSyncSingleEntry && onSyncSingleEntry(item)}
                            className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-600 px-2 py-0.5 rounded-md transition-all shadow-2xs"
                            title="Sinkronkan logbook ini langsung ke Google Sheet"
                          >
                            <RefreshCw className="w-2.5 h-2.5" style={{ color: 'var(--theme-accent)' }} />
                            <span>Sync</span>
                          </button>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => onViewDetail(item)}
                            className="p-1.5 text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                            title="Lihat Detail"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => onDuplicateEntry(item)}
                            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                            title="Duplikasi"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => onEditEntry(item)}
                            className="p-1.5 text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => onDeleteEntry(item.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                            title="Hapus"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default LogbookTable;
