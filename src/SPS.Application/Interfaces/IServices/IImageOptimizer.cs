namespace SPS.Application.Interfaces.IServices;

/// <summary>圖片轉成 WebP 的結果（<see cref="Data"/> 已經定位在開頭，呼叫端負責釋放）。</summary>
public sealed record ImageOptimizeResult(Stream Data, string FileName, string ContentType, long Length, int Width, int Height, bool Resized);

/// <summary>
/// 上傳圖片最佳化：JPG／PNG／BMP 轉成 WebP，最長邊超過上限就等比例縮小（不放大）；
/// WebP 本身只在超過上限時縮小。GIF（動圖）、SVG 與其他檔案一律不處理。
/// </summary>
public interface IImageOptimizer
{
    /// <summary>
    /// 嘗試最佳化。不適用（格式不支援、解不開、尺寸異常）或轉出來沒有比較小（也沒縮圖）時回 <c>null</c>，呼叫端照原檔儲存。
    /// </summary>
    ImageOptimizeResult? TryOptimize(Stream input, string fileName);
}
