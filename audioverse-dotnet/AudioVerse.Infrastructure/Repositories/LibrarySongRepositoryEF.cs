using AudioVerse.Domain.Entities.Audio;
using AudioVerse.Domain.Repositories;
using AudioVerse.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace AudioVerse.Infrastructure.Repositories;

/// <summary>
/// EF Core implementation of ILibrarySongRepository.
/// </summary>
public class LibrarySongRepositoryEF : ILibrarySongRepository
{
    private readonly AudioVerseDbContext _db;

    public LibrarySongRepositoryEF(AudioVerseDbContext db) => _db = db;

    public async Task<(IEnumerable<Song> Items, int TotalCount)> SearchAsync(string? query, int page, int pageSize)
    {
        var q = _db.LibrarySongs.Include(s => s.PrimaryArtist).Include(s => s.Album).AsQueryable();
        if (!string.IsNullOrWhiteSpace(query))
            q = q.Where(s => s.Title.Contains(query) || (s.PrimaryArtist != null && s.PrimaryArtist.Name.Contains(query)));
        var total = await q.CountAsync();
        var items = await q.OrderBy(s => s.Title).Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();
        return (items, total);
    }

    public async Task<Song?> GetByIdAsync(int id)
        => await _db.LibrarySongs.Include(s => s.Details).Include(s => s.PrimaryArtist).Include(s => s.Album).FirstOrDefaultAsync(s => s.Id == id);

    public async Task<int> AddAsync(Song song)
    {
        _db.LibrarySongs.Add(song);
        await _db.SaveChangesAsync();
        return song.Id;
    }

    public async Task<bool> UpdateAsync(Song song)
    {
        var existing = await _db.LibrarySongs.FindAsync(song.Id);
        if (existing == null) return false;
        existing.Title = song.Title;
        existing.AlbumId = song.AlbumId;
        existing.ISRC = song.ISRC;
        existing.PrimaryArtistId = song.PrimaryArtistId;
        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var song = await _db.LibrarySongs.FindAsync(id);
        if (song == null) return false;
        _db.LibrarySongs.Remove(song);
        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<IEnumerable<SongDetail>> GetDetailsAsync(int songId)
        => await _db.LibrarySongDetails.Where(d => d.SongId == songId).ToListAsync();

    public async Task<int> AddDetailAsync(SongDetail detail)
    {
        _db.LibrarySongDetails.Add(detail);
        await _db.SaveChangesAsync();
        return detail.Id;
    }

    public async Task<bool> DeleteDetailAsync(int id)
    {
        var d = await _db.LibrarySongDetails.FindAsync(id);
        if (d == null) return false;
        _db.LibrarySongDetails.Remove(d);
        await _db.SaveChangesAsync();
        return true;
    }

    // Audio files

    public async Task<IEnumerable<AudioFile>> ListAudioFilesAsync(int? songId, int? albumId, int? userId)
    {
        var q = _db.LibraryAudioFiles.Where(f => !f.IsPrivate || f.OwnerId == userId);
        if (songId.HasValue) q = q.Where(f => f.SongId == songId);
        if (albumId.HasValue) q = q.Where(f => f.AlbumId == albumId);
        return await q.OrderBy(f => f.FileName).ToListAsync();
    }

    public async Task<AudioFile?> GetAudioFileByIdAsync(int id, int? userId)
        => await _db.LibraryAudioFiles
            .Include(f => f.Song).Include(f => f.Album)
            .FirstOrDefaultAsync(f => f.Id == id && (!f.IsPrivate || f.OwnerId == userId));

    public async Task<int> AddAudioFileAsync(AudioFile file)
    {
        _db.LibraryAudioFiles.Add(file);
        await _db.SaveChangesAsync();
        return file.Id;
    }

    public async Task<bool> DeleteAudioFileAsync(int id, int? userId)
    {
        var f = await _db.LibraryAudioFiles.FindAsync(id);
        if (f == null) return false;
        if (f.IsPrivate && f.OwnerId != userId) return false;
        _db.LibraryAudioFiles.Remove(f);
        await _db.SaveChangesAsync();
        return true;
    }

    // Media files

    public async Task<IEnumerable<MediaFile>> ListMediaFilesAsync(int? songId)
    {
        var q = _db.LibraryMediaFiles.AsQueryable();
        if (songId.HasValue) q = q.Where(f => f.SongId == songId);
        return await q.OrderBy(f => f.FileName).ToListAsync();
    }

    public async Task<int> AddMediaFileAsync(MediaFile file)
    {
        _db.LibraryMediaFiles.Add(file);
        await _db.SaveChangesAsync();
        return file.Id;
    }

    public async Task<bool> DeleteMediaFileAsync(int id)
    {
        var f = await _db.LibraryMediaFiles.FindAsync(id);
        if (f == null) return false;
        _db.LibraryMediaFiles.Remove(f);
        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<Artist> GetOrCreateArtistByNameAsync(string artistName)
    {
        var norm = artistName.ToUpperInvariant();
        var artist = await _db.LibraryArtists.FirstOrDefaultAsync(a => a.NormalizedName == norm);
        if (artist == null)
        {
            artist = new Artist { Name = artistName, NormalizedName = norm };
            _db.LibraryArtists.Add(artist);
            await _db.SaveChangesAsync();
        }
        return artist;
    }

    public async Task<Song?> FindByIsrcAsync(string isrc)
        => await _db.LibrarySongs.FirstOrDefaultAsync(s => s.ISRC == isrc);

    public async Task<IEnumerable<MusicGenre>> GetAllGenresAsync(CancellationToken ct = default)
        => await _db.MusicGenres.Include(g => g.SubGenres).ToListAsync(ct);

    public async Task<MusicGenre?> GetGenreByIdAsync(int id, CancellationToken ct = default)
        => await _db.MusicGenres.Include(g => g.SubGenres).FirstOrDefaultAsync(g => g.Id == id, ct);
}
