using Microsoft.Extensions.Logging;
using SPS.Application.Common;
using SPS.Application.DTOs.Application;
using SPS.Application.Interfaces;
using SPS.Application.Interfaces.IServices;
using SPS.Domain.Entities;
using SPS.Domain.Enums;
using SPS.Domain.Exceptions;

namespace SPS.Application.Services;

/// <summary>
/// 會員申請服務實現
/// </summary>
public class ApplicationService : IApplicationService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IFileStorageService _fileStorageService;
    private readonly IFileManagementService _fileManagementService;
    private readonly IEmailService _emailService;
    private readonly ILogger<ApplicationService> _logger;

    public ApplicationService(
        IUnitOfWork unitOfWork,
        IPasswordHasher passwordHasher,
        IFileStorageService fileStorageService,
        IFileManagementService fileManagementService,
        IEmailService emailService,
        ILogger<ApplicationService> logger)
    {
        _unitOfWork = unitOfWork;
        _passwordHasher = passwordHasher;
        _fileStorageService = fileStorageService;
        _fileManagementService = fileManagementService;
        _emailService = emailService;
        _logger = logger;
    }

    public async Task<Result<ApplicationResponse>> CreateApplicationAsync(
        CreateApplicationRequest request,
        CancellationToken cancellationToken = default)
    {
        try
        {
            // 1. 驗證成員數量
            if (request.Members == null || request.Members.Count == 0)
            {
                return Result<ApplicationResponse>.Failure("必須至少添加一個會員");
            }
            if (request.Members.Count > 10)
            {
                return Result<ApplicationResponse>.Failure("最多只能添加10個會員");
            }

            // 2. 驗證第一個成員為 Manager
            if (request.Members[0].MemberPosition != MemberPosition.Manager)
            {
                return Result<ApplicationResponse>.Failure("第一個成員必須是經理");
            }

            // 3. 驗證 Email 唯一性（成員之間）
            var emails = request.Members.Select(m => m.Email.ToLower()).ToList();
            var duplicates = emails.GroupBy(e => e).Where(g => g.Count() > 1).Select(g => g.Key);
            if (duplicates.Any())
            {
                return Result<ApplicationResponse>.Failure($"Email 重複: {string.Join(", ", duplicates)}");
            }

            // 4. 驗證 Email 未被註冊（與現有會員和其他申請成員）
            foreach (var member in request.Members)
            {
                var emailExists = await _unitOfWork.ApplicationMembers
                    .ExistsByEmailAsync(member.Email, cancellationToken);
                if (emailExists)
                {
                    return Result<ApplicationResponse>.Failure($"Email 已被使用: {member.Email}");
                }
            }

            // 5. 創建 MemberApplication（前端負責調用 /api/Applications/company-info 查詢公司資訊）
            var application = new MemberApplication
            {
                Id = Guid.NewGuid(),
                ApplicationNumber = GenerateApplicationNumber(),
                MemberRole = request.MemberRole,
                Status = ApplicationStatus.Draft,
                UnifiedSocialCreditCode = request.UnifiedSocialCreditCode,
                CompanyName = request.CompanyName,
                ContactPerson = request.ContactPerson,
                IsManualInput = string.IsNullOrEmpty(request.CompanyName),
                BusinessScope = request.BusinessScope,
                CompanyAddress = request.CompanyAddress,
                Reason = request.Reason,
                CreatedTime = DateTime.UtcNow
            };

            await _unitOfWork.Applications.AddAsync(application, cancellationToken);

            // 7. 創建 ApplicationMember 記錄
            for (int i = 0; i < request.Members.Count; i++)
            {
                var memberDto = request.Members[i];
                var applicationMember = new ApplicationMember
                {
                    Id = Guid.NewGuid(),
                    ApplicationId = application.Id,
                    ContactName = memberDto.ContactName,
                    Position = memberDto.Position,
                    Email = memberDto.Email,
                    Phone = memberDto.Phone,
                    Extension = memberDto.Extension,
                    MobilePhone = memberDto.MobilePhone,
                    PasswordHash = _passwordHasher.Hash(memberDto.Password),
                    MemberPosition = memberDto.MemberPosition,
                    OrderIndex = i,
                    Status = Status.Active,
                    CreatedTime = DateTime.UtcNow
                };

                await _unitOfWork.ApplicationMembers.AddAsync(applicationMember, cancellationToken);
            }

            // 8. 添加日志
            var log = new ApplicationLog
            {
                Id = Guid.NewGuid(),
                ApplicationId = application.Id,
                FromStatus = null,
                ToStatus = ApplicationStatus.Draft,
                Action = "創建申請",
                OperatedAt = DateTime.UtcNow
            };
            await _unitOfWork.ApplicationLogs.AddLogAsync(log, cancellationToken);

            await _unitOfWork.SaveChangesAsync(cancellationToken);

            _logger.LogInformation("Created application {ApplicationNumber} with {MemberCount} members",
                application.ApplicationNumber, request.Members.Count);

            return Result<ApplicationResponse>.Success(await MapToResponseAsync(application, cancellationToken));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating application");
            return Result<ApplicationResponse>.Failure($"創建申請失敗: {ex.Message}");
        }
    }

    public async Task<Result<ApplicationResponse>> UpdateApplicationAsync(
        Guid applicationId,
        UpdateApplicationRequest request,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var application = await _unitOfWork.Applications.GetByIdAsync(applicationId, cancellationToken);
            if (application == null)
            {
                return Result<ApplicationResponse>.Failure("申請不存在");
            }

            if (application.Status != ApplicationStatus.Draft)
            {
                return Result<ApplicationResponse>.Failure("只能修改草稿狀態的申請");
            }

            // 更新字段
            if (!string.IsNullOrEmpty(request.ContactName))
                application.ContactName = request.ContactName;

            if (!string.IsNullOrEmpty(request.Phone))
                application.Phone = request.Phone;

            // 使用 Optional<T> 來區分「未提供」和「提供 null」
            // IsSet = true 表示請求中包含此欄位（無論值是什麼）
            if (request.Extension.IsSet)
                application.Extension = request.Extension.Value;

            if (request.MobilePhone.IsSet)
                application.MobilePhone = request.MobilePhone.Value;

            if (request.Position.IsSet)
                application.Position = request.Position.Value;

            if (!string.IsNullOrEmpty(request.UnifiedSocialCreditCode))
                application.UnifiedSocialCreditCode = request.UnifiedSocialCreditCode;

            // 更新公司資料（前端負責調用 /api/Applications/company-info 查詢）
            if (request.CompanyName.IsSet)
                application.CompanyName = request.CompanyName.Value;

            if (request.CompanyAddress.IsSet)
                application.CompanyAddress = request.CompanyAddress.Value;

            if (request.BusinessScope.IsSet)
                application.BusinessScope = request.BusinessScope.Value;

            if (request.Reason.IsSet)
                application.Reason = request.Reason.Value;

            if (request.Remark.IsSet)
                application.Remark = request.Remark.Value;

            application.UpdatedTime = DateTime.UtcNow;

            await _unitOfWork.Applications.UpdateAsync(application, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            _logger.LogInformation("Updated application {ApplicationNumber}", application.ApplicationNumber);

            return Result<ApplicationResponse>.Success(await MapToResponseAsync(application, cancellationToken));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating application {ApplicationId}", applicationId);
            return Result<ApplicationResponse>.Failure($"更新申請失敗: {ex.Message}");
        }
    }

    public async Task<Result<ApplicationResponse>> GetApplicationByIdAsync(
        Guid applicationId,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var application = await _unitOfWork.Applications.GetDetailByIdAsync(applicationId, cancellationToken);
            if (application == null)
            {
                return Result<ApplicationResponse>.Failure("申請不存在");
            }

            return Result<ApplicationResponse>.Success(await MapToDetailResponseAsync(application, cancellationToken));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting application {ApplicationId}", applicationId);
            return Result<ApplicationResponse>.Failure($"獲取申請失敗: {ex.Message}");
        }
    }

    public async Task<Result<List<ApplicationListItemResponse>>> GetMyApplicationsAsync(
        string email,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var applications = await _unitOfWork.Applications.GetByEmailAsync(email, cancellationToken);
            var response = applications.Select(MapToListItemResponse).ToList();
            return Result<List<ApplicationListItemResponse>>.Success(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting applications for email {Email}", email);
            return Result<List<ApplicationListItemResponse>>.Failure($"獲取申請列表失敗: {ex.Message}");
        }
    }

    public async Task<Result<ApplicationResponse>> SubmitApplicationAsync(
        Guid applicationId,
        string? remark,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var application = await _unitOfWork.Applications.GetDetailByIdAsync(applicationId, cancellationToken);
            if (application == null)
            {
                return Result<ApplicationResponse>.Failure("申請不存在");
            }

            if (application.Status != ApplicationStatus.Draft)
            {
                return Result<ApplicationResponse>.Failure("只能提交草稿狀態的申請");
            }

            // 驗證是否可以提交
            var validationResult = await ValidateApplicationForSubmitAsync(applicationId, cancellationToken);
            if (!validationResult.IsSuccess)
            {
                return Result<ApplicationResponse>.Failure(validationResult.Error!);
            }

            var oldStatus = application.Status;
            application.Status = ApplicationStatus.PendingReview;
            application.SubmittedAt = DateTime.UtcNow;
            application.UpdatedTime = DateTime.UtcNow;

            if (!string.IsNullOrEmpty(remark))
                application.Remark = remark;

            // 添加日志
            var log = new ApplicationLog
            {
                Id = Guid.NewGuid(),
                ApplicationId = application.Id,
                FromStatus = oldStatus,
                ToStatus = ApplicationStatus.PendingReview,
                Action = "提交申請",
                Comment = remark,
                OperatedAt = DateTime.UtcNow
            };
            await _unitOfWork.ApplicationLogs.AddLogAsync(log, cancellationToken);

            await _unitOfWork.Applications.UpdateAsync(application, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            _logger.LogInformation("Submitted application {ApplicationNumber}", application.ApplicationNumber);

            // 發送確認郵件給申請人
            var members = await _unitOfWork.ApplicationMembers
                .GetByApplicationIdAsync(applicationId, cancellationToken);
            var firstMember = members.FirstOrDefault();

            if (firstMember != null)
            {
                try
                {
                    await _emailService.SendTemplateEmailAsync(
                        firstMember.Email,
                        "application_submitted",
                        new Dictionary<string, string>
                        {
                            { "contactName", firstMember.ContactName },
                            { "applicationNumber", application.ApplicationNumber }
                        });
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to send application submitted email to {Email}", firstMember.Email);
                    // 郵件發送失敗不影響主流程
                }
            }

            return Result<ApplicationResponse>.Success(await MapToDetailResponseAsync(application, cancellationToken));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error submitting application {ApplicationId}", applicationId);
            return Result<ApplicationResponse>.Failure($"提交申請失敗: {ex.Message}");
        }
    }

    public async Task<Result<bool>> CancelApplicationAsync(
        Guid applicationId,
        string? reason,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var application = await _unitOfWork.Applications.GetByIdAsync(applicationId, cancellationToken);
            if (application == null)
            {
                return Result<bool>.Failure("申請不存在");
            }

            if (application.Status == ApplicationStatus.Approved ||
                application.Status == ApplicationStatus.Cancelled)
            {
                return Result<bool>.Failure("該申請不能取消");
            }

            var oldStatus = application.Status;
            application.Status = ApplicationStatus.Cancelled;
            application.UpdatedTime = DateTime.UtcNow;

            // 刪除關聯的 ApplicationMembers
            var members = await _unitOfWork.ApplicationMembers.GetByApplicationIdAsync(applicationId, cancellationToken);
            foreach (var member in members)
            {
                await _unitOfWork.ApplicationMembers.DeleteAsync(member, cancellationToken);
            }
            _logger.LogInformation("Deleted {Count} application members for application {ApplicationId}", members.Count, applicationId);

            // 刪除關聯的 ApplicationDocuments
            await _unitOfWork.ApplicationDocuments.DeleteByApplicationIdAsync(applicationId, cancellationToken);
            _logger.LogInformation("Deleted application documents for application {ApplicationId}", applicationId);

            // 添加日志
            var log = new ApplicationLog
            {
                Id = Guid.NewGuid(),
                ApplicationId = application.Id,
                FromStatus = oldStatus,
                ToStatus = ApplicationStatus.Cancelled,
                Action = "取消申請",
                Comment = reason,
                OperatedAt = DateTime.UtcNow
            };
            await _unitOfWork.ApplicationLogs.AddLogAsync(log, cancellationToken);

            await _unitOfWork.Applications.UpdateAsync(application, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            _logger.LogInformation("Cancelled application {ApplicationNumber}", application.ApplicationNumber);

            return Result<bool>.Success(true);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error cancelling application {ApplicationId}", applicationId);
            return Result<bool>.Failure($"取消申請失敗: {ex.Message}");
        }
    }

    public async Task<Result<DocumentResponse>> UploadDocumentAsync(
        UploadDocumentRequest request,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var application = await _unitOfWork.Applications.GetByIdAsync(request.ApplicationId, cancellationToken);
            if (application == null)
            {
                return Result<DocumentResponse>.Failure("申請不存在");
            }

            if (application.Status != ApplicationStatus.Draft && application.Status != ApplicationStatus.UnderReview)
            {
                return Result<DocumentResponse>.Failure("只能為草稿或審核中狀態的申請上傳文件");
            }

            // 檢查該類型文件是否已上傳
            var existingDocument = await _unitOfWork.ApplicationDocuments
                .GetByApplicationIdAndTypeAsync(request.ApplicationId, request.Type, cancellationToken);

            if (existingDocument != null)
            {
                // 刪除舊文件（軟刪除）
                if (existingDocument.UploadedFileId.HasValue)
                {
                    await _fileManagementService.DeleteFileAsync(
                        existingDocument.UploadedFileId.Value,
                        Guid.Empty, // System delete
                        cancellationToken);
                }
                else
                {
                    // 兼容舊的文件存儲方式
                    await _fileStorageService.DeleteFileAsync(existingDocument.FilePath, cancellationToken);
                }
                await _unitOfWork.ApplicationDocuments.DeleteAsync(existingDocument, cancellationToken);
            }

            // 計算過期時間（從配置讀取保存月數，默認6個月）
            var expirationMonths = 6; // TODO: 從配置讀取
            var expiresAt = DateTime.UtcNow.AddMonths(expirationMonths);

            // 使用新的文件管理服務上傳文件
            var fileUploadRequest = new SPS.Application.DTOs.File.FileUploadRequest
            {
                File = request.File,
                Description = $"申請文件 - {request.Type}",
                Tags = $"application,{request.Type}",
                IsPublic = false,
                ExpiresAt = expiresAt
            };

            var uploadResult = await _fileManagementService.UploadFileAsync(
                fileUploadRequest,
                Guid.Empty, // System upload, can be changed to actual uploader
                cancellationToken);

            if (!uploadResult.IsSuccess)
            {
                return Result<DocumentResponse>.Failure(uploadResult.Error!);
            }

            var fileData = uploadResult.Data!;

            // 創建文檔記錄
            var document = new ApplicationDocument
            {
                Id = Guid.NewGuid(),
                ApplicationId = request.ApplicationId,
                Type = request.Type,
                FileName = fileData.FileName,
                FilePath = fileData.FileUrl, // 使用文件 URL 作為路徑
                ContentType = fileData.ContentType,
                FileSize = fileData.FileSize,
                FileHash = fileData.FileHash,
                ExpiresAt = expiresAt,
                UploadedFileId = fileData.FileId, // 關聯到文件管理系統
                CreatedTime = DateTime.UtcNow
            };

            await _unitOfWork.ApplicationDocuments.AddAsync(document, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            _logger.LogInformation("Uploaded document {Type} for application {ApplicationId}",
                request.Type, request.ApplicationId);

            return Result<DocumentResponse>.Success(new DocumentResponse
            {
                Id = document.Id,
                Type = document.Type,
                FileName = document.FileName,
                FilePath = document.FilePath,
                ContentType = document.ContentType,
                FileSize = document.FileSize,
                FileHash = document.FileHash,
                ExpiresAt = document.ExpiresAt,
                CreatedTime = document.CreatedTime
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error uploading document for application {ApplicationId}", request.ApplicationId);
            return Result<DocumentResponse>.Failure($"上傳文件失敗: {ex.Message}");
        }
    }

    public async Task<Result<bool>> DeleteDocumentAsync(
        Guid documentId,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var document = await _unitOfWork.ApplicationDocuments.GetByIdAsync(documentId, cancellationToken);
            if (document == null)
            {
                return Result<bool>.Failure("文件不存在");
            }

            // 檢查申請狀態，只允許 Draft 和 UnderReview 狀態刪除
            var application = await _unitOfWork.Applications.GetByIdAsync(document.ApplicationId, cancellationToken);
            if (application != null &&
                application.Status != ApplicationStatus.Draft &&
                application.Status != ApplicationStatus.UnderReview)
            {
                return Result<bool>.Failure("只能在草稿或審核中狀態下刪除文件");
            }

            // 刪除文件（如果有 UploadedFileId 則軟刪除，否則刪除物理文件）
            if (document.UploadedFileId.HasValue)
            {
                await _fileManagementService.DeleteFileAsync(
                    document.UploadedFileId.Value,
                    Guid.Empty, // System delete
                    cancellationToken);
            }


            await _unitOfWork.ApplicationDocuments.DeleteAsync(document, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            _logger.LogInformation("Deleted document {DocumentId}", documentId);

            return Result<bool>.Success(true);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting document {DocumentId}", documentId);
            return Result<bool>.Failure($"刪除文件失敗: {ex.Message}");
        }
    }

    public async Task<Result<bool>> ValidateApplicationForSubmitAsync(
        Guid applicationId,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var application = await _unitOfWork.Applications.GetDetailByIdAsync(applicationId, cancellationToken);
            if (application == null)
            {
                return Result<bool>.Failure("申請不存在");
            }

            // 驗證必填字段
            if (string.IsNullOrEmpty(application.UnifiedSocialCreditCode) ||
                string.IsNullOrEmpty(application.ContactPerson))
            {
                return Result<bool>.Failure("請填寫完整的公司信息");
            }

            // 驗證成員
            var members = await _unitOfWork.ApplicationMembers
                .GetByApplicationIdAsync(applicationId, cancellationToken);

            if (!members.Any())
            {
                return Result<bool>.Failure("請至少添加一個會員");
            }

            if (members.First().MemberPosition != MemberPosition.Manager)
            {
                return Result<bool>.Failure("第一個成員必須是經理");
            }

            // 驗證文件上傳
            var documents = application.Documents.ToList();

            // 檢查必填文件
            var hasCompanyRegistration = documents.Any(d => d.Type == DocumentType.CompanyRegistration);
            var hasPersonalDataConsent = documents.Any(d => d.Type == DocumentType.PersonalDataConsent);

            if (!hasCompanyRegistration)
            {
                return Result<bool>.Failure("請上傳公司登記證明文件");
            }

            if (!hasPersonalDataConsent)
            {
                return Result<bool>.Failure("請上傳個人資料告知事項及同意書");
            }

            // 供給端需要額外的證明文件（四選一）
            if (application.MemberRole == MemberRole.Supplier)
            {
                var hasCapabilityDoc = documents.Any(d =>
                    d.Type == DocumentType.TechnicalCapability ||
                    d.Type == DocumentType.CloudMarketplace ||
                    d.Type == DocumentType.DigitalServiceCapability ||
                    d.Type == DocumentType.Application);

                if (!hasCapabilityDoc)
                {
                    return Result<bool>.Failure("供給端需要上傳技術服務能量登錄、云市集、數位服務機構證明或一般申請書（四選一）");
                }
            }

            return Result<bool>.Success(true);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error validating application {ApplicationId}", applicationId);
            return Result<bool>.Failure($"驗證申請失敗: {ex.Message}");
        }
    }

    public async Task<Result<List<DocumentResponse>>> GetDocumentsByApplicationIdAsync(
        Guid applicationId,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var application = await _unitOfWork.Applications.GetByIdAsync(applicationId, cancellationToken);
            if (application == null)
            {
                return Result<List<DocumentResponse>>.Failure("申請不存在");
            }

            var documents = await _unitOfWork.ApplicationDocuments
                .GetByApplicationIdAsync(applicationId, cancellationToken);

            var response = documents.Select(d => new DocumentResponse
            {
                Id = d.Id,
                Type = d.Type,
                FileName = d.FileName,
                FilePath = d.FilePath,
                ContentType = d.ContentType,
                FileSize = d.FileSize,
                FileHash = d.FileHash,
                ExpiresAt = d.ExpiresAt,
                CreatedTime = d.CreatedTime
            }).ToList();

            return Result<List<DocumentResponse>>.Success(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting documents for application {ApplicationId}", applicationId);
            return Result<List<DocumentResponse>>.Failure($"獲取文件列表失敗: {ex.Message}");
        }
    }

    public async Task<Result<(Stream FileStream, string FileName, string ContentType)>> DownloadDocumentAsync(
        Guid documentId,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var document = await _unitOfWork.ApplicationDocuments.GetByIdAsync(documentId, cancellationToken);
            if (document == null)
            {
                return Result<(Stream, string, string)>.Failure("文件不存在");
            }

            if (document.UploadedFileId.HasValue)
            {
                var downloadResult = await _fileManagementService.DownloadFileAsync(
                    document.UploadedFileId.Value, cancellationToken);

                if (!downloadResult.IsSuccess)
                {
                    return Result<(Stream, string, string)>.Failure(downloadResult.Error!);
                }

                return Result<(Stream, string, string)>.Success(
                    (downloadResult.Data.FileStream, document.FileName, document.ContentType));
            }

            // Fallback: 舊的文件存儲方式
            var fullPath = _fileStorageService.GetFullPath(document.FilePath);
            if (!System.IO.File.Exists(fullPath))
            {
                return Result<(Stream, string, string)>.Failure("文件不存在或已過期");
            }

            var fileStream = new FileStream(fullPath, FileMode.Open, FileAccess.Read, FileShare.Read);
            return Result<(Stream, string, string)>.Success(
                (fileStream, document.FileName, document.ContentType));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error downloading document {DocumentId}", documentId);
            return Result<(Stream, string, string)>.Failure($"下載文件失敗: {ex.Message}");
        }
    }

    // Helper methods
    private static string GenerateApplicationNumber()
    {
        return $"APP{DateTime.UtcNow:yyyyMMddHHmmssfff}";
    }

    private async Task<ApplicationResponse> MapToResponseAsync(
        MemberApplication application,
        CancellationToken cancellationToken)
    {
        var members = await _unitOfWork.ApplicationMembers
            .GetByApplicationIdAsync(application.Id, cancellationToken);

        var firstMember = members.FirstOrDefault();

        return new ApplicationResponse
        {
            Id = application.Id,
            ApplicationNumber = application.ApplicationNumber,
            MemberRole = application.MemberRole,
            Status = application.Status,
            Email = firstMember?.Email ?? string.Empty,
            ContactName = firstMember?.ContactName ?? string.Empty,
            Phone = firstMember?.Phone ?? string.Empty,
            Extension = firstMember?.Extension,
            MobilePhone = firstMember?.MobilePhone,
            Position = firstMember?.Position ?? string.Empty,
            CompanyId = application.CompanyId,
            UnifiedSocialCreditCode = application.UnifiedSocialCreditCode,
            CompanyName = application.CompanyName,
            ContactPerson = application.ContactPerson,
            IsManualInput = application.IsManualInput,
            BusinessScope = application.BusinessScope,
            CompanyAddress = application.CompanyAddress,
            Reason = application.Reason,
            Remark = application.Remark,
            ReviewerId = application.ReviewerId,
            ReviewStartedAt = application.ReviewStartedAt,
            ReviewedAt = application.ReviewedAt,
            ReviewComment = application.ReviewComment,
            RejectionReason = application.RejectionReason,
            SubmittedAt = application.SubmittedAt,
            CreatedTime = application.CreatedTime,
            UpdatedTime = application.UpdatedTime,
            Members = members.Select(m => new ApplicationMemberResponse
            {
                Id = m.Id,
                ContactName = m.ContactName,
                Position = m.Position,
                Email = m.Email,
                Phone = m.Phone,
                Extension = m.Extension,
                MobilePhone = m.MobilePhone,
                MemberPosition = m.MemberPosition,
                OrderIndex = m.OrderIndex,
                Status = m.Status,
                CreatedMemberId = m.CreatedMemberId,
                CreatedTime = m.CreatedTime
            }).ToList()
        };
    }

    private async Task<ApplicationResponse> MapToDetailResponseAsync(
        MemberApplication application,
        CancellationToken cancellationToken)
    {
        var response = await MapToResponseAsync(application, cancellationToken);
        response.ReviewerName = application.Reviewer != null
            ? (application.Reviewer.Name ?? application.Reviewer.Email)
            : null;
        response.Documents = application.Documents.Select(d => new DocumentResponse
        {
            Id = d.Id,
            Type = d.Type,
            FileName = d.FileName,
            FilePath = d.FilePath,
            ContentType = d.ContentType,
            FileSize = d.FileSize,
            FileHash = d.FileHash,
            ExpiresAt = d.ExpiresAt,
            CreatedTime = d.CreatedTime
        }).ToList();
        response.Logs = application.Logs.Select(l => new ApplicationLogResponse
        {
            Id = l.Id,
            FromStatus = l.FromStatus,
            ToStatus = l.ToStatus,
            OperatorId = l.OperatorId,
            Action = l.Action,
            Comment = l.Comment,
            IpAddress = l.IpAddress,
            OperatedAt = l.OperatedAt
        }).ToList();
        return response;
    }

    private static ApplicationListItemResponse MapToListItemResponse(MemberApplication application)
    {
        return new ApplicationListItemResponse
        {
            Id = application.Id,
            ApplicationNumber = application.ApplicationNumber,
            MemberRole = application.MemberRole,
            Status = application.Status,
            Email = application.Email,
            ContactName = application.ContactName,
            Phone = application.Phone,
            Extension = application.Extension,
            MobilePhone = application.MobilePhone,
            UnifiedSocialCreditCode = application.UnifiedSocialCreditCode,
            CompanyName = application.CompanyName,
            ReviewerId = application.ReviewerId,
            ReviewStartedAt = application.ReviewStartedAt,
            ReviewedAt = application.ReviewedAt,
            SubmittedAt = application.SubmittedAt,
            CreatedTime = application.CreatedTime
        };
    }
}
