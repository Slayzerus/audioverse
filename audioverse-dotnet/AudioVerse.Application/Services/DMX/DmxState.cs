namespace AudioVerse.Application.Services.DMX
{
    public sealed class DmxOptions
    {
        public string? DefaultPort { get; set; }
        public int Fps { get; set; } = 30;
        public int UniverseSize { get; set; } = 512; // channels (1..512)
        public bool UseBreak { get; set; } = true;
    }

    /// <summary>
    /// Shared DMX universe (thread-safe). Slot 0 = StartCode (0x00).
    /// </summary>
    public sealed class DmxState
    {
        private readonly object _gate = new();
        private readonly byte[] _universe; // [0]=StartCode, 1..N kanały

        // >>> NOWE: runtime'owe ustawienia
        private volatile int _fps;
        private volatile byte _startCode;

        public DmxState(Microsoft.Extensions.Options.IOptions<DmxOptions> opt)
        {
            var size = Math.Clamp(opt.Value.UniverseSize, 24, 512);
            _universe = new byte[size + 1];

            // startowe wartości z konfiguracji
            _fps = Math.Clamp(opt.Value.Fps, 10, 44); // DMX zwykle 10..44 Hz
            _startCode = 0x00;
            _universe[0] = _startCode;
        }

        // >>> NOWE: właściwości dostępowe
        public int Fps
        {
            get => Volatile.Read(ref _fps);
            set => _fps = Math.Clamp(value, 10, 44);
        }

        public byte StartCode
        {
            get => Volatile.Read(ref _startCode);
            set => _startCode = value;
        }

        public int Channels => _universe.Length - 1;

        public byte[] Snapshot()
        {
            lock (_gate)
            {
                // dopisz aktualny StartCode do slotu 0 przed klonem
                _universe[0] = _startCode;
                return (byte[])_universe.Clone();
            }
        }

        public void SetChannel(int ch, int value)
        {
            if (ch < 1 || ch >= _universe.Length)
                throw new ArgumentOutOfRangeException(nameof(ch));
            var v = (byte)Math.Clamp(value, 0, 255);
            lock (_gate) _universe[ch] = v;
        }

        public void SetMany(Dictionary<int, int> patch)
        {
            lock (_gate)
            {
                foreach (var kv in patch)
                {
                    var ch = kv.Key;
                    if (ch < 1 || ch >= _universe.Length) continue;
                    _universe[ch] = (byte)Math.Clamp(kv.Value, 0, 255);
                }
            }
        }

        // 512 bajtów: kanały 1..512 (slot 0 zostaje StartCode)
        public void LoadUniverse(byte[] payload512)
        {
            if (payload512 is null || payload512.Length != 512)
                throw new ArgumentException("Payload must be exactly 512 bytes.", nameof(payload512));

            lock (_gate)
            {
                // przepisz do _universe od indeksu 1
                Buffer.BlockCopy(payload512, 0, _universe, 1, Math.Min(512, _universe.Length - 1));
            }
        }

        // 513 bajtów: [0]=StartCode, 1..512 kanały
        public void LoadFrame(byte[] frame513)
        {
            if (frame513 is null || frame513.Length != _universe.Length)
                throw new ArgumentException($"Frame must be exactly {_universe.Length} bytes (start code + {Channels}).", nameof(frame513));

            lock (_gate)
            {
                Buffer.BlockCopy(frame513, 0, _universe, 0, _universe.Length);
            }
        }

        // (opcjonalnie) zostaw Twoje dotychczasowe LoadArray(...) dla wstecznej zgodności
        public void LoadArray(byte[] payload) // jak miałeś
        {
            lock (_gate)
            {
                Array.Clear(_universe, 1, _universe.Length - 1);
                if (payload.Length == _universe.Length)        // 513 (ze start code)
                {
                    Array.Copy(payload, 1, _universe, 1, _universe.Length - 1);
                }
                else                                           // 512 (bez start code) lub mniej
                {
                    var n = Math.Min(payload.Length, _universe.Length - 1);
                    Array.Copy(payload, 0, _universe, 1, n);
                }
            }
        }

        public void Blackout()
        {
            lock (_gate)
            {
                Array.Clear(_universe, 1, _universe.Length - 1);
            }
        }

        // >>> dopisz
        public void SwapFront()
        {
            // w wariancie single-buffer to tylko aktualizacja start code
            lock (_gate)
            {
                _universe[0] = _startCode; // jeśli masz właściwość StartCode; w innym razie wpisz 0x00
            }
        }

        // >>> dopisz – bezalokacyjne kopiowanie ramki (513 bajtów)
        public void CopyFrameTo(Span<byte> destination)
        {
            if (destination.Length < _universe.Length)
                throw new ArgumentException($"Destination must be at least {_universe.Length} bytes", nameof(destination));

            lock (_gate)
            {
                _universe[0] = _startCode; // upewnij się, że slot 0 jest aktualny
                new ReadOnlySpan<byte>(_universe).CopyTo(destination);
            }
        }
    }
}
