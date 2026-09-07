using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SPS.Application.DTOs.Demand;
using SPS.Application.Interfaces.IServices;
using Swashbuckle.AspNetCore.Annotations;

namespace SPS.Api.Controllers;

/// <summary>
/// 需求管理 API
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
[SwaggerTag("需求管理 API")]
public class DemandController : ControllerBase
{
    private readonly IDemandService _demandService;
    private readonly IAdminUserService _adminUserService;

    /// <summary>
    /// 需求控制器建構函數
    /// </summary>
    public DemandController(IDemandService demandService, IAdminUserService adminUserService)
    {
        _demandService = demandService;
        _adminUserService = adminUserService;
    }

    /// <summary>
    /// 獲取需求分頁列表
    /// </summary>
    /// <param name="p">查詢參數</param>
    /// <param name="ct">取消令牌</param>
    /// <returns>需求分頁列表</returns>
    /// <response code="200">成功返回需求列表</response>
    /// <response code="400">請求參數錯誤</response>
    [HttpGet]
    [AllowAnonymous]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetPaged([FromQuery] DemandQueryParameters p, CancellationToken ct)
    {
        var r = await _demandService.GetPagedAsync(p, ct);
        return r.IsSuccess ? Ok(r.Data) : BadRequest(new { error = r.Error });
    }

