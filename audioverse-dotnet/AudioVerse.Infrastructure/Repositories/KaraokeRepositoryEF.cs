using AudioVerse.Domain.Entities.Events;
using AudioVerse.Domain.Entities.UserProfiles;
using AudioVerse.Domain.Enums;
using AudioVerse.Domain.Enums.Events;
using AudioVerse.Domain.Repositories;
using AudioVerse.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System.Text;
using AudioVerse.Domain.Entities.Karaoke.KaraokeSongFiles;
using AudioVerse.Domain.Entities.Karaoke.KaraokeSingings;
using AudioVerse.Domain.Entities.Karaoke.KaraokePlayLists;
using AudioVerse.Domain.Entities.Karaoke.KaraokeTeams;
using AudioVerse.Domain.Entities.Karaoke.KaraokeSessions;

namespace AudioVerse.Infrastructure.Repositories
{
    /// <summary>
    /// Entity Framework implementation of the karaoke repository.
    /// Handles CRUD operations for karaoke songs, parties, rounds, and related entities.
    /// </summary>
    /// <remarks>
    /// This repository uses EF Core for complex queries with eager loading.
    /// For simple read-heavy queries, consider using the Dapper-based repository.
    /// </remarks>
    public class KaraokeRepositoryEF : IEfKaraokeRepository, IKaraokeSongPickRepository
    {
        private readonly AudioVerseDbContext _dbContext;
        private readonly ILogger<KaraokeRepositoryEF> _logger;

        public KaraokeRepositoryEF(AudioVerseDbContext dbContext, ILogger<KaraokeRepositoryEF> logger)
        {
            _dbContext = dbContext;
            _logger = logger;
        }

        /// <summary>
        /// Retrieves a karaoke song by ID with all associated notes.
        /// </summary>
        /// <param name="id">The song ID</param>
        /// <returns>The song with notes, or null if not found</returns>
        public async Task<KaraokeSongFile?> GetSongByIdAsync(int id)
        {
            return await _dbContext.KaraokeSongs
                .Include(s => s.Notes)
                .Include(s => s.LinkedSong).ThenInclude(ls => ls!.PrimaryArtist)
                .Include(s => s.LinkedSong).ThenInclude(ls => ls!.Album)
                .Include(s => s.LinkedSong).ThenInclude(ls => ls!.Details)
                .FirstOrDefaultAsync(s => s.Id == id);
        }

        // Legacy party creation removed - use CreateEventAsync instead.

        /// <summary>
        /// Creates a new event.
        /// </summary>
        /// <param name="ev">The event entity to create</param>
        /// <returns>The ID of the created event</returns>
        public async Task<int> CreateEventAsync(Event ev)
        {
            _dbContext.Add(ev);
            await _dbContext.SaveChangesAsync();
            return ev.Id;
        }

        /// <summary>
        /// Updates an existing event.
        /// </summary>
        /// <param name="ev">The event with updated values</param>
        /// <returns>True if updated, false if not found</returns>
        public async Task<bool> UpdateEventAsync(Event ev)
        {
            var existing = await _dbContext.Set<Event>().FindAsync(ev.Id);
            if (existing == null) return false;
            
            existing.Title = ev.Title;
            existing.Description = ev.Description;
            existing.StartTime = ev.StartTime;
            existing.EndTime = ev.EndTime;
            existing.Type = ev.Type;
            existing.Status = ev.Status;
            existing.LocationType = ev.LocationType;
            existing.Access = ev.Access;
            existing.CodeHash = ev.CodeHash;
            existing.AccessToken = ev.AccessToken;
            existing.MaxParticipants = ev.MaxParticipants;
            existing.WaitingListEnabled = ev.WaitingListEnabled;
            
            await _dbContext.SaveChangesAsync();
            return true;
        }

        /// <summary>
        /// Deletes an event by ID.
        /// </summary>
        /// <param name="eventId">The event ID to delete</param>
        /// <returns>True if deleted, false if not found</returns>
        public async Task<bool> DeleteEventAsync(int eventId)
        {
            var ev = await _dbContext.Set<Event>().FindAsync(eventId);
            if (ev == null) return false;
            
            _dbContext.Set<Event>().Remove(ev);
            await _dbContext.SaveChangesAsync();
            return true;
        }

        /// <summary>
        /// Retrieves an event by ID.
        /// </summary>
        /// <param name="eventId">The event ID</param>
        /// <returns>The event, or null if not found</returns>
        public async Task<Event?> GetEventByIdAsync(int eventId)
        {
            return await _dbContext.Set<Event>()
                .Include(e => e.Tabs)
                .FirstOrDefaultAsync(e => e.Id == eventId);
        }

        /// <summary>
        /// Creates a player - deprecated, use UserProfilePlayer endpoints instead.
        /// </summary>
        /// <exception cref="NotImplementedException">Always thrown</exception>
        [Obsolete("Use UserProfilePlayer endpoints instead")]
        public async Task<int> CreatePlayerAsync(UserProfilePlayer player)
        {
            throw new NotImplementedException("CreatePlayerAsync for Karaoke players is no longer supported. Use UserProfilePlayer endpoints.");
        }


