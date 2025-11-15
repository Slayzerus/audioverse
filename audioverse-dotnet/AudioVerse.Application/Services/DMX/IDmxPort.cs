namespace AudioVerse.Application.Services.DMX
{
    public interface IDmxPort : IDisposable
    {
        bool IsOpen { get; }
        string? DeviceId { get; } // np. Serial/Description/LocId
        void Open(string? serialOrDescription = null);
        void Close();

        // Ustawienia
        void Configure(uint fps = 30, byte startCode = 0x00);

        // Niskopoziomowo: wyślij pojedynczą ramkę DMX (StartCode + 512)
        void SendFrame(ReadOnlySpan<byte> frame);
    }
}
