using MediatR;

namespace AudioVerse.Application.Commands.Editor
{
    public class AddLayerCommand : IRequest<int>
    {
        public int SectionId { get; set; }
        public string AudioSource { get; set; }
        public string AudioSourceParameters { get; set; }

        public AddLayerCommand(int sectionId, string audioSource, string audioSourceParameters)
        {
            SectionId = sectionId;
            AudioSource = audioSource;
            AudioSourceParameters = audioSourceParameters;
        }
    }
}
