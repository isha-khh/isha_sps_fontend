/**
 * 系統資訊類型定義
 */

import type { Fido2Info } from './fido2';

/**
 * 系統資訊
 */
export interface SystemInfo {
  /** 系統版本 */
  version: string;
  /** 建置時間 */
  buildTime: string;
  /** 運行環境 */
  environment: string;
  /** 伺服器時間 */
  serverTime: string;
  /** 運行時間 */
  uptime: string;
  /** 記憶體使用量 */
  memoryUsage: MemoryUsage;
  /** 磁碟使用量 */
  diskUsage: DiskUsage;
  /** 資料庫資訊 */
  database: DatabaseInfo;
  /** 快取資訊 */
  cache: CacheInfo;
  /** .NET 運行時資訊 */
  runtime: RuntimeInfo;
  /** FIDO2 WebAuthn 設定 */
  fido2: Fido2Info;
}

/**
 * 記憶體使用量
 */
export interface MemoryUsage {
  /** 總記憶體 (bytes) */
  total: number;
  /** 已使用記憶體 (bytes) */
  used: number;
  /** 可用記憶體 (bytes) */
  free: number;
}

/**
 * 磁碟使用量
 */
export interface DiskUsage {
  /** 總磁碟空間 (bytes) */
  total: number;
  /** 已使用磁碟空間 (bytes) */
  used: number;
  /** 可用磁碟空間 (bytes) */
  free: number;
}

/**
 * 資料庫資訊
 */
export interface DatabaseInfo {
  /** 資料庫類型 */
  type: string;
  /** 資料庫版本 */
  version: string;
  /** 資料庫大小 (bytes) */
  size: number;
  /** 連線狀態 */
  isConnected: boolean;
}

/**
 * 快取資訊
 */
export interface CacheInfo {
  /** 快取類型 */
  type: string;
  /** 命中率 (百分比) */
  hitRate: number;
  /** 連線狀態 */
  isConnected: boolean;
  /** 已使用記憶體 (bytes) */
  usedMemory: number;
}

/**
 * .NET 運行時資訊
 */
export interface RuntimeInfo {
  /** .NET 版本 */
  dotNetVersion: string;
  /** 作業系統 */
  operatingSystem: string;
  /** 處理器數量 */
  processorCount: number;
  /** 是否為 64 位元 */
  is64Bit: boolean;
}

/**
 * 健康狀態
 */
export interface HealthStatus {
  /** 狀態 */
  status: 'Healthy' | 'Degraded' | 'Unhealthy';
  /** 時間戳 */
  timestamp: string;
  /** 組件狀態 */
  components: {
    database: 'Healthy' | 'Unhealthy';
    redis: 'Healthy' | 'Unhealthy';
  };
}
