using SPS.Domain.Enums;

namespace SPS.Application.Interfaces.IServices;

public interface IExcelExportService
{
    Task<byte[]> ExportCompaniesToExcelAsync(
        List<Guid>? ids,
        string? search,
        CompanyType? type,
        CompanyLevel? level,
        Status? status,
        bool? isVerified,
        CancellationToken cancellationToken = default);

    Task<byte[]> ExportProductsToExcelAsync(
        List<int>? ids,
        string? search,
        bool? published,
        Guid? companyId,
        CancellationToken cancellationToken = default);

    Task<byte[]> ExportMembersToExcelAsync(
        List<Guid>? ids,
        string? search,
        Status? status,
        MemberRole? role,
        Guid? companyId,
        bool? isApproved,
        bool? hasCompany,
        bool? isEmailVerified,
        CancellationToken cancellationToken = default);
}
