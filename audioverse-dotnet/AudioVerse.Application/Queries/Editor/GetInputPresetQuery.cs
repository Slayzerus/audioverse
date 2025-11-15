using AudioVerse.Domain.Entities.Editor;
using MediatR;

namespace AudioVerse.Application.Queries.Editor
{
    public class GetInputPresetQuery : IRequest<AudioInputPreset?>
    {
        public int PresetId { get; }

        public GetInputPresetQuery(int presetId)
        {
            PresetId = presetId;
        }
    }
}
