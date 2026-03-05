using AudioVerse.API.Models.Radio;

namespace AudioVerse.API.Services.Radio
{
    public interface IRadioService
    {
        Task<bool> CanJoinAsync(int radioStationId);
        Task<bool> RegisterJoinAsync(int radioStationId, int? userId, string connectionId, string? clientInfo, string? remoteIp, int? broadcastSessionId = null);
        Task RegisterLeaveAsync(string connectionId);
        Task<NowPlayingDto?> GetNowPlayingAsync(int radioStationId);
    }
}
