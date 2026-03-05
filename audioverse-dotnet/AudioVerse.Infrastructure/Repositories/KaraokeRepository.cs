using Dapper;
using AudioVerse.Domain.Repositories;
using System.Data;
using AudioVerse.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using System.Text;
using Microsoft.Extensions.Logging;
using AudioVerse.Domain.Entities.Events;
using AudioVerse.Domain.Entities.UserProfiles;
using AudioVerse.Domain.Enums.Events;
using AudioVerse.Domain.Entities.Karaoke.KaraokeSongFiles;
using AudioVerse.Domain.Entities.Karaoke.KaraokeSingings;
using AudioVerse.Domain.Entities.Karaoke.KaraokePlayLists;
using AudioVerse.Domain.Entities.Karaoke.KaraokeTeams;
using AudioVerse.Domain.Entities.Karaoke.KaraokeSessions;

namespace AudioVerse.Infrastructure.Repositories
{
    public class KaraokeRepository : IDapperKaraokeRepository
    {
        private readonly IDbConnection _db;
        private readonly ILogger<KaraokeRepositoryEF> _logger;

        public KaraokeRepository(IDbConnection db, ILogger<KaraokeRepositoryEF> logger)
        {
            _db = db;
            _logger = logger;
        }

        public async Task<IEnumerable<KaraokeSessionPlayer>> GetParticipantsByEventAsync(int eventId)
        {
            var sql = @"SELECT ep.*, p.*
                        FROM KaraokeEventPlayers ep
                        LEFT JOIN UserProfilePlayers p ON ep.PlayerId = p.Id
                        WHERE ep.EventId = @EventId";
            return await _db.QueryAsync<KaraokeSessionPlayer, UserProfilePlayer, KaraokeSessionPlayer>(
                sql,
                (ep, player) => { ep.Player = player; return ep; },
                new { EventId = eventId },
                splitOn: "Id");
        }

        public async Task<bool> DeleteRoundPlayerAsync(int roundId, int assignmentId)
        {
            var sql = "DELETE FROM KaraokeRoundPlayers WHERE RoundId = @RoundId AND Id = @AssignmentId";
            var rows = await _db.ExecuteAsync(sql, new { RoundId = roundId, AssignmentId = assignmentId });
            return rows > 0;
        }

        public async Task<bool> UpdateRoundPlayerSlotAsync(int roundId, int assignmentId, int slot)
        {
            var sql = "UPDATE KaraokeRoundPlayers SET Slot = @Slot WHERE RoundId = @RoundId AND Id = @AssignmentId";
            var rows = await _db.ExecuteAsync(sql, new { Slot = slot, RoundId = roundId, AssignmentId = assignmentId });
            return rows > 0;
        }

        public async Task<bool> UpdateRoundPlayerMicAsync(int roundId, int assignmentId, string? micDeviceId)
        {
            var sql = "UPDATE KaraokeRoundPlayers SET \"MicDeviceId\" = @MicDeviceId WHERE \"RoundId\" = @RoundId AND \"Id\" = @AssignmentId";
            var rows = await _db.ExecuteAsync(sql, new { MicDeviceId = micDeviceId, RoundId = roundId, AssignmentId = assignmentId });
            return rows > 0;
        }

        public async Task<bool> UpdateKaraokePlayerStatusAsync(int eventId, int playerId, KaraokePlayerStatus status)
        {
            var sql = "UPDATE KaraokeEventPlayers SET Status = @Status WHERE PlayerId = @PlayerId AND EventId = @EventId";
            var rows = await _db.ExecuteAsync(sql, new { Status = (int)status, EventId = eventId, PlayerId = playerId });
            return rows > 0;
        }

        public async Task<int> AddEventInviteAsync(EventInvite invite)
        {
            // Event-centric invites: store EventId
            var sql = "INSERT INTO EventInvites (EventId, FromUserId, ToUserId, ToEmail, Status, Message, CreatedAt) VALUES (@EventId, @FromUserId, @ToUserId, @ToEmail, @Status, @Message, @CreatedAt) RETURNING Id";
            var id = await _db.QuerySingleAsync<int>(sql, new { invite.EventId, invite.FromUserId, invite.ToUserId, invite.ToEmail, Status = (int)invite.Status, invite.Message, invite.CreatedAt });
            return id;
        }

        public async Task<EventInvite?> GetEventInviteByIdAsync(int id)
        {
            var sql = "SELECT * FROM EventInvites WHERE Id = @Id";
            var invite = await _db.QueryFirstOrDefaultAsync<EventInvite>(sql, new { Id = id });
            return invite;
        }

        public async Task<IEnumerable<EventInvite>> GetInvitesByEventAsync(int eventId)
        {
            var sql = "SELECT * FROM EventInvites WHERE EventId = @EventId";
            return await _db.QueryAsync<EventInvite>(sql, new { EventId = eventId });
        }

        public async Task<int> AddInviteToEventAsync(EventInvite invite)
        {
            var sql = "INSERT INTO EventInvites (EventId, EventId, FromUserId, ToUserId, ToEmail, Status, Message, CreatedAt) VALUES (@EventId, @EventId, @FromUserId, @ToUserId, @ToEmail, @Status, @Message, @CreatedAt) RETURNING Id";
            return await _db.QuerySingleAsync<int>(sql, new { EventId = (int?)null, invite.FromUserId, invite.ToUserId, invite.ToEmail, Status = (int)invite.Status, invite.Message, invite.CreatedAt });
        }

        public async Task<bool> UpdateEventInviteAsync(EventInvite invite)
        {
            var sql = "UPDATE EventInvites SET Status = @Status, RespondedAt = @RespondedAt WHERE Id = @Id";
            var rows = await _db.ExecuteAsync(sql, new { Status = (int)invite.Status, RespondedAt = invite.RespondedAt, invite.Id });
            return rows > 0;
        }

        public async Task<bool> CancelEventInviteAsync(int inviteId)
        {
            var sql = "UPDATE EventInvites SET Status = @Status, RespondedAt = @RespondedAt WHERE Id = @Id";
            var rows = await _db.ExecuteAsync(sql, new { Status = (int)EventInviteStatus.Cancelled, RespondedAt = DateTime.UtcNow, Id = inviteId });
            return rows > 0;
        }

        public async Task<bool> RemovePlayerFromEventAsync(int eventId, int playerId)
        {
            var sql = "DELETE FROM KaraokeEventPlayers WHERE PlayerId = @PlayerId AND EventId = @EventId";
            var rows = await _db.ExecuteAsync(sql, new { PlayerId = playerId, EventId = eventId });
            return rows > 0;
        }

        public async Task<bool> RemoveParticipantFromEventAsync(int eventId, int playerId)
        {
            var sql = "DELETE FROM KaraokeEventPlayers WHERE PlayerId = @PlayerId AND EventId = @EventId";
            var rows = await _db.ExecuteAsync(sql, new { EventId = eventId, PlayerId = playerId });
            return rows > 0;
        }

        public async Task<KaraokeSessionPlayer?> GetKaraokePlayerAsync(int eventId, int playerId)
        {
            var sql = "SELECT * FROM KaraokeEventPlayers WHERE PlayerId = @PlayerId AND EventId = @EventId LIMIT 1";
            var pp = await _db.QueryFirstOrDefaultAsync<KaraokeSessionPlayer>(sql, new { EventId = eventId, PlayerId = playerId });
            return pp;
        }

        public async Task<bool> UpdateEventPlayerPermissionsAsync(int eventId, int playerId, EventPermission permissions)
        {
            var sql = "UPDATE KaraokeEventPlayers SET Permissions = @Permissions WHERE PlayerId = @PlayerId AND EventId = @EventId";
            var rows = await _db.ExecuteAsync(sql, new { Permissions = (int)permissions, EventId = eventId, PlayerId = playerId });
            return rows > 0;
        }

        public async Task<KaraokeSongFile?> GetSongByIdAsync(int id)
        {
            var song = await _db.QueryFirstOrDefaultAsync<KaraokeSongFile>(
                "SELECT * FROM KaraokeSongs WHERE Id = @Id", new { Id = id });
            
            if (song != null)
            {
                var notes = await _db.QueryAsync<KaraokeSongFileNote>(
                    "SELECT * FROM KaraokeNotes WHERE SongId = @SongId ORDER BY Id", new { SongId = id });
                song.Notes = notes.ToList();
            }

            return song;
        }

        public async Task<int> CreateEventAsync(Event ev)
        {
            var sql = "INSERT INTO Events (Title, Description, Type, StartTime, EndTime, OrganizerId) VALUES (@Title, @Description, @Type, @StartTime, @EndTime, @OrganizerId) RETURNING Id";
            return await _db.ExecuteScalarAsync<int>(sql, new { ev.Title, ev.Description, Type = (int)ev.Type, ev.StartTime, ev.EndTime, ev.OrganizerId });
        }

        public async Task<bool> UpdateEventAsync(Event ev)
        {
            var sql = "UPDATE Events SET Title=@Title, Description=@Description, Type=@Type, StartTime=@StartTime, EndTime=@EndTime WHERE Id=@Id";
            var rows = await _db.ExecuteAsync(sql, new { ev.Title, ev.Description, Type = (int)ev.Type, ev.StartTime, ev.EndTime, ev.Id });
            return rows > 0;
        }

        public async Task<bool> DeleteEventAsync(int eventId)
        {
            var sql = "DELETE FROM Events WHERE Id = @Id";
            var rows = await _db.ExecuteAsync(sql, new { Id = eventId });
            return rows > 0;
        }

        public async Task<Event?> GetEventByIdAsync(int eventId)
        {
            var sql = "SELECT * FROM Events WHERE Id = @Id";
            return await _db.QueryFirstOrDefaultAsync<Event>(sql, new { Id = eventId });
        }

        public async Task<Event?> GetEventByEventIdAsync(int eventId)
        {
            return await _db.QueryFirstOrDefaultAsync<Event>("SELECT * FROM Events WHERE Id = @Id", new { Id = eventId });
        }

        public async Task<UserProfilePlayer?> GetUserProfilePlayerByIdAsync(int playerId)
        {
            var p = await _db.QueryFirstOrDefaultAsync<UserProfilePlayer>("SELECT * FROM UserProfilePlayers WHERE Id = @Id", new { Id = playerId });
            return p;
        }

        public async Task<IEnumerable<Event>> GetAllPartiesAsync()
        {
            return await _db.QueryAsync<Event>("SELECT * FROM Events WHERE Type = @Type", new { Type = (int)AudioVerse.Domain.Enums.Events.EventType.Event });
        }

        public async Task<IEnumerable<KaraokeSongFile>> FilterSongsAsync(string? title, string? artist, string? genre, string? language, int? year)
        {
            var sql = "SELECT * FROM KaraokeSongs WHERE " +
                      "(@Title IS NULL OR Title LIKE '%' || @Title || '%') " +
                      "AND (@Artist IS NULL OR Artist LIKE '%' || @Artist || '%') " +
                      "AND (@Genre IS NULL OR Genre = @Genre) " +
                      "AND (@Language IS NULL OR Language = @Language) " +
                      "AND (@Year IS NULL OR Year = @Year)" +
                      " AND InDevelopment = false";

            return await _db.QueryAsync<KaraokeSongFile>(sql, new { Title = title, Artist = artist, Genre = genre, Language = language, Year = year });
        }

        public async Task<IEnumerable<KaraokeSongFile>> FilterSongsAdvancedAsync(string? search, string? genre, string? language, decimal? bpmMin, decimal? bpmMax, int? yearMin, int? yearMax, AudioVerse.Domain.Enums.KaraokeFormat? format, string? sortBy, bool descending = false)
        {
            var sql = "SELECT * FROM \"KaraokeSongs\" WHERE \"InDevelopment\" = false";
            if (!string.IsNullOrEmpty(search))
                sql += " AND (\"Title\" ILIKE '%' || @Search || '%' OR \"Artist\" ILIKE '%' || @Search || '%')";
            if (!string.IsNullOrEmpty(genre)) sql += " AND \"Genre\" = @Genre";
            if (!string.IsNullOrEmpty(language)) sql += " AND \"Language\" = @Language";
            if (bpmMin.HasValue) sql += " AND \"Bpm\" >= @BpmMin";
            if (bpmMax.HasValue) sql += " AND \"Bpm\" <= @BpmMax";
            if (yearMin.HasValue) sql += " AND \"Year\" >= @YearMin::text";
            if (yearMax.HasValue) sql += " AND \"Year\" <= @YearMax::text";
            if (format.HasValue) sql += " AND \"Format\" = @Format";

            var orderCol = sortBy?.ToLowerInvariant() switch { "bpm" => "\"Bpm\"", "year" => "\"Year\"", "artist" => "\"Artist\"", _ => "\"Title\"" };
            sql += $" ORDER BY {orderCol} {(descending ? "DESC" : "ASC")}";

            return await _db.QueryAsync<KaraokeSongFile>(sql, new { Search = search, Genre = genre, Language = language, BpmMin = bpmMin, BpmMax = bpmMax, YearMin = yearMin?.ToString(), YearMax = yearMax?.ToString(), Format = format.HasValue ? (int)format.Value : (int?)null });
        }

