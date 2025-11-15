using AudioVerse.Domain.Entities.Editor;
using MediatR;

namespace AudioVerse.Application.Commands.Editor
{
    public class AddLayerItemsCommand : IRequest<bool>
    {
        public IEnumerable<AudioLayerItem> Items { get; }

        public AddLayerItemsCommand(IEnumerable<AudioLayerItem> items)
        {
            Items = items;
        }
    }
}
