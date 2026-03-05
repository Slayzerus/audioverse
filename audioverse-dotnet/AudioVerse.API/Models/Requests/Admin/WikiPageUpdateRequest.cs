namespace AudioVerse.API.Models.Requests.Admin;

public class WikiPageUpdateRequest
{
    public string? Title { get; set; }
    public string? ContentMarkdown { get; set; }
    public string? Category { get; set; }
    public int? SortOrder { get; set; }
    public int? ParentId { get; set; }
    public bool? IsPublished { get; set; }
    public string? Tags { get; set; }
    public string? Icon { get; set; }
    public string? EditSummary { get; set; }
}
