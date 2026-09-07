using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using SPS.Application.Common;
using SPS.Application.DTOs.Company;
using SPS.Application.DTOs.Common;
using SPS.Application.DTOs.Picture;
using SPS.Application.Interfaces;
using SPS.Application.Interfaces.IServices;
using SPS.Domain.Entities;
using SPS.Domain.Enums;

namespace SPS.Application.Services;

/// <summary>
/// 企業服務實現
/// </summary>
public class CompanyService : ICompanyService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<CompanyService> _logger;

    public CompanyService(
        IUnitOfWork unitOfWork,
        ILogger<CompanyService> logger)
    {
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    public async Task<Result<PagedResult<CompanyListItemResponse>>> GetPagedAsync(
        CompanyQueryParameters parameters,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Getting paged companies with parameters: {@Parameters}", parameters);

        var pagedResult = await _unitOfWork.Companies.GetPagedAsync(parameters, cancellationToken);

        var companyIds = pagedResult.Items.Select(c => c.Id).ToList();
        var tagIdsMap = await GetTagCategoryIdsMapAsync(companyIds, cancellationToken);

        var allTagIds = tagIdsMap.Values.SelectMany(ids => ids).Distinct().ToList();
        var tagNamesMap = await GetCategoryNamesAsync(allTagIds, cancellationToken);

        var response = new PagedResult<CompanyListItemResponse>
        {
            Items = pagedResult.Items.Select(c =>
            {
                var tagIds = tagIdsMap.GetValueOrDefault(c.Id) ?? new List<int>();
                var tagNames = tagIds
                    .Where(tagNamesMap.ContainsKey)
                    .Select(id => tagNamesMap[id])
                    .ToList();
                return MapToListItem(c, tagIds, tagNames);
            }).ToList(),
            TotalCount = pagedResult.TotalCount,
            Page = pagedResult.Page,
            PageSize = pagedResult.PageSize
        };

        return Result<PagedResult<CompanyListItemResponse>>.Success(response);
    }

    public async Task<Result<CompanyResponse>> GetByIdAsync(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Getting company by ID: {CompanyId}", id);

        var company = await _unitOfWork.Companies.GetByIdAsync(id, cancellationToken);

        if (company == null)
        {
            _logger.LogWarning("Company not found: {CompanyId}", id);
            return Result<CompanyResponse>.Failure("企業不存在");
        }

        return Result<CompanyResponse>.Success(MapToResponse(company));
    }

    public async Task<Result<CompanyResponse>> CreateAsync(
        CreateCompanyRequest request,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Creating company: {CompanyName}", request.Name);

        // 檢查統一編號是否已存在
        var exists = await _unitOfWork.Companies.ExistsByUnifiedSocialCreditCodeAsync(
            request.UnifiedSocialCreditCode,
            cancellationToken);

        if (exists)
        {
            _logger.LogWarning("Company already exists with code: {Code}", request.UnifiedSocialCreditCode);
            return Result<CompanyResponse>.Failure("該統一編號已被使用");
        }

        var company = new Company
        {
            Id = Guid.NewGuid(),
            Number = GenerateCompanyNumber(),
            Name = request.Name,
            EnglishName = request.EnglishName,
            UnifiedSocialCreditCode = request.UnifiedSocialCreditCode,
            Phone = request.Phone,
            Fax = request.Fax,
            Type = request.Type,
            Level = request.Level,
            Revenue = request.Revenue,
            Employees = request.Employees,
            Subject = request.Subject,
            Introduction = request.Introduction,
            IntroductionEnglish = request.IntroductionEnglish,
            OrgUrl = request.OrgUrl,
            VideoUrl = request.VideoUrl,
            Charge = request.Charge,
            ChargeEmail = request.ChargeEmail,
            ChargePhone = request.ChargePhone,
            ChargeMobile = request.ChargeMobile,
            ChargeJobTitle = request.ChargeJobTitle,
            EstablishmentDate = request.EstablishmentDate,
            Remark = request.Remark,
            Status = Status.Active,
            DataMode = DataMode.Normal,
            IsVerified = false,
            Ordinal = 0,
            CreatedTime = DateTime.UtcNow,
            UpdatedTime = DateTime.UtcNow,
            PhotoId = request.PhotoId,
            BannerId = request.BannerId
        };

        if (request.Address != null)
        {
            company.Address = new Address
            {
                Type = request.Address.Type,
                PostalCode = request.Address.PostalCode,
                Region = request.Address.Region,
                City = request.Address.City,
                District = request.Address.District,
                Line = request.Address.Line,
                Description = request.Address.Description
            };
        }

        await _unitOfWork.Companies.AddAsync(company, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        // Reload to get navigation properties
        var createdCompany = await _unitOfWork.Companies.GetByIdAsync(company.Id, cancellationToken);
        _logger.LogInformation("Company created successfully: {CompanyId}", company.Id);

        return Result<CompanyResponse>.Success(MapToResponse(createdCompany!));
    }

    public async Task<Result<CompanyResponse>> UpdateAsync(
        Guid id,
        UpdateCompanyRequest request,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Updating company: {CompanyId}", id);

        var company = await _unitOfWork.Companies.GetByIdAsync(id, cancellationToken);

        if (company == null)
        {
            _logger.LogWarning("Company not found: {CompanyId}", id);
            return Result<CompanyResponse>.Failure("企業不存在");
        }

        // 更新字段（僅更新非空值）
        if (!string.IsNullOrWhiteSpace(request.Name))
            company.Name = request.Name;

        if (request.EnglishName != null)
            company.EnglishName = request.EnglishName;

        if (request.Phone != null)
            company.Phone = request.Phone;

        if (request.Fax != null)
            company.Fax = request.Fax;

        if (request.Type.HasValue)
            company.Type = request.Type.Value;

        if (request.Level.HasValue)
            company.Level = request.Level.Value;

        if (request.Revenue.HasValue)
            company.Revenue = request.Revenue;

        if (request.Employees.HasValue)
            company.Employees = request.Employees;

        if (request.Subject != null)
            company.Subject = request.Subject;

        if (request.Introduction != null)
            company.Introduction = request.Introduction;

        if (request.IntroductionEnglish != null)
            company.IntroductionEnglish = request.IntroductionEnglish;

        if (request.OrgUrl != null)
            company.OrgUrl = request.OrgUrl;

        if (request.VideoUrl != null)
            company.VideoUrl = request.VideoUrl;

        if (request.Charge != null)
            company.Charge = request.Charge;

        if (request.ChargeEmail != null)
            company.ChargeEmail = request.ChargeEmail;

        if (request.ChargePhone != null)
            company.ChargePhone = request.ChargePhone;

        if (request.ChargeMobile != null)
            company.ChargeMobile = request.ChargeMobile;

        if (request.ChargeJobTitle != null)
            company.ChargeJobTitle = request.ChargeJobTitle;

        if (request.EstablishmentDate != null)
            company.EstablishmentDate = request.EstablishmentDate;

        if (request.Remark != null)
            company.Remark = request.Remark;

        if (request.Status.HasValue)
            company.Status = request.Status.Value;

        if (request.RemovePhoto)
        {
            company.PhotoId = null;
        }
        else if (request.PhotoId.HasValue)
        {
            var photo = await _unitOfWork.Pictures.GetByIdAsync(request.PhotoId.Value, cancellationToken);
            if (photo == null)
                return Result<CompanyResponse>.Failure("照片不存在");
            company.PhotoId = request.PhotoId.Value;
        }

        if (request.RemoveBanner)
        {
            company.BannerId = null;
        }
        else if (request.BannerId.HasValue)
        {
            var banner = await _unitOfWork.Pictures.GetByIdAsync(request.BannerId.Value, cancellationToken);
            if (banner == null)
                return Result<CompanyResponse>.Failure("Banner 圖片不存在");
            company.BannerId = request.BannerId.Value;
        }

        if (request.Address != null)
        {
            if (company.Address == null)
            {
                company.Address = new Address();
            }
            
            company.Address.Type = request.Address.Type;
            company.Address.PostalCode = request.Address.PostalCode;
            company.Address.Region = request.Address.Region;
            company.Address.City = request.Address.City;
            company.Address.District = request.Address.District;
            company.Address.Line = request.Address.Line;
            company.Address.Description = request.Address.Description;
        }

        company.UpdatedTime = DateTime.UtcNow;

        await _unitOfWork.Companies.UpdateAsync(company, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        // Reload to get navigation properties
        var updatedCompany = await _unitOfWork.Companies.GetByIdAsync(company.Id, cancellationToken);
        _logger.LogInformation("Company updated successfully: {CompanyId}", id);

        return Result<CompanyResponse>.Success(MapToResponse(updatedCompany!));
    }

    public async Task<Result<bool>> DeleteAsync(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Deleting company: {CompanyId}", id);

        var company = await _unitOfWork.Companies.GetByIdAsync(id, cancellationToken);

        if (company == null)
        {
            _logger.LogWarning("Company not found: {CompanyId}", id);
            return Result<bool>.Failure("企業不存在");
        }

        await _unitOfWork.Companies.DeleteAsync(company, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Company deleted successfully: {CompanyId}", id);

        return Result<bool>.Success(true);
    }

    public async Task<Result<CompanyTagsResponse>> GetTagsAsync(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var company = await _unitOfWork.Companies.GetByIdAsync(id, cancellationToken);
        if (company == null)
        {
            _logger.LogWarning("Company not found: {CompanyId}", id);
            return Result<CompanyTagsResponse>.Failure("企業不存在");
        }

        var tagIdsMap = await GetTagCategoryIdsMapAsync(new[] { id }, cancellationToken);
        var tagIds = tagIdsMap.GetValueOrDefault(id) ?? new List<int>();

        return Result<CompanyTagsResponse>.Success(await BuildTagsResponseAsync(id, tagIds, cancellationToken));
    }

    public async Task<Result<CompanyTagsResponse>> SetTagsAsync(
        Guid id,
        SetCompanyTagsRequest request,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Setting tags for company: {CompanyId}", id);

        var company = await _unitOfWork.Companies.GetByIdAsync(id, cancellationToken);
        if (company == null)
        {
            _logger.LogWarning("Company not found: {CompanyId}", id);
            return Result<CompanyTagsResponse>.Failure("企業不存在");
        }

        var requestedIds = (request.TagIds ?? new List<int>()).Distinct().ToList();

        if (requestedIds.Count > 0)
        {
            var validIds = await GetExistingCompanyTagCategoryIdsAsync(requestedIds, cancellationToken);
            var invalidIds = requestedIds.Except(validIds).ToList();
            if (invalidIds.Count > 0)
                return Result<CompanyTagsResponse>.Failure(
                    $"以下標籤不存在或非企業標籤：{string.Join(", ", invalidIds)}");
        }

        await ReplaceCompanyTagCategoriesAsync(id, requestedIds, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Tags set for company {CompanyId}: {TagIds}", id, requestedIds);

        return Result<CompanyTagsResponse>.Success(
            await BuildTagsResponseAsync(id, requestedIds, cancellationToken));
    }

    private async Task<CompanyTagsResponse> BuildTagsResponseAsync(
        Guid companyId,
        List<int> tagIds,
        CancellationToken cancellationToken)
    {
        var tagNamesMap = await GetCategoryNamesAsync(tagIds, cancellationToken);

        return new CompanyTagsResponse
        {
            CompanyId = companyId,
            TagIds = tagIds,
            TagNames = tagIds.Where(tagNamesMap.ContainsKey).Select(i => tagNamesMap[i]).ToList()
        };
    }

    // ===== 企業標籤分類綁定（CompanyTagCategory）=====

    /// <summary>
    /// 取得多間企業已綁定的企業標籤分類 ID
    /// </summary>
    private async Task<Dictionary<Guid, List<int>>> GetTagCategoryIdsMapAsync(
        IReadOnlyCollection<Guid> companyIds,
        CancellationToken cancellationToken)
    {
        if (companyIds.Count == 0)
            return new Dictionary<Guid, List<int>>();

        var db = _unitOfWork.GetDbContext();
        var rows = await db.Set<CompanyTagCategory>()
            .Where(ctc => companyIds.Contains(ctc.CompanyId))
            .Select(ctc => new { ctc.CompanyId, ctc.CategoryId })
            .ToListAsync(cancellationToken);

        return rows
            .GroupBy(r => r.CompanyId)
            .ToDictionary(g => g.Key, g => g.Select(r => r.CategoryId).ToList());
    }

    /// <summary>
    /// 取得企業標籤分類的名稱對照
    /// </summary>
    private async Task<Dictionary<int, string>> GetCategoryNamesAsync(
        IReadOnlyCollection<int> categoryIds,
        CancellationToken cancellationToken)
    {
        if (categoryIds.Count == 0)
            return new Dictionary<int, string>();

        var db = _unitOfWork.GetDbContext();
        return await db.Set<Category>()
            .Where(c => categoryIds.Contains(c.Id) && c.Name != null)
            .ToDictionaryAsync(c => c.Id, c => c.Name!, cancellationToken);
    }

    /// <summary>
    /// 從傳入的 ID 中篩出實際存在且為「企業標籤分類」的 ID
    /// </summary>
    private async Task<List<int>> GetExistingCompanyTagCategoryIdsAsync(
        IReadOnlyCollection<int> categoryIds,
        CancellationToken cancellationToken)
    {
        if (categoryIds.Count == 0)
            return new List<int>();

        var db = _unitOfWork.GetDbContext();
        return await db.Set<Category>()
            .Where(c => c.Type == CategoryType.CompanyTag && categoryIds.Contains(c.Id))
            .Select(c => c.Id)
            .ToListAsync(cancellationToken);
    }

    /// <summary>
    /// 以傳入集合覆寫企業的標籤分類綁定
    /// </summary>
    private async Task ReplaceCompanyTagCategoriesAsync(
        Guid companyId,
        IEnumerable<int> categoryIds,
        CancellationToken cancellationToken)
    {
        var db = _unitOfWork.GetDbContext();
        var set = db.Set<CompanyTagCategory>();

        var existing = await set
            .Where(ctc => ctc.CompanyId == companyId)
            .ToListAsync(cancellationToken);

        var desired = categoryIds.Distinct().ToHashSet();
        var existingIds = existing.Select(e => e.CategoryId).ToHashSet();

        var toRemove = existing.Where(e => !desired.Contains(e.CategoryId)).ToList();
        if (toRemove.Count > 0)
            set.RemoveRange(toRemove);

        foreach (var categoryId in desired.Where(cid => !existingIds.Contains(cid)))
        {
            set.Add(new CompanyTagCategory
            {
                CompanyId = companyId,
                CategoryId = categoryId
            });
        }
    }

    public async Task<Result<CompanyResponse>> GetByUnifiedSocialCreditCodeAsync(
        string unifiedSocialCreditCode,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Getting company by code: {Code}", unifiedSocialCreditCode);

        var company = await _unitOfWork.Companies.GetByUnifiedSocialCreditCodeAsync(
            unifiedSocialCreditCode,
            cancellationToken);

        if (company == null)
        {
            _logger.LogWarning("Company not found with code: {Code}", unifiedSocialCreditCode);
            return Result<CompanyResponse>.Failure("企業不存在");
        }

        return Result<CompanyResponse>.Success(MapToResponse(company));
    }

    private static CompanyResponse MapToResponse(Company company)
    {
        return new CompanyResponse
        {
            Id = company.Id,
            Number = company.Number,
            Name = company.Name,
            EnglishName = company.EnglishName,
            UnifiedSocialCreditCode = company.UnifiedSocialCreditCode,
            Phone = company.Phone,
            Fax = company.Fax,
            Type = company.Type,
            Level = company.Level,
            Revenue = company.Revenue,
            Employees = company.Employees,
            Subject = company.Subject,
            Introduction = company.Introduction,
            IntroductionEnglish = company.IntroductionEnglish,
            OrgUrl = company.OrgUrl,
            VideoUrl = company.VideoUrl,
            Charge = company.Charge,
            ChargeEmail = company.ChargeEmail,
            ChargePhone = company.ChargePhone,
            ChargeMobile = company.ChargeMobile,
            ChargeJobTitle = company.ChargeJobTitle,
            EstablishmentDate = company.EstablishmentDate,
            Remark = company.Remark,
            Status = company.Status,
            IsVerified = company.IsVerified,
            VerifiedAt = company.VerifiedAt,
            
            Address = company.Address != null ? MapToAddressDto(company.Address) : null,
            Photo = company.Photo != null ? MapToPictureResponse(company.Photo) : null,
            Banner = company.Banner != null ? MapToPictureResponse(company.Banner) : null,

            DesignatedContacts = company.Members?
                .Where(m => m.IsDesignatedContact)
                .Select(m => new DesignatedContactResponse
                {
                    Id = m.Id,
                    Name = m.Nickname ?? m.Email,
                    Email = m.Email,
                    Phone = !string.IsNullOrEmpty(m.Phone)
                        ? (!string.IsNullOrEmpty(m.Extension) ? $"{m.Phone}#{m.Extension}" : m.Phone)
                        : null,
                    MobilePhone = m.MobilePhone,
                    MemberJobTitle = m.MemberJobTitle
                }).ToList(),

            CreatedTime = company.CreatedTime,
            UpdatedTime = company.UpdatedTime
        };
    }

    private static AddressDto MapToAddressDto(Address address)
    {
        return new AddressDto
        {
            Id = address.Id,
            Type = address.Type,
            PostalCode = address.PostalCode,
            Region = address.Region,
            City = address.City,
            District = address.District,
            Line = address.Line,
            Description = address.Description
        };
    }

    private static PictureResponse MapToPictureResponse(Picture picture)
    {
        return new PictureResponse
        {
            Id = picture.Id,
            Name = picture.Name,
            Culture = picture.Culture,
            Type = picture.Type,
            ContentType = picture.ContentType,
            Uri = picture.Uri,
            ThumbnailUri = picture.ThumbnailUri,
            LinkUrl = picture.LinkUrl,
            Published = picture.Published,
            StartDate = picture.StartDate,
            EndDate = picture.EndDate,
            Ordinal = picture.Ordinal,
            Height = picture.Height,
            Width = picture.Width,
            Dpi = picture.Dpi,
            Remark = picture.Remark,
            AlbumId = picture.AlbumId,
            AlbumTitle = picture.Album?.Title,
            MultilingualImageId = picture.MultilingualImageId,
            CreatedTime = picture.CreatedTime,
            UpdatedTime = picture.UpdatedTime
        };
    }

    private static CompanyListItemResponse MapToListItem(Company company, List<int> tagIds, List<string> tagNames)
    {
        return new CompanyListItemResponse
        {
            Id = company.Id,
            Number = company.Number,
            Name = company.Name,
            EnglishName = company.EnglishName,
            Type = company.Type,
            Level = company.Level,
            Subject = company.Subject,
            Introduction = company.Introduction,
            Employees = company.Employees,
            Status = company.Status,
            IsVerified = company.IsVerified,
            Photo = company.Photo?.Uri,
            TagIds = tagIds,
            TagNames = tagNames,
            CreatedTime = company.CreatedTime
        };
    }

    public async Task<Result<CompanyStatisticsDto>> GetStatisticsAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            var query = _unitOfWork.Companies.GetQueryable();
            // 以台灣時間 (UTC+8) 計算「今日」和「本月」起始點，結果需標記為 Utc 以符合 Npgsql 要求
            var taiwanOffset = TimeSpan.FromHours(8);
            var nowTaiwan = DateTime.UtcNow + taiwanOffset;
            var todayStart = DateTime.SpecifyKind(nowTaiwan.Date - taiwanOffset, DateTimeKind.Utc);
            var monthStart = DateTime.SpecifyKind(new DateTime(nowTaiwan.Year, nowTaiwan.Month, 1) - taiwanOffset, DateTimeKind.Utc);

            var totalCompanies = await query.CountAsync(cancellationToken);
            var supplierCount = await query.CountAsync(c => c.Type == CompanyType.Supplier, cancellationToken);
            var buyerCount = await query.CountAsync(c => c.Type == CompanyType.Buyer, cancellationToken);
            var bothCount = await query.CountAsync(c => c.Type == CompanyType.Both, cancellationToken);
            var verifiedCount = await query.CountAsync(c => c.IsVerified, cancellationToken);
            var activeCount = await query.CountAsync(c => c.Status == Status.Active, cancellationToken);
            var companiesThisMonth = await query.CountAsync(c => c.CreatedTime >= monthStart, cancellationToken);
            var companiesToday = await query.CountAsync(c => c.CreatedTime >= todayStart, cancellationToken);

            var byLevel = new CompanyLevelBreakdown
            {
                Basic = await query.CountAsync(c => c.Level == CompanyLevel.Basic, cancellationToken),
                Standard = await query.CountAsync(c => c.Level == CompanyLevel.Standard, cancellationToken),
                Premium = await query.CountAsync(c => c.Level == CompanyLevel.Premium, cancellationToken),
                VIP = await query.CountAsync(c => c.Level == CompanyLevel.VIP, cancellationToken)
            };

            var statistics = new CompanyStatisticsDto
            {
                TotalCompanies = totalCompanies,
                SupplierCount = supplierCount,
                BuyerCount = buyerCount,
                BothCount = bothCount,
                VerifiedCount = verifiedCount,
                ActiveCount = activeCount,
                InactiveCount = totalCompanies - activeCount,
                ByLevel = byLevel,
                CompaniesThisMonth = companiesThisMonth,
                CompaniesToday = companiesToday
            };

            return Result<CompanyStatisticsDto>.Success(statistics);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting company statistics");
            return Result<CompanyStatisticsDto>.Failure($"獲取公司統計失敗: {ex.Message}");
        }
    }

    public async Task<Result<bool>> DeleteAllCompanyDataAsync(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Deleting all data for company: {CompanyId}", id);

        var company = await _unitOfWork.Companies.GetByIdAsync(id, cancellationToken);
        if (company == null)
        {
            return Result<bool>.Failure("企業不存在");
        }

        await using var transaction = await _unitOfWork.BeginTransactionAsync(cancellationToken);
        try
        {
            var db = _unitOfWork.GetDbContext();

            // 先取得該公司所有會員 ID，用於清理聊天相關資料
            var memberIds = await db.Set<Member>()
                .Where(m => m.CompanyId == id)
                .Select(m => m.Id)
                .ToListAsync(cancellationToken);

            // 刪除聊天記錄（包含透過公司 ID 或會員 ID 關聯的記錄）
            var chatRecordIds = await db.Set<ChatRecord>()
                .Where(c => c.InitiatorCompanyId == id || c.TargetCompanyId == id
                    || (c.InitiatorMemberId.HasValue && memberIds.Contains(c.InitiatorMemberId.Value))
                    || (c.TargetMemberId.HasValue && memberIds.Contains(c.TargetMemberId.Value)))
                .Select(c => c.Id)
                .ToListAsync(cancellationToken);

            if (chatRecordIds.Count > 0)
            {
                // 刪除訊息附件檔案
                var messageIds = await db.Set<Messages>()
                    .Where(m => m.ChatRecordId.HasValue && chatRecordIds.Contains(m.ChatRecordId.Value))
                    .Select(m => m.Id)
                    .ToListAsync(cancellationToken);

                if (messageIds.Count > 0)
                {
                    var messageFiles = db.Set<Domain.Entities.File>()
                        .Where(f => f.MessagesId.HasValue && messageIds.Contains(f.MessagesId.Value));
                    db.Set<Domain.Entities.File>().RemoveRange(messageFiles);
                }

                // 刪除訊息
                var messages = db.Set<Messages>()
                    .Where(m => m.ChatRecordId.HasValue && chatRecordIds.Contains(m.ChatRecordId.Value));
                db.Set<Messages>().RemoveRange(messages);

                // 刪除聊天記錄
                var chats = db.Set<ChatRecord>()
                    .Where(c => chatRecordIds.Contains(c.Id));
                db.Set<ChatRecord>().RemoveRange(chats);
            }

            // 刪除該公司會員發起但不在上述聊天記錄中的孤立訊息
            if (memberIds.Count > 0)
            {
                var orphanMessageIds = await db.Set<Messages>()
                    .Where(m => m.InitiatorMemberId.HasValue && memberIds.Contains(m.InitiatorMemberId.Value))
                    .Select(m => m.Id)
                    .ToListAsync(cancellationToken);

                if (orphanMessageIds.Count > 0)
                {
                    var orphanMessageFiles = db.Set<Domain.Entities.File>()
                        .Where(f => f.MessagesId.HasValue && orphanMessageIds.Contains(f.MessagesId.Value));
                    db.Set<Domain.Entities.File>().RemoveRange(orphanMessageFiles);

                    var orphanMessages = db.Set<Messages>()
                        .Where(m => m.InitiatorMemberId.HasValue && memberIds.Contains(m.InitiatorMemberId.Value));
                    db.Set<Messages>().RemoveRange(orphanMessages);
                }
            }

            // 刪除評分紀錄
            var scorings = db.Set<Scoring>().Where(s => s.CompanyId == id);
            db.Set<Scoring>().RemoveRange(scorings);

            // 刪除會員收藏
            var favorites = db.Set<MemberFavorite>().Where(f => f.CompanyId == id);
            db.Set<MemberFavorite>().RemoveRange(favorites);

            // 刪除需求前，先刪除 MemberDemand 關聯
            var demandIds = await db.Set<Demand>()
                .Where(d => d.CompanyId == id)
                .Select(d => d.Id)
                .ToListAsync(cancellationToken);

            if (demandIds.Count > 0)
            {
                var memberDemands = db.Set<MemberDemand>()
                    .Where(md => demandIds.Contains(md.DemandId));
                db.Set<MemberDemand>().RemoveRange(memberDemands);

                // 刪除需求相關的檔案
                var demandFiles = db.Set<Domain.Entities.File>()
                    .Where(f => f.DemandId.HasValue && demandIds.Contains(f.DemandId.Value));
                db.Set<Domain.Entities.File>().RemoveRange(demandFiles);
            }

            // 刪除需求
            var demands = db.Set<Demand>().Where(d => d.CompanyId == id);
            db.Set<Demand>().RemoveRange(demands);

            // 刪除產品相關資料
            var productIds = await db.Set<Product>()
                .Where(p => p.CompanyId == id)
                .Select(p => p.Id)
                .ToListAsync(cancellationToken);

            if (productIds.Count > 0)
            {
                // 刪除產品關聯的 UploadedFile
                var productUploadedFiles = db.Set<UploadedFile>()
                    .Where(uf => uf.ProductId.HasValue && productIds.Contains(uf.ProductId.Value));
                db.Set<UploadedFile>().RemoveRange(productUploadedFiles);

                // 刪除產品關聯的檔案（File.ProductId）
                var productFiles = db.Set<Domain.Entities.File>()
                    .Where(f => f.ProductId.HasValue && productIds.Contains(f.ProductId.Value));
                db.Set<Domain.Entities.File>().RemoveRange(productFiles);

                // 清除 Product.CoverId 以避免與 Picture 的循環 FK 衝突
                var productsWithCover = await db.Set<Product>()
                    .Where(p => p.CompanyId == id && p.CoverId.HasValue)
                    .ToListAsync(cancellationToken);
                foreach (var p in productsWithCover)
                    p.CoverId = null;

                // 清除 Album.CoverId 以避免與 Picture 的 FK 衝突
                var productPictureIds = await db.Set<Picture>()
                    .Where(p => p.ProductId.HasValue && productIds.Contains(p.ProductId.Value))
                    .Select(p => p.Id)
                    .ToListAsync(cancellationToken);
                if (productPictureIds.Count > 0)
                {
                    var albumsWithCover = await db.Set<Album>()
                        .Where(a => a.CoverId.HasValue && productPictureIds.Contains(a.CoverId.Value))
                        .ToListAsync(cancellationToken);
                    foreach (var a in albumsWithCover)
                        a.CoverId = null;
                }

                // 刪除產品相關的圖片
                var productPictures = db.Set<Picture>()
                    .Where(p => p.ProductId.HasValue && productIds.Contains(p.ProductId.Value));
                db.Set<Picture>().RemoveRange(productPictures);
            }

            // 刪除產品
            var products = db.Set<Product>().Where(p => p.CompanyId == id);
            db.Set<Product>().RemoveRange(products);

            // 刪除檔案與文件
            var files = db.Set<Domain.Entities.File>().Where(f => f.CompanyId == id);
            db.Set<Domain.Entities.File>().RemoveRange(files);
            var documents = db.Set<Document>().Where(d => d.CompanyId == id);
            db.Set<Document>().RemoveRange(documents);

            // 刪除申請相關資料
            var applicationIds = await db.Set<MemberApplication>()
                .Where(a => a.CompanyId == id)
                .Select(a => a.Id)
                .ToListAsync(cancellationToken);

            if (applicationIds.Count > 0)
            {
                var appDocs = db.Set<ApplicationDocument>().Where(d => applicationIds.Contains(d.ApplicationId));
                db.Set<ApplicationDocument>().RemoveRange(appDocs);
                var appLogs = db.Set<ApplicationLog>().Where(l => applicationIds.Contains(l.ApplicationId));
                db.Set<ApplicationLog>().RemoveRange(appLogs);
                var appMembers = db.Set<ApplicationMember>().Where(m => applicationIds.Contains(m.ApplicationId));
                db.Set<ApplicationMember>().RemoveRange(appMembers);
            }

            var applications = db.Set<MemberApplication>().Where(a => a.CompanyId == id);
            db.Set<MemberApplication>().RemoveRange(applications);

            // 刪除會員關聯的 UploadedFile（UploaderId 為 shadow property）
            if (memberIds.Count > 0)
            {
                var memberUploadedFiles = db.Set<UploadedFile>()
                    .Where(uf => EF.Property<Guid?>(uf, "UploaderId") != null
                        && memberIds.Contains(EF.Property<Guid>(uf, "UploaderId")));
                db.Set<UploadedFile>().RemoveRange(memberUploadedFiles);
            }

            // 刪除會員
            var members = db.Set<Member>().Where(m => m.CompanyId == id);
            db.Set<Member>().RemoveRange(members);

            // 記錄要刪除的圖片 ID
            var photoId = company.PhotoId;
            var bannerId = company.BannerId;

            // 刪除地址
            if (company.AddressId.HasValue)
            {
                var address = await db.Set<Address>().FindAsync(new object[] { company.AddressId.Value }, cancellationToken);
                if (address != null)
                    db.Set<Address>().Remove(address);
            }

            // 刪除公司本體
            db.Set<Company>().Remove(company);

            // 清除 Album.CoverId 以避免與公司圖片的 FK 衝突
            var companyPictureIds = new List<int>();
            if (photoId.HasValue) companyPictureIds.Add(photoId.Value);
            if (bannerId.HasValue) companyPictureIds.Add(bannerId.Value);
            if (companyPictureIds.Count > 0)
            {
                var albumsWithCompanyCover = await db.Set<Album>()
                    .Where(a => a.CoverId.HasValue && companyPictureIds.Contains(a.CoverId.Value))
                    .ToListAsync(cancellationToken);
                foreach (var a in albumsWithCompanyCover)
                    a.CoverId = null;
            }

            // 刪除公司的圖片
            if (photoId.HasValue)
            {
                var photo = await db.Set<Picture>().FindAsync(new object[] { photoId.Value }, cancellationToken);
                if (photo != null)
                    db.Set<Picture>().Remove(photo);
            }

            if (bannerId.HasValue)
            {
                var banner = await db.Set<Picture>().FindAsync(new object[] { bannerId.Value }, cancellationToken);
                if (banner != null)
                    db.Set<Picture>().Remove(banner);
            }

            await db.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);

            _logger.LogInformation("All data for company {CompanyId} deleted successfully", id);
            return Result<bool>.Success(true);
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync(cancellationToken);
            _logger.LogError(ex, "Failed to delete all data for company {CompanyId}", id);
            return Result<bool>.Failure($"刪除公司資料失敗: {ex.Message}");
        }
    }

    public async Task<Result<DTOs.Member.BatchOperationResult>> BatchUpdateStatusAsync(
        DTOs.Company.BatchUpdateCompanyStatusRequest request,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Batch updating status for {Count} companies to {Status}", request.CompanyIds.Count, request.Status);

        var companies = await _unitOfWork.Companies.GetQueryable()
            .Where(c => request.CompanyIds.Contains(c.Id))
            .ToListAsync(cancellationToken);

        var result = new DTOs.Member.BatchOperationResult();

        foreach (var company in companies)
        {
            company.Status = request.Status;
            company.UpdatedTime = DateTime.UtcNow;
            await _unitOfWork.Companies.UpdateAsync(company, cancellationToken);
            result.Success++;
        }

        result.Failed = request.CompanyIds.Count - result.Success;
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Batch updated status for {Success} companies, {Failed} failed", result.Success, result.Failed);
        return Result<DTOs.Member.BatchOperationResult>.Success(result);
    }

    public async Task<Result<DTOs.Member.BatchOperationResult>> BatchDeleteAsync(
        DTOs.Company.BatchDeleteCompanyRequest request,
        CancellationToken cancellationToken = default)
    {
        _logger.LogWarning("Batch deleting {Count} companies", request.CompanyIds.Count);

        var companies = await _unitOfWork.Companies.GetQueryable()
            .Where(c => request.CompanyIds.Contains(c.Id))
            .ToListAsync(cancellationToken);

        var result = new DTOs.Member.BatchOperationResult();

        foreach (var company in companies)
        {
            try
            {
                await _unitOfWork.Companies.DeleteAsync(company, cancellationToken);
                result.Success++;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to delete company {CompanyId}", company.Id);
                result.Failed++;
            }
        }

        result.Failed += request.CompanyIds.Count - companies.Count;
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Batch deleted {Success} companies, {Failed} failed", result.Success, result.Failed);
        return Result<DTOs.Member.BatchOperationResult>.Success(result);
    }

    private static string GenerateCompanyNumber()
    {
        return $"C{DateTime.UtcNow:yyyyMMddHHmmss}";
    }
}
