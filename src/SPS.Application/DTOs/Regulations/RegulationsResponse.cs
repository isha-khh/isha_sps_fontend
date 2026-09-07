namespace SPS.Application.DTOs.Regulations;

public class RegulationsResponse
{
    public int Id { get; set; }
    public string? Name { get; set; }
    public string? Title { get; set; }
    public string? Content { get; set; }
    public bool Published { get; set; }
    public short Type { get; set; }
    public int Ordinal { get; set; }
    public int? CategoryId { get; set; }
    public string? CategoryName { get; set; }
    public DateTime CreatedTime { get; set; }
    public DateTime? UpdatedTime { get; set; }
}
