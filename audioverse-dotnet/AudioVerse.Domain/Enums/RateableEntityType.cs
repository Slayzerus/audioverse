namespace AudioVerse.Domain.Enums;

/// <summary>
/// Target entity type for universal ratings, tags, and comments.
/// Used as discriminator in polymorphic UserRating / UserTag / UserComment tables.
/// </summary>
public enum RateableEntityType
{
    AvGame = 0,
    KaraokeSong = 1,
    RadioStation = 2,
    Event = 3,
    Movie = 4,
    Series = 5,
    Album = 6,
    Artist = 7,
    Playlist = 8,
    BoardGame = 9,
    VideoGame = 10,
    VendorProfile = 11,
    WikiPage = 12,
    MediaItem = 13,
    Other = 99
}
