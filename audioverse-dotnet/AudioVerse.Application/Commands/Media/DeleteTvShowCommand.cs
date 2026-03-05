using MediatR;

namespace AudioVerse.Application.Commands.Media;

/// <summary>Delete a TV show by ID.</summary>
public record DeleteTvShowCommand(int Id) : IRequest<bool>;
