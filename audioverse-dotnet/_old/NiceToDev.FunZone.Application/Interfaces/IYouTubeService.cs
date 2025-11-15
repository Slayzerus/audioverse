using Microsoft.EntityFrameworkCore.Metadata;
using System.Net.Http;
using System.Text.Json;

namespace NiceToDev.FunZone.Application.Interfaces
{
    public interface IYouTubeService
    {
        Task<string?> SearchSongAsync(string artist, string title);
        string GetEmbedUrl(string videoId);
    }
}
