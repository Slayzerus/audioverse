using MediatR;

namespace AudioVerse.Application.Commands.Events;

public record SetVideoThumbnailCommand(int VideoId, string ThumbnailKey) : IRequest<bool>;
