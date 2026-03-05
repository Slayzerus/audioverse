using AudioVerse.Application.Commands.Events;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Events;

/// <summary>Handles adding an option to a betting market.</summary>
public class AddBettingOptionHandler(IBettingRepository repo) : IRequestHandler<AddBettingOptionCommand, int>
{
    public Task<int> Handle(AddBettingOptionCommand req, CancellationToken ct) =>
        repo.AddOptionAsync(req.Option);
}
