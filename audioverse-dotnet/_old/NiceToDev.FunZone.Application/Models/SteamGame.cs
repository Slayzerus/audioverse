    namespace NiceToDev.FunZone.Application.Models
{
    public class SteamGame
    {
        public int AppId { get; set; }
        public string Name { get; set; } = string.Empty;
        public int PlaytimeForever { get; set; }
        public string? IconUrl { get; set; }
        public string? LogoUrl { get; set; }
    }
}
