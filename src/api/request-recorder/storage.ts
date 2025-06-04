export default class IndexedDb {
    private dbName: string;
    private version: number;
    private storeName: string;

    constructor(dbName: string, version: number, storeName: string) {
        this.dbName = dbName;
        this.version = version;
        this.storeName = storeName;
    }

    private async open(): Promise<IDBDatabase> {
        const request = window.indexedDB.open(this.dbName, this.version);
        return new Promise((resolve, reject) => {
            request.onsuccess = (e: Event) => resolve((e.target as IDBOpenDBRequest).result);
            request.onerror = (e: Event) => reject((e.target as IDBOpenDBRequest).error);
            request.onupgradeneeded = (e: Event) => {
                const db = (e.target as IDBOpenDBRequest).result;
                [this.storeName].forEach((store) => {
                    if (!db.objectStoreNames.contains(store)) {
                        db.createObjectStore(store);
                    }
                });
            };
            request.onblocked = (e: Event) => reject(e);
        });
    }

    async get<T>(key: string): Promise<T | null> {
        const db = await this.open();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([this.storeName], "readonly");
            transaction.onabort = (e: Event) => {
                reject((e.target as any).error);
            };
            const request = transaction.objectStore(this.storeName).get(key);
            request.onsuccess = (e: any) => resolve(e.target.result ?? null);
            request.onerror = () => reject(request.error);
        });
    }

    async getAll<T>(): Promise<[string, T][]> {
        const db = await this.open();
        return new Promise((resolve, reject) => {
          const transaction = db.transaction([this.storeName], "readonly");
          const store = transaction.objectStore(this.storeName);
          const request = store.openCursor();
          const entries: [string, T][] = [];
      
          request.onsuccess = (e: any) => {
            const cursor = e.target.result;
            if (cursor) {
              entries.push([cursor.key, cursor.value]);
              cursor.continue();
            } else {
              resolve(entries);
            }
          };
      
          request.onerror = () => reject(request.error);
          transaction.onabort = (e: any) => reject(e.target.error);
        });
      }
      

    async set<T = any>(records: [string, T][]): Promise<void>;
    async set<T = any>(key: string, value: T): Promise<void>;
    async set<T = any>(keyOrRecords: string | [string, T][], value?: T): Promise<void> {
        const db = await this.open();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([this.storeName], "readwrite");
            const store = transaction.objectStore(this.storeName);
            transaction.onabort = (e: any) => {
                reject(e.target.error);
            };
            
            transaction.oncomplete = () => resolve();
            transaction.onerror = () => reject(transaction.error);
            transaction.onabort = (e: any) => reject(e.target.error);

            const records: [string, T][] = Array.isArray(keyOrRecords) ? keyOrRecords : [[keyOrRecords, value as T]];

            for (const record of records) {
                const [key, value] = record;
                store.put(value, key);
            }
        });
    }

    async remove(key: string): Promise<void>;
    async remove(keys: string[]): Promise<void>;
    async remove(keyOrKeys: string | string[]): Promise<void> {
        const db = await this.open();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([this.storeName], "readwrite");
            const store = transaction.objectStore(this.storeName);
            transaction.onabort = (e: any) => {
                reject(e.target.error);
            };
            transaction.oncomplete = () => resolve();
            transaction.onerror = () => reject(transaction.error);
            transaction.onabort = (e: any) => reject(e.target.error);

            const keys = Array.isArray(keyOrKeys) ? keyOrKeys : [keyOrKeys];
            for (const k of keys) {
                store.delete(k);
            }
        });
    }

    async clear(): Promise<void> {
        const db = await this.open();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([this.storeName], "readwrite");
            const store = transaction.objectStore(this.storeName);
            const request = store.clear();

            transaction.oncomplete = () => resolve();
            transaction.onerror = () => reject(transaction.error);
            transaction.onabort = (e: any) => reject(e.target.error);

            request.onerror = (e: any) => reject(e);
        });
    }
}
