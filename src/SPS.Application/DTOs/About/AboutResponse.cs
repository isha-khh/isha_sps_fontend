namespace SPS.Application.DTOs.About;

public class AboutResponse
{
    public int Id { get; set; }
    public string? Name { get; set; }
    public string? Title { get; set; }
    public string? Content { get; set; }
    public bool Published { get; set; }
    public short Type { get; set; }
    public int Ordinal { get; set; }
    public string? Version { get; set; }
    public DateTime? SendTime { get; set; }
    public DateTime CreatedTime { get; set; }
    public DateTime? UpdatedTime { get; set; }
}
