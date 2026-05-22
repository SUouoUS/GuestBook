import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// A mock implementation of Supabase Client for local testing when credentials are not configured.
class MockSupabaseClient {
  private listeners: ((event: string, session: any) => void)[] = [];
  private realtimeListeners: { channel: string; event: string; callback: (payload: any) => void }[] = [];

  constructor() {
    if (typeof window !== 'undefined') {
      // Initialize default mock data if not present
      if (!localStorage.getItem('mock_users')) {
        localStorage.setItem('mock_users', JSON.stringify([]));
      }
      if (!localStorage.getItem('mock_messages_v2')) {
        localStorage.setItem('mock_messages_v2', JSON.stringify([]));
      }
    }
  }

  // Auth APIs
  auth = {
    signUp: async ({ email, password }: any) => {
      if (typeof window === 'undefined') return { data: null, error: { message: 'Window not defined' } };
      const users = JSON.parse(localStorage.getItem('mock_users') || '[]');
      if (users.find((u: any) => u.email === email)) {
        return { data: null, error: { message: '이미 가입된 이메일입니다.' } };
      }
      users.push({ email, password, id: `user_${Math.random().toString(36).substr(2, 9)}` });
      localStorage.setItem('mock_users', JSON.stringify(users));
      return { data: { user: { email } }, error: null };
    },

    signInWithPassword: async ({ email, password }: any) => {
      if (typeof window === 'undefined') return { data: null, error: { message: 'Window not defined' } };
      const users = JSON.parse(localStorage.getItem('mock_users') || '[]');
      const user = users.find((u: any) => u.email === email && u.password === password);
      if (!user) {
        return { data: null, error: { message: '이메일 또는 비밀번호가 일치하지 않습니다. (회원가입이 안 되어있다면 먼저 가입해주세요!)' } };
      }
      const session = {
        access_token: 'mock-token',
        refresh_token: 'mock-refresh',
        expires_in: 3600,
        token_type: 'bearer',
        user: { id: user.id, email: user.email }
      };
      localStorage.setItem('mock_session', JSON.stringify(session));
      this.triggerAuthChange('SIGNED_IN', session);
      return { data: { session, user: session.user }, error: null };
    },

    signOut: async () => {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('mock_session');
      }
      this.triggerAuthChange('SIGNED_OUT', null);
      return { error: null };
    },

    getSession: async () => {
      if (typeof window === 'undefined') return { data: { session: null }, error: null };
      const sessionStr = localStorage.getItem('mock_session');
      const session = sessionStr ? JSON.parse(sessionStr) : null;
      return { data: { session }, error: null };
    },

    onAuthStateChange: (callback: any) => {
      this.listeners.push(callback);
      if (typeof window !== 'undefined') {
        const sessionStr = localStorage.getItem('mock_session');
        const session = sessionStr ? JSON.parse(sessionStr) : null;
        callback('INITIAL_SESSION', session);
      } else {
        callback('INITIAL_SESSION', null);
      }
      return {
        data: {
          subscription: {
            unsubscribe: () => {
              this.listeners = this.listeners.filter(l => l !== callback);
            }
          }
        }
      };
    }
  };

  private triggerAuthChange(event: string, session: any) {
    this.listeners.forEach(cb => cb(event, session));
  }

  // Database APIs
  from(table: string) {
    if (table !== 'messages') {
      throw new Error(`Unsupported mock table: ${table}`);
    }

    const self = this;
    return {
      select: (columns: string) => {
        return {
          order: (column: string, { ascending }: { ascending: boolean }) => {
            if (typeof window === 'undefined') return Promise.resolve({ data: [], error: null });
            let messages = JSON.parse(localStorage.getItem('mock_messages_v2') || '[]');
            messages.sort((a: any, b: any) => {
              const dateA = new Date(a[column]).getTime();
              const dateB = new Date(b[column]).getTime();
              return ascending ? dateA - dateB : dateB - dateA;
            });
            return Promise.resolve({ data: messages, error: null });
          }
        };
      },

      insert: (rows: any[]) => {
        return {
          select: () => {
            return {
              single: () => {
                if (typeof window === 'undefined') return Promise.resolve({ data: null, error: { message: 'Window not defined' } });
                const messages = JSON.parse(localStorage.getItem('mock_messages_v2') || '[]');
                const newRow = {
                  ...rows[0],
                  id: `msg_${Math.random().toString(36).substr(2, 9)}`,
                  created_at: new Date().toISOString()
                };
                messages.unshift(newRow);
                localStorage.setItem('mock_messages_v2', JSON.stringify(messages));
                
                self.triggerRealtimeChange('INSERT', newRow);

                return Promise.resolve({ data: newRow, error: null });
              }
            };
          }
        };
      },

      update: (fields: any) => {
        return {
          eq: (column: string, value: any) => {
            if (typeof window === 'undefined') return Promise.resolve({ data: null, error: { message: 'Window not defined' } });
            const messages = JSON.parse(localStorage.getItem('mock_messages_v2') || '[]');
            let updatedRow: any = null;
            const newMessages = messages.map((m: any) => {
              if (m[column] === value) {
                updatedRow = { ...m, ...fields };
                return updatedRow;
              }
              return m;
            });
            localStorage.setItem('mock_messages_v2', JSON.stringify(newMessages));

            if (updatedRow) {
              self.triggerRealtimeChange('UPDATE', updatedRow);
            }

            return Promise.resolve({ data: updatedRow, error: null });
          }
        };
      }
    };
  }

  // Realtime channel APIs
  channel(name: string) {
    const self = this;
    return {
      on: (event: string, filter: any, callback: any) => {
        self.realtimeListeners.push({ channel: name, event, callback });
        return self.channel(name);
      },
      subscribe: () => {
        return {
          unsubscribe: () => {
            self.realtimeListeners = self.realtimeListeners.filter(l => l.channel !== name);
          }
        };
      }
    };
  }

  removeChannel(channel: any) {
    // handled inside subscription unsubscribe, or no-op
  }

  private triggerRealtimeChange(event: string, payload: any) {
    this.realtimeListeners.forEach(listener => {
      if (listener.event === '*' || listener.event === event) {
        listener.callback({ new: payload });
      }
    });
  }
}

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : (new MockSupabaseClient() as any);

