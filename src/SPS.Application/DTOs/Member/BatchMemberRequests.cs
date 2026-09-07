namespace SPS.Application.DTOs.Member;

/// <summary>
/// 批次重置密碼請求
/// </summary>
public class BatchResetPasswordRequest
{
    /// <summary>
    /// 會員 ID 列表
    /// </summary>
    public List<Guid> MemberIds { get; set; } = new();

    /// <summary>
    /// 是否要求會員下次登入時修改密碼
    /// </summary>
    public bool RequireChangeOnLogin { get; set; } = true;

    /// <summary>
    /// 是否發送通知郵件給會員
    /// </summary>
    public bool SendNotificationEmail { get; set; } = true;
}

/// <summary>
/// 批次更新信箱驗證狀態請求
/// </summary>
public class BatchUpdateEmailVerificationRequest
{
    /// <summary>
    /// 會員 ID 列表
    /// </summary>
    public List<Guid> MemberIds { get; set; } = new();

    /// <summary>
    /// 是否已驗證
    /// </summary>
    public bool IsVerified { get; set; }
}

/// <summary>
/// 批次設定要求下次登入修改密碼
/// </summary>
public class BatchRequirePasswordChangeRequest
{
    /// <summary>
    /// 會員 ID 列表
    /// </summary>
    public List<Guid> MemberIds { get; set; } = new();

    /// <summary>
    /// 是否要求下次登入修改密碼
    /// </summary>
    public bool RequireChange { get; set; }
}

/// <summary>
/// 批次操作結果
/// </summary>
public class BatchOperationResult
{
    /// <summary>
    /// 成功數量
    /// </summary>
    public int Success { get; set; }

    /// <summary>
    /// 失敗數量
    /// </summary>
    public int Failed { get; set; }
}
