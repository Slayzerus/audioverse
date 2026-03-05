using MediatR;
using AudioVerse.Application.Queries.Karaoke;
using AudioVerse.Application.Models.Common;
using AudioVerse.Application.Models.Dtos;
using AudioVerse.Application.Models.Requests.Karaoke;
using AudioVerse.Domain.Repositories;
using Microsoft.EntityFrameworkCore;

namespace AudioVerse.Application.Handlers.Karaoke
{
    public class GetFilteredSongsHandler : IRequestHandler<GetFilteredSongsQuery, PagedResult<KaraokeSongDto>>
    {
        private readonly IKaraokeRepository _karaokeRepo;
        public GetFilteredSongsHandler(IKaraokeRepository karaokeRepo) { _karaokeRepo = karaokeRepo; }

        public async Task<PagedResult<KaraokeSongDto>> Handle(GetFilteredSongsQuery request, CancellationToken cancellationToken)
        {
            var f = request.Filter;
            var q = _karaokeRepo.GetSongsQueryable()
                .Include(s => s.LinkedSong)
                    .ThenInclude(ls => ls!.PrimaryArtist)
                        .ThenInclude(a => a!.Detail)
                .Include(s => s.LinkedSong)
                    .ThenInclude(ls => ls!.Album)
                .Include(s => s.LinkedSong)
                    .ThenInclude(ls => ls!.Details)
                .AsQueryable();

            // --- Istniejące filtry ---
            if (f.Artists != null && f.Artists.Any()) q = q.Where(s => f.Artists.Contains(s.Artist));
            if (f.Genres != null && f.Genres.Any())
                q = q.Where(s => f.Genres.Contains(s.Genre)
                    || (s.LinkedSong != null && s.LinkedSong.Details.Any(d =>
                        d.Type == Domain.Enums.Audio.SongDetailType.Credits && d.Value != null && f.Genres.Any(g => d.Value.Contains(g)))));
            if (f.Languages != null && f.Languages.Any()) q = q.Where(s => f.Languages.Contains(s.Language));
            if (f.Years != null && f.Years.Any())
            {
                q = q.Where(s => s.Year != null);
                var years = f.Years;
                q = q.Where(s => years.Contains(int.Parse(s.Year)));
            }
            if (f.OwnerIds != null && f.OwnerIds.Any()) q = q.Where(s => s.OwnerId.HasValue && f.OwnerIds.Contains(s.OwnerId.Value));
            if (f.IsVerified.HasValue) q = q.Where(s => s.IsVerified == f.IsVerified.Value);
            if (f.InDevelopment.HasValue) q = q.Where(s => s.InDevelopment == f.InDevelopment.Value);
            if (!string.IsNullOrEmpty(f.TitleContains)) q = q.Where(s => s.Title.Contains(f.TitleContains));
            if (f.BpmFrom.HasValue) q = q.Where(s => s.Bpm >= f.BpmFrom.Value);
            if (f.BpmTo.HasValue) q = q.Where(s => s.Bpm <= f.BpmTo.Value);

            // --- Nowe filtry ---

            // SearchQuery — szukaj w tytule/artyście karaoke + w zlinkowanej piosence (artysta, album)
            if (!string.IsNullOrEmpty(f.SearchQuery))
            {
                var sq = f.SearchQuery;
                q = q.Where(s =>
                    s.Title.Contains(sq) ||
                    s.Artist.Contains(sq) ||
                    (s.LinkedSong != null && s.LinkedSong.Title.Contains(sq)) ||
                    (s.LinkedSong != null && s.LinkedSong.PrimaryArtist != null && s.LinkedSong.PrimaryArtist.Name.Contains(sq)) ||
                    (s.LinkedSong != null && s.LinkedSong.Album != null && s.LinkedSong.Album.Title.Contains(sq)));
            }

            // HasLinkedSong
            if (f.HasLinkedSong.HasValue)
                q = f.HasLinkedSong.Value
                    ? q.Where(s => s.LinkedSongId != null)
                    : q.Where(s => s.LinkedSongId == null);

            // ExternalSource
            if (!string.IsNullOrEmpty(f.ExternalSource))
                q = q.Where(s => s.ExternalSource == f.ExternalSource);

            // LinkedArtistName
            if (!string.IsNullOrEmpty(f.LinkedArtistName))
                q = q.Where(s => s.LinkedSong != null && s.LinkedSong.PrimaryArtist != null
                    && s.LinkedSong.PrimaryArtist.Name.Contains(f.LinkedArtistName));

            // ISRC
            if (!string.IsNullOrEmpty(f.ISRC))
                q = q.Where(s => s.LinkedSong != null && s.LinkedSong.ISRC == f.ISRC);

            // DurationFromSec / DurationToSec — filtruj po SongDetail z duration_seconds
            if (f.DurationFromSec.HasValue || f.DurationToSec.HasValue)
            {
                var durationPrefix = "duration_seconds:";
                q = q.Where(s => s.LinkedSong != null && s.LinkedSong.Details.Any(d =>
                    d.Type == Domain.Enums.Audio.SongDetailType.Credits &&
                    d.Value != null && d.Value.StartsWith(durationPrefix)));

                // Filtrowanie po wartości duration jest trudne w SQL (string parsing),
                // więc robimy to po stronie klienta po pobraniu danych — patrz niżej
            }

            // --- Sortowanie ---
            var dir = (f.SortDir ?? "asc").ToLowerInvariant();
            switch ((f.SortBy ?? "Title").ToLowerInvariant())
            {
                case "title": q = dir == "asc" ? q.OrderBy(s => s.Title) : q.OrderByDescending(s => s.Title); break;
                case "artist": q = dir == "asc" ? q.OrderBy(s => s.Artist) : q.OrderByDescending(s => s.Artist); break;
                case "year": q = dir == "asc" ? q.OrderBy(s => s.Year) : q.OrderByDescending(s => s.Year); break;
                case "bpm": q = dir == "asc" ? q.OrderBy(s => s.Bpm) : q.OrderByDescending(s => s.Bpm); break;
                case "linkedartist": q = dir == "asc"
                    ? q.OrderBy(s => s.LinkedSong != null && s.LinkedSong.PrimaryArtist != null ? s.LinkedSong.PrimaryArtist.Name : s.Artist)
                    : q.OrderByDescending(s => s.LinkedSong != null && s.LinkedSong.PrimaryArtist != null ? s.LinkedSong.PrimaryArtist.Name : s.Artist); break;
                default: q = q.OrderBy(s => s.Title); break;
            }

            // --- Paginacja ---
            var total = await q.CountAsync(cancellationToken);
            var skip = (Math.Max(1, f.Page) - 1) * Math.Max(1, f.PageSize);
            var items = await q.Skip(skip).Take(f.PageSize).ToListAsync(cancellationToken);

            // --- Duration filtering (client-side, bo parsing stringa w SQL nie jest wspierany) ---
            if (f.DurationFromSec.HasValue || f.DurationToSec.HasValue)
            {
                items = items.Where(s =>
                {
                    var dur = GetDurationSeconds(s.LinkedSong);
                    if (dur == null) return false;
                    if (f.DurationFromSec.HasValue && dur < f.DurationFromSec.Value) return false;
                    if (f.DurationToSec.HasValue && dur > f.DurationToSec.Value) return false;
                    return true;
                }).ToList();
            }

            var dtos = items.Select(s =>
            {
                var dto = KaraokeSongDto.FromDomain(s);
                if (!f.IncludeLinkedSongDetails)
                    dto.LinkedSong = null;
                return dto;
            });

            return new PagedResult<KaraokeSongDto> { Items = dtos, TotalCount = total, Page = f.Page, PageSize = f.PageSize };
        }

        private static int? GetDurationSeconds(Domain.Entities.Audio.Song? song)
        {
            if (song?.Details == null) return null;
            var detail = song.Details.FirstOrDefault(d =>
                d.Type == Domain.Enums.Audio.SongDetailType.Credits &&
                d.Value != null && d.Value.StartsWith("duration_seconds:"));
            if (detail?.Value == null) return null;
            return int.TryParse(detail.Value["duration_seconds:".Length..], out var v) ? v : null;
        }
    }
}
