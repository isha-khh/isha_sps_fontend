using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;
using SPS.Api.Attributes;
using SPS.Application.DTOs.Inquiry;
using SPS.Application.DTOs.SystemSettings;
using SPS.Application.Interfaces.IServices;
using SPS.Application.Services;
using SPS.Domain.Enums;
using Swashbuckle.AspNetCore.Annotations;

namespace SPS.Api.Controllers;

/// <summary>
/// 詢問單：前台各個「留下資料等人回覆」的表單（提案、訂閱解方、下載申請、索取補助資料、訂閱電子報）送到這裡，
/// 後台「詢問單」收件匣檢視與標記處理進度。
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
[SwaggerTag("詢問單 API")]
public class InquiryController : ControllerBase
{
    private const int AnonymousPerHour = 10;
    private const int MemberPerHour = 30;

    private const string NotificationCategory = "StaffNotification";

    private readonly IInquiryService _inquiryService;
    private readonly IMemoryCache _cache;
    private readonly ISystemSettingService _settingService;
    private readonly IStaffNotifier _notifier;
    private readonly INewsService _newsService;
    private readonly SPS.Api.Services.AttachmentLinks _attachments;

    public InquiryController(IInquiryService inquiryService, IMemoryCache cache, ISystemSettingService settingService, IStaffNotifier notifier, INewsService newsService, SPS.Api.Services.AttachmentLinks attachments)
    {
        _newsService = newsService;
        _attachments = attachments;
        _inquiryService = inquiryService;
        _cache = cache;
        _settingService = settingService;
        _notifier = notifier;
    }

