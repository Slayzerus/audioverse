namespace AudioVerse.Domain.Entities.Dmx
{
    /// <summary>
    /// Named DMX channel value range within a device (e.g., color segment 0-127).
    /// </summary>
    public sealed class DmxChannelSegment
    {
        public int ValueFrom { get; init; }  // 0..255
        public int ValueTo { get; init; }  // 0..255
        public string Name { get; init; } = "";
        public string? Notes { get; init; }
        public bool IsOff { get; init; } = false;

        public bool Contains(byte v) => v >= ValueFrom && v <= ValueTo;

        public override string ToString() => $"{Name} [{ValueFrom}..{ValueTo}]";
    }
}
