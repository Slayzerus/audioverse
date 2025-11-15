using Dapper;
using AudioVerse.Domain.Repositories;
using System.Data;
using AudioVerse.Domain.Entities.Karaoke;
using AudioVerse.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using System.Text;
using Microsoft.Extensions.Logging;

namespace AudioVerse.Infrastructure.Repositories
{
    public class KaraokeRepository : IKaraokeRepository
    {
        private readonly IDbConnection _db;
        private readonly ILogger<KaraokeRepositoryEF> _logger;

        public KaraokeRepository(IDbConnection db, ILogger<KaraokeRepositoryEF> logger)
        {
            _db = db;
            _logger = logger;
        }

        public async Task<KaraokeSongFile?> GetSongByIdAsync(int id)
        {
            return await _db.QueryFirstOrDefaultAsync<KaraokeSongFile>(
                "SELECT * FROM KaraokeSongs WHERE Id = @Id", new { Id = id });
        }

        public async Task<int> CreatePartyAsync(KaraokeParty party)
        {
            var sql = "INSERT INTO KaraokeParties (Name, OrganizerId) VALUES (@Name, @OrganizerId) RETURNING Id";
            return await _db.ExecuteScalarAsync<int>(sql, party);
        }

        public async Task<int> CreatePlayerAsync(KaraokePlayer player)
        {
            var sql = "INSERT INTO KaraokePlayers (Name) VALUES (@Name) RETURNING Id";
            return await _db.ExecuteScalarAsync<int>(sql, player);
        }

        public async Task<KaraokeParty?> GetPartyByIdAsync(int id)
        {
            return await _db.QueryFirstOrDefaultAsync<KaraokeParty>(
                "SELECT * FROM KaraokeParties WHERE Id = @Id", new { Id = id });
        }

        public async Task<IEnumerable<KaraokeParty>> GetAllPartiesAsync()
        {
            return await _db.QueryAsync<KaraokeParty>("SELECT * FROM KaraokeParties");
        }

        public async Task<IEnumerable<KaraokePlayer>> GetAllPlayersAsync()
        {
            return await _db.QueryAsync<KaraokePlayer>("SELECT * FROM KaraokePlayers");
        }

        public async Task<IEnumerable<KaraokeSongFile>> FilterSongsAsync(string? title, string? artist, string? genre, string? language, int? year)
        {
            var sql = "SELECT * FROM KaraokeSongs WHERE " +
                      "(@Title IS NULL OR Title LIKE '%' || @Title || '%') " +
                      "AND (@Artist IS NULL OR Artist LIKE '%' || @Artist || '%') " +
                      "AND (@Genre IS NULL OR Genre = @Genre) " +
                      "AND (@Language IS NULL OR Language = @Language) " +
                      "AND (@Year IS NULL OR Year = @Year)";

            return await _db.QueryAsync<KaraokeSongFile>(sql, new { Title = title, Artist = artist, Genre = genre, Language = language, Year = year });
        }

        public async Task<bool> AssignPlayerToPartyAsync(KaraokePartyPlayer partyPlayer)
        {
            var sql = "INSERT INTO KaraokePartyPlayers (PartyId, PlayerId) VALUES (@PartyId, @PlayerId)";
            var rowsAffected = await _db.ExecuteAsync(sql, partyPlayer);
            return rowsAffected > 0;
        }

        public async Task<int> AddRoundAsync(KaraokePartyRound round)
        {
            var sql = "INSERT INTO KaraokePartyRounds (PartyId, PlayerId, RoundNumber) VALUES (@PartyId, @PlayerId, @RoundNumber) RETURNING Id";
            return await _db.ExecuteScalarAsync<int>(sql, round);
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

        public async Task<List<KaraokeSongFile>> GetAllSongsAsync()
        {
            string sql = "SELECT * FROM KaraokeSongs";
            var songs = await _db.QueryAsync<KaraokeSongFile>(sql);
            return songs.ToList();
        }

        public async Task<KaraokeParty?> GetPartyWithPlayersAsync(int partyId)
        {
            string sql = @"
                SELECT * FROM KaraokeParties WHERE Id = @Id;
                SELECT kp.* FROM KaraokePartyPlayers kpp
                JOIN KaraokePlayers kp ON kpp.PlayerId = kp.Id
                WHERE kpp.PartyId = @Id;";

            using var multi = await _db.QueryMultipleAsync(sql, new { Id = partyId });

            var party = await multi.ReadSingleOrDefaultAsync<KaraokeParty>();
            if (party != null)
            {
                party.PartyPlayers = (await multi.ReadAsync<KaraokePartyPlayer>()).ToList();
            }
            return party;
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
            };

            bool isNoteSection = false;

            foreach (var line in lines)
            {
                if (line.StartsWith(":") || line.StartsWith("*") || line.StartsWith("-") || line.StartsWith("E"))
                {
                    isNoteSection = true;
                    song.Notes.Add(new KaraokeNote { NoteLine = line, SongId = song.Id });
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
    }
}
