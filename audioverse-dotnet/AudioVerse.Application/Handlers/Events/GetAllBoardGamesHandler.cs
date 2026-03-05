using AudioVerse.Application.Commands.Events;
using AudioVerse.Application.Queries.Events;
using AudioVerse.Domain.Entities.Games;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Events;

public class GetAllBoardGamesHandler(IEventRepository r) : IRequestHandler<GetAllBoardGamesQuery, IEnumerable<BoardGame>>
{ public Task<IEnumerable<BoardGame>> Handle(GetAllBoardGamesQuery req, CancellationToken ct) => r.GetAllBoardGamesAsync(); }
