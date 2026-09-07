using Microsoft.Extensions.Logging;
using SPS.Application.Common;
using SPS.Application.DTOs.AdminUser;
using SPS.Application.DTOs.Common;
using SPS.Application.Interfaces;
using SPS.Application.Interfaces.IServices;
using SPS.Domain.Entities;
using SPS.Domain.Enums;

namespace SPS.Application.Services;

/// <summary>
/// 後台使用者管理服務實現
/// </summary>
public class AdminUserService : IAdminUserService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IPasswordHasher _passwordHasher;
    private readonly ILogger<AdminUserService> _logger;

    public AdminUserService(
        IUnitOfWork unitOfWork,
        IPasswordHasher passwordHasher,
        ILogger<AdminUserService> logger)
    {
        _unitOfWork = unitOfWork;
        _passwordHasher = passwordHasher;
        _logger = logger;
    }

    public async Task<Result<PagedResult<AdminUserDto>>> GetPagedAsync(QueryParameters parameters, CancellationToken cancellationToken = default)
    {
        var pagedData = await _unitOfWork.Users.GetPagedAsync(parameters, cancellationToken);
        
        var dtos = pagedData.Items.Select(MapToDto).ToList();

        var result = new PagedResult<AdminUserDto>
        {
            Items = dtos,
            TotalCount = pagedData.TotalCount,
            Page = pagedData.Page,
            PageSize = pagedData.PageSize
        };

        return Result<PagedResult<AdminUserDto>>.Success(result);
    }

    public async Task<Result<AdminUserDto>> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var user = await _unitOfWork.Users.GetByIdWithRolesAsync(id, cancellationToken);
        if (user == null)
        {
            return Result<AdminUserDto>.Failure("使用者不存在");
        }

        return Result<AdminUserDto>.Success(MapToDto(user));
    }

    public async Task<Result<Guid>> CreateAsync(CreateAdminUserRequest request, CancellationToken cancellationToken = default)
    {
        // 驗證帳號
        if (await _unitOfWork.Users.ExistsByAccountAsync(request.Account, cancellationToken))
        {
            return Result<Guid>.Failure("帳號已存在");
        }

        // 驗證郵箱
        if (!string.IsNullOrEmpty(request.Email) && await _unitOfWork.Users.ExistsByEmailAsync(request.Email, cancellationToken))
        {
            return Result<Guid>.Failure("郵箱已存在");
        }

        // 驗證角色
        var roles = new List<Role>();
        if (request.RoleIds != null && request.RoleIds.Any())
        {
            foreach (var roleId in request.RoleIds)
            {
                var role = await _unitOfWork.Roles.GetByIdAsync(roleId, cancellationToken);
                if (role != null)
                {
                    roles.Add(role);
                }
            }
        }

        var user = new User
        {
            Id = Guid.NewGuid(),
            Name = request.Name,
            Account = request.Account,
            Email = request.Email,
            Password = _passwordHasher.Hash(request.Password),
            Status = Status.Active,
            DataMode = DataMode.Normal,
            CreatedTime = DateTime.UtcNow,
            UpdatedTime = DateTime.UtcNow,
            // 設置默認值
            LoginFailure = 0,
            PasswordExpirationPolicy = 0,
            FirstChanged = false,
            PasswordChanged = false
        };

        // 添加角色
        foreach (var role in roles)
        {
            user.UserRoles.Add(new UserRole
            {
                UserId = user.Id,
                RoleId = role.Id
            });
        }

        await _unitOfWork.Users.AddAsync(user, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Admin user created: {UserId}", user.Id);

        return Result<Guid>.Success(user.Id);
    }

    public async Task<Result<bool>> UpdatePermissionsAsync(Guid id, UpdateAdminPermissionsRequest request, CancellationToken cancellationToken = default)
    {
        var user = await _unitOfWork.Users.GetByIdWithRolesAsync(id, cancellationToken);
        if (user == null)
        {
            return Result<bool>.Failure("使用者不存在");
        }

        // 清除現有角色
        user.UserRoles.Clear();

        // 添加新角色
        if (request.RoleIds != null && request.RoleIds.Any())
        {
            foreach (var roleId in request.RoleIds)
            {
                // 這裡假設 RoleId 是有效的，或者我們可以在這裡檢查
                // 為了性能，如果相信前端傳來的ID，可以不查庫直接添加關聯，但為了安全最好查一下或確保外鍵約束
                // 這裡我們簡單地只添加ID，EF Core 會在 SaveChanges 時處理外鍵，如果ID不存在會報錯
                // 但為了更友好的錯誤提示，我們最好檢查一下，或者只添加存在的角色
                
                // 由於 UserRole 需要 Role 實體或者 RoleId，我們可以直接設置 RoleId
                // 但是我們已經拿到了 User 實體，它是被跟蹤的。
                // 最安全的方式是查詢 Role 是否存在
                var role = await _unitOfWork.Roles.GetByIdAsync(roleId, cancellationToken);
                if (role != null)
                {
                    user.UserRoles.Add(new UserRole
                    {
                        UserId = user.Id,
                        RoleId = role.Id
                    });
                }
            }
        }

        user.UpdatedTime = DateTime.UtcNow;
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Admin user permissions updated: {UserId}", user.Id);

        return Result<bool>.Success(true);
    }

    public async Task<Result<bool>> UpdateStatusAsync(Guid id, UpdateAdminUserStatusRequest request, CancellationToken cancellationToken = default)
    {
        var user = await _unitOfWork.Users.GetByIdAsync(id, cancellationToken);
        if (user == null)
        {
            return Result<bool>.Failure("使用者不存在");
        }

        user.Status = request.Status;
        user.UpdatedTime = DateTime.UtcNow;
        
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Admin user status updated: {UserId}, Status: {Status}", user.Id, request.Status);

        return Result<bool>.Success(true);
    }

    private AdminUserDto MapToDto(User user)
    {
        // 計算總權限
        var permissions = UserPermission.None;
        var roleDtos = new List<AdminRoleDto>();

        if (user.UserRoles != null)
        {
            foreach (var userRole in user.UserRoles)
            {
                if (userRole.Role != null)
                {
                    permissions |= userRole.Role.Permissions;
                    roleDtos.Add(new AdminRoleDto
                    {
                        Id = userRole.Role.Id,
                        Name = userRole.Role.Name,
                        Permissions = userRole.Role.Permissions
                    });
                }
            }
        }

        return new AdminUserDto
        {
            Id = user.Id,
            Name = user.Name,
            Account = user.Account,
            Email = user.Email,
            Status = user.Status,
            CreatedTime = user.CreatedTime,
            LastLoginTime = user.LoginTime,
            Roles = roleDtos,
            Permissions = permissions
        };
    }
}
