using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Drawing.Processing;
using SixLabors.ImageSharp.PixelFormats;
using SixLabors.ImageSharp.Processing;
using SixLabors.ImageSharp.Processing.Processors.Transforms;

namespace AudioVerse.Infrastructure.Storage;

/// <summary>
/// Image filter engine with dozens of effects — from pixel-art to cinematic looks.
/// All filters are pure managed C# via ImageSharp, no native dependencies.
/// </summary>
public static class ImageFilterEngine
{
    /// <summary>All available filter names.</summary>
    public static IReadOnlyList<FilterInfo> AvailableFilters { get; } = BuildFilterList();

    /// <summary>Apply a named filter to image bytes. Returns PNG.</summary>
    public static byte[] Apply(byte[] imageBytes, string filterName, int outputSize = 256)
    {
        using var image = Image.Load<Rgba32>(imageBytes);
        CropToSquare(image);
        image.Mutate(ctx => ctx.Resize(outputSize, outputSize));

        var filter = filterName.ToLowerInvariant();
        ApplyFilter(image, filter);

        using var ms = new MemoryStream();
        image.SaveAsPng(ms);
        return ms.ToArray();
    }

    /// <summary>Generate a preview sheet — small thumbnails of all filters.</summary>
    public static byte[] GeneratePreviewSheet(byte[] imageBytes, int thumbSize = 64, int columns = 8)
    {
        var filters = AvailableFilters;
        var rows = (int)Math.Ceiling(filters.Count / (double)columns);
        var sheetW = columns * thumbSize;
        var sheetH = rows * thumbSize;

        using var sheet = new Image<Rgba32>(sheetW, sheetH, new Rgba32(30, 30, 30));
        using var source = Image.Load<Rgba32>(imageBytes);
        CropToSquare(source);
        source.Mutate(ctx => ctx.Resize(thumbSize, thumbSize));

        for (int i = 0; i < filters.Count; i++)
        {
            var thumb = source.Clone();
            ApplyFilter(thumb, filters[i].Name);
            var x = (i % columns) * thumbSize;
            var y = (i / columns) * thumbSize;
            sheet.Mutate(ctx => ctx.DrawImage(thumb, new Point(x, y), 1f));
        }

        using var ms = new MemoryStream();
        sheet.SaveAsPng(ms);
        return ms.ToArray();
    }

    private static void CropToSquare(Image<Rgba32> image)
    {
        var min = Math.Min(image.Width, image.Height);
        var x = (image.Width - min) / 2;
        var y = (image.Height - min) / 2;
        image.Mutate(ctx => ctx.Crop(new Rectangle(x, y, min, min)));
    }

