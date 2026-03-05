using AudioVerse.Application.Commands.Events;
using AudioVerse.Application.Queries.Events;
using AudioVerse.Domain.Entities.Events;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Events;

public class SetVideoThumbnailHandler(IEventRepository r) : IRequestHandler<SetVideoThumbnailCommand, bool>
{
    public async Task<bool> Handle(SetVideoThumbnailCommand req, CancellationToken ct)
    {
        var video = await r.GetVideoByIdAsync(req.VideoId);
        if (video == null) return false;
        video.ThumbnailKey = req.ThumbnailKey;
        return true;
    }
}

// â”€â”€ Media Tags â”€â”€
