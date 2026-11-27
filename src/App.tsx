/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import LandingPage from './components/LandingPage';
import LoginPage from './components/LoginPage';
import Header from './components/Header';
import LogbookTable from './components/LogbookTable';
import CalendarView from './components/CalendarView';
import SummariesView from './components/SummariesView';
import ExportPreviewModal from './components/ExportPreviewModal';
import LogbookModal from './components/LogbookModal';
import LogbookDetailModal from './components/LogbookDetailModal';
import SettingsModal from './components/SettingsModal';
import AlertModal from './components/AlertModal';
import AdminSettingsModal from './components/AdminSettingsModal';
import { AuthUser, LogbookEntry, PesertaProfile, ReminderSettings } from './types';
import { UserService } from './services/userService';
import { AuthService } from './services/authService';
import { IntegrationService } from './services/integrationService';
import { ThemeService } from './services/themeService';
import { NotificationService } from './services/notificationService';
import { formatIndonesianDate, getDefaultPeriodId, getTodayString } from './utils/dateUtils';
import { Check, BarChart3, FileText, ExternalLink, AlertCircle, BellRing, Plus, X } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(AuthService.getCurrentUser());
  const [viewMode, setViewMode] = useState<'landing' | 'login' | 'dashboard'>(
    AuthService.getCurrentUser() ? 'dashboard' : 'landing'
  );

  const [activeView, setActiveView] = useState<'logbook' | 'kalender' | 'rekap'>('logbook');
  const [activePeriodId, setActivePeriodId] = useState<number>(getDefaultPeriodId());
  const [rekapViewMode, setRekapViewMode] = useState<'summary' | 'export'>('summary');
  const [profile, setProfile] = useState<PesertaProfile>(UserService.getProfile());
  const [entries, setEntries] = useState<LogbookEntry[]>(UserService.getEntries());
  const [categories, setCategories] = useState<string[]>(UserService.getCategories());
  const [reminderSettings, setReminderSettings] = useState<ReminderSettings>(NotificationService.getSettings());
  const [isReminderBannerDismissed, setIsReminderBannerDismissed] = useState(false);
  const [, setThemeVersion] = useState(0);

  // Initialize and apply theme on start
  useEffect(() => {
    ThemeService.applyTheme();
  }, []);

  // Periodic daily reminder check when dashboard is active
  useEffect(() => {
    if (viewMode !== 'dashboard' || !reminderSettings.enabled) return;

    NotificationService.checkAndTriggerScheduledReminder(entries);

    const intervalId = window.setInterval(() => {
      NotificationService.checkAndTriggerScheduledReminder(entries);
    }, 30000);

    return () => window.clearInterval(intervalId);
  }, [viewMode, entries, reminderSettings]);

  const handleThemeChanged = () => {
    setThemeVersion(v => v + 1);
  };

  // Modals state
  const [isLogbookModalOpen, setIsLogbookModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<LogbookEntry | null>(null);
  const [selectedDefaultDate, setSelectedDefaultDate] = useState<string | undefined>(undefined);

  const [detailEntry, setDetailEntry] = useState<LogbookEntry | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsInitialTab, setSettingsInitialTab] = useState<'perusahaan' | 'peserta' | 'kategori' | 'backup'>('perusahaan');
  const [isAdminSettingsOpen, setIsAdminSettingsOpen] = useState(false);

  // Delete Confirmation Alert
  const [deleteAlert, setDeleteAlert] = useState<{
    isOpen: boolean;
    entryId: string | null;
  }>({
    isOpen: false,
    entryId: null
  });

  // Notification Toast
  const [toastMessage, setToastMessage] = useState<{
    text: string;
    url?: string;
    type?: 'success' | 'error' | 'info';
  } | null>(null);

  const showToast = (text: string, url?: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMessage({ text, url, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 6000);
  };

  const refreshData = () => {
    setProfile(UserService.getProfile());
    setEntries(UserService.getEntries());
    setCategories(UserService.getCategories());
  };

  // Auth Handlers
  const handleLoginSuccess = (username: string) => {
    const user = AuthService.getCurrentUser();
    setCurrentUser(user);
    if (user) {
      const currentProf = UserService.getProfile();
      const updatedProf: PesertaProfile = {
        ...currentProf,
        username: user.username
      };
      UserService.saveProfile(updatedProf);
      setProfile(updatedProf);
    }
    setViewMode('dashboard');
    showToast(`Selamat datang, ${user?.name || username}!`);
  };

  const handleQuickDemoLogin = (targetUsername = 'ainunnn') => {
    const res = AuthService.login(targetUsername, 'password123');
    if (res.success && res.user) {
      setCurrentUser(res.user);
      const currentProf = UserService.getProfile();
      const updatedProf: PesertaProfile = {
        ...currentProf,
        username: res.user.username
      };
      UserService.saveProfile(updatedProf);
      setProfile(updatedProf);
      setViewMode('dashboard');
      showToast(`Masuk sebagai ${res.user.name} (${res.user.role === 'admin' ? 'Admin' : 'User'})`);
    }
  };

  const handleLogout = () => {
    AuthService.logout();
    setCurrentUser(null);
    setViewMode('landing');
    showToast('Anda telah keluar dari akun MagangHub.');
  };

  // Entry CRUD Operations
  const handleSaveEntry = (entry: LogbookEntry) => {
    const updated = UserService.addOrUpdateEntry(entry);
    setEntries(updated);
    showToast(`Logbook ${entry.tipeLogbook} berhasil disimpan.`);

    // Auto-sync silently ONLY if already authenticated with Google in this session (never pop up Google login on save)
    const config = IntegrationService.getConfig();
    if (config.autoSyncEnabled && config.sheetUrl) {
      IntegrationService.syncEntriesToGoogleSheet(updated, 'full', false).then(res => {
        if (res.success) {
          const allIds = updated.map(e => e.id);
          const synced = UserService.markEntriesAsSynced(allIds);
          setEntries(synced);
        }
      });
    }

    setEditingEntry(null);
    setSelectedDefaultDate(undefined);
  };

  const handleOpenNewEntry = (forDate?: string) => {
    setEditingEntry(null);
    setSelectedDefaultDate(forDate || new Date().toISOString().slice(0, 10));
    setIsLogbookModalOpen(true);
  };

  const handleOpenEditEntry = (entry: LogbookEntry) => {
    setEditingEntry(entry);
    setSelectedDefaultDate(entry.tanggal);
    setIsLogbookModalOpen(true);
  };

  const handleDuplicateEntry = (entry: LogbookEntry) => {
    const duplicated: LogbookEntry = {
      ...entry,
      id: '',
      tanggal: new Date().toISOString().slice(0, 10),
      isSyncedToSheet: false,
      syncedAt: undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setEditingEntry(duplicated);
    setSelectedDefaultDate(duplicated.tanggal);
    setIsLogbookModalOpen(true);
    showToast('Laporan diduplikasi. Silakan sesuaikan isi lalu simpan.');
  };

  const handlePromptDelete = (id: string) => {
    setDeleteAlert({
      isOpen: true,
      entryId: id
    });
  };

  const handleConfirmDelete = () => {
    if (deleteAlert.entryId) {
      const updated = UserService.deleteEntry(deleteAlert.entryId);
      setEntries(updated);
      showToast('Laporan berhasil dihapus.');
      setDeleteAlert({ isOpen: false, entryId: null });
    }
  };

  // Sync to Google Sheet Handlers (Duplicate-Free)
  const handleSyncAllToSheet = async () => {
    showToast('Sedang menyinkronkan data ke Google Sheet (tanpa duplikat)...', undefined, 'info');
    const res = await IntegrationService.syncEntriesToGoogleSheet(entries, 'full');
    if (res.success) {
      const allIds = entries.map(e => e.id);
      const updated = UserService.markEntriesAsSynced(allIds);
      setEntries(updated);
      showToast(res.message, res.spreadsheetUrl, 'success');
    } else {
      showToast(res.message, undefined, 'error');
    }
  };

  const handleSyncSingleEntry = async (entry: LogbookEntry) => {
    showToast('Sedang menyinkronkan catatan ke Google Sheet...', undefined, 'info');
    const res = await IntegrationService.syncEntriesToGoogleSheet([entry], 'upsert');
    if (res.success) {
      const updated = UserService.markEntriesAsSynced([entry.id]);
      setEntries(updated);
      showToast(res.message, res.spreadsheetUrl, 'success');
    } else {
      showToast(res.message, undefined, 'error');
    }
  };

  const handleSaveProfile = (newProfile: PesertaProfile) => {
    UserService.saveProfile(newProfile);
    setProfile(newProfile);
    showToast('Data profil peserta magang berhasil diperbarui.');
  };

  const handleClearAllEntries = () => {
    const updated = UserService.clearAllEntries();
    setEntries(updated);
    showToast('Seluruh data logbook telah berhasil dikosongkan. Akun pengguna dan profil tetap aman.', undefined, 'success');
  };

  const handleReloadSampleEntries = () => {
    const updated = UserService.resetToInitialSampleEntries();
    setEntries(updated);
    showToast('Data contoh logbook berhasil dimuat kembali.', undefined, 'success');
  };

  // 1. Tampilan Awal: Landing Page
  if (viewMode === 'landing') {
    return (
      <LandingPage
        onGoToLogin={() => setViewMode('login')}
        onQuickDemoLogin={handleQuickDemoLogin}
      />
    );
  }

  // 2. Tampilan Halaman Login: Username dan Password
  if (viewMode === 'login') {
    return (
      <LoginPage
        onLoginSuccess={handleLoginSuccess}
        onBackToLanding={() => setViewMode('landing')}
      />
    );
  }

  // 3. Tampilan Dashboard Utama Logbook MagangHub
  return (
    <div className="min-h-screen relative flex flex-col font-sans bg-slate-50 dark:bg-[#090D16] text-slate-900 dark:text-slate-100 antialiased selection:bg-[var(--theme-accent)] selection:text-white transition-colors duration-200">
      {/* Background Grid Pattern Overlay */}
      <div 
        className="fixed inset-0 pointer-events-none z-0 bg-grid-ambient bg-grid-mask opacity-80 dark:opacity-40" 
        aria-hidden="true"
      />

      {/* Header */}
      <Header
        activeView={activeView}
        onSelectView={setActiveView}
        onOpenNewLogbook={() => handleOpenNewEntry()}
        onOpenSettings={() => {
          setSettingsInitialTab('perusahaan');
          setIsSettingsOpen(true);
        }}
        onOpenAdminSettings={() => setIsAdminSettingsOpen(true)}
        profile={profile}
        currentUser={currentUser}
        onLogout={handleLogout}
        onThemeChanged={handleThemeChanged}
        entries={entries}
        reminderSettings={reminderSettings}
        onUpdateReminderSettings={(next) => {
          setReminderSettings(next);
          if (next.enabled) setIsReminderBannerDismissed(false);
        }}
        onNotifyFeedback={(msg, type = 'info') => showToast(msg, undefined, type)}
      />

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-4">
        {/* Daily Logbook Reminder Banner */}
        {NotificationService.shouldRemindToday(entries, reminderSettings) && !isReminderBannerDismissed && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-amber-50/95 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-800/80 shadow-2xs animate-in fade-in duration-200">
            <div className="flex items-start sm:items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/15 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0">
                <BellRing className="w-4.5 h-4.5" />
              </div>
              <div className="text-xs">
                <div className="font-bold text-amber-950 dark:text-amber-100">
                  Pengingat Harian: Anda belum mengisi logbook hari ini
                </div>
                <p className="text-amber-800/90 dark:text-amber-300/90 mt-0.5">
                  {formatIndonesianDate(getTodayString(), true)} · Jadwal pengingat pukul {reminderSettings.time} WITA.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center">
              <button
                type="button"
                onClick={() => handleOpenNewEntry(getTodayString())}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-white shadow-xs transition-all hover:opacity-95 cursor-pointer"
                style={{ backgroundColor: 'var(--theme-primary)' }}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Isi Logbook Hari Ini</span>
              </button>
              <button
                type="button"
                onClick={() => setIsReminderBannerDismissed(true)}
                className="p-1.5 rounded-lg text-amber-700 dark:text-amber-300 hover:bg-amber-200/60 dark:hover:bg-amber-900/50 transition-colors cursor-pointer"
                title="Sembunyikan sementara"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
        {/* Clean Dashboard Top Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900/90 backdrop-blur-xs p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs transition-colors duration-200">
          <div>
            <div className="flex items-center gap-2">
              <span 
                className="w-2.5 h-2.5 rounded-full shadow-2xs"
                style={{ backgroundColor: 'var(--theme-accent)' }}
              />
              <h1 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                {activeView === 'logbook'
                  ? 'Catatan Logbook Aktivitas'
                  : activeView === 'kalender'
                  ? 'Kalender Periode Pemagangan'
                  : 'Rekapitulasi & Laporan Pemagangan'}
              </h1>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Program Pemagangan Nasional Kemnaker RI · Peserta: <strong className="text-slate-800 dark:text-slate-200">{currentUser?.name || profile.nama}</strong>
            </p>
          </div>

          <div className="flex items-center gap-2 tabular-nums">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-200/60 dark:border-slate-700">
              Total: <strong style={{ color: 'var(--theme-accent)' }}>{entries.length} Logbook</strong>
            </span>
            <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800">
              {(entries.reduce((a, c) => a + (c.durasiMenit || 0), 0) / 60).toFixed(1)} Jam Kerja
            </span>
          </div>
        </div>

        {activeView === 'logbook' && (
          <LogbookTable
            entries={entries}
            currentUser={currentUser}
            categories={categories}
            selectedPeriodId={activePeriodId}
            onSelectPeriod={setActivePeriodId}
            onAddEntry={() => handleOpenNewEntry()}
            onEditEntry={handleOpenEditEntry}
            onDeleteEntry={handlePromptDelete}
            onViewDetail={(item) => setDetailEntry(item)}
            onDuplicateEntry={handleDuplicateEntry}
            onSyncSingleEntry={handleSyncSingleEntry}
            onSyncAllToSheet={handleSyncAllToSheet}
            currentView="table"
            onToggleView={(mode) => setActiveView(mode === 'calendar' ? 'kalender' : 'logbook')}
          />
        )}

        {activeView === 'kalender' && (
          <CalendarView
            entries={entries}
            profile={profile}
            selectedPeriodId={activePeriodId}
            onSelectPeriod={setActivePeriodId}
            onAddEntryForDate={(dateStr) => handleOpenNewEntry(dateStr)}
            onEditEntry={handleOpenEditEntry}
            onViewEntry={(item) => setDetailEntry(item)}
            currentView="calendar"
            onToggleView={(mode) => setActiveView(mode === 'table' ? 'logbook' : 'kalender')}
          />
        )}

        {activeView === 'rekap' && (
          <div className="space-y-4">
            {/* Clean Segmented Control Bar */}
            <div className="bg-white dark:bg-slate-900/90 backdrop-blur-xs p-3 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors duration-200">
              <div>
                <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                  Rekapitulasi & Laporan Pemagangan
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Ringkasan jam kerja, analisis aktivitas magang, dan format cetak resmi Kemnaker RI
                </p>
              </div>

              <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800/90 rounded-xl self-start sm:self-center border border-slate-200/50 dark:border-slate-700/50">
                <button
                  onClick={() => setRekapViewMode('summary')}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
                    rekapViewMode === 'summary'
                      ? 'text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                  style={rekapViewMode === 'summary' ? { backgroundColor: 'var(--theme-primary)' } : undefined}
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                  <span>Statistik & Ringkasan</span>
                </button>
                <button
                  onClick={() => setRekapViewMode('export')}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
                    rekapViewMode === 'export'
                      ? 'text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                  style={rekapViewMode === 'export' ? { backgroundColor: 'var(--theme-primary)' } : undefined}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Cetak Laporan Resmi</span>
                </button>
              </div>
            </div>

            {rekapViewMode === 'summary' ? (
              <SummariesView
                entries={entries}
                profile={profile}
              />
            ) : (
              <ExportPreviewModal
                entries={entries}
                profile={profile}
              />
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="relative z-10 bg-white dark:bg-slate-900/90 backdrop-blur-xs border-t border-slate-200 dark:border-slate-800 py-4 text-center text-xs text-slate-500 dark:text-slate-400 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800 dark:text-slate-200">MagangHub Kemnaker RI</span>
            <span>•</span>
            <span>Program Pemagangan Nasional (maganghub.kemnaker.go.id)</span>
          </div>
          <div className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
            Pengguna Aktif: <strong style={{ color: 'var(--theme-accent)' }}>@{currentUser?.username || profile.username}</strong> ({currentUser?.role === 'admin' ? 'Admin' : 'User'})
          </div>
        </div>
      </footer>

      {/* Toast Notification */}
      {toastMessage && (
        <div className={`fixed bottom-5 left-1/2 -translate-x-1/2 sm:left-auto sm:translate-x-0 sm:right-6 z-50 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 text-xs animate-in slide-in-from-bottom duration-200 border ${
          toastMessage.type === 'error'
            ? 'bg-rose-950/95 border-rose-700 text-rose-100'
            : toastMessage.type === 'info'
            ? 'bg-[#002B49] border-sky-600 text-sky-100'
            : 'bg-[#002B49] border-emerald-600 text-white'
        }`}>
          {toastMessage.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
          {toastMessage.type === 'info' && <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping shrink-0" />}
          {toastMessage.type === 'success' && <Check className="w-4 h-4 text-emerald-400 shrink-0" />}
          <span className="max-w-md font-medium leading-relaxed">{toastMessage.text}</span>
          {toastMessage.url && (
            <a
              href={toastMessage.url}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-2 inline-flex items-center gap-1 font-bold text-amber-300 hover:text-amber-200 underline whitespace-nowrap bg-white/10 px-2.5 py-1 rounded-lg border border-white/20 transition-colors"
            >
              <span>Buka Google Sheet</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      )}

      {/* Modals & Drawers */}
      <LogbookModal
        isOpen={isLogbookModalOpen}
        onClose={() => {
          setIsLogbookModalOpen(false);
          setEditingEntry(null);
        }}
        onSave={handleSaveEntry}
        initialEntry={editingEntry}
        defaultDate={selectedDefaultDate}
        currentUser={currentUser}
        profile={profile}
        categories={categories}
        entries={entries}
        onOpenCategorySettings={() => {
          setIsLogbookModalOpen(false);
          setSettingsInitialTab('kategori');
          setIsSettingsOpen(true);
        }}
      />

      <LogbookDetailModal
        isOpen={!!detailEntry}
        onClose={() => setDetailEntry(null)}
        entry={detailEntry}
        currentUser={currentUser}
        onEdit={(item) => {
          setDetailEntry(null);
          handleOpenEditEntry(item);
        }}
        onDuplicate={(item) => {
          setDetailEntry(null);
          handleDuplicateEntry(item);
        }}
        onSyncSingleEntry={handleSyncSingleEntry}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        profile={profile}
        currentUser={currentUser}
        categories={categories}
        initialTab={settingsInitialTab}
        onSaveProfile={handleSaveProfile}
        onCategoriesUpdated={setCategories}
        onDataReset={refreshData}
        onClearAllEntries={handleClearAllEntries}
        onOpenAdminSettings={() => {
          setIsSettingsOpen(false);
          setIsAdminSettingsOpen(true);
        }}
      />

      {currentUser?.role === 'admin' && (
        <AdminSettingsModal
          isOpen={isAdminSettingsOpen}
          onClose={() => setIsAdminSettingsOpen(false)}
          currentUser={currentUser}
          entries={entries}
          onSyncAll={handleSyncAllToSheet}
          onUsersUpdated={refreshData}
          onClearAllEntries={handleClearAllEntries}
          onReloadSampleEntries={handleReloadSampleEntries}
        />
      )}

      <AlertModal
        isOpen={deleteAlert.isOpen}
        onClose={() => setDeleteAlert({ isOpen: false, entryId: null })}
        onConfirm={handleConfirmDelete}
        title="Konfirmasi Hapus Laporan"
        message="Apakah Anda yakin ingin menghapus catatan logbook ini? Tindakan ini tidak dapat dibatalkan."
        confirmText="Hapus Laporan"
        cancelText="Batal"
        variant="danger"
      />
    </div>
  );
}
