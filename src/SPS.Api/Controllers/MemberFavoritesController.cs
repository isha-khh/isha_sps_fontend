using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SPS.Application.DTOs.MemberFavorite;
using SPS.Application.Interfaces.IServices;
using Swashbuckle.AspNetCore.Annotations;

namespace SPS.Api.Controllers;

/// <summary>
/// 前台會員的「我的最愛」（收藏企業與需求）與「媒合資料維護」（自己從前台刊登的需求）。
/// 只能操作自己的資料，會員身分一律從 token 的 MemberId 取得。
/// </summary>
[ApiController]
[Route("api/member")]
[Produces("application/json")]
[SwaggerTag("會員最愛與媒合資料維護")]
public class MemberFavoritesController : ControllerBase
{
    private readonly IMemberFavoriteService _favorites;
    private readonly IDemandService _demands;

    public MemberFavoritesController(IMemberFavoriteService favorites, IDemandService demands)
    {
        _favorites = favorites;
        _demands = demands;
    }

    private bool IsEnterpriseMember => User.IsInRole("Supplier") || User.IsInRole("Buyer");

    private IActionResult EnterpriseOnly() =>
        StatusCode(StatusCodes.Status403Forbidden, new { error = "僅企業會員可以使用我的最愛" });

    private Guid? GetMemberId() =>
        Guid.TryParse(User.FindFirst("MemberId")?.Value, out var id) ? id : null;

    /// <summary>我的最愛清單（只列目前公開的企業與已發布的需求）</summary>
    [HttpGet("favorites")]
    [Authorize]
    [ProducesResponseType(typeof(MemberFavoritesResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetFavorites(CancellationToken ct)
    {
        var memberId = GetMemberId();
        if (memberId == null) return Unauthorized(new { error = "Invalid token" });
        var r = await _favorites.GetAsync(memberId.Value, ct);
        return r.IsSuccess ? Ok(r.Data) : BadRequest(new { error = r.Error });
    }

    /// <summary>
    /// 目前已收藏的項目 id，給收藏按鈕判斷顯示狀態用。**沒登入也可以呼叫**（回 loggedIn = false），
    /// 這樣前台頁面載入時不會因為 401 被導去登入頁。
    /// </summary>
    [HttpGet("favorites/ids")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(FavoriteIdsResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetFavoriteIds(CancellationToken ct)
    {
        var memberId = GetMemberId();
        if (memberId == null) return Ok(new FavoriteIdsResponse { LoggedIn = false });
        var ids = await _favorites.GetIdsAsync(memberId.Value, ct);
        ids.Enterprise = IsEnterpriseMember;
        return Ok(ids);
    }

    [HttpPut("favorites/companies/{companyId:guid}")]
    [Authorize]
    public async Task<IActionResult> AddCompany(Guid companyId, CancellationToken ct)
    {
        var memberId = GetMemberId();
        if (memberId == null) return Unauthorized(new { error = "Invalid token" });
        if (!IsEnterpriseMember) return EnterpriseOnly();
        var r = await _favorites.AddCompanyAsync(memberId.Value, companyId, ct);
        return r.IsSuccess ? NoContent() : BadRequest(new { error = r.Error });
    }

    [HttpDelete("favorites/companies/{companyId:guid}")]
    [Authorize]
    public async Task<IActionResult> RemoveCompany(Guid companyId, CancellationToken ct)
    {
        var memberId = GetMemberId();
        if (memberId == null) return Unauthorized(new { error = "Invalid token" });
        await _favorites.RemoveCompanyAsync(memberId.Value, companyId, ct);
        return NoContent();
    }

    [HttpPut("favorites/demands/{demandId:int}")]
    [Authorize]
    public async Task<IActionResult> AddDemand(int demandId, CancellationToken ct)
    {
        var memberId = GetMemberId();
        if (memberId == null) return Unauthorized(new { error = "Invalid token" });
        if (!IsEnterpriseMember) return EnterpriseOnly();
        var r = await _favorites.AddDemandAsync(memberId.Value, demandId, ct);
        return r.IsSuccess ? NoContent() : BadRequest(new { error = r.Error });
    }

    [HttpDelete("favorites/demands/{demandId:int}")]
    [Authorize]
    public async Task<IActionResult> RemoveDemand(int demandId, CancellationToken ct)
    {
        var memberId = GetMemberId();
        if (memberId == null) return Unauthorized(new { error = "Invalid token" });
        await _favorites.RemoveDemandAsync(memberId.Value, demandId, ct);
        return NoContent();
    }

    /// <summary>媒合資料維護：自己從前台「我要刊登」送出的需求（待審核或已上架）</summary>
    [HttpGet("demands")]
    [Authorize]
    [ProducesResponseType(typeof(List<MemberDemandResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMyDemands(CancellationToken ct)
    {
        var memberId = GetMemberId();
        if (memberId == null) return Unauthorized(new { error = "Invalid token" });
        var r = await _demands.GetMemberDemandsAsync(memberId.Value, ct);
        return r.IsSuccess ? Ok(r.Data) : BadRequest(new { error = r.Error });
    }

    /// <summary>修改自己刊登、還沒上架的需求（已上架的要聯絡承辦單位）</summary>
    [HttpPut("demands/{id:int}")]
    [Authorize]
    [ProducesResponseType(typeof(MemberDemandResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> UpdateMyDemand(int id, [FromBody] UpdateMemberDemandRequest request, CancellationToken ct)
    {
        var memberId = GetMemberId();
        if (memberId == null) return Unauthorized(new { error = "Invalid token" });
        var r = await _demands.UpdateByMemberAsync(memberId.Value, id, request, ct);
        if (r.IsSuccess) return Ok(r.Data);
        return r.Error == "需求不存在" ? NotFound(new { error = r.Error }) : BadRequest(new { error = r.Error });
    }

    /// <summary>撤回自己刊登、還沒上架的需求</summary>
    [HttpDelete("demands/{id:int}")]
    [Authorize]
    public async Task<IActionResult> DeleteMyDemand(int id, CancellationToken ct)
    {
        var memberId = GetMemberId();
        if (memberId == null) return Unauthorized(new { error = "Invalid token" });
        var r = await _demands.DeleteByMemberAsync(memberId.Value, id, ct);
        if (r.IsSuccess) return NoContent();
        return r.Error == "需求不存在" ? NotFound(new { error = r.Error }) : BadRequest(new { error = r.Error });
    }
}
