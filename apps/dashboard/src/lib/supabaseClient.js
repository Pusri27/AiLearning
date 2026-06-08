import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('--- SUPABASE CONFIG CHECK ---');
console.log('URL:', supabaseUrl);
console.log('Key Length:', supabaseAnonKey?.length || 0);

class MockQueryBuilder {
  constructor(tableName, client) {
    this.tableName = tableName;
    this.client = client;
    this.filters = [];
    this.sortCol = null;
    this.sortAsc = true;
    this.limitVal = null;
    this.isSingle = false;
    this.isMaybeSingle = false;
    this.countOption = null;
    this.headOption = false;
  }

  eq(col, val) {
    this.filters.push(row => row[col] === val);
    return this;
  }

  neq(col, val) {
    this.filters.push(row => row[col] !== val);
    return this;
  }

  in(col, vals) {
    this.filters.push(row => Array.isArray(vals) && vals.includes(row[col]));
    return this;
  }

  gt(col, val) {
    this.filters.push(row => row[col] > val);
    return this;
  }

  lt(col, val) {
    this.filters.push(row => row[col] < val);
    return this;
  }

  order(col, { ascending = true } = {}) {
    this.sortCol = col;
    this.sortAsc = ascending;
    return this;
  }

  limit(n) {
    this.limitVal = n;
    return this;
  }

  single() {
    this.isSingle = true;
    return this;
  }

  maybeSingle() {
    this.isMaybeSingle = true;
    return this;
  }

  select(columns, options) {
    if (options) {
      if (options.count) this.countOption = options.count;
      if (options.head) this.headOption = options.head;
    }
    return this;
  }

  or(expr) {
    this.filters.push(row => {
      if (expr.includes('),and(')) {
        const clauses = expr.split('),');
        for (const clause of clauses) {
          let clean = clause.replace('and(', '').replace(')', '');
          const conditions = clean.split(',');
          let allMatch = true;
          for (const cond of conditions) {
            if (!this.evaluateCondition(row, cond)) {
              allMatch = false;
              break;
            }
          }
          if (allMatch) return true;
        }
        return false;
      } else {
        const conditions = expr.split(',');
        for (const cond of conditions) {
          if (this.evaluateCondition(row, cond)) return true;
        }
        return false;
      }
    });
    return this;
  }

  evaluateCondition(row, cond) {
    if (cond.includes('.eq.')) {
      const [col, val] = cond.split('.eq.');
      return String(row[col]) === val;
    }
    if (cond.includes('.is.null')) {
      const col = cond.split('.is.null')[0];
      return row[col] === null || row[col] === undefined;
    }
    if (cond.includes('.ilike.')) {
      const [col, valPattern] = cond.split('.ilike.');
      const query = valPattern.replace(/%/g, '').toLowerCase();
      return row[col] && String(row[col]).toLowerCase().includes(query);
    }
    return false;
  }

  async then(onFulfilled, onRejected) {
    try {
      const result = await this.execute();
      return onFulfilled(result);
    } catch (err) {
      if (onRejected) return onRejected(err);
      throw err;
    }
  }

  async execute() {
    let tableData = this.client.getTable(this.tableName);

    for (const filterFn of this.filters) {
      tableData = tableData.filter(filterFn);
    }

    if (this.sortCol) {
      tableData = [...tableData].sort((a, b) => {
        let valA = a[this.sortCol];
        let valB = b[this.sortCol];
        
        if (typeof valA === 'string' && Date.parse(valA)) {
          valA = new Date(valA).getTime();
          valB = new Date(valB).getTime();
        }
        
        if (valA < valB) return this.sortAsc ? -1 : 1;
        if (valA > valB) return this.sortAsc ? 1 : -1;
        return 0;
      });
    }

    let count = null;
    if (this.countOption) {
      count = tableData.length;
    }

    if (this.headOption) {
      return { data: [], error: null, count };
    }

    if (this.limitVal !== null) {
      tableData = tableData.slice(0, this.limitVal);
    }

    tableData = tableData.map(row => {
      const cloned = { ...row };
      
      if (cloned.user_id) {
        const profile = this.client.getTable('profiles').find(p => p.id === cloned.user_id);
        if (profile) {
          cloned.profiles = {
            id: profile.id,
            full_name: profile.full_name,
            avatar_url: profile.avatar_url,
            username: profile.username,
            role: profile.role || 'student'
          };
        }
      }

      if (cloned.sender_id) {
        const sender = this.client.getTable('profiles').find(p => p.id === cloned.sender_id);
        if (sender) {
          cloned.sender = {
            id: sender.id,
            full_name: sender.full_name,
            avatar_url: sender.avatar_url,
            username: sender.username,
            role: sender.role || 'student'
          };
        }
      }

      if (cloned.author_id) {
        const author = this.client.getTable('profiles').find(p => p.id === cloned.author_id);
        if (author) {
          cloned.profiles = {
            id: author.id,
            full_name: author.full_name,
            avatar_url: author.avatar_url,
            username: author.username,
            role: author.role || 'student'
          };
        }
      }

      if (this.tableName === 'course_sections') {
        const syllabus = this.client.getTable('course_syllabus')
          .filter(s => s.section_id === cloned.id)
          .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
        cloned.course_syllabus = syllabus;
      }

      return cloned;
    });

    if (this.isSingle) {
      if (tableData.length === 0) {
        return { data: null, error: { message: 'Row not found', code: 'PGRST116' } };
      }
      return { data: tableData[0], error: null };
    }

    if (this.isMaybeSingle) {
      return { data: tableData.length > 0 ? tableData[0] : null, error: null };
    }

    return { data: tableData, error: null, count };
  }

