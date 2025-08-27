export interface CalculationRecord {
  id: string;
  name: string;
  timestamp: number;
  year: number;
  componentKeys: string[];
  periods: any[];
  derivedItems: any[];
  targetCalculatorItems: any[]; // Add Target Calculator items
  marketData?: any[]; // Market data for percentile analysis
  totals: {
    totalsByComponent: Record<string, number>;
    derivedTotals: Record<string, number>;
    tcc: number;
  };
}

class IndexedDBService {
  private dbName = 'ProrationCalculatorDB';
  private version = 1;
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object stores
        if (!db.objectStoreNames.contains('calculations')) {
          const store = db.createObjectStore('calculations', { keyPath: 'id' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('name', 'name', { unique: false });
        }

        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }
      };
    });
  }

  async saveCalculation(record: Omit<CalculationRecord, 'id' | 'timestamp'>): Promise<string> {
    console.log('IndexedDB: Starting saveCalculation...');
    await this.ensureDB();
    console.log('IndexedDB: Database ensured, creating record...');
    
    const id = crypto.randomUUID();
    const timestamp = Date.now();
    const fullRecord: CalculationRecord = {
      ...record,
      id,
      timestamp
    };

    console.log('IndexedDB: Record created, starting transaction...');

    return new Promise((resolve, reject) => {
      try {
        const transaction = this.db!.transaction(['calculations'], 'readwrite');
        const store = transaction.objectStore('calculations');
        const request = store.add(fullRecord);

        request.onerror = () => {
          console.error('IndexedDB: Save request failed:', request.error);
          reject(request.error);
        };
        
        request.onsuccess = () => {
          console.log('IndexedDB: Save request succeeded, resolving...');
          resolve(id);
        };

        transaction.oncomplete = () => {
          console.log('IndexedDB: Transaction completed successfully');
        };

        transaction.onerror = () => {
          console.error('IndexedDB: Transaction failed:', transaction.error);
        };

      } catch (error) {
        console.error('IndexedDB: Error in saveCalculation:', error);
        reject(error);
      }
    });
  }

  async getCalculations(): Promise<CalculationRecord[]> {
    await this.ensureDB();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['calculations'], 'readonly');
      const store = transaction.objectStore('calculations');
      const index = store.index('timestamp');
      const request = index.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const records = request.result as CalculationRecord[];
        resolve(records.sort((a, b) => b.timestamp - a.timestamp));
      };
    });
  }

  async getCalculation(id: string): Promise<CalculationRecord | null> {
    await this.ensureDB();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['calculations'], 'readonly');
      const store = transaction.objectStore('calculations');
      const request = store.get(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || null);
    });
  }

  async deleteCalculation(id: string): Promise<void> {
    await this.ensureDB();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['calculations'], 'readwrite');
      const store = transaction.objectStore('calculations');
      const request = store.delete(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async saveSetting<T>(key: string, value: T): Promise<void> {
    await this.ensureDB();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['settings'], 'readwrite');
      const store = transaction.objectStore('settings');
      const request = store.put({ key, value });

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async getSetting<T>(key: string, defaultValue: T): Promise<T> {
    await this.ensureDB();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['settings'], 'readonly');
      const store = transaction.objectStore('settings');
      const request = store.get(key);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? result.value : defaultValue);
      };
    });
  }

  async clearAllSettings(): Promise<void> {
    await this.ensureDB();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['settings'], 'readwrite');
      const store = transaction.objectStore('settings');
      const request = store.clear();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async clearAllCalculations(): Promise<void> {
    await this.ensureDB();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['calculations'], 'readwrite');
      const store = transaction.objectStore('calculations');
      const request = store.clear();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  private async ensureDB(): Promise<void> {
    if (!this.db) {
      await this.init();
    }
  }
}

export const indexedDBService = new IndexedDBService();
