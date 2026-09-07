using System.Text.Json;
using Microsoft.Extensions.Logging;
using SPS.Application.Common;
using SPS.Application.Interfaces;
using SPS.Application.Interfaces.IServices;
using SPS.Domain.Entities;

namespace SPS.Application.Services;

public class SystemSettingService : ISystemSettingService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<SystemSettingService> _logger;

    public SystemSettingService(IUnitOfWork unitOfWork, ILogger<SystemSettingService> logger)
    {
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    public async Task<Result<T>> GetSettingAsync<T>(string category, CancellationToken cancellationToken = default) where T : class, new()
    {
        try
        {
            var setting = await _unitOfWork.SystemSettings.GetByCategoryAsync(category, cancellationToken);

            if (setting == null)
            {
                // 如果找不到，返回預設值，不報錯
                return Result<T>.Success(new T());
            }

            var result = JsonSerializer.Deserialize<T>(setting.Value);
            return Result<T>.Success(result ?? new T());
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching settings for category {Category}", category);
            return Result<T>.Failure($"Failed to load settings: {ex.Message}");
        }
    }

    public async Task<Result> UpdateSettingAsync<T>(string category, T settings, CancellationToken cancellationToken = default)
    {
        try
        {
            var setting = await _unitOfWork.SystemSettings.GetByCategoryAsync(category, cancellationToken);
            var jsonValue = JsonSerializer.Serialize(settings);

            if (setting == null)
            {
                // 新增
                setting = new SystemSetting
                {
                    Category = category,
                    Value = jsonValue,
                    CreatedTime = DateTime.UtcNow,
                    UpdatedTime = DateTime.UtcNow
                };
                await _unitOfWork.SystemSettings.AddAsync(setting, cancellationToken);
            }
            else
            {
                // 更新
                setting.Value = jsonValue;
                setting.UpdatedTime = DateTime.UtcNow;
                await _unitOfWork.SystemSettings.UpdateAsync(setting, cancellationToken);
            }

            await _unitOfWork.SaveChangesAsync(cancellationToken);
            return Result.Success();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating settings for category {Category}", category);
            return Result.Failure($"Failed to update settings: {ex.Message}");
        }
    }
}
