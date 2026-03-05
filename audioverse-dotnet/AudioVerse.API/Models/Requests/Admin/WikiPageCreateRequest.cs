namespace AudioVerse.API.Models.Requests.Admin;

public class WikiPageCreateRequest
{
    public string Slug { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string? ContentMarkdown { get; set; }
    public string? Category { get; set; }
    public int SortOrder { get; set; }
    public int? ParentId { get; set; }
    public bool IsPublished { get; set; } = true;
    public string? Tags { get; set; }
    public string? Icon { get; set; }
}
