namespace AudioVerse.Application.Models.Requests.Karaoke
{
    public class FilterCondition
    {
        public string Field { get; set; } = string.Empty;
        public FilterOperator Operator { get; set; }
        public List<string>? Values { get; set; }
    }
}
