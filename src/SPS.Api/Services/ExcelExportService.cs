using ClosedXML.Excel;
using Microsoft.EntityFrameworkCore;
using SPS.Application.Interfaces;
using SPS.Application.Interfaces.IServices;
using SPS.Domain.Entities;
using SPS.Domain.Enums;

namespace SPS.Api.Services;

public class ExcelExportService : IExcelExportService
{
    private readonly IUnitOfWork _unitOfWork;

    public ExcelExportService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<byte[]> ExportCompaniesToExcelAsync(
        List<Guid>? ids,
        string? search,
        CompanyType? type,
        CompanyLevel? level,
        Status? status,
        bool? isVerified,
        CancellationToken cancellationToken = default)
    {
        IQueryable<Company> query = _unitOfWork.Companies.GetQueryable();

        if (ids != null && ids.Count > 0)
        {
            query = query.Where(c => ids.Contains(c.Id));
        }
        else
        {
            if (!string.IsNullOrWhiteSpace(search))
                query = query.Where(c =>
                    c.Name.Contains(search) ||
                    c.Number.Contains(search) ||
                    (c.EnglishName != null && c.EnglishName.Contains(search)));
            if (type.HasValue)
                query = query.Where(c => c.Type == type.Value);
            if (level.HasValue)
                query = query.Where(c => c.Level == level.Value);
            if (status.HasValue)
                query = query.Where(c => c.Status == status.Value);
            if (isVerified.HasValue)
                query = query.Where(c => c.IsVerified == isVerified.Value);
        }

        var companies = await query
            .OrderByDescending(c => c.CreatedTime)
            .ToListAsync(cancellationToken);

        using var workbook = new XLWorkbook();
        var ws = workbook.Worksheets.Add("公司列表");

        var headers = new[]
        {
            "公司編號", "公司名稱", "英文名稱", "類型", "級別",
            "員工數", "年營收（TWD）", "狀態", "已驗證", "建立時間"
        };

        for (int col = 1; col <= headers.Length; col++)
        {
            var cell = ws.Cell(1, col);
            cell.Value = headers[col - 1];
            cell.Style.Font.Bold = true;
            cell.Style.Fill.BackgroundColor = XLColor.FromHtml("#4472C4");
            cell.Style.Font.FontColor = XLColor.White;
            cell.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
        }

        int row = 2;
        foreach (var c in companies)
        {
            ws.Cell(row, 1).Value = c.Number;
            ws.Cell(row, 2).Value = c.Name;
            ws.Cell(row, 3).Value = c.EnglishName ?? string.Empty;
            ws.Cell(row, 4).Value = c.Type switch
            {
                CompanyType.Supplier => "供給端",
                CompanyType.Buyer => "需求端",
                CompanyType.Both => "供需雙方",
                _ => string.Empty
            };
            ws.Cell(row, 5).Value = c.Level switch
            {
                CompanyLevel.Basic => "普通",
                CompanyLevel.Standard => "銀牌",
                CompanyLevel.Premium => "金牌",
                CompanyLevel.VIP => "鑽石",
                _ => string.Empty
            };
            ws.Cell(row, 6).Value = c.Employees.HasValue ? c.Employees.Value.ToString() : string.Empty;
            ws.Cell(row, 7).Value = c.Revenue.HasValue ? c.Revenue.Value.ToString("N0") : string.Empty;
            ws.Cell(row, 8).Value = c.Status switch
            {
                Status.Active => "啟用",
                Status.Inactive => "停用",
                _ => c.Status.ToString()
            };
            ws.Cell(row, 9).Value = c.IsVerified ? "是" : "否";
            ws.Cell(row, 10).SetValue(c.CreatedTime.ToLocalTime().ToString("yyyy/MM/dd HH:mm"));
            row++;
        }

        if (companies.Count > 0)
        {
            var dataRange = ws.Range(2, 1, row - 1, headers.Length);
            dataRange.Style.Border.OutsideBorder = XLBorderStyleValues.Thin;
            dataRange.Style.Border.InsideBorder = XLBorderStyleValues.Thin;
        }

        ws.Columns().AdjustToContents();

        using var stream = new MemoryStream();
        workbook.SaveAs(stream);
        return stream.ToArray();
    }

