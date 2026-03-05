using AudioVerse.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using AudioVerse.API.Models.Radio;
using AudioVerse.Domain.Entities.Radio;

namespace AudioVerse.API.Services.Radio
{
    public class RadioService : IRadioService
    {
        private readonly AudioVerseDbContext _db;
        private readonly AudioVerse.Infrastructure.Storage.IFileStorage? _fileStorage;
        private readonly AudioVerse.Application.Services.Platforms.Tidal.ITidalService? _tidalService;
        private readonly IConfiguration _configuration;
        private readonly ILogger<RadioService> _logger;
        public RadioService(AudioVerseDbContext db, ILogger<RadioService> logger, AudioVerse.Infrastructure.Storage.IFileStorage? fileStorage = null, IConfiguration? configuration = null, AudioVerse.Application.Services.Platforms.Tidal.ITidalService? tidalService = null)
        {
            _db = db;
            _logger = logger;
            _fileStorage = fileStorage;
            _tidalService = tidalService;
            _configuration = configuration ?? new ConfigurationBuilder().AddInMemoryCollection().Build();
        }

        public async Task<bool> CanJoinAsync(int radioStationId)
        {
            // Get station
            var station = await _db.RadioStations.FindAsync(radioStationId);
            if (station == null) return false;

            // active listeners for station (connected)
            var stationCount = await _db.RadioListeners.CountAsync(l => l.RadioStationId == radioStationId && l.DisconnectedAtUtc == null);

            // total active listeners
            var totalCount = await _db.RadioListeners.CountAsync(l => l.DisconnectedAtUtc == null);

            // read system configuration (latest active)
            var cfg = await _db.SystemConfigurations.OrderByDescending(c => c.ModifiedAt).FirstOrDefaultAsync(c => c.Active);

            if (station.MaxListeners.HasValue && stationCount >= station.MaxListeners.Value)
                return false;

            if (cfg?.GlobalMaxListenersPerStation.HasValue == true && stationCount >= cfg.GlobalMaxListenersPerStation.Value)
                return false;

            if (cfg?.GlobalMaxTotalListeners.HasValue == true && totalCount >= cfg.GlobalMaxTotalListeners.Value)
                return false;

            return true;
        }

        public async Task<bool> RegisterJoinAsync(int radioStationId, int? userId, string connectionId, string? clientInfo, string? remoteIp, int? broadcastSessionId = null)
        {
            if (!await CanJoinAsync(radioStationId)) return false;

            var listener = new RadioListener
            {
                RadioStationId = radioStationId,
                BroadcastSessionId = broadcastSessionId,
                UserId = userId,
                ConnectionId = connectionId,
                ClientInfo = clientInfo,
                RemoteIp = remoteIp,
                ConnectedAtUtc = DateTime.UtcNow
            };

            _db.RadioListeners.Add(listener);

            _db.RadioPlayStats.Add(new RadioPlayStat
            {
                RadioStationId = radioStationId,
                BroadcastSessionId = broadcastSessionId,
                UserId = userId,
                EventType = RadioEventType.Join,
                TimestampUtc = DateTime.UtcNow,
                Extra = clientInfo
            });

            await _db.SaveChangesAsync();
            return true;
        }

        public async Task RegisterLeaveAsync(string connectionId)
        {
            var now = DateTime.UtcNow;
            var listener = await _db.RadioListeners.FirstOrDefaultAsync(l => l.ConnectionId == connectionId && l.DisconnectedAtUtc == null);
            if (listener == null) return;

            listener.DisconnectedAtUtc = now;
            _db.RadioPlayStats.Add(new RadioPlayStat
            {
                RadioStationId = listener.RadioStationId,
                BroadcastSessionId = listener.BroadcastSessionId,
                UserId = listener.UserId,
                EventType = RadioEventType.Leave,
                TimestampUtc = now,
                Extra = listener.ConnectionId
            });

            await _db.SaveChangesAsync();
        }

