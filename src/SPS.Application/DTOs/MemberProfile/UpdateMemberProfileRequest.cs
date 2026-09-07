using System.ComponentModel.DataAnnotations;

namespace SPS.Application.DTOs.Member;

/// <summary>
/// 更新會員個人資料請求
/// </summary>
public class UpdateMemberProfileRequest
{
    /// <summary>
    /// 暱稱
    /// </summary>
    [MaxLength(100, ErrorMessage = "暱稱長度不能超過 100 個字元")]
    public string? Nickname { get; set; }

    /// <summary>
    /// 電話
    /// </summary>
    [MaxLength(20, ErrorMessage = "電話長度不能超過 20 個字元")]
    public string? Phone { get; set; }

    /// <summary>
    /// 分機
    /// </summary>
    [MaxLength(10, ErrorMessage = "分機長度不能超過 10 個字元")]
    public string? Extension { get; set; }

    /// <summary>
    /// 手機
    /// </summary>
    [MaxLength(20, ErrorMessage = "手機長度不能超過 20 個字元")]
    public string? MobilePhone { get; set; }

    /// <summary>
    /// 職位
    /// </summary>
    [MaxLength(100, ErrorMessage = "職位長度不能超過 100 個字元")]
    public string? Position { get; set; }

    /// <summary>
    /// 職稱
    /// </summary>
    [MaxLength(100, ErrorMessage = "職稱長度不能超過 100 個字元")]
    public string? MemberJobTitle { get; set; }

    /// <summary>
    /// 照片 ID
    /// </summary>
    public int? PhotoId { get; set; }
}
