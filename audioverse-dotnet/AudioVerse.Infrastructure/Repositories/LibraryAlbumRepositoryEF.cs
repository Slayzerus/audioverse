using AudioVerse.Domain.Entities.Audio;
using AudioVerse.Domain.Repositories;
using AudioVerse.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace AudioVerse.Infrastructure.Repositories;

/// <summary>
/// EF Core implementation of ILibraryAlbumRepository.
/// </summary>
public class LibraryAlbumRepositoryEF : ILibraryAlbumRepository
{
    private readonly AudioVerseDbContext _db;

    public LibraryAlbumRepositoryEF(AudioVerseDbContext db) => _db = db;

    public async Task<(IEnumerable<Album> Items, int TotalCount)> SearchAsync(string? query, int page, int pageSize)
    {
        var q = _db.LibraryAlbums.Include(a => a.AlbumArtists).ThenInclude(aa => aa.Artist).AsQueryable();
        if (!string.IsNullOrWhiteSpace(query))
            q = q.Where(a => a.Title.Contains(query));
        var total = await q.CountAsync();
        var items = await q.OrderBy(a => a.Title).Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();
        return (items, total);
    }

    public async Task<Album?> GetByIdAsync(int id)
        => await _db.LibraryAlbums.Include(a => a.Songs).Include(a => a.AlbumArtists).ThenInclude(aa => aa.Artist).FirstOrDefaultAsync(a => a.Id == id);

    public async Task<int> AddAsync(Album album)
    {
        _db.LibraryAlbums.Add(album);
        await _db.SaveChangesAsync();
        return album.Id;
    }

    public async Task<bool> UpdateAsync(Album album)
    {
        var existing = await _db.LibraryAlbums.FindAsync(album.Id);
        if (existing == null) return false;
        existing.Title = album.Title;
        existing.ReleaseYear = album.ReleaseYear;
        existing.CoverUrl = album.CoverUrl;
        existing.MusicBrainzAlbumId = album.MusicBrainzAlbumId;
        existing.PrimaryArtistId = album.PrimaryArtistId;
        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var a = await _db.LibraryAlbums.FindAsync(id);
        if (a == null) return false;
        _db.LibraryAlbums.Remove(a);
        await _db.SaveChangesAsync();
        return true;
    }

    public async Task AddAlbumArtistAsync(AlbumArtist albumArtist)
    {
        _db.LibraryAlbumArtists.Add(albumArtist);
        await _db.SaveChangesAsync();
    }

    public async Task<bool> RemoveAlbumArtistAsync(int albumId, int artistId)
    {
        var aa = await _db.LibraryAlbumArtists.FindAsync(albumId, artistId);
        if (aa == null) return false;
        _db.LibraryAlbumArtists.Remove(aa);
        await _db.SaveChangesAsync();
        return true;
    }
}
