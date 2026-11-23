using SPS.Application.Common;

namespace SPS.Application.Interfaces.IServices;

/// <summary>
/// 密碼策略服務：依後台「系統設定 → 安全性 → 密碼策略」驗證密碼（長度、大小寫、數字、特殊字元），
/// 並處理「不可重複使用前 N 組密碼」（密碼歷史）。
/// </summary>
public interface IPasswordPolicyService
{
    /// <summary>
    /// 只驗證密碼組成規則（長度、大小寫、數字、特殊字元），不看歷史。
    /// 用在還沒有帳號的場合（例如會員申請，帳號要等審核通過才建立）。
    /// </summary>
    Task<Result> ValidatePasswordAsync(string password, CancellationToken cancellationToken = default);

    /// <summary>
    /// 驗證前台會員的新密碼：組成規則＋不可重複使用前 N 組密碼（含目前密碼）。
    /// </summary>
    Task<Result> ValidateForMemberAsync(string password, Guid memberId, CancellationToken cancellationToken = default);

    /// <summary>
    /// 驗證後台使用者的新密碼：組成規則＋不可重複使用前 N 組密碼（含目前密碼）。
    /// </summary>
    Task<Result> ValidateForUserAsync(string password, Guid userId, CancellationToken cancellationToken = default);

    /// <summary>
    /// 記下前台會員剛設定的密碼雜湊（歷史紀錄）。只加進目前的工作單元，由呼叫端接著 SaveChanges，
    /// 跟密碼本身在同一個交易裡寫入。
    /// </summary>
    Task RecordForMemberAsync(Guid memberId, string passwordHash, CancellationToken cancellationToken = default);

    /// <summary>
    /// 記下後台使用者剛設定的密碼雜湊（歷史紀錄）。同 <see cref="RecordForMemberAsync"/>，由呼叫端 SaveChanges。
    /// </summary>
    Task RecordForUserAsync(Guid userId, string passwordHash, CancellationToken cancellationToken = default);

    /// <summary>
    /// 產生一組符合目前密碼策略的隨機密碼（管理員重設會員密碼、批次重設時用）。
    /// </summary>
    Task<string> GeneratePasswordAsync(CancellationToken cancellationToken = default);
}
