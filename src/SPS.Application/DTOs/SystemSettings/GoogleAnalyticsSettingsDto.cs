using System.Text.Json;

namespace SPS.Application.DTOs.SystemSettings;

public class GoogleAnalyticsSettingsDto
{
    public string PropertyId { get; set; } = string.Empty;
    public JsonElement? CredentialsJson { get; set; }
}