    public async Task<byte[]> ExportMembersToExcelAsync(
        List<Guid>? ids,
        string? search,
        Status? status,
        MemberRole? role,
        Guid? companyId,
        bool? isApproved,
        bool? hasCompany,
        bool? isEmailVerified,
        CancellationToken cancellationToken = default)
    {
        IQueryable<Member> query = _unitOfWork.Members.GetQueryable()
            .Include(m => m.Company);

        if (ids != null && ids.Count > 0)
        {
            query = query.Where(m => ids.Contains(m.Id));
        }
        else
        {
            if (!string.IsNullOrWhiteSpace(search))
            {
                var keyword = search.Trim();
                query = query.Where(m =>
                    m.Email.Contains(keyword) ||
                    m.Number.Contains(keyword) ||
                    (m.Nickname != null && m.Nickname.Contains(keyword)) ||
                    (m.Phone != null && m.Phone.Contains(keyword)) ||
                    (m.MobilePhone != null && m.MobilePhone.Contains(keyword)) ||
                    (m.Company != null && m.Company.Name.Contains(keyword)));
            }
            if (status.HasValue)
                query = query.Where(m => m.Status == status.Value);
            if (role.HasValue)
                query = query.Where(m => m.Role == role.Value);
            if (companyId.HasValue)
                query = query.Where(m => m.CompanyId == companyId.Value);
            if (isApproved.HasValue)
                query = query.Where(m => m.IsApproved == isApproved.Value);
            if (hasCompany.HasValue)
                query = hasCompany.Value
                    ? query.Where(m => m.CompanyId != null)
                    : query.Where(m => m.CompanyId == null);
            if (isEmailVerified.HasValue)
                query = query.Where(m => m.IsEmailVerified == isEmailVerified.Value);
        }

        var members = await query
            .OrderByDescending(m => m.CreatedTime)
            .ToListAsync(cancellationToken);

        using var workbook = new XLWorkbook();
        var ws = workbook.Worksheets.Add("會員列表");

        var headers = new[]
        {
            "會員編號", "姓名", "Email", "電話", "分機", "手機",
            "所屬公司", "職稱", "角色", "職位", "狀態",
            "已審核", "信箱驗證", "指定聯絡人", "最後登入", "建立時間"
        };

        for (int col = 1; col <= headers.Length; col++)
        {
            var cell = ws.Cell(1, col);
            cell.Value = headers[col - 1];
            cell.Style.Font.Bold = true;
            cell.Style.Fill.BackgroundColor = XLColor.FromHtml("#4472C4");
            cell.Style.Font.FontColor = XLColor.White;
            cell.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
        }

        int row = 2;
        foreach (var m in members)
        {
            ws.Cell(row, 1).Value = m.Number;
            ws.Cell(row, 2).Value = m.Nickname ?? string.Empty;
            ws.Cell(row, 3).Value = m.Email;
            ws.Cell(row, 4).Value = m.Phone ?? string.Empty;
            ws.Cell(row, 5).Value = m.Extension ?? string.Empty;
            ws.Cell(row, 6).Value = m.MobilePhone ?? string.Empty;
            ws.Cell(row, 7).Value = m.Company?.Name ?? string.Empty;
            ws.Cell(row, 8).Value = m.MemberJobTitle ?? m.Position ?? string.Empty;
            ws.Cell(row, 9).Value = m.Role switch
            {
                MemberRole.Supplier => "供給端",
                MemberRole.Buyer => "需求端",
                _ => string.Empty
            };
            ws.Cell(row, 10).Value = m.MemberPosition switch
            {
                MemberPosition.Manager => "經理",
                MemberPosition.Employee => "員工",
                _ => string.Empty
            };
            ws.Cell(row, 11).Value = m.Status switch
            {
                Status.Active => "啟用",
                Status.Inactive => "未啟用",
                Status.Suspended => "停用",
                Status.Locked => "鎖定",
                Status.PendingApproval => "待審核",
                Status.Approved => "已核可",
                Status.Rejected => "已拒絕",
                _ => m.Status.ToString()
            };
            ws.Cell(row, 12).Value = m.IsApproved ? "是" : "否";
            ws.Cell(row, 13).Value = m.IsEmailVerified ? "是" : "否";
            ws.Cell(row, 14).Value = m.IsDesignatedContact ? "是" : "否";
            ws.Cell(row, 15).SetValue(m.LoginTime.HasValue
                ? m.LoginTime.Value.ToLocalTime().ToString("yyyy/MM/dd HH:mm")
                : string.Empty);
            ws.Cell(row, 16).SetValue(m.CreatedTime.ToLocalTime().ToString("yyyy/MM/dd HH:mm"));
            row++;
        }

        if (members.Count > 0)
        {
            var dataRange = ws.Range(2, 1, row - 1, headers.Length);
            dataRange.Style.Border.OutsideBorder = XLBorderStyleValues.Thin;
            dataRange.Style.Border.InsideBorder = XLBorderStyleValues.Thin;
        }

        ws.Columns().AdjustToContents();

        using var stream = new MemoryStream();
        workbook.SaveAs(stream);
        return stream.ToArray();
    }

