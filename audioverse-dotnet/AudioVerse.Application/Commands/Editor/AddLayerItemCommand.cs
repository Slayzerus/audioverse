using MediatR;

namespace AudioVerse.Application.Commands.Editor
{
    public class AddLayerItemCommand : IRequest<int>
    {
        public int LayerId { get; set; }
        public TimeSpan StartTime { get; set; }
        public string Parameters { get; set; }

        public AddLayerItemCommand(int layerId, TimeSpan startTime, string parameters)
        {
            LayerId = layerId;
            StartTime = startTime;
            Parameters = parameters;
        }
    }
}
