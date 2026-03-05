using AudioVerse.Domain.Entities.Radio;

namespace AudioVerse.Domain.Repositories;

/// <summary>
/// Repository for radio stations, broadcasting, schedule, chat, reactions, comments, follows, external stations, stats.
/// </summary>
public interface IRadioRepository
{
    // ── Stations ──
    Task<RadioStation?> GetStationByIdAsync(int id);
    Task<int> AddStationAsync(RadioStation station);
    Task SaveChangesAsync();

    // ── Broadcast Sessions ──
    Task<int> AddBroadcastSessionAsync(BroadcastSession session);
    Task<BroadcastSession?> GetActiveSessionAsync(int stationId);

    // ── Schedule ──
    Task<IEnumerable<RadioScheduleSlot>> GetScheduleSlotsAsync(int stationId);
    Task<IEnumerable<RadioScheduleSlot>> GetScheduleSlotsByDayAsync(int stationId, DayOfWeek day);
    Task<int> AddScheduleSlotAsync(RadioScheduleSlot slot);
    Task<RadioScheduleSlot?> GetScheduleSlotAsync(int slotId, int stationId);
    Task<bool> DeleteScheduleSlotAsync(int slotId, int stationId);

    // ── Chat ──
    Task<IEnumerable<RadioChatMessage>> GetChatMessagesAsync(int stationId, int take, DateTime? before);
    Task<int> AddChatMessageAsync(RadioChatMessage message);
    Task<RadioChatMessage?> GetChatMessageAsync(int messageId, int stationId);

    // ── Reactions ──
    Task AddSongReactionAsync(RadioSongReaction reaction);
    Task<object> GetReactionStatsAsync(int stationId, int? songId);

    // ── Comments ──
    Task<(IEnumerable<RadioComment> Items, int Total, double AvgRating)> GetCommentsAsync(int stationId, int page, int pageSize);
    Task<int> AddCommentAsync(RadioComment comment);
    Task<RadioComment?> GetCommentAsync(int commentId, int stationId);

    // ── Follows ──
    Task<RadioFollow?> GetFollowAsync(int stationId, int userId);
    Task AddFollowAsync(RadioFollow follow);
    Task RemoveFollowAsync(RadioFollow follow);
    Task<int> GetFollowerCountAsync(int stationId);
    Task<bool> IsFollowingAsync(int stationId, int userId);

    // ── External Stations ──
    Task<(IEnumerable<ExternalRadioStation> Items, int Total)> GetExternalStationsPagedAsync(string? countryCode, string? language, string? genre, int page, int pageSize);
    Task<IEnumerable<object>> GetExternalStationCountryStatsAsync();
    Task<int> AddExternalStationAsync(ExternalRadioStation station);
    Task<ExternalRadioStation?> GetExternalStationByIdAsync(int id);
    Task<ExternalRadioStation?> FindExternalStationByStreamUrlAsync(string streamUrl);

    // ── Stats ──
    Task<(int Joins, int Leaves, int UniqueListeners, double AvgListenSeconds)> GetDailyStatsAsync(int stationId, DateTime dayStart, DateTime dayEnd);
    Task<IEnumerable<RadioListener>> GetActiveListenersAsync(int stationId);
    Task<(int TotalJoins, int TotalLeaves, int UniqueListeners, double AvgListenSeconds)> GetStatsSummaryAsync(int stationId);
    Task<IEnumerable<(int? UserId, int TotalSeconds)>> GetTopListenersAsync(int stationId, int take);

    // ── Invites ──
    Task<RadioStationInvite?> GetInviteByTokenAsync(string token, CancellationToken ct = default);
    Task<RadioStationInvite?> GetInviteByIdAsync(int inviteId, int stationId, CancellationToken ct = default);
    Task<IEnumerable<RadioStationInvite>> GetInvitesByStationAsync(int stationId, CancellationToken ct = default);
    Task AddInviteAsync(RadioStationInvite invite, CancellationToken ct = default);

    // ── Voice Sessions ──
    Task<VoiceSession?> GetActiveVoiceSessionAsync(int stationId, CancellationToken ct = default);
    Task AddVoiceSessionAsync(VoiceSession session, CancellationToken ct = default);
    Task<VoiceSession?> GetVoiceSessionByIdAsync(int id, CancellationToken ct = default);

    // ── Voice Segments ──
    Task AddVoiceSegmentAsync(VoiceSegment segment, CancellationToken ct = default);
    Task<IEnumerable<VoiceSegment>> GetVoiceSegmentsForDayAsync(int stationId, DateTime dayStart, DateTime dayEnd, CancellationToken ct = default);
}
