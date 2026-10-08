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
import { formatIndonesianDate, formatDuration, NAMA_BULAN } from '../utils/dateUtils';
import { IntegrationService } from '../services/integrationService';

interface LogbookTableProps {
  entries: LogbookEntry[];
  currentUser: AuthUser | null;
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
  currentUser,
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
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number>(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(currentDate.getFullYear());
  const [selectedTipe, setSelectedTipe] = useState<'all' | 'harian' | 'mingguan'>('all');
  
  // Secondary Filters
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);
  const [selectedUser, setSelectedUser] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSyncStatus, setSelectedSyncStatus] = useState<string>('all');
  const [searchKeyword, setSearchKeyword] = useState<string>(externalSearchQuery || '');

  useEffect(() => {
    if (externalSearchQuery !== undefined) {
      setSearchKeyword(externalSearchQuery);
    }
  }, [externalSearchQuery]);

  const hasActiveSecondaryFilters = selectedUser !== 'all' || selectedCategory !== 'all' || selectedSyncStatus !== 'all' || searchKeyword.trim() !== '';

  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    entries.forEach(e => {
      if (e.kategori) set.add(e.kategori);
    });
    return Array.from(set).sort();
  }, [entries]);

  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear(prev => prev - 1);
    } else {
      setSelectedMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear(prev => prev + 1);
    } else {
      setSelectedMonth(prev => prev + 1);
    }
  };

  const handleResetSecondaryFilters = () => {
    setSelectedUser('all');
    setSelectedCategory('all');
    setSelectedSyncStatus('all');
    setSearchKeyword('');
  };

  // Filter entries
  const filteredEntries = useMemo(() => {
    return entries.filter(item => {
      const [year, month] = item.tanggal.split('-');
      if (parseInt(year, 10) !== selectedYear) return false;
      if (parseInt(month, 10) !== selectedMonth) return false;

      if (selectedTipe !== 'all' && item.tipeLogbook !== selectedTipe) return false;
      if (selectedUser !== 'all' && item.username.toLowerCase() !== selectedUser.toLowerCase()) return false;
      if (selectedCategory !== 'all' && item.kategori !== selectedCategory) return false;
      if (selectedSyncStatus === 'synced' && !item.isSyncedToSheet) return false;
      if (selectedSyncStatus === 'unsynced' && item.isSyncedToSheet) return false;

      if (searchKeyword.trim()) {
        const query = searchKeyword.toLowerCase();
        const inUraian = (item.uraianAktivitas || '').toLowerCase().includes(query);
        const inPelajaran = (item.pelajaranDiperoleh || '').toLowerCase().includes(query);
        const inKendala = (item.kendalaDihadapi || '').toLowerCase().includes(query);
        const inPenulis = (item.namaPenulis || '').toLowerCase().includes(query);
        if (!inUraian && !inPelajaran && !inKendala && !inPenulis) return false;
      }

      return true;
    }).sort((a, b) => {
      const dateA = new Date(`${a.tanggal}T${a.jamMulai || '00:00'}`).getTime();
      const dateB = new Date(`${b.tanggal}T${b.jamMulai || '00:00'}`).getTime();
      return dateB - dateA;
    });
  }, [entries, selectedMonth, selectedYear, selectedTipe, selectedUser, selectedCategory, selectedSyncStatus, searchKeyword]);

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
      <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          {/* Left: Compact Month-Year Navigator */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
              title="Bulan sebelumnya"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-1 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800">
              <CalendarIcon className="w-3.5 h-3.5 text-slate-400 mr-1" />
              <span>{NAMA_BULAN[selectedMonth - 1]}</span>
              <span className="text-slate-400 font-normal">/</span>
              <span>{selectedYear}</span>
            </div>

            <button
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
              title="Bulan berikutnya"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Center: Clean Segmented Control (Semua, Harian, Mingguan) */}
          <div className="flex items-center p-1 bg-slate-100 rounded-xl self-start md:self-center">
            <button
              onClick={() => setSelectedTipe('all')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                selectedTipe === 'all'
                  ? 'bg-[#003B73] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semua
            </button>
            <button
              onClick={() => setSelectedTipe('harian')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                selectedTipe === 'harian'
                  ? 'bg-[#003B73] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Logbook Harian
            </button>
            <button
              onClick={() => setSelectedTipe('mingguan')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                selectedTipe === 'mingguan'
                  ? 'bg-[#003B73] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
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
                className="w-full pl-8 pr-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-hidden focus:ring-1 focus:ring-sky-600 focus:bg-white"
              />
            </div>

            {/* Filter Drawer Toggle */}
            <button
              onClick={() => setIsFilterExpanded(!isFilterExpanded)}
              className={`p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg border text-xs font-bold flex items-center gap-1.5 transition-colors ${
                hasActiveSecondaryFilters || isFilterExpanded
                  ? 'bg-sky-50 border-sky-300 text-sky-800'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
              title="Filter tambahan (User, Kategori, Status Sheet)"
            >
              <Filter className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Filter</span>
              {hasActiveSecondaryFilters && (
                <span className="w-2 h-2 rounded-full bg-sky-600" />
              )}
            </button>

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

        {/* Collapsible Secondary Filters (Only shown when requested) */}
        {isFilterExpanded && (
          <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-2.5 animate-in fade-in">
            {/* User Filter */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Filter Pengguna
              </label>
              <select
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-hidden"
              >
                <option value="all">Semua Pengguna</option>
                <option value="ainunnn">Muhammad Ainun Anwar</option>
                <option value="ayuazhara">Ayu Azhara</option>
                <option value="aliyah">Aliyah Meilidya</option>
              </select>
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Kategori Kegiatan
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-hidden"
              >
                <option value="all">Semua Kategori</option>
                {availableCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Sheet Sync Status */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Status Google Sheet
              </label>
              <div className="flex items-center gap-2">
                <select
                  value={selectedSyncStatus}
                  onChange={(e) => setSelectedSyncStatus(e.target.value)}
                  className="flex-1 px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-hidden"
                >
                  <option value="all">Semua Status</option>
                  <option value="synced">Tersinkron ke Sheet</option>
                  <option value="unsynced">Belum Disinkronkan</option>
                </select>

                {hasActiveSecondaryFilters && (
                  <button
                    onClick={handleResetSecondaryFilters}
                    className="p-1.5 text-slate-400 hover:text-slate-700"
                    title="Reset Filter"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Quiet Typographic Summary Stats (No bulky pill badges) */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs text-slate-500">
          <div className="flex items-center gap-2 font-medium">
            <span className="text-slate-800 font-bold">{filteredEntries.length} logbook</span>
            <span aria-hidden="true" className="text-slate-300">·</span>
            <span>{(totalMinutes / 60).toFixed(1)} jam aktivitas</span>
            <span aria-hidden="true" className="text-slate-300">·</span>
            <span>{totalPhotos} foto lampiran</span>
            <span aria-hidden="true" className="text-slate-300">·</span>
            <span className="text-emerald-700 font-semibold">{syncedCount} tersinkron ke Sheet</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {IntegrationService.getConfig().sheetUrl && (
              <a
                href={IntegrationService.getConfig().sheetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 shadow-2xs"
                title="Buka file Google Spreadsheet di Google Drive Anda"
              >
                <span>Buka Google Sheet</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}

            {onSyncAllToSheet && (
              <button
                onClick={onSyncAllToSheet}
                className="text-[11px] font-bold text-sky-800 bg-sky-50 hover:bg-sky-100 border border-sky-200 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
                title="Kirim seluruh data logbook langsung ke Google Sheet Anda"
              >
                <RefreshCw className="w-3 h-3 text-sky-700" />
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
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        {filteredEntries.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mx-auto">
              <CalendarIcon className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">
              Tidak Ada Catatan Logbook
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Belum ada aktivitas yang dicatat untuk periode {NAMA_BULAN[selectedMonth - 1]} {selectedYear}.
            </p>
            <button
              onClick={onAddEntry}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#003B73] hover:bg-sky-800 transition-colors shadow-2xs"
            >
              <Plus className="w-4 h-4" />
              <span>Catat Logbook Baru</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50/80 text-slate-600 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wide">
                <tr>
                  <th className="py-3 px-3.5 text-center w-12">No</th>
                  <th className="py-3 px-3 w-44">Waktu & Penulis</th>
                  <th className="py-3 px-3">Uraian & Refleksi Tugas</th>
                  <th className="py-3 px-3 w-28 text-center">Lampiran</th>
                  <th className="py-3 px-3 w-28 text-center">Sheet</th>
                  <th className="py-3 px-3 text-center w-28">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEntries.map((item, index) => {
                  const periodeStr = item.tipeLogbook === 'mingguan'
                    ? `${item.tanggal} s.d. ${item.tanggalSelesai || '-'}`
                    : formatIndonesianDate(item.tanggal, false);

                  return (
                    <tr 
                      key={item.id} 
                      className="hover:bg-slate-50/70 transition-colors group cursor-pointer"
                      onClick={() => onViewDetail(item)}
                    >
                      {/* No */}
                      <td className="py-3.5 px-3.5 text-center font-medium text-slate-400">
                        {index + 1}
                      </td>

                      {/* Waktu & Penulis */}
                      <td className="py-3.5 px-3">
                        <div className="font-bold text-slate-900 leading-tight">
                          {periodeStr}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {item.jamMulai && item.jamSelesai && (
                            <>
                              <span>{item.jamMulai} - {item.jamSelesai}</span>
                              <span className="mx-1 text-slate-300">·</span>
                            </>
                          )}
                          <span className="font-semibold text-slate-700 uppercase text-[10px]">{item.tipeLogbook}</span>
                        </div>
                        <div className="text-[11px] text-sky-800 font-medium mt-1">
                          {item.namaPenulis}
                        </div>
                      </td>

                      {/* Uraian Aktivitas */}
                      <td className="py-3.5 px-3 space-y-1">
                        <div className="text-[11px] text-slate-500 font-semibold">
                          {item.kategori}
                        </div>
                        <p className="text-slate-800 font-medium text-xs line-clamp-2 leading-relaxed">
                          {item.uraianAktivitas}
                        </p>
                        {item.pelajaranDiperoleh && (
                          <p className="text-slate-500 text-[11px] line-clamp-1 italic">
                            {item.pelajaranDiperoleh}
                          </p>
                        )}
                      </td>

                      {/* Foto Lampiran */}
                      <td className="py-3.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                        {item.fotoDokumentasi && item.fotoDokumentasi.length > 0 ? (
                          <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-50 border border-slate-200 text-[11px] font-bold text-slate-700">
                            <ImageIcon className="w-3.5 h-3.5 text-sky-600" />
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
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:text-emerald-900 group/btn transition-colors"
                            title="Tersinkron. Klik untuk menyinkronkan ulang ke Google Sheet."
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 group-hover/btn:scale-110 transition-transform" />
                            <span>Tersinkron</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onSyncSingleEntry && onSyncSingleEntry(item)}
                            className="inline-flex items-center gap-1 text-[10px] font-bold text-sky-800 bg-sky-50 hover:bg-sky-100 border border-sky-300 hover:border-sky-500 px-2 py-0.5 rounded-md transition-all shadow-2xs"
                            title="Sinkronkan logbook ini langsung ke Google Sheet"
                          >
                            <RefreshCw className="w-2.5 h-2.5" />
                            <span>Sync</span>
                          </button>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => onViewDetail(item)}
                            className="p-1.5 text-slate-400 hover:text-sky-700 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Lihat Detail"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => onDuplicateEntry(item)}
                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Duplikasi"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => onEditEntry(item)}
                            className="p-1.5 text-slate-400 hover:text-amber-700 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => onDeleteEntry(item.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition-colors"
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
