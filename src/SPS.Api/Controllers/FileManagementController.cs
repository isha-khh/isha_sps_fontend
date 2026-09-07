using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SPS.Application.DTOs;
using SPS.Application.DTOs.File;
using SPS.Application.Interfaces.IServices;
using System.Security.Claims;
using Swashbuckle.AspNetCore.Annotations;

namespace SPS.Api.Controllers;

/// <summary>
/// 文件管理 API
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
[SwaggerTag("文件管理 API")]
public class FileManagementController : ControllerBase
{
    private readonly IFileManagementService _fileManagementService;
    private readonly ILogger<FileManagementController> _logger;

    public FileManagementController(
        IFileManagementService fileManagementService,
        ILogger<FileManagementController> logger)
    {
        _fileManagementService = fileManagementService;
        _logger = logger;
    }

    /// <summary>
    /// 上傳文件
    /// </summary>
    /// <param name="request">上傳請求</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>上傳結果</returns>
    [HttpPost("upload")]
    [Authorize]
    [ProducesResponseType(typeof(FileUploadResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> UploadFile(
        [FromForm] FileUploadRequest request,
        CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue)
        {
            return Unauthorized(new { message = "未授權的請求" });
        }

        var result = await _fileManagementService.UploadFileAsync(request, userId.Value, cancellationToken);

        if (!result.IsSuccess)
        {
            return BadRequest(new { message = result.Error });
        }

        return Ok(result.Data);
    }

    /// <summary>
    /// 批量上傳文件
    /// </summary>
    /// <param name="request">批量上傳請求</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>批量上傳結果</returns>
    [HttpPost("upload/batch")]
    [Authorize]
    [ProducesResponseType(typeof(BatchFileUploadResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> UploadFiles(
        [FromForm] BatchFileUploadRequest request,
        CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue)
        {
            return Unauthorized(new { message = "未授權的請求" });
        }

        var result = await _fileManagementService.UploadFilesAsync(request, userId.Value, cancellationToken);

        if (!result.IsSuccess)
        {
            return BadRequest(new { message = result.Error });
        }

        return Ok(result.Data);
    }

    /// <summary>
    /// 獲取文件統計數據
    /// </summary>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>文件統計數據</returns>
    [HttpGet("statistics")]
    [Authorize]
    [ProducesResponseType(typeof(FileStatisticsResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetStatistics(CancellationToken cancellationToken)
    {
        var result = await _fileManagementService.GetStatisticsAsync(cancellationToken);

        if (!result.IsSuccess)
        {
            return BadRequest(new { message = result.Error });
        }

        return Ok(result.Data);
    }

    /// <summary>
    /// 根據 ID 獲取文件信息
    /// </summary>
    /// <param name="id">文件 ID</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>文件信息</returns>
    [HttpGet("{id:guid}")]
    [Authorize]
    [ProducesResponseType(typeof(FileInfoResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetFileById(
        Guid id,
        CancellationToken cancellationToken)
    {
        var result = await _fileManagementService.GetFileByIdAsync(id, cancellationToken);

        if (!result.IsSuccess)
        {
            return NotFound(new { message = result.Error });
        }

        return Ok(result.Data);
    }

    /// <summary>
    /// 根據文件編號獲取文件信息
    /// </summary>
    /// <param name="fileNumber">文件編號</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>文件信息</returns>
    [HttpGet("number/{fileNumber}")]
    [Authorize]
    [ProducesResponseType(typeof(FileInfoResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetFileByNumber(
        string fileNumber,
        CancellationToken cancellationToken)
    {
        var result = await _fileManagementService.GetFileByNumberAsync(fileNumber, cancellationToken);

        if (!result.IsSuccess)
        {
            return NotFound(new { message = result.Error });
        }

        return Ok(result.Data);
    }

    /// <summary>
    /// 查詢文件列表
    /// </summary>
    /// <param name="request">查詢請求</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>文件列表</returns>
    [HttpGet("query")]
    [Authorize]
    [ProducesResponseType(typeof(PagedResponse<FileListItemResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> QueryFiles(
        [FromQuery] FileQueryRequest request,
        CancellationToken cancellationToken)
    {
        var result = await _fileManagementService.QueryFilesAsync(request, cancellationToken);

        if (!result.IsSuccess)
        {
            return BadRequest(new { message = result.Error });
        }

        return Ok(result.Data);
    }

    /// <summary>
    /// 下載文件
    /// </summary>
    /// <param name="id">文件 ID</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>文件流</returns>
    [HttpGet("{id:guid}/download")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DownloadFile(
        Guid id,
        CancellationToken cancellationToken)
    {
        var result = await _fileManagementService.DownloadFileAsync(id, cancellationToken);

        if (!result.IsSuccess)
        {
            return NotFound(new { message = result.Error });
        }

        var (fileStream, fileName, contentType) = result.Data;

        return File(fileStream, contentType, fileName);
    }

    /// <summary>
    /// 刪除文件（軟刪除）
    /// </summary>
    /// <param name="id">文件 ID</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>刪除結果</returns>
    [HttpDelete("{id:guid}")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> DeleteFile(
        Guid id,
        CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue)
        {
            return Unauthorized(new { message = "未授權的請求" });
        }

        var result = await _fileManagementService.DeleteFileAsync(id, userId.Value, cancellationToken);

        if (!result.IsSuccess)
        {
            return NotFound(new { message = result.Error });
        }

        return Ok(new { message = "文件已刪除" });
    }

    /// <summary>
    /// 永久刪除文件（硬刪除）
    /// </summary>
    /// <param name="id">文件 ID</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>刪除結果</returns>
    [HttpDelete("{id:guid}/permanent")]
    [Authorize(Roles = "SuperAdmin")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> PermanentDeleteFile(
        Guid id,
        CancellationToken cancellationToken)
    {
        var result = await _fileManagementService.PermanentDeleteFileAsync(id, cancellationToken);

        if (!result.IsSuccess)
        {
            return NotFound(new { message = result.Error });
        }

        return Ok(new { message = "文件已永久刪除" });
    }

    /// <summary>
    /// 更新文件描述
    /// </summary>
    /// <param name="id">文件 ID</param>
    /// <param name="description">新描述</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>更新結果</returns>
    [HttpPut("{id:guid}/description")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateDescription(
        Guid id,
        [FromBody] string description,
        CancellationToken cancellationToken)
    {
        var result = await _fileManagementService.UpdateFileDescriptionAsync(id, description, cancellationToken);

        if (!result.IsSuccess)
        {
            return NotFound(new { message = result.Error });
        }

        return Ok(new { message = "描述已更新" });
    }

    /// <summary>
    /// 更新文件標籤
    /// </summary>
    /// <param name="id">文件 ID</param>
    /// <param name="tags">標籤列表</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>更新結果</returns>
    [HttpPut("{id:guid}/tags")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateTags(
        Guid id,
        [FromBody] List<string> tags,
        CancellationToken cancellationToken)
    {
        var result = await _fileManagementService.UpdateFileTagsAsync(id, tags, cancellationToken);

        if (!result.IsSuccess)
        {
            return NotFound(new { message = result.Error });
        }

        return Ok(new { message = "標籤已更新" });
    }

    /// <summary>
    /// 創建資料夾
    /// </summary>
    [HttpPost("folder")]
    [Authorize]
    [ProducesResponseType(typeof(FileInfoResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> CreateFolder(
        [FromBody] CreateFolderRequest request,
        CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue) return Unauthorized();

        var result = await _fileManagementService.CreateFolderAsync(
            request.FolderName,
            request.ParentId,
            userId.Value,
            cancellationToken);

        if (!result.IsSuccess) return BadRequest(new { message = result.Error });
        return Ok(result.Data);
    }

    /// <summary>
    /// 創建空文件
    /// </summary>
    [HttpPost("create")]
    [Authorize]
    [ProducesResponseType(typeof(FileInfoResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> CreateFile(
        [FromBody] CreateFileRequest request,
        CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue) return Unauthorized();

        var result = await _fileManagementService.CreateFileAsync(
            request.FileName,
            request.Extension,
            request.ParentId,
            userId.Value,
            cancellationToken);

        if (!result.IsSuccess) return BadRequest(new { message = result.Error });
        return Ok(result.Data);
    }

    /// <summary>
    /// 重新命名
    /// </summary>
    [HttpPut("{id:guid}/rename")]
    [Authorize]
    public async Task<IActionResult> RenameFile(
        Guid id,
        [FromBody] RenameFileRequest request,
        CancellationToken cancellationToken)
    {
        var result = await _fileManagementService.RenameFileAsync(id, request.NewName, cancellationToken);
        if (!result.IsSuccess) return BadRequest(new { message = result.Error });
        return Ok(new { message = "重命名成功" });
    }

    /// <summary>
    /// 移動文件
    /// </summary>
    [HttpPut("{id:guid}/move")]
    [Authorize]
    public async Task<IActionResult> MoveFile(
        Guid id,
        [FromBody] MoveFileRequest request,
        CancellationToken cancellationToken)
    {
        var result = await _fileManagementService.MoveFileAsync(id, request.TargetParentId, cancellationToken);
        if (!result.IsSuccess) return BadRequest(new { message = result.Error });
        return Ok(new { message = "移動成功" });
    }

    /// <summary>
    /// 複製文件
    /// </summary>
    [HttpPost("{id:guid}/copy")]
    [Authorize]
    [ProducesResponseType(typeof(FileInfoResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> CopyFile(
        Guid id,
        [FromBody] CopyFileRequest request,
        CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue) return Unauthorized();

        var result = await _fileManagementService.CopyFileAsync(
            id,
            request.TargetParentId,
            userId.Value,
            cancellationToken);

        if (!result.IsSuccess) return BadRequest(new { message = result.Error });
        return Ok(result.Data);
    }

    /// <summary>
    /// 批量刪除文件
    /// </summary>
    /// <param name="request">批量刪除請求</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>批量操作結果</returns>
    [HttpPost("batch/delete")]
    [Authorize]
    [ProducesResponseType(typeof(BatchOperationResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> BatchDelete(
        [FromBody] BatchDeleteRequest request,
        CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue)
        {
            return Unauthorized(new { message = "未授權的請求" });
        }

        if (request.FileIds == null || request.FileIds.Count == 0)
        {
            return BadRequest(new { message = "請至少選擇一個文件" });
        }

        // 永久刪除需要 SuperAdmin 權限
        if (request.Permanent && !User.IsInRole("SuperAdmin"))
        {
            return Forbid();
        }

        var result = await _fileManagementService.BatchDeleteAsync(
            request,
            userId.Value,
            null,
            cancellationToken);

        if (!result.IsSuccess)
        {
            return BadRequest(new { message = result.Error });
        }

        return Ok(result.Data);
    }

    /// <summary>
    /// 批量移動文件
    /// </summary>
    /// <param name="request">批量移動請求</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>批量操作結果</returns>
    [HttpPost("batch/move")]
    [Authorize]
    [ProducesResponseType(typeof(BatchOperationResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> BatchMove(
        [FromBody] BatchMoveRequest request,
        CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue)
        {
            return Unauthorized(new { message = "未授權的請求" });
        }

        if (request.FileIds == null || request.FileIds.Count == 0)
        {
            return BadRequest(new { message = "請至少選擇一個文件" });
        }

        var result = await _fileManagementService.BatchMoveAsync(
            request,
            null,
            cancellationToken);

        if (!result.IsSuccess)
        {
            return BadRequest(new { message = result.Error });
        }

        return Ok(result.Data);
    }

    /// <summary>
    /// 批量複製文件
    /// </summary>
    /// <param name="request">批量複製請求</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>批量操作結果</returns>
    [HttpPost("batch/copy")]
    [Authorize]
    [ProducesResponseType(typeof(BatchOperationResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> BatchCopy(
        [FromBody] BatchCopyRequest request,
        CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue)
        {
            return Unauthorized(new { message = "未授權的請求" });
        }

        if (request.FileIds == null || request.FileIds.Count == 0)
        {
            return BadRequest(new { message = "請至少選擇一個文件" });
        }

        var result = await _fileManagementService.BatchCopyAsync(
            request,
            userId.Value,
            null,
            cancellationToken);

        if (!result.IsSuccess)
        {
            return BadRequest(new { message = result.Error });
        }

        return Ok(result.Data);
    }

    /// <summary>
    /// 獲取批量操作任務狀態
    /// </summary>
    /// <param name="taskId">任務 ID</param>
    /// <returns>任務狀態</returns>
    [HttpGet("batch/status/{taskId}")]
    [Authorize]
    [ProducesResponseType(typeof(BatchOperationResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public IActionResult GetBatchOperationStatus(string taskId)
    {
        var status = _fileManagementService.GetBatchOperationStatus(taskId);

        if (status == null)
        {
            return NotFound(new { message = "任務不存在" });
        }

        return Ok(status);
    }

    /// <summary>
    /// 還原文件（從回收桶還原）
    /// </summary>
    /// <param name="id">文件 ID</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>還原結果</returns>
    [HttpPost("{id:guid}/restore")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RestoreFile(
        Guid id,
        CancellationToken cancellationToken)
    {
        var result = await _fileManagementService.RestoreFileAsync(id, cancellationToken);

        if (!result.IsSuccess)
        {
            return BadRequest(new { message = result.Error });
        }

        return Ok(new { message = "文件已還原" });
    }

    /// <summary>
    /// 批量還原文件
    /// </summary>
    /// <param name="request">批量還原請求</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>批量操作結果</returns>
    [HttpPost("batch/restore")]
    [Authorize]
    [ProducesResponseType(typeof(BatchOperationResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> BatchRestore(
        [FromBody] BatchRestoreRequest request,
        CancellationToken cancellationToken)
    {
        if (request.FileIds == null || request.FileIds.Count == 0)
        {
            return BadRequest(new { message = "請至少選擇一個文件" });
        }

        var result = await _fileManagementService.BatchRestoreAsync(
            request.FileIds,
            null,
            cancellationToken);

        if (!result.IsSuccess)
        {
            return BadRequest(new { message = result.Error });
        }

        return Ok(result.Data);
    }

    /// <summary>
    /// 掃描 wwwroot 靜態檔案
    /// </summary>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>掃描結果</returns>
    [HttpPost("static/scan")]
    [Authorize(Roles = "SuperAdmin,Admin")]
    [ProducesResponseType(typeof(ScanStaticFilesResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> ScanStaticFiles(CancellationToken cancellationToken)
    {
        var result = await _fileManagementService.ScanStaticFilesAsync(cancellationToken);

        if (!result.IsSuccess)
        {
            return BadRequest(new { message = result.Error });
        }

        return Ok(result.Data);
    }

    /// <summary>
    /// 查詢靜態檔案列表
    /// </summary>
    /// <param name="request">查詢請求</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>靜態檔案列表</returns>
    [HttpGet("static/query")]
    [Authorize]
    [ProducesResponseType(typeof(PagedResponse<StaticFileListItemResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> QueryStaticFiles(
        [FromQuery] StaticFileQueryRequest request,
        CancellationToken cancellationToken)
    {
        var result = await _fileManagementService.QueryStaticFilesAsync(request, cancellationToken);

        if (!result.IsSuccess)
        {
            return BadRequest(new { message = result.Error });
        }

        return Ok(result.Data);
    }

    /// <summary>
    /// 軟刪除靜態檔案（使用現有的刪除端點）
    /// </summary>
    /// <remarks>
    /// 靜態檔案的刪除和還原使用現有的 DELETE /{id} 和 POST /{id}/restore 端點。
    /// 這些端點會進行軟刪除，不會真正刪除物理檔案。
    /// </remarks>

    private Guid? GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim))
        {
            return null;
        }

        return Guid.TryParse(userIdClaim, out var userId) ? userId : null;
    }
}
