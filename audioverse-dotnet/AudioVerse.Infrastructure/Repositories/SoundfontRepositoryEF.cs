using AudioVerse.Domain.Entities.Audio;
using AudioVerse.Domain.Repositories;
using AudioVerse.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace AudioVerse.Infrastructure.Repositories;

public class SoundfontRepositoryEF(AudioVerseDbContext db) : ISoundfontRepository
{
    public async Task SaveChangesAsync(CancellationToken ct = default) => await db.SaveChangesAsync(ct);

    public async Task<int> AddSoundfontAsync(Soundfont soundfont, CancellationToken ct = default)
    {
        db.Soundfonts.Add(soundfont);
        await db.SaveChangesAsync(ct);
        return soundfont.Id;
    }

    public async Task<Soundfont?> GetSoundfontByIdAsync(int id, CancellationToken ct = default)
        => await db.Soundfonts.FindAsync([id], ct);

    public async Task<Soundfont?> GetSoundfontWithFilesAsync(int id, CancellationToken ct = default)
        => await db.Soundfonts.Include(s => s.Files).FirstOrDefaultAsync(s => s.Id == id, ct);

    public async Task<IEnumerable<Soundfont>> SearchSoundfontsAsync(string? query, SoundfontFormat? format, int page, int pageSize, CancellationToken ct = default)
    {
        var q = db.Soundfonts.AsQueryable();
        if (!string.IsNullOrWhiteSpace(query))
            q = q.Where(s => s.Name.Contains(query) || (s.Author != null && s.Author.Contains(query)) || (s.Tags != null && s.Tags.Contains(query)));
        if (format.HasValue)
            q = q.Where(s => s.Format == format.Value);
        return await q.OrderByDescending(s => s.CreatedAt).Skip((page - 1) * pageSize).Take(pageSize).Include(s => s.Files).ToListAsync(ct);
    }

    public async Task RemoveSoundfontAsync(Soundfont soundfont, CancellationToken ct = default)
    {
        db.Soundfonts.Remove(soundfont);
        await db.SaveChangesAsync(ct);
    }

    public async Task AddSoundfontFileAsync(SoundfontFile file, CancellationToken ct = default)
    {
        db.SoundfontFiles.Add(file);
        await Task.CompletedTask;
    }

    public async Task<SoundfontFile?> GetSoundfontFileByIdAsync(int id, CancellationToken ct = default)
        => await db.SoundfontFiles.FindAsync([id], ct);

    public async Task<IEnumerable<SoundfontFile>> GetSoundfontFilesAsync(int soundfontId, CancellationToken ct = default)
        => await db.SoundfontFiles.Where(f => f.SoundfontId == soundfontId).ToListAsync(ct);

    public async Task RemoveSoundfontFileAsync(SoundfontFile file, CancellationToken ct = default)
    {
        db.SoundfontFiles.Remove(file);
        await Task.CompletedTask;
    }
}
