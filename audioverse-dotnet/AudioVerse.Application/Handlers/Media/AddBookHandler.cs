using AudioVerse.Application.Commands.Media;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Media;

/// <summary>Handles adding a book.</summary>
public class AddBookHandler(IMediaCatalogRepository r) : IRequestHandler<AddBookCommand, int>
{ public Task<int> Handle(AddBookCommand req, CancellationToken ct) => r.AddBookAsync(req.Book); }
