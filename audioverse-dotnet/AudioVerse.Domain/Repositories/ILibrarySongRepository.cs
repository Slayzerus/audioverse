using AudioVerse.Domain.Entities.Audio;

namespace AudioVerse.Domain.Repositories;

/// <summary>
/// Repository for media library songs (catalog CRUD, details, search).
/// </summary>
public interface ILibrarySongRepository
{
    Task<(IEnumerable<Song> Items, int TotalCount)> SearchAsync(string? query, int page, int pageSize);
    Task<Song?> GetByIdAsync(int id);
    Task<int> AddAsync(Song song);
    Task<bool> UpdateAsync(Song song);
    Task<bool> DeleteAsync(int id);
    Task<IEnumerable<SongDetail>> GetDetailsAsync(int songId);
    Task<int> AddDetailAsync(SongDetail detail);
    Task<bool> DeleteDetailAsync(int id);

    // Audio files
    Task<IEnumerable<AudioFile>> ListAudioFilesAsync(int? songId, int? albumId, int? userId);
    Task<AudioFile?> GetAudioFileByIdAsync(int id, int? userId);
    Task<int> AddAudioFileAsync(AudioFile file);
    Task<bool> DeleteAudioFileAsync(int id, int? userId);

    // Media files
    Task<IEnumerable<MediaFile>> ListMediaFilesAsync(int? songId);
    Task<int> AddMediaFileAsync(MediaFile file);
    Task<bool> DeleteMediaFileAsync(int id);

    // Import
    Task<Artist> GetOrCreateArtistByNameAsync(string artistName);
    Task<Song?> FindByIsrcAsync(string isrc);

    // Genres
    Task<IEnumerable<MusicGenre>> GetAllGenresAsync(CancellationToken ct = default);
    Task<MusicGenre?> GetGenreByIdAsync(int id, CancellationToken ct = default);
}