    private static void ApplyFilter(Image<Rgba32> image, string filter)
    {
        switch (filter)
        {
            // ── Pixel art ──
            case "pixelart":
                Pixelate(image, 32);
                break;
            case "pixelart-fine":
                Pixelate(image, 48);
                break;
            case "pixelart-coarse":
                Pixelate(image, 16);
                break;
            case "pixelart-tiny":
                Pixelate(image, 8);
                break;

            // ── Classic photo filters ──
            case "grayscale":
                image.Mutate(ctx => ctx.Grayscale());
                break;
            case "sepia":
                image.Mutate(ctx => ctx.Sepia());
                break;
            case "invert":
                image.Mutate(ctx => ctx.Invert());
                break;
            case "polaroid":
                image.Mutate(ctx => ctx.Sepia(0.3f).Brightness(1.1f).Contrast(0.9f).Saturate(0.8f));
                break;

            // ── Brightness / Contrast ──
            case "bright":
                image.Mutate(ctx => ctx.Brightness(1.3f));
                break;
            case "dark":
                image.Mutate(ctx => ctx.Brightness(0.6f));
                break;
            case "high-contrast":
                image.Mutate(ctx => ctx.Contrast(1.5f));
                break;
            case "low-contrast":
                image.Mutate(ctx => ctx.Contrast(0.5f));
                break;

            // ── Color manipulation ──
            case "saturated":
                image.Mutate(ctx => ctx.Saturate(2.0f));
                break;
            case "desaturated":
                image.Mutate(ctx => ctx.Saturate(0.3f));
                break;
            case "warm":
                image.Mutate(ctx => ctx.Hue(15).Saturate(1.2f).Brightness(1.05f));
                break;
            case "cool":
                image.Mutate(ctx => ctx.Hue(-15).Saturate(0.9f));
                break;
            case "hue-shift-90":
                image.Mutate(ctx => ctx.Hue(90));
                break;
            case "hue-shift-180":
                image.Mutate(ctx => ctx.Hue(180));
                break;
            case "hue-shift-270":
                image.Mutate(ctx => ctx.Hue(270));
                break;

            // ── Blur / Sharpen ──
            case "blur":
                image.Mutate(ctx => ctx.GaussianBlur(5));
                break;
            case "blur-heavy":
                image.Mutate(ctx => ctx.GaussianBlur(15));
                break;
            case "sharpen":
                image.Mutate(ctx => ctx.GaussianSharpen(3));
                break;

            // ── Glow / Bloom ──
            case "glow":
                image.Mutate(ctx => ctx.GaussianBlur(3).Brightness(1.2f).Saturate(1.3f));
                break;
            case "soft-glow":
                image.Mutate(ctx => ctx.GaussianBlur(2).Brightness(1.1f));
                break;

            // ── Cinematic / Film looks ──
            case "cinema":
                image.Mutate(ctx => ctx.Contrast(1.2f).Saturate(0.8f).Brightness(0.95f));
                break;
            case "noir":
                image.Mutate(ctx => ctx.Grayscale().Contrast(1.6f).Brightness(0.9f));
                break;
            case "vintage":
                image.Mutate(ctx => ctx.Sepia(0.4f).Contrast(1.1f).Saturate(0.7f));
                break;
            case "retro":
                image.Mutate(ctx => ctx.Saturate(0.6f).Contrast(1.3f).Hue(10));
                break;
            case "faded":
                image.Mutate(ctx => ctx.Saturate(0.5f).Brightness(1.15f).Contrast(0.85f));
                break;
            case "bleach":
                image.Mutate(ctx => ctx.Saturate(0.3f).Contrast(1.4f).Brightness(1.1f));
                break;
            case "cross-process":
                image.Mutate(ctx => ctx.Saturate(1.8f).Contrast(1.3f).Hue(30));
                break;
            case "lomo":
                image.Mutate(ctx => ctx.Saturate(1.5f).Contrast(1.4f).Brightness(0.9f).Vignette());
                break;

            // ── Vignette / Focus ──
            case "vignette":
                image.Mutate(ctx => ctx.Vignette());
                break;
            case "vignette-heavy":
                image.Mutate(ctx => ctx.Vignette(new Rgba32(0, 0, 0)));
                break;

            // ── Tint / Color overlays ──
            case "tint-red":
                ApplyTint(image, new Rgba32(255, 0, 0, 40));
                break;
            case "tint-blue":
                ApplyTint(image, new Rgba32(0, 0, 255, 40));
                break;
            case "tint-green":
                ApplyTint(image, new Rgba32(0, 255, 0, 40));
                break;
            case "tint-gold":
                ApplyTint(image, new Rgba32(255, 200, 0, 50));
                break;
            case "tint-purple":
                ApplyTint(image, new Rgba32(128, 0, 255, 40));
                break;
            case "tint-cyan":
                ApplyTint(image, new Rgba32(0, 255, 255, 40));
                break;
            case "tint-pink":
                ApplyTint(image, new Rgba32(255, 105, 180, 40));
                break;
            case "tint-orange":
                ApplyTint(image, new Rgba32(255, 140, 0, 40));
                break;

            // ── Duotone ──
            case "duotone-blue":
                image.Mutate(ctx => ctx.Grayscale());
                ApplyTint(image, new Rgba32(0, 80, 200, 80));
                break;
            case "duotone-red":
                image.Mutate(ctx => ctx.Grayscale());
                ApplyTint(image, new Rgba32(200, 30, 30, 80));
                break;
            case "duotone-green":
                image.Mutate(ctx => ctx.Grayscale());
                ApplyTint(image, new Rgba32(30, 180, 30, 80));
                break;
            case "duotone-purple":
                image.Mutate(ctx => ctx.Grayscale());
                ApplyTint(image, new Rgba32(120, 20, 200, 80));
                break;
            case "duotone-amber":
                image.Mutate(ctx => ctx.Grayscale());
                ApplyTint(image, new Rgba32(255, 180, 0, 80));
                break;

            // ── Pixel art + color combos ──
            case "pixelart-grayscale":
                image.Mutate(ctx => ctx.Grayscale());
                Pixelate(image, 32);
                break;
            case "pixelart-sepia":
                image.Mutate(ctx => ctx.Sepia());
                Pixelate(image, 32);
                break;
            case "pixelart-neon":
                image.Mutate(ctx => ctx.Saturate(2.5f).Contrast(1.5f).Brightness(1.2f));
                Pixelate(image, 32);
                break;
            case "pixelart-noir":
                image.Mutate(ctx => ctx.Grayscale().Contrast(1.6f));
                Pixelate(image, 32);
                break;
            case "pixelart-warm":
                image.Mutate(ctx => ctx.Hue(15).Saturate(1.3f));
                Pixelate(image, 32);
                break;
            case "pixelart-cool":
                image.Mutate(ctx => ctx.Hue(-20).Saturate(0.8f));
                Pixelate(image, 32);
                break;
            case "pixelart-invert":
                image.Mutate(ctx => ctx.Invert());
                Pixelate(image, 32);
                break;
            case "pixelart-lomo":
                image.Mutate(ctx => ctx.Saturate(1.5f).Contrast(1.4f).Brightness(0.9f));
                Pixelate(image, 24);
                break;

            // ── Posterize / Threshold ──
            case "posterize":
                Posterize(image, 4);
                break;
            case "posterize-fine":
                Posterize(image, 6);
                break;
            case "posterize-coarse":
                Posterize(image, 3);
                break;
            case "threshold":
                image.Mutate(ctx => ctx.BinaryThreshold(0.5f));
                break;
            case "threshold-low":
                image.Mutate(ctx => ctx.BinaryThreshold(0.3f));
                break;
            case "threshold-high":
                image.Mutate(ctx => ctx.BinaryThreshold(0.7f));
                break;

            // ── Emboss / Edge detection ──
            case "edge-detect":
                image.Mutate(ctx => ctx.DetectEdges());
                break;
            case "edge-detect-invert":
                image.Mutate(ctx => ctx.DetectEdges().Invert());
                break;

            // ── Comic / Pop art ──
            case "comic":
                Posterize(image, 5);
                image.Mutate(ctx => ctx.Saturate(1.8f).Contrast(1.3f));
                break;
            case "pop-art":
                Posterize(image, 4);
                image.Mutate(ctx => ctx.Saturate(2.5f).Contrast(1.5f));
                break;

            // ── Sketch ──
            case "sketch":
                image.Mutate(ctx => ctx.Grayscale().DetectEdges().Invert());
                break;
            case "sketch-color":
                image.Mutate(ctx => ctx.DetectEdges().Invert().Saturate(1.5f));
                break;

            // ── Glitch / Distortion ──
            case "channel-shift":
                ChannelShift(image, 5);
                break;
            case "channel-shift-heavy":
                ChannelShift(image, 12);
                break;
            case "scanlines":
                ApplyScanlines(image, 2);
                break;
            case "scanlines-heavy":
                ApplyScanlines(image, 4);
                break;

            // ── Combo effects ──
            case "neon":
                image.Mutate(ctx => ctx.Saturate(2.5f).Contrast(1.5f).Brightness(1.2f));
                break;
            case "neon-glow":
                image.Mutate(ctx => ctx.Saturate(2.5f).Contrast(1.3f).GaussianBlur(2).Brightness(1.3f));
                break;
            case "cyberpunk":
                image.Mutate(ctx => ctx.Saturate(2.0f).Contrast(1.4f).Hue(-20));
                ApplyTint(image, new Rgba32(255, 0, 128, 30));
                break;
            case "synthwave":
                image.Mutate(ctx => ctx.Saturate(1.8f).Contrast(1.3f).Hue(280));
                ApplyTint(image, new Rgba32(80, 0, 200, 30));
                break;
            case "vaporwave":
                image.Mutate(ctx => ctx.Saturate(1.5f).Hue(200).Contrast(0.9f));
                ApplyTint(image, new Rgba32(255, 100, 200, 30));
                break;
            case "thermal":
                image.Mutate(ctx => ctx.Grayscale().Saturate(0f));
                ApplyThermalMap(image);
                break;
            case "night-vision":
                image.Mutate(ctx => ctx.Grayscale().Brightness(1.3f).Contrast(1.2f));
                ApplyTint(image, new Rgba32(0, 255, 0, 60));
                ApplyScanlines(image, 2);
                break;
            case "xray":
                image.Mutate(ctx => ctx.Grayscale().Invert().Contrast(1.4f));
                ApplyTint(image, new Rgba32(100, 150, 255, 30));
                break;
            case "frozen":
                image.Mutate(ctx => ctx.Saturate(0.4f).Brightness(1.15f).Hue(-10));
                ApplyTint(image, new Rgba32(150, 200, 255, 40));
                break;
            case "fire":
                image.Mutate(ctx => ctx.Saturate(2.0f).Contrast(1.3f));
                ApplyTint(image, new Rgba32(255, 80, 0, 50));
                break;
            case "acid":
                image.Mutate(ctx => ctx.Saturate(3.0f).Hue(120).Contrast(1.5f));
                break;
            case "dreamy":
                image.Mutate(ctx => ctx.GaussianBlur(3).Brightness(1.15f).Saturate(1.3f).Contrast(0.9f));
                break;
            case "moonlight":
                image.Mutate(ctx => ctx.Saturate(0.3f).Brightness(0.8f));
                ApplyTint(image, new Rgba32(80, 100, 200, 40));
                break;
            case "sunset":
                image.Mutate(ctx => ctx.Saturate(1.4f).Brightness(1.05f));
                ApplyTint(image, new Rgba32(255, 120, 50, 35));
                break;
            case "matrix":
                image.Mutate(ctx => ctx.Grayscale().Contrast(1.5f));
                ApplyTint(image, new Rgba32(0, 255, 0, 50));
                ApplyScanlines(image, 3);
                break;

            default:
                break; // no-op: return original
        }
    }

