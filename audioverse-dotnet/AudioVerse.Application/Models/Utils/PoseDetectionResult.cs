namespace AudioVerse.Application.Models.Utils
{
    public record PoseDetectionResult(string Model, int Width, int Height, IReadOnlyList<IReadOnlyList<PoseKeypoint>> Persons);
}
