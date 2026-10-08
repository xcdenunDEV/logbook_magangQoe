import React, { useState, useEffect } from 'react';
import { 
  X, 
  Save, 
  ExternalLink, 
  FileSpreadsheet, 
  FolderOpen, 
  RefreshCw, 
  Check, 
  Copy, 
  ShieldCheck,
  AlertCircle,
  Users,
  UserPlus,
  Trash2,
  Edit3,
  UserCheck,
  Sparkles,
  Loader2,
  CheckCircle2,
  LogOut,
  Rocket
} from 'lucide-react';
import { User as FirebaseUser } from 'firebase/auth';
import { AdminIntegrationConfig, AppUser, AuthUser, LogbookEntry } from '../types';
import { IntegrationService } from '../services/integrationService';
import { AuthService } from '../services/authService';
import { GoogleWorkspaceApi } from '../services/googleWorkspaceApi';
import { googleSignIn, initAuth, logoutGoogle, getAccessToken } from '../services/firebaseAuth';

interface AdminSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AuthUser | null;
  entries: LogbookEntry[];
  onSyncAll: () => void;
  onUsersUpdated: () => void;
  onClearAllEntries?: () => void;
  onReloadSampleEntries?: () => void;
  initialTab?: 'integration' | 'users' | 'deploy';
}

