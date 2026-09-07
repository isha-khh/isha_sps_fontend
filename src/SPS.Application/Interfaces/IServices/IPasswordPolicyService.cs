using SPS.Application.Common;

namespace SPS.Application.Interfaces.IServices;

/// <summary>
/// 密碼策略驗證服務
/// </summary>
public interface IPasswordPolicyService
{
    /// <summary>
    /// 驗證密碼是否符合密碼策略
    /// </summary>
    Task<Result> ValidatePasswordAsync(string password, CancellationToken cancellationToken = default);
}
