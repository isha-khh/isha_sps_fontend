using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using SPS.Application.Common;
using SPS.Application.DTOs.Application;
using SPS.Application.DTOs.Common;
using SPS.Application.Interfaces;
using SPS.Application.Interfaces.IServices;
using SPS.Domain.Entities;
using SPS.Domain.Enums;

namespace SPS.Application.Services;

/// <summary>
/// 申請審核服務實現
/// </summary>
public class ApplicationReviewService : IApplicationReviewService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IEmailService _emailService;
    private readonly IConfiguration _configuration;
    private readonly ILogger<ApplicationReviewService> _logger;

    public ApplicationReviewService(
        IUnitOfWork unitOfWork,
        IPasswordHasher passwordHasher,
        IEmailService emailService,
        IConfiguration configuration,
        ILogger<ApplicationReviewService> logger)
    {
        _unitOfWork = unitOfWork;
        _passwordHasher = passwordHasher;
        _emailService = emailService;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task<Result<PagedResult<ApplicationListItemResponse>>> GetPendingApplicationsAsync(
        int pageIndex = 1,
        int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var applications = await _unitOfWork.Applications
                .GetByStatusAsync(ApplicationStatus.PendingReview, pageIndex, pageSize, cancellationToken);

            var totalCount = await _unitOfWork.Applications
                .CountByStatusAsync(ApplicationStatus.PendingReview, cancellationToken);

            var response = new PagedResult<ApplicationListItemResponse>
            {
                Items = applications.Select(MapToListItemResponse).ToList(),
                TotalCount = totalCount,
                Page = pageIndex,
                PageSize = pageSize
            };

            return Result<PagedResult<ApplicationListItemResponse>>.Success(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting pending applications");
            return Result<PagedResult<ApplicationListItemResponse>>.Failure($"獲取待審核申請失敗: {ex.Message}");
        }
    }

    public async Task<Result<PagedResult<ApplicationListItemResponse>>> GetApplicationsUnderReviewAsync(
        Guid? reviewerId = null,
        int pageIndex = 1,
        int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        try
        {
            List<MemberApplication> applications;
            int totalCount;

            if (reviewerId.HasValue)
            {
                var allApplications = await _unitOfWork.Applications
                    .GetByReviewerIdAsync(reviewerId.Value, cancellationToken);
                var underReviewApps = allApplications
                    .Where(a => a.Status == ApplicationStatus.UnderReview)
                    .ToList();
                totalCount = underReviewApps.Count;
                applications = underReviewApps
                    .Skip((pageIndex - 1) * pageSize)
                    .Take(pageSize)
                    .ToList();
            }
            else
            {
                applications = await _unitOfWork.Applications
                    .GetByStatusAsync(ApplicationStatus.UnderReview, pageIndex, pageSize, cancellationToken);
                totalCount = await _unitOfWork.Applications
                    .CountByStatusAsync(ApplicationStatus.UnderReview, cancellationToken);
            }

            var response = new PagedResult<ApplicationListItemResponse>
            {
                Items = applications.Select(MapToListItemResponse).ToList(),
                TotalCount = totalCount,
                Page = pageIndex,
                PageSize = pageSize
            };

            return Result<PagedResult<ApplicationListItemResponse>>.Success(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting applications under review");
            return Result<PagedResult<ApplicationListItemResponse>>.Failure($"獲取審核中申請失敗: {ex.Message}");
        }
    }

    public async Task<Result<PagedResult<ApplicationListItemResponse>>> GetCompletedApplicationsAsync(
        ApplicationStatus? status = null,
        int pageIndex = 1,
        int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        try
        {
            List<MemberApplication> applications;
            int totalCount;

            var completedStatuses = new[] { ApplicationStatus.Approved, ApplicationStatus.Rejected };
            var queryStatuses = status.HasValue ? new[] { status.Value } : completedStatuses;

            applications = await _unitOfWork.Applications
                .GetByStatusesAsync(queryStatuses, pageIndex, pageSize, cancellationToken);
            totalCount = await _unitOfWork.Applications
                .CountByStatusesAsync(queryStatuses, cancellationToken);

            var response = new PagedResult<ApplicationListItemResponse>
            {
                Items = applications.Select(MapToListItemResponse).ToList(),
                TotalCount = totalCount,
                Page = pageIndex,
                PageSize = pageSize
            };

            return Result<PagedResult<ApplicationListItemResponse>>.Success(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting completed applications");
            return Result<PagedResult<ApplicationListItemResponse>>.Failure($"獲取已完成申請失敗: {ex.Message}");
        }
    }

    public async Task<Result<ApplicationResponse>> ClaimApplicationAsync(
        Guid applicationId,
        Guid reviewerId,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var application = await _unitOfWork.Applications.GetDetailByIdAsync(applicationId, cancellationToken);
            if (application == null)
            {
                return Result<ApplicationResponse>.Failure("申請不存在");
            }

            if (application.Status != ApplicationStatus.PendingReview)
            {
                return Result<ApplicationResponse>.Failure("只能領取待審核狀態的申請");
            }

            // 驗證審核人是否存在
            var reviewer = await _unitOfWork.Users.GetByIdAsync(reviewerId, cancellationToken);
            if (reviewer == null)
            {
                return Result<ApplicationResponse>.Failure("審核人不存在");
            }

            // TODO: 驗證審核人權限（應該使用後台User系統而不是Member）
            // 暫時移除角色檢查，因為審核功能應該由後台管理員負責

            var oldStatus = application.Status;
            application.Status = ApplicationStatus.UnderReview;
            application.ReviewerId = reviewerId;
            application.ReviewStartedAt = DateTime.UtcNow;
            application.UpdatedTime = DateTime.UtcNow;

            // 添加日志
            var log = new ApplicationLog
            {
                Id = Guid.NewGuid(),
                ApplicationId = application.Id,
                FromStatus = oldStatus,
                ToStatus = ApplicationStatus.UnderReview,
                OperatorId = reviewerId,
                Action = "領取申請",
                OperatedAt = DateTime.UtcNow
            };
            await _unitOfWork.ApplicationLogs.AddLogAsync(log, cancellationToken);

            await _unitOfWork.Applications.UpdateAsync(application, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            _logger.LogInformation("Reviewer {ReviewerId} claimed application {ApplicationNumber}",
                reviewerId, application.ApplicationNumber);

            return Result<ApplicationResponse>.Success(await MapToDetailResponseAsync(application, cancellationToken));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error claiming application {ApplicationId}", applicationId);
            return Result<ApplicationResponse>.Failure($"領取申請失敗: {ex.Message}");
        }
    }

    public async Task<Result<ApplicationResponse>> ReviewApplicationAsync(
        ReviewApplicationRequest request,
        string? ipAddress,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var application = await _unitOfWork.Applications.GetDetailByIdAsync(request.ApplicationId, cancellationToken);
            if (application == null)
            {
                return Result<ApplicationResponse>.Failure("申請不存在");
            }

            if (application.Status != ApplicationStatus.UnderReview)
            {
                return Result<ApplicationResponse>.Failure("只能審核審核中狀態的申請");
            }

            if (application.ReviewerId != request.ReviewerId)
            {
                return Result<ApplicationResponse>.Failure("只能審核自己領取的申請");
            }

            var oldStatus = application.Status;
            var newStatus = request.IsApproved ? ApplicationStatus.Approved : ApplicationStatus.Rejected;

            application.Status = newStatus;
            application.ReviewedAt = DateTime.UtcNow;
            application.ReviewComment = request.ReviewComment;
            application.UpdatedTime = DateTime.UtcNow;

            if (!request.IsApproved)
            {
                if (string.IsNullOrEmpty(request.RejectionReason))
                {
                    return Result<ApplicationResponse>.Failure("拒絕申請時必須填寫拒絕原因");
                }
                application.RejectionReason = request.RejectionReason;
            }
            else
            {
                // 審核通過，創建會員和企業
                var createResult = await CreateMemberAndCompanyAsync(application, cancellationToken);
                if (!createResult.IsSuccess)
                {
                    return Result<ApplicationResponse>.Failure(createResult.Error!);
                }
            }

            // 添加日志
            var log = new ApplicationLog
            {
                Id = Guid.NewGuid(),
                ApplicationId = application.Id,
                FromStatus = oldStatus,
                ToStatus = newStatus,
                OperatorId = request.ReviewerId,
                Action = request.IsApproved ? "審核通過" : "審核拒絕",
                Comment = request.ReviewComment,
                IpAddress = ipAddress,
                OperatedAt = DateTime.UtcNow
            };
            await _unitOfWork.ApplicationLogs.AddLogAsync(log, cancellationToken);

            await _unitOfWork.Applications.UpdateAsync(application, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            _logger.LogInformation("Reviewer {ReviewerId} {Action} application {ApplicationNumber}",
                request.ReviewerId, request.IsApproved ? "approved" : "rejected", application.ApplicationNumber);

            // 發送審核結果郵件給所有成員
            var applicationMembers = await _unitOfWork.ApplicationMembers
                .GetByApplicationIdAsync(request.ApplicationId, cancellationToken);

            foreach (var appMember in applicationMembers)
            {
                try
                {
                    if (request.IsApproved)
                    {
                        await _emailService.SendTemplateEmailAsync(
                            appMember.Email,
                            "application_approved",
                            new Dictionary<string, string>
                            {
                                { "contactName", appMember.ContactName },
                                { "applicationNumber", application.ApplicationNumber },
                                { "loginUrl", _configuration["App:BaseUrl"] ?? "https://localhost" }
                            });
                    }
                    else
                    {
                        await _emailService.SendTemplateEmailAsync(
                            appMember.Email,
                            "application_rejected",
                            new Dictionary<string, string>
                            {
                                { "contactName", appMember.ContactName },
                                { "applicationNumber", application.ApplicationNumber },
                                { "rejectionReason", request.RejectionReason ?? "未說明" }
                            });
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to send review result email to {Email}", appMember.Email);
                    // 郵件發送失敗不影響主流程
                }
            }

            return Result<ApplicationResponse>.Success(await MapToDetailResponseAsync(application, cancellationToken));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error reviewing application {ApplicationId}", request.ApplicationId);
            return Result<ApplicationResponse>.Failure($"審核申請失敗: {ex.Message}");
        }
    }

    public async Task<Result<ApplicationStatisticsResponse>> GetApplicationStatisticsAsync(
        CancellationToken cancellationToken = default)
    {
        try
        {
            var statistics = await _unitOfWork.Applications.GetStatisticsAsync(cancellationToken);

            // 以台灣時間 (UTC+8) 計算「今日」起始點，結果需標記為 Utc 以符合 Npgsql 要求
            var taiwanOffset = TimeSpan.FromHours(8);
            var todayStart = DateTime.SpecifyKind((DateTime.UtcNow + taiwanOffset).Date - taiwanOffset, DateTimeKind.Utc);
            var db = _unitOfWork.GetDbContext();
            var todayApplications = await db.Set<MemberApplication>()
                .CountAsync(a => a.CreatedTime >= todayStart, cancellationToken);

            var response = new ApplicationStatisticsResponse
            {
                TotalApplications = statistics.Values.Sum(),
                Draft = statistics.GetValueOrDefault(ApplicationStatus.Draft, 0),
                PendingReview = statistics.GetValueOrDefault(ApplicationStatus.PendingReview, 0),
                UnderReview = statistics.GetValueOrDefault(ApplicationStatus.UnderReview, 0),
                Approved = statistics.GetValueOrDefault(ApplicationStatus.Approved, 0),
                Rejected = statistics.GetValueOrDefault(ApplicationStatus.Rejected, 0),
                Cancelled = statistics.GetValueOrDefault(ApplicationStatus.Cancelled, 0),
                TodayApplications = todayApplications
            };

            return Result<ApplicationStatisticsResponse>.Success(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting application statistics");
            return Result<ApplicationStatisticsResponse>.Failure($"獲取統計數據失敗: {ex.Message}");
        }
    }

    // Helper method to create member and company after approval
    private async Task<Result<bool>> CreateMemberAndCompanyAsync(
        MemberApplication application,
        CancellationToken cancellationToken)
    {
        try
        {
            // 1. 檢查或創建企業
            var company = await _unitOfWork.Companies
                .GetByUnifiedSocialCreditCodeAsync(application.UnifiedSocialCreditCode, cancellationToken);

            if (company == null)
            {
                company = new Company
                {
                    Id = Guid.NewGuid(),
                    Number = GenerateCompanyNumber(),
                    Name = application.CompanyName ?? "未命名企業",
                    UnifiedSocialCreditCode = application.UnifiedSocialCreditCode,
                    ContactPerson = application.ContactPerson,
                    MemberRole = application.MemberRole,
                    Type = application.MemberRole switch
                    {
                        MemberRole.Supplier => CompanyType.Supplier,
                        MemberRole.Buyer => CompanyType.Buyer,
                        _ => CompanyType.Supplier
                    },
                    IsVerified = !application.IsManualInput,
                    VerifiedAt = application.IsManualInput ? null : DateTime.UtcNow,
                    Status = Domain.Enums.Status.Active,
                    CreatedTime = DateTime.UtcNow
                };

                await _unitOfWork.Companies.AddAsync(company, cancellationToken);
            }
            else
            {
                var needUpdate = false;

                // 更新 Company 的負責人和會員類別（如果尚未設置）
                if (company.ContactPerson == null || company.MemberRole == null)
                {
                    company.ContactPerson = application.ContactPerson;
                    company.MemberRole = application.MemberRole;
                    needUpdate = true;
                }

                // 根據新申請的 MemberRole 更新公司類型
                // 如果公司現有類型與新申請角色不同，升級為 Both
                if (company.Type != CompanyType.Both)
                {
                    var newType = application.MemberRole switch
                    {
                        MemberRole.Supplier => CompanyType.Supplier,
                        MemberRole.Buyer => CompanyType.Buyer,
                        _ => company.Type
                    };

                    if (company.Type != newType && company.Type != CompanyType.Both)
                    {
                        company.Type = CompanyType.Both;
                        needUpdate = true;
                    }
                    else if (company.Type == 0) // 舊資料未設定
                    {
                        company.Type = newType;
                        needUpdate = true;
                    }
                }

                if (needUpdate)
                {
                    await _unitOfWork.Companies.UpdateAsync(company, cancellationToken);
                }
            }

            application.CompanyId = company.Id;

            // 2. 獲取所有申請成員
            var applicationMembers = await _unitOfWork.ApplicationMembers
                .GetByApplicationIdAsync(application.Id, cancellationToken);

            if (!applicationMembers.Any())
            {
                return Result<bool>.Failure("申請中沒有會員信息");
            }

            _logger.LogInformation("Creating {MemberCount} members for application {ApplicationNumber}",
                applicationMembers.Count, application.ApplicationNumber);

            // 3. 為每個成員創建 Member 帳號
            foreach (var appMember in applicationMembers)
            {
                // 計算權限
                var permissions = CalculatePermissions(
                    application.MemberRole,
                    appMember.MemberPosition
                );

                var member = new Member
                {
                    Id = Guid.NewGuid(),
                    Number = await GenerateMemberNumberAsync(cancellationToken),
                    Email = appMember.Email,
                    Phone = appMember.Phone,
                    Extension = appMember.Extension,
                    MobilePhone = appMember.MobilePhone,
                    Password = appMember.PasswordHash, // 已哈希
                    Nickname = appMember.ContactName,
                    Position = appMember.Position,
                    CompanyId = company.Id,
                    Role = application.MemberRole,
                    MemberPosition = appMember.MemberPosition,
                    Permissions = permissions,
                    ApplicationId = application.Id,
                    IsApproved = true,
                    Status = Domain.Enums.Status.Active,
                    FirstChanged = false,
                    PasswordChanged = false,
                    LoginFailure = 0,
                    CreatedTime = DateTime.UtcNow
                };

                await _unitOfWork.Members.AddAsync(member, cancellationToken);

                // 更新 ApplicationMember 的 CreatedMemberId
                appMember.CreatedMemberId = member.Id;
                await _unitOfWork.ApplicationMembers.UpdateAsync(appMember, cancellationToken);

                _logger.LogInformation("Created member {MemberNumber} for {Email}", member.Number, appMember.Email);
            }

            _logger.LogInformation("Created {MemberCount} members and company {CompanyNumber} for application {ApplicationNumber}",
                applicationMembers.Count, company.Number, application.ApplicationNumber);

            return Result<bool>.Success(true);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating members and company for application {ApplicationId}", application.Id);
            return Result<bool>.Failure($"創建會員失敗: {ex.Message}");
        }
    }

    private static MemberPermission CalculatePermissions(
        MemberRole role,
        MemberPosition position)
    {
        return (role, position) switch
        {
            (MemberRole.Supplier, MemberPosition.Manager) => MemberPermission.SupplierManager,
            (MemberRole.Supplier, MemberPosition.Employee) => MemberPermission.SupplierEmployee,
            (MemberRole.Buyer, MemberPosition.Manager) => MemberPermission.BuyerManager,
            (MemberRole.Buyer, MemberPosition.Employee) => MemberPermission.BuyerEmployee,
            _ => MemberPermission.None
        };
    }

    private async Task<string> GenerateMemberNumberAsync(CancellationToken cancellationToken)
    {
        // 確保唯一性
        await Task.Delay(10, cancellationToken);
        return $"M{DateTime.UtcNow:yyyyMMddHHmmssfff}{Guid.NewGuid().ToString("N")[..4]}";
    }

    private static string GenerateMemberNumber()
    {
        return $"M{DateTime.UtcNow:yyyyMMddHHmmssfff}";
    }

    private static string GenerateCompanyNumber()
    {
        return $"C{DateTime.UtcNow:yyyyMMddHHmmssfff}";
    }

    private static ApplicationListItemResponse MapToListItemResponse(MemberApplication application)
    {
        var firstMember = application.ApplicationMembers
            .OrderBy(m => m.OrderIndex)
            .FirstOrDefault();

        return new ApplicationListItemResponse
        {
            Id = application.Id,
            ApplicationNumber = application.ApplicationNumber,
            MemberRole = application.MemberRole,
            Status = application.Status,
            Email = firstMember?.Email ?? application.Email,
            ContactName = firstMember?.ContactName ?? application.ContactName,
            Phone = firstMember?.Phone ?? application.Phone,
            Extension = firstMember?.Extension ?? application.Extension,
            MobilePhone = firstMember?.MobilePhone ?? application.MobilePhone,
            UnifiedSocialCreditCode = application.UnifiedSocialCreditCode,
            CompanyName = application.CompanyName,
            ReviewerId = application.ReviewerId,
            ReviewerName = application.Reviewer != null
                ? (application.Reviewer.Name ?? application.Reviewer.Email)
                : null,
            ReviewStartedAt = application.ReviewStartedAt,
            ReviewedAt = application.ReviewedAt,
            SubmittedAt = application.SubmittedAt,
            CreatedTime = application.CreatedTime
        };
    }

    private async Task<ApplicationResponse> MapToDetailResponseAsync(
        MemberApplication application,
        CancellationToken cancellationToken)
    {
        var members = await _unitOfWork.ApplicationMembers
            .GetByApplicationIdAsync(application.Id, cancellationToken);

        var firstMember = members.FirstOrDefault();

        var response = new ApplicationResponse
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
            ReviewerName = application.Reviewer != null
                ? (application.Reviewer.Name ?? application.Reviewer.Email)
                : null,
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

        if (application.Documents != null)
        {
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
        }

        if (application.Logs != null)
        {
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
        }

        return response;
    }
}
