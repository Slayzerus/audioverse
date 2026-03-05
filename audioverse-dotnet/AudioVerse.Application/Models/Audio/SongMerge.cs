using AudioVerse.Application.Models.SongInformations;
using System.Text.RegularExpressions;

namespace AudioVerse.Application.Models.Audio
{
    public static class SongMerge
    {
        public static SongRecord Merge(SongFileInformation file, SongInformation? online)
        {
            var rec = new SongRecord
            {
                // Kanoniczne
                Id = file.Id,
                Title = First(file.Title, online?.Title),
                Artists = PickArtists(file.Artists, online?.Artist),
                Album = First(file.Album, online?.Album),
                Year = (int?)file.Year ?? online?.ReleaseYear,
                DurationSeconds = file.DurationSeconds > 0 ? file.DurationSeconds
                                  : (online?.Duration?.TotalSeconds),
                Genres = MergeGenres(file.Genres, online?.Genre),
                ISRC = First(file.ISRC, online?.ISRC),
                Lyrics = First(file.Lyrics, online?.Lyrics),

                // Plik / technika
                FilePath = file.FilePath,
                FileName = file.FileName,
                FileSizeBytes = file.FileSizeBytes,
                CreatedAt = file.CreatedAt.UtcDateTime,
                ModifiedAt = file.ModifiedAt.UtcDateTime,
                AudioMimeType = file.AudioMimeType ?? "",
                CodecDescription = file.CodecDescription ?? "",
                BitrateKbps = file.BitrateKbps,
                SampleRateHz = file.SampleRateHz,
                Channels = file.Channels,
                BitsPerSample = file.BitsPerSample,

                // MBIDs
                MusicBrainzTrackId = file.MusicBrainzTrackId,
                MusicBrainzAlbumId = file.MusicBrainzAlbumId,
                MusicBrainzArtistId = file.MusicBrainzArtistId,
                MusicBrainzReleaseArtistId = file.MusicBrainzReleaseArtistId,
                MusicBrainzReleaseGroupId = file.MusicBrainzReleaseGroupId,

                // Okładka
                HasEmbeddedCover = file.HasEmbeddedCover,
                EmbeddedCoverMimeType = file.EmbeddedCoverMimeType,
                EmbeddedCoverByteLength = file.EmbeddedCoverByteLength,

                // Analiza
                Analysis = file.Details,

                // Extra
                Extra = file.Extra ?? new Dictionary<string, string>()
            };

            // Linki + detale z enrichmentu
            if (online is not null)
            {
                foreach (var kv in online.StreamingLinks)
                    rec.StreamingLinks[kv.Key] = kv.Value;

                rec.AlbumDetails = online.AlbumDetails ?? new AlbumInformation();
                rec.ArtistDetails = online.ArtistDetails ?? new ArtistInformation();
            }

            return rec;
        }

        private static string First(string? a, string? b) =>
            !string.IsNullOrWhiteSpace(a) ? a! : (b ?? "");

        private static string[] PickArtists(string[]? tagArtists, string? onlineArtist)
        {
            var set = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            if (tagArtists != null) foreach (var a in tagArtists.Where(s => !string.IsNullOrWhiteSpace(s))) set.Add(a);
            if (!string.IsNullOrWhiteSpace(onlineArtist))
            {
                foreach (var a in SplitArtists(onlineArtist)) set.Add(a);
            }
            return set.Count > 0 ? set.ToArray() : Array.Empty<string>();
        }

        private static IEnumerable<string> SplitArtists(string artist)
        {
            // proste dzielenie po " & ", "," i " feat. "
            var parts = Regex.Split(artist, @"\s*(,|&|feat\.|ft\.)\s*", RegexOptions.IgnoreCase)
                             .Where(x => !string.IsNullOrWhiteSpace(x) && !",&".Contains(x.Trim()));
            foreach (var p in parts) yield return p.Trim();
        }

        private static string[] MergeGenres(string[]? tagGenres, string? onlineGenre)
        {
            var set = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            if (tagGenres != null) foreach (var g in tagGenres.Where(s => !string.IsNullOrWhiteSpace(s))) set.Add(g);
            if (!string.IsNullOrWhiteSpace(onlineGenre))
            {
                foreach (var g in onlineGenre.Split(new[] { '/', ',', ';' }, StringSplitOptions.RemoveEmptyEntries))
                    set.Add(g.Trim());
            }
            return set.Count > 0 ? set.ToArray() : Array.Empty<string>();
        }
    }
}
