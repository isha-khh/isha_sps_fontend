using Microsoft.Extensions.Logging;
using SPS.Application.Common;
using SPS.Application.DTOs.Common;
using SPS.Application.DTOs.Question;
using SPS.Application.Interfaces;
using SPS.Application.Interfaces.IServices;
using SPS.Domain.Entities;

namespace SPS.Application.Services;

public class QuestionService : IQuestionService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<QuestionService> _logger;

    public QuestionService(IUnitOfWork unitOfWork, ILogger<QuestionService> logger)
    {
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    public async Task<Result<PagedResult<QuestionResponse>>> GetPagedAsync(
        QuestionQueryParameters parameters,
        CancellationToken cancellationToken = default)
    {
        var pagedResult = await _unitOfWork.Questions.GetPagedAsync(parameters, cancellationToken);
        var response = new PagedResult<QuestionResponse>
        {
            Items = pagedResult.Items.Select(MapToResponse).ToList(),
            TotalCount = pagedResult.TotalCount,
            Page = pagedResult.Page,
            PageSize = pagedResult.PageSize
        };
        return Result<PagedResult<QuestionResponse>>.Success(response);
    }

    public async Task<Result<QuestionResponse>> GetByIdAsync(
        int id,
        CancellationToken cancellationToken = default)
    {
        var question = await _unitOfWork.Questions.GetByIdAsync(id, cancellationToken);
        if (question == null)
            return Result<QuestionResponse>.Failure("問題不存在");

        return Result<QuestionResponse>.Success(MapToResponse(question));
    }

    public async Task<Result<List<QuestionResponse>>> GetByCategoryAsync(
        int categoryId,
        CancellationToken cancellationToken = default)
    {
        var questions = await _unitOfWork.Questions.GetByCategoryAsync(categoryId, cancellationToken);
        var response = questions.Select(MapToResponse).ToList();
        return Result<List<QuestionResponse>>.Success(response);
    }

    public async Task<Result<QuestionResponse>> CreateAsync(
        CreateQuestionRequest request,
        CancellationToken cancellationToken = default)
    {
        // 開始資料庫事務以確保原子性
        await using var transaction = await _unitOfWork.BeginTransactionAsync(cancellationToken);
        try
        {
            // 驗證分類
            if (request.CategoryId.HasValue)
            {
                var category = await _unitOfWork.Categories.GetByIdAsync(request.CategoryId.Value, cancellationToken);
                if (category == null)
                    return Result<QuestionResponse>.Failure("分類不存在");
            }

            // 創建多語言文本
            var subject = await _unitOfWork.MultilingualTexts.CreateTextAsync(request.Subject, cancellationToken);
            var answer = await _unitOfWork.MultilingualTexts.CreateTextAsync(request.Answer, cancellationToken);

            // 保存多語言文本以獲取生成的 ID
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            var question = new Question
            {
                SubjectId = subject.Id,
                AnswerId = answer.Id,
                Published = request.Published,
                Ordinal = request.Ordinal,
                CategoryId = request.CategoryId,
                CreatedTime = DateTime.UtcNow,
                UpdatedTime = DateTime.UtcNow
            };

            await _unitOfWork.Questions.AddAsync(question, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            // 提交事務
            await transaction.CommitAsync(cancellationToken);

            return Result<QuestionResponse>.Success(new QuestionResponse
            {
                Id = question.Id,
                Subject = request.Subject,
                Answer = request.Answer,
                Published = question.Published,
                Ordinal = question.Ordinal,
                CategoryId = question.CategoryId,
                CreatedTime = question.CreatedTime,
                UpdatedTime = question.UpdatedTime
            });
        }
        catch (Exception ex)
        {
            // 發生錯誤時回滾事務
            await transaction.RollbackAsync(cancellationToken);
            _logger.LogError(ex, "創建常見問題時發生錯誤: {Message}", ex.Message);
            return Result<QuestionResponse>.Failure($"創建失敗: {ex.Message}");
        }
    }

    public async Task<Result<QuestionResponse>> UpdateAsync(
        int id,
        UpdateQuestionRequest request,
        CancellationToken cancellationToken = default)
    {
        var question = await _unitOfWork.Questions.GetByIdAsync(id, cancellationToken);
        if (question == null)
            return Result<QuestionResponse>.Failure("問題不存在");

        // 驗證分類
        if (request.CategoryId.HasValue)
        {
            var category = await _unitOfWork.Categories.GetByIdAsync(request.CategoryId.Value, cancellationToken);
            if (category == null)
                return Result<QuestionResponse>.Failure("分類不存在");
        }

        // 更新 Subject 多語言文本
        if (!string.IsNullOrEmpty(request.Subject) && question.SubjectId.HasValue)
        {
            var subjectText = await _unitOfWork.MultilingualTexts.GetByIdAsync(question.SubjectId.Value, cancellationToken);
            if (subjectText != null)
            {
                subjectText.DefaultText = request.Subject;
                subjectText.UpdatedTime = DateTime.UtcNow;
            }
        }

        // 更新 Answer 多語言文本
        if (request.Answer != null && question.AnswerId.HasValue)
        {
            var answerText = await _unitOfWork.MultilingualTexts.GetByIdAsync(question.AnswerId.Value, cancellationToken);
            if (answerText != null)
            {
                answerText.DefaultText = request.Answer;
                answerText.UpdatedTime = DateTime.UtcNow;
            }
        }

        if (request.Published.HasValue) question.Published = request.Published.Value;
        if (request.Ordinal.HasValue) question.Ordinal = request.Ordinal.Value;
        question.CategoryId = request.CategoryId;
        question.UpdatedTime = DateTime.UtcNow;

        await _unitOfWork.Questions.UpdateAsync(question, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Result<QuestionResponse>.Success(new QuestionResponse
        {
            Id = question.Id,
            Subject = question.Subject?.DefaultText ?? request.Subject,
            Answer = question.Answer?.DefaultText ?? request.Answer,
            Published = question.Published,
            Ordinal = question.Ordinal,
            CategoryId = question.CategoryId,
            CategoryName = question.Category?.Name,
            CreatedTime = question.CreatedTime,
            UpdatedTime = question.UpdatedTime
        });
    }

    public async Task<Result<bool>> DeleteAsync(
        int id,
        CancellationToken cancellationToken = default)
    {
        var question = await _unitOfWork.Questions.GetByIdAsync(id, cancellationToken);
        if (question == null)
            return Result<bool>.Failure("問題不存在");

        await _unitOfWork.Questions.DeleteAsync(question, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return Result<bool>.Success(true);
    }

    private QuestionResponse MapToResponse(Question question)
    {
        return new QuestionResponse
        {
            Id = question.Id,
            Subject = question.Subject?.DefaultText,
            Answer = question.Answer?.DefaultText,
            Published = question.Published,
            Ordinal = question.Ordinal,
            CategoryId = question.CategoryId,
            CategoryName = question.Category?.Name,
            CreatedTime = question.CreatedTime,
            UpdatedTime = question.UpdatedTime
        };
    }
}
