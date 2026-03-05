namespace AudioVerse.Application.Models.Utils
{
    public record Pose3DResult(
        string Model,
        int FrameCount,
        IReadOnlyList<IReadOnlyList<Pose3DKeypoint>> Frames);
}
