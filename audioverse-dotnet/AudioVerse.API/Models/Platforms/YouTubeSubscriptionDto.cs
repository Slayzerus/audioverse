using System;

namespace AudioVerse.API.Models.Platforms
{
    public sealed class YouTubeSubscriptionDto
    {
        public string Id { get; set; } = string.Empty; // subscription id
        public string ChannelId { get; set; } = string.Empty; // subscribed channel id
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? ThumbnailUrl { get; set; }
    }
}
