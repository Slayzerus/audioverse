using Microsoft.EntityFrameworkCore;
using NiceToDev.FunZone.Application.Interfaces;
using NiceToDev.FunZone.Domain.Entities;
using NiceToDev.FunZone.Domain.Enums;
using NiceToDev.FunZone.Domain.Repositories;
using NiceToDev.FunZone.Infrastructure.Repositories;
using SmartERP.CommonTools.Services;
using System.Linq.Expressions;

namespace NiceToDev.FunZone.Application.Services
{
    public class KaraokeService : GenericService, IKaraokeService
    {
        private readonly IKaraokeRepository _repository;

        public KaraokeService(IKaraokeRepository repository) : base(repository)
        {
            _repository = repository;
        }

        public async Task<KaraokeParty?> GetPartyWithPlayersAsync(int partyId)
        {
            return await _repository.GetPartyWithPlayersAsync(partyId);
        }

        public async Task<KaraokePlaylist?> GetPlaylistWithSongsAsync(int playlistId)
        {
            return await _repository.GetPlaylistWithSongsAsync(playlistId);
        }

        public async Task<List<KaraokeSongFile>> SortSongsAsync(Func<KaraokeSongFile, object> keySelector, bool ascending = true)
        {
            var songs = await _repository.GetAllSongsAsync();
            return ascending ? songs.OrderBy(keySelector).ToList() : songs.OrderByDescending(keySelector).ToList();
        }

        public async Task<List<KaraokeSongFile>> FilterSongsAsync(Expression<Func<KaraokeSongFile, bool>> predicate)
        {
            return await _repository.GetSongsFilteredAsync(predicate).ToListAsync();
        }

        public async Task<List<KaraokeSongFile>> ScanFolderAsync(string folderPath)
        {
            var songs = new List<KaraokeSongFile>();
            var files = Directory.GetFiles(folderPath, "*.txt", SearchOption.AllDirectories);

            foreach (var file in files)
            {
                var song = ParseUltrastarSong(file);
                if (song != null)
                    songs.Add(song);
            }

            return songs;
        }

        public async Task UpdateSongsAsync(List<KaraokeSongFile> songs, Action<KaraokeSongFile> updateAction)
        {
            foreach (var song in songs)
            {
                updateAction(song);
                if (song is KaraokeSongFile)
                    SaveSongToFile((KaraokeSongFile)song);
            }
        }

        private KaraokeSongFile? ParseUltrastarSong(string filePath)
        {
            var lines = File.ReadAllLines(filePath);
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
                    song.Notes.Add(new KaraokeNote { NoteLine = line, Song = song });
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

        private void SaveSongToFile(KaraokeSongFile song)
        {
            var lines = File.ReadAllLines(song.FilePath).ToList();
            var updatedLines = new List<string>();
            var updates = new Dictionary<string, string>
            {
                { "#TITLE:", song.Title },
                { "#ARTIST:", song.Artist },
                { "#GENRE:", song.Genre },
                { "#LANGUAGE:", song.Language },
                { "#YEAR:", song.Year },
                { "#COVER:", song.CoverPath },
                { "#MP3:", song.AudioPath },
                { "#VIDEO:", song.VideoPath }
            };
            var keysToInsert = new HashSet<string>(updates.Keys);
            bool isNoteSection = false;

            foreach (var line in lines)
            {
                if (line.StartsWith(":") || line.StartsWith("*") || line.StartsWith("-") || line.StartsWith("E"))
                {
                    isNoteSection = true;
                }

                var matchedKey = updates.Keys.FirstOrDefault(k => line.StartsWith(k));
                if (matchedKey != null)
                {
                    updatedLines.Add($"{matchedKey} {updates[matchedKey]}");
                    keysToInsert.Remove(matchedKey);
                }
                else
                {
                    updatedLines.Add(line);
                }
            }

            if (!isNoteSection && keysToInsert.Count > 0)
            {
                foreach (var key in keysToInsert)
                {
                    updatedLines.Add($"{key} {updates[key]}");
                }
            }

            File.WriteAllLines(song.FilePath, updatedLines);
        }
    }
}
