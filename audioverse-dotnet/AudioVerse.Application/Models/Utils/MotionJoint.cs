namespace AudioVerse.Application.Models.Utils;

/// <summary>
/// Single 3D joint position within one frame of a generated motion sequence.
/// </summary>
public record MotionJoint(string Name, double X, double Y, double Z);
