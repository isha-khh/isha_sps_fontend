namespace SPS.Application.DTOs.Question;

public class QuestionResponse
{
    public int Id { get; set; }
    public string? Subject { get; set; }
    public string? Answer { get; set; }
    public bool Published { get; set; }
    public int Ordinal { get; set; }
    public int? CategoryId { get; set; }
    public string? CategoryName { get; set; }
    public DateTime CreatedTime { get; set; }
    public DateTime? UpdatedTime { get; set; }
}
