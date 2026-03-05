using AudioVerse.Domain.Entities.Karaoke.KaraokeSongFiles;
using MediatR;

namespace AudioVerse.Application.Commands.Karaoke
{
    public class ParseUltrastarFileCommand : IRequest<KaraokeSongFile?>
    {
        public string FileName { get; set; } = string.Empty;

        public byte[] Data { get; set; } = new byte[0];

        public ParseUltrastarFileCommand()
        {
            
        }

        public ParseUltrastarFileCommand(string fileName, byte[] data)
        {
            FileName = fileName;
            Data = data;
        }
    }
}
