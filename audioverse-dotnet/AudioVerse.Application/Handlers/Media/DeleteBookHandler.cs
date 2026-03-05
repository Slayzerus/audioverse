using AudioVerse.Application.Commands.Media;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Media;

/// <summary>Handles deleting a book.</summary>
public class DeleteBookHandler(IMediaCatalogRepository r) : IRequestHandler<DeleteBookCommand, bool>
{ public Task<bool> Handle(DeleteBookCommand req, CancellationToken ct) => r.DeleteBookAsync(req.Id); }
