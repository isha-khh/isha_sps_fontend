namespace SPS.Domain.Entities;

public class Sequence
{
    public short EntityType { get; set; }
    public string? SubCode { get; set; }
    public string? ExtendCode { get; set; }
    public int Number { get; set; }
    public DateTime LastUpdateTime { get; set; }
}
