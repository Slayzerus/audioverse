using AudioVerse.Application.Commands.Social;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Social;

/// <summary>Handles removing a tag.</summary>
public class RemoveTagHandler(ISocialRepository socialRepository)
    : IRequestHandler<RemoveTagCommand, bool>
{
    public async Task<bool> Handle(RemoveTagCommand request, CancellationToken cancellationToken)
    {
        return await socialRepository.RemoveTagAsync(request.TagId, request.PlayerId);
    }
}
