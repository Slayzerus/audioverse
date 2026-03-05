namespace AudioVerse.API.Models.Radio
{
    public class RadioStationCreateRequest
    {
        public string? Name { get; set; }
        public string? Slug { get; set; }
        public string? Description { get; set; }
        public int? MaxListeners { get; set; }
        public bool IsPublic { get; set; } = true;
    }
}