        /// <summary>
        /// Retrieves an Event by its ID (alias for party queries).
        /// </summary>
        public async Task<Event?> GetEventByEventIdAsync(int eventId)
        {
            return await _dbContext.Events.FirstOrDefaultAsync(e => e.Id == eventId);
        }

        /// <summary>
        /// Retrieves all events of type Event.
        /// </summary>
        public async Task<IEnumerable<Event>> GetAllPartiesAsync()
        {
            return await _dbContext.Events.Where(e => e.Type == AudioVerse.Domain.Enums.Events.EventType.Event).ToListAsync();
        }

        public async Task<IEnumerable<UserProfilePlayer>> GetAllPlayersAsync()
        {
            // Return user profile players that are associated via KaraokeEventPlayer relationships
            var playerIds = await _dbContext.KaraokeEventPlayers.Select(pp => pp.PlayerId).Distinct().ToListAsync();
            return await _dbContext.UserProfilePlayers.Where(p => playerIds.Contains(p.Id)).ToListAsync();
        }

        public async Task<IEnumerable<KaraokeSongFile>> FilterSongsAsync(string? title, string? artist, string? genre, string? language, int? year)
        {
            var query = _dbContext.KaraokeSongs
                .Include(s => s.LinkedSong).ThenInclude(ls => ls!.PrimaryArtist)
                .Include(s => s.LinkedSong).ThenInclude(ls => ls!.Album)
                .Include(s => s.LinkedSong).ThenInclude(ls => ls!.Details)
                .AsQueryable();

            if (!string.IsNullOrEmpty(title))
                query = query.Where(s => s.Title.Contains(title));
            if (!string.IsNullOrEmpty(artist))
                query = query.Where(s => s.Artist.Contains(artist));
            if (!string.IsNullOrEmpty(genre))
                query = query.Where(s => s.Genre == genre);
            if (!string.IsNullOrEmpty(language))
                query = query.Where(s => s.Language == language);
            if (year.HasValue)                
                query = query.Where(s => s.Year == year.ToString());

            // By default exclude songs under development
            query = query.Where(s => !s.InDevelopment);
            return await query.ToListAsync();
        }

        public async Task<IEnumerable<KaraokeSongFile>> FilterSongsAdvancedAsync(string? search, string? genre, string? language, decimal? bpmMin, decimal? bpmMax, int? yearMin, int? yearMax, AudioVerse.Domain.Enums.KaraokeFormat? format, string? sortBy, bool descending = false)
        {
            var query = _dbContext.KaraokeSongs
                .Include(s => s.LinkedSong).ThenInclude(ls => ls!.PrimaryArtist)
                .Include(s => s.LinkedSong).ThenInclude(ls => ls!.Album)
                .Include(s => s.LinkedSong).ThenInclude(ls => ls!.Details)
                .Where(s => !s.InDevelopment).AsQueryable();

            if (!string.IsNullOrEmpty(search))
                query = query.Where(s => s.Title.Contains(search) || s.Artist.Contains(search));
            if (!string.IsNullOrEmpty(genre))
                query = query.Where(s => s.Genre == genre);
            if (!string.IsNullOrEmpty(language))
                query = query.Where(s => s.Language == language);
            if (bpmMin.HasValue)
                query = query.Where(s => s.Bpm >= bpmMin.Value);
            if (bpmMax.HasValue)
                query = query.Where(s => s.Bpm <= bpmMax.Value);
            if (yearMin.HasValue)
                query = query.Where(s => s.Year.CompareTo(yearMin.Value.ToString()) >= 0);
            if (yearMax.HasValue)
                query = query.Where(s => s.Year.CompareTo(yearMax.Value.ToString()) <= 0);
            if (format.HasValue)
                query = query.Where(s => s.Format == format.Value);

            query = (sortBy?.ToLowerInvariant()) switch
            {
                "bpm" => descending ? query.OrderByDescending(s => s.Bpm) : query.OrderBy(s => s.Bpm),
                "year" => descending ? query.OrderByDescending(s => s.Year) : query.OrderBy(s => s.Year),
                "title" => descending ? query.OrderByDescending(s => s.Title) : query.OrderBy(s => s.Title),
                "artist" => descending ? query.OrderByDescending(s => s.Artist) : query.OrderBy(s => s.Artist),
                _ => query.OrderBy(s => s.Title)
            };

            return await query.ToListAsync();
        }

        public async Task<IEnumerable<KaraokeSongFile>> GetAvailableSongsForUserAsync(int? userId, bool includeInDevelopment = false)
        {
            var query = _dbContext.KaraokeSongs
                .Include(s => s.LinkedSong).ThenInclude(ls => ls!.PrimaryArtist)
                .Include(s => s.LinkedSong).ThenInclude(ls => ls!.Album)
                .Include(s => s.LinkedSong).ThenInclude(ls => ls!.Details)
                .AsQueryable();
            if (!includeInDevelopment)
                query = query.Where(s => !s.InDevelopment);

            // Admin (userId == null) handled by caller; here filter for non-admins
            if (userId.HasValue)
            {
                // include owners, public, canBeModifiedByAll, or collaborators
                var collaboratorSongIds = await _dbContext.KaraokeSongCollaborators
                    .Where(c => c.UserId == userId.Value)
                    .Select(c => c.SongId)
                    .ToListAsync();

                query = query.Where(s => s.OwnerId == userId.Value || s.CanBeModifiedByAll == true || s.OwnerId == null || collaboratorSongIds.Contains(s.Id));
            }

            return await query.ToListAsync();
        }

