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
                        .ThenInclude(l => l.AudioClip!)
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

        public async Task<bool> UpdateProjectAsync(AudioProject project)
        {
            var existing = await _dbContext.AudioProjects.FindAsync(project.Id);
            if (existing == null) return false;

            existing.Name = project.Name;
            existing.IsTemplate = project.IsTemplate;
            existing.Volume = project.Volume;

            await _dbContext.SaveChangesAsync();
            return true;
        }

        public async Task<bool> DeleteProjectAsync(int projectId)
        {
            var existing = await _dbContext.AudioProjects
                .Include(p => p.Sections)
                .ThenInclude(s => s.Layers)
                .ThenInclude(l => l.Items)
                .FirstOrDefaultAsync(p => p.Id == projectId);
            if (existing == null) return false;

            _dbContext.AudioProjects.Remove(existing);
            await _dbContext.SaveChangesAsync();
            return true;
        }

        public async Task<bool> UpdateSectionAsync(AudioSection section)
        {
            var existing = await _dbContext.AudioSections.FindAsync(section.Id);
            if (existing == null) return false;
            existing.Name = section.Name;
            existing.OrderNumber = section.OrderNumber;
            await _dbContext.SaveChangesAsync();
            return true;
        }

        public async Task<bool> DeleteSectionAsync(int sectionId)
        {
            var existing = await _dbContext.AudioSections
                .Include(s => s.Layers)
                .ThenInclude(l => l.Items)
                .FirstOrDefaultAsync(s => s.Id == sectionId);
            if (existing == null) return false;

            _dbContext.AudioSections.Remove(existing);
            await _dbContext.SaveChangesAsync();
            return true;
        }

        public async Task<bool> UpdateLayerAsync(AudioLayer layer)
        {
            var existing = await _dbContext.AudioLayers.FindAsync(layer.Id);
            if (existing == null) return false;
            existing.Name = layer.Name;
            existing.AudioClipId = layer.AudioClipId;
            await _dbContext.SaveChangesAsync();
            return true;
        }

        public async Task<bool> DeleteLayerAsync(int layerId)
        {
            var existing = await _dbContext.AudioLayers
                .Include(l => l.Items)
                .FirstOrDefaultAsync(l => l.Id == layerId);
            if (existing == null) return false;

            _dbContext.AudioLayers.Remove(existing);
            await _dbContext.SaveChangesAsync();
            return true;
        }

        public async Task<bool> DeleteLayerItemAsync(int itemId)
        {
            var existing = await _dbContext.AudioLayerItems.FindAsync(itemId);
            if (existing == null) return false;
            _dbContext.AudioLayerItems.Remove(existing);
            await _dbContext.SaveChangesAsync();
            return true;
        }

        public async Task<bool> DeleteAudioClipAsync(int clipId)
        {
            var existing = await _dbContext.AudioClips
                .Include(c => c.Tags)
                .FirstOrDefaultAsync(c => c.Id == clipId);
            if (existing == null) return false;

            _dbContext.AudioClips.Remove(existing);
            await _dbContext.SaveChangesAsync();
            return true;
        }

        // ── Effects ──

        public async Task<IEnumerable<AudioEffect>> GetEffectsAsync()
            => await _dbContext.AudioEffects.ToListAsync();

        public async Task<AudioEffect?> GetEffectByIdAsync(int id)
            => await _dbContext.AudioEffects.FindAsync(id);

        public async Task<int> AddEffectAsync(AudioEffect effect)
        {
            _dbContext.AudioEffects.Add(effect);
            await _dbContext.SaveChangesAsync();
            return effect.Id;
        }

        public async Task RemoveEffectAsync(AudioEffect effect)
        {
            _dbContext.AudioEffects.Remove(effect);
            await _dbContext.SaveChangesAsync();
        }

        public async Task SaveChangesAsync() => await _dbContext.SaveChangesAsync();

        // ── Layer Effects ──

        public async Task<IEnumerable<AudioLayerEffect>> GetLayerEffectsAsync(int layerId)
            => await _dbContext.AudioLayerEffects
                .Include(e => e.Effect)
                .Where(e => e.LayerId == layerId)
                .OrderBy(e => e.Order)
                .ToListAsync();

        public async Task<AudioLayerEffect?> GetLayerEffectByIdAsync(int id)
            => await _dbContext.AudioLayerEffects.FindAsync(id);

        public async Task<int> AddLayerEffectAsync(AudioLayerEffect layerEffect)
        {
            _dbContext.AudioLayerEffects.Add(layerEffect);
            await _dbContext.SaveChangesAsync();
            return layerEffect.Id;
        }

        public async Task RemoveLayerEffectAsync(AudioLayerEffect layerEffect)
        {
            _dbContext.AudioLayerEffects.Remove(layerEffect);
            await _dbContext.SaveChangesAsync();
        }

        // ── Collaborators ──

        public async Task<IEnumerable<AudioProjectCollaborator>> GetCollaboratorsAsync(int projectId)
            => await _dbContext.AudioProjectCollaborators
                .Where(c => c.ProjectId == projectId)
                .OrderBy(c => c.JoinedAt)
                .ToListAsync();

        public async Task<AudioProjectCollaborator?> GetCollaboratorByIdAsync(int id)
            => await _dbContext.AudioProjectCollaborators.FindAsync(id);

        public async Task<int> AddCollaboratorAsync(AudioProjectCollaborator collaborator)
        {
            _dbContext.AudioProjectCollaborators.Add(collaborator);
            await _dbContext.SaveChangesAsync();
            return collaborator.Id;
        }

        public async Task RemoveCollaboratorAsync(AudioProjectCollaborator collaborator)
        {
            _dbContext.AudioProjectCollaborators.Remove(collaborator);
            await _dbContext.SaveChangesAsync();
        }

        // ── Export Tasks ──

        public async Task<int> AddExportTaskAsync(AudioExportTask task)
        {
            _dbContext.AudioExportTasks.Add(task);
            await _dbContext.SaveChangesAsync();
            return task.Id;
        }

        public async Task<AudioExportTask?> GetExportTaskByIdAsync(int id)
            => await _dbContext.AudioExportTasks.FindAsync(id);

        // ── Sample Packs ──

        public async Task<IEnumerable<AudioSamplePack>> GetSamplePacksAsync(string? genre, string? instrument)
        {
            var q = _dbContext.AudioSamplePacks.Include(p => p.Samples).AsQueryable();
            if (!string.IsNullOrEmpty(genre)) q = q.Where(p => p.Genre == genre);
            if (!string.IsNullOrEmpty(instrument)) q = q.Where(p => p.Instrument == instrument);
            return await q.OrderByDescending(p => p.CreatedAt).ToListAsync();
        }

        public async Task<AudioSamplePack?> GetSamplePackByIdAsync(int id)
            => await _dbContext.AudioSamplePacks.Include(p => p.Samples).FirstOrDefaultAsync(p => p.Id == id);

        public async Task<int> AddSamplePackAsync(AudioSamplePack pack)
        {
            _dbContext.AudioSamplePacks.Add(pack);
            await _dbContext.SaveChangesAsync();
            return pack.Id;
        }

        public async Task RemoveSamplePackAsync(AudioSamplePack pack)
        {
            _dbContext.AudioSamplePacks.Remove(pack);
            await _dbContext.SaveChangesAsync();
        }

        // ── Samples ──

        public async Task<int> AddSampleAsync(AudioSample sample)
        {
            _dbContext.AudioSamples.Add(sample);
            await _dbContext.SaveChangesAsync();
            return sample.Id;
        }

        public async Task<AudioSample?> GetSampleByIdAsync(int id)
            => await _dbContext.AudioSamples.FindAsync(id);

        public async Task RemoveSampleAsync(AudioSample sample)
        {
            _dbContext.AudioSamples.Remove(sample);
            await _dbContext.SaveChangesAsync();
        }

    }
}