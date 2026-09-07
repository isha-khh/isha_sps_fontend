namespace SPS.Application.DTOs.File;

public class FileStatisticsResponse
{
    public int TotalFiles { get; set; }
    public long TotalSize { get; set; }
    public string FormattedTotalSize { get; set; } = string.Empty;
    public long UsedSpaceBytes { get; set; }
    public long TotalSpaceBytes { get; set; }
    public double UsagePercentage { get; set; }
    /// <summary>
    /// 回收桶文件數量（軟刪除）
    /// </summary>
    public int RecycleBinCount { get; set; }
    /// <summary>
    /// 回收桶總大小
    /// </summary>
    public long RecycleBinSize { get; set; }
    public string FormattedRecycleBinSize { get; set; } = string.Empty;
    public FileTypeDistribution FileTypeDistribution { get; set; } = new();
    public Dictionary<string, long> StorageByExtension { get; set; } = new();
}

public class FileTypeDistribution
{
    public int Images { get; set; }
    public int Videos { get; set; }
    public int Documents { get; set; }
    public int Others { get; set; }
}