        public async Task<Event?> GetEventWithPlayersAsync(int eventId)
        {
            return await _dbContext.Events.FirstOrDefaultAsync(e => e.Id == eventId);
        }

        public async Task<int> AddRoundPlayerAsync(KaraokeSessionRoundPlayer rp)
        {
            _dbContext.Add(rp);
            await _dbContext.SaveChangesAsync();
            return rp.Id;
        }

        public async Task<bool> AssignPlayerToEventAsync(KaraokeSessionPlayer partyPlayer)
        {
            // check for existing assignment to avoid UNIQUE constraint violation
            var exists = await _dbContext.KaraokeEventPlayers
                .AnyAsync(pp => pp.EventId == partyPlayer.EventId && pp.PlayerId == partyPlayer.PlayerId);
            if (exists)
                return true;

            // capacity check
            if (partyPlayer.EventId.HasValue)
            {
                var ev = await _dbContext.Events.FindAsync(partyPlayer.EventId.Value);
                if (ev?.MaxParticipants.HasValue == true)
                {
                    var count = await _dbContext.KaraokeEventPlayers.CountAsync(pp => pp.EventId == partyPlayer.EventId);
                    if (count >= ev.MaxParticipants.Value)
                    {
                        if (ev.WaitingListEnabled)
                            partyPlayer.Status = KaraokePlayerStatus.Waiting;
                        else
                            return false;
                    }
                }
            }

            _dbContext.KaraokeEventPlayers.Add(partyPlayer);
            await _dbContext.SaveChangesAsync();
            return true;
        }

        public async Task<IEnumerable<KaraokeSessionRoundPlayer>> GetRoundPlayersAsync(int roundId)
        {
            return await _dbContext.KaraokeRoundPlayers.Include(r => r.Player).Where(r => r.RoundId == roundId).ToListAsync();
        }

        public async Task<IEnumerable<KaraokeSessionRoundPlayer>> GetRoundPlayersByUserAsync(int roundId, int userId)
        {
            return await _dbContext.KaraokeRoundPlayers
                .Include(r => r.Player)
                .Where(r => r.RoundId == roundId && r.Player != null && r.Player.ProfileId == userId)
                .ToListAsync();
        }

        public async Task<KaraokeSessionRoundPlayer?> GetRoundPlayerByIdAsync(int id)
        {
            return await _dbContext.KaraokeRoundPlayers.Include(r => r.Player).FirstOrDefaultAsync(r => r.Id == id);
        }

        public async Task<KaraokeSessionRoundPlayer?> FindExistingRoundPlayerAsync(int roundId, int playerId, int? slot)
        {
            if (slot.HasValue)
                return await _dbContext.KaraokeRoundPlayers.FirstOrDefaultAsync(r => r.RoundId == roundId && r.PlayerId == playerId && r.Slot == slot.Value);
            return await _dbContext.KaraokeRoundPlayers.FirstOrDefaultAsync(r => r.RoundId == roundId && r.PlayerId == playerId);
        }

        public async Task<KaraokeSessionRound?> GetRoundByIdAsync(int roundId)
        {
            return await _dbContext.KaraokeEventRounds.FirstOrDefaultAsync(r => r.Id == roundId);
        }

        public async Task<IEnumerable<KaraokeSessionRound>> GetRoundsBySessionIdAsync(int sessionId)
        {
            return await _dbContext.KaraokeEventRounds
                .Where(r => r.SessionId == sessionId)
                .Include(r => r.Song)
                .Include(r => r.Players)
                .OrderBy(r => r.Number)
                .ToListAsync();
        }

        public async Task<bool> ReorderSessionRoundsAsync(int sessionId, List<int> roundIds)
        {
            var rounds = await _dbContext.KaraokeEventRounds
                .Where(r => r.SessionId == sessionId && roundIds.Contains(r.Id))
                .ToListAsync();
            if (rounds.Count == 0) return false;
            for (int i = 0; i < roundIds.Count; i++)
            {
                var round = rounds.FirstOrDefault(r => r.Id == roundIds[i]);
                if (round != null) round.Number = i + 1;
            }
            await _dbContext.SaveChangesAsync();
            return true;
        }

        public async Task<int> CountRoundPlayersAsync(int roundId)
        {
            return await _dbContext.KaraokeRoundPlayers.CountAsync(r => r.RoundId == roundId);
        }

        public async Task<bool> DeleteRoundPlayerAsync(int roundId, int playerId)
        {
            var rp = await _dbContext.KaraokeRoundPlayers.FirstOrDefaultAsync(r => r.RoundId == roundId && r.Id == playerId);
            if (rp == null) return false;
            _dbContext.KaraokeRoundPlayers.Remove(rp);
            await _dbContext.SaveChangesAsync();
            return true;
        }

        public async Task<bool> UpdateRoundPlayerSlotAsync(int roundId, int assignmentId, int slot)
        {
            var rp = await _dbContext.KaraokeRoundPlayers.FirstOrDefaultAsync(r => r.RoundId == roundId && r.Id == assignmentId);
            if (rp == null) return false;
            rp.Slot = slot;
            await _dbContext.SaveChangesAsync();
            return true;
        }