  async insert(data) {
    const tableData = this.client.getTable(this.tableName);
    const rows = Array.isArray(data) ? data : [data];
    const newRows = [];
    
    for (const row of rows) {
      const newRow = {
        id: row.id || this.client.generateId(this.tableName),
        created_at: new Date().toISOString(),
        ...row
      };
      tableData.push(newRow);
      newRows.push(newRow);
    }
    
    this.client.setTable(this.tableName, tableData);
    this.client.broadcastChange(this.tableName, 'INSERT', newRows);

    return { data: Array.isArray(data) ? newRows : newRows[0], error: null };
  }

  async update(changes) {
    let tableData = this.client.getTable(this.tableName);
    const updatedRows = [];
    
    tableData = tableData.map(row => {
      let match = true;
      for (const filterFn of this.filters) {
        if (!filterFn(row)) {
          match = false;
          break;
        }
      }
      if (match) {
        const updated = { ...row, ...changes, updated_at: new Date().toISOString() };
        updatedRows.push(updated);
        return updated;
      }
      return row;
    });
    
    this.client.setTable(this.tableName, tableData);
    this.client.broadcastChange(this.tableName, 'UPDATE', updatedRows);
    
    return { data: updatedRows, error: null };
  }

  async delete() {
    const tableData = this.client.getTable(this.tableName);
    const remaining = [];
    const deleted = [];
    
    for (const row of tableData) {
      let match = true;
      for (const filterFn of this.filters) {
        if (!filterFn(row)) {
          match = false;
          break;
        }
      }
      if (match) {
        deleted.push(row);
      } else {
        remaining.push(row);
      }
    }
    
    this.client.setTable(this.tableName, remaining);
    this.client.broadcastChange(this.tableName, 'DELETE', deleted);
    
    return { data: deleted, error: null };
  }

  async upsert(data, options) {
    const rows = Array.isArray(data) ? data : [data];
    let tableData = this.client.getTable(this.tableName);
    const upserted = [];

    for (const row of rows) {
      let index = -1;
      if (row.id) {
        index = tableData.findIndex(r => r.id === row.id);
      } else if (this.tableName === 'enrollments') {
        index = tableData.findIndex(r => r.user_id === row.user_id && r.course_id === row.course_id);
      } else if (this.tableName === 'user_progress') {
        index = tableData.findIndex(r => r.user_id === row.user_id && r.syllabus_id === row.syllabus_id);
      } else if (this.tableName === 'wishlist') {
        index = tableData.findIndex(r => r.user_id === row.user_id && r.course_id === row.course_id);
      } else if (this.tableName === 'cart') {
        index = tableData.findIndex(r => r.user_id === row.user_id && r.course_id === row.course_id);
      } else if (this.tableName === 'profiles') {
        index = tableData.findIndex(r => r.id === row.id);
      } else if (this.tableName === 'submissions') {
        index = tableData.findIndex(r => r.student_id === row.student_id && r.syllabus_id === row.syllabus_id);
      } else if (this.tableName === 'payment_methods') {
        index = tableData.findIndex(r => r.user_id === row.user_id && r.card_number === row.card_number);
      }

      if (index !== -1) {
        const updated = { ...tableData[index], ...row, updated_at: new Date().toISOString() };
        tableData[index] = updated;
        upserted.push(updated);
      } else {
        const inserted = {
          id: row.id || this.client.generateId(this.tableName),
          created_at: new Date().toISOString(),
          ...row
        };
        tableData.push(inserted);
        upserted.push(inserted);
      }
    }

    this.client.setTable(this.tableName, tableData);
    this.client.broadcastChange(this.tableName, 'INSERT', upserted);

    return { data: Array.isArray(data) ? upserted : upserted[0], error: null };
  }
}

