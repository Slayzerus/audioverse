namespace AudioVerse.Application.Models.Utils;

/// <summary>
/// Single frame of a generated motion sequence containing all joint positions at a point in time.
/// </summary>
public record MotionFrame(int FrameIndex, double TimestampSec, IReadOnlyList<MotionJoint> Joints);
