namespace SPS.Application.Common;

/// <summary>
/// 哪些路徑「絕對不能」當成公開的靜態檔案：啟動時的靜態檔案掃描會把 WebRoot 底下的檔案全部登錄成公開檔案
/// （下載端點不需要登入）。平常 WebRoot 是應用程式自己的 wwwroot，沒有問題；但部署時 WebRoot 可能被指到
/// 掛載進容器的主機目錄（<c>ASPNETCORE_WEBROOT</c>），那裡面有原始碼、設定檔、使用者上傳目錄（含會員申請附件），
/// 不能因此變成公開檔案。掃描、讀取、下載都用同一份規則。
/// </summary>
public static class StaticFileExclusions
{
    /// <summary>第一層目錄名稱（不分大小寫）：原始碼、使用者上傳、部署用的資料夾</summary>
    private static readonly HashSet<string> ExcludedTopDirectories = new(StringComparer.OrdinalIgnoreCase)
    {
        "uploads", "src", "node_modules", "bin", "obj", "logs", "redis-data", "docker", "nginx-config", "packages", "backup", "backups",
    };

    /// <summary>任何位置都不公開的副檔名：設定、原始碼、金鑰、資料庫備份、文件說明</summary>
    private static readonly HashSet<string> ExcludedExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".env", ".yml", ".yaml", ".md", ".sh", ".ps1", ".cs", ".csproj", ".sln", ".config", ".ini", ".toml",
        ".pem", ".key", ".pfx", ".crt", ".cer", ".p12", ".sql", ".bak", ".log",
    };

    /// <summary>相對於 WebRoot 的路徑（用 / 分隔）是不是不能公開</summary>
    public static bool IsExcluded(string relativePath)
    {
        if (string.IsNullOrWhiteSpace(relativePath)) return true;

        var normalized = relativePath.Replace('\\', '/').TrimStart('/');
        var segments = normalized.Split('/', StringSplitOptions.RemoveEmptyEntries);
        if (segments.Length == 0) return true;

        // 路徑穿越
        if (segments.Any(s => s == "..")) return true;

        // 隱藏的目錄或檔案（.git、.repo、.claude、.env、.DS_Store…）
        if (segments.Any(s => s.StartsWith('.'))) return true;

        // 原始碼備份目錄（src.bak.20260914…）也算
        var top = segments[0];
        if (segments.Length > 1 && (ExcludedTopDirectories.Contains(top) || top.StartsWith("src.", StringComparison.OrdinalIgnoreCase))) return true;
        if (segments.Length == 1 && ExcludedTopDirectories.Contains(top)) return true;

        var fileName = segments[^1];
        var extension = Path.GetExtension(fileName);
        if (ExcludedExtensions.Contains(extension)) return true;

        // 沒有副檔名的 Dockerfile、含機敏資訊的設定檔
        if (fileName.StartsWith("Dockerfile", StringComparison.OrdinalIgnoreCase)) return true;
        if (fileName.StartsWith("appsettings", StringComparison.OrdinalIgnoreCase)) return true;
        if (fileName.StartsWith("secrets", StringComparison.OrdinalIgnoreCase)) return true;

        return false;
    }
}
