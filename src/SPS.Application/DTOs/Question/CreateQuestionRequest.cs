using System.ComponentModel.DataAnnotations;

namespace SPS.Application.DTOs.Question;

public class CreateQuestionRequest
{
    [Required(ErrorMessage = "問題不能為空")]
    public string Subject { get; set; } = string.Empty;

    [Required(ErrorMessage = "答案不能為空")]
    public string Answer { get; set; } = string.Empty;

    public bool Published { get; set; } = true;

    public int Ordinal { get; set; } = 0;

    public int? CategoryId { get; set; }
}