    public async Task<byte[]> ExportProductsToExcelAsync(
        List<int>? ids,
        string? search,
        bool? published,
        Guid? companyId,
        CancellationToken cancellationToken = default)
    {
        IQueryable<Product> query = _unitOfWork.Products.GetQueryable()
            .Include(p => p.Company);

        if (ids != null && ids.Count > 0)
        {
            query = query.Where(p => ids.Contains(p.Id));
        }
        else
        {
            if (!string.IsNullOrWhiteSpace(search))
                query = query.Where(p =>
                    p.Name.Contains(search) ||
                    p.Number.Contains(search) ||
                    (p.ModelNo != null && p.ModelNo.Contains(search)));
            if (published.HasValue)
                query = query.Where(p => p.Published == published.Value);
            if (companyId.HasValue)
                query = query.Where(p => p.CompanyId == companyId.Value);
        }

        var products = await query
            .OrderByDescending(p => p.CreatedTime)
            .ToListAsync(cancellationToken);

        using var workbook = new XLWorkbook();
        var ws = workbook.Worksheets.Add("產品列表");

        var headers = new[]
        {
            "產品編號", "產品名稱", "型號", "所屬公司", "發布狀態", "建立時間"
        };

        for (int col = 1; col <= headers.Length; col++)
        {
            var cell = ws.Cell(1, col);
            cell.Value = headers[col - 1];
            cell.Style.Font.Bold = true;
            cell.Style.Fill.BackgroundColor = XLColor.FromHtml("#70AD47");
            cell.Style.Font.FontColor = XLColor.White;
            cell.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
        }

        int row = 2;
        foreach (var p in products)
        {
            ws.Cell(row, 1).Value = p.Number;
            ws.Cell(row, 2).Value = p.Name;
            ws.Cell(row, 3).Value = p.ModelNo ?? string.Empty;
            ws.Cell(row, 4).Value = p.Company?.Name ?? string.Empty;
            ws.Cell(row, 5).Value = p.Published ? "已發布" : "草稿";
            ws.Cell(row, 6).SetValue(p.CreatedTime.ToLocalTime().ToString("yyyy/MM/dd HH:mm"));
            row++;
        }

        if (products.Count > 0)
        {
            var dataRange = ws.Range(2, 1, row - 1, headers.Length);
            dataRange.Style.Border.OutsideBorder = XLBorderStyleValues.Thin;
            dataRange.Style.Border.InsideBorder = XLBorderStyleValues.Thin;
        }

        ws.Columns().AdjustToContents();

        using var stream = new MemoryStream();
        workbook.SaveAs(stream);
        return stream.ToArray();
    }
}
