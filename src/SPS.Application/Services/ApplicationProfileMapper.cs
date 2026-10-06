using SPS.Application.DTOs.Application;
using SPS.Domain.Entities;

namespace SPS.Application.Services;

/// <summary>申請的公司專頁欄位與 <see cref="CompanyProfileDto"/> 的對應（建立、更新、回傳共用）</summary>
public static class ApplicationProfileMapper
{
    private static string? Clean(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();

    public static void Apply(MemberApplication application, CompanyProfileDto? profile)
    {
        if (profile == null) return;
        application.CompanyPhone = Clean(profile.Phone);
        application.CompanyCity = Clean(profile.City);
        application.CompanyDistrict = Clean(profile.District);
        application.CompanyPostalCode = Clean(profile.PostalCode);
        application.EstablishmentDate = Clean(profile.EstablishmentDate);
        application.Revenue = profile.Revenue;
        application.OrgUrl = Clean(profile.OrgUrl);
        application.Introduction = Clean(profile.Introduction);
        application.Subject = Clean(profile.Subject);
        application.AwardNote = Clean(profile.AwardNote);
        application.TagIds = profile.TagIds?.Where(id => id > 0).Distinct().ToList() ?? new List<int>();
        application.FactoryName = Clean(profile.FactoryName);
        application.FactoryCity = Clean(profile.FactoryCity);
        application.FactoryDistrict = Clean(profile.FactoryDistrict);
        application.FactoryPostalCode = Clean(profile.FactoryPostalCode);
        application.FactoryAddress = Clean(profile.FactoryAddress);
    }

    public static CompanyProfileDto ToDto(MemberApplication application) => new()
    {
        Phone = application.CompanyPhone,
        City = application.CompanyCity,
        District = application.CompanyDistrict,
        PostalCode = application.CompanyPostalCode,
        EstablishmentDate = application.EstablishmentDate,
        Revenue = application.Revenue,
        OrgUrl = application.OrgUrl,
        Introduction = application.Introduction,
        Subject = application.Subject,
        AwardNote = application.AwardNote,
        TagIds = application.TagIds,
        FactoryName = application.FactoryName,
        FactoryCity = application.FactoryCity,
        FactoryDistrict = application.FactoryDistrict,
        FactoryPostalCode = application.FactoryPostalCode,
        FactoryAddress = application.FactoryAddress,
    };
}
