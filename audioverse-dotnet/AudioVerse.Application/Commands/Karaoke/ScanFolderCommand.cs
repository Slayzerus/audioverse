using MediatR;
using AudioVerse.Domain.Entities.Karaoke;
using System.Collections.Generic;

namespace AudioVerse.Application.Commands.Karaoke
{
    public record ScanFolderCommand(string FolderPath) : IRequest<IEnumerable<KaraokeSongFile>>;
}
