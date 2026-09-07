namespace SPS.Application.DTOs.Question;

public class UpdateQuestionRequest
{
    public string? Subject { get; set; }

    public string? Answer { get; set; }

    public bool? Published { get; set; }

    public int? Ordinal { get; set; }

    public int? CategoryId { get; set; }
}
