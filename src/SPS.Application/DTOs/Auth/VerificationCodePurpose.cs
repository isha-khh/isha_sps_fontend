namespace SPS.Application.DTOs.Auth;

/// <summary>
/// 驗證碼用途
/// </summary>
public enum VerificationCodePurpose
{
    /// <summary>
    /// 修改密碼
    /// </summary>
    ChangePassword = 0,

    /// <summary>
    /// 重設密碼
    /// </summary>
    ResetPassword = 1,

    /// <summary>
    /// 驗證郵箱
    /// </summary>
    VerifyEmail = 2,

    /// <summary>
    /// 登入驗證
    /// </summary>
    Login = 3
}