        public async Task<bool> UpdateRoundPlayerMicAsync(int roundId, int assignmentId, string? micDeviceId)
        {
            var rp = await _dbContext.KaraokeRoundPlayers.FirstOrDefaultAsync(r => r.RoundId == roundId && r.Id == assignmentId);
            if (rp == null) return false;
            rp.MicDeviceId = micDeviceId;
            await _dbContext.SaveChangesAsync();
            return true;
        }

        public async Task<bool> UpdateKaraokePlayerStatusAsync(int eventId, int playerId, KaraokePlayerStatus status)
        {
            var pp = await _dbContext.KaraokeEventPlayers.FirstOrDefaultAsync(p => p.EventId == eventId && p.PlayerId == playerId);
            if (pp == null) return false;
            pp.Status = status;
            await _dbContext.SaveChangesAsync();
            return true;
        }

        public async Task<int> AddEventInviteAsync(EventInvite invite)
        {
            _dbContext.Add(invite);
            await _dbContext.SaveChangesAsync();
            return invite.Id;
        }

        public async Task<int> AddInviteToEventAsync(EventInvite invite)
        {
            _dbContext.Add(invite);
            await _dbContext.SaveChangesAsync();
            return invite.Id;
        }

        public async Task<EventInvite?> GetEventInviteByIdAsync(int id)
        {
            return await _dbContext.Set<EventInvite>().FirstOrDefaultAsync(pi => pi.Id == id);
        }

        public async Task<bool> UpdateEventInviteAsync(EventInvite invite)
        {
            _dbContext.Update(invite);
            await _dbContext.SaveChangesAsync();
            return true;
        }

        public async Task<bool> CancelEventInviteAsync(int inviteId)
        {
            var invite = await _dbContext.Set<EventInvite>().FirstOrDefaultAsync(pi => pi.Id == inviteId);
            if (invite == null) return false;
            invite.Status = EventInviteStatus.Cancelled;
            invite.RespondedAt = DateTime.UtcNow;
            await _dbContext.SaveChangesAsync();
            return true;
        }

        public async Task<bool> RemovePlayerFromEventAsync(int eventId, int playerId)
        {
            var pp = await _dbContext.KaraokeEventPlayers.FirstOrDefaultAsync(p => p.EventId == eventId && p.PlayerId == playerId);
            if (pp == null) return false;
            _dbContext.KaraokeEventPlayers.Remove(pp);
            await _dbContext.SaveChangesAsync();
            return true;
        }

        public async Task<bool> RemoveParticipantFromEventAsync(int eventId, int playerId)
        {
            var pp = await _dbContext.KaraokeEventPlayers.FirstOrDefaultAsync(p => p.EventId == eventId && p.PlayerId == playerId);
            if (pp == null) return false;
            _dbContext.KaraokeEventPlayers.Remove(pp);
            await _dbContext.SaveChangesAsync();
            return true;
        }

        public async Task<UserProfilePlayer?> GetUserProfilePlayerByIdAsync(int playerId)
        {
            return await _dbContext.UserProfilePlayers.FirstOrDefaultAsync(p => p.Id == playerId);
        }

        public async Task<KaraokeSessionPlayer?> GetKaraokePlayerAsync(int eventId, int playerId)
        {
            return await _dbContext.KaraokeEventPlayers.FirstOrDefaultAsync(pp => pp.EventId == eventId && pp.PlayerId == playerId);
        }

        public async Task<bool> UpdateEventPlayerPermissionsAsync(int eventId, int playerId, EventPermission permissions)
        {
            var pp = await _dbContext.KaraokeEventPlayers.FirstOrDefaultAsync(x => x.EventId == eventId && x.PlayerId == playerId);
            if (pp == null) return false;
            pp.Permissions = permissions;
            await _dbContext.SaveChangesAsync();
            return true;
        }

        public async Task<IEnumerable<int>> GetCollaboratorUserIdsAsync(int songId)
        {
            return await _dbContext.KaraokeSongCollaborators.Where(c => c.SongId == songId).Select(c => c.UserId).ToListAsync();
        }

        public async Task<bool> AddCollaboratorAsync(int songId, int userId, AudioVerse.Domain.Enums.CollaborationPermission permission)
        {
            var exists = await _dbContext.KaraokeSongCollaborators.AnyAsync(c => c.SongId == songId && c.UserId == userId);
            if (exists) return false;
            _dbContext.KaraokeSongCollaborators.Add(new KaraokeSongFileCollaborator { SongId = songId, UserId = userId, Permission = permission });
            await _dbContext.SaveChangesAsync();
            return true;
        }

        public async Task<bool> RemoveCollaboratorAsync(int songId, int userId)
        {
            var coll = await _dbContext.KaraokeSongCollaborators.FirstOrDefaultAsync(c => c.SongId == songId && c.UserId == userId);
            if (coll == null) return false;
            _dbContext.KaraokeSongCollaborators.Remove(coll);
            await _dbContext.SaveChangesAsync();
            return true;
        }

        public async Task<bool> UpdateCollaboratorPermissionAsync(int songId, int userId, AudioVerse.Domain.Enums.CollaborationPermission permission)
        {
            var coll = await _dbContext.KaraokeSongCollaborators.FirstOrDefaultAsync(c => c.SongId == songId && c.UserId == userId);
            if (coll == null) return false;
            coll.Permission = permission;
            await _dbContext.SaveChangesAsync();
            return true;
        }