        public async Task<bool> AssignPlayerToEventAsync(KaraokeSessionPlayer partyPlayer)
        {
            // support EventId (migration-friendly) while keeping EventId for backward compat
            var sql = "INSERT INTO KaraokeEventPlayers (EventId, EventId, PlayerId, Status, Permissions) VALUES (@EventId, @EventId, @PlayerId, @Status, @Permissions)";
            var rowsAffected = await _db.ExecuteAsync(sql, new { partyPlayer.EventId, partyPlayer.PlayerId, Status = (int)partyPlayer.Status, Permissions = (int)partyPlayer.Permissions });
            return rowsAffected > 0;
        }

        public async Task<int> AddRoundAsync(KaraokeSessionRound round)
        {
            var sql = "INSERT INTO KaraokeEventRounds (EventId, PlayerId, RoundNumber) VALUES (@EventId, @PlayerId, @RoundNumber) RETURNING Id";
            return await _db.ExecuteScalarAsync<int>(sql, round);
        }

        public async Task<int> AddRoundPlayerAsync(KaraokeSessionRoundPlayer rp)
        {
            var sql = "INSERT INTO KaraokeRoundPlayers (RoundId, PlayerId, Slot, JoinedAt) VALUES (@RoundId, @PlayerId, @Slot, @JoinedAt) RETURNING Id";
            return await _db.ExecuteScalarAsync<int>(sql, rp);
        }

        public async Task<KaraokeSessionRoundPlayer?> GetRoundPlayerByIdAsync(int id)
        {
            var sql = @"SELECT rp.*, upp.Id as Player_Id, upp.Name as Player_Name, upp.ProfileId as Player_ProfileId, upp.PreferredColors as Player_PreferredColors, upp.IsPrimary as Player_IsPrimary
                        FROM KaraokeRoundPlayers rp
                        LEFT JOIN UserProfilePlayers upp ON rp.PlayerId = upp.Id
                        WHERE rp.Id = @Id";
            var item = await _db.QueryAsync<KaraokeSessionRoundPlayer, UserProfilePlayer, KaraokeSessionRoundPlayer>(
                sql,
                (rp, player) => { rp.Player = player; return rp; }, new { Id = id }, splitOn: "Player_Id");
            return item.FirstOrDefault();
        }

        public async Task<KaraokeSessionRoundPlayer?> FindExistingRoundPlayerAsync(int roundId, int playerId, int? slot)
        {
            // if slot provided, match round+player+slot, otherwise match round+player
            if (slot.HasValue)
            {
                var sql = "SELECT * FROM KaraokeRoundPlayers WHERE RoundId = @RoundId AND PlayerId = @PlayerId AND Slot = @Slot LIMIT 1";
                var rp = await _db.QueryFirstOrDefaultAsync<KaraokeSessionRoundPlayer>(sql, new { RoundId = roundId, PlayerId = playerId, Slot = slot.Value });
                return rp;
            }
            else
            {
                var sql = "SELECT * FROM KaraokeRoundPlayers WHERE RoundId = @RoundId AND PlayerId = @PlayerId LIMIT 1";
                var rp = await _db.QueryFirstOrDefaultAsync<KaraokeSessionRoundPlayer>(sql, new { RoundId = roundId, PlayerId = playerId });
                return rp;
            }
        }

        public async Task<int> CountRoundPlayersAsync(int roundId)
        {
            var sql = "SELECT COUNT(1) FROM KaraokeRoundPlayers WHERE RoundId = @RoundId";
            return await _db.ExecuteScalarAsync<int>(sql, new { RoundId = roundId });
        }

        public async Task<KaraokeSessionRound?> GetRoundByIdAsync(int roundId)
        {
            var sql = "SELECT * FROM KaraokeEventRounds WHERE Id = @Id";
            return await _db.QueryFirstOrDefaultAsync<KaraokeSessionRound>(sql, new { Id = roundId });
        }

        public async Task<IEnumerable<KaraokeSessionRound>> GetRoundsBySessionIdAsync(int sessionId)
        {
            var sql = @"SELECT r.*, s.Id AS Song_Id, s.Title AS Song_Title, s.Artist AS Song_Artist, s.Genre AS Song_Genre,
                               s.CoverPath AS Song_CoverPath, s.ExternalCoverUrl AS Song_ExternalCoverUrl
                        FROM KaraokeEventRounds r
                        LEFT JOIN KaraokeSongFiles s ON r.SongId = s.Id
                        WHERE r.SessionId = @SessionId
                        ORDER BY r.Number";
            var list = await _db.QueryAsync<KaraokeSessionRound, KaraokeSongFile, KaraokeSessionRound>(
                sql,
                (round, song) =>
                {
                    round.Song = song;
                    return round;
                }, new { SessionId = sessionId }, splitOn: "Song_Id");
            return list;
        }

        public async Task<bool> ReorderSessionRoundsAsync(int sessionId, List<int> roundIds)
        {
            if (roundIds == null || roundIds.Count == 0) return false;
            using var transaction = _db.BeginTransaction();
            try
            {
                for (int i = 0; i < roundIds.Count; i++)
                {
                    await _db.ExecuteAsync(
                        "UPDATE KaraokeEventRounds SET Number = @Number WHERE Id = @Id AND SessionId = @SessionId",
                        new { Number = i + 1, Id = roundIds[i], SessionId = sessionId },
                        transaction);
                }
                transaction.Commit();
                return true;
            }
            catch
            {
                transaction.Rollback();
                return false;
            }
        }

