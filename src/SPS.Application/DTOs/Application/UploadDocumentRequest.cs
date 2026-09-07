using Microsoft.AspNetCore.Http;
using SPS.Domain.Enums;
using System.ComponentModel.DataAnnotations;

namespace SPS.Application.DTOs.Application;

/// <summary>
/// 上傳文件請求
/// </summary>
public class UploadDocumentRequest
{
    /// <summary>
    /// 申請ID
    /// </summary>
    [Required(ErrorMessage = "申請ID不能為空")]
    public Guid ApplicationId { get; set; }

    /// <summary>
    /// 文件類型
    /// </summary>
    [Required(ErrorMessage = "文件類型不能為空")]
    public DocumentType Type { get; set; }

    /// <summary>
    /// 文件
    /// </summary>
    [Required(ErrorMessage = "文件不能為空")]
    public IFormFile File { get; set; } = null!;
}