class MockAuth {
  constructor(client) {
    this.client = client;
    this.listeners = new Set();
  }

  getSessionSync() {
    const sessionStr = localStorage.getItem('mock_supabase_session');
    if (sessionStr) {
      try {
        return JSON.parse(sessionStr);
      } catch (e) {
        return null;
      }
    }
    return null;
  }

  async getSession() {
    return { data: { session: this.getSessionSync() }, error: null };
  }

  async getUser() {
    const session = this.getSessionSync();
    return { data: { user: session ? session.user : null }, error: null };
  }

  onAuthStateChange(callback) {
    const session = this.getSessionSync();
    setTimeout(() => {
      callback('SIGNED_IN', session);
    }, 0);

    const listener = { callback };
    this.listeners.add(listener);

    return {
      data: {
        subscription: {
          unsubscribe: () => {
            this.listeners.delete(listener);
          }
        }
      }
    };
  }

  triggerAuthChange(event, session) {
    for (const listener of this.listeners) {
      listener.callback(event, session);
    }
  }

  async signUp({ email, password, options }) {
    const users = this.client.getTable('auth_users');
    const existing = users.find(u => u.email === email);
    if (existing) {
      return { data: { user: null }, error: { message: 'User already exists' } };
    }

    const userId = 'user-uuid-' + Math.random().toString(36).substr(2, 9);
    const newUser = {
      id: userId,
      email,
      role: 'authenticated',
      raw_user_meta_data: options?.data || {},
      created_at: new Date().toISOString()
    };
    users.push(newUser);
    this.client.setTable('auth_users', users);

    const profiles = this.client.getTable('profiles');
    const fullName = options?.data?.full_name || email.split('@')[0];
    const username = email.split('@')[0];
    const friendCode = 'FRND-' + Math.random().toString(36).substr(2, 5).toUpperCase();
    const newProfile = {
      id: userId,
      full_name: fullName,
      username: username,
      avatar_url: `https://api.dicebear.com/7.x/pixel-art/svg?seed=${username}`,
      friend_code: friendCode,
      role: 'student',
      updated_at: new Date().toISOString()
    };
    profiles.push(newProfile);
    this.client.setTable('profiles', profiles);

    const session = {
      access_token: 'mock-access-token-' + userId,
      refresh_token: 'mock-refresh-token-' + userId,
      expires_in: 3600,
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      user: newUser
    };

    localStorage.setItem('mock_supabase_session', JSON.stringify(session));
    this.triggerAuthChange('SIGNED_IN', session);

    return { data: { user: newUser, session }, error: null };
  }

  async signInWithPassword({ email, password }) {
    const users = this.client.getTable('auth_users');
    let user = users.find(u => u.email === email);
    
    if (!user) {
      const seedEmails = [
        'rian_mabar@ailearning.com',
        'siti_coder@ailearning.com',
        'dewi_melody@ailearning.com',
        'budi_design@ailearning.com',
        'chef_andi@ailearning.com',
        'prof_eko@ailearning.com'
      ];
      if (seedEmails.includes(email)) {
        const username = email.split('@')[0];
        const profile = this.client.getTable('profiles').find(p => p.username === username);
        const userId = profile ? profile.id : 'user-uuid-' + username;
        
        user = {
          id: userId,
          email,
          role: 'authenticated',
          raw_user_meta_data: { full_name: profile ? profile.full_name : username },
          created_at: new Date().toISOString()
        };
        users.push(user);
        this.client.setTable('auth_users', users);
      } else {
        return { data: { session: null, user: null }, error: { message: 'Invalid login credentials' } };
      }
    }

    const session = {
      access_token: 'mock-access-token-' + user.id,
      refresh_token: 'mock-refresh-token-' + user.id,
      expires_in: 3600,
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      user
    };

    localStorage.setItem('mock_supabase_session', JSON.stringify(session));
    this.triggerAuthChange('SIGNED_IN', session);

    return { data: { session, user }, error: null };
  }

  async signOut() {
    localStorage.removeItem('mock_supabase_session');
    this.triggerAuthChange('SIGNED_OUT', null);
    return { data: null, error: null };
  }

