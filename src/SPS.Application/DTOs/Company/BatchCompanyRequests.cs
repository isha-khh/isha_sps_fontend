using SPS.Domain.Enums;

namespace SPS.Application.DTOs.Company;

/// <summary>
/// 批次更新公司狀態請求
/// </summary>
public class BatchUpdateCompanyStatusRequest
{
    /// <summary>
    /// 公司 ID 列表
    /// </summary>
    public List<Guid> CompanyIds { get; set; } = new();

    /// <summary>
    /// 目標狀態
    /// </summary>
    public Status Status { get; set; }
}

/// <summary>
/// 批次刪除公司請求
/// </summary>
public class BatchDeleteCompanyRequest
{
    /// <summary>
    /// 公司 ID 列表
    /// </summary>
    public List<Guid> CompanyIds { get; set; } = new();
}
