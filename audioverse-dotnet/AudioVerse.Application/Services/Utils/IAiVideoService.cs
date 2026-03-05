using AudioVerse.Application.Models.Utils;

namespace AudioVerse.Application.Services.Utils
{
    public interface IAiVideoService
    {
        Task<PoseDetectionResult?> DetectPoseAsync(Stream image, string engine = "mediapipe", CancellationToken ct = default);
        Task<PoseDetectionResult?> DetectPoseVideoAsync(Stream video, string engine = "mediapipe", CancellationToken ct = default);
        Task<Pose3DResult?> DetectPose3DAsync(Stream video, CancellationToken ct = default);
    }
}
