using MediatR;

namespace AudioVerse.Application.Commands.Editor
{
    public class AddInputPresetCommand : IRequest<int>
    {
        public string Version { get; set; }
        public int? UserProfileId { get; set; }
        public string Name { get; set; }

        public AddInputPresetCommand(string version, string name, int? userProfileId = null)
        {
            Version = version;
            Name = name;
            UserProfileId = userProfileId;
        }
    }
}
