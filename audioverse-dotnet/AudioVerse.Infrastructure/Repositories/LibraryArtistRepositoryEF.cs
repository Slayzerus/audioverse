using AudioVerse.Domain.Entities.Audio;
using AudioVerse.Domain.Repositories;
using AudioVerse.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace AudioVerse.Infrastructure.Repositories;

/// <summary>
/// EF Core implementation of ILibraryArtistRepository.
/// </summary>
public class LibraryArtistRepositoryEF : ILibraryArtistRepository
{
    private readonly AudioVerseDbContext _db;

    public LibraryArtistRepositoryEF(AudioVerseDbContext db) => _db = db;

    public async Task<(IEnumerable<Artist> Items, int TotalCount)> SearchAsync(string? query, int page, int pageSize)
    {
        var q = _db.LibraryArtists.Include(a => a.Detail).AsQueryable();
        if (!string.IsNullOrWhiteSpace(query))
            q = q.Where(a => a.Name.Contains(query) || a.NormalizedName.Contains(query.ToUpperInvariant()));
        var total = await q.CountAsync();
        var items = await q.OrderBy(a => a.Name).Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();
        return (items, total);
    }

    public async Task<Artist?> GetByIdAsync(int id)
        => await _db.LibraryArtists.Include(a => a.Detail).Include(a => a.Facts).FirstOrDefaultAsync(a => a.Id == id);

    public async Task<int> AddAsync(Artist artist)
    {
        artist.NormalizedName = artist.Name.ToUpperInvariant();
        _db.LibraryArtists.Add(artist);
        await _db.SaveChangesAsync();
        return artist.Id;
    }

    public async Task<bool> UpdateAsync(Artist artist)
    {
        var existing = await _db.LibraryArtists.FindAsync(artist.Id);
        if (existing == null) return false;
        existing.Name = artist.Name;
        existing.NormalizedName = artist.Name.ToUpperInvariant();
        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var a = await _db.LibraryArtists.FindAsync(id);
        if (a == null) return false;
        _db.LibraryArtists.Remove(a);
        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<IEnumerable<ArtistFact>> GetFactsAsync(int artistId)
        => await _db.LibraryArtistFacts.Where(f => f.ArtistId == artistId).ToListAsync();

    public async Task<int> AddFactAsync(ArtistFact fact)
    {
        _db.LibraryArtistFacts.Add(fact);
        await _db.SaveChangesAsync();
        return fact.Id;
    }

    public async Task<bool> DeleteFactAsync(int id)
    {
        var f = await _db.LibraryArtistFacts.FindAsync(id);
        if (f == null) return false;
        _db.LibraryArtistFacts.Remove(f);
        await _db.SaveChangesAsync();
        return true;
    }

    public async Task UpsertDetailAsync(int artistId, ArtistDetail detail)
    {
        var existing = await _db.LibraryArtistDetails.FirstOrDefaultAsync(d => d.ArtistId == artistId);
        if (existing != null)
        {
            existing.Bio = detail.Bio;
            existing.ImageUrl = detail.ImageUrl;
            existing.Country = detail.Country;
        }
        else
        {
            detail.ArtistId = artistId;
            _db.LibraryArtistDetails.Add(detail);
        }
        await _db.SaveChangesAsync();
    }
}