        public async Task<AudioVerse.Domain.Enums.CollaborationPermission?> GetCollaboratorPermissionAsync(int songId, int userId)
        {
            var coll = await _dbContext.KaraokeSongCollaborators.FirstOrDefaultAsync(c => c.SongId == songId && c.UserId == userId);
            return coll?.Permission;
        }

        public async Task<int> AddRoundAsync(KaraokeSessionRound round)
        {
            // Normalize zero FK values to null to avoid FK constraint violations
            if (round.PlaylistId == 0) round.PlaylistId = null;
            if (round.EventId == 0) round.EventId = null;
            if (round.SessionId == 0) round.SessionId = null;

            _dbContext.KaraokeEventRounds.Add(round);
            await _dbContext.SaveChangesAsync();
            return round.Id;
        }

        public async Task<int> AddSessionAsync(KaraokeSession session)
        {
            // Event-centric session
            _dbContext.KaraokeSessions.Add(session);
            await _dbContext.SaveChangesAsync();
            return session.Id;
        }

        public async Task<int> AddSessionToEventAsync(KaraokeSession session)
        {
            _dbContext.KaraokeSessions.Add(session);
            await _dbContext.SaveChangesAsync();
            return session.Id;
        }

        public async Task<IEnumerable<KaraokeSessionPlayer>> GetParticipantsByEventAsync(int eventId)
        {
            return await _dbContext.KaraokeEventPlayers
                .Include(p => p.Player)
                .Where(p => p.EventId == eventId)
                .ToListAsync();
        }

        public async Task<IEnumerable<EventInvite>> GetInvitesByEventAsync(int eventId)
        {
            return await _dbContext.Set<EventInvite>().Where(pi => pi.EventId == eventId).ToListAsync();
        }

        public async Task<IEnumerable<KaraokeSession>> GetSessionsByEventAsync(int eventId)
        {
            return await _dbContext.KaraokeSessions.Where(s => s.EventId == eventId).ToListAsync();
        }

        public async Task<int> AddRoundPartAsync(KaraokeSessionRoundPart part)
        {
            _dbContext.KaraokeRoundParts.Add(part);
            await _dbContext.SaveChangesAsync();
            return part.Id;
        }

        public async Task<int> AddSongToRoundAsync(KaraokeSinging singing)
        {
            _dbContext.KaraokeSingings.Add(singing);
            await _dbContext.SaveChangesAsync();
            return singing.Id;
        }