        public async Task<IEnumerable<KaraokeSessionRoundPlayer>> GetRoundPlayersAsync(int roundId)
        {
            var sql = @"SELECT rp.*, upp.Id as Player_Id, upp.Name as Player_Name, upp.ProfileId as Player_ProfileId, upp.PreferredColors as Player_PreferredColors, upp.IsPrimary as Player_IsPrimary
                        FROM KaraokeRoundPlayers rp
                        LEFT JOIN UserProfilePlayers upp ON rp.PlayerId = upp.Id
                        WHERE rp.RoundId = @RoundId
                        ORDER BY CASE WHEN rp.Slot IS NULL THEN 1 ELSE 0 END, rp.Slot";
            var dict = new Dictionary<int, KaraokeSessionRoundPlayer>();
            var list = await _db.QueryAsync<KaraokeSessionRoundPlayer, UserProfilePlayer, KaraokeSessionRoundPlayer>(
                sql,
                (rp, player) =>
                {
                    rp.Player = player;
                    return rp;
                }, new { RoundId = roundId }, splitOn: "Player_Id");
            return list;
        }

        public async Task<IEnumerable<KaraokeSessionRoundPlayer>> GetRoundPlayersByUserAsync(int roundId, int userId)
        {
            var sql = @"SELECT rp.*, upp.Id as Player_Id, upp.Name as Player_Name, upp.ProfileId as Player_ProfileId,
                               upp.PreferredColors as Player_PreferredColors, upp.IsPrimary as Player_IsPrimary,
                               upp.FillPattern as Player_FillPattern, upp.Icon as Player_Icon,
                               upp.KaraokeSettings as Player_KaraokeSettings
                        FROM KaraokeRoundPlayers rp
                        LEFT JOIN UserProfilePlayers upp ON rp.PlayerId = upp.Id
                        WHERE rp.RoundId = @RoundId AND upp.ProfileId = @UserId
                        ORDER BY CASE WHEN rp.Slot IS NULL THEN 1 ELSE 0 END, rp.Slot";
            var list = await _db.QueryAsync<KaraokeSessionRoundPlayer, UserProfilePlayer, KaraokeSessionRoundPlayer>(
                sql,
                (rp, player) =>
                {
                    rp.Player = player;
                    return rp;
                }, new { RoundId = roundId, UserId = userId }, splitOn: "Player_Id");
            return list;
        }

        public async Task<int> AddSessionAsync(KaraokeSession session)
        {
            var sql = "INSERT INTO KaraokeSessions (EventId, Name, CreatedAt, StartedAt, EndedAt) VALUES (@EventId, @Name, @CreatedAt, @StartedAt, @EndedAt) RETURNING Id";
            return await _db.ExecuteScalarAsync<int>(sql, new { session.EventId, session.Name, session.CreatedAt, session.StartedAt, session.EndedAt });
        }

        public async Task<int> AddSessionToEventAsync(KaraokeSession session)
        {
            var sql = "INSERT INTO KaraokeSessions (EventId, Name, CreatedAt, StartedAt, EndedAt) VALUES (@EventId, @Name, @CreatedAt, @StartedAt, @EndedAt) RETURNING Id";
            return await _db.ExecuteScalarAsync<int>(sql, new { session.EventId, session.Name, session.CreatedAt, session.StartedAt, session.EndedAt });
        }

        public async Task<IEnumerable<KaraokeSession>> GetSessionsByEventAsync(int eventId)
        {
            var sql = "SELECT * FROM KaraokeSessions WHERE EventId = @EventId";
            return await _db.QueryAsync<KaraokeSession>(sql, new { EventId = eventId });
        }

        public async Task<int> AddRoundPartAsync(KaraokeSessionRoundPart part)
        {
            var sql = "INSERT INTO KaraokeRoundParts (RoundId, PartNumber, PerformedAt) VALUES (@RoundId, @PartNumber, @PerformedAt) RETURNING Id";
            return await _db.ExecuteScalarAsync<int>(sql, part);
        }

        public async Task<int> AddSongToRoundAsync(KaraokeSinging singing)
        {
            var sql = "INSERT INTO KaraokeSingings (PlayerId, RoundId, SongId, Score) VALUES (@PlayerId, @RoundId, @SongId, @Score) RETURNING Id";
            return await _db.ExecuteScalarAsync<int>(sql, singing);
        }

        public async Task<bool> SaveSingingResultsAsync(IEnumerable<KaraokeSinging> results)
        {
            var sql = "UPDATE KaraokeSingings SET Score = @Score WHERE PlayerId = @PlayerId AND RoundId = @RoundId";
            var rowsAffected = 0;
            foreach (var result in results)
            {
                rowsAffected += await _db.ExecuteAsync(sql, result);
            }
            return rowsAffected > 0;
        }

        public async Task<IEnumerable<KaraokeSongFile>> ScanFolderAsync(string folderPath)
        {
            var songs = new List<KaraokeSongFile>();
            var files = Directory.GetFiles(folderPath, "*.txt", SearchOption.AllDirectories);

            foreach (var file in files)
            {
                var song = await ParseUltrastarSong(file);
                if (song != null)
                    songs.Add(song);
            }

            return songs;
        }

        public async Task<bool> DeletePlayerAsync(int playerId)
        {
            var sql = "DELETE FROM KaraokePlayers WHERE Id = @Id";
            return await _db.ExecuteAsync(sql, new { Id = playerId }) > 0;
        }

        public async Task<Event?> GetEventStatusAsync(int eventId)
        {
            return await _db.QueryFirstOrDefaultAsync<Event>("SELECT * FROM Events WHERE Id = @Id", new { Id = eventId });
        }


        public async Task<List<KaraokeSongFile>> GetAllSongsAsync()
        {
            string sql = "SELECT * FROM KaraokeSongs WHERE InDevelopment = false";
            var songs = await _db.QueryAsync<KaraokeSongFile>(sql);
            return songs.ToList();
        }