    private static void Pixelate(Image<Rgba32> image, int gridSize)
    {
        var w = image.Width;
        var h = image.Height;
        image.Mutate(ctx => ctx.Resize(new ResizeOptions
        {
            Size = new Size(gridSize, gridSize),
            Sampler = KnownResamplers.NearestNeighbor,
            Mode = ResizeMode.Stretch
        }));
        image.Mutate(ctx => ctx.Resize(new ResizeOptions
        {
            Size = new Size(w, h),
            Sampler = KnownResamplers.NearestNeighbor,
            Mode = ResizeMode.Stretch
        }));
    }

    private static void Posterize(Image<Rgba32> image, int levels)
    {
        var step = 255f / (levels - 1);
        image.ProcessPixelRows(accessor =>
        {
            for (int y = 0; y < accessor.Height; y++)
            {
                var row = accessor.GetRowSpan(y);
                for (int x = 0; x < row.Length; x++)
                {
                    ref var pixel = ref row[x];
                    pixel.R = (byte)(MathF.Round(pixel.R / step) * step);
                    pixel.G = (byte)(MathF.Round(pixel.G / step) * step);
                    pixel.B = (byte)(MathF.Round(pixel.B / step) * step);
                }
            }
        });
    }

    private static void ApplyTint(Image<Rgba32> image, Rgba32 tint)
    {
        using var overlay = new Image<Rgba32>(image.Width, image.Height, tint);
        image.Mutate(ctx => ctx.DrawImage(overlay, PixelColorBlendingMode.Normal, 1f));
    }

