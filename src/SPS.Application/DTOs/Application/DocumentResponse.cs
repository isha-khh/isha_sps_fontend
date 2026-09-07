using SPS.Domain.Enums;

namespace SPS.Application.DTOs.Application;

/// <summary>
/// 文件響應
/// </summary>
public class DocumentResponse
{
    public Guid Id { get; set; }
    public DocumentType Type { get; set; }
    public string FileName { get; set; } = string.Empty;
    public string FilePath { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
    public long FileSize { get; set; }
    public string FileHash { get; set; } = string.Empty;
    public DateTime? ExpiresAt { get; set; }
    public DateTime CreatedTime { get; set; }
}
