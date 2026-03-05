namespace AudioVerse.Application.Models.Audio
{
    public class ArtistInformation
    {
        public string Name { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string Nationality { get; set; } = string.Empty;
        public DateTime? BirthDate { get; set; }
        public string Biography { get; set; } = string.Empty;
        public string ProfilePictureUrl { get; set; } = string.Empty;
        public Dictionary<string, string> SocialMediaLinks { get; set; } = new();
        public List<string> Albums { get; set; } = new();
        public List<string> Songs { get; set; } = new();
    }
}
