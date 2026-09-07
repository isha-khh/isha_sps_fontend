using System.Text.Json;
using System.Text.Json.Serialization;
using SPS.Domain.Enums;

namespace SPS.Application.DTOs.AdminRole;

/// <summary>
/// JSON 轉換器：將字串或數字轉換為 UserPermission 枚舉
/// 支援 JavaScript BigInt 傳送的字串格式
/// </summary>
public class PermissionJsonConverter : JsonConverter<UserPermission>
{
    public override UserPermission Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        switch (reader.TokenType)
        {
            case JsonTokenType.String:
                var strValue = reader.GetString();
                if (long.TryParse(strValue, out var longValue))
                {
                    return (UserPermission)longValue;
                }
                throw new JsonException($"Cannot convert \"{strValue}\" to UserPermission");

            case JsonTokenType.Number:
                return (UserPermission)reader.GetInt64();

            default:
                throw new JsonException($"Unexpected token type {reader.TokenType} when parsing UserPermission");
        }
    }

    public override void Write(Utf8JsonWriter writer, UserPermission value, JsonSerializerOptions options)
    {
        writer.WriteNumberValue((long)value);
    }
}
