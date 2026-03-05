namespace AudioVerse.Domain.Entities.Radio
{
    public enum RadioEventType
    {
        Unknown = 0,
        Join = 10,
        Leave = 20,
        NowPlaying = 30,
        Seek = 40,
        Heartbeat = 50,
        PlayCompleted = 60
    }
}
