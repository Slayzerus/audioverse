using AudioVerse.Application.Commands.Events;
using AudioVerse.Application.Queries.Events;
using AudioVerse.Domain.Entities.Events;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Events;

public class UpsertSongSignupHandler(IEventRepository r) : IRequestHandler<UpsertSongSignupCommand, int>
{ public Task<int> Handle(UpsertSongSignupCommand req, CancellationToken ct) => r.UpsertSongSignupAsync(req.Signup); }
