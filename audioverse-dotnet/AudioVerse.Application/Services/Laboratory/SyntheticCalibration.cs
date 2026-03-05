namespace AudioVerse.Application.Services.Laboratory;

/// <summary>
/// Generates a synthetic calibration WAV file with stepped sine waves at known
/// frequencies and a corresponding ground-truth pitch reference array.
/// Used to evaluate absolute accuracy of each pitch detection algorithm.
/// </summary>
public static class SyntheticCalibration
{
    public const string FileName = "_calibration_tone.wav";
    private const int SampleRate = 16000;
    private const int BitsPerSample = 16;

    /// <summary>
    /// Frequency steps covering the typical singing range (~200–550 Hz).
    /// Each step is 0.5 s, total 3 s.
    /// </summary>
    private static readonly (double FreqHz, double DurationSec)[] Steps =
    [
        (220.00, 0.5),  // A3
        (329.63, 0.5),  // E4
        (440.00, 0.5),  // A4
        (523.25, 0.5),  // C5
        (349.23, 0.5),  // F4
        (261.63, 0.5),  // C4
    ];

    /// <summary>
    /// Generate calibration WAV audio and a reference pitch array (ground truth).
    /// </summary>
    /// <returns>
    /// <c>WavBytes</c> — 16-bit PCM mono WAV at 16 kHz;
    /// <c>ReferenceHz</c> — expected F0 at 10 ms hop intervals;
    /// <c>HopSec</c> — hop size in seconds (0.01).
    /// </returns>
    public static (byte[] WavBytes, double[] ReferenceHz, double HopSec) Generate()
    {
        const double hopSec = 0.01;

        var totalDuration = Steps.Sum(s => s.DurationSec);
        var totalSamples = (int)(totalDuration * SampleRate);
        var samples = new short[totalSamples];

        var idx = 0;
        var phase = 0.0;
        foreach (var (freq, dur) in Steps)
        {
            var count = (int)(dur * SampleRate);
            for (var i = 0; i < count && idx < totalSamples; i++, idx++)
            {
                samples[idx] = (short)(Math.Sin(phase) * 28000);
                phase += 2.0 * Math.PI * freq / SampleRate;
            }
        }

        var wavBytes = EncodeWav(samples);

        var refCount = (int)(totalDuration / hopSec);
        var refHz = new double[refCount];
        for (var i = 0; i < refCount; i++)
        {
            var t = i * hopSec;
            var elapsed = 0.0;
            foreach (var (freq, dur) in Steps)
            {
                if (t < elapsed + dur)
                {
                    refHz[i] = freq;
                    break;
                }
                elapsed += dur;
            }
        }

        return (wavBytes, refHz, hopSec);
    }

    private static byte[] EncodeWav(short[] samples)
    {
        var dataSize = samples.Length * 2;
        using var ms = new MemoryStream(44 + dataSize);
        using var bw = new BinaryWriter(ms);

        bw.Write("RIFF"u8);
        bw.Write(44 + dataSize - 8);
        bw.Write("WAVE"u8);

        bw.Write("fmt "u8);
        bw.Write(16);
        bw.Write((short)1);
        bw.Write((short)1);
        bw.Write(SampleRate);
        bw.Write(SampleRate * BitsPerSample / 8);
        bw.Write((short)(BitsPerSample / 8));
        bw.Write((short)BitsPerSample);

        bw.Write("data"u8);
        bw.Write(dataSize);
        foreach (var s in samples)
            bw.Write(s);

        return ms.ToArray();
    }
}
