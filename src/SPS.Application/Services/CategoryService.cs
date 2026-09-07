using Microsoft.Extensions.Logging;
using SPS.Application.Common;
using SPS.Application.DTOs.Category;
using SPS.Application.DTOs.Common;
using SPS.Application.Interfaces;
using SPS.Application.Interfaces.IServices;
using SPS.Domain.Entities;
using SPS.Domain.Enums;

namespace SPS.Application.Services;

public class CategoryService : ICategoryService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<CategoryService> _logger;

    public CategoryService(IUnitOfWork unitOfWork, ILogger<CategoryService> logger)
    {
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    public async Task<Result<PagedResult<CategoryResponse>>> GetPagedAsync(
        CategoryQueryParameters parameters,
        CancellationToken cancellationToken = default)
    {
        var pagedResult = await _unitOfWork.Categories.GetPagedAsync(parameters, cancellationToken);
        var response = new PagedResult<CategoryResponse>
        {
            Items = pagedResult.Items.Select(MapToResponse).ToList(),
            TotalCount = pagedResult.TotalCount,
            Page = pagedResult.Page,
            PageSize = pagedResult.PageSize
        };
        return Result<PagedResult<CategoryResponse>>.Success(response);
    }

    public async Task<Result<CategoryResponse>> GetByIdAsync(
        int id,
        CancellationToken cancellationToken = default)
    {
        var category = await _unitOfWork.Categories.GetByIdAsync(id, cancellationToken);
        if (category == null)
            return Result<CategoryResponse>.Failure("分類不存在");

        return Result<CategoryResponse>.Success(MapToResponse(category));
    }

    public async Task<Result<List<CategoryResponse>>> GetByTypeAsync(
        CategoryType type,
        CancellationToken cancellationToken = default)
    {
        var categories = await _unitOfWork.Categories.GetByTypeAsync(type, cancellationToken);
        var response = categories.Select(MapToResponse).ToList();
        return Result<List<CategoryResponse>>.Success(response);
    }

    public async Task<Result<List<CategoryTreeNode>>> GetCategoryTreeAsync(
        CategoryType? type = null,
        CancellationToken cancellationToken = default)
    {
        // 獲取所有分類
        var allCategories = type.HasValue
            ? await _unitOfWork.Categories.GetByTypeAsync(type.Value, cancellationToken)
            : await _unitOfWork.Categories.GetAllAsync(cancellationToken);

        // 構建分類樹
        var tree = BuildCategoryTree(allCategories);
        return Result<List<CategoryTreeNode>>.Success(tree);
    }

    public async Task<Result<CategoryResponse>> CreateAsync(
        CreateCategoryRequest request,
        CancellationToken cancellationToken = default)
    {
        // 驗證父分類
        if (request.ParentId.HasValue)
        {
            var parent = await _unitOfWork.Categories.GetByIdAsync(request.ParentId.Value, cancellationToken);
            if (parent == null)
                return Result<CategoryResponse>.Failure("父分類不存在");

            if (parent.Type != request.Type)
                return Result<CategoryResponse>.Failure("父分類類型必須與當前分類類型一致");
        }

        var category = new Category
        {
            Type = request.Type,
            Name = request.Name,
            Published = request.Published,
            Ordinal = request.Ordinal,
            ParentId = request.ParentId,
            HasChild = false,
            Remark = request.Remark,
            DataMode = DataMode.Normal,
            CreatedTime = DateTime.UtcNow,
            UpdatedTime = DateTime.UtcNow
        };

        await _unitOfWork.Categories.AddAsync(category, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        // 如果有父分類，更新父分類的 HasChild 標記
        if (request.ParentId.HasValue)
        {
            var parent = await _unitOfWork.Categories.GetByIdAsync(request.ParentId.Value, cancellationToken);
            if (parent != null && !parent.HasChild)
            {
                parent.HasChild = true;
                await _unitOfWork.Categories.UpdateAsync(parent, cancellationToken);
                await _unitOfWork.SaveChangesAsync(cancellationToken);
            }
        }

        return Result<CategoryResponse>.Success(MapToResponse(category));
    }

    public async Task<Result<CategoryResponse>> UpdateAsync(
        int id,
        UpdateCategoryRequest request,
        CancellationToken cancellationToken = default)
    {
        var category = await _unitOfWork.Categories.GetByIdAsync(id, cancellationToken);
        if (category == null)
            return Result<CategoryResponse>.Failure("分類不存在");

        // 驗證父分類
        if (request.ParentId.HasValue)
        {
            // 不能將分類設置為自己的父分類
            if (request.ParentId.Value == id)
                return Result<CategoryResponse>.Failure("不能將分類設置為自己的父分類");

            var parent = await _unitOfWork.Categories.GetByIdAsync(request.ParentId.Value, cancellationToken);
            if (parent == null)
                return Result<CategoryResponse>.Failure("父分類不存在");

            if (parent.Type != category.Type)
                return Result<CategoryResponse>.Failure("父分類類型必須與當前分類類型一致");
        }

        var oldParentId = category.ParentId;

        if (request.Name != null) category.Name = request.Name;
        if (request.Published.HasValue) category.Published = request.Published.Value;
        if (request.Ordinal.HasValue) category.Ordinal = request.Ordinal.Value;
        if (request.ParentId.HasValue) category.ParentId = request.ParentId;
        if (request.Remark != null) category.Remark = request.Remark;
        category.UpdatedTime = DateTime.UtcNow;

        await _unitOfWork.Categories.UpdateAsync(category, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        // 更新舊父分類的 HasChild 標記
        if (oldParentId.HasValue && oldParentId != category.ParentId)
        {
            var oldParent = await _unitOfWork.Categories.GetByIdAsync(oldParentId.Value, cancellationToken);
            if (oldParent != null)
            {
                var siblings = await _unitOfWork.Categories.GetChildrenAsync(oldParentId.Value, cancellationToken);
                oldParent.HasChild = siblings.Any(s => s.Id != id);
                await _unitOfWork.Categories.UpdateAsync(oldParent, cancellationToken);
                await _unitOfWork.SaveChangesAsync(cancellationToken);
            }
        }

        // 更新新父分類的 HasChild 標記
        if (category.ParentId.HasValue && category.ParentId != oldParentId)
        {
            var newParent = await _unitOfWork.Categories.GetByIdAsync(category.ParentId.Value, cancellationToken);
            if (newParent != null && !newParent.HasChild)
            {
                newParent.HasChild = true;
                await _unitOfWork.Categories.UpdateAsync(newParent, cancellationToken);
                await _unitOfWork.SaveChangesAsync(cancellationToken);
            }
        }

        return Result<CategoryResponse>.Success(MapToResponse(category));
    }

    public async Task<Result<bool>> DeleteAsync(
        int id,
        CancellationToken cancellationToken = default)
    {
        var category = await _unitOfWork.Categories.GetByIdWithChildrenAsync(id, cancellationToken);
        if (category == null)
            return Result<bool>.Failure("分類不存在");

        // 檢查是否有子分類
        if (category.HasChild && category.Children.Any())
            return Result<bool>.Failure("該分類下有子分類，無法刪除");

        // 將關聯的 Question 的 CategoryId 設為 null，避免 FK 約束導致刪除失敗
        var questions = await _unitOfWork.Questions.GetByCategoryAsync(id, cancellationToken);
        foreach (var question in questions)
        {
            question.CategoryId = null;
            await _unitOfWork.Questions.UpdateAsync(question, cancellationToken);
        }

        var parentId = category.ParentId;

        await _unitOfWork.Categories.DeleteAsync(category, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        // 更新父分類的 HasChild 標記
        if (parentId.HasValue)
        {
            var parent = await _unitOfWork.Categories.GetByIdAsync(parentId.Value, cancellationToken);
            if (parent != null)
            {
                var siblings = await _unitOfWork.Categories.GetChildrenAsync(parentId.Value, cancellationToken);
                parent.HasChild = siblings.Any();
                await _unitOfWork.Categories.UpdateAsync(parent, cancellationToken);
                await _unitOfWork.SaveChangesAsync(cancellationToken);
            }
        }

        return Result<bool>.Success(true);
    }

    private CategoryResponse MapToResponse(Category category)
    {
        return new CategoryResponse
        {
            Id = category.Id,
            Type = category.Type,
            Name = category.Name,
            Published = category.Published,
            Ordinal = category.Ordinal,
            ParentId = category.ParentId,
            ParentName = category.Parent?.Name,
            HasChild = category.HasChild,
            Remark = category.Remark,
            CreatedTime = category.CreatedTime,
            UpdatedTime = category.UpdatedTime
        };
    }

    private List<CategoryTreeNode> BuildCategoryTree(List<Category> categories)
    {
        var categoryDict = categories.ToDictionary(c => c.Id);
        var rootNodes = new List<CategoryTreeNode>();

        foreach (var category in categories)
        {
            var node = new CategoryTreeNode
            {
                Id = category.Id,
                Type = category.Type,
                Name = category.Name,
                Published = category.Published,
                Ordinal = category.Ordinal,
                ParentId = category.ParentId,
                HasChild = category.HasChild
            };

            if (category.ParentId == null)
            {
                rootNodes.Add(node);
            }
            else if (categoryDict.TryGetValue(category.ParentId.Value, out var parent))
            {
                var parentNode = FindNodeInTree(rootNodes, parent.Id);
                parentNode?.Children.Add(node);
            }
        }

        return rootNodes.OrderBy(n => n.Ordinal).ThenBy(n => n.Name).ToList();
    }

    private CategoryTreeNode? FindNodeInTree(List<CategoryTreeNode> nodes, int id)
    {
        foreach (var node in nodes)
        {
            if (node.Id == id)
                return node;

            var found = FindNodeInTree(node.Children, id);
            if (found != null)
                return found;
        }

        return null;
    }
}