  async updateUser({ password, data }) {
    const session = this.getSessionSync();
    if (!session) return { data: null, error: { message: 'Not logged in' } };

    if (data) {
      session.user.raw_user_meta_data = { ...session.user.raw_user_meta_data, ...data };
      localStorage.setItem('mock_supabase_session', JSON.stringify(session));
    }
    return { data: { user: session.user }, error: null };
  }
}

class MockChannel {
  constructor(name, client) {
    this.name = name;
    this.client = client;
    this.callbacks = [];
    this.presenceState = {};
  }

  on(type, filter, callback) {
    if (typeof filter === 'function') {
      this.callbacks.push({ type, filter: {}, callback: filter });
    } else {
      this.callbacks.push({ type, filter, callback });
    }
    return this;
  }

  subscribe(statusCallback) {
    this.client.registerChannel(this);
    if (statusCallback) {
      setTimeout(() => statusCallback('SUBSCRIBED'), 10);
    }
    
    const hasPresence = this.callbacks.some(c => c.type === 'presence');
    if (hasPresence) {
      setTimeout(() => {
        const presenceSyncCb = this.callbacks.find(c => c.type === 'presence' && c.filter.event === 'sync');
        if (presenceSyncCb) presenceSyncCb.callback();
      }, 50);
    }
    
    return this;
  }

  track(state) {
    this.presenceState = state;
    this.client.broadcastPresenceSync(this.name);
    return {
      promise: Promise.resolve('ok')
    };
  }

  send(payload) {
    this.client.broadcastMessage(this.name, payload);
    return Promise.resolve('ok');
  }

  unsubscribe() {
    this.client.unregisterChannel(this);
  }
}

class MockSupabaseClient {
  constructor() {
    this.channels = new Set();
    this.auth = new MockAuth(this);
    this.storage = {
      from: (bucket) => ({
        upload: async (path, file) => {
          return { data: { path }, error: null };
        },
        getPublicUrl: (path) => {
          if (path.includes('avatars')) {
            const seed = path.split('/').pop() || 'user';
            return { data: { publicUrl: `https://api.dicebear.com/7.x/pixel-art/svg?seed=${seed}` } };
          }
          return { data: { publicUrl: `https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=600` } };
        }
      })
    };
    this.seedDatabase();
  }

  getTable(name) {
    const data = localStorage.getItem(`mock_db_${name}`);
    if (data) return JSON.parse(data);
    return [];
  }

  setTable(name, data) {
    localStorage.setItem(`mock_db_${name}`, JSON.stringify(data));
  }

  registerChannel(channel) {
    this.channels.add(channel);
  }

  unregisterChannel(channel) {
    this.channels.delete(channel);
  }

  removeChannel(channel) {
    if (channel) {
      channel.unsubscribe();
    }
  }

  channel(name) {
    return new MockChannel(name, this);
  }

  from(tableName) {
    return new MockQueryBuilder(tableName, this);
  }

  async rpc(funcName, params) {
    if (funcName === 'add_friend_by_code') {
      const code = params.friend_code_input;
      const profiles = this.getTable('profiles');
      const found = profiles.find(p => p.friend_code === code);
      if (!found) {
        return { data: null, error: { message: 'Friend code not found' } };
      }
      
      const session = this.auth.getSessionSync();
      if (!session) return { data: null, error: { message: 'Not logged in' } };
      
      const friends = this.getTable('friends');
      
      if (!friends.some(f => f.user_id === session.user.id && f.friend_id === found.id)) {
        friends.push({
          id: this.generateId('friends'),
          user_id: session.user.id,
          friend_id: found.id,
          created_at: new Date().toISOString()
        });
      }
      if (!friends.some(f => f.user_id === found.id && f.friend_id === session.user.id)) {
        friends.push({
          id: this.generateId('friends'),
          user_id: found.id,
          friend_id: session.user.id,
          created_at: new Date().toISOString()
        });
      }
      this.setTable('friends', friends);
      
      return { data: found, error: null };
    }
    return { data: null, error: { message: 'RPC not implemented' } };
  }

  generateId(tableName) {
    const tableData = this.getTable(tableName);
    const numericTables = ['courses', 'course_sections', 'course_syllabus', 'enrollments', 'wishlist', 'cart', 'user_progress', 'payment_methods', 'submissions', 'user_achievements'];
    if (numericTables.includes(tableName)) {
      const maxId = tableData.reduce((max, r) => {
        const idNum = Number(r.id);
        return isNaN(idNum) ? max : Math.max(max, idNum);
      }, 0);
      return maxId + 1;
    }
    return 'mock-uuid-' + Math.random().toString(36).substr(2, 9) + '-' + Date.now();
  }