    private static void ChannelShift(Image<Rgba32> image, int offset)
    {
        var clone = image.Clone();
        image.ProcessPixelRows(clone, (target, source) =>
        {
            for (int y = 0; y < target.Height; y++)
            {
                var dst = target.GetRowSpan(y);
                var src = source.GetRowSpan(y);
                for (int x = 0; x < dst.Length; x++)
                {
                    var srcX = Math.Clamp(x + offset, 0, dst.Length - 1);
                    dst[x].R = src[srcX].R;
                    // G stays from original position, B shifts the other way
                    var srcX2 = Math.Clamp(x - offset, 0, dst.Length - 1);
                    dst[x].B = src[srcX2].B;
                }
            }
        });
    }

    private static void ApplyScanlines(Image<Rgba32> image, int lineWidth)
    {
        image.ProcessPixelRows(accessor =>
        {
            for (int y = 0; y < accessor.Height; y++)
            {
                if ((y / lineWidth) % 2 == 1)
                {
                    var row = accessor.GetRowSpan(y);
                    for (int x = 0; x < row.Length; x++)
                    {
                        ref var pixel = ref row[x];
                        pixel.R = (byte)(pixel.R * 0.6f);
                        pixel.G = (byte)(pixel.G * 0.6f);
                        pixel.B = (byte)(pixel.B * 0.6f);
                    }
                }
            }
        });
    }

