using AudioVerse.Domain.Entities.Editor;
using AudioVerse.Domain.Entities.Karaoke;
using AudioVerse.Domain.Enums;
using System.Text;

namespace AudioVerse.Domain.Repositories
{
    /// <summary>
    /// Repository for audio editor projects, sections, layers, clips, effects, and export tasks.
    /// </summary>
    public interface IEditorRepository
    {
        Task<int> AddProjectAsync(AudioProject project);
        Task<int> AddSectionAsync(AudioSection section);
        Task<int> AddLayerAsync(AudioLayer layer);
        Task<int> AddLayerItemAsync(AudioLayerItem item);
        Task AddLayerItemsAsync(IEnumerable<AudioLayerItem> items);

        Task<IEnumerable<AudioProject>> GetProjectsAsync();
        Task<IEnumerable<AudioProject>> GetProjectTemplatesAsync();
        Task<AudioProject?> GetProjectWithDetailsAsync(int projectId);

        Task<int> AddAudioClipAsync(AudioClip clip);
        Task<AudioClip?> GetAudioClipAsync(int clipId);
        Task<IEnumerable<AudioClip>> GetAudioClipsAsync(int skip, int take, string? tag = null, string? search = null);

        Task<int> AddInputPresetAsync(AudioInputPreset preset);
        Task<AudioInputPreset?> GetInputPresetAsync(int presetId);
        Task<IEnumerable<AudioInputPreset>> GetInputPresetsAsync(int skip, int take, string? search = null);

        Task AddTagToAudioClipAsync(int clipId, string tag);
        Task RemoveTagFromAudioClipAsync(int clipId, string tag);

        Task<bool> UpdateProjectAsync(AudioProject project);
        Task<bool> DeleteProjectAsync(int projectId);
        Task<bool> UpdateSectionAsync(AudioSection section);
        Task<bool> DeleteSectionAsync(int sectionId);
        Task<bool> UpdateLayerAsync(AudioLayer layer);
        Task<bool> DeleteLayerAsync(int layerId);
        Task<bool> DeleteLayerItemAsync(int itemId);
        Task<bool> DeleteAudioClipAsync(int clipId);

        Task<int> AddInputMappingAsync(AudioInputMapping mapping);
        Task<bool> UpdateInputMappingAsync(AudioInputMapping mapping);
        Task<bool> RemoveInputMappingAsync(int mappingId);

        // Effects
        Task<IEnumerable<AudioEffect>> GetEffectsAsync();
        Task<AudioEffect?> GetEffectByIdAsync(int id);
        Task<int> AddEffectAsync(AudioEffect effect);
        Task RemoveEffectAsync(AudioEffect effect);
        Task SaveChangesAsync();

        // Layer effects
        Task<IEnumerable<AudioLayerEffect>> GetLayerEffectsAsync(int layerId);
        Task<AudioLayerEffect?> GetLayerEffectByIdAsync(int id);
        Task<int> AddLayerEffectAsync(AudioLayerEffect layerEffect);
        Task RemoveLayerEffectAsync(AudioLayerEffect layerEffect);

        // Collaborators
        Task<IEnumerable<AudioProjectCollaborator>> GetCollaboratorsAsync(int projectId);
        Task<AudioProjectCollaborator?> GetCollaboratorByIdAsync(int id);
        Task<int> AddCollaboratorAsync(AudioProjectCollaborator collaborator);
        Task RemoveCollaboratorAsync(AudioProjectCollaborator collaborator);

        // Export tasks
        Task<int> AddExportTaskAsync(AudioExportTask task);
        Task<AudioExportTask?> GetExportTaskByIdAsync(int id);

        // Sample packs
        Task<IEnumerable<AudioSamplePack>> GetSamplePacksAsync(string? genre, string? instrument);
        Task<AudioSamplePack?> GetSamplePackByIdAsync(int id);
        Task<int> AddSamplePackAsync(AudioSamplePack pack);
        Task RemoveSamplePackAsync(AudioSamplePack pack);

        // Samples
        Task<int> AddSampleAsync(AudioSample sample);
        Task<AudioSample?> GetSampleByIdAsync(int id);
        Task RemoveSampleAsync(AudioSample sample);
    }
}
