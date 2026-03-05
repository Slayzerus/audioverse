using MediatR;
using System.Collections.Generic;
using AudioVerse.Domain.Entities.Karaoke.KaraokeSongFiles;

namespace AudioVerse.Application.Commands.Karaoke
{
    public record ScanFolderCommand(string FolderPath) : IRequest<IEnumerable<KaraokeSongFile>>;
}