        public async Task<bool> SaveSingingResultsAsync(IEnumerable<KaraokeSinging> results)
        {
            _dbContext.KaraokeSingings.UpdateRange(results);
            await _dbContext.SaveChangesAsync();
            return true;
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

        public async Task<KaraokeSongFile?> ParseUltrastarSong(string filePath)
        {
            Console.WriteLine($"#Paarsing Ultrastar song from {filePath}");
            _logger.LogInformation($"Paarsing Ultrastar song from {filePath}");
            var lines = File.ReadAllLines(filePath);
            return await ParseUltrastarSong(lines, filePath);
        }

        public async Task<KaraokeSongFile?> ParseUltrastarSong(byte[] fileData, string fileName = "uploaded.txt")
        {
            Console.WriteLine($"#Paarsing Ultrastar song from bytes: {fileName}");
            _logger.LogInformation($"Paarsing Ultrastar song from bytes: {fileName}");
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
            Console.WriteLine($"#Paarsing Ultrastar song from {lines.Length} lines");
            _logger.LogInformation($"Paarsing Ultrastar song from {lines.Length} lines");
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
                    song.Notes.Add(new KaraokeSongFileNote { NoteLine = line });
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

            if (string.IsNullOrEmpty(song.Title) || string.IsNullOrEmpty(song.Artist)) return null;

            // Save snapshot for initial import
            var hist = new KaraokeSongFileHistory
            {
                KaraokeSongFileId = 0, // will be set after adding song to DB
                Version = 1,
                DataJson = System.Text.Json.JsonSerializer.Serialize(song),
                ChangedAt = DateTime.UtcNow
            };

            // Return song (saving is performed by caller repository Add)
            return song;
        }

        public Task<List<KaraokeSongFile>> GetAllSongsAsync()
        {
            // Default behavior: exclude InDevelopment
            return _dbContext.KaraokeSongs.AsNoTracking().Where(s => !s.InDevelopment).ToListAsync();
        }

        public Task<List<KaraokeSongFile>> GetAllSongsIncludingInDevelopmentAsync()
        {
            return _dbContext.KaraokeSongs.AsNoTracking().ToListAsync();
        }

        public async Task<int> SaveSongSnapshotAsync(KaraokeSongFileHistory history)
        {
            _dbContext.KaraokeSongFileHistories.Add(history);
            await _dbContext.SaveChangesAsync();
            return history.Id;
        }

        public async Task<IEnumerable<KaraokeSongFileHistory>> GetSongHistoryAsync(int songId)
        {
            return await _dbContext.KaraokeSongFileHistories.Where(h => h.KaraokeSongFileId == songId).OrderByDescending(h => h.Version).ToListAsync();
        }

        public async Task<KaraokeSongFileHistory?> GetSongVersionAsync(int songId, int version)
        {
            return await _dbContext.KaraokeSongFileHistories.FirstOrDefaultAsync(h => h.KaraokeSongFileId == songId && h.Version == version);
        }

        public async Task<bool> RevertSongToVersionAsync(int songId, int version, int? changedByUserId = null, string? reason = null)
        {
            var hist = await GetSongVersionAsync(songId, version);
            if (hist == null) return false;

            var song = await _dbContext.KaraokeSongs.Include(s => s.Notes).FirstOrDefaultAsync(s => s.Id == songId);
            if (song == null) return false;

            // Deserialize snapshot and apply
            var obj = System.Text.Json.JsonSerializer.Deserialize<KaraokeSongFile>(hist.DataJson);
            if (obj == null) return false;

            // apply scalar properties
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
            song.Format = obj.Format;
            song.FilePath = obj.FilePath;

            // replace notes entirely
            _dbContext.RemoveRange(song.Notes);
            foreach (var n in obj.Notes)
            {
                n.SongId = song.Id;
            }
            _dbContext.AddRange(obj.Notes);

            // save and add new snapshot for revert action
            await _dbContext.SaveChangesAsync();

            var newHist = new KaraokeSongFileHistory
            {
                KaraokeSongFileId = songId,
                Version = (await _dbContext.KaraokeSongFileHistories.Where(h => h.KaraokeSongFileId == songId).MaxAsync(h => (int?)h.Version) ?? 0) + 1,
                DataJson = hist.DataJson,
                ChangedByUserId = changedByUserId,
                Reason = reason
            };
            _dbContext.KaraokeSongFileHistories.Add(newHist);
            await _dbContext.SaveChangesAsync();
            return true;
        }

        public async Task<KaraokePlaylist?> GetPlaylistWithSongsAsync(int playlistId)
        {
            return await _dbContext.KaraokePlaylists
                .Include(p => p.PlaylistSongs)
                .ThenInclude(ps => ps.Song)
                .FirstOrDefaultAsync(p => p.Id == playlistId);
        }

        public async Task<int> AddKaraokeSongFileAsync(KaraokeSongFile song)
        {
            _dbContext.KaraokeSongs.Add(song);
            await _dbContext.SaveChangesAsync();

            // create initial snapshot
            var hist = new KaraokeSongFileHistory
            {
                KaraokeSongFileId = song.Id,
                Version = 1,
                DataJson = System.Text.Json.JsonSerializer.Serialize(song),
                ChangedAt = DateTime.UtcNow
            };
            _dbContext.KaraokeSongFileHistories.Add(hist);
            await _dbContext.SaveChangesAsync();
            return song.Id;
        }

        public async Task<int> AddKaraokeSongFilesAsync(IEnumerable<KaraokeSongFile> songs)
        {
            _dbContext.KaraokeSongs.AddRange(songs);
            await _dbContext.SaveChangesAsync();
            return songs.Count();
        }

        public async Task<Event?> GetEventStatusAsync(int eventId)
        {
            return await _dbContext.Events.FirstOrDefaultAsync(e => e.Id == eventId);
        }


        public async Task<bool> DeletePlayerAsync(int playerId)
        {
            var up = await _dbContext.UserProfilePlayers.FindAsync(playerId);
            if (up == null) return false;
            _dbContext.UserProfilePlayers.Remove(up);
            await _dbContext.SaveChangesAsync();
            return true;
        }

        // ?? Teams ??

        public async Task<int> CreateTeamAsync(KaraokeTeam team)
        {
            _dbContext.KaraokeTeams.Add(team);
            await _dbContext.SaveChangesAsync();
            return team.Id;
        }

        public async Task<KaraokeTeam?> GetTeamByIdAsync(int teamId)
        {
            return await _dbContext.KaraokeTeams
                .Include(t => t.Players).ThenInclude(tp => tp.Player)
                .Include(t => t.CreatedByPlayer)
                .FirstOrDefaultAsync(t => t.Id == teamId);
        }

        public async Task<IEnumerable<KaraokeTeam>> GetTeamsByEventAsync(int eventId)
        {
            return await _dbContext.KaraokeTeams
                .Include(t => t.Players).ThenInclude(tp => tp.Player)
                .Where(t => t.EventId == eventId)
                .ToListAsync();
        }

        public async Task<bool> UpdateTeamAsync(KaraokeTeam team)
        {
            var existing = await _dbContext.KaraokeTeams.FindAsync(team.Id);
            if (existing == null) return false;
            existing.Name = team.Name;
            existing.Color = team.Color;
            existing.AvatarKey = team.AvatarKey;
            await _dbContext.SaveChangesAsync();
            return true;
        }

        public async Task<bool> DeleteTeamAsync(int teamId)
        {
            var team = await _dbContext.KaraokeTeams.FindAsync(teamId);
            if (team == null) return false;
            _dbContext.KaraokeTeams.Remove(team);
            await _dbContext.SaveChangesAsync();
            return true;
        }

        public async Task<int> AddTeamPlayerAsync(KaraokeTeamPlayer tp)
        {
            var exists = await _dbContext.KaraokeTeamPlayers
                .AnyAsync(x => x.TeamId == tp.TeamId && x.PlayerId == tp.PlayerId);
            if (exists) return (await _dbContext.KaraokeTeamPlayers
                .FirstAsync(x => x.TeamId == tp.TeamId && x.PlayerId == tp.PlayerId)).Id;
            _dbContext.KaraokeTeamPlayers.Add(tp);
            await _dbContext.SaveChangesAsync();
            return tp.Id;
        }

        public async Task<bool> RemoveTeamPlayerAsync(int teamId, int playerId)
        {
            var tp = await _dbContext.KaraokeTeamPlayers
                .FirstOrDefaultAsync(x => x.TeamId == teamId && x.PlayerId == playerId);
            if (tp == null) return false;
            _dbContext.KaraokeTeamPlayers.Remove(tp);
            await _dbContext.SaveChangesAsync();
            return true;
        }

        public async Task<IEnumerable<KaraokeTeamPlayer>> GetTeamPlayersAsync(int teamId)
        {
            return await _dbContext.KaraokeTeamPlayers
                .Include(tp => tp.Player)
                .Where(tp => tp.TeamId == teamId)
                .ToListAsync();
        }

        // ?? Song Queue ??

        public async Task<int> AddSongQueueItemAsync(KaraokeSongFileQueueItem item)
        {
            _dbContext.KaraokeSongQueueItems.Add(item);
            await _dbContext.SaveChangesAsync();
            return item.Id;
        }

        public async Task<IEnumerable<KaraokeSongFileQueueItem>> GetSongQueueByEventAsync(int eventId)
        {
            return await _dbContext.KaraokeSongQueueItems
                .Include(q => q.Song)
                .Include(q => q.RequestedByPlayer)
                .Where(q => q.EventId == eventId)
                .OrderBy(q => q.Position)
                .ToListAsync();
        }

        public async Task<bool> UpdateSongQueueItemStatusAsync(int id, AudioVerse.Domain.Enums.SongQueueStatus status)
        {
            var item = await _dbContext.KaraokeSongQueueItems.FindAsync(id);
            if (item == null) return false;
            item.Status = status;
            await _dbContext.SaveChangesAsync();
            return true;
        }

        public async Task<bool> RemoveSongQueueItemAsync(int id)
        {
            var item = await _dbContext.KaraokeSongQueueItems.FindAsync(id);
            if (item == null) return false;
            _dbContext.KaraokeSongQueueItems.Remove(item);
            await _dbContext.SaveChangesAsync();
            return true;
        }

        // ?? Favorites ??

        public async Task<int> AddFavoriteSongAsync(AudioVerse.Domain.Entities.Karaoke.KaraokeFavoriteSong fav)
        {
            var exists = await _dbContext.FavoriteSongs
                .AnyAsync(f => f.PlayerId == fav.PlayerId && f.SongId == fav.SongId);
            if (exists) return 0;
            _dbContext.FavoriteSongs.Add(fav);
            await _dbContext.SaveChangesAsync();
            return fav.Id;
        }

        public async Task<bool> RemoveFavoriteSongAsync(int playerId, int songId)
        {
            var fav = await _dbContext.FavoriteSongs
                .FirstOrDefaultAsync(f => f.PlayerId == playerId && f.SongId == songId);
            if (fav == null) return false;
            _dbContext.FavoriteSongs.Remove(fav);
            await _dbContext.SaveChangesAsync();
            return true;
        }

        public async Task<IEnumerable<AudioVerse.Domain.Entities.Karaoke.KaraokeFavoriteSong>> GetFavoriteSongsAsync(int playerId)
        {
            return await _dbContext.FavoriteSongs
                .Include(f => f.Song)
                .Where(f => f.PlayerId == playerId)
                .OrderByDescending(f => f.AddedAt)
                .ToListAsync();
        }

        // ????????????????????????????????????????????????????????????
        //  Song CRUD
        // ????????????????????????????????????????????????????????????

        public async Task<bool> UpdateSongAsync(KaraokeSongFile song)
        {
            _dbContext.KaraokeSongs.Update(song);
            await _dbContext.SaveChangesAsync();
            return true;
        }

        public async Task<bool> DeleteSongAsync(int songId)
        {
            var song = await _dbContext.KaraokeSongs.FindAsync(songId);
            if (song == null) return false;
            _dbContext.KaraokeSongs.Remove(song);
            await _dbContext.SaveChangesAsync();
            return true;
        }

        public async Task<bool> SetSongVerifiedAsync(int songId, bool isVerified)
        {
            var song = await _dbContext.KaraokeSongs.FindAsync(songId);
            if (song == null) return false;
            song.IsVerified = isVerified;
            await _dbContext.SaveChangesAsync();
            return true;
        }

        public async Task<bool> SetSongInDevelopmentAsync(int songId, bool inDevelopment)
        {
            var song = await _dbContext.KaraokeSongs.FindAsync(songId);
            if (song == null) return false;
            song.InDevelopment = inDevelopment;
            await _dbContext.SaveChangesAsync();
            return true;
        }

        public async Task<bool> SetSongsVerifiedAsync(IEnumerable<int> songIds, bool isVerified)
        {
            var songs = await _dbContext.KaraokeSongs
                .Where(s => songIds.Contains(s.Id))
                .ToListAsync();
            
            foreach (var song in songs)
            {
                song.IsVerified = isVerified;
            }
            
            await _dbContext.SaveChangesAsync();
            return true;
        }

        public async Task<bool> SetSongsInDevelopmentAsync(IEnumerable<int> songIds, bool inDevelopment)
        {
            var songs = await _dbContext.KaraokeSongs
                .Where(s => songIds.Contains(s.Id))
                .ToListAsync();
            
            foreach (var song in songs)
            {
                song.InDevelopment = inDevelopment;
            }
            
            await _dbContext.SaveChangesAsync();
            return true;
        }

        // ── Karaoke session song picks ──

        public async Task<int> AddKaraokeSongPickAsync(KaraokeSessionSongPick pick)
        {
            _dbContext.KaraokeSessionSongPicks.Add(pick);
            await _dbContext.SaveChangesAsync();
            return pick.Id;
        }

        public async Task<int> ImportKaraokeSongPicksFromPlaylistAsync(int sessionId, int playlistId)
        {
            var songs = await _dbContext.Set<Domain.Entities.Karaoke.KaraokePlayLists.KaraokePlaylistSong>()
                .Where(ps => ps.PlaylistId == playlistId)
                .Include(ps => ps.Song)
                .ToListAsync();
            int count = 0;
            foreach (var ps in songs)
            {
                _dbContext.KaraokeSessionSongPicks.Add(new KaraokeSessionSongPick
                {
                    SessionId = sessionId,
                    SourcePlaylistId = playlistId,
                    SongId = ps.SongId,
                    SongTitle = ps.Song?.Title ?? $"Song#{ps.SongId}"
                });
                count++;
            }
            await _dbContext.SaveChangesAsync();
            return count;
        }

        public async Task<IEnumerable<KaraokeSessionSongPick>> GetKaraokeSongPicksBySessionAsync(int sessionId) =>
            await _dbContext.KaraokeSessionSongPicks
                .Where(p => p.SessionId == sessionId)
                .Include(p => p.Signups)
                .OrderByDescending(p => p.Signups.Count)
                .ToListAsync();

        public async Task<bool> DeleteKaraokeSongPickAsync(int id)
        {
            var p = await _dbContext.KaraokeSessionSongPicks.FindAsync(id);
            if (p == null) return false;
            _dbContext.KaraokeSessionSongPicks.Remove(p);
            await _dbContext.SaveChangesAsync();
            return true;
        }

        public async Task<int> UpsertKaraokeSongSignupAsync(KaraokeSessionSongSignup signup)
        {
            var existing = await _dbContext.KaraokeSessionSongSignups
                .FirstOrDefaultAsync(s => s.PickId == signup.PickId && s.PlayerId == signup.PlayerId);
            if (existing != null)
            {
                existing.PreferredSlot = signup.PreferredSlot;
                existing.SignedUpAt = DateTime.UtcNow;
            }
            else
            {
                _dbContext.KaraokeSessionSongSignups.Add(signup);
            }
            await _dbContext.SaveChangesAsync();
            return existing?.Id ?? signup.Id;
        }

        public async Task<bool> DeleteKaraokeSongSignupAsync(int pickId, int playerId)
        {
            var s = await _dbContext.KaraokeSessionSongSignups
                .FirstOrDefaultAsync(x => x.PickId == pickId && x.PlayerId == playerId);
            if (s == null) return false;
            _dbContext.KaraokeSessionSongSignups.Remove(s);
            await _dbContext.SaveChangesAsync();
            return true;
        }

        // ── Stats ──

        public async Task<IEnumerable<KaraokeSinging>> GetRankingSingingsAsync(int top, CancellationToken ct = default)
            => await _dbContext.KaraokeSingings
                .Include(s => s.Player)
                .ToListAsync(ct);

        public async Task<IEnumerable<KaraokeSinging>> GetHistorySingingsAsync(int userId, int take, CancellationToken ct = default)
            => await _dbContext.KaraokeSingings
                .Include(s => s.Round).ThenInclude(r => r.Song)
                .Where(s => s.PlayerId == userId)
                .OrderByDescending(s => s.Round.PerformedAt ?? s.Round.CreatedAt)
                .Take(take)
                .ToListAsync(ct);

        public async Task<IEnumerable<KaraokeSinging>> GetActivitySingingsAsync(int days, CancellationToken ct = default)
        {
            var since = DateTime.UtcNow.Date.AddDays(-days);
            return await _dbContext.KaraokeSingings
                .Include(s => s.Round)
                .Where(s => s.Round != null &&
                    (s.Round.PerformedAt.HasValue ? s.Round.PerformedAt.Value :
                        (s.Round.CreatedAt != default ? s.Round.CreatedAt : s.Round.StartTime)) >= since)
                .ToListAsync(ct);
        }

        public async Task<IEnumerable<KaraokeSinging>> GetTopSingingsForSongAsync(int songId, int take, CancellationToken ct = default)
            => await _dbContext.KaraokeSingings
                .Include(s => s.Round)
                .Include(s => s.Player)
                .Where(s => s.Round!.SongId == songId)
                .OrderByDescending(s => s.Score)
                .ThenByDescending(s => s.Round!.PerformedAt)
                .Take(take)
                .ToListAsync(ct);

    public IQueryable<KaraokeSongFile> GetSongsQueryable() => _dbContext.KaraokeSongs.AsQueryable();
}
}
