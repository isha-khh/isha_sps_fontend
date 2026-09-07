using Microsoft.EntityFrameworkCore;
using SPS.Application.Common;
using SPS.Application.DTOs.SiteStatistics;
using SPS.Application.Interfaces;
using SPS.Application.Interfaces.IServices;
using SPS.Domain.Enums;

namespace SPS.Application.Services;

/// <summary>
/// 網站統計數據服務實現
/// </summary>
public class SiteStatisticsService : ISiteStatisticsService
{
    private readonly IUnitOfWork _unitOfWork;

    public SiteStatisticsService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<SiteStatisticsResponse>> GetStatisticsAsync(CancellationToken cancellationToken = default)
    {
        var statistics = await _unitOfWork.SiteStatistics.GetStatisticsAsync(cancellationToken);
        // 會員總數 = 需求端 + 供給端（Both 型公司同時算兩邊，各貢獻 1）
        var activeCompanies = _unitOfWork.Companies.GetQueryable()
            .Where(c => c.Status == Status.Active && c.DataMode == DataMode.Normal);
        var demandCount = await activeCompanies.CountAsync(c => c.Type == CompanyType.Buyer || c.Type == CompanyType.Both, cancellationToken);
        var supplyCount = await activeCompanies.CountAsync(c => c.Type == CompanyType.Supplier || c.Type == CompanyType.Both, cancellationToken);
        var totalMembers = demandCount + supplyCount;

        return Result<SiteStatisticsResponse>.Success(new SiteStatisticsResponse
        {
            TotalMembers = totalMembers,
            SuccessfulMatches = statistics.SuccessfulMatches,
            SubsidyApplications = statistics.SubsidyApplications
        });
    }

    public async Task<Result<SiteStatisticsResponse>> SetStatisticsAsync(
        int? successfulMatches,
        int? subsidyApplications,
        CancellationToken cancellationToken = default)
    {
        var statistics = await _unitOfWork.SiteStatistics.GetStatisticsAsync(cancellationToken);

        if (successfulMatches.HasValue)
            statistics.SuccessfulMatches = successfulMatches.Value;

        if (subsidyApplications.HasValue)
            statistics.SubsidyApplications = subsidyApplications.Value;

        await _unitOfWork.SiteStatistics.UpdateAsync(statistics, cancellationToken);

        // 會員總數 = 需求端 + 供給端（Both 型公司同時算兩邊，各貢獻 1）
        var activeCompanies = _unitOfWork.Companies.GetQueryable()
            .Where(c => c.Status == Status.Active && c.DataMode == DataMode.Normal);
        var demandCount = await activeCompanies.CountAsync(c => c.Type == CompanyType.Buyer || c.Type == CompanyType.Both, cancellationToken);
        var supplyCount = await activeCompanies.CountAsync(c => c.Type == CompanyType.Supplier || c.Type == CompanyType.Both, cancellationToken);
        var totalMembers = demandCount + supplyCount;

        return Result<SiteStatisticsResponse>.Success(new SiteStatisticsResponse
        {
            TotalMembers = totalMembers,
            SuccessfulMatches = statistics.SuccessfulMatches,
            SubsidyApplications = statistics.SubsidyApplications
        });
    }
}