    /// <summary>
    /// 根據 ID 獲取需求詳情
    /// </summary>
    /// <param name="id">需求 ID</param>
    /// <param name="ct">取消令牌</param>
    /// <returns>需求詳情</returns>
    /// <response code="200">成功返回需求詳情</response>
    /// <response code="404">需求不存在</response>
    [HttpGet("{id}")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(int id, CancellationToken ct)
    {
        var r = await _demandService.GetByIdAsync(id, ct);
        return r.IsSuccess ? Ok(r.Data) : NotFound(new { error = r.Error });
    }

    /// <summary>
    /// 創建新需求
    /// </summary>
    /// <param name="req">創建需求請求</param>
    /// <param name="ct">取消令牌</param>
    /// <returns>創建的需求</returns>
    /// <response code="201">需求創建成功</response>
    /// <response code="400">請求數據無效</response>
    /// <response code="401">未授權</response>
    [HttpPost]
    [Authorize]
    [ProducesResponseType(typeof(object), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Create([FromBody] CreateDemandRequest req, CancellationToken ct)
    {
        var r = await _demandService.CreateAsync(req, ct);
        return r.IsSuccess ? CreatedAtAction(nameof(GetById), new { id = r.Data!.Id }, r.Data) : BadRequest(new { error = r.Error });
    }

    /// <summary>
    /// 更新需求
    /// </summary>
    /// <param name="id">需求 ID</param>
    /// <param name="req">更新需求請求</param>
    /// <param name="ct">取消令牌</param>
    /// <returns>更新後的需求</returns>
    /// <response code="200">需求更新成功</response>
    /// <response code="400">請求數據無效</response>
    /// <response code="401">未授權</response>
    /// <response code="404">需求不存在</response>
    [HttpPut("{id}")]
    [Authorize]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateDemandRequest req, CancellationToken ct)
    {
        string? publisherEmail = null;
        if (req.Published == true)
        {
            var userIdStr = User.FindFirst("UserId")?.Value;
            if (Guid.TryParse(userIdStr, out var userId))
            {
                var userResult = await _adminUserService.GetByIdAsync(userId, ct);
                publisherEmail = userResult.IsSuccess ? userResult.Data?.Email : null;
            }
        }

        var r = await _demandService.UpdateAsync(id, req, publisherEmail, ct);
        return r.IsSuccess ? Ok(r.Data) : BadRequest(new { error = r.Error });
    }

    /// <summary>
    /// 刪除需求
    /// </summary>
    /// <param name="id">需求 ID</param>
    /// <param name="ct">取消令牌</param>
    /// <returns>無內容</returns>
    /// <response code="204">需求刪除成功</response>
    /// <response code="401">未授權</response>
    /// <response code="404">需求不存在</response>
    [HttpDelete("{id}")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
    {
        var r = await _demandService.DeleteAsync(id, ct);
        return r.IsSuccess ? NoContent() : NotFound(new { error = r.Error });
    }

    /// <summary>
    /// 獲取需求統計數據
    /// </summary>
    /// <param name="ct">取消令牌</param>
    /// <returns>需求統計數據</returns>
    /// <response code="200">成功返回統計數據</response>
    [HttpGet("statistics")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetStatistics(CancellationToken ct)
    {
        var r = await _demandService.GetStatisticsAsync(ct);
        return r.IsSuccess ? Ok(r.Data) : BadRequest(new { error = r.Error });
    }

    /// <summary>
    /// 依標籤查詢相似供給端業者（依重疊比例排序）
    /// </summary>
    /// <param name="tagIds">標籤 ID 清單</param>
    /// <param name="ct">取消令牌</param>
    /// <returns>相似業者清單</returns>
    [HttpGet("similar-companies")]
    [Authorize]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetSimilarCompanies([FromQuery] List<int> tagIds, CancellationToken ct)
    {
        var r = await _demandService.GetSimilarCompaniesAsync(tagIds, ct);
        return r.IsSuccess ? Ok(r.Data) : BadRequest(new { error = r.Error });
    }

    /// <summary>
    /// AI 語意搜尋：依需求內容找出語意相似的供給端業者
    /// </summary>
    /// <param name="id">需求 ID</param>
    /// <param name="ct">取消令牌</param>
    /// <returns>相似業者清單（依語意相關度排序）</returns>
    [HttpGet("{id}/similar-companies-ai")]
    [Authorize]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetSimilarCompaniesByVector(int id, CancellationToken ct)
    {
        var r = await _demandService.GetSimilarCompaniesByVectorAsync(id, ct: ct);
        return r.IsSuccess ? Ok(r.Data) : BadRequest(new { error = r.Error });
    }

    /// <summary>
    /// AI 語意搜尋即時預覽：新增需求頁尚未儲存前，用當下輸入的名稱/介紹/標籤做一次性查詢，
    /// 不寫入索引。
    /// </summary>
    /// <param name="request">名稱/介紹/標籤</param>
    /// <param name="ct">取消令牌</param>
    /// <returns>相似業者清單（依語意相關度排序）</returns>
    [HttpPost("similar-companies-ai/preview")]
    [Authorize]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    public async Task<IActionResult> PreviewSimilarCompaniesByVector([FromBody] PreviewSimilarCompaniesRequest request, CancellationToken ct)
    {
        var r = await _demandService.PreviewSimilarCompaniesByVectorAsync(request.Name, request.Introduction, request.TagIds, ct: ct);
        return r.IsSuccess ? Ok(r.Data) : BadRequest(new { error = r.Error });
    }

    /// <summary>
    /// 取得需求目前綁定的標籤
    /// </summary>
    /// <param name="id">需求 ID</param>
    /// <param name="ct">取消令牌</param>
    /// <returns>需求標籤綁定</returns>
    /// <response code="200">成功返回標籤綁定</response>
    /// <response code="404">需求不存在</response>
    [HttpGet("{id}/tags")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(DemandTagsResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetTags(int id, CancellationToken ct)
    {
        var r = await _demandService.GetTagsAsync(id, ct);
        return r.IsSuccess ? Ok(r.Data) : NotFound(new { error = r.Error });
    }

    /// <summary>
    /// 設定需求標籤（覆寫綁定，支援多個標籤；傳入空集合代表清除）
    /// </summary>
    /// <param name="id">需求 ID</param>
    /// <param name="req">標籤設定請求</param>
    /// <param name="ct">取消令牌</param>
    /// <returns>更新後的需求標籤綁定</returns>
    /// <response code="200">設定成功</response>
    /// <response code="400">請求數據無效</response>
    /// <response code="401">未授權</response>
    /// <response code="404">需求不存在</response>
    [HttpPut("{id}/tags")]
    [Authorize]
    [ProducesResponseType(typeof(DemandTagsResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> SetTags(int id, [FromBody] SetDemandTagsRequest req, CancellationToken ct)
    {
        var r = await _demandService.SetTagsAsync(id, req, ct);
        if (r.IsSuccess) return Ok(r.Data);
        return r.Error?.Contains("不存在") == true
            ? NotFound(new { error = r.Error })
            : BadRequest(new { error = r.Error });
    }

    [HttpGet("{id}/notifications")]
    [Authorize]
    public async Task<IActionResult> GetNotifications(int id, CancellationToken ct)
    {
        var r = await _demandService.GetNotificationsAsync(id, ct);
        return r.IsSuccess ? Ok(r.Data) : BadRequest(new { error = r.Error });
    }
}
