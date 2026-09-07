using SPS.Application.Common;
using SPS.Application.DTOs.Auth;

namespace SPS.Application.Interfaces.IServices;

/// <summary>
/// 驗證碼服務介面
/// </summary>
public interface IVerificationCodeService
{
    /// <summary>
    /// 發送驗證碼
    /// </summary>
    /// <param name="email">收件人郵箱</param>
    /// <param name="userName">用戶名稱（用於郵件內容）</param>
    /// <param name="purpose">驗證碼用途</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>操作結果</returns>
    Task<Result> SendCodeAsync(string email, string userName, VerificationCodePurpose purpose, CancellationToken cancellationToken = default);

    /// <summary>
    /// 驗證驗證碼
    /// </summary>
    /// <param name="email">郵箱</param>
    /// <param name="code">驗證碼</param>
    /// <param name="purpose">驗證碼用途</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>驗證結果</returns>
    Task<Result<bool>> VerifyCodeAsync(string email, string code, VerificationCodePurpose purpose, CancellationToken cancellationToken = default);

    /// <summary>
    /// 使驗證碼失效
    /// </summary>
    /// <param name="email">郵箱</param>
    /// <param name="purpose">驗證碼用途</param>
    /// <param name="cancellationToken">取消令牌</param>
    Task InvalidateCodeAsync(string email, VerificationCodePurpose purpose, CancellationToken cancellationToken = default);
}
