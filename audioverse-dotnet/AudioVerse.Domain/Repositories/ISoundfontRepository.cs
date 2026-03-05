using AudioVerse.Domain.Entities.Audio;

namespace AudioVerse.Domain.Repositories;

/// <summary>Repository for soundfonts and soundfont files.</summary>
public interface ISoundfontRepository
{
    Task SaveChangesAsync(CancellationToken ct = default);

    Task<int> AddSoundfontAsync(Soundfont soundfont, CancellationToken ct = default);
    Task<Soundfont?> GetSoundfontByIdAsync(int id, CancellationToken ct = default);
    Task<Soundfont?> GetSoundfontWithFilesAsync(int id, CancellationToken ct = default);
    Task<IEnumerable<Soundfont>> SearchSoundfontsAsync(string? query, SoundfontFormat? format, int page, int pageSize, CancellationToken ct = default);
    Task RemoveSoundfontAsync(Soundfont soundfont, CancellationToken ct = default);

    Task AddSoundfontFileAsync(SoundfontFile file, CancellationToken ct = default);
    Task<SoundfontFile?> GetSoundfontFileByIdAsync(int id, CancellationToken ct = default);
    Task<IEnumerable<SoundfontFile>> GetSoundfontFilesAsync(int soundfontId, CancellationToken ct = default);
    Task RemoveSoundfontFileAsync(SoundfontFile file, CancellationToken ct = default);
}
