using MediatR;

namespace AudioVerse.Application.Commands.Editor
{
    public class AddSectionCommand : IRequest<int>
    {
        public int ProjectId { get; set; }
        public string Name { get; set; }
        public int OrderNumber { get; set; }

        public AddSectionCommand(int projectId, string name, int orderNumber)
        {
            ProjectId = projectId;
            Name = name;
            OrderNumber = orderNumber;
        }
    }
}
