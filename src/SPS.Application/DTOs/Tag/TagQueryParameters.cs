using SPS.Application.DTOs.Common;
using SPS.Domain.Enums;

namespace SPS.Application.DTOs.Tag;

public class TagQueryParameters : QueryParameters
{
    public TagType? Type { get; set; }
    public string? Name { get; set; }
    public int? CategoryId { get; set; }
}