using System.ComponentModel.DataAnnotations;

namespace SPS.Application.DTOs.MemberFavorite;

/// <summary>我的最愛裡的企業（只列目前公開的：已審核且啟用）</summary>
public class FavoriteCompanyDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Subject { get; set; }
}

/// <summary>我的最愛裡的需求（只列目前已發布的）</summary>
public class FavoriteDemandDto
{
    public int Id { get; set; }
    public string Number { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Location { get; set; }
}

public class MemberFavoritesResponse
{
    public List<FavoriteCompanyDto> Companies { get; set; } = new();
    public List<FavoriteDemandDto> Demands { get; set; } = new();
}

/// <summary>給收藏按鈕判斷目前狀態用：沒登入也能呼叫（<see cref="LoggedIn"/> = false）</summary>
public class FavoriteIdsResponse
{
    public bool LoggedIn { get; set; }

    /// <summary>true = 企業會員（Supplier／Buyer）；只有企業會員可以使用我的最愛，個人會員前台不顯示收藏按鈕</summary>
    public bool Enterprise { get; set; }

    /// <summary>"Buyer"（需求端）、"Supplier"（供給端）、空字串（訪客或個人會員）；前台依此決定刊登／追蹤／回應按鈕的狀態</summary>
    public string Role { get; set; } = string.Empty;
    public List<Guid> CompanyIds { get; set; } = new();
    public List<int> DemandIds { get; set; } = new();
}

/// <summary>會員在「媒合資料維護」看到自己從前台刊登的需求</summary>
public class MemberDemandResponse
{
    public int Id { get; set; }
    public string Number { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Introduction { get; set; }
    public List<int> TagIds { get; set; } = new();
    public List<string> TagNames { get; set; } = new();

    /// <summary>true = 已上架（會員不能再改，要改請聯絡承辦單位）；false = 待審核</summary>
    public bool Published { get; set; }
    public DateTime CreatedTime { get; set; }
}

public class UpdateMemberDemandRequest
{
    [Required, MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(5000)]
    public string? Introduction { get; set; }

    public List<int> TagIds { get; set; } = new();
}
