namespace AudioVerse.API.Models.Radio
{
    public class ListenerDto
    {
        public int? UserId { get; set; }
        public string? ConnectionId { get; set; }
        public string? ClientInfo { get; set; }
        public string? RemoteIp { get; set; }
        public DateTime ConnectedAtUtc { get; set; }
    }
}
