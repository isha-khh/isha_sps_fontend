using System.Net;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using SPS.Domain.Exceptions;

namespace SPS.Api.Middleware;

/// <summary>
/// 全局異常處理中間件
/// </summary>
public class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;

    public ExceptionHandlingMiddleware(
        RequestDelegate next,
        ILogger<ExceptionHandlingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            await HandleExceptionAsync(context, ex);
        }
    }

    private async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        context.Response.ContentType = "application/json";

        var (statusCode, message) = exception switch
        {
            ValidationException validationEx => (
                HttpStatusCode.BadRequest,
                JsonSerializer.Serialize(new
                {
                    error = validationEx.Message,
                    errors = validationEx.Errors
                })
            ),
            EntityNotFoundException => (
                HttpStatusCode.NotFound,
                JsonSerializer.Serialize(new { error = exception.Message })
            ),
            DomainException => (
                HttpStatusCode.BadRequest,
                JsonSerializer.Serialize(new { error = exception.Message })
            ),
            DbUpdateException dbUpdateEx => HandleDbUpdateException(dbUpdateEx),
            _ => (
                HttpStatusCode.InternalServerError,
                JsonSerializer.Serialize(new { error = "An internal server error occurred" })
            )
        };

        _logger.LogError(exception, "Exception occurred: {Message}", exception.Message);

        context.Response.StatusCode = (int)statusCode;
        await context.Response.WriteAsync(message);
    }

    private (HttpStatusCode, string) HandleDbUpdateException(DbUpdateException exception)
    {
        if (exception.InnerException is PostgresException pgException)
        {
            return pgException.SqlState switch
            {
                // 23503: Foreign Key Violation
                "23503" => (
                    HttpStatusCode.BadRequest,
                    JsonSerializer.Serialize(new
                    {
                        error = "資料關聯錯誤",
                        detail = GetFriendlyForeignKeyMessage(pgException)
                    })
                ),
                // 23505: Unique Violation
                "23505" => (
                    HttpStatusCode.BadRequest,
                    JsonSerializer.Serialize(new
                    {
                        error = "資料重複",
                        detail = "該資料已存在，請檢查輸入的內容"
                    })
                ),
                // 23514: Check Violation
                "23514" => (
                    HttpStatusCode.BadRequest,
                    JsonSerializer.Serialize(new
                    {
                        error = "資料驗證失敗",
                        detail = "輸入的資料不符合規則"
                    })
                ),
                _ => (
                    HttpStatusCode.BadRequest,
                    JsonSerializer.Serialize(new
                    {
                        error = "資料庫操作失敗",
                        detail = "無法完成資料庫操作，請檢查輸入的資料"
                    })
                )
            };
        }

        return (
            HttpStatusCode.InternalServerError,
            JsonSerializer.Serialize(new { error = "資料庫操作時發生錯誤" })
        );
    }

    private string GetFriendlyForeignKeyMessage(PostgresException pgException)
    {
        var constraintName = pgException.ConstraintName ?? "";
        var tableName = pgException.TableName ?? "";

        // 使用精確的約束名稱匹配，避免誤判
        return constraintName switch
        {
            // Category 相關
            "FK_News_Categories_CategoryId" => "指定的新聞分類不存在，請選擇有效的分類",
            "FK_Questions_Categories_CategoryId" => "指定的問題分類不存在，請選擇有效的分類",
            "FK_Regulations_Categories_CategoryId" => "指定的法規分類不存在，請選擇有效的分類",
            "FK_Tags_Categories_CategoryId" => "指定的標籤分類不存在，請選擇有效的分類",
            "FK_Demands_Categories_CategoryId" => "指定的需求分類不存在，請選擇有效的分類",
            "FK_Products_Categories_CategoryId" => "指定的產品分類不存在，請選擇有效的分類",
            "FK_Attributes_Categories_CategoryId" => "指定的屬性分類不存在，請選擇有效的分類",
            "FK_Categories_Categories_ParentId" => "指定的父分類不存在，請選擇有效的父分類",

            // Company 相關
            "FK_Members_Company_CompanyId" => "指定的公司不存在",
            "FK_Demands_Company_CompanyId" => "指定的公司不存在",
            "FK_Products_Company_CompanyId" => "指定的公司不存在",
            "FK_Documents_Company_CompanyId" => "指定的公司不存在",

            // Member 相關
            "FK_Documents_Members_SubmitterId" => "指定的會員不存在",

            // MultilingualText 相關
            "FK_News_MultilingualTexts_TitleId" => "新聞標題多語言文字不存在或尚未保存",
            "FK_News_MultilingualTexts_ContentId" => "新聞內容多語言文字不存在或尚未保存",
            "FK_News_MultilingualTexts_IntroductionId" => "新聞簡介多語言文字不存在或尚未保存",
            "FK_About_MultilingualTexts_TitleId" => "關於我們標題多語言文字不存在或尚未保存",
            "FK_About_MultilingualTexts_ContentId" => "關於我們內容多語言文字不存在或尚未保存",
            "FK_Questions_MultilingualTexts_SubjectId" => "問題主題多語言文字不存在或尚未保存",
            "FK_Questions_MultilingualTexts_AnswerId" => "問題答案多語言文字不存在或尚未保存",
            "FK_Categories_MultilingualTexts_NameId" => "分類名稱多語言文字不存在或尚未保存",
            "FK_StringResources_MultilingualTexts_MultilingualTextId" => "多語言文字資源不存在或尚未保存",
            "FK_Products_StringResources_DescriptionId" => "產品描述資源不存在或尚未保存",
            "FK_Documents_StringResources_ContentId" => "文件內容資源不存在或尚未保存",

            // Picture/Image 相關
            "FK_News_MultilingualImages_PictureId" => "指定的新聞圖片不存在",
            "FK_Questions_MultilingualImages_PictureId" => "指定的問題圖片不存在",
            "FK_About_MultilingualImages_PictureId" => "指定的關於我們圖片不存在",
            "FK_Categories_MultilingualImages_MultilingualPictureId" => "指定的分類圖片不存在",
            "FK_Categories_Pictures_PictureId" => "指定的分類圖片不存在",
            "FK_Company_Pictures_PhotoId" => "指定的公司照片不存在",
            "FK_Company_Pictures_BannerId" => "指定的公司橫幅圖片不存在",
            "FK_Members_Pictures_PhotoId" => "指定的會員照片不存在",
            "FK_Persons_Pictures_PhotoId" => "指定的人員照片不存在",
            "FK_Users_Pictures_PhotoId" => "指定的用戶照片不存在",
            "FK_Culture_Pictures_PictureId" => "指定的文化圖片不存在",
            "FK_Regulations_Pictures_PictureId" => "指定的法規圖片不存在",
            "FK_Demands_Pictures_PictureId" => "指定的需求圖片不存在",
            "FK_Products_Pictures_PictureId" => "指定的產品圖片不存在",
            "FK_Pictures_MultilingualImages_MultilingualImageId" => "指定的多語言圖片不存在",

            // 其他
            "FK_Banners_BannerPositions_PositionId" => "指定的橫幅位置不存在",
            "FK_Company_Addresses_AddressId" => "指定的公司地址不存在",
            "FK_Persons_Addresses_AddressId" => "指定的人員地址不存在",
            "FK_Members_Persons_PersonId" => "指定的人員資料不存在",
            "FK_Users_Persons_PersonId" => "指定的人員資料不存在",
            "FK_Pictures_Album_AlbumId" => "指定的相簿不存在",
            "FK_Videos_Album_AlbumId" => "指定的相簿不存在",
            "FK_AttributeValues_Attributes_AttributeId" => "指定的屬性不存在",
            "FK_EntityTags_Tags_TagId" => "指定的標籤不存在",
            "FK_Products_Products_BaseId" => "指定的基礎產品不存在",

            // 預設錯誤訊息
            _ => $"關聯的資料不存在（表: {tableName}，約束: {constraintName}），請檢查輸入的 ID 是否正確"
        };
    }
}