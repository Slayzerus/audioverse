namespace AudioVerse.Application.Models.Utils
{
    public record VadSegment(
        decimal StartMs,
        decimal EndMs,
        decimal Confidence);
}
