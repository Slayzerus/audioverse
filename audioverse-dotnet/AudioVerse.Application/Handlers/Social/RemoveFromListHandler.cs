using AudioVerse.Application.Commands.Social;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Social;

/// <summary>Handles removing an entity from a user's personal list.</summary>
public class RemoveFromListHandler(ISocialRepository socialRepository)
    : IRequestHandler<RemoveFromListCommand, bool>
{
    public async Task<bool> Handle(RemoveFromListCommand request, CancellationToken cancellationToken)
    {
        return await socialRepository.RemoveFromListAsync(request.EntryId, request.PlayerId);
    }
}