        public async Task<List<KaraokeSongFile>> GetAllSongsIncludingInDevelopmentAsync()
        {
            string sql = "SELECT * FROM KaraokeSongs";
            var songs = await _db.QueryAsync<KaraokeSongFile>(sql);
            return songs.ToList();
        }

        public async Task<IEnumerable<UserProfilePlayer>> GetAllPlayersAsync()
        {
            var sql = "SELECT * FROM UserProfilePlayers WHERE Id IN (SELECT DISTINCT PlayerId FROM KaraokeEventPlayers)";
            return await _db.QueryAsync<UserProfilePlayer>(sql);
        }

        public async Task<int> SaveSongSnapshotAsync(KaraokeSongFileHistory history)
        {
            var sql = @"INSERT INTO KaraokeSongFileHistories (KaraokeSongFileId, Version, DataJson, ChangedByUserId, Reason, ChangedAt)
                         VALUES (@KaraokeSongFileId, @Version, @DataJson, @ChangedByUserId, @Reason, @ChangedAt) RETURNING Id";
            return await _db.ExecuteScalarAsync<int>(sql, history);
        }

        public async Task<IEnumerable<KaraokeSongFileHistory>> GetSongHistoryAsync(int songId)
        {
            var sql = "SELECT * FROM KaraokeSongFileHistories WHERE KaraokeSongFileId = @SongId ORDER BY Version DESC";
            return await _db.QueryAsync<KaraokeSongFileHistory>(sql, new { SongId = songId });
        }

        public async Task<KaraokeSongFileHistory?> GetSongVersionAsync(int songId, int version)
        {
            var sql = "SELECT * FROM KaraokeSongFileHistories WHERE KaraokeSongFileId = @SongId AND Version = @Version LIMIT 1";
            return await _db.QueryFirstOrDefaultAsync<KaraokeSongFileHistory>(sql, new { SongId = songId, Version = version });
        }

        public async Task<bool> RevertSongToVersionAsync(int songId, int version, int? changedByUserId = null, string? reason = null)
        {
            var hist = await GetSongVersionAsync(songId, version);
            if (hist == null) return false;

            var song = (await _db.QueryAsync<KaraokeSongFile>("SELECT * FROM KaraokeSongs WHERE Id = @Id", new { Id = songId })).FirstOrDefault();
            if (song == null) return false;

            var obj = System.Text.Json.JsonSerializer.Deserialize<KaraokeSongFile>(hist.DataJson);
            if (obj == null) return false;

            // apply scalars
            song.Title = obj.Title;
            song.Artist = obj.Artist;
            song.Genre = obj.Genre;
            song.Language = obj.Language;
            song.Year = obj.Year;
            song.CoverPath = obj.CoverPath;
            song.AudioPath = obj.AudioPath;
            song.VideoPath = obj.VideoPath;
            song.Gap = obj.Gap;
            song.VideoGap = obj.VideoGap;
            song.Start = obj.Start;
            song.End = obj.End;
            song.IsVerified = obj.IsVerified;
            song.InDevelopment = obj.InDevelopment;
            song.OwnerId = obj.OwnerId;
            song.CanBeModifiedByAll = obj.CanBeModifiedByAll;

            // update DB (simple approach)
            var updateSql = @"UPDATE KaraokeSongs SET Title=@Title, Artist=@Artist, Genre=@Genre, Language=@Language, Year=@Year,
                               CoverPath=@CoverPath, AudioPath=@AudioPath, VideoPath=@VideoPath, Gap=@Gap, VideoGap=@VideoGap,
                               Start=@Start, End=@End, IsVerified=@IsVerified, InDevelopment=@InDevelopment, OwnerId=@OwnerId, CanBeModifiedByAll=@CanBeModifiedByAll
                               WHERE Id=@Id";
            await _db.ExecuteAsync(updateSql, new {
                Title = song.Title,
                Artist = song.Artist,
                Genre = song.Genre,
                Language = song.Language,
                Year = song.Year,
                CoverPath = song.CoverPath,
                AudioPath = song.AudioPath,
                VideoPath = song.VideoPath,
                Gap = song.Gap,
                VideoGap = song.VideoGap,
                Start = song.Start,
                End = song.End,
                IsVerified = song.IsVerified,
                InDevelopment = song.InDevelopment,
                OwnerId = song.OwnerId,
                CanBeModifiedByAll = song.CanBeModifiedByAll,
                Id = song.Id
            });

            // Insert new history snapshot for revert
            var newVersion = (await _db.QueryFirstOrDefaultAsync<int?>("SELECT MAX(Version) FROM KaraokeSongFileHistories WHERE KaraokeSongFileId = @SongId", new { SongId = songId }) ?? 0) + 1;
            var insertSql = @"INSERT INTO KaraokeSongFileHistories (KaraokeSongFileId, Version, DataJson, ChangedByUserId, Reason, ChangedAt)
                              VALUES (@KaraokeSongFileId, @Version, @DataJson, @ChangedByUserId, @Reason, @ChangedAt)";
            await _db.ExecuteAsync(insertSql, new {
                KaraokeSongFileId = songId,
                Version = newVersion,
                DataJson = hist.DataJson,
                ChangedByUserId = changedByUserId,
                Reason = reason,
                ChangedAt = DateTime.UtcNow
            });

            return true;
        }

        public async Task<IEnumerable<int>> GetCollaboratorUserIdsAsync(int songId)
        {
            var sql = "SELECT UserId FROM KaraokeSongCollaborators WHERE SongId = @SongId";
            var ids = await _db.QueryAsync<int>(sql, new { SongId = songId });
            return ids.ToList();
        }

        public async Task<bool> AddCollaboratorAsync(int songId, int userId, AudioVerse.Domain.Enums.CollaborationPermission permission)
        {
            var exists = await _db.QueryFirstOrDefaultAsync<int?>("SELECT 1 FROM KaraokeSongCollaborators WHERE SongId = @SongId AND UserId = @UserId", new { SongId = songId, UserId = userId });
            if (exists.HasValue) return false;
            var sql = "INSERT INTO KaraokeSongCollaborators (SongId, UserId, Permission) VALUES (@SongId, @UserId, @Permission)";
            await _db.ExecuteAsync(sql, new { SongId = songId, UserId = userId, Permission = (int)permission });
            return true;
        }

