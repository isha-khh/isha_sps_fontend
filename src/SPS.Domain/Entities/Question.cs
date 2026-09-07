using SPS.Domain.Common;

namespace SPS.Domain.Entities;

public class Question : BaseEntity<int>
{
    public bool Published { get; set; }
    public int Ordinal { get; set; }
    public int? SubjectId { get; set; }
    public int? AnswerId { get; set; }
    public int? CategoryId { get; set; }
    public int? PictureId { get; set; }

    // Navigation properties
    public MultilingualText? Subject { get; set; }
    public MultilingualText? Answer { get; set; }
    public Category? Category { get; set; }
    public MultilingualImage? Picture { get; set; }
    public ICollection<File> Files { get; set; } = new List<File>();
}
