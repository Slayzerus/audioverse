using AudioVerse.Application.Models.Common;
using AudioVerse.Application.Models.Requests.Games;
using AudioVerse.Domain.Entities.Games;
using MediatR;

namespace AudioVerse.Application.Queries.Games;

public record GetVideoGamesPagedQuery(GameCatalogFilterRequest Filter) : IRequest<PagedResult<VideoGame>>;
