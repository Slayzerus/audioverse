namespace AudioVerse.Application.Models.SongInformations
{
    public class SongLicenseInformation
    {
        public string Title { get; set; } = string.Empty;
        public string Artist { get; set; } = string.Empty;
        public string ISRC { get; set; } = string.Empty;
        public string CopyrightOwner { get; set; } = string.Empty;
        public string Publisher { get; set; } = string.Empty;
        public decimal? LicenseCost { get; set; }
        public string LicenseType { get; set; } = string.Empty;
        public string Source { get; set; } = string.Empty;
    }

}
