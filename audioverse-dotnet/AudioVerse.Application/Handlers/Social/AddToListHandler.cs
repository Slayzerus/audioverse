using AudioVerse.Application.Commands.Social;
using AudioVerse.Domain.Entities.Social;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Social;

/// <summary>Handles adding an entity to a user's personal list.</summary>
public class AddToListHandler(ISocialRepository socialRepository)
    : IRequestHandler<AddToListCommand, int>
{
    public async Task<int> Handle(AddToListCommand request, CancellationToken cancellationToken)
    {
        var entry = new UserListEntry
        {
            EntityType = request.EntityType,
            EntityId = request.EntityId,
            PlayerId = request.PlayerId,
            ListName = request.ListName,
            Note = request.Note
        };

        var result = await socialRepository.AddToListAsync(entry);
        return result.Id;
    }
}
