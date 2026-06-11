type MockUser = {
  id: string;
  email: string;
};

type MockSession = {
  access_token: string;
  user: MockUser;
};

type AuthEvent = "SIGNED_IN" | "SIGNED_OUT" | "USER_UPDATED";
type AuthCallback = (event: AuthEvent, session: MockSession | null) => void;

type TableName = "projects" | "data_sources" | "chat_messages" | "saved_kpis";
type Row = Record<string, any>;

const STORAGE_KEY = "wisedata.mock-db.v1";
const SESSION_KEY = "wisedata.mock-session.v1";
const listeners = new Set<AuthCallback>();

const fallbackUser: MockUser = {
  id: "mock-user",
  email: "dev@wisedata.local",
};

type MockDb = Record<TableName, Row[]>;

const emptyDb = (): MockDb => ({
  projects: [],
  data_sources: [],
  chat_messages: [],
  saved_kpis: [],
});

function now() {
  return new Date().toISOString();
}

function uuid() {
  return globalThis.crypto?.randomUUID?.() ?? `mock-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function browserStorage() {
  return typeof window === "undefined" ? null : window.localStorage;
}

let memoryDb = emptyDb();
let memorySession: MockSession | null = null;

function readDb(): MockDb {
  const storage = browserStorage();
  if (!storage) return memoryDb;
  const raw = storage.getItem(STORAGE_KEY);
  if (!raw) {
    const db = emptyDb();
    storage.setItem(STORAGE_KEY, JSON.stringify(db));
    return db;
  }
  return { ...emptyDb(), ...JSON.parse(raw) };
}

function writeDb(db: MockDb) {
  const storage = browserStorage();
  if (!storage) {
    memoryDb = db;
    return;
  }
  storage.setItem(STORAGE_KEY, JSON.stringify(db));
}

function readSession(): MockSession | null {
  const storage = browserStorage();
  if (!storage) return memorySession;
  const raw = storage.getItem(SESSION_KEY);
  if (!raw) return null;
  return JSON.parse(raw);
}

function writeSession(session: MockSession | null) {
  const storage = browserStorage();
  memorySession = session;
  if (!storage) return;
  if (session) storage.setItem(SESSION_KEY, JSON.stringify(session));
  else storage.removeItem(SESSION_KEY);
}

function notify(event: AuthEvent) {
  const session = readSession();
  listeners.forEach((listener) => listener(event, session));
}

function normalizeInsert(table: TableName, row: Row): Row {
  const base = { id: uuid(), created_at: now(), ...row };
  if (table === "projects") return { updated_at: base.created_at, ...base };
  return base;
}

class QueryBuilder {
  private action: "select" | "insert" | "update" | "delete" = "select";
  private filters: Array<{ column: string; value: unknown }> = [];
  private orderBy?: { column: string; ascending: boolean };
  private maxRows?: number;
  private singleMode: "single" | "maybeSingle" | null = null;
  private payload: Row | Row[] | null = null;

  constructor(private table: TableName) {}

  select(_columns = "*") {
    this.action = this.action === "insert" || this.action === "update" ? this.action : "select";
    return this;
  }

  insert(payload: Row | Row[]) {
    this.action = "insert";
    this.payload = payload;
    return this;
  }

  update(payload: Row) {
    this.action = "update";
    this.payload = payload;
    return this;
  }

  delete() {
    this.action = "delete";
    return this;
  }

  eq(column: string, value: unknown) {
    this.filters.push({ column, value });
    return this;
  }

  order(column: string, options: { ascending?: boolean } = {}) {
    this.orderBy = { column, ascending: options.ascending ?? true };
    return this;
  }

  limit(count: number) {
    this.maxRows = count;
    return this;
  }

  single() {
    this.singleMode = "single";
    return this;
  }

  maybeSingle() {
    this.singleMode = "maybeSingle";
    return this;
  }

  then<TResult1 = any, TResult2 = never>(
    onfulfilled?: ((value: any) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null,
  ) {
    return this.execute().then(onfulfilled, onrejected);
  }

  private matches(row: Row) {
    return this.filters.every((filter) => row[filter.column] === filter.value);
  }

  private shape(rows: Row[]) {
    let result = [...rows];
    if (this.orderBy) {
      const { column, ascending } = this.orderBy;
      result.sort((a, b) => {
        const left = a[column] ?? "";
        const right = b[column] ?? "";
        return ascending ? String(left).localeCompare(String(right)) : String(right).localeCompare(String(left));
      });
    }
    if (this.maxRows != null) result = result.slice(0, this.maxRows);
    if (this.singleMode === "single") {
      return result[0]
        ? { data: result[0], error: null }
        : { data: null, error: new Error(`No row found in ${this.table}`) };
    }
    if (this.singleMode === "maybeSingle") {
      return { data: result[0] ?? null, error: null };
    }
    return { data: result, error: null };
  }

  private async execute() {
    const db = readDb();
    const rows = db[this.table];

    if (this.action === "insert") {
      const payload = Array.isArray(this.payload) ? this.payload : [this.payload ?? {}];
      const inserted = payload.map((row) => normalizeInsert(this.table, row));
      db[this.table] = [...rows, ...inserted];
      writeDb(db);
      return this.shape(inserted);
    }

    if (this.action === "update") {
      const updated: Row[] = [];
      db[this.table] = rows.map((row) => {
        if (!this.matches(row)) return row;
        const next = { ...row, ...(this.payload ?? {}) };
        if ("updated_at" in row && !("updated_at" in (this.payload ?? {}))) next.updated_at = now();
        updated.push(next);
        return next;
      });
      writeDb(db);
      return this.shape(updated);
    }

    if (this.action === "delete") {
      const deleted = rows.filter((row) => this.matches(row));
      db[this.table] = rows.filter((row) => !this.matches(row));
      writeDb(db);
      return { data: deleted, error: null };
    }

    if (this.table === "projects") {
      const dataSources = db.data_sources;
      const withRelations = rows.map((project) => ({
        ...project,
        data_sources: dataSources.filter((source) => source.project_id === project.id),
      }));
      return this.shape(withRelations.filter((row) => this.matches(row)));
    }

    return this.shape(rows.filter((row) => this.matches(row)));
  }
}

export const mockBackend = {
  auth: {
    async getSession() {
      return { data: { session: readSession() }, error: null };
    },
    async getUser() {
      return { data: { user: readSession()?.user ?? null }, error: null };
    },
    async signInWithPassword({ email }: { email: string; password: string }) {
      const session = { access_token: "mock-token", user: { id: "mock-user", email } };
      writeSession(session);
      notify("SIGNED_IN");
      return { data: { user: session.user, session }, error: null };
    },
    async signUp({ email }: { email: string; password: string; options?: unknown }) {
      const session = { access_token: "mock-token", user: { id: "mock-user", email } };
      writeSession(session);
      notify("SIGNED_IN");
      return { data: { user: session.user, session }, error: null };
    },
    async signInWithOAuth() {
      const session = { access_token: "mock-token", user: fallbackUser };
      writeSession(session);
      notify("SIGNED_IN");
      return { data: { user: session.user, session }, error: null };
    },
    async setSession(session: MockSession) {
      writeSession(session);
      notify("SIGNED_IN");
      return { data: { session, user: session.user }, error: null };
    },
    async signOut() {
      writeSession(null);
      notify("SIGNED_OUT");
      return { error: null };
    },
    onAuthStateChange(callback: AuthCallback) {
      listeners.add(callback);
      return {
        data: {
          subscription: {
            unsubscribe: () => listeners.delete(callback),
          },
        },
      };
    },
  },
  from(table: TableName) {
    return new QueryBuilder(table);
  },
  storage: {
    from(bucket: string) {
      return {
        async upload(path: string, file: File) {
          return {
            data: { bucket, path, id: uuid(), fullPath: `${bucket}/${path}` },
            error: null,
          };
        },
      };
    },
  },
};
