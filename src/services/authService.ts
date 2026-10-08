import { AppUser, AuthUser } from '../types';
import { INITIAL_USERS } from '../data/initialData';

const SESSION_KEY = 'maganghub_auth_session';
const USERS_STORAGE_KEY = 'maganghub_registered_users';

export class AuthService {
  static getUsers(): AppUser[] {
    try {
      const data = localStorage.getItem(USERS_STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Error loading users', e);
    }
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(INITIAL_USERS));
    return INITIAL_USERS;
  }

  static saveUsers(users: AppUser[]): void {
    try {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    } catch (e) {
      console.error('Error saving users', e);
    }
  }

  static getCurrentUser(): AuthUser | null {
    try {
      const session = localStorage.getItem(SESSION_KEY);
      if (session) {
        return JSON.parse(session);
      }
    } catch (e) {
      console.error('Error getting auth session', e);
    }
    return null;
  }

  static login(usernameOrEmail: string, password: string): { success: boolean; user?: AuthUser; message?: string } {
    const users = this.getUsers();
    const cleanInput = usernameOrEmail.trim().toLowerCase();

    const matched = users.find(
      u => (u.username.toLowerCase() === cleanInput || u.email.toLowerCase() === cleanInput) && u.password === password
    );

    if (matched) {
      const user: AuthUser = {
        username: matched.username,
        email: matched.email,
        name: matched.name,
        role: matched.role,
        idPeserta: matched.idPeserta,
        token: `token-mh-${Date.now()}`,
        loginTime: new Date().toISOString()
      };
      localStorage.setItem(SESSION_KEY, JSON.stringify(user));
      return { success: true, user };
    }

    return { 
      success: false, 
      message: 'Username/Email atau Password tidak cocok. Silakan periksa kembali.' 
    };
  }

  static logout(): void {
    localStorage.removeItem(SESSION_KEY);
  }

  // Admin User Management Operations
  static addUser(newUser: AppUser): { success: boolean; message?: string } {
    const users = this.getUsers();
    const exists = users.some(u => u.username.toLowerCase() === newUser.username.toLowerCase());
    if (exists) {
      return { success: false, message: 'Username sudah digunakan oleh akun lain.' };
    }

    const updated = [...users, newUser];
    this.saveUsers(updated);
    return { success: true };
  }

  static updateUser(updatedUser: AppUser): boolean {
    const users = this.getUsers();
    const index = users.findIndex(u => u.username.toLowerCase() === updatedUser.username.toLowerCase());
    if (index >= 0) {
      users[index] = { ...updatedUser };
      this.saveUsers(users);

      // If updating current active session
      const current = this.getCurrentUser();
      if (current && current.username.toLowerCase() === updatedUser.username.toLowerCase()) {
        const updatedSession: AuthUser = {
          ...current,
          name: updatedUser.name,
          email: updatedUser.email,
          role: updatedUser.role
        };
        localStorage.setItem(SESSION_KEY, JSON.stringify(updatedSession));
      }
      return true;
    }
    return false;
  }

  static deleteUser(username: string): { success: boolean; message?: string } {
    const current = this.getCurrentUser();
    if (current && current.username.toLowerCase() === username.toLowerCase()) {
      return { success: false, message: 'Anda tidak dapat menghapus akun Anda sendiri saat sedang aktif.' };
    }

    const users = this.getUsers();
    const updated = users.filter(u => u.username.toLowerCase() !== username.toLowerCase());
    this.saveUsers(updated);
    return { success: true };
  }
}
