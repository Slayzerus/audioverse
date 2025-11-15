using MediatR;

namespace AudioVerse.Application.Commands.Editor
{
    public class AddProjectCommand : IRequest<int>
    {
        public string Name { get; set; }
        public int UserProfileId { get; set; }

        public AddProjectCommand(string name, int userProfileId)
        {
            Name = name;
            UserProfileId = userProfileId;
        }
    }
}
