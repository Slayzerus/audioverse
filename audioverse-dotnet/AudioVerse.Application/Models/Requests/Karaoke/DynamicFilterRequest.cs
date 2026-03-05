namespace AudioVerse.Application.Models.Requests.Karaoke
{
    public class DynamicFilterRequest
    {
        public List<FilterCondition> Conditions { get; set; } = new();
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 50;
        public string? SortBy { get; set; }
        public string? SortDir { get; set; }
    }
}
