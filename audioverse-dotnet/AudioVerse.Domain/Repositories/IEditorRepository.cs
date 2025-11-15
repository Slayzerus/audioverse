using AudioVerse.Domain.Entities.Editor;
using AudioVerse.Domain.Entities.Karaoke;
using AudioVerse.Domain.Enums;
using System.Text;

namespace AudioVerse.Domain.Repositories
{
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

        Task<int> AddInputMappingAsync(AudioInputMapping mapping);
        Task<bool> UpdateInputMappingAsync(AudioInputMapping mapping);
        Task<bool> RemoveInputMappingAsync(int mappingId);
    }
}
