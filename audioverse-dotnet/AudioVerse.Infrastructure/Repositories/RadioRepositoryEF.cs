using AudioVerse.Domain.Entities.Radio;
using AudioVerse.Domain.Repositories;
using AudioVerse.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace AudioVerse.Infrastructure.Repositories;

public class RadioRepositoryEF : IRadioRepository
{
    private readonly AudioVerseDbContext _db;
    public RadioRepositoryEF(AudioVerseDbContext db) => _db = db;

    public async Task<RadioStation?> GetStationByIdAsync(int id) => await _db.RadioStations.FindAsync(id);

    public async Task<int> AddStationAsync(RadioStation station)
    {
        _db.RadioStations.Add(station);
        await _db.SaveChangesAsync();
        return station.Id;
    }

    public async Task SaveChangesAsync() => await _db.SaveChangesAsync();

    public async Task<int> AddBroadcastSessionAsync(BroadcastSession session)
    {
        _db.BroadcastSessions.Add(session);
        await _db.SaveChangesAsync();
        return session.Id;
    }

    public async Task<BroadcastSession?> GetActiveSessionAsync(int stationId)
        => await _db.BroadcastSessions.Where(s => s.RadioStationId == stationId && s.IsRunning)
            .OrderByDescending(s => s.StartUtc).FirstOrDefaultAsync();

    public async Task<IEnumerable<RadioScheduleSlot>> GetScheduleSlotsAsync(int stationId)
        => await _db.RadioScheduleSlots.Where(s => s.RadioStationId == stationId).OrderBy(s => s.DayOfWeek).ThenBy(s => s.StartTimeUtc).ToListAsync();

    public async Task<IEnumerable<RadioScheduleSlot>> GetScheduleSlotsByDayAsync(int stationId, DayOfWeek day)
        => await _db.RadioScheduleSlots.Where(s => s.RadioStationId == stationId && s.DayOfWeek == day).OrderBy(s => s.StartTimeUtc).ToListAsync();

    public async Task<int> AddScheduleSlotAsync(RadioScheduleSlot slot)
    {
        _db.RadioScheduleSlots.Add(slot);
        await _db.SaveChangesAsync();
        return slot.Id;
    }

    public async Task<RadioScheduleSlot?> GetScheduleSlotAsync(int slotId, int stationId)
        => await _db.RadioScheduleSlots.FirstOrDefaultAsync(s => s.Id == slotId && s.RadioStationId == stationId);

    public async Task<bool> DeleteScheduleSlotAsync(int slotId, int stationId)
    {
        var slot = await _db.RadioScheduleSlots.FirstOrDefaultAsync(s => s.Id == slotId && s.RadioStationId == stationId);
        if (slot == null) return false;
        _db.RadioScheduleSlots.Remove(slot);
        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<IEnumerable<RadioChatMessage>> GetChatMessagesAsync(int stationId, int take, DateTime? before)
    {
        var q = _db.RadioChatMessages.Where(m => m.RadioStationId == stationId && !m.IsDeleted);
        if (before.HasValue) q = q.Where(m => m.SentAtUtc < before.Value);
        return await q.OrderByDescending(m => m.SentAtUtc).Take(take).ToListAsync();
    }

    public async Task<int> AddChatMessageAsync(RadioChatMessage message)
    {
        _db.RadioChatMessages.Add(message);
        await _db.SaveChangesAsync();
        return message.Id;
    }

    public async Task<RadioChatMessage?> GetChatMessageAsync(int messageId, int stationId)
        => await _db.RadioChatMessages.FirstOrDefaultAsync(m => m.Id == messageId && m.RadioStationId == stationId);

    public async Task AddSongReactionAsync(RadioSongReaction reaction)
    {
        _db.RadioSongReactions.Add(reaction);
        await _db.SaveChangesAsync();
    }

    public async Task<object> GetReactionStatsAsync(int stationId, int? songId)
    {
        var q = _db.RadioSongReactions.Where(r => r.RadioStationId == stationId);
        if (songId.HasValue) q = q.Where(r => r.TrackId == songId.Value);
        var grouped = await q.GroupBy(r => r.ReactionType).Select(g => new { Type = g.Key, Count = g.Count() }).ToListAsync();
        return grouped;
    }

    public async Task<(IEnumerable<RadioComment> Items, int Total, double AvgRating)> GetCommentsAsync(int stationId, int page, int pageSize)
    {
        var q = _db.RadioComments.Where(c => c.RadioStationId == stationId && !c.IsDeleted);
        var total = await q.CountAsync();
        var avgRating = await q.Where(c => c.Rating.HasValue).AverageAsync(c => (double?)c.Rating) ?? 0;
        var items = await q.OrderByDescending(c => c.CreatedAtUtc).Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();
        return (items, total, avgRating);
    }

    public async Task<int> AddCommentAsync(RadioComment comment)
    {
        _db.RadioComments.Add(comment);
        await _db.SaveChangesAsync();
        return comment.Id;
    }

    public async Task<RadioComment?> GetCommentAsync(int commentId, int stationId)
        => await _db.RadioComments.FirstOrDefaultAsync(x => x.Id == commentId && x.RadioStationId == stationId);

    public async Task<RadioFollow?> GetFollowAsync(int stationId, int userId)
        => await _db.RadioFollows.FirstOrDefaultAsync(f => f.RadioStationId == stationId && f.UserId == userId);

    public async Task AddFollowAsync(RadioFollow follow)
    {
        _db.RadioFollows.Add(follow);
        await _db.SaveChangesAsync();
    }

    public async Task RemoveFollowAsync(RadioFollow follow)
    {
        _db.RadioFollows.Remove(follow);
        await _db.SaveChangesAsync();
    }

    public async Task<int> GetFollowerCountAsync(int stationId)
        => await _db.RadioFollows.CountAsync(f => f.RadioStationId == stationId);

    public async Task<bool> IsFollowingAsync(int stationId, int userId)
        => await _db.RadioFollows.AnyAsync(f => f.RadioStationId == stationId && f.UserId == userId);

    public async Task<(IEnumerable<ExternalRadioStation> Items, int Total)> GetExternalStationsPagedAsync(string? countryCode, string? language, string? genre, int page, int pageSize)
    {
        var q = _db.ExternalRadioStations.Where(s => s.IsActive).AsQueryable();
        if (!string.IsNullOrEmpty(countryCode)) q = q.Where(s => s.CountryCode == countryCode.ToUpper());
        if (!string.IsNullOrEmpty(language)) q = q.Where(s => s.Language == language.ToLower());
        if (!string.IsNullOrEmpty(genre)) q = q.Where(s => s.Genre != null && s.Genre.ToLower().Contains(genre.ToLower()));
        var total = await q.CountAsync();
        var items = await q.OrderBy(s => s.CountryCode).ThenBy(s => s.Name).Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();
        return (items, total);
    }

    public async Task<IEnumerable<object>> GetExternalStationCountryStatsAsync()
    {
        var result = await _db.ExternalRadioStations
            .Where(s => s.IsActive)
            .GroupBy(s => new { s.CountryCode, s.CountryName })
            .Select(g => new { g.Key.CountryCode, g.Key.CountryName, count = g.Count() })
            .OrderBy(c => c.CountryName)
            .ToListAsync();
        return result.Cast<object>();
    }

    public async Task<int> AddExternalStationAsync(ExternalRadioStation station)
    {
        _db.ExternalRadioStations.Add(station);
        await _db.SaveChangesAsync();
        return station.Id;
    }

    public async Task<ExternalRadioStation?> GetExternalStationByIdAsync(int id)
        => await _db.ExternalRadioStations.FindAsync(id);

    public async Task<ExternalRadioStation?> FindExternalStationByStreamUrlAsync(string streamUrl)
        => await _db.ExternalRadioStations.FirstOrDefaultAsync(s => s.StreamUrl == streamUrl);

    public async Task<(int Joins, int Leaves, int UniqueListeners, double AvgListenSeconds)> GetDailyStatsAsync(int stationId, DateTime dayStart, DateTime dayEnd)
    {
        var joins = await _db.RadioPlayStats.CountAsync(s => s.RadioStationId == stationId && s.EventType == RadioEventType.Join && s.TimestampUtc >= dayStart && s.TimestampUtc < dayEnd);
        var leaves = await _db.RadioPlayStats.CountAsync(s => s.RadioStationId == stationId && s.EventType == RadioEventType.Leave && s.TimestampUtc >= dayStart && s.TimestampUtc < dayEnd);
        var uniqueListeners = await _db.RadioPlayStats.Where(s => s.RadioStationId == stationId && s.TimestampUtc >= dayStart && s.TimestampUtc < dayEnd && s.UserId != null).Select(s => s.UserId).Distinct().CountAsync();
        var listeners = await _db.RadioListeners
            .Where(l => l.RadioStationId == stationId && l.ConnectedAtUtc >= dayStart && l.DisconnectedAtUtc != null && l.DisconnectedAtUtc >= dayStart && l.DisconnectedAtUtc < dayEnd)
            .Select(l => new { l.ConnectedAtUtc, l.DisconnectedAtUtc })
            .ToListAsync();
        var durations = listeners.Select(l => (l.DisconnectedAtUtc!.Value - l.ConnectedAtUtc).TotalSeconds).ToList();
        double avg = durations.Count > 0 ? durations.Average() : 0;
        return (joins, leaves, uniqueListeners, avg);
    }

    public async Task<IEnumerable<RadioListener>> GetActiveListenersAsync(int stationId)
        => await _db.RadioListeners.Where(l => l.RadioStationId == stationId && l.DisconnectedAtUtc == null).ToListAsync();

    public async Task<(int TotalJoins, int TotalLeaves, int UniqueListeners, double AvgListenSeconds)> GetStatsSummaryAsync(int stationId)
    {
        var totalJoins = await _db.RadioPlayStats.CountAsync(s => s.RadioStationId == stationId && s.EventType == RadioEventType.Join);
        var totalLeaves = await _db.RadioPlayStats.CountAsync(s => s.RadioStationId == stationId && s.EventType == RadioEventType.Leave);
        var listeners = await _db.RadioListeners
            .Where(l => l.RadioStationId == stationId && l.DisconnectedAtUtc != null)
            .Select(l => new { l.ConnectedAtUtc, l.DisconnectedAtUtc })
            .ToListAsync();
        var durations = listeners.Select(l => (l.DisconnectedAtUtc!.Value - l.ConnectedAtUtc).TotalSeconds).ToList();
        double avg = durations.Count > 0 ? durations.Average() : 0;
        var uniqueListeners = await _db.RadioListeners.Where(l => l.RadioStationId == stationId && l.UserId != null).Select(l => l.UserId).Distinct().CountAsync();
        return (totalJoins, totalLeaves, uniqueListeners, avg);
    }

    public async Task<IEnumerable<(int? UserId, int TotalSeconds)>> GetTopListenersAsync(int stationId, int take)
    {
        var listeners = await _db.RadioListeners
            .Where(l => l.RadioStationId == stationId && l.UserId != null && l.DisconnectedAtUtc != null)
            .Select(l => new { l.UserId, l.ConnectedAtUtc, l.DisconnectedAtUtc })
            .ToListAsync();
        return listeners
            .GroupBy(l => l.UserId)
            .Select(g => (g.Key, (int)g.Sum(x => (x.DisconnectedAtUtc!.Value - x.ConnectedAtUtc).TotalSeconds)))
            .OrderByDescending(x => x.Item2)
            .Take(take);
    }

    // ── Invites ──

    public async Task<RadioStationInvite?> GetInviteByTokenAsync(string token, CancellationToken ct = default)
        => await _db.RadioStationInvites.FirstOrDefaultAsync(i => i.Token == token, ct);

    public async Task<RadioStationInvite?> GetInviteByIdAsync(int inviteId, int stationId, CancellationToken ct = default)
        => await _db.RadioStationInvites.FirstOrDefaultAsync(i => i.Id == inviteId && i.RadioStationId == stationId, ct);

    public async Task<IEnumerable<RadioStationInvite>> GetInvitesByStationAsync(int stationId, CancellationToken ct = default)
        => await _db.RadioStationInvites.Where(i => i.RadioStationId == stationId).OrderByDescending(i => i.CreatedAt).ToListAsync(ct);

    public async Task AddInviteAsync(RadioStationInvite invite, CancellationToken ct = default)
    {
        _db.RadioStationInvites.Add(invite);
        await _db.SaveChangesAsync(ct);
    }

    // ── Voice Sessions ──

    public async Task<VoiceSession?> GetActiveVoiceSessionAsync(int stationId, CancellationToken ct = default)
        => await _db.VoiceSessions.FirstOrDefaultAsync(v => v.RadioStationId == stationId && v.IsLive, ct);

    public async Task AddVoiceSessionAsync(VoiceSession session, CancellationToken ct = default)
    {
        _db.VoiceSessions.Add(session);
        await _db.SaveChangesAsync(ct);
    }

    public async Task<VoiceSession?> GetVoiceSessionByIdAsync(int id, CancellationToken ct = default)
        => await _db.VoiceSessions.FindAsync(new object[] { id }, ct);

    // ── Voice Segments ──

    public async Task AddVoiceSegmentAsync(VoiceSegment segment, CancellationToken ct = default)
    {
        _db.VoiceSegments.Add(segment);
        await _db.SaveChangesAsync(ct);
    }

    public async Task<IEnumerable<VoiceSegment>> GetVoiceSegmentsForDayAsync(int stationId, DateTime dayStart, DateTime dayEnd, CancellationToken ct = default)
        => await _db.VoiceSegments
            .Include(s => s.VoiceSession)
            .Where(s => s.VoiceSession!.RadioStationId == stationId && s.TimestampUtc >= dayStart && s.TimestampUtc < dayEnd)
            .OrderBy(s => s.TimestampUtc)
            .ToListAsync(ct);
}
