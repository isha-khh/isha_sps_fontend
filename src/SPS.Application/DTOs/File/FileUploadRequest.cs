using Microsoft.AspNetCore.Http;

namespace SPS.Application.DTOs.File;

/// <summary>
/// 文件上傳請求
/// </summary>
public class FileUploadRequest
{
    /// <summary>
    /// 上傳的文件
    /// </summary>
    public IFormFile File { get; set; } = null!;

    /// <summary>
    /// 文件描述
    /// </summary>
    public string? Description { get; set; }

    /// <summary>
    /// 文件標簽（逗號分隔）
    /// </summary>
    public string? Tags { get; set; }

    /// <summary>
    /// 是否公開訪問
    /// </summary>
    public bool IsPublic { get; set; } = false;

    /// <summary>
    /// 過期時間（可選）
    /// </summary>
    public DateTime? ExpiresAt { get; set; }

    /// <summary>
    /// 是否做圖片最佳化（JPG／PNG／BMP 轉 WebP、過大縮小）。只有後台內容上傳與企業會員的公司圖片會開啟；
    /// 申請文件（證明文件）要保留原檔，預設不轉。
    /// </summary>
    [Microsoft.AspNetCore.Mvc.ModelBinding.BindNever]
    public bool OptimizeImage { get; set; } = false;
}

/// <summary>
/// 批量文件上傳請求
/// </summary>
public class BatchFileUploadRequest
{
    /// <summary>
    /// 上傳的文件列表
    /// </summary>
    public List<IFormFile> Files { get; set; } = new();

    /// <summary>
    /// 是否公開訪問
    /// </summary>
    public bool IsPublic { get; set; } = false;

    /// <summary>
    /// 過期時間（可選）
    /// </summary>
    public DateTime? ExpiresAt { get; set; }

    /// <summary>是否做圖片最佳化，由控制器決定，見 <see cref="FileUploadRequest.OptimizeImage"/></summary>
    [Microsoft.AspNetCore.Mvc.ModelBinding.BindNever]
    public bool OptimizeImage { get; set; } = false;
}
