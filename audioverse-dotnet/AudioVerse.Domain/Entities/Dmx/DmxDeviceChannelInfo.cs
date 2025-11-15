using AudioVerse.Domain.Enums;
using System.Text.Json.Serialization;

namespace AudioVerse.Domain.Entities.Dmx
{
    public sealed class DmxDeviceChannelInfo
    {
        /// <summary>Numer kanału DMX (1..512)</summary>
        public int Channel { get; init; }

        /// <summary>Nazwa/funkcja kanału (np. „Derby speed”, „Wash R”)</summary>
        public string Name { get; init; } = "";

        /// <summary>Grupa/sekcja oprawy (np. „Derby”, „Kula”, „Laser”, „Wash”)</summary>
        public string? Group { get; init; }

        public DmxChannelType Type { get; init; } = DmxChannelType.Unknown;

        /// <summary>Lista segmentów wartości (zakresów) – dla dimmera zwykle 0..255 jeden segment</summary>
        public List<DmxChannelSegment> Segments { get; init; } = new();

        /// <summary>Wartość domyślna kanału (opcjonalnie)</summary>
        public byte? DefaultValue { get; init; }

        /// <summary>Czy wartości są odwrócone (255=off) – rzadkie przypadki</summary>
        public bool Inverted { get; init; }

        [JsonIgnore]
        public bool IsValid =>
            Channel is >= 1 and <= 512 &&
            Segments.TrueForAll(s =>
                s.ValueFrom is >= 0 and <= 255 &&
                s.ValueTo is >= 0 and <= 255 &&
                s.ValueFrom <= s.ValueTo &&
                !string.IsNullOrWhiteSpace(s.Name));

        public DmxChannelSegment? Resolve(byte value) => Segments.FirstOrDefault(s => s.Contains(value));        
    }
}
