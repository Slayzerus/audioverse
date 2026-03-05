namespace AudioVerse.Application.Models.Utils
{
    public record Pose3DKeypoint(
        string Name,
        double X,
        double Y,
        double Z,
        double Confidence);
}
