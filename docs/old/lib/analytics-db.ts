/**
 * IndexedDB 瀏覽記錄工具
 * 用於追蹤使用者已瀏覽過的內容，避免重複計算統計
 */

const DB_NAME = "sps-analytics";
const DB_VERSION = 3;

// 資料表名稱
export const STORE_NEWS = "news-views";
export const STORE_CASES = "cases-views";
export const STORE_BANNERS = "banner-views";
export const STORE_SITE_VISITOR = "site-visitor";

function openDb(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        if (typeof window === "undefined" || !window.indexedDB) {
            reject(new Error("IndexedDB not available"));
            return;
        }
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
        request.onupgradeneeded = () => {
            const db = request.result;
            // 建立各資料表
            if (!db.objectStoreNames.contains(STORE_NEWS)) {
                db.createObjectStore(STORE_NEWS, { keyPath: "id" });
            }
            if (!db.objectStoreNames.contains(STORE_CASES)) {
                db.createObjectStore(STORE_CASES, { keyPath: "id" });
            }
            if (!db.objectStoreNames.contains(STORE_BANNERS)) {
                db.createObjectStore(STORE_BANNERS, { keyPath: "id" });
            }
            if (!db.objectStoreNames.contains(STORE_SITE_VISITOR)) {
                db.createObjectStore(STORE_SITE_VISITOR, { keyPath: "key" });
            }
        };
    });
}

/**
 * 檢查是否已瀏覽過
 */
export async function hasViewed(storeName: string, id: number): Promise<boolean> {
    try {
        const db = await openDb();
        return new Promise((resolve) => {
            const tx = db.transaction(storeName, "readonly");
            const store = tx.objectStore(storeName);
            const request = store.get(id);
            request.onsuccess = () => resolve(!!request.result);
            request.onerror = () => resolve(false);
        });
    } catch {
        return false;
    }
}

/**
 * 標記為已瀏覽
 */
export async function markAsViewed(storeName: string, id: number): Promise<void> {
    try {
        const db = await openDb();
        const tx = db.transaction(storeName, "readwrite");
        const store = tx.objectStore(storeName);
        store.put({ id, viewedAt: Date.now() });
    } catch {
        // 靜默失敗
    }
}

/**
 * 檢查是否為新訪客（首次造訪網站）
 */
export async function isNewVisitor(): Promise<boolean> {
    try {
        const db = await openDb();
        return new Promise((resolve) => {
            const tx = db.transaction(STORE_SITE_VISITOR, "readonly");
            const store = tx.objectStore(STORE_SITE_VISITOR);
            const request = store.get("visitor");
            request.onsuccess = () => resolve(!request.result);
            request.onerror = () => resolve(true);
        });
    } catch {
        return true;
    }
}

/**
 * 標記為已訪問過網站
 */
export async function markAsVisitor(): Promise<void> {
    try {
        const db = await openDb();
        const tx = db.transaction(STORE_SITE_VISITOR, "readwrite");
        const store = tx.objectStore(STORE_SITE_VISITOR);
        store.put({ key: "visitor", firstVisitAt: Date.now() });
    } catch {
        // 靜默失敗
    }
}
