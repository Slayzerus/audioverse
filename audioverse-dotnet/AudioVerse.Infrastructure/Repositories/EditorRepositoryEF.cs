using AudioVerse.Domain.Entities.Editor;
using AudioVerse.Domain.Repositories;
using AudioVerse.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace AudioVerse.Infrastructure.Repositories
{
    public class EditorRepositoryEF : IEditorRepository
    {
        private readonly AudioVerseDbContext _dbContext;

        public EditorRepositoryEF(AudioVerseDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        // 🔹 Dodawanie projektu
        public async Task<int> AddProjectAsync(AudioProject project)
        {
            _dbContext.AudioProjects.Add(project);
            await _dbContext.SaveChangesAsync();
            return project.Id;
        }

        // 🔹 Dodawanie sekcji do projektu
        public async Task<int> AddSectionAsync(AudioSection section)
        {
            _dbContext.AudioSections.Add(section);
            await _dbContext.SaveChangesAsync();
            return section.Id;
        }

        // 🔹 Dodawanie warstwy do sekcji
        public async Task<int> AddLayerAsync(AudioLayer layer)
        {
            _dbContext.AudioLayers.Add(layer);
            await _dbContext.SaveChangesAsync();
            return layer.Id;
        }

        // 🔹 Dodawanie pojedynczego itemu do warstwy
        public async Task<int> AddLayerItemAsync(AudioLayerItem item)
        {
            _dbContext.AudioLayerItems.Add(item);
            await _dbContext.SaveChangesAsync();
            return item.Id;
        }

        // 🔹 Dodawanie wielu itemów do warstwy
        public async Task AddLayerItemsAsync(IEnumerable<AudioLayerItem> items)
        {
            _dbContext.AudioLayerItems.AddRange(items);
            await _dbContext.SaveChangesAsync();
        }

        // 🔹 Pobieranie listy projektów (zwraca IEnumerable zamiast List)
        public async Task<IEnumerable<AudioProject>> GetProjectsAsync()
        {
            return await _dbContext.AudioProjects.Where(x => !x.IsTemplate).AsNoTracking().ToListAsync();
        }

        public async Task<IEnumerable<AudioProject>> GetProjectTemplatesAsync()
        {
            return await _dbContext.AudioProjects.Where(x => x.IsTemplate).AsNoTracking().ToListAsync();
        }

        // 🔹 Pobieranie pełnego projektu ze wszystkimi encjami
        public async Task<AudioProject?> GetProjectWithDetailsAsync(int projectId)
        {
            return await _dbContext.AudioProjects
                .Include(p => p.Sections)
                    .ThenInclude(s => s.Layers)
                        .ThenInclude(l => l.Items)
                .Include(p => p.Sections)
                    .ThenInclude(s => s.Layers)
                        .ThenInclude(l => l.InputMappings)
                .Include(p => p.Sections)
                    .ThenInclude(s => s.InputMappings)
                .Include(p => p.Sections)
                    .ThenInclude(s => s.Layers)
                        .ThenInclude(l => l.AudioClip)
                            .ThenInclude(ac => ac.Tags)
                .FirstOrDefaultAsync(p => p.Id == projectId);
        }

        // 🔹 Dodawanie AudioClip
        public async Task<int> AddAudioClipAsync(AudioClip clip)
        {
            _dbContext.AudioClips.Add(clip);
            await _dbContext.SaveChangesAsync();
            return clip.Id;
        }

        // 🔹 Pobieranie listy AudioClipów (zwraca IEnumerable zamiast List)
        public async Task<IEnumerable<AudioClip>> GetAudioClipsAsync(int skip, int take, string? tag = null, string? search = null)
        {
            var query = _dbContext.AudioClips.AsQueryable();

            if (!string.IsNullOrEmpty(tag))
            {
                query = query.Where(c => c.Tags.Any(t => t.Tag == tag));
            }

            if (!string.IsNullOrEmpty(search))
            {
                query = query.Where(c => c.FileName.Contains(search));
            }

            return await query.Skip(skip).Take(take).ToListAsync();
        }

        // 🔹 Dodawanie Input Preset
        public async Task<int> AddInputPresetAsync(AudioInputPreset preset)
        {
            _dbContext.AudioInputPresets.Add(preset);
            await _dbContext.SaveChangesAsync();
            return preset.Id;
        }

        // 🔹 Pobieranie Input Preset
        public async Task<AudioInputPreset?> GetInputPresetAsync(int presetId)
        {
            return await _dbContext.AudioInputPresets
                .Include(p => p.Layers)
                .FirstOrDefaultAsync(p => p.Id == presetId);
        }

        // 🔹 Pobieranie listy Input Presetów (zwraca IEnumerable zamiast List)
        public async Task<IEnumerable<AudioInputPreset>> GetInputPresetsAsync(int skip, int take, string? search = null)
        {
            var query = _dbContext.AudioInputPresets.AsQueryable();

            if (!string.IsNullOrEmpty(search))
            {
                query = query.Where(p => p.Name.Contains(search));
            }

            return await query.Skip(skip).Take(take).ToListAsync();
        }

        // 🔹 Dodawanie tagu do AudioClip
        public async Task AddTagToAudioClipAsync(int clipId, string tag)
        {
            var clipTag = new AudioClipTag(clipId, tag);
            _dbContext.AudioClipTags.Add(clipTag);
            await _dbContext.SaveChangesAsync();
        }

        // 🔹 Usuwanie tagu z AudioClip
        public async Task RemoveTagFromAudioClipAsync(int clipId, string tag)
        {
            var clipTag = await _dbContext.AudioClipTags
                .FirstOrDefaultAsync(t => t.AudioClipId == clipId && t.Tag == tag);

            if (clipTag != null)
            {
                _dbContext.AudioClipTags.Remove(clipTag);
                await _dbContext.SaveChangesAsync();
            }
        }


        public async Task<AudioClip?> GetAudioClipAsync(int clipId)
        {
            return await _dbContext.AudioClips
                .Include(c => c.Tags)
                .FirstOrDefaultAsync(c => c.Id == clipId);
        }

        public async Task<int> AddInputMappingAsync(AudioInputMapping mapping)
        {
            _dbContext.AudioInputMappings.Add(mapping);
            await _dbContext.SaveChangesAsync();
            return mapping.Id;
        }

        public async Task<bool> UpdateInputMappingAsync(AudioInputMapping mapping)
        {
            var existingMapping = await _dbContext.AudioInputMappings.FindAsync(mapping.Id);
            if (existingMapping == null) return false;

            _dbContext.Entry(existingMapping).CurrentValues.SetValues(mapping);
            await _dbContext.SaveChangesAsync();
            return true;
        }

        public async Task<bool> RemoveInputMappingAsync(int mappingId)
        {
            var mapping = await _dbContext.AudioInputMappings.FindAsync(mappingId);
            if (mapping == null) return false;

            _dbContext.AudioInputMappings.Remove(mapping);
            await _dbContext.SaveChangesAsync();
            return true;
        }

    }
}