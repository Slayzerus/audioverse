namespace AudioVerse.Domain.Entities.Audio;

/// <summary>Role of a file within a soundfont package.</summary>
public enum SoundfontFileType
{
    SoundfontBank = 0,
    Readme = 1,
    License = 2,
    PreviewAudio = 3,
    Documentation = 4,
    Thumbnail = 5,
    Other = 99
}
