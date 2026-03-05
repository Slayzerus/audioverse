namespace AudioVerse.API.Models.Requests.Admin;

public class WikiReorderItem
{
    public int Id { get; set; }
    public int SortOrder { get; set; }
    public int? ParentId { get; set; }
}
