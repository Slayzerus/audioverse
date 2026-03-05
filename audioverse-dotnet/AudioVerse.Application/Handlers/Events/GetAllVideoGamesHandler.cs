using AudioVerse.Application.Commands.Events;
using AudioVerse.Application.Queries.Events;
using AudioVerse.Domain.Entities.Games;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Events;

public class GetAllVideoGamesHandler(IEventRepository r) : IRequestHandler<GetAllVideoGamesQuery, IEnumerable<VideoGame>>
{ public Task<IEnumerable<VideoGame>> Handle(GetAllVideoGamesQuery req, CancellationToken ct) => r.GetAllVideoGamesAsync(); }
