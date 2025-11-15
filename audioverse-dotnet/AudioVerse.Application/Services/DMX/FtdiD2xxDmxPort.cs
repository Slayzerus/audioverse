using AudioVerse.Infrastructure.DMX.Ftdi;
using static AudioVerse.Infrastructure.DMX.Ftdi.FtdiD2xx;

namespace AudioVerse.Application.Services.DMX
{
    // Implementacja DMX na FTDI D2XX (Open DMX style)
    public sealed class FtdiD2xxDmxPort : IDmxPort
    {
        private IntPtr _handle = IntPtr.Zero;
        private bool _isOpen;
        private uint _fps = 30;
        private byte _startCode = 0x00;
        private byte[] _txBuf = new byte[513]; // stały bufor TX dla DMX

        public bool IsOpen => _isOpen;
        public string? DeviceId { get; private set; }

        public void Open(string? serialOrDescription = null)
        {
            if (_isOpen) return;

            if (!string.IsNullOrWhiteSpace(serialOrDescription))
            {
                Check(FT_OpenEx(serialOrDescription, FT_OPEN_BY_SERIAL_NUMBER | FT_OPEN_BY_DESCRIPTION, out _handle), "FT_OpenEx");
                DeviceId = serialOrDescription;
            }
            else
            {
                Check(FT_Open(0, out _handle), "FT_Open(0)"); // pierwszy device
                DeviceId = "Index0";
            }

            // 250000 8N2, brak flow control; opóźnienia i bufory USB zmniejszamy
            Check(FT_ResetDevice(_handle), "FT_ResetDevice");
            Check(FT_SetBaudRate(_handle, 250000), "FT_SetBaudRate");
            Check(FT_SetDataCharacteristics(_handle, FT_BITS_8, FT_STOP_BITS_2, FT_PARITY_NONE), "FT_SetDataCharacteristics");
            Check(FT_SetFlowControl(_handle, FT_FLOW_NONE, 0, 0), "FT_SetFlowControl");
            Check(FT_SetTimeouts(_handle, 0, 0), "FT_SetTimeouts");
            Check(FT_Purge(_handle, FT_PURGE_RX | FT_PURGE_TX), "FT_Purge");
            Check(FT_SetLatencyTimer(_handle, 1), "FT_SetLatencyTimer");               // niskie opóźnienie
            Check(FT_SetUSBParameters(_handle, 65536, 65536), "FT_SetUSBParameters"); // duże bufory

            _isOpen = true;
        }

        public void Configure(uint fps = 30, byte startCode = 0x00)
        {
            _fps = Math.Clamp(fps, 10u, 44u);
            _startCode = startCode;
        }

        public void SendFrame(ReadOnlySpan<byte> frame)
        {
            if (!_isOpen) throw new InvalidOperationException("Port not open.");
            if (frame.Length != 513) throw new ArgumentException("DMX frame must be 513 bytes.");

            // BREAK + MAB
            Check(FT_SetBreakOn(_handle), "FT_SetBreakOn");
            Thread.Sleep(1);
            Check(FT_SetBreakOff(_handle), "FT_SetBreakOff");
            Thread.Sleep(1);

            // skopiuj span -> byte[] i wyślij bez unsafe
            frame.CopyTo(_txBuf);

            uint written;
            Check(FtdiD2xx.FT_Write(_handle, _txBuf, (uint)_txBuf.Length, out written), "FT_Write");
            if (written != _txBuf.Length)
                throw new InvalidOperationException($"FT_Write short write: {written}/{_txBuf.Length}");
        }

        public void Close()
        {
            if (!_isOpen) return;
            FT_Close(_handle);
            _handle = IntPtr.Zero;
            _isOpen = false;
        }

        public void Dispose() => Close();
    }
}
