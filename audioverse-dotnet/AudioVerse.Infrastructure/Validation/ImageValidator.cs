using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Formats;

namespace AudioVerse.Infrastructure.Validation;

public static class ImageValidator
{
    public static bool ValidatePoster(IFormFile poster, IConfiguration config, out string? err)
    {
        err = null;
        if (poster == null) return true;
        var max = int.TryParse(config["StorageOptions:Poster:MaxSizeBytes"], out var m) ? m : 5242880;
        var allowed = config.GetSection("StorageOptions:Poster:AllowedContentTypes").Get<string[]>() ?? new[] { "image/png", "image/jpeg", "image/webp" };
        if (poster.Length > max) { err = "File too large"; return false; }
        if (!allowed.Contains(poster.ContentType)) { err = "Unsupported content type"; return false; }

        try
        {
            using var ms = new MemoryStream();
            poster.CopyTo(ms);
            var sig = ms.ToArray();

            string? detected = null;
            try
            {
                ms.Position = 0;
                var format = Image.DetectFormat(ms);
                if (format != null) detected = format.Name.ToLowerInvariant();
            }
            catch (Exception ex) when (ex is ArgumentException or FormatException or InvalidOperationException) { }
            if (detected == null)
                detected = DetectImageType(sig);
            if (detected == null) { err = "Invalid image data"; return false; }

            var expectedFromContentType = detected switch
            {
                "png" => "image/png",
                "jpeg" => "image/jpeg",
                "webp" => "image/webp",
                "gif" => "image/gif",
                "bmp" => "image/bmp",
                "tiff" => "image/tiff",
                _ => null
            };
            if (expectedFromContentType != null && !string.Equals(expectedFromContentType, poster.ContentType, StringComparison.OrdinalIgnoreCase))
            {
                err = "Content-Type does not match file content"; return false;
            }

            var ext = Path.GetExtension(poster.FileName)?.TrimStart('.')?.ToLowerInvariant();
            if (!string.IsNullOrEmpty(ext))
            {
                var normalized = ext switch
                {
                    "jpg" or "jpeg" => "jpeg",
                    "png" => "png",
                    "webp" => "webp",
                    "gif" => "gif",
                    "bmp" => "bmp",
                    "tif" or "tiff" => "tiff",
                    _ => ext
                };
                if (!string.Equals(normalized, detected, StringComparison.OrdinalIgnoreCase))
                {
                    err = "File extension does not match file content"; return false;
                }
            }
        }
        catch (Exception ex) when (ex is ArgumentException or FormatException or InvalidOperationException) { err = "Invalid image data"; return false; }
        return true;
    }

    private static string? DetectImageType(byte[] data)
    {
        if (data.Length < 4) return null;
        if (data[0] == 0x89 && data[1] == 0x50 && data[2] == 0x4E && data[3] == 0x47) return "png";
        if (data[0] == 0xFF && data[1] == 0xD8 && data[2] == 0xFF) return "jpeg";
        if (data.Length >= 12 && data[0] == 0x52 && data[1] == 0x49 && data[2] == 0x46 && data[3] == 0x46 && data[8] == 0x57 && data[9] == 0x45 && data[10] == 0x42 && data[11] == 0x50) return "webp";
        if (data[0] == 0x47 && data[1] == 0x49 && data[2] == 0x46 && data[3] == 0x38) return "gif";
        if (data[0] == 0x42 && data[1] == 0x4D) return "bmp";
        if (data.Length >= 4 && ((data[0] == 0x49 && data[1] == 0x49 && data[2] == 0x2A && data[3] == 0x00) || (data[0] == 0x4D && data[1] == 0x4D && data[2] == 0x00 && data[3] == 0x2A))) return "tiff";
        return null;
    }
}
