namespace AudioVerse.API.Models.Requests.Dmx;

/// <summary>Request to configure DMX interface settings.</summary>
public sealed record ConfigReq(int Fps, byte StartCode);
