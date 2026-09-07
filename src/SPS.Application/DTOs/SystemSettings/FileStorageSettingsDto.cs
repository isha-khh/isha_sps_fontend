namespace SPS.Application.DTOs.SystemSettings;

public class FileStorageSettingsDto
{
    /// <summary>
    /// 本地上傳目錄 (例如: "Uploads")
    /// </summary>
    public string UploadPath { get; set; } = "Uploads";

    /// <summary>
    /// 允許的檔案副檔名 (逗號分隔，例如: ".jpg,.png,.pdf")
    /// </summary>
    public string AllowedExtensions { get; set; } = ".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx,.xls,.xlsx";

    /// <summary>
    /// 最大檔案大小 (MB)
    /// </summary>
    public long MaxFileSizeInMB { get; set; } = 10;
}
