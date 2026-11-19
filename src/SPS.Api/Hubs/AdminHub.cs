using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using SPS.Application.Interfaces.IServices;
using SPS.Domain.Constants;
using SPS.Domain.Enums;

namespace SPS.Api.Hubs;

/// <summary>
/// 後台即時通知 Hub（只有後台使用者能連）：背景工作（目前是「內容檢查」）的進度即時推給在線的管理員，鈴鐺通知會顯示。
/// 只有伺服器推給客戶端（客戶端沒有可呼叫的方法）。連線時依權限加進群組：有「系統設定」權限的才收得到內容檢查的進度，
/// 權限來自登入時簽進 token 的 Permissions claim（跟 <c>[RequirePermission]</c> 同一套判斷，只看 claim 不夠，要同時是後台身分，
/// 因為會員 token 也有同名的 Permissions claim 但意義不同）。
/// </summary>
[Authorize(Roles = "Admin")]
public class AdminHub : Hub
{
    /// <summary>有「系統設定」權限的連線所在的群組</summary>
    public const string SettingsGroup = "ManageSettings";

    public override async Task OnConnectedAsync()
    {
        var user = Context.User;
        if (user?.IsInRole("Admin") == true
            && long.TryParse(user.FindFirst(AuthClaimTypes.AdminPermissions)?.Value, out var value)
            && ((UserPermission)value).HasAny(UserPermission.ManageSettings))
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, SettingsGroup);
        }

        await base.OnConnectedAsync();
    }
}

/// <summary><see cref="IAdminRealtimeNotifier"/> 的 SignalR 實作：推給「系統設定」群組。</summary>
public sealed class AdminRealtimeNotifier : IAdminRealtimeNotifier
{
    private readonly IHubContext<AdminHub> _hub;

    public AdminRealtimeNotifier(IHubContext<AdminHub> hub) => _hub = hub;

    public Task PublishAsync(string eventName, object payload, CancellationToken ct = default) =>
        _hub.Clients.Group(AdminHub.SettingsGroup).SendAsync(eventName, payload, ct);
}