  broadcastChange(table, eventType, rows) {
    for (const channel of this.channels) {
      for (const cb of channel.callbacks) {
        if (cb.type === 'postgres_changes') {
          const tableFilter = cb.filter.table;
          const eventFilter = cb.filter.event;
          
          if (tableFilter === table && (eventFilter === '*' || eventFilter === eventType)) {
            const rowsToNotify = rows.filter(row => {
              if (cb.filter.filter) {
                const parts = cb.filter.filter.split('=eq.');
                if (parts.length === 2) {
                  const col = parts[0];
                  const val = parts[1];
                  return row[col] === val;
                }
              }
              return true;
            });

            for (const r of rowsToNotify) {
              cb.callback({
                eventType,
                new: eventType === 'DELETE' ? {} : r,
                old: eventType === 'INSERT' ? {} : { id: r.id }
              });
            }
          }
        }
      }
    }
  }

  broadcastPresenceSync(channelName) {
    const matchingChannels = Array.from(this.channels).filter(c => c.name === channelName);
    matchingChannels.forEach(c => {
      for (const cb of c.callbacks) {
        if (cb.type === 'presence' && cb.filter.event === 'sync') {
          cb.callback();
        }
      }
    });
  }

  broadcastMessage(channelName, payload) {
    for (const channel of this.channels) {
      if (channel.name === channelName) {
        for (const cb of channel.callbacks) {
          if (cb.type === 'broadcast') {
            cb.callback(payload);
          }
        }
      }
    }
  }

