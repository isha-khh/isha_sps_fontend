using Microsoft.Extensions.Logging;
using SPS.Application.Common;
using SPS.Application.DTOs.About;
using SPS.Application.DTOs.Common;
using SPS.Application.Interfaces;
using SPS.Application.Interfaces.IServices;
using SPS.Domain.Entities;
using SPS.Domain.Enums;

namespace SPS.Application.Services;

public class AboutService : IAboutService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<AboutService> _logger;

    public AboutService(IUnitOfWork unitOfWork, ILogger<AboutService> logger)
    {
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    public async Task<Result<PagedResult<AboutResponse>>> GetPagedAsync(
        AboutQueryParameters parameters,
        CancellationToken cancellationToken = default)
    {
        var pagedResult = await _unitOfWork.About.GetPagedAsync(parameters, cancellationToken);
        var response = new PagedResult<AboutResponse>
        {
            Items = pagedResult.Items.Select(MapToResponse).ToList(),
            TotalCount = pagedResult.TotalCount,
            Page = pagedResult.Page,
            PageSize = pagedResult.PageSize
        };
        return Result<PagedResult<AboutResponse>>.Success(response);
    }

    public async Task<Result<AboutResponse>> GetByIdAsync(
        int id,
        CancellationToken cancellationToken = default)
    {
        var about = await _unitOfWork.About.GetByIdAsync(id, cancellationToken);
        if (about == null)
            return Result<AboutResponse>.Failure("內容不存在");

        return Result<AboutResponse>.Success(MapToResponse(about));
    }

    public async Task<Result<List<AboutResponse>>> GetByTypeAsync(
        short type,
        CancellationToken cancellationToken = default)
    {
        var aboutList = await _unitOfWork.About.GetByTypeAsync(type, cancellationToken);
        var response = aboutList.Select(MapToResponse).ToList();
        return Result<List<AboutResponse>>.Success(response);
    }

    public async Task<Result<AboutResponse>> CreateAsync(
        CreateAboutRequest request,
        CancellationToken cancellationToken = default)
    {
        // 開始資料庫事務以確保原子性
        await using var transaction = await _unitOfWork.BeginTransactionAsync(cancellationToken);
        try
        {
            // 創建多語言文本
            var title = await _unitOfWork.MultilingualTexts.CreateTextAsync(request.Title, cancellationToken);
            var content = !string.IsNullOrEmpty(request.Content)
                ? await _unitOfWork.MultilingualTexts.CreateTextAsync(request.Content, cancellationToken)
                : null;

            // 保存多語言文本以獲取生成的 ID
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            var about = new About
            {
                Name = request.Name,
                TitleId = title.Id,
                ContentId = content?.Id,
                Published = request.Published,
                Type = request.Type,
                Ordinal = request.Ordinal,
                Version = request.Version,
                SendTime = request.SendTime,
                DataMode = DataMode.Normal,
                CreatedTime = DateTime.UtcNow,
                UpdatedTime = DateTime.UtcNow
            };

            await _unitOfWork.About.AddAsync(about, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            // 提交事務
            await transaction.CommitAsync(cancellationToken);

            return Result<AboutResponse>.Success(new AboutResponse
            {
                Id = about.Id,
                Name = about.Name,
                Title = request.Title,
                Content = request.Content,
                Published = about.Published,
                Type = about.Type,
                Ordinal = about.Ordinal,
                Version = about.Version,
                SendTime = about.SendTime,
                CreatedTime = about.CreatedTime,
                UpdatedTime = about.UpdatedTime
            });
        }
        catch (Exception ex)
        {
            // 發生錯誤時回滾事務
            await transaction.RollbackAsync(cancellationToken);
            _logger.LogError(ex, "創建關於我們資料時發生錯誤: {Message}", ex.Message);
            return Result<AboutResponse>.Failure($"創建失敗: {ex.Message}");
        }
    }

    public async Task<Result<AboutResponse>> UpdateAsync(
        int id,
        UpdateAboutRequest request,
        CancellationToken cancellationToken = default)
    {
        var about = await _unitOfWork.About.GetByIdAsync(id, cancellationToken);
        if (about == null)
            return Result<AboutResponse>.Failure("內容不存在");

        if (request.Name != null) about.Name = request.Name;
        if (request.Published.HasValue) about.Published = request.Published.Value;
        if (request.Type.HasValue) about.Type = request.Type.Value;
        if (request.Ordinal.HasValue) about.Ordinal = request.Ordinal.Value;
        if (request.Version != null) about.Version = request.Version;
        if (request.SendTime.HasValue) about.SendTime = request.SendTime;
        about.UpdatedTime = DateTime.UtcNow;

        await _unitOfWork.About.UpdateAsync(about, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Result<AboutResponse>.Success(new AboutResponse
        {
            Id = about.Id,
            Name = about.Name,
            Title = about.Title?.DefaultText ?? request.Title,
            Content = about.Content?.DefaultText ?? request.Content,
            Published = about.Published,
            Type = about.Type,
            Ordinal = about.Ordinal,
            Version = about.Version,
            SendTime = about.SendTime,
            CreatedTime = about.CreatedTime,
            UpdatedTime = about.UpdatedTime
        });
    }

    public async Task<Result<bool>> DeleteAsync(
        int id,
        CancellationToken cancellationToken = default)
    {
        var about = await _unitOfWork.About.GetByIdAsync(id, cancellationToken);
        if (about == null)
            return Result<bool>.Failure("內容不存在");

        await _unitOfWork.About.DeleteAsync(about, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return Result<bool>.Success(true);
    }

    private AboutResponse MapToResponse(About about)
    {
        return new AboutResponse
        {
            Id = about.Id,
            Name = about.Name,
            Title = about.Title?.DefaultText,
            Content = about.Content?.DefaultText,
            Published = about.Published,
            Type = about.Type,
            Ordinal = about.Ordinal,
            Version = about.Version,
            SendTime = about.SendTime,
            CreatedTime = about.CreatedTime,
            UpdatedTime = about.UpdatedTime
        };
    }
}
