using AudioVerse.Domain.Entities.Audio;

namespace AudioVerse.Domain.Repositories;

/// <summary>
/// Repository for media library albums (catalog CRUD, album artists).
/// </summary>
public interface ILibraryAlbumRepository
{
    Task<(IEnumerable<Album> Items, int TotalCount)> SearchAsync(string? query, int page, int pageSize);
    Task<Album?> GetByIdAsync(int id);
    Task<int> AddAsync(Album album);
    Task<bool> UpdateAsync(Album album);
    Task<bool> DeleteAsync(int id);
    Task AddAlbumArtistAsync(AlbumArtist albumArtist);
    Task<bool> RemoveAlbumArtistAsync(int albumId, int artistId);
}