  seedDatabase() {
    const defaultTables = {
      profiles: [
        { id: '11111111-1111-1111-1111-111111111111', full_name: 'Rian Mabar', username: 'rian_mabar', avatar_url: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=Rian', friend_code: 'MABAR1', role: 'student' },
        { id: '22222222-2222-2222-2222-222222222222', full_name: 'Siti Coder', username: 'siti_coder', avatar_url: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=Siti', friend_code: 'CODER2', role: 'teacher' },
        { id: '33333333-3333-3333-3333-333333333333', full_name: 'Dewi Melody', username: 'dewi_melody', avatar_url: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=Dewi', friend_code: 'MELOD3', role: 'student' },
        { id: '44444444-4444-4444-4444-444444444444', full_name: 'Budi Design', username: 'budi_design', avatar_url: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=Budi', friend_code: 'DESIN4', role: 'teacher' },
        { id: '55555555-5555-5555-5555-555555555555', full_name: 'Chef Andi', username: 'chef_andi', avatar_url: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=Andi', friend_code: 'CHEF55', role: 'student' },
        { id: '66666666-6666-6666-6666-666666666666', full_name: 'Prof Eko', username: 'prof_eko', avatar_url: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=Eko', friend_code: 'PROFE6', role: 'teacher' }
      ],
      courses: [
        {
          id: 1,
          title: 'Kuasai Pemrograman Web Modern (HTML, CSS, JS)',
          instructor: 'Siti Coder',
          instructor_id: '22222222-2222-2222-2222-222222222222',
          price: 149000,
          image_url: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=600',
          category: 'Technology',
          description: 'Pelajari cara membangun situs web modern yang responsif dan interaktif dari nol. Sangat ramah pemula!',
          level: 'beginner',
          language: 'id',
          created_at: new Date(Date.now() - 5 * 86400000).toISOString()
        },
        {
          id: 2,
          title: 'Mastering UI/UX Design with Figma',
          instructor: 'Budi Design',
          instructor_id: '44444444-4444-4444-4444-444444444444',
          price: 199000,
          image_url: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&q=80&w=600',
          category: 'Design',
          description: 'Learn professional design workflows, from wireframing to high-fidelity interactive prototypes in Figma.',
          level: 'intermediate',
          language: 'en',
          created_at: new Date(Date.now() - 3 * 86400000).toISOString()
        },
        {
          id: 3,
          title: 'Pengantar Machine Learning & Python untuk Pemula',
          instructor: 'Prof Eko',
          instructor_id: '66666666-6666-6666-6666-666666666666',
          price: 299000,
          image_url: 'https://images.unsplash.com/photo-1677442136019-21780efad99a?auto=format&fit=crop&q=80&w=600',
          category: 'Technology',
          description: 'Mulai perjalanan karirmu di bidang data science dan AI. Pelajari Python, Pandas, dan Algoritma ML.',
          level: 'beginner',
          language: 'id',
          created_at: new Date(Date.now() - 1 * 86400000).toISOString()
        }
      ],
      course_categories: [
        { id: 1, name: 'Technology' },
        { id: 2, name: 'Design' },
        { id: 3, name: 'Business' },
        { id: 4, name: 'Marketing' }
      ],
      course_sections: [
        { id: 1, course_id: 1, title: 'Dasar-Dasar HTML & CSS', sort_order: 1 },
        { id: 2, course_id: 1, title: 'Logika JavaScript & Pemrosesan Data', sort_order: 2 },
        { id: 3, course_id: 2, title: 'Introduction to UI Design', sort_order: 1 },
        { id: 4, course_id: 3, title: 'Pengenalan Python', sort_order: 1 }
      ],
      course_syllabus: [
        {
          id: 101,
          section_id: 1,
          course_id: 1,
          title: 'Pengenalan Struktur HTML5',
          content: 'HTML (HyperText Markup Language) adalah bahasa standar yang digunakan untuk membuat halaman web. Pada materi ini kita akan mempelajari tag dasar seperti <div>, <header>, <footer>, dan paragraf.',
          video_url: 'https://www.youtube.com/watch?v=kUMe1FH4INY',
          sort_order: 1,
          is_published: true
        },
        {
          id: 102,
          section_id: 1,
          course_id: 1,
          title: 'Mempercantik Web dengan CSS Grid & Flexbox',
          content: 'CSS Grid dan Flexbox adalah teknik layouting modern yang membantu menyusun tata letak halaman web. Gunakan Flexbox untuk satu dimensi (seperti navigasi) dan CSS Grid untuk dua dimensi (seperti dashboard).',
          video_url: 'https://www.youtube.com/watch?v=rg7Fvx3plz8',
          sort_order: 2,
          is_published: true
        },
        {
          id: 103,
          section_id: 2,
          course_id: 1,
          title: 'Tantangan Koding: Hapus Duplikat & Urutkan Data',
          content: 'Selamat datang di tantangan koding Javascript! Anda diminta untuk melengkapi fungsi `optimizeQuery` agar menerima array angka acak, menghapus angka yang duplikat, lalu mengembalikannya dalam urutan menurun (descending). Gunakan compiler di sebelah kanan untuk menulis solusimu.',
          video_url: '',
          sort_order: 1,
          is_published: true
        },
        {
          id: 104,
          section_id: 3,
          course_id: 2,
          title: 'Figma Workspace Tour',
          content: 'Let\'s explore Figma\'s user interface, toolbars, and shortcut layout to optimize your design speed.',
          video_url: 'https://www.youtube.com/watch?v=jwMqGoC4S6M',
          sort_order: 1,
          is_published: true
        },
        {
          id: 105,
          section_id: 4,
          course_id: 3,
          title: 'Instalasi Anaconda & Jupyter Notebook',
          content: 'Pelajari cara melakukan setup environment Python di komputermu sendiri menggunakan Anaconda distribution.',
          video_url: 'https://www.youtube.com/watch?v=5mDYijMfSzs',
          sort_order: 1,
          is_published: true
        }
      ],
      communities: [
        { id: 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', name: 'Gamer Zone 🎮', icon: 'sports_esports', accent_color: '#ef4444', invite_code: 'GAMER', created_by: '11111111-1111-1111-1111-111111111111', created_at: '2026-06-01T00:00:00.000Z' },
        { id: 'b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2', name: 'Dev & Code Cafe 💻', icon: 'code', accent_color: '#3b82f6', invite_code: 'CODER', created_by: '22222222-2222-2222-2222-222222222222', created_at: '2026-06-01T00:00:00.000Z' },
        { id: 'c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c3c3', name: 'Music & Chill 🎵', icon: 'music_note', accent_color: '#a855f7', invite_code: 'MUSIC', created_by: '33333333-3333-3333-3333-333333333333', created_at: '2026-06-01T00:00:00.000Z' },
        { id: 'd4d4d4d4-d4d4-d4d4-d4d4-d4d4d4d4d4d4', name: 'Design Studio 🎨', icon: 'palette', accent_color: '#ec4899', invite_code: 'DESIGN', created_by: '44444444-4444-4444-4444-444444444444', created_at: '2026-06-01T00:00:00.000Z' },
        { id: 'e5e5e5e5-e5e5-e5e5-e5e5-e5e5e5e5e5e5', name: 'Nusantara Cooking 🍳', icon: 'restaurant', accent_color: '#f59e0b', invite_code: 'COOK', created_by: '55555555-5555-5555-5555-555555555555', created_at: '2026-06-01T00:00:00.000Z' }
      ],
      channels: [
        { id: 'a1a1a1a1-1111-1111-1111-a1a1a1a1a1a1', community_id: 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', name: 'general-lounge', type: 'text' },
        { id: 'a1a1a1a1-2222-2222-2222-a1a1a1a1a1a1', community_id: 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', name: 'mabar-squad', type: 'text' },
        { id: 'b2b2b2b2-1111-1111-1111-b2b2b2b2b2b2', community_id: 'b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2', name: 'general-chat', type: 'text' },
        { id: 'b2b2b2b2-2222-2222-2222-b2b2b2b2b2b2', community_id: 'b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2', name: 'bantuan-coding', type: 'text' },
        { id: 'b2b2b2b2-3333-3333-3333-b2b2b2b2b2b2', community_id: 'b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2', name: 'showcase-proyek', type: 'text' },
        { id: 'b2b2b2b2-4444-4444-4444-b2b2b2b2b2b2', community_id: 'b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2', name: 'Pair Programming ☕', type: 'voice' },
        { id: 'c3c3c3c3-1111-1111-1111-c3c3c3c3c3c3', community_id: 'c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c3c3', name: 'music-lounge', type: 'text' },
        { id: 'd4d4d4d4-1111-1111-1111-d4d4d4d4d4d4', community_id: 'd4d4d4d4-d4d4-d4d4-d4d4-d4d4d4d4d4d4', name: 'design-lounge', type: 'text' },
        { id: 'e5e5e5e5-1111-1111-1111-e5e5e5e5e5e5', community_id: 'e5e5e5e5-e5e5-e5e5-e5e5-e5e5e5e5e5e5', name: 'dapur-utama', type: 'text' }
      ],
      community_messages: [
        { id: 'm1', channel_id: 'b2b2b2b2-2222-2222-2222-b2b2b2b2b2b2', user_id: '44444444-4444-4444-4444-444444444444', text: 'Ada yang tahu cara centering div di CSS paling modern ga ya? Masih sering ribet nih.', created_at: new Date(Date.now() - 3600000).toISOString() },
        { id: 'm2', channel_id: 'b2b2b2b2-2222-2222-2222-b2b2b2b2b2b2', user_id: '22222222-2222-2222-2222-222222222222', text: 'Pake Grid atau Flexbox super gampang Bud! Cukup tulis `display: grid; place-items: center;` di parent-nya. Udah pasti center vertical & horizontal!', created_at: new Date(Date.now() - 1800000).toISOString() },
        { id: 'm3', channel_id: 'b2b2b2b2-2222-2222-2222-b2b2b2b2b2b2', user_id: '66666666-6666-6666-6666-666666666666', text: 'Betul sekali saran Siti. Menggunakan CSS Grid (`place-items`) adalah metode terbersih untuk layouting modern saat ini.', created_at: new Date(Date.now() - 900000).toISOString() }
      ],
      posts: [
        {
          id: 'p1',
          title: 'Panduan Menulis Clean Code & Best Practices di React',
          content: 'Menulis kode yang berjalan lancar adalah satu hal, tetapi menulis kode yang mudah dibaca oleh developer lain adalah seni tersendiri. Di React, ada beberapa praktik terbaik yang bisa kamu terapkan:\n\n1. Pemisahan Komponen: Komponen idealnya hanya bertanggung jawab atas satu tugas (Single Responsibility Principle).\n2. Gunakan Custom Hooks: Ekstrak logika bisnis yang rumit dari visual rendering komponen.\n3. Hindari Nesting Berlebihan: Struktur folder modular.',
          category: 'Programming',
          image_url: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=1200',
          author_id: '22222222-2222-2222-2222-222222222222',
          views: 1840,
          created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
          updated_at: new Date(Date.now() - 3 * 86400000).toISOString()
        },
        {
          id: 'p2',
          title: 'Tren UI/UX Design Terpopuler: Mengapa Neo-Brutalisme Naik Daun?',
          content: 'Setelah bertahun-tahun didominasi oleh gaya minimalis monokrom yang bersih (flat design), dunia UI/UX kini sedang mengalami gelombang pemberontakan estetika baru: Neo-Brutalisme.\n\nGaya neobrutalisme ditandai dengan:\n- Stroke perbatasan hitam tebal (biasanya 2px hingga 4px)\n- Warna neon yang sangat kontras\n- Bayangan offset tegas persegi (tanpa efek blur)\n- Tipografi tebal yang asimetris',
          category: 'UI/UX Design',
          image_url: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&q=80&w=1200',
          author_id: '44444444-4444-4444-4444-444444444444',
          views: 2450,
          created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
          updated_at: new Date(Date.now() - 2 * 86400000).toISOString()
        }
      ],
      achievements: [
        { id: 'pioneer', title: 'Pioneer', description: 'Bergabung dengan Harin Learning.', icon_name: 'history_edu', color_class: 'bg-primary-container' },
        { id: 'first_step', title: 'First Step', description: 'Mengambil kursus pertama.', icon_name: 'rocket_launch', color_class: 'bg-secondary-container' },
        { id: 'scholar', title: 'Scholar', description: 'Menyelesaikan 1 kursus.', icon_name: 'workspace_premium', color_class: 'bg-tertiary-container' },
        { id: 'author', title: 'Author', description: 'Menulis postingan blog pertama.', icon_name: 'edit_note', color_class: 'bg-primary-fixed' },
        { id: 'top_student', title: 'Top Student', description: 'Memiliki 5+ kursus aktif.', icon_name: 'star', color_class: 'bg-secondary-fixed' }
      ],
      notifications: [
        { id: 'n1', user_id: null, title: 'Tren UI/UX Baru!', content: 'Tren Neo-Brutalisme sedang ramai dibahas oleh Budi Design. Cek ulasannya!', type: 'blog', link_to: '/blog', is_read: false, created_at: new Date(Date.now() - 1200000).toISOString() },
        { id: 'n2', user_id: null, title: 'Tips Menata Makanan', content: 'Chef Andi baru saja membagikan resep & teknik plating restoran bintang 5!', type: 'blog', link_to: '/blog', is_read: false, created_at: new Date(Date.now() - 14400000).toISOString() }
      ],
      friends: [],
      community_members: [],
      enrollments: [],
      wishlist: [],
      cart: [],
      user_progress: [],
      certificates: [],
      submissions: [],
      payment_methods: [],
      auth_users: []
    };

    for (const [name, defaultData] of Object.entries(defaultTables)) {
      if (!localStorage.getItem(`mock_db_${name}`)) {
        localStorage.setItem(`mock_db_${name}`, JSON.stringify(defaultData));
      }
    }

    if (!localStorage.getItem('mock_supabase_session') && !localStorage.getItem('harin_guest_session')) {
      const defaultUser = {
        id: '11111111-1111-1111-1111-111111111111',
        email: 'rian_mabar@ailearning.com',
        role: 'authenticated',
        raw_user_meta_data: { full_name: 'Rian Mabar' },
        created_at: new Date().toISOString()
      };
      
      let authUsers = JSON.parse(localStorage.getItem('mock_db_auth_users') || '[]');
      if (!authUsers.some(u => u.id === defaultUser.id)) {
        authUsers.push(defaultUser);
        localStorage.setItem('mock_db_auth_users', JSON.stringify(authUsers));
      }

      let memberships = JSON.parse(localStorage.getItem('mock_db_community_members') || '[]');
      const communities = JSON.parse(localStorage.getItem('mock_db_communities') || '[]');
      communities.forEach(c => {
        if (!memberships.some(m => m.community_id === c.id && m.user_id === defaultUser.id)) {
          memberships.push({
            id: memberships.length + 1,
            community_id: c.id,
            user_id: defaultUser.id,
            role: c.created_by === defaultUser.id ? 'owner' : 'member',
            joined_at: new Date().toISOString()
          });
        }
      });
      localStorage.setItem('mock_db_community_members', JSON.stringify(memberships));

      let friends = JSON.parse(localStorage.getItem('mock_db_friends') || '[]');
      const otherProfiles = JSON.parse(localStorage.getItem('mock_db_profiles') || '[]').filter(p => p.id !== defaultUser.id);
      otherProfiles.forEach(p => {
        if (!friends.some(f => f.user_id === defaultUser.id && f.friend_id === p.id)) {
          friends.push({
            id: friends.length + 1,
            user_id: defaultUser.id,
            friend_id: p.id,
            created_at: new Date().toISOString()
          });
          friends.push({
            id: friends.length + 1,
            user_id: p.id,
            friend_id: defaultUser.id,
            created_at: new Date().toISOString()
          });
        }
      });
      localStorage.setItem('mock_db_friends', JSON.stringify(friends));

      const session = {
        access_token: 'mock-access-token-rian',
        refresh_token: 'mock-refresh-token-rian',
        expires_in: 3600,
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        user: defaultUser
      };
      localStorage.setItem('mock_supabase_session', JSON.stringify(session));
    }
  }
}

const useMock = !supabaseUrl || supabaseUrl.includes('fqmuthkvmtckvnbkckcu') || localStorage.getItem('use_mock_supabase') === 'true';

export const supabase = useMock 
  ? new MockSupabaseClient() 
  : createClient(supabaseUrl, supabaseAnonKey);

