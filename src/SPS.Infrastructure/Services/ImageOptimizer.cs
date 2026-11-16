using Microsoft.Extensions.Logging;
using SkiaSharp;
using SPS.Application.Interfaces.IServices;

namespace SPS.Infrastructure.Services;

/// <summary>
/// 用 SkiaSharp 把上傳的圖片轉成 WebP（品質：JPG／BMP 80、PNG 90），最長邊超過 <see cref="MaxEdge"/> 就等比例縮小。
/// 會依 EXIF 方向把手機照片轉正（轉成 WebP 後不帶 EXIF，不轉正會變橫的）。
/// </summary>
public class ImageOptimizer : IImageOptimizer
{
    /// <summary>最長邊上限（像素）；2560 對一般螢幕與 Retina 都夠用</summary>
    internal const int MaxEdge = 2560;

    /// <summary>照片（JPG／BMP）的 WebP 品質</summary>
    internal const int PhotoQuality = 80;

    /// <summary>PNG（多半是圖形、截圖、LOGO）的 WebP 品質，邊緣文字比照片敏感，給高一點</summary>
    internal const int PngQuality = 90;

    /// <summary>解碼前的像素上限，防止小檔案解開後吃光記憶體（約 1 億像素）</summary>
    private const long MaxPixels = 100_000_000;

    private readonly ILogger<ImageOptimizer> _logger;

    public ImageOptimizer(ILogger<ImageOptimizer> logger)
    {
        _logger = logger;
    }

    public ImageOptimizeResult? TryOptimize(Stream input, string fileName)
    {
        var extension = Path.GetExtension(fileName).ToLowerInvariant();
        var isWebp = extension == ".webp";
        if (extension is not (".jpg" or ".jpeg" or ".png" or ".bmp" or ".webp")) return null;

        try
        {
            if (input.CanSeek) input.Position = 0;
            using var data = SKData.Create(input);
            if (data == null) return null;
            using var codec = SKCodec.Create(data);
            if (codec == null) return null;

            var info = codec.Info;
            if (info.Width <= 0 || info.Height <= 0 || (long)info.Width * info.Height > MaxPixels) return null;
            // 實際內容是 GIF（副檔名被改過）等其他格式就不處理
            if (codec.EncodedFormat is not (SKEncodedImageFormat.Jpeg or SKEncodedImageFormat.Png or SKEncodedImageFormat.Bmp or SKEncodedImageFormat.Webp)) return null;

            var rotated = codec.EncodedOrigin is SKEncodedOrigin.LeftTop or SKEncodedOrigin.RightTop or SKEncodedOrigin.RightBottom or SKEncodedOrigin.LeftBottom;
            var outWidth = rotated ? info.Height : info.Width;
            var outHeight = rotated ? info.Width : info.Height;
            var scale = Math.Max(outWidth, outHeight) > MaxEdge ? (double)MaxEdge / Math.Max(outWidth, outHeight) : 1d;
            var needsResize = scale < 1d;

            // WebP 本身已經是目標格式：沒超過尺寸上限就不用重新編碼（避免畫質再損失一次）
            if (isWebp && !needsResize) return null;

            using var decoded = SKBitmap.Decode(codec);
            if (decoded == null) return null;

            using var oriented = ApplyOrigin(decoded, codec.EncodedOrigin);
            var targetWidth = needsResize ? Math.Max(1, (int)Math.Round(oriented.Width * scale)) : oriented.Width;
            var targetHeight = needsResize ? Math.Max(1, (int)Math.Round(oriented.Height * scale)) : oriented.Height;

            using var final = needsResize
                ? oriented.Resize(new SKImageInfo(targetWidth, targetHeight, oriented.ColorType, oriented.AlphaType), SKFilterQuality.High)
                : oriented.Copy();
            if (final == null) return null;

            var quality = extension == ".png" ? PngQuality : PhotoQuality;
            using var image = SKImage.FromBitmap(final);
            using var encoded = image.Encode(SKEncodedImageFormat.Webp, quality);
            if (encoded == null) return null;

            var originalLength = input.CanSeek ? input.Length : data.Size;
            // 轉出來沒有比較小、也沒縮圖（例如本來就很小的 PNG 小圖示）→ 維持原檔
            if (!needsResize && encoded.Size >= originalLength) return null;

            var output = new MemoryStream(encoded.ToArray());
            var newName = Path.ChangeExtension(Path.GetFileName(fileName), ".webp");
            _logger.LogInformation("Image optimized {File}: {OldBytes} → {NewBytes} bytes, {W}x{H}{Resized}",
                fileName, originalLength, output.Length, final.Width, final.Height, needsResize ? " (resized)" : "");
            return new ImageOptimizeResult(output, newName, "image/webp", output.Length, final.Width, final.Height, needsResize);
        }
        catch (Exception ex)
        {
            // 轉檔失敗不能讓上傳失敗：照原檔儲存
            _logger.LogWarning(ex, "Image optimization failed for {File}, storing original", fileName);
            return null;
        }
        finally
        {
            if (input.CanSeek) input.Position = 0;
        }
    }

    /// <summary>依 EXIF 方向轉正。</summary>
    private static SKBitmap ApplyOrigin(SKBitmap source, SKEncodedOrigin origin)
    {
        if (origin is SKEncodedOrigin.TopLeft or SKEncodedOrigin.Default) return source.Copy();

        var swap = origin is SKEncodedOrigin.LeftTop or SKEncodedOrigin.RightTop or SKEncodedOrigin.RightBottom or SKEncodedOrigin.LeftBottom;
        var width = swap ? source.Height : source.Width;
        var height = swap ? source.Width : source.Height;
        var result = new SKBitmap(new SKImageInfo(width, height, source.ColorType, source.AlphaType));
        using var canvas = new SKCanvas(result);
        switch (origin)
        {
            case SKEncodedOrigin.TopRight: // 水平鏡射
                canvas.Translate(width, 0);
                canvas.Scale(-1, 1);
                break;
            case SKEncodedOrigin.BottomRight: // 轉 180 度
                canvas.Translate(width, height);
                canvas.RotateDegrees(180);
                break;
            case SKEncodedOrigin.BottomLeft: // 垂直鏡射
                canvas.Translate(0, height);
                canvas.Scale(1, -1);
                break;
            case SKEncodedOrigin.LeftTop: // 轉置：(x, y) → (y, x)
                canvas.SetMatrix(new SKMatrix { ScaleX = 0, SkewX = 1, TransX = 0, SkewY = 1, ScaleY = 0, TransY = 0, Persp2 = 1 });
                break;
            case SKEncodedOrigin.RightTop: // 順時針轉 90 度
                canvas.Translate(width, 0);
                canvas.RotateDegrees(90);
                break;
            case SKEncodedOrigin.RightBottom: // 反轉置：(x, y) → (H - y, W - x)
                canvas.SetMatrix(new SKMatrix { ScaleX = 0, SkewX = -1, TransX = width, SkewY = -1, ScaleY = 0, TransY = height, Persp2 = 1 });
                break;
            case SKEncodedOrigin.LeftBottom: // 逆時針轉 90 度
                canvas.Translate(0, height);
                canvas.RotateDegrees(270);
                break;
        }

        canvas.DrawBitmap(source, 0, 0);
        return result;
    }
}
