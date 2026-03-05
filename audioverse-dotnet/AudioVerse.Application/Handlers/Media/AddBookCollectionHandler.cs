using AudioVerse.Application.Commands.Media;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Media;

/// <summary>Handles creating a book collection.</summary>
public class AddBookCollectionHandler(IMediaCatalogRepository r) : IRequestHandler<AddBookCollectionCommand, int>
{ public Task<int> Handle(AddBookCollectionCommand req, CancellationToken ct) => r.AddBookCollectionAsync(req.Collection); }