export const AdminSettingsModal: React.FC<AdminSettingsModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  entries,
  onSyncAll,
  onUsersUpdated,
  onClearAllEntries,
  onReloadSampleEntries,
  initialTab = 'integration'
}) => {
  const [activeTab, setActiveTab] = useState<'integration' | 'users' | 'deploy'>(initialTab);
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);
  const [alsoClearSheet, setAlsoClearSheet] = useState(true);
  const [isClearingForDeploy, setIsClearingForDeploy] = useState(false);
  const [isClearingSheetOnly, setIsClearingSheetOnly] = useState(false);
  const [clearFeedback, setClearFeedback] = useState<string | null>(null);
  
  // Integration State
  const [config, setConfig] = useState<AdminIntegrationConfig>(IntegrationService.getConfig());
  const [isSavingIntegration, setIsSavingIntegration] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [copiedTsv, setCopiedTsv] = useState(false);

  // Google Workspace OAuth State
  const [googleUser, setGoogleUser] = useState<FirebaseUser | null>(null);
  const [googleAccessToken, setGoogleAccessToken] = useState<string | null>(null);
  const [isConnectingGoogle, setIsConnectingGoogle] = useState(false);
  const [isCreatingSheet, setIsCreatingSheet] = useState(false);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [isDirectSyncing, setIsDirectSyncing] = useState(false);
  const [setupFeedback, setSetupFeedback] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // User Management State
  const [users, setUsers] = useState<AppUser[]>(AuthService.getUsers());
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  const [userFormState, setUserFormState] = useState<Partial<AppUser>>({
    name: '',
    username: '',
    password: 'password123',
    role: 'user',
    email: '',
    institusiAsal: 'Universitas Hasanuddin',
    jurusan: 'Sistem Informasi'
  });
  const [userMessage, setUserMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Listen to Google Auth State
  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setGoogleUser(user);
        setGoogleAccessToken(token);
      },
      () => {
        setGoogleUser(null);
        setGoogleAccessToken(null);
      }
    );
    return () => unsubscribe();
  }, []);

  if (!isOpen) return null;

  const showUserMsg = (text: string, type: 'success' | 'error') => {
    setUserMessage({ text, type });
    setTimeout(() => setUserMessage(null), 3000);
  };

  // Google Auth Handlers
  const handleConnectGoogle = async () => {
    setIsConnectingGoogle(true);
    setSetupFeedback(null);
    try {
      const res = await googleSignIn();
      if (res) {
        setGoogleUser(res.user);
        setGoogleAccessToken(res.accessToken);
        setSetupFeedback({
          type: 'success',
          message: `Akun Google (${res.user.email}) berhasil terhubung dengan izin Google Sheets dan Google Drive!`
        });
      }
    } catch (err: any) {
      setSetupFeedback({
        type: 'error',
        message: err.message || 'Gagal menghubungkan akun Google.'
      });
    } finally {
      setIsConnectingGoogle(false);
    }
  };

  const handleDisconnectGoogle = async () => {
    await logoutGoogle();
    setGoogleUser(null);
    setGoogleAccessToken(null);
    setSetupFeedback({
      type: 'info',
      message: 'Koneksi akun Google berhasil diputuskan.'
    });
  };

  // Automated Setup: 1-Click Create Google Spreadsheet
  const handleAutoCreateSpreadsheet = async () => {
    let token = googleAccessToken || await getAccessToken();
    if (!token) {
      try {
        const res = await googleSignIn();
        if (res) {
          token = res.accessToken;
          setGoogleUser(res.user);
          setGoogleAccessToken(res.accessToken);
        } else {
          return;
        }
      } catch (err: any) {
        setSetupFeedback({
          type: 'error',
          message: 'Silakan hubungkan akun Google terlebih dahulu.'
        });
        return;
      }
    }

    setIsCreatingSheet(true);
    setSetupFeedback(null);
    try {
      const created = await GoogleWorkspaceApi.createMagangHubSpreadsheet(
        token,
        'MagangHub Kemnaker - Rekap Logbook Pemagangan'
      );
      const updatedConfig: AdminIntegrationConfig = {
        ...config,
        sheetUrl: created.spreadsheetUrl,
        sheetId: created.spreadsheetId,
        sheetTabName: created.sheetTabName
      };
      setConfig(updatedConfig);
      IntegrationService.saveConfig(updatedConfig);

      setSetupFeedback({
        type: 'success',
        message: 'Google Spreadsheet resmi MagangHub berhasil dibuat otomatis lengkap dengan kolom standar Kemnaker RI!'
      });
    } catch (err: any) {
      setSetupFeedback({
        type: 'error',
        message: err.message || 'Gagal membuat Google Spreadsheet otomatis.'
      });
    } finally {
      setIsCreatingSheet(false);
    }
  };

  // Automated Setup: 1-Click Create Google Drive Folder
  const handleAutoCreateDriveFolder = async () => {
    let token = googleAccessToken || await getAccessToken();
    if (!token) {
      try {
        const res = await googleSignIn();
        if (res) {
          token = res.accessToken;
          setGoogleUser(res.user);
          setGoogleAccessToken(res.accessToken);
        } else {
          return;
        }
      } catch (err: any) {
        setSetupFeedback({
          type: 'error',
          message: 'Silakan hubungkan akun Google terlebih dahulu.'
        });
        return;
      }
    }

    setIsCreatingFolder(true);
    setSetupFeedback(null);
    try {
      const created = await GoogleWorkspaceApi.createMagangHubDriveFolder(
        token,
        'Dokumentasi Foto MagangHub - Kemnaker'
      );
      const updatedConfig: AdminIntegrationConfig = {
        ...config,
        driveFolderUrl: created.folderUrl,
        driveFolderId: created.folderId
      };
      setConfig(updatedConfig);
      IntegrationService.saveConfig(updatedConfig);

      setSetupFeedback({
        type: 'success',
        message: 'Folder Google Drive "Dokumentasi Foto MagangHub" berhasil dibuat otomatis!'
      });
    } catch (err: any) {
      setSetupFeedback({
        type: 'error',
        message: err.message || 'Gagal membuat folder Google Drive.'
      });
    } finally {
      setIsCreatingFolder(false);
    }
  };

  // Direct Sync via Google Sheets API (with mandatory user confirmation)
  const handleDirectSyncToSheet = async () => {
    let token = googleAccessToken || await getAccessToken();
    if (!token) {
      try {
        const res = await googleSignIn();
        if (res) {
          token = res.accessToken;
          setGoogleUser(res.user);
          setGoogleAccessToken(res.accessToken);
        } else {
          return;
        }
      } catch (err: any) {
        setSetupFeedback({
          type: 'error',
          message: 'Silakan hubungkan akun Google untuk sinkronisasi otomatis.'
        });
        return;
      }
    }

    let sheetId = config.sheetId || GoogleWorkspaceApi.extractSpreadsheetId(config.sheetUrl);
    const isPlaceholder = !sheetId || sheetId === '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms';

    if (isPlaceholder) {
      try {
        setIsCreatingSheet(true);
        const created = await GoogleWorkspaceApi.createMagangHubSpreadsheet(
          token,
          'MagangHub Kemnaker - Rekap Logbook Pemagangan'
        );
        sheetId = created.spreadsheetId;
        const updatedConfig: AdminIntegrationConfig = {
          ...config,
          sheetUrl: created.spreadsheetUrl,
          sheetId: created.spreadsheetId,
          sheetTabName: created.sheetTabName
        };
        setConfig(updatedConfig);
        IntegrationService.saveConfig(updatedConfig);
      } catch (createErr: any) {
        setSetupFeedback({
          type: 'error',
          message: `Gagal membuat spreadsheet baru: ${createErr.message}`
        });
        setIsCreatingSheet(false);
        return;
      } finally {
        setIsCreatingSheet(false);
      }
    }

    // Explicit confirmation dialog before modifying Google Spreadsheet (Workspace requirement)
    const confirmed = window.confirm(
      `Konfirmasi Sinkronisasi:\n\nApakah Anda ingin mengirimkan ${entries.length} data catatan logbook ke spreadsheet "${config.sheetTabName || 'Rekap Logbook Magang'}"?\n\nData baru akan ditambahkan langsung ke spreadsheet Google Anda.`
    );
    if (!confirmed) return;

    setIsDirectSyncing(true);
    setSetupFeedback(null);
    try {
      const res = await GoogleWorkspaceApi.syncEntriesDirectlyToSheet(
        token,
        sheetId,
        config.sheetTabName || 'Rekap Logbook Magang',
        entries
      );
      onSyncAll();
      setSetupFeedback({
        type: 'success',
        message: `${res.message} Seluruh data logbook telah berhasil disinkronkan ke Google Sheet!`
      });
    } catch (err: any) {
      setSetupFeedback({
        type: 'error',
        message: err.message || 'Gagal menyinkronkan data ke Google Sheet.'
      });
    } finally {
      setIsDirectSyncing(false);
    }
  };

  // Manual Integration Form Save
  const handleSaveIntegration = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingIntegration(true);
    const updatedConfig: AdminIntegrationConfig = {
      ...config,
      sheetId: GoogleWorkspaceApi.extractSpreadsheetId(config.sheetUrl),
      driveFolderId: GoogleWorkspaceApi.extractDriveFolderId(config.driveFolderUrl)
    };
    IntegrationService.saveConfig(updatedConfig);
    setConfig(updatedConfig);
    setTimeout(() => {
      setIsSavingIntegration(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    }, 300);
  };

  const handleCopyTsv = () => {
    const tsvData = IntegrationService.generateTsvForGoogleSheet(entries);
    navigator.clipboard.writeText(tsvData);
    setCopiedTsv(true);
    setTimeout(() => setCopiedTsv(false), 2500);
  };

  // User Management Handlers
  const handleOpenAddUser = () => {
    setEditingUser(null);
    setUserFormState({
      name: '',
      username: '',
      password: 'password123',
      role: 'user',
      email: '',
      institusiAsal: '',
      jurusan: ''
    });
    setShowAddForm(true);
  };

  const handleOpenEditUser = (user: AppUser) => {
    setEditingUser(user);
    setUserFormState({ ...user });
    setShowAddForm(true);
  };

  const handleSubmitUserForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userFormState.username || !userFormState.name) {
      showUserMsg('Nama dan Username wajib diisi.', 'error');
      return;
    }

    if (editingUser) {
      const updated: AppUser = {
        ...editingUser,
        name: userFormState.name!,
        email: userFormState.email || `${userFormState.username}@maganghub.kemnaker.go.id`,
        role: userFormState.role || 'user',
        password: userFormState.password || editingUser.password,
        institusiAsal: userFormState.institusiAsal || '',
        jurusan: userFormState.jurusan || ''
      };

      const success = AuthService.updateUser(updated);
      if (success) {
        setUsers(AuthService.getUsers());
        setShowAddForm(false);
        onUsersUpdated();
        showUserMsg(`Data user @${updated.username} berhasil diperbarui!`, 'success');
      } else {
        showUserMsg('Gagal memperbarui user.', 'error');
      }
    } else {
      const newUser: AppUser = {
        username: userFormState.username!.trim().toLowerCase(),
        name: userFormState.name!.trim(),
        password: userFormState.password || 'password123',
        role: userFormState.role || 'user',
        email: userFormState.email || `${userFormState.username}@maganghub.kemnaker.go.id`,
        idPeserta: `MH-2026-USR${Date.now().toString().slice(-4)}`,
        institusiAsal: userFormState.institusiAsal || '',
        jurusan: userFormState.jurusan || '',
        createdAt: new Date().toISOString()
      };

      const res = AuthService.addUser(newUser);
      if (res.success) {
        setUsers(AuthService.getUsers());
        setShowAddForm(false);
        onUsersUpdated();
        showUserMsg(`User @${newUser.username} berhasil ditambahkan!`, 'success');
      } else {
        showUserMsg(res.message || 'Gagal menambahkan user.', 'error');
      }
    }
  };

  const handleDeleteUser = (username: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus user @${username}?`)) {
      const res = AuthService.deleteUser(username);
      if (res.success) {
        setUsers(AuthService.getUsers());
        onUsersUpdated();
        showUserMsg(`User @${username} berhasil dihapus.`, 'success');
      } else {
        showUserMsg(res.message || 'Gagal menghapus user.', 'error');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div 
        className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#002B49] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold">Pengaturan Khusus Admin</h2>
                <span className="text-[10px] font-bold bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full">
                  Admin: {currentUser?.name}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Setup integrasi Google Sheet, Google Drive, dan manajemen akun pengguna
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 gap-2 text-xs font-bold">
          <button
            onClick={() => setActiveTab('integration')}
            className={`py-3 px-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'integration'
                ? 'border-sky-800 text-sky-900'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Integrasi Google Sheet & Drive</span>
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`py-3 px-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'users'
                ? 'border-sky-800 text-sky-900'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Users className="w-4 h-4 text-amber-600" />
            <span>Manajemen Pengguna ({users.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('deploy')}
            className={`py-3 px-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'deploy'
                ? 'border-rose-600 text-rose-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Rocket className="w-4 h-4 text-rose-600" />
            <span>Deploy & Reset Data</span>
          </button>
        </div>

        {/* Tab 1: Integrasi Google Sheet & Drive */}
        {activeTab === 'integration' && (
          <div className="p-6 space-y-5 text-xs max-h-[75vh] overflow-y-auto">
            {/* Feedback notification */}
            {setupFeedback && (
              <div className={`p-3.5 rounded-xl text-xs flex items-start gap-2.5 animate-in fade-in ${
                setupFeedback.type === 'success' 
                  ? 'bg-emerald-50 text-emerald-900 border border-emerald-300' 
                  : setupFeedback.type === 'error'
                  ? 'bg-rose-50 text-rose-900 border border-rose-300'
                  : 'bg-sky-50 text-sky-900 border border-sky-300'
              }`}>
                {setupFeedback.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />}
                {setupFeedback.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />}
                {setupFeedback.type === 'info' && <ShieldCheck className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />}
                <div className="font-medium leading-relaxed">{setupFeedback.message}</div>
              </div>
            )}

            {/* Google Account Connection Status Bar */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center shrink-0 shadow-2xs">
                  <svg className="w-5 h-5" viewBox="0 0 48 48">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                  </svg>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-xs">Akun Google Workspace</span>
                    {googleUser ? (
                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                        Terhubung
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full">
                        Belum Terhubung
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {googleUser 
                      ? `${googleUser.displayName || 'Admin'} (${googleUser.email})` 
                      : 'Hubungkan untuk mengizinkan pembuatan otomatis Spreadsheet dan Folder Drive'}
                  </p>
                </div>
              </div>

              <div>
                {googleUser ? (
                  <button
                    type="button"
                    onClick={handleDisconnectGoogle}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-semibold text-xs transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Putuskan</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleConnectGoogle}
                    disabled={isConnectingGoogle}
                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 font-bold text-xs transition-all shadow-2xs disabled:opacity-50"
                  >
                    {isConnectingGoogle ? (
                      <Loader2 className="w-4 h-4 animate-spin text-sky-600" />
                    ) : (
                      <svg className="w-4 h-4" viewBox="0 0 48 48">
                        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                      </svg>
                    )}
                    <span>Hubungkan Akun Google</span>
                  </button>
                )}
              </div>
            </div>

            {/* Asisten Setup Otomatis 1-Klik */}
            <div className="p-4 bg-gradient-to-r from-sky-50 to-blue-50 border border-sky-200 rounded-2xl space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-sky-700" />
                <span className="font-bold text-sky-950 text-xs sm:text-sm">
                  Asisten Setup Otomatis Google Workspace (1-Klik)
                </span>
              </div>
              <p className="text-[11px] text-sky-900 leading-relaxed">
                Anda dapat membuat Google Spreadsheet baru (sudah diformat dengan header kolom resmi MagangHub) dan folder Google Drive tujuan secara langsung:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                {/* Auto Create Sheet */}
                <button
                  type="button"
                  onClick={handleAutoCreateSpreadsheet}
                  disabled={isCreatingSheet}
                  className="p-3 bg-white border border-emerald-300 hover:border-emerald-500 hover:bg-emerald-50/50 rounded-xl text-left transition-all shadow-2xs group flex items-start gap-3 disabled:opacity-60"
                >
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                    {isCreatingSheet ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />}
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 group-hover:text-emerald-800 text-xs">
                      1. Buat Spreadsheet Otomatis
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      Membuat file spreadsheet baru dengan format kolom logbook siap pakai
                    </div>
                  </div>
                </button>

                {/* Auto Create Drive Folder */}
                <button
                  type="button"
                  onClick={handleAutoCreateDriveFolder}
                  disabled={isCreatingFolder}
                  className="p-3 bg-white border border-sky-300 hover:border-sky-500 hover:bg-sky-50/50 rounded-xl text-left transition-all shadow-2xs group flex items-start gap-3 disabled:opacity-60"
                >
                  <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center shrink-0 mt-0.5">
                    {isCreatingFolder ? <Loader2 className="w-4 h-4 animate-spin" /> : <FolderOpen className="w-4 h-4" />}
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 group-hover:text-sky-800 text-xs">
                      2. Buat Folder Drive Otomatis
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      Membuat folder "Dokumentasi Foto MagangHub" untuk foto kegiatan
                    </div>
                  </div>
                </button>
              </div>

              {/* Direct Sync Button */}
              {config.sheetUrl && (
                <div className="pt-2 border-t border-sky-200/60 flex items-center justify-between gap-3">
                  <div className="text-[11px] text-sky-900">
                    Tersedia <strong>{entries.length} data logbook</strong> siap dikirim ke Google Sheet.
                  </div>
                  <button
                    type="button"
                    onClick={handleDirectSyncToSheet}
                    disabled={isDirectSyncing}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-2xs transition-colors disabled:opacity-60"
                  >
                    {isDirectSyncing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                    <span>Sinkronkan ke Sheet Sekarang</span>
                  </button>
                </div>
              )}
            </div>

            {/* Manual Form Configuration */}
            <form onSubmit={handleSaveIntegration} className="space-y-4">
              <div className="font-bold text-slate-800 text-xs border-b border-slate-200 pb-1 flex items-center justify-between">
                <span>Konfigurasi Tautan URL Manual</span>
                <span className="text-[10px] font-normal text-slate-500">
                  Otomatis terisi jika menggunakan tombol setup di atas
                </span>
              </div>

              {/* Section 1: Google Sheets Configuration */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                    <span>URL Google Spreadsheet Tujuan</span>
                  </label>
                  {config.sheetUrl && (
                    <a
                      href={config.sheetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:underline"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Buka Sheet</span>
                    </a>
                  )}
                </div>

                <input
                  type="url"
                  value={config.sheetUrl}
                  onChange={(e) => setConfig({ ...config, sheetUrl: e.target.value })}
                  placeholder="https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Nama Tab Sheet (Worksheet)
                    </label>
                    <input
                      type="text"
                      value={config.sheetTabName}
                      onChange={(e) => setConfig({ ...config, sheetTabName: e.target.value })}
                      placeholder="Rekap Logbook Magang"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      URL Webhook Apps Script (Opsional)
                    </label>
                    <input
                      type="url"
                      value={config.sheetWebhookUrl}
                      onChange={(e) => setConfig({ ...config, sheetWebhookUrl: e.target.value })}
                      placeholder="https://script.google.com/macros/s/.../exec"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Google Drive Folder Configuration */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                    <FolderOpen className="w-4 h-4 text-sky-600" />
                    <span>URL Folder Google Drive untuk Foto Dokumentasi</span>
                  </label>
                  {config.driveFolderUrl && (
                    <a
                      href={config.driveFolderUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-700 hover:underline"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Buka Folder Drive</span>
                    </a>
                  )}
                </div>

                <input
                  type="url"
                  value={config.driveFolderUrl}
                  onChange={(e) => setConfig({ ...config, driveFolderUrl: e.target.value })}
                  placeholder="https://drive.google.com/drive/folders/17kUf0XN2_MagangHub_Dokumentasi_Foto"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                />
              </div>

              {/* Quick Actions (Copy TSV) */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Copy className="w-4 h-4 text-slate-600" />
                  <span>Salin Data Format Tabel (TSV)</span>
                </div>
                <p className="text-slate-500 text-[11px]">
                  Anda juga dapat menyalin format data untuk langsung di-paste ke Google Sheet (Ctrl+V).
                </p>

                <div className="pt-1">
                  <button
                    type="button"
                    onClick={handleCopyTsv}
                    className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 font-bold transition-colors inline-flex items-center gap-1.5 shadow-2xs"
                  >
                    {copiedTsv ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                    <span>{copiedTsv ? 'Tersalin ke Clipboard!' : 'Salin Format TSV'}</span>
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-between border-t border-slate-200">
                <span className="text-[11px] text-slate-500">
                  {saveSuccess ? (
                    <span className="text-emerald-700 font-bold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" />
                      Pengaturan berhasil disimpan!
                    </span>
                  ) : (
                    'Klik simpan setelah mengubah pengaturan'
                  )}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                  >
                    Tutup
                  </button>

                  <button
                    type="submit"
                    disabled={isSavingIntegration}
                    className="px-5 py-2 rounded-xl font-bold text-white bg-[#003B73] hover:bg-sky-800 transition-colors shadow-2xs flex items-center gap-1.5"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Simpan Pengaturan</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* Tab 2: Manajemen Pengguna */}
        {activeTab === 'users' && (
          <div className="p-6 space-y-4 text-xs max-h-[75vh] overflow-y-auto">
            {userMessage && (
              <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                userMessage.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}>
                {userMessage.type === 'success' ? <Check className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />}
                <span>{userMessage.text}</span>
              </div>
            )}

            {/* Add / Edit User Form */}
            {showAddForm ? (
              <form onSubmit={handleSubmitUserForm} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="font-bold text-slate-900 text-xs">
                    {editingUser ? `Edit User: @${editingUser.username}` : 'Tambah User Baru'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Nama Lengkap *</label>
                    <input
                      type="text"
                      value={userFormState.name}
                      onChange={(e) => setUserFormState({ ...userFormState, name: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Username *</label>
                    <input
                      type="text"
                      value={userFormState.username}
                      onChange={(e) => setUserFormState({ ...userFormState, username: e.target.value })}
                      disabled={!!editingUser}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono disabled:bg-slate-100"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Role / Peran *</label>
                    <select
                      value={userFormState.role}
                      onChange={(e) => setUserFormState({ ...userFormState, role: e.target.value as any })}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-bold"
                    >
                      <option value="user">User (Peserta)</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Password</label>
                    <input
                      type="text"
                      value={userFormState.password}
                      onChange={(e) => setUserFormState({ ...userFormState, password: e.target.value })}
                      placeholder="password123"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={userFormState.email}
                      onChange={(e) => setUserFormState({ ...userFormState, email: e.target.value })}
                      placeholder="nama@email.com"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Asal Kampus / Institusi</label>
                    <input
                      type="text"
                      value={userFormState.institusiAsal}
                      onChange={(e) => setUserFormState({ ...userFormState, institusiAsal: e.target.value })}
                      placeholder="Universitas..."
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Jurusan</label>
                    <input
                      type="text"
                      value={userFormState.jurusan}
                      onChange={(e) => setUserFormState({ ...userFormState, jurusan: e.target.value })}
                      placeholder="Teknik..."
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="px-3 py-1.5 rounded-lg text-slate-600 hover:bg-slate-200 font-semibold"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg bg-[#003B73] hover:bg-sky-800 text-white font-bold shadow-2xs"
                  >
                    {editingUser ? 'Simpan Perubahan' : 'Tambahkan User'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="flex items-center justify-between pb-1">
                <span className="font-bold text-slate-800">
                  Daftar Pengguna ({users.length} Akun)
                </span>
                <button
                  type="button"
                  onClick={handleOpenAddUser}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-700 hover:bg-sky-800 text-white font-bold text-xs shadow-2xs"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Tambah Pengguna</span>
                </button>
              </div>
            )}

            {/* Users Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3">Nama & Username</th>
                    <th className="py-2.5 px-3">Role</th>
                    <th className="py-2.5 px-3">Email & Institusi</th>
                    <th className="py-2.5 px-3 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map((u) => {
                    const isCurrent = currentUser?.username.toLowerCase() === u.username.toLowerCase();

                    return (
                      <tr key={u.username} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-3">
                          <div className="font-bold text-slate-900 flex items-center gap-1.5">
                            <span>{u.name}</span>
                            {isCurrent && (
                              <span className="text-[9px] bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded font-bold">
                                Anda
                              </span>
                            )}
                          </div>
                          <div className="font-mono text-[11px] text-sky-800 mt-0.5">
                            @{u.username}
                          </div>
                        </td>

                        <td className="py-3 px-3">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                            u.role === 'admin' 
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}>
                            {u.role === 'admin' ? (
                              <>
                                <ShieldCheck className="w-3 h-3 text-amber-600" />
                                <span>Admin</span>
                              </>
                            ) : (
                              <>
                                <UserCheck className="w-3 h-3 text-slate-500" />
                                <span>User</span>
                              </>
                            )}
                          </span>
                        </td>

                        <td className="py-3 px-3">
                          <div className="font-mono text-[11px] text-slate-600">{u.email}</div>
                          <div className="text-[10px] text-slate-400">{u.institusiAsal || '-'}</div>
                        </td>

                        <td className="py-3 px-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleOpenEditUser(u)}
                              className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-md transition-colors"
                              title="Edit User"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>

                            {!isCurrent && (
                              <button
                                onClick={() => handleDeleteUser(u.username)}
                                className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                                title="Hapus User"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 font-semibold"
              >
                Tutup
              </button>
            </div>
          </div>
        )}

        {/* Tab 3: Persiapan Deploy & Reset Data Logbook */}
        {activeTab === 'deploy' && (
          <div className="p-6 space-y-6 text-xs max-h-[75vh] overflow-y-auto">
            {/* Feedback notification */}
            {clearFeedback && (
              <div className="p-3.5 rounded-xl text-xs flex items-start gap-2.5 animate-in fade-in bg-emerald-50 text-emerald-900 border border-emerald-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div className="font-medium leading-relaxed">{clearFeedback}</div>
              </div>
            )}

            {/* Overview Banner */}
            <div className="p-5 rounded-2xl bg-gradient-to-r from-rose-50 via-amber-50 to-orange-50 border border-rose-200/80 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shadow-xs">
                  <Rocket className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Persiapan Deployment Produksi (Reset Logbook)
                  </h3>
                  <p className="text-slate-600 text-[11px]">
                    Hapus seluruh riwayat logbook uji coba untuk memulai penggunaan resmi.
                  </p>
                </div>
              </div>
              <p className="text-slate-600 leading-relaxed text-[11px]">
                Fitur ini dirancang khusus saat Anda akan mempublikasikan atau mendepoloy aplikasi ke peserta magang. Seluruh catatan logbook harian, mingguan, dan foto dokumentasi akan dikosongkan, sedangkan <strong>seluruh akun pengguna, password, hak akses, dan profil peserta tetap tersimpan utuh</strong>.
              </p>
            </div>

            {/* Status Statistics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="text-[11px] text-slate-500 font-medium">Catatan Logbook</div>
                <div className="text-lg font-black text-rose-600 mt-0.5">
                  {entries.length} Entri
                </div>
                <div className="text-[10px] text-slate-400 mt-1">Akan dihapus / dikosongkan</div>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="text-[11px] text-slate-500 font-medium">Akun Pengguna</div>
                <div className="text-lg font-black text-emerald-600 mt-0.5">
                  {users.length} Akun
                </div>
                <div className="text-[10px] text-emerald-600 font-semibold mt-1">✓ Aman, TIDAK dihapus</div>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="text-[11px] text-slate-500 font-medium">Akun Admin Aktif</div>
                <div className="text-lg font-black text-[#003B73] mt-0.5">
                  @{currentUser?.username}
                </div>
                <div className="text-[10px] text-slate-500 mt-1">Sesi login tetap aktif</div>
              </div>
            </div>

            {/* Checklist Penjelasan */}
            <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-2">
              <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Rincian Pengaruh Reset Data Logbook</span>
              </h4>
              <ul className="space-y-1.5 text-slate-600 text-[11px]">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span><strong>Akun Login Terjaga:</strong> User <code className="bg-slate-100 px-1 rounded text-slate-800">ainunnn</code>, <code className="bg-slate-100 px-1 rounded text-slate-800">ayuazhara</code>, <code className="bg-slate-100 px-1 rounded text-slate-800">aliyah</code>, serta user tambahan tetap bisa login seperti biasa.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span><strong>Pengaturan Integrasi:</strong> Konfigurasi Google Sheet & Drive tetap tersimpan.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-600 font-bold">✗</span>
                  <span><strong>Isi Logbook Dikosongkan:</strong> Tabel logbook akan bersih (0 baris), siap mencatat aktivitas nyata peserta magang.</span>
                </li>
              </ul>
            </div>

            {/* Danger Action Area */}
            <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/50 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-rose-900 text-xs">
                    Eksekusi Reset Logbook
                  </h4>
                  <p className="text-rose-700 text-[11px]">
                    Pastikan Anda telah melakukan ekspor atau backup jika masih membutuhkan data uji coba.
                  </p>
                </div>
              </div>

              {!confirmClearOpen ? (
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setConfirmClearOpen(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl transition-all shadow-xs"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Kosongkan Seluruh Isi Logbook</span>
                  </button>

                  {onReloadSampleEntries && entries.length === 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        onReloadSampleEntries();
                        setClearFeedback('Data sampel logbook berhasil dimuat kembali untuk pengujian.');
                        setTimeout(() => setClearFeedback(null), 4000);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-colors border border-slate-300"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Muat Ulang Sampel Demo</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-white border border-rose-300 space-y-3.5 animate-in fade-in">
                  <div className="flex items-start gap-2 text-rose-900 font-semibold text-xs">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <span>Konfirmasi Terakhir: Anda akan mengosongkan {entries.length} catatan logbook. Seluruh akun pengguna dan hak akses tetap aman.</span>
                  </div>

                  {/* Option to also clear Google Sheet */}
                  <label className="flex items-start gap-2.5 p-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
                    <input
                      type="checkbox"
                      checked={alsoClearSheet}
                      onChange={(e) => setAlsoClearSheet(e.target.checked)}
                      className="mt-0.5 rounded border-slate-300 text-sky-800 focus:ring-sky-600"
                    />
                    <div className="text-[11px] text-slate-700 leading-snug">
                      <strong className="text-slate-900 block font-semibold">Juga kosongkan seluruh isi baris di Google Sheet</strong>
                      Menghapus data baris A2 ke bawah di Google Sheet agar spreadsheet juga bersih, dengan tetap mempertahankan baris judul/header kolom standar.
                    </div>
                  </label>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      disabled={isClearingForDeploy}
                      onClick={async () => {
                        setIsClearingForDeploy(true);
                        try {
                          if (onClearAllEntries) {
                            onClearAllEntries();
                          }
                          let sheetMsg = '';
                          if (alsoClearSheet) {
                            const sheetRes = await IntegrationService.clearGoogleSheetData();
                            if (sheetRes.success) {
                              sheetMsg = ' Baris data pada Google Sheet juga telah dibersihkan (header tetap rapi).';
                            } else {
                              sheetMsg = ` Catatan Google Sheet: ${sheetRes.message}`;
                            }
                          }
                          setConfirmClearOpen(false);
                          setClearFeedback(`Berhasil! Seluruh catatan logbook telah dikosongkan.${sheetMsg} Aplikasi siap untuk dideploy!`);
                          setTimeout(() => setClearFeedback(null), 7000);
                        } finally {
                          setIsClearingForDeploy(false);
                        }
                      }}
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5"
                    >
                      {isClearingForDeploy ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Sedang Mengosongkan...</span>
                        </>
                      ) : (
                        <span>Ya, Kosongkan Semua Logbook</span>
                      )}
                    </button>
                    <button
                      type="button"
                      disabled={isClearingForDeploy}
                      onClick={() => setConfirmClearOpen(false)}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-colors border border-slate-300"
                    >
                      Batal
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Standalone Google Sheet Clear Card */}
            <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
                  <h4 className="font-bold text-emerald-950 text-xs">
                    Kosongkan Isi Google Sheet Saja
                  </h4>
                </div>
                {config.sheetUrl && (
                  <a
                    href={config.sheetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] font-bold text-emerald-800 hover:underline inline-flex items-center gap-1"
                  >
                    <span>Buka Sheet</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
              <p className="text-emerald-800 text-[11px] leading-relaxed">
                Ingin membersihkan isi Google Sheet tanpa menghapus data logbook di aplikasi? Fitur ini akan menghapus baris data (A2 ke bawah) pada Google Sheet dan merapikan kembali header kolom standar Kemnaker RI.
              </p>
              <div className="pt-1">
                <button
                  type="button"
                  disabled={isClearingSheetOnly}
                  onClick={async () => {
                    const confirmed = window.confirm(
                      'Konfirmasi: Apakah Anda ingin mengosongkan seluruh baris isi pada file Google Sheet? Baris judul/header kolom akan tetap dipertahankan.'
                    );
                    if (!confirmed) return;
                    setIsClearingSheetOnly(true);
                    try {
                      const res = await IntegrationService.clearGoogleSheetData();
                      if (res.success) {
                        setClearFeedback(res.message);
                      } else {
                        setClearFeedback(`Gagal: ${res.message}`);
                      }
                      setTimeout(() => setClearFeedback(null), 6000);
                    } finally {
                      setIsClearingSheetOnly(false);
                    }
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl transition-all shadow-2xs text-[11px]"
                >
                  {isClearingSheetOnly ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span>Sedang Mengosongkan Sheet...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-3 h-3" />
                      <span>Bersihkan Seluruh Isi Google Sheet</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 font-semibold"
              >
                Tutup
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminSettingsModal;