        public async Task<bool> RemoveCollaboratorAsync(int songId, int userId)
        {
            var sql = "DELETE FROM KaraokeSongCollaborators WHERE SongId = @SongId AND UserId = @UserId";
            var rows = await _db.ExecuteAsync(sql, new { SongId = songId, UserId = userId });
            return rows > 0;
        }

        public async Task<bool> UpdateCollaboratorPermissionAsync(int songId, int userId, AudioVerse.Domain.Enums.CollaborationPermission permission)
        {
            var sql = "UPDATE KaraokeSongCollaborators SET Permission = @Permission WHERE SongId = @SongId AND UserId = @UserId";
            var rows = await _db.ExecuteAsync(sql, new { Permission = (int)permission, SongId = songId, UserId = userId });
            return rows > 0;
        }

        public async Task<AudioVerse.Domain.Enums.CollaborationPermission?> GetCollaboratorPermissionAsync(int songId, int userId)
        {
            var sql = "SELECT Permission FROM KaraokeSongCollaborators WHERE SongId = @SongId AND UserId = @UserId LIMIT 1";
            var val = await _db.QueryFirstOrDefaultAsync<int?>(sql, new { SongId = songId, UserId = userId });
            if (!val.HasValue) return null;
            return (AudioVerse.Domain.Enums.CollaborationPermission)val.Value;
        }

        public async Task<IEnumerable<KaraokeSongFile>> GetAvailableSongsForUserAsync(int? userId, bool includeInDevelopment = false)
        {
            // Simple SQL filter: include non-development if requested and respect owner/canbemodifiedbyall
            var where = new StringBuilder();
            var parameters = new DynamicParameters();
            if (!includeInDevelopment)
            {
                where.Append("InDevelopment = false");
            }

            if (userId.HasValue)
            {
                if (where.Length > 0) where.Append(" AND ");
                where.Append("(OwnerId = @UserId OR CanBeModifiedByAll = true OR OwnerId IS NULL OR EXISTS (SELECT 1 FROM KaraokeSongCollaborators ksc WHERE ksc.SongId = KaraokeSongs.Id AND ksc.UserId = @UserId))");
                parameters.Add("UserId", userId.Value);
            }

            var sql = $"SELECT * FROM KaraokeSongs" + (where.Length > 0 ? " WHERE " + where.ToString() : string.Empty);
            var songs = await _db.QueryAsync<KaraokeSongFile>(sql, parameters);
            return songs.ToList();
        }

        public async Task<Event?> GetEventWithPlayersAsync(int eventId)
        {
            var ev = await _db.QueryFirstOrDefaultAsync<Event>("SELECT * FROM Events WHERE Id = @Id", new { Id = eventId });
            return ev;
        }

        public async Task<KaraokeSongFile?> ParseUltrastarSong(string filePath)
        {
            Console.WriteLine($"#Parsing Ultrastar song from {filePath}");
            _logger.LogInformation($"Parsing Ultrastar song from {filePath}");
            var lines = File.ReadAllLines(filePath);
            return await ParseUltrastarSong(lines, filePath);
        }

        public async Task<KaraokeSongFile?> ParseUltrastarSong(byte[] fileData, string fileName = "uploaded.txt")
        {
            Console.WriteLine($"#Parsing Ultrastar song from bytes: {fileName}");
            _logger.LogInformation($"Parsing Ultrastar song from bytes: {fileName}");
            var fileContent = Encoding.UTF8.GetString(fileData);
            Console.WriteLine($"#File content: {fileContent}");
            _logger.LogInformation($"File content: {fileContent}");
            var lines = fileContent.Split(new[] { "\r\n", "\n" }, StringSplitOptions.None);
            Console.WriteLine($"#File lines: {lines.Length}");
            _logger.LogInformation($"File lines: {lines.Length}");
            KaraokeSongFile? song = await ParseUltrastarSong(lines, fileName);
            Console.WriteLine("#Finished parsing Ultrastar song");
            _logger.LogInformation("Finished parsing Ultrastar song");
            return song;
        }

        public async Task<KaraokeSongFile?> ParseUltrastarSong(string[] lines, string filePath)
        {
            Console.WriteLine($"#Parsing Ultrastar song from {lines.Length} lines");
            _logger.LogInformation($"Parsing Ultrastar song from {lines.Length} lines");
            var song = new KaraokeSongFile
            {
                FilePath = filePath,
                Format = KaraokeFormat.Ultrastar
                , InDevelopment = false
            };

            bool isNoteSection = false;

            foreach (var line in lines)
            {
                if (line.StartsWith(":") || line.StartsWith("*") || line.StartsWith("-") || line.StartsWith("E"))
                {
                    isNoteSection = true;
                    song.Notes.Add(new KaraokeSongFileNote { NoteLine = line, SongId = song.Id });
                }
                else if (!isNoteSection)
                {
                    if (line.StartsWith("#TITLE:"))
                        song.Title = line.Replace("#TITLE:", "").Trim();
                    else if (line.StartsWith("#ARTIST:"))
                        song.Artist = line.Replace("#ARTIST:", "").Trim();
                    else if (line.StartsWith("#GENRE:"))
                        song.Genre = line.Replace("#GENRE:", "").Trim();
                    else if (line.StartsWith("#LANGUAGE:"))
                        song.Language = line.Replace("#LANGUAGE:", "").Trim();
                    else if (line.StartsWith("#YEAR:"))
                        song.Year = line.Replace("#YEAR:", "").Trim();
                    else if (line.StartsWith("#COVER:"))
                        song.CoverPath = line.Replace("#COVER:", "").Trim();
                    else if (line.StartsWith("#MP3:"))
                        song.AudioPath = line.Replace("#MP3:", "").Trim();
                    else if (line.StartsWith("#VIDEO:"))
                        song.VideoPath = line.Replace("#VIDEO:", "").Trim();
                    else if (line.StartsWith("#GAP:"))
                    {
                        if (int.TryParse(line.Replace("#GAP:", "").Trim(), out var gap))
                            song.Gap = gap;
                    }
                    else if (line.StartsWith("#BPM:"))
                    {
                        if (decimal.TryParse(line.Replace("#BPM:", "").Trim(), out var bpm))
                            song.Bpm = bpm;
                    }
                    else if (line.StartsWith("#VIDEOGAP:"))
                    {
                        if (int.TryParse(line.Replace("#VIDEOGAP:", "").Trim(), out var videogap))
                            song.VideoGap = videogap;
                    }
                    else if (line.StartsWith("#START:"))
                    {
                        if (int.TryParse(line.Replace("#START:", "").Trim(), out var start))
                            song.Start = start;
                    }
                    else if (line.StartsWith("#END:"))
                    {
                        if (int.TryParse(line.Replace("#END:", "").Trim(), out var end))
                            song.End = end;
                    }
                }
            }

            return string.IsNullOrEmpty(song.Title) || string.IsNullOrEmpty(song.Artist) ? null : song;
        }

