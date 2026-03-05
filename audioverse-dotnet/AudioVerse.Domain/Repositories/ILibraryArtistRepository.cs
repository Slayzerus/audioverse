using AudioVerse.Domain.Entities.Audio;

namespace AudioVerse.Domain.Repositories;

/// <summary>
/// Repository for media library artists (catalog CRUD, facts, detail).
/// </summary>
public interface ILibraryArtistRepository
{
    Task<(IEnumerable<Artist> Items, int TotalCount)> SearchAsync(string? query, int page, int pageSize);
    Task<Artist?> GetByIdAsync(int id);
    Task<int> AddAsync(Artist artist);
    Task<bool> UpdateAsync(Artist artist);
    Task<bool> DeleteAsync(int id);
    Task<IEnumerable<ArtistFact>> GetFactsAsync(int artistId);
    Task<int> AddFactAsync(ArtistFact fact);
    Task<bool> DeleteFactAsync(int id);
    Task UpsertDetailAsync(int artistId, ArtistDetail detail);
}