    /// <summary>
    /// 前台送出詢問單。訂閱解方要登入會員、提案要企業會員，其他種類匿名也可以（要同意個資告知）；
    /// 有登入就記錄是誰送的。同一個 IP／會員每小時有送出次數上限。
    /// </summary>
    [HttpPost]
    [AllowAnonymous]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status429TooManyRequests)]
    public async Task<IActionResult> Create([FromBody] CreateInquiryRequest request, CancellationToken ct)
    {
        var failure = await SubmitAsync(request, ct);
        return failure ?? Ok(new { success = true });
    }

    /// <summary>
    /// 服務專區的「立即下載」：使用者填完資料並同意個資告知後，存成「下載申請」詢問單（針對這個服務項目），
    /// **成功後直接回傳這個項目的附件下載連結**。附件不在公開頁面列出（公開的項目資料沒有附件 Id），只有送出這張表單才拿得到。
    /// 沿用詢問單的規則：匿名也可以、要同意個資告知、誘捕欄位、每個 IP 或會員每小時送出次數上限。
    /// </summary>
    [HttpPost("download/{newsId:int}")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(List<SPS.Application.DTOs.News.NewsAttachmentDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status429TooManyRequests)]
    public async Task<IActionResult> DownloadServeItem(int newsId, [FromBody] CreateInquiryRequest request, CancellationToken ct)
    {
        var news = await _newsService.GetByIdAsync(newsId, ct);
        if (!news.IsSuccess || news.Data is not { Published: true } item || item.Section != Domain.Enums.NewsSection.Serve)
            return NotFound(new { error = "找不到這個服務項目" });
        if (item.AttachmentFileIds.Count == 0) return BadRequest(new { error = "這個項目目前沒有可下載的文件" });

        // 針對的項目與種類由伺服器決定，不信任前端送來的值
        request.Type = Domain.Enums.InquiryType.DownloadRequest;
        request.TargetType = "ServeItem";
        request.TargetKey = newsId.ToString();
        request.TargetTitle = item.Title;

        var failure = await SubmitAsync(request, ct);
        if (failure != null) return failure;

        return Ok(await _attachments.ResolveAsync(item.AttachmentFileIds, ct));
    }

    /// <summary>送出詢問單（共用：次數限制＋建立）；成功回傳 null，失敗回傳要回給前端的結果</summary>
    private async Task<IActionResult?> SubmitAsync(CreateInquiryRequest request, CancellationToken ct)
    {
        Guid? memberId = Guid.TryParse(User.FindFirst("MemberId")?.Value, out var parsed) ? parsed : null;
        var isEnterprise = memberId != null && (User.IsInRole("Supplier") || User.IsInRole("Buyer"));
        var ip = HttpContext.Connection.RemoteIpAddress?.ToString();

        var key = memberId != null ? $"inquiry:m:{memberId}" : $"inquiry:ip:{ip}";
        var limit = memberId != null ? MemberPerHour : AnonymousPerHour;
        var counter = _cache.GetOrCreate(key, entry =>
        {
            entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromHours(1);
            return new int[1];
        })!;
        if (Interlocked.Increment(ref counter[0]) > limit)
        {
            return StatusCode(StatusCodes.Status429TooManyRequests, new { error = "送出次數過多，請稍後再試" });
        }

        var r = await _inquiryService.CreateAsync(request, memberId, isEnterprise, ip, ct);
        return r.IsSuccess ? null : BadRequest(new { error = r.Error });
    }

    /// <summary>後台：詢問單列表</summary>
    [HttpGet]
    [Authorize(Roles = "Admin")]
    [RequirePermission(UserPermission.CustomerService)]
    public async Task<IActionResult> GetPaged([FromQuery] InquiryQueryParameters parameters, CancellationToken ct)
    {
        var r = await _inquiryService.GetPagedAsync(parameters, ct);
        return r.IsSuccess ? Ok(r.Data) : BadRequest(new { error = r.Error });
    }

    /// <summary>後台：各處理狀態的數量（收件匣上方的統計）</summary>
    [HttpGet("counts")]
    [Authorize(Roles = "Admin")]
    [RequirePermission(UserPermission.CustomerService)]
    public async Task<IActionResult> GetCounts(CancellationToken ct)
    {
        var r = await _inquiryService.GetCountsAsync(ct);
        return r.IsSuccess ? Ok(r.Data) : BadRequest(new { error = r.Error });
    }

    /// <summary>
    /// 後台：某一類對象底下每個項目收到的詢問單數量（例如 targetType=SupportResource，補助資源列表的「回應數量」），
    /// 回傳 { 項目編號: 數量 }
    /// </summary>
    [HttpGet("counts-by-target")]
    [Authorize(Roles = "Admin")]
    [RequirePermission(UserPermission.CustomerService)]
    public async Task<IActionResult> GetCountsByTarget([FromQuery] string targetType, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(targetType)) return BadRequest(new { error = "請指定 targetType" });
        var r = await _inquiryService.GetCountsByTargetAsync(targetType, ct);
        return r.IsSuccess ? Ok(r.Data) : BadRequest(new { error = r.Error });
    }

    /// <summary>
    /// 後台：匯出詢問單為 Excel。可用 targetType／targetKey 只匯出某一個項目的回應（例如某筆補助資源），
    /// 也可再用 type／status／search 縮小範圍；最多 10000 筆
    /// </summary>
    [HttpGet("export")]
    [Authorize(Roles = "Admin")]
    [RequirePermission(UserPermission.CustomerService)]
    [ProducesResponseType(typeof(FileContentResult), StatusCodes.Status200OK)]
    public async Task<IActionResult> Export([FromQuery] InquiryQueryParameters parameters, CancellationToken ct)
    {
        var r = await _inquiryService.ListForExportAsync(parameters, 10000, ct);
        if (!r.IsSuccess) return BadRequest(new { error = r.Error });

        using var workbook = new ClosedXML.Excel.XLWorkbook();
        var ws = workbook.Worksheets.Add("回應");
        var headers = new[] { "送出時間", "種類", "針對項目", "工廠／公司名稱", "姓名", "電話", "信箱", "單位", "職稱", "補充說明", "處理狀態", "處理備註" };
        for (var c = 0; c < headers.Length; c++)
        {
            var cell = ws.Cell(1, c + 1);
            cell.Value = headers[c];
            cell.Style.Font.Bold = true;
            cell.Style.Fill.BackgroundColor = ClosedXML.Excel.XLColor.LightGray;
        }

        var row = 2;
        foreach (var i in r.Data!)
        {
            var values = new string?[]
            {
                // 資料庫存 UTC，匯出用台灣時間
                i.CreatedTime.ToUniversalTime().AddHours(8).ToString("yyyy-MM-dd HH:mm"),
                i.TypeName, i.TargetTitle, i.CompanyName, i.Name, i.Phone, i.Email, i.Unit, i.JobTitle, i.Message,
                i.Status switch { InquiryStatus.New => "新進", InquiryStatus.InProgress => "處理中", _ => "已結案" },
                i.HandlerNote,
            };
            for (var c = 0; c < values.Length; c++)
            {
                var text = values[c] ?? string.Empty;
                // 欄位值以 = + - @ 開頭，Excel 會當成公式執行：加單引號前綴擋掉（CSV／Excel 注入）
                if (text.Length > 0 && "=+-@".Contains(text[0])) text = "'" + text;
                ws.Cell(row, c + 1).Value = text;
            }
            row++;
        }
        ws.Columns().AdjustToContents(1, row, 10, 50);

        using var stream = new MemoryStream();
        workbook.SaveAs(stream);
        var name = string.IsNullOrWhiteSpace(parameters.TargetKey) ? "詢問單回應" : $"回應_{parameters.TargetType}_{parameters.TargetKey}";
        return File(stream.ToArray(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", $"{name}_{DateTime.UtcNow.AddHours(8):yyyyMMdd}.xlsx");
    }

    /// <summary>後台：承辦人員通知設定（有新的詢問單或會員刊登需求時寄信給哪些信箱）</summary>
    [HttpGet("notification-settings")]
    [Authorize(Roles = "Admin")]
    [RequirePermission(UserPermission.CustomerService)]
    [ProducesResponseType(typeof(StaffNotificationSettingsDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetNotificationSettings()
    {
        var result = await _settingService.GetSettingAsync<StaffNotificationSettingsDto>(NotificationCategory);
        return result.IsSuccess ? Ok(result.Data ?? new StaffNotificationSettingsDto()) : BadRequest(new { error = result.Error });
    }

    /// <summary>後台：更新承辦人員通知設定。收件信箱最多 10 個，每個都要是有效的信箱</summary>
    [HttpPut("notification-settings")]
    [Authorize(Roles = "Admin")]
    [RequirePermission(UserPermission.CustomerService)]
    [ProducesResponseType(typeof(StaffNotificationSettingsDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> UpdateNotificationSettings([FromBody] StaffNotificationSettingsDto request)
    {
        var emails = new List<string>();
        foreach (var raw in request.Recipients ?? new List<string>())
        {
            var value = raw?.Trim();
            if (string.IsNullOrEmpty(value)) continue;
            if (!new System.ComponentModel.DataAnnotations.EmailAddressAttribute().IsValid(value) || value.Length > 320)
                return BadRequest(new { error = $"「{value}」不是有效的信箱" });
            if (!emails.Contains(value, StringComparer.OrdinalIgnoreCase)) emails.Add(value);
        }

        if (emails.Count > StaffNotifier.MaxRecipients) return BadRequest(new { error = $"收件信箱最多 {StaffNotifier.MaxRecipients} 個" });
        if (request.Enabled && emails.Count == 0) return BadRequest(new { error = "要啟用通知，請至少填一個收件信箱" });

        var settings = new StaffNotificationSettingsDto { Enabled = request.Enabled, Recipients = emails };
        var result = await _settingService.UpdateSettingAsync(NotificationCategory, settings);
        return result.IsSuccess ? Ok(settings) : BadRequest(new { error = result.Error });
    }

    /// <summary>後台：寄一封測試信給目前已儲存的收件信箱，確認信件有寄出（每分鐘最多一次）</summary>
    [HttpPost("notification-settings/test")]
    [Authorize(Roles = "Admin")]
    [RequirePermission(UserPermission.CustomerService)]
    public async Task<IActionResult> SendTestNotification(CancellationToken ct)
    {
        if (_cache.TryGetValue("staff-notify-test", out _)) return StatusCode(StatusCodes.Status429TooManyRequests, new { error = "請稍後再試（每分鐘最多寄一次測試信）" });
        _cache.Set("staff-notify-test", true, TimeSpan.FromMinutes(1));

        var sent = await _notifier.SendTestAsync(ct);
        return sent > 0
            ? Ok(new { sent })
            : BadRequest(new { error = "沒有寄出：請先儲存設定並開啟通知，且至少要有一個收件信箱；若已設定，請檢查系統設定的郵件服務是否啟用" });
    }

    /// <summary>後台：詢問單詳情</summary>
    [HttpGet("{id:guid}")]
    [Authorize(Roles = "Admin")]
    [RequirePermission(UserPermission.CustomerService)]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
    {
        var r = await _inquiryService.GetByIdAsync(id, ct);
        return r.IsSuccess ? Ok(r.Data) : NotFound(new { error = r.Error });
    }

    /// <summary>後台：更新處理狀態與備註</summary>
    [HttpPut("{id:guid}")]
    [Authorize(Roles = "Admin")]
    [RequirePermission(UserPermission.CustomerService)]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateInquiryRequest request, CancellationToken ct)
    {
        Guid? userId = Guid.TryParse(User.FindFirst("UserId")?.Value, out var parsed) ? parsed : null;
        var r = await _inquiryService.UpdateAsync(id, request, userId, ct);
        if (r.IsSuccess) return Ok(r.Data);
        return r.Error?.Contains("不存在") == true ? NotFound(new { error = r.Error }) : BadRequest(new { error = r.Error });
    }

    /// <summary>後台：回覆會員（寫進該會員的收件匣，可同時寄信）。只有登入會員送出的詢問單可以回覆</summary>
    [HttpPost("{id:guid}/reply")]
    [Authorize(Roles = "Admin")]
    [RequirePermission(UserPermission.CustomerService)]
    public async Task<IActionResult> Reply(Guid id, [FromBody] ReplyInquiryRequest request, CancellationToken ct)
    {
        Guid? userId = Guid.TryParse(User.FindFirst("UserId")?.Value, out var parsed) ? parsed : null;
        var r = await _inquiryService.ReplyAsync(id, request, userId, ct);
        if (r.IsSuccess) return Ok(r.Data);
        return r.Error?.Contains("不存在") == true ? NotFound(new { error = r.Error }) : BadRequest(new { error = r.Error });
    }

    /// <summary>後台：刪除詢問單</summary>
    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "Admin")]
    [RequirePermission(UserPermission.CustomerService)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        var r = await _inquiryService.DeleteAsync(id, ct);
        return r.IsSuccess ? NoContent() : NotFound(new { error = r.Error });
    }
}
