using AudioVerse.Domain.Entities.Audio;
using AudioVerse.Domain.Entities.Karaoke.KaraokeSongFiles;
using AudioVerse.Domain.Enums;
using System.Collections.Generic;

namespace AudioVerse.Application.Models.Dtos
{
    public class KaraokeSongDto
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Artist { get; set; } = string.Empty;
        public string Genre { get; set; } = string.Empty;
        public string Language { get; set; } = string.Empty;
        public string Year { get; set; } = string.Empty;
        public string CoverPath { get; set; } = string.Empty;
        public string AudioPath { get; set; } = string.Empty;
        public string VideoPath { get; set; } = string.Empty;
        public int Gap { get; set; }
        public int VideoGap { get; set; }
        public int Start { get; set; }
        public int End { get; set; }
        public decimal Bpm { get; set; }
        public bool IsVerified { get; set; }
        public bool InDevelopment { get; set; }
        public int? OwnerId { get; set; }
        public bool? CanBeModifiedByAll { get; set; }
        public KaraokeFormat Format { get; set; }
        public string FilePath { get; set; } = string.Empty;
        public List<KaraokeSongFileNote> Notes { get; set; } = new();

        public string? ExternalSource { get; set; }
        public string? ExternalId { get; set; }
        public string? ExternalCoverUrl { get; set; }
        public int? LinkedSongId { get; set; }

        /// <summary>Szczegółowe dane z katalogu audio (Song + Artist + linki streamingowe).</summary>
        public LinkedSongInfoDto? LinkedSong { get; set; }

        public static KaraokeSongDto FromDomain(KaraokeSongFile s)
        {
            return new KaraokeSongDto
            {
                Id = s.Id,
                Title = s.Title,
                Artist = s.Artist,
                Genre = s.Genre,
                Language = s.Language,
                Year = s.Year,
                CoverPath = s.CoverPath,
                AudioPath = s.AudioPath,
                VideoPath = s.VideoPath,
                Gap = s.Gap,
                VideoGap = s.VideoGap,
                Start = s.Start,
                End = s.End,
                Bpm = s.Bpm,
                IsVerified = s.IsVerified,
                InDevelopment = s.InDevelopment,
                OwnerId = s.OwnerId,
                CanBeModifiedByAll = s.CanBeModifiedByAll,
                Format = s.Format,
                FilePath = s.FilePath,
                Notes = s.Notes ?? new List<KaraokeSongFileNote>(),
                ExternalSource = s.ExternalSource,
                ExternalId = s.ExternalId,
                ExternalCoverUrl = s.ExternalCoverUrl,
                LinkedSongId = s.LinkedSongId,
                LinkedSong = LinkedSongInfoDto.FromSong(s.LinkedSong)
            };
        }
    }
}
