import { useState, useEffect } from 'react';
import { PageTitle } from '@/components/PageTitle';
import { systemInfoApi } from '@/lib/api/system-info';
import type { SystemInfo } from '@/types/system-info';

export const SystemInfoPage = () => {
  const [info, setInfo] = useState<SystemInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSystemInfo();
    const interval = setInterval(fetchSystemInfo, 30000); // 每 30 秒更新一次
    return () => clearInterval(interval);
  }, []);

  const fetchSystemInfo = async () => {
    try {
      setError(null);
      const data = await systemInfoApi.getSystemInfo();
      setInfo(data);
    } catch (err) {
      console.error('Failed to fetch system info:', err);
      setError('無法取得系統資訊');
    } finally {
      setIsLoading(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const getUsagePercentage = (used: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((used / total) * 100);
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'error';
    if (percentage >= 70) return 'warning';
    return 'success';
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <span className="loading loading-spinner loading-lg" />
      </div>
    );
  }

  if (error || !info) {
    return (
      <div className="space-y-6">
        <PageTitle
          title="系統資訊"
          items={[
            { label: '系統管理', path: '/system' },
            { label: '系統資訊', active: true },
          ]}
        />
        <div className="alert alert-error">
          <span className="iconify lucide--alert-circle size-5" />
          <span>{error || '無法載入系統資訊'}</span>
          <button onClick={fetchSystemInfo} className="btn btn-sm btn-ghost">
            重試
          </button>
        </div>
      </div>
    );
  }

  const memoryPercentage = getUsagePercentage(info.memoryUsage.used, info.memoryUsage.total);
  const diskPercentage = getUsagePercentage(info.diskUsage.used, info.diskUsage.total);

  return (
    <div className="space-y-6">
      <PageTitle
        title="系統資訊"
        items={[
          { label: '系統管理', path: '/system' },
          { label: '系統資訊', active: true },
        ]}
      />

      {/* 概覽卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card bg-base-100 shadow">
          <div className="card-body">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-3 rounded-lg">
                <span className="iconify lucide--info size-6 text-primary" />
              </div>
              <div>
                <div className="text-sm text-base-content/60">版本</div>
                <div className="text-xl font-semibold">{info.version}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow">
          <div className="card-body">
            <div className="flex items-center gap-3">
              <div className="bg-success/10 p-3 rounded-lg">
                <span className="iconify lucide--clock size-6 text-success" />
              </div>
              <div>
                <div className="text-sm text-base-content/60">運行時間</div>
                <div className="text-xl font-semibold">{info.uptime}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow">
          <div className="card-body">
            <div className="flex items-center gap-3">
              <div className="bg-info/10 p-3 rounded-lg">
                <span className="iconify lucide--server size-6 text-info" />
              </div>
              <div>
                <div className="text-sm text-base-content/60">環境</div>
                <div className="text-xl font-semibold">{info.environment}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow">
          <div className="card-body">
            <div className="flex items-center gap-3">
              <div className="bg-warning/10 p-3 rounded-lg">
                <span className="iconify lucide--database size-6 text-warning" />
              </div>
              <div>
                <div className="text-sm text-base-content/60">資料庫</div>
                <div className="text-xl font-semibold flex items-center gap-2">
                  {info.database.type}
                  <span className={`badge badge-xs ${info.database.isConnected ? 'badge-success' : 'badge-error'}`}>
                    {info.database.isConnected ? '連線中' : '離線'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 使用率圖表 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card bg-base-100 shadow">
          <div className="card-body">
            <h3 className="card-title">記憶體使用率</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>已使用 / 總容量</span>
                <span className="font-semibold">
                  {formatBytes(info.memoryUsage.used)} / {formatBytes(info.memoryUsage.total)}
                </span>
              </div>
              <progress
                className={`progress progress-${getUsageColor(memoryPercentage)} w-full`}
                value={memoryPercentage}
                max="100"
              />
              <div className="text-center">
                <span className={`text-2xl font-bold text-${getUsageColor(memoryPercentage)}`}>
                  {memoryPercentage}%
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow">
          <div className="card-body">
            <h3 className="card-title">磁碟使用率</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>已使用 / 總容量</span>
                <span className="font-semibold">
                  {formatBytes(info.diskUsage.used)} / {formatBytes(info.diskUsage.total)}
                </span>
              </div>
              <progress
                className={`progress progress-${getUsageColor(diskPercentage)} w-full`}
                value={diskPercentage}
                max="100"
              />
              <div className="text-center">
                <span className={`text-2xl font-bold text-${getUsageColor(diskPercentage)}`}>
                  {diskPercentage}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 詳細資訊表格 */}
      <div className="card bg-base-100 shadow">
        <div className="card-body">
          <h3 className="card-title">系統詳細資訊</h3>
          <div className="overflow-x-auto">
            <table className="table">
              <tbody>
                <tr>
                  <th className="w-1/3">後端版本</th>
                  <td><span className="badge badge-primary">{info.version}</span></td>
                </tr>
                <tr>
                  <th>後台版本</th>
                  <td><span className="badge badge-secondary">{import.meta.env.VITE_APP_VERSION || 'dev'}</span></td>
                </tr>
                <tr>
                  <th>伺服器時間</th>
                  <td>{new Date(info.serverTime).toLocaleString('zh-TW')}</td>
                </tr>
                <tr>
                  <th>建置時間</th>
                  <td>{new Date(info.buildTime).toLocaleString('zh-TW')}</td>
                </tr>
                <tr>
                  <th>資料庫版本</th>
                  <td>
                    {info.database.type} {info.database.version}
                  </td>
                </tr>
                <tr>
                  <th>資料庫大小</th>
                  <td>{formatBytes(info.database.size)}</td>
                </tr>
                <tr>
                  <th>快取類型</th>
                  <td>
                    <div className="flex items-center gap-2">
                      {info.cache.type}
                      <span className={`badge badge-xs ${info.cache.isConnected ? 'badge-success' : 'badge-error'}`}>
                        {info.cache.isConnected ? '連線中' : '離線'}
                      </span>
                    </div>
                  </td>
                </tr>
                <tr>
                  <th>快取命中率</th>
                  <td>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold">{info.cache.hitRate}%</span>
                      <progress
                        className="progress progress-success w-32"
                        value={info.cache.hitRate}
                        max="100"
                      />
                    </div>
                  </td>
                </tr>
                <tr>
                  <th>快取已使用記憶體</th>
                  <td>{formatBytes(info.cache.usedMemory)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 運行時資訊 */}
      <div className="card bg-base-100 shadow">
        <div className="card-body">
          <h3 className="card-title">運行時資訊</h3>
          <div className="overflow-x-auto">
            <table className="table">
              <tbody>
                <tr>
                  <th className="w-1/3">.NET 版本</th>
                  <td>{info.runtime.dotNetVersion}</td>
                </tr>
                <tr>
                  <th>作業系統</th>
                  <td>{info.runtime.operatingSystem}</td>
                </tr>
                <tr>
                  <th>處理器數量</th>
                  <td>{info.runtime.processorCount} 核心</td>
                </tr>
                <tr>
                  <th>架構</th>
                  <td>{info.runtime.is64Bit ? '64 位元' : '32 位元'}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button onClick={fetchSystemInfo} className="btn btn-primary" disabled={isLoading}>
          {isLoading ? (
            <span className="loading loading-spinner loading-sm" />
          ) : (
            <span className="iconify lucide--refresh-cw size-5" />
          )}
          重新整理
        </button>
      </div>
    </div>
  );
};