        public async Task<NowPlayingDto?> GetNowPlayingAsync(int radioStationId)
        {
            var session = await _db.BroadcastSessions
                .Where(s => s.RadioStationId == radioStationId && s.IsRunning)
                .OrderByDescending(s => s.StartUtc)
                .FirstOrDefaultAsync();

            if (session == null) return null;

            var station = await _db.RadioStations.FindAsync(radioStationId);
            var playlistId = session.PlaylistId ?? station?.DefaultPlaylistId;
            if (!playlistId.HasValue) return null;

            var items = await _db.PlaylistItems
                .Where(pi => pi.PlaylistId == playlistId.Value)
                .OrderBy(pi => pi.OrderNumber)
                .ToListAsync();

            if (items == null || items.Count == 0) return null;

            // compute durations
            var durations = new List<double>();
            foreach (var it in items)
            {
                double dur = 30; // fallback 30s
                try
                {
                    var af = await _db.LibraryAudioFiles.FirstOrDefaultAsync(a => a.SongId == it.SongId);
                    if (af != null && af.Duration.HasValue) dur = af.Duration.Value.TotalSeconds;
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to resolve audiofile duration for song {SongId}", it.SongId);
                }
                durations.Add(dur);
            }

            var total = durations.Sum();
            if (total <= 0) return null;

            var now = DateTime.UtcNow;
            var elapsed = (now - session.StartUtc).TotalSeconds;
            if (elapsed < 0) elapsed = 0;

            // position within loop
            var pos = elapsed % total;

            double accum = 0;
            int idx = 0;
            for (; idx < items.Count; idx++)
            {
                var d = durations[idx];
                if (accum + d > pos) break;
                accum += d;
            }

            if (idx >= items.Count) idx = items.Count - 1; // fallback

            var current = items[idx];
            var currentDur = durations[idx];
            var offsetInItem = pos - accum;

            // compute item started at utc
            // loopsCompleted * total + accum = seconds from start to current item start
            var loops = Math.Floor(elapsed / total);
            var loopStart = session.StartUtc.AddSeconds(loops * total);
            var itemStartedAtUtc = loopStart.AddSeconds(accum);

            // resolve audio file id and song title
            int? audioFileId = null;
            string? title = null;
            var externalProvider = AudioVerse.Domain.Entities.Audio.ExternalProvider.None;
            string? externalId = null;
            string? externalUrl = null;
            try
            {
                var song = await _db.LibrarySongs.FindAsync(current.SongId);
                title = song?.Title;
                var af = await _db.LibraryAudioFiles.FirstOrDefaultAsync(a => a.SongId == current.SongId);
                if (af != null) audioFileId = af.Id;
                // try to provide presigned url / public url if file storage is available and file path is set
                if (af != null && _fileStorage != null && !string.IsNullOrEmpty(af.FilePath))
                {
                    // determine bucket from config: Storage:AudioBucket or first entry in Storage:Buckets
                    var bucket = _configuration["Storage:AudioBucket"];
                    if (string.IsNullOrEmpty(bucket))
                    {
                            // prefer HLS stream if available under convention: hls/{audioFileId}/index.m3u8
                        var buckets = _configuration.GetSection("Storage:Buckets").Get<string[]>();
                        if (buckets != null && buckets.Length > 0) bucket = buckets[0];
                    }
                    if (string.IsNullOrEmpty(bucket)) bucket = "audiofiles";

                    try
                    {
                        externalUrl ??= null; // keep existing externalUrl
                        var presigned = await _fileStorage.GetPresignedUrlAsync(bucket, af.FilePath, TimeSpan.FromMinutes(10));
                        externalUrl = externalUrl ?? externalUrl; // no-op to keep externalUrl variable in scope
                        // attach to dto via local variables set below
                        // store temp urls in variables
                        var presignedLocal = presigned;
                        var publicLocal = _fileStorage.GetPublicUrl(bucket, af.FilePath);
                        // assign later when building dto
                        // no-op: externalUrl already set
                        // use tuple by putting into closure variables
                        
                        // set new local variables via out-of-scope capture by assigning to externalUrl? We'll instead set after try-catch via local variables defined above
                    }
                    catch (Exception ex)
                    {
                        _logger.LogDebug(ex, "Failed to create presigned url for {Path}", af.FilePath);
                    }
                }
                // playlist item external info
                externalProvider = current.ExternalProvider;
                externalId = current.ExternalId;
                if (!string.IsNullOrEmpty(externalId) && externalProvider != AudioVerse.Domain.Entities.Audio.ExternalProvider.None)
                {
                    switch (externalProvider)
                    {
                        case AudioVerse.Domain.Entities.Audio.ExternalProvider.YouTube:
                            externalUrl = $"https://youtu.be/{externalId}?t={(int)offsetInItem}";
                            break;
                        case AudioVerse.Domain.Entities.Audio.ExternalProvider.Spotify:
                            externalUrl = $"https://open.spotify.com/track/{externalId}";
                            break;
                        case AudioVerse.Domain.Entities.Audio.ExternalProvider.Tidal:
                            externalUrl = $"https://tidal.com/browse/track/{externalId}";
                            break;
                        default:
                            externalUrl = null;
                            break;
                    }
                }
            }
            catch { }

            // Build dto
            var dto = new NowPlayingDto
            {
                RadioStationId = radioStationId,
                BroadcastSessionId = session.Id,
                PlaylistId = playlistId,
                PlaylistItemId = current.Id,
                SongId = current.SongId,
                AudioFileId = audioFileId,
                Title = title,
                PositionSeconds = offsetInItem,
                ItemDurationSeconds = currentDur,
                ItemStartedAtUtc = itemStartedAtUtc
                , ExternalProvider = externalProvider
                , ExternalId = externalId
                , ExternalUrl = externalUrl
            };

            // If file storage is available, attempt to populate PresignedUrl/PublicUrl
            if (_fileStorage != null && audioFileId.HasValue)
            {
                try
                {
                    var afdb = await _db.LibraryAudioFiles.FindAsync(audioFileId.Value);
                    if (afdb != null && !string.IsNullOrEmpty(afdb.FilePath))
                    {
                        var bucket = _configuration["Storage:AudioBucket"];
                        if (string.IsNullOrEmpty(bucket))
                        {
                            var buckets = _configuration.GetSection("Storage:Buckets").Get<string[]>();
                            if (buckets != null && buckets.Length > 0) bucket = buckets[0];
                        }
                        if (string.IsNullOrEmpty(bucket)) bucket = "audiofiles";

                        dto.PresignedUrl = await _fileStorage.GetPresignedUrlAsync(bucket, afdb.FilePath, TimeSpan.FromMinutes(10));
                        dto.PublicUrl = _fileStorage.GetPublicUrl(bucket, afdb.FilePath);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogDebug(ex, "Failed to populate storage urls for audiofile {Id}", audioFileId);
                }
            }

            // If external provider is Tidal, attempt to fetch streaming URL via Tidal service
            try
            {
                if (dto.ExternalProvider == AudioVerse.Domain.Entities.Audio.ExternalProvider.Tidal && !string.IsNullOrEmpty(dto.ExternalId) && _tidalService != null)
                {
                    var stream = await _tidalService.GetStreamUrlAsync(dto.ExternalId);
                    if (stream != null && !string.IsNullOrEmpty(stream.Url))
                    {
                        dto.StreamUrl = stream.Url;
                        // if no externalUrl set, set to tidal web URL as well
                        if (string.IsNullOrEmpty(dto.ExternalUrl)) dto.ExternalUrl = $"https://tidal.com/browse/track/{dto.ExternalId}";
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogDebug(ex, "Failed to fetch Tidal stream for external id {Id}", dto.ExternalId);
            }

            return dto;
        }
    }
}
