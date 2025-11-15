namespace AudioVerse.Domain.Enums
{
    public enum DmxChannelType
    {
        Unknown = 0,

        // 0..255 płynnie (np. dimmer, kolor)
        Dimmer,

        // 0..9 OFF, 10..255 płynnie
        DimmerWithOff,

        // 0..9 OFF, 10..255 – prędkość rotacji CW
        RotationWithOff,

        // 0..9 OFF, 10..127 – CW, 128..255 – CCW (prędkość)
        RotationWithOffAndCcw,

        // Kanał „opcje/presety” opisany segmentami nazwanymi (Auto/Sound/Programy itd.)
        Options
    }
}
