using System.Net.Http.Json;
using Microsoft.Extensions.Logging;
using SPS.Application.Common;
using SPS.Application.Interfaces.IServices;

namespace SPS.Infrastructure.Services;

/// <summary>
/// 工商平台服務實現 (GCIS API)
/// </summary>
public class BusinessRegistryService : IBusinessRegistryService
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ILogger<BusinessRegistryService> _logger;
    private const string GcisApiUrl = "https://data.gcis.nat.gov.tw/od/data/api/5F64D864-61CB-4D0D-8AD9-492047CC1EA6";

    public BusinessRegistryService(
        IHttpClientFactory httpClientFactory,
        ILogger<BusinessRegistryService> logger)
    {
        _httpClientFactory = httpClientFactory;
        _logger = logger;
    }

    public async Task<Result<bool>> VerifyUnifiedSocialCreditCodeAsync(
        string unifiedSocialCreditCode,
        CancellationToken cancellationToken = default)
    {
        try
        {
            // 基本格式驗證
            if (string.IsNullOrWhiteSpace(unifiedSocialCreditCode))
            {
                return Result<bool>.Failure("統一編號不能為空");
            }

            if (unifiedSocialCreditCode.Length != 8)
            {
                return Result<bool>.Failure("統一編號長度必須為8位");
            }

            var result = await GetCompanyInfoAsync(unifiedSocialCreditCode, cancellationToken);
            return Result<bool>.Success(result.IsSuccess);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error verifying unified social credit code {Code}", unifiedSocialCreditCode);
            return Result<bool>.Failure($"驗證統一編號失敗: {ex.Message}");
        }
    }

    public async Task<Result<CompanyRegistryInfo>> GetCompanyInfoAsync(
        string unifiedSocialCreditCode,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var client = _httpClientFactory.CreateClient();
            
            // 構建查詢參數
            // $format=json&$filter=Business_Accounting_NO eq 20828393&$skip=0&$top=50
            var query = $"?$format=json&$filter=Business_Accounting_NO eq {unifiedSocialCreditCode}&$skip=0&$top=50";
            var url = $"{GcisApiUrl}{query}";

            _logger.LogInformation("Querying GCIS API: {Url}", url);

            var response = await client.GetAsync(url, cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("GCIS API returned error status: {StatusCode}", response.StatusCode);
                return Result<CompanyRegistryInfo>.Failure($"工商平台查詢失敗: {response.ReasonPhrase}");
            }

            // API 返回的是一個數組
            var gcisResponse = await response.Content.ReadFromJsonAsync<List<GcisCompanyInfo>>(cancellationToken: cancellationToken);

            if (gcisResponse == null || !gcisResponse.Any())
            {
                _logger.LogWarning("Company not found in GCIS for code {Code}", unifiedSocialCreditCode);
                return Result<CompanyRegistryInfo>.Failure("未找到企業信息");
            }

            var companyInfo = gcisResponse.First();
            
            return Result<CompanyRegistryInfo>.Success(MapToDto(companyInfo));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting company info for {Code}", unifiedSocialCreditCode);
            return Result<CompanyRegistryInfo>.Failure($"獲取企業信息失敗: {ex.Message}");
        }
    }

    private static CompanyRegistryInfo MapToDto(GcisCompanyInfo info)
    {
        var dto = new CompanyRegistryInfo
        {
            UnifiedSocialCreditCode = info.Business_Accounting_NO,
            CompanyStatusDesc = info.Company_Status_Desc,
            CompanyName = info.Company_Name,
            CapitalStockAmount = info.Capital_Stock_Amount?.ToString(),
            PaidInCapitalAmount = info.Paid_In_Capital_Amount?.ToString(),
            ResponsibleName = info.Responsible_Name,
            Address = info.Company_Location,
            RegisterOrganizationDesc = info.Register_Organization_Desc,
            CompanySetupDate = info.Company_Setup_Date,
            ChangeOfApprovalData = info.Change_Of_Approval_Data,
            RevokeAppDate = info.Revoke_App_Date,
            CaseStatus = info.Case_Status,
            CaseStatusDesc = info.Case_Status_Desc,
            SusBegDate = info.Sus_Beg_Date,
            SusEndDate = info.Sus_End_Date,
            SusAppDate = info.Sus_App_Date
        };

        // Parse EstablishmentDate
        if (int.TryParse(info.Company_Setup_Date, out int rocDate) && info.Company_Setup_Date.Length >= 6)
        {
            // 民國年轉西元: 0990115 -> 2010/01/15
            // 格式通常是 YYYMMDD (7位) 或 YYMMDD (6位)
            // 這裡假設是 7位或6位的字符串數字
            try 
            {
                int year = rocDate / 10000;
                int month = (rocDate % 10000) / 100;
                int day = rocDate % 100;
                dto.EstablishmentDate = new DateTime(year + 1911, month, day);
            }
            catch
            {
                // ignore parsing error
            }
        }

        return dto;
    }

    // GCIS API Response Model
    private class GcisCompanyInfo
    {
        public string Business_Accounting_NO { get; set; } = string.Empty;
        public string Company_Status_Desc { get; set; } = string.Empty;
        public string Company_Name { get; set; } = string.Empty;
        public decimal? Capital_Stock_Amount { get; set; }
        public decimal? Paid_In_Capital_Amount { get; set; }
        public string Responsible_Name { get; set; } = string.Empty;
        public string Company_Location { get; set; } = string.Empty;
        public string Register_Organization_Desc { get; set; } = string.Empty;
        public string Company_Setup_Date { get; set; } = string.Empty;
        public string Change_Of_Approval_Data { get; set; } = string.Empty;
        public string Revoke_App_Date { get; set; } = string.Empty;
        public string Case_Status { get; set; } = string.Empty;
        public string Case_Status_Desc { get; set; } = string.Empty;
        public string Sus_App_Date { get; set; } = string.Empty;
        public string Sus_Beg_Date { get; set; } = string.Empty;
        public string Sus_End_Date { get; set; } = string.Empty;
    }
}
