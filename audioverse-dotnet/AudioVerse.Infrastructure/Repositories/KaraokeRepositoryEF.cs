using AudioVerse.Domain.Entities.Karaoke;
using AudioVerse.Domain.Enums;
using AudioVerse.Domain.Repositories;
using AudioVerse.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System.Text;

namespace AudioVerse.Infrastructure.Repositories
{
    public class KaraokeRepositoryEF : IKaraokeRepository
    {
        private readonly AudioVerseDbContext _dbContext;
        private readonly ILogger<KaraokeRepositoryEF> _logger;

        public KaraokeRepositoryEF(AudioVerseDbContext dbContext, ILogger<KaraokeRepositoryEF> logger)
        {
            _dbContext = dbContext;
            _logger = logger;
        }

        public async Task<KaraokeSongFile?> GetSongByIdAsync(int id)
        {
            return await _dbContext.KaraokeSongs.FindAsync(id);
        }

        public async Task<int> CreatePartyAsync(KaraokeParty party)
        {
            _dbContext.KaraokeParties.Add(party);
            await _dbContext.SaveChangesAsync();
            return party.Id;
        }

        public async Task<int> CreatePlayerAsync(KaraokePlayer player)
        {
            _dbContext.KaraokePlayers.Add(player);
            await _dbContext.SaveChangesAsync();
            return player.Id;
        }

        public async Task<KaraokeParty?> GetPartyByIdAsync(int id)
        {
            return await _dbContext.KaraokeParties
                .Include(p => p.PartyPlayers)
                .ThenInclude(pp => pp.Player)
                .FirstOrDefaultAsync(p => p.Id == id);
        }

        public async Task<IEnumerable<KaraokeParty>> GetAllPartiesAsync()
        {
            return await _dbContext.KaraokeParties.ToListAsync();
        }

        public async Task<IEnumerable<KaraokePlayer>> GetAllPlayersAsync()
        {
            return await _dbContext.KaraokePlayers.ToListAsync();
        }

        public async Task<IEnumerable<KaraokeSongFile>> FilterSongsAsync(string? title, string? artist, string? genre, string? language, int? year)
        {
            var query = _dbContext.KaraokeSongs.AsQueryable();

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

            return await query.ToListAsync();
        }

        public async Task<KaraokeParty?> GetPartyWithPlayersAsync(int partyId)
        {
            return await _dbContext.KaraokeParties
                .Include(p => p.PartyPlayers)
                .ThenInclude(pp => pp.Player)
                .FirstOrDefaultAsync(p => p.Id == partyId);
        }

        public async Task<bool> AssignPlayerToPartyAsync(KaraokePartyPlayer partyPlayer)
        {
            _dbContext.KaraokePartyPlayers.Add(partyPlayer);
            await _dbContext.SaveChangesAsync();
            return true;
        }

        public async Task<int> AddRoundAsync(KaraokePartyRound round)
        {
            _dbContext.KaraokePartyRounds.Add(round);
            await _dbContext.SaveChangesAsync();
            return round.Id;
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
            };

            bool isNoteSection = false;

            foreach (var line in lines)
            {
                if (line.StartsWith(":") || line.StartsWith("*") || line.StartsWith("-") || line.StartsWith("E"))
                {
                    isNoteSection = true;
                    song.Notes.Add(new KaraokeNote { NoteLine = line });
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

        public Task<List<KaraokeSongFile>> GetAllSongsAsync()
        {
            return _dbContext.KaraokeSongs.AsNoTracking().ToListAsync();
        }

        public async Task<KaraokePlaylist?> GetPlaylistWithSongsAsync(int playlistId)
        {
            return await _dbContext.KaraokePlaylists
                .Include(p => p.PlaylistSongs)
                .ThenInclude(ps => ps.Song)
                .FirstOrDefaultAsync(p => p.Id == playlistId);
        }
    }
}
