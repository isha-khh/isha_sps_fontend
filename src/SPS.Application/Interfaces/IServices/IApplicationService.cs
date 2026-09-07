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