    private static void ApplyThermalMap(Image<Rgba32> image)
    {
        image.ProcessPixelRows(accessor =>
        {
            for (int y = 0; y < accessor.Height; y++)
            {
                var row = accessor.GetRowSpan(y);
                for (int x = 0; x < row.Length; x++)
                {
                    ref var pixel = ref row[x];
                    var intensity = pixel.R / 255f;
                    // Cold (blue) → warm (red) gradient
                    pixel.R = (byte)(intensity * 255);
                    pixel.G = (byte)(MathF.Sin(intensity * MathF.PI) * 200);
                    pixel.B = (byte)((1f - intensity) * 255);
                }
            }
        });
    }

    private static IReadOnlyList<FilterInfo> BuildFilterList() =>
    [
        // Pixel art
        new("pixelart", "Pixel Art", "pixel-art"),
        new("pixelart-fine", "Pixel Art Fine", "pixel-art"),
        new("pixelart-coarse", "Pixel Art Coarse", "pixel-art"),
        new("pixelart-tiny", "Pixel Art Tiny", "pixel-art"),
        new("pixelart-grayscale", "Pixel Art B&W", "pixel-art"),
        new("pixelart-sepia", "Pixel Art Sepia", "pixel-art"),
        new("pixelart-neon", "Pixel Art Neon", "pixel-art"),
        new("pixelart-noir", "Pixel Art Noir", "pixel-art"),
        new("pixelart-warm", "Pixel Art Warm", "pixel-art"),
        new("pixelart-cool", "Pixel Art Cool", "pixel-art"),
        new("pixelart-invert", "Pixel Art Invert", "pixel-art"),
        new("pixelart-lomo", "Pixel Art Lomo", "pixel-art"),

        // Classic
        new("grayscale", "Grayscale", "classic"),
        new("sepia", "Sepia", "classic"),
        new("invert", "Invert", "classic"),
        new("polaroid", "Polaroid", "classic"),

        // Brightness / Contrast
        new("bright", "Bright", "adjust"),
        new("dark", "Dark", "adjust"),
        new("high-contrast", "High Contrast", "adjust"),
        new("low-contrast", "Low Contrast", "adjust"),

        // Color
        new("saturated", "Saturated", "color"),
        new("desaturated", "Desaturated", "color"),
        new("warm", "Warm", "color"),
        new("cool", "Cool", "color"),
        new("hue-shift-90", "Hue +90°", "color"),
        new("hue-shift-180", "Hue +180°", "color"),
        new("hue-shift-270", "Hue +270°", "color"),

        // Blur / Sharpen
        new("blur", "Blur", "blur"),
        new("blur-heavy", "Heavy Blur", "blur"),
        new("sharpen", "Sharpen", "blur"),
        new("glow", "Glow", "blur"),
        new("soft-glow", "Soft Glow", "blur"),

        // Cinematic
        new("cinema", "Cinema", "cinematic"),
        new("noir", "Noir", "cinematic"),
        new("vintage", "Vintage", "cinematic"),
        new("retro", "Retro", "cinematic"),
        new("faded", "Faded", "cinematic"),
        new("bleach", "Bleach Bypass", "cinematic"),
        new("cross-process", "Cross Process", "cinematic"),
        new("lomo", "Lomo", "cinematic"),

        // Vignette
        new("vignette", "Vignette", "vignette"),
        new("vignette-heavy", "Heavy Vignette", "vignette"),

        // Tints
        new("tint-red", "Red Tint", "tint"),
        new("tint-blue", "Blue Tint", "tint"),
        new("tint-green", "Green Tint", "tint"),
        new("tint-gold", "Gold Tint", "tint"),
        new("tint-purple", "Purple Tint", "tint"),
        new("tint-cyan", "Cyan Tint", "tint"),
        new("tint-pink", "Pink Tint", "tint"),
        new("tint-orange", "Orange Tint", "tint"),

        // Duotone
        new("duotone-blue", "Duotone Blue", "duotone"),
        new("duotone-red", "Duotone Red", "duotone"),
        new("duotone-green", "Duotone Green", "duotone"),
        new("duotone-purple", "Duotone Purple", "duotone"),
        new("duotone-amber", "Duotone Amber", "duotone"),

        // Posterize / Threshold
        new("posterize", "Posterize", "stylize"),
        new("posterize-fine", "Posterize Fine", "stylize"),
        new("posterize-coarse", "Posterize Coarse", "stylize"),
        new("threshold", "Threshold", "stylize"),
        new("threshold-low", "Threshold Low", "stylize"),
        new("threshold-high", "Threshold High", "stylize"),

        // Edge / Sketch
        new("edge-detect", "Edge Detect", "sketch"),
        new("edge-detect-invert", "Edge Detect Invert", "sketch"),
        new("sketch", "Sketch", "sketch"),
        new("sketch-color", "Color Sketch", "sketch"),
        new("comic", "Comic", "sketch"),
        new("pop-art", "Pop Art", "sketch"),

        // Glitch
        new("channel-shift", "Channel Shift", "glitch"),
        new("channel-shift-heavy", "Heavy Channel Shift", "glitch"),
        new("scanlines", "Scanlines", "glitch"),
        new("scanlines-heavy", "Heavy Scanlines", "glitch"),

        // Special
        new("neon", "Neon", "special"),
        new("neon-glow", "Neon Glow", "special"),
        new("cyberpunk", "Cyberpunk", "special"),
        new("synthwave", "Synthwave", "special"),
        new("vaporwave", "Vaporwave", "special"),
        new("thermal", "Thermal", "special"),
        new("night-vision", "Night Vision", "special"),
        new("xray", "X-Ray", "special"),
        new("frozen", "Frozen", "special"),
        new("fire", "Fire", "special"),
        new("acid", "Acid", "special"),
        new("dreamy", "Dreamy", "special"),
        new("moonlight", "Moonlight", "special"),
        new("sunset", "Sunset", "special"),
        new("matrix", "Matrix", "special"),
    ];
}

/// <summary>Describes an available image filter.</summary>
public record FilterInfo(string Name, string DisplayName, string Category);
