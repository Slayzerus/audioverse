using System.IO.Ports;


namespace AudioVerse.Application.Services.DMX
{
    public sealed class DmxPort : IDisposable
    {
        private readonly object _gate = new();
        private SerialPort? _port;
        private bool _disposed;

        public bool IsOpen => _port?.IsOpen == true;
        public string? PortName => _port?.PortName;

        public static string[] ListPorts() => SerialPort.GetPortNames();

        public void Open(string portName)
        {
            lock (_gate)
            {
                Close();
                _port = new SerialPort(portName, 250000, Parity.None, 8, StopBits.Two)
                {
                    Handshake = Handshake.None,
                    ReadTimeout = 100,
                    WriteTimeout = 100,
                    DtrEnable = true,
                    RtsEnable = true
                };
                _port.Open();
            }
        }

        public void Close()
        {
            lock (_gate)
            {
                if (_port != null)
                {
                    try { _port.DiscardOutBuffer(); } catch { }
                    try { _port.Close(); } catch { }
                    _port.Dispose();
                    _port = null;
                }
            }
        }

        public void WriteFrame(ReadOnlySpan<byte> frame, bool useBreak)
        {
            SerialPort? p;
            lock (_gate) p = _port;
            if (p is null || !p.IsOpen) return;

            try
            {
                if (useBreak)
                {
                    p.BreakState = true;
                    Thread.Sleep(1);   // ≥ 88 µs
                    p.BreakState = false;
                    Thread.Sleep(1);   // ≥ 8 µs
                }

                // ← to działa w .NET 6+ (Stream ma Write(ReadOnlySpan<byte>))
                p.BaseStream.Write(frame);
            }
            catch (Exception)
            {
                // log/ignore
            }
        }

        public void Dispose()
        {
            if (_disposed) return;
            _disposed = true;
            Close();
        }
    }
}
