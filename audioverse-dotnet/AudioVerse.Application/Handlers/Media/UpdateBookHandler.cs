using AudioVerse.Application.Commands.Media;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Media;

/// <summary>Handles updating a book.</summary>
public class UpdateBookHandler(IMediaCatalogRepository r) : IRequestHandler<UpdateBookCommand, bool>
{ public Task<bool> Handle(UpdateBookCommand req, CancellationToken ct) => r.UpdateBookAsync(req.Book); }
