using SPS.Application.Common;
using SPS.Application.DTOs.ProTrack;
using SPS.Application.DTOs.SystemSettings;

namespace SPS.Application.Interfaces.IServices;

public interface IProTrackService
{
    Task<Result<List<ProTrackSubmissionItem>>> GetSubmissionsAsync(CancellationToken ct = default);
    Task<Result<ProTrackImportResult>> ParseSubmissionAsync(string submissionId, CancellationToken ct = default);

    /// <summary>
    /// 使用指定設定測試連線（不儲存），回傳找到的記錄筆數
    /// </summary>
    Task<Result<int>> TestConnectionAsync(ProTrackSettingsDto settings, CancellationToken ct = default);
}
