using Microsoft.EntityFrameworkCore;
using SPS.Application.DTOs.Common;
using SPS.Application.DTOs.Member;
using SPS.Application.Interfaces.IRepositories;
using SPS.Domain.Entities;
using SPS.Infrastructure.Data;
using SPS.Infrastructure.Repositories.Common;

namespace SPS.Infrastructure.Repositories;

/// <summary>
/// 會員倉儲實現
/// </summary>
public class MemberRepository : Repository<Member, Guid>, IMemberRepository
{
    public MemberRepository(ApplicationDbContext context) : base(context)
    {
    }

    public override async Task<Member?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(m => m.Company)
            .Include(m => m.Person)
            .FirstOrDefaultAsync(m => m.Id == id, cancellationToken);
    }

    public async Task<Member?> GetByEmailAsync(string email, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(m => m.Company)
            .Include(m => m.Person)
            .FirstOrDefaultAsync(m => m.Email == email, cancellationToken);
    }

    public async Task<bool> ExistsByEmailAsync(string email, CancellationToken cancellationToken = default)
    {
        return await _dbSet.AnyAsync(m => m.Email == email, cancellationToken);
    }

    public async Task<Member?> GetByRefreshTokenAsync(string refreshToken, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(m => m.Company)
            .Include(m => m.Person)
            .FirstOrDefaultAsync(m => m.RefreshToken == refreshToken, cancellationToken);
    }

    public async Task<PagedResult<Member>> GetPagedAsync(MemberQueryParameters parameters, CancellationToken cancellationToken = default)
    {
        var query = _dbSet.Include(m => m.Company).AsQueryable();

        if (!string.IsNullOrWhiteSpace(parameters.Search))
        {
            query = query.Where(m =>
                m.Email.Contains(parameters.Search) ||
                (m.Nickname != null && m.Nickname.Contains(parameters.Search)) ||
                (m.Company != null && m.Company.Name.Contains(parameters.Search)));
        }

        if (parameters.Status.HasValue)
        {
            query = query.Where(m => m.Status == parameters.Status.Value);
        }

        if (parameters.Role.HasValue)
        {
            query = query.Where(m => m.Role == parameters.Role.Value);
        }

        if (parameters.CompanyId.HasValue)
        {
            query = query.Where(m => m.CompanyId == parameters.CompanyId.Value);
        }

        if (parameters.IsApproved.HasValue)
        {
            query = query.Where(m => m.IsApproved == parameters.IsApproved.Value);
        }

        if (parameters.HasCompany.HasValue)
        {
            query = parameters.HasCompany.Value
                ? query.Where(m => m.CompanyId != null)
                : query.Where(m => m.CompanyId == null);
        }

        if (parameters.IsEmailVerified.HasValue)
        {
            query = query.Where(m => m.IsEmailVerified == parameters.IsEmailVerified.Value);
        }

        var totalCount = await query.CountAsync(cancellationToken);

        query = ApplySorting(query, parameters.SortBy, parameters.Descending);

        var items = await query
            .Skip((parameters.Page - 1) * parameters.PageSize)
            .Take(parameters.PageSize)
            .ToListAsync(cancellationToken);

        return new PagedResult<Member>
        {
            Items = items,
            TotalCount = totalCount,
            Page = parameters.Page,
            PageSize = parameters.PageSize
        };
    }

    private IQueryable<Member> ApplySorting(IQueryable<Member> query, string? sortBy, bool descending)
    {
        return sortBy switch
        {
            "Email" => descending ? query.OrderByDescending(m => m.Email) : query.OrderBy(m => m.Email),
            "Nickname" => descending ? query.OrderByDescending(m => m.Nickname) : query.OrderBy(m => m.Nickname),
            "CreatedAt" => descending ? query.OrderByDescending(m => m.CreatedTime) : query.OrderBy(m => m.CreatedTime),
            _ => descending ? query.OrderByDescending(m => m.CreatedTime) : query.OrderBy(m => m.CreatedTime)
        };
    }

    public async Task<Member?> GetByIdWithCompanyAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(m => m.Company)
            .Include(m => m.Photo)
            .FirstOrDefaultAsync(m => m.Id == id, cancellationToken);
    }

    public async Task<List<Member>> GetByCompanyIdAsync(Guid companyId, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(m => m.Company)
            .Where(m => m.CompanyId == companyId)
            .OrderBy(m => m.CreatedTime)
            .ToListAsync(cancellationToken);
    }
}
