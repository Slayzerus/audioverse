using MediatR;
using System.IO;
using System.Threading;
using System.Threading.Tasks;
using AudioVerse.Application.Queries;
using AudioVerse.Application.Queries.Karaoke;

namespace AudioVerse.Application.Handlers.Karaoke
{
    public class GetCoverImageHandler : IRequestHandler<GetCoverImageQuery, string>
    {
        public async Task<string> Handle(GetCoverImageQuery request, CancellationToken cancellationToken)
        {
            string directory = Path.GetDirectoryName(request.FilePath) ?? "";
            string fileNameWithoutExt = Path.GetFileNameWithoutExtension(request.FilePath);

            string jpgPath = Path.Combine(directory, fileNameWithoutExt + ".jpg");
            string pngPath = Path.Combine(directory, fileNameWithoutExt + ".png");

            if (File.Exists(jpgPath))
                return jpgPath;
            if (File.Exists(pngPath))
                return pngPath;

            return string.Empty;
        }
    }
}