        public async Task<KaraokePlaylist?> GetPlaylistWithSongsAsync(int playlistId)
        {
            string sql = @"
                SELECT * FROM KaraokePlaylists WHERE Id = @PlaylistId;
                SELECT ks.* FROM KaraokePlaylistSongs kps
                JOIN KaraokeSongs ks ON kps.SongId = ks.Id
                WHERE kps.PlaylistId = @PlaylistId;";

            using var multi = await _db.QueryMultipleAsync(sql, new { PlaylistId = playlistId });

            var playlist = await multi.ReadSingleOrDefaultAsync<KaraokePlaylist>();
            if (playlist != null)
            {
                playlist.PlaylistSongs = (await multi.ReadAsync<KaraokePlaylistSong>())
                    .Select(ps => new KaraokePlaylistSong
                    {
                        PlaylistId = playlist.Id,
                        SongId = ps.SongId,
                        Song = ps.Song
                    })
                    .ToList();
            }

            return playlist;
        }

        public async Task<int> AddKaraokeSongFileAsync(KaraokeSongFile song)
        {
            var sql = @"INSERT INTO KaraokeSongs (Title, Artist, Genre, Language, Year, FilePath, AudioPath, VideoPath, CoverPath, Format, Gap, VideoGap, Start, End, InDevelopment, IsVerified, OwnerId, CanBeModifiedByAll)
                       VALUES (@Title, @Artist, @Genre, @Language, @Year, @FilePath, @AudioPath, @VideoPath, @CoverPath, @Format, @Gap, @VideoGap, @Start, @End, @InDevelopment, @IsVerified, @OwnerId, @CanBeModifiedByAll)
                       RETURNING Id";
            var id = await _db.ExecuteScalarAsync<int>(sql, song);

            // insert history snapshot
            var histSql = @"INSERT INTO KaraokeSongFileHistories (KaraokeSongFileId, Version, DataJson, ChangedAt)
                            VALUES (@KaraokeSongFileId, @Version, @DataJson, @ChangedAt)";
            var dataJson = System.Text.Json.JsonSerializer.Serialize(song);
            await _db.ExecuteAsync(histSql, new { KaraokeSongFileId = id, Version = 1, DataJson = dataJson, ChangedAt = DateTime.UtcNow });
            return id;
        }

        public async Task<int> AddKaraokeSongFilesAsync(IEnumerable<KaraokeSongFile> songs)
        {
            var count = 0;
            foreach (var song in songs)
            {
                await AddKaraokeSongFileAsync(song);
                count++;
            }
            return count;
        }

        // ?? Teams (Dapper) ??

        public async Task<int> CreateTeamAsync(KaraokeTeam team)
        {
            var sql = "INSERT INTO KaraokeTeams (Name, EventId, CreatedByPlayerId, AvatarKey, Color) VALUES (@Name, @EventId, @CreatedByPlayerId, @AvatarKey, @Color) RETURNING Id";
            return await _db.ExecuteScalarAsync<int>(sql, new { team.Name, team.EventId, team.CreatedByPlayerId, team.AvatarKey, team.Color });
        }

        public async Task<KaraokeTeam?> GetTeamByIdAsync(int teamId)
        {
            var sql = "SELECT * FROM KaraokeTeams WHERE Id = @Id";
            return await _db.QueryFirstOrDefaultAsync<KaraokeTeam>(sql, new { Id = teamId });
        }

        public async Task<IEnumerable<KaraokeTeam>> GetTeamsByEventAsync(int eventId)
        {
            var sql = "SELECT * FROM KaraokeTeams WHERE EventId = @EventId";
            return await _db.QueryAsync<KaraokeTeam>(sql, new { EventId = eventId });
        }

        public async Task<bool> UpdateTeamAsync(KaraokeTeam team)
        {
            var sql = "UPDATE KaraokeTeams SET Name=@Name, Color=@Color, AvatarKey=@AvatarKey WHERE Id=@Id";
            return await _db.ExecuteAsync(sql, new { team.Name, team.Color, team.AvatarKey, team.Id }) > 0;
        }

        public async Task<bool> DeleteTeamAsync(int teamId)
        {
            return await _db.ExecuteAsync("DELETE FROM KaraokeTeams WHERE Id = @Id", new { Id = teamId }) > 0;
        }

        public async Task<int> AddTeamPlayerAsync(KaraokeTeamPlayer tp)
        {
            var existing = await _db.QueryFirstOrDefaultAsync<int?>("SELECT Id FROM KaraokeTeamPlayers WHERE TeamId = @TeamId AND PlayerId = @PlayerId", new { tp.TeamId, tp.PlayerId });
            if (existing.HasValue) return existing.Value;
            var sql = "INSERT INTO KaraokeTeamPlayers (TeamId, PlayerId, JoinedAt, Role) VALUES (@TeamId, @PlayerId, @JoinedAt, @Role) RETURNING Id";
            return await _db.ExecuteScalarAsync<int>(sql, new { tp.TeamId, tp.PlayerId, tp.JoinedAt, tp.Role });
        }

        public async Task<bool> RemoveTeamPlayerAsync(int teamId, int playerId)
        {
            return await _db.ExecuteAsync("DELETE FROM KaraokeTeamPlayers WHERE TeamId = @TeamId AND PlayerId = @PlayerId", new { TeamId = teamId, PlayerId = playerId }) > 0;
        }

