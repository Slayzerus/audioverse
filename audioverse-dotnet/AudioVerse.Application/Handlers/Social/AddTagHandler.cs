using AudioVerse.Application.Commands.Social;
using AudioVerse.Domain.Entities.Social;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Social;

/// <summary>Handles adding a tag to an entity.</summary>
public class AddTagHandler(ISocialRepository socialRepository)
    : IRequestHandler<AddTagCommand, int>
{
    public async Task<int> Handle(AddTagCommand request, CancellationToken cancellationToken)
    {
        var tag = new UserTag
        {
            EntityType = request.EntityType,
            EntityId = request.EntityId,
            PlayerId = request.PlayerId,
            Tag = request.Tag
        };

        var result = await socialRepository.AddTagAsync(tag);
        return result.Id;
    }
}
