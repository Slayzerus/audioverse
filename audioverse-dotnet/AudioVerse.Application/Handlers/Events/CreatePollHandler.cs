using AudioVerse.Application.Commands.Events;
using AudioVerse.Application.Queries.Events;
using AudioVerse.Domain.Entities.Events;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Events;

public class CreatePollHandler(IEventRepository r) : IRequestHandler<CreatePollCommand, int>
{
    public async Task<int> Handle(CreatePollCommand req, CancellationToken ct)
    {
        if (string.IsNullOrEmpty(req.Poll.Token))
            req.Poll.Token = Guid.NewGuid().ToString("N");
        return await r.CreatePollAsync(req.Poll);
    }
}
