using System.Runtime.InteropServices;

namespace AudioVerse.Infrastructure.DMX.Ftdi
{
    // Minimalny interfejs natywny FTDI D2XX
    public static class FtdiD2xx
    {
        private const string Dll = "FTD2XX"; // Windows: FTD2XX.dll, Linux: libftd2xx.so, macOS: libftd2xx.dylib

        public enum FtStatus : uint
        {
            FT_OK = 0,
            FT_INVALID_HANDLE,
            FT_DEVICE_NOT_FOUND,
            FT_DEVICE_NOT_OPENED,
            FT_IO_ERROR,
            FT_INSUFFICIENT_RESOURCES,
            FT_INVALID_PARAMETER,
            FT_INVALID_BAUD_RATE,
            FT_DEVICE_NOT_OPENED_FOR_ERASE,
            FT_DEVICE_NOT_OPENED_FOR_WRITE,
            FT_FAILED_TO_WRITE_DEVICE,
            FT_EEPROM_READ_FAILED,
            FT_EEPROM_WRITE_FAILED,
            FT_EEPROM_ERASE_FAILED,
            FT_EEPROM_NOT_PRESENT,
            FT_EEPROM_NOT_PROGRAMMED,
            FT_INVALID_ARGS,
            FT_NOT_SUPPORTED,
            FT_OTHER_ERROR
        }

        [StructLayout(LayoutKind.Sequential)]
        public struct FtDeviceInfo
        {
            public uint Flags;
            public uint Type;
            public uint Id;
            public uint LocId;
            [MarshalAs(UnmanagedType.ByValTStr, SizeConst = 16)] public string SerialNumber;
            [MarshalAs(UnmanagedType.ByValTStr, SizeConst = 64)] public string Description;
            public IntPtr Handle;
        }

        [DllImport(Dll)]
        public static extern FtStatus FT_CreateDeviceInfoList(out uint numDevs);

        [DllImport(Dll)]
        public static extern FtStatus FT_GetDeviceInfoDetail(
            uint index,
            out uint flags,
            out uint type,
            out uint id,
            out uint locId,
            [MarshalAs(UnmanagedType.LPStr)] System.Text.StringBuilder serialNumber,
            [MarshalAs(UnmanagedType.LPStr)] System.Text.StringBuilder description,
            out IntPtr handle);

        [DllImport(Dll)]
        public static extern FtStatus FT_Open(uint index, out IntPtr ftHandle);

        [DllImport(Dll)]
        public static extern FtStatus FT_OpenEx([MarshalAs(UnmanagedType.LPStr)] string serialOrDesc, uint flags, out IntPtr ftHandle);
        public const uint FT_OPEN_BY_SERIAL_NUMBER = 1;
        public const uint FT_OPEN_BY_DESCRIPTION = 2;
        public const uint FT_OPEN_BY_LOCATION = 4;

        [DllImport(Dll)]
        public static extern FtStatus FT_Close(IntPtr ftHandle);

        [DllImport(Dll)]
        public static extern FtStatus FT_ResetDevice(IntPtr ftHandle);

        [DllImport(Dll)]
        public static extern FtStatus FT_SetBaudRate(IntPtr ftHandle, uint baud);

        [DllImport(Dll)]
        public static extern FtStatus FT_SetDataCharacteristics(IntPtr ftHandle, byte wordLength, byte stopBits, byte parity);
        public const byte FT_BITS_8 = 8;
        public const byte FT_STOP_BITS_2 = 2;
        public const byte FT_PARITY_NONE = 0;

        [DllImport(Dll)]
        public static extern FtStatus FT_SetFlowControl(IntPtr ftHandle, ushort flowControl, byte xon, byte xoff);
        public const ushort FT_FLOW_NONE = 0;

        [DllImport(Dll)]
        public static extern FtStatus FT_SetTimeouts(IntPtr ftHandle, uint readMs, uint writeMs);

        [DllImport(Dll)]
        public static extern FtStatus FT_SetLatencyTimer(IntPtr ftHandle, byte latencyMs);

        [DllImport(Dll)]
        public static extern FtStatus FT_SetUSBParameters(IntPtr ftHandle, uint inTransferSize, uint outTransferSize);

        [DllImport(Dll)]
        public static extern FtStatus FT_Purge(IntPtr ftHandle, uint mask);
        public const uint FT_PURGE_RX = 1;
        public const uint FT_PURGE_TX = 2;

        [DllImport(Dll)]
        public static extern FtStatus FT_SetBreakOn(IntPtr ftHandle);

        [DllImport(Dll)]
        public static extern FtStatus FT_SetBreakOff(IntPtr ftHandle);

        [DllImport(Dll)]
        public static extern FtStatus FT_Write(IntPtr ftHandle, byte[] buffer, uint bytesToWrite, out uint bytesWritten);

        public static void Check(FtStatus st, string? ctx = null)
        {
            if (st != FtStatus.FT_OK) throw new InvalidOperationException($"{ctx ?? "FTDI"} failed: {st}");
        }
    }
}
