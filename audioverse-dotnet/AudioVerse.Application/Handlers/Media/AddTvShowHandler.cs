using AudioVerse.Application.Commands.Media;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Media;

/// <summary>Handles adding a TV show.</summary>
public class AddTvShowHandler(IMediaCatalogRepository r) : IRequestHandler<AddTvShowCommand, int>
{ public Task<int> Handle(AddTvShowCommand req, CancellationToken ct) => r.AddTvShowAsync(req.Show); }