        public async Task<IEnumerable<KaraokeTeamPlayer>> GetTeamPlayersAsync(int teamId)
        {
            var sql = "SELECT * FROM KaraokeTeamPlayers WHERE TeamId = @TeamId";
            return await _db.QueryAsync<KaraokeTeamPlayer>(sql, new { TeamId = teamId });
        }

        // ?? Song Queue (Dapper) ??

        public async Task<int> AddSongQueueItemAsync(KaraokeSongFileQueueItem item)
        {
            var sql = "INSERT INTO KaraokeSongQueueItems (EventId, SongId, RequestedByPlayerId, Position, Status, RequestedAt) VALUES (@EventId, @SongId, @RequestedByPlayerId, @Position, @Status, @RequestedAt) RETURNING Id";
            return await _db.ExecuteScalarAsync<int>(sql, new { item.EventId, item.SongId, item.RequestedByPlayerId, item.Position, Status = (int)item.Status, item.RequestedAt });
        }

        public async Task<IEnumerable<KaraokeSongFileQueueItem>> GetSongQueueByEventAsync(int eventId)
        {
            var sql = "SELECT * FROM KaraokeSongQueueItems WHERE EventId = @EventId ORDER BY Position";
            return await _db.QueryAsync<KaraokeSongFileQueueItem>(sql, new { EventId = eventId });
        }

        public async Task<bool> UpdateSongQueueItemStatusAsync(int id, AudioVerse.Domain.Enums.SongQueueStatus status)
        {
            var sql = "UPDATE KaraokeSongQueueItems SET Status = @Status WHERE Id = @Id";
            return await _db.ExecuteAsync(sql, new { Status = (int)status, Id = id }) > 0;
        }

        public async Task<bool> RemoveSongQueueItemAsync(int id)
        {
            return await _db.ExecuteAsync("DELETE FROM KaraokeSongQueueItems WHERE Id = @Id", new { Id = id }) > 0;
        }

        // ?? Favorites (Dapper) ??

        public async Task<int> AddFavoriteSongAsync(AudioVerse.Domain.Entities.Karaoke.KaraokeFavoriteSong fav)
        {
            var sql = "INSERT INTO FavoriteSongs (PlayerId, SongId, AddedAt) VALUES (@PlayerId, @SongId, @AddedAt) ON CONFLICT DO NOTHING RETURNING Id";
            return await _db.ExecuteScalarAsync<int>(sql, new { fav.PlayerId, fav.SongId, fav.AddedAt });
        }

        public async Task<bool> RemoveFavoriteSongAsync(int playerId, int songId)
        {
            return await _db.ExecuteAsync("DELETE FROM FavoriteSongs WHERE PlayerId = @PlayerId AND SongId = @SongId", new { PlayerId = playerId, SongId = songId }) > 0;
        }

        public async Task<IEnumerable<AudioVerse.Domain.Entities.Karaoke.KaraokeFavoriteSong>> GetFavoriteSongsAsync(int playerId)
        {
            return await _db.QueryAsync<AudioVerse.Domain.Entities.Karaoke.KaraokeFavoriteSong>("SELECT * FROM FavoriteSongs WHERE PlayerId = @PlayerId ORDER BY AddedAt DESC", new { PlayerId = playerId });
        }

        // ????????????????????????????????????????????????????????????
        //  Song CRUD (Dapper)
        // ????????????????????????????????????????????????????????????

        public async Task<bool> UpdateSongAsync(KaraokeSongFile song)
        {
            var sql = @"UPDATE KaraokeSongs SET 
                Title = @Title, Artist = @Artist, Genre = @Genre, Language = @Language, 
                Year = @Year, Bpm = @Bpm, Gap = @Gap, IsVerified = @IsVerified, InDevelopment = @InDevelopment
                WHERE Id = @Id";
            return await _db.ExecuteAsync(sql, song) > 0;
        }

        public async Task<bool> DeleteSongAsync(int songId)
        {
            return await _db.ExecuteAsync("DELETE FROM KaraokeSongs WHERE Id = @Id", new { Id = songId }) > 0;
        }

        public async Task<bool> SetSongVerifiedAsync(int songId, bool isVerified)
        {
            return await _db.ExecuteAsync("UPDATE KaraokeSongs SET IsVerified = @IsVerified WHERE Id = @Id", 
                new { Id = songId, IsVerified = isVerified }) > 0;
        }

        public async Task<bool> SetSongInDevelopmentAsync(int songId, bool inDevelopment)
        {
            return await _db.ExecuteAsync("UPDATE KaraokeSongs SET InDevelopment = @InDevelopment WHERE Id = @Id", 
                new { Id = songId, InDevelopment = inDevelopment }) > 0;
        }

        public async Task<bool> SetSongsVerifiedAsync(IEnumerable<int> songIds, bool isVerified)
        {
            return await _db.ExecuteAsync("UPDATE KaraokeSongs SET IsVerified = @IsVerified WHERE Id = ANY(@Ids)", 
                new { Ids = songIds.ToArray(), IsVerified = isVerified }) > 0;
        }

        public async Task<bool> SetSongsInDevelopmentAsync(IEnumerable<int> songIds, bool inDevelopment)
        {
            return await _db.ExecuteAsync("UPDATE KaraokeSongs SET InDevelopment = @InDevelopment WHERE Id = ANY(@Ids)", 
                new { Ids = songIds.ToArray(), InDevelopment = inDevelopment }) > 0;
        }

        public Task<IEnumerable<KaraokeSinging>> GetRankingSingingsAsync(int top, CancellationToken ct = default) => throw new NotImplementedException("Use KaraokeRepositoryEF");
        public Task<IEnumerable<KaraokeSinging>> GetHistorySingingsAsync(int userId, int take, CancellationToken ct = default) => throw new NotImplementedException("Use KaraokeRepositoryEF");
        public Task<IEnumerable<KaraokeSinging>> GetActivitySingingsAsync(int days, CancellationToken ct = default) => throw new NotImplementedException("Use KaraokeRepositoryEF");
        public Task<IEnumerable<KaraokeSinging>> GetTopSingingsForSongAsync(int songId, int take, CancellationToken ct = default) => throw new NotImplementedException("Use KaraokeRepositoryEF");
        public IQueryable<KaraokeSongFile> GetSongsQueryable() => throw new NotImplementedException("Use KaraokeRepositoryEF");
    }
}

