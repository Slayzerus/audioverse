using AudioVerse.Application.Queries.Media;
using AudioVerse.Domain.Entities.Media;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Media;

/// <summary>Handles retrieving a sport activity by ID.</summary>
public class GetSportByIdHandler(IMediaCatalogRepository r) : IRequestHandler<GetSportByIdQuery, SportActivity?>
{ public Task<SportActivity?> Handle(GetSportByIdQuery req, CancellationToken ct) => r.GetSportByIdAsync(req.Id); }
