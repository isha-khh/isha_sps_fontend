using SPS.Application.Common;
using SPS.Application.DTOs.Application;
using SPS.Domain.Enums;

namespace SPS.Application.Interfaces.IServices;

/// <summary>
/// 會員申請服務接口
/// </summary>
public interface IApplicationService
{
    /// <summary>
    /// 創建申請
    /// </summary>
    Task<Result<ApplicationResponse>> CreateApplicationAsync(
        CreateApplicationRequest request,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// 更新申請（僅草稿狀態）
    /// </summary>
    Task<Result<ApplicationResponse>> UpdateApplicationAsync(
        Guid applicationId,
        UpdateApplicationRequest request,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// 呼叫者是否有權存取這份申請：出示了正確的存取密鑰，或是這份升級申請的既有會員本人。
    /// 申請不存在、沒有密鑰（舊資料）一律回 false，讓呼叫端對外統一回 404。
    /// </summary>
    Task<bool> CanAccessAsync(
        Guid applicationId,
        string? accessKey,
        Guid? memberId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// 由申請文件 id 反查所屬申請 id（刪除文件的端點只收 documentId）
    /// </summary>
    Task<Guid?> GetApplicationIdByDocumentIdAsync(
        Guid documentId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// 申請人用「申請編號＋信箱」查進度。編號不存在、信箱對不上都回同樣的失敗，不透露哪一項錯。
    /// </summary>
    Task<Result<ApplicationStatusResponse>> GetStatusAsync(
        ApplicationStatusRequest request,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// 忘了申請編號：用「信箱＋聯絡電話」列出符合的申請（含編號）。信箱或電話對不上、沒有任何符合的申請，
    /// 一律回同樣的失敗，不透露哪一項錯。
    /// </summary>
    Task<Result<List<ApplicationStatusResponse>>> FindStatusByPhoneAsync(
        ApplicationStatusByPhoneRequest request,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// 獲取申請詳情
    /// </summary>
    Task<Result<ApplicationResponse>> GetApplicationByIdAsync(
        Guid applicationId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// 獲取我的申請列表
    /// </summary>
    Task<Result<List<ApplicationListItemResponse>>> GetMyApplicationsAsync(
        string email,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// 提交申請
    /// </summary>
    Task<Result<ApplicationResponse>> SubmitApplicationAsync(
        Guid applicationId,
        string? remark,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// 取消申請
    /// </summary>
    Task<Result<bool>> CancelApplicationAsync(
        Guid applicationId,
        string? reason,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// 上傳文件
    /// </summary>
    Task<Result<DocumentResponse>> UploadDocumentAsync(
        UploadDocumentRequest request,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// 刪除文件
    /// </summary>
    Task<Result<bool>> DeleteDocumentAsync(
        Guid documentId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// 驗證申請是否可以提交
    /// </summary>
    Task<Result<bool>> ValidateApplicationForSubmitAsync(
        Guid applicationId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// 取得申請的所有文件資訊（用於打包下載）
    /// </summary>
    Task<Result<List<DocumentResponse>>> GetDocumentsByApplicationIdAsync(
        Guid applicationId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// 取得單個文件的下載資訊
    /// </summary>
    Task<Result<(Stream FileStream, string FileName, string ContentType)>> DownloadDocumentAsync(
        Guid documentId,
        CancellationToken cancellationToken = default);
}
