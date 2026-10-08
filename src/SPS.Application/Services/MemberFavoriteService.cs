using Microsoft.EntityFrameworkCore;
using SPS.Application.Common;
using SPS.Application.DTOs.MemberFavorite;
using SPS.Application.Interfaces;
using SPS.Application.Interfaces.IServices;
using SPS.Domain.Enums;

namespace SPS.Application.Services;

/// <summary>
/// 會員的最愛：收藏企業名錄的企業與媒合對接的需求。只能收藏目前公開的項目（企業要已審核且啟用、需求要已發布），
/// 之後項目下架或停用時，在清單裡就不會顯示（收藏紀錄保留，重新上架會回來）。每個會員最多收藏 200 筆。
/// </summary>
public class MemberFavoriteService : IMemberFavoriteService
{
    private const int MaxFavorites = 200;

    private readonly IUnitOfWork _unitOfWork;

    public MemberFavoriteService(IUnitOfWork unitOfWork) => _unitOfWork = unitOfWork;

    public async Task<Result<MemberFavoritesResponse>> GetAsync(Guid memberId, CancellationToken ct = default)
    {
        var companyIds = await _unitOfWork.Favorites.GetCompanyIdsAsync(memberId, ct);
        var demandIds = await _unitOfWork.Favorites.GetDemandIdsAsync(memberId, ct);

        var companies = companyIds.Count == 0
            ? new List<FavoriteCompanyDto>()
            : await _unitOfWork.Companies.GetQueryable()
                .Where(c => companyIds.Contains(c.Id) && c.IsVerified && c.Status == Status.Active)
                .OrderBy(c => c.Name)
                .Select(c => new FavoriteCompanyDto { Id = c.Id, Name = c.Name, Subject = c.Subject })
                .ToListAsync(ct);

        var demands = demandIds.Count == 0
            ? new List<FavoriteDemandDto>()
            : await _unitOfWork.Demands.GetQueryable()
                .Where(d => demandIds.Contains(d.Id) && d.Status == Status.Active)
                .OrderByDescending(d => d.PublishedTime ?? d.CreatedTime)
                .Select(d => new FavoriteDemandDto { Id = d.Id, Number = d.Number, Name = d.Name, Location = d.Location })
                .ToListAsync(ct);

        return Result<MemberFavoritesResponse>.Success(new MemberFavoritesResponse { Companies = companies, Demands = demands });
    }

    public async Task<FavoriteIdsResponse> GetIdsAsync(Guid memberId, CancellationToken ct = default) => new()
    {
        LoggedIn = true,
        CompanyIds = await _unitOfWork.Favorites.GetCompanyIdsAsync(memberId, ct),
        DemandIds = await _unitOfWork.Favorites.GetDemandIdsAsync(memberId, ct),
    };

    public async Task<Result<bool>> AddCompanyAsync(Guid memberId, Guid companyId, CancellationToken ct = default)
    {
        var exists = await _unitOfWork.Companies.GetQueryable().AnyAsync(c => c.Id == companyId && c.IsVerified && c.Status == Status.Active, ct);
        if (!exists) return Result<bool>.Failure("企業不存在");
        if (await _unitOfWork.Favorites.CountAsync(memberId, ct) >= MaxFavorites) return Result<bool>.Failure($"最愛最多 {MaxFavorites} 筆，請先移除不需要的項目");
        await _unitOfWork.Favorites.AddCompanyAsync(memberId, companyId, ct);
        return Result<bool>.Success(true);
    }

    public async Task<Result<bool>> RemoveCompanyAsync(Guid memberId, Guid companyId, CancellationToken ct = default)
    {
        await _unitOfWork.Favorites.RemoveCompanyAsync(memberId, companyId, ct);
        return Result<bool>.Success(true);
    }

    public async Task<Result<bool>> AddDemandAsync(Guid memberId, int demandId, CancellationToken ct = default)
    {
        var exists = await _unitOfWork.Demands.GetQueryable().AnyAsync(d => d.Id == demandId && d.Status == Status.Active, ct);
        if (!exists) return Result<bool>.Failure("需求不存在");
        if (await _unitOfWork.Favorites.CountAsync(memberId, ct) >= MaxFavorites) return Result<bool>.Failure($"最愛最多 {MaxFavorites} 筆，請先移除不需要的項目");
        await _unitOfWork.Favorites.AddDemandAsync(memberId, demandId, ct);
        return Result<bool>.Success(true);
    }

    public async Task<Result<bool>> RemoveDemandAsync(Guid memberId, int demandId, CancellationToken ct = default)
    {
        await _unitOfWork.Favorites.RemoveDemandAsync(memberId, demandId, ct);
        return Result<bool>.Success(true);
    }
}
