using AudioVerse.Domain.Enums;

namespace AudioVerse.Domain.Entities.Dmx
{
    public sealed class DmxDeviceInfo
    {
        public string Manufacturer { get; init; } = "";
        public string Model { get; init; } = "";
        public string? Version { get; init; }
        public string ModeName { get; init; } = "";     // np. „17ch”
        public int Footprint { get; init; }           // liczba kanałów zajętych (np. 17)
        public List<DmxDeviceChannelInfo> Channels { get; init; } = new();

        public DmxDeviceChannelInfo? Channel(int ch) => Channels.FirstOrDefault(c => c.Channel == ch);

        public bool IsValid =>
            !string.IsNullOrWhiteSpace(Manufacturer) &&
            !string.IsNullOrWhiteSpace(Model) &&
            Footprint > 0 &&
            Channels.Count == Footprint &&
            Channels.All(c => c.IsValid);

        public static DmxDeviceInfo Light4MeEventIvV2_17ch =>
            new()
            {
                Manufacturer = "LIGHT4ME",
                Model = "Event IV V2",
                Version = null,
                ModeName = "17ch",
                Footprint = 17,
                Channels = new()
                {
                    new DmxDeviceChannelInfo {
                        Channel = 1, Group = "Derby", Name = "Derby Speed", Type = DmxChannelType.RotationWithOff,
                        Segments = {
                            new() { ValueFrom = 0,  ValueTo = 9,   Name = "Off", IsOff = true },
                            new() { ValueFrom = 10, ValueTo = 255, Name = "CW speed" }
                        }
                    },
                    new DmxDeviceChannelInfo {
                        Channel = 2, Group = "Disco Ball", Name = "Ball Rotation", Type = DmxChannelType.RotationWithOffAndCcw,
                        Segments = {
                            new() { ValueFrom = 0,  ValueTo = 9,   Name = "Off", IsOff = true },
                            new() { ValueFrom = 10, ValueTo = 127, Name = "CW speed" },
                            new() { ValueFrom = 128,ValueTo = 255, Name = "CCW speed" }
                        }
                    },
                    new DmxDeviceChannelInfo {
                        Channel = 3, Group = "Laser", Name = "Laser Rotation", Type = DmxChannelType.RotationWithOffAndCcw,
                        Segments = {
                            new() { ValueFrom = 0,  ValueTo = 9,   Name = "Off", IsOff = true },
                            new() { ValueFrom = 10, ValueTo = 127, Name = "CW speed" },
                            new() { ValueFrom = 128,ValueTo = 255, Name = "CCW speed" }
                        }
                    },
                    new DmxDeviceChannelInfo {
                        Channel = 4, Group = "Strobe", Name = "Strobe", Type = DmxChannelType.DimmerWithOff,
                        Segments = {
                            new() { ValueFrom = 0,  ValueTo = 9,   Name = "Off", IsOff = true },
                            new() { ValueFrom = 10, ValueTo = 255, Name = "Strobe slow → fast" }
                        }
                    },
                    new DmxDeviceChannelInfo {
                        Channel = 5, Group = "Derby", Name = "Derby R/Y", Type = DmxChannelType.Dimmer,
                        Segments = { new() { ValueFrom = 0, ValueTo = 255, Name = "Intensity" } }
                    },
                    new DmxDeviceChannelInfo {
                        Channel = 6, Group = "Derby", Name = "Derby G/P", Type = DmxChannelType.Dimmer,
                        Segments = { new() { ValueFrom = 0, ValueTo = 255, Name = "Intensity" } }
                    },
                    new DmxDeviceChannelInfo {
                        Channel = 7, Group = "Derby", Name = "Derby B/W", Type = DmxChannelType.Dimmer,
                        Segments = { new() { ValueFrom = 0, ValueTo = 255, Name = "Intensity" } }
                    },
                    new DmxDeviceChannelInfo {
                        Channel = 8, Group = "Ball", Name = "Ball R/Y", Type = DmxChannelType.Dimmer,
                        Segments = { new() { ValueFrom = 0, ValueTo = 255, Name = "Intensity" } }
                    },
                    new DmxDeviceChannelInfo {
                        Channel = 9, Group = "Ball", Name = "Ball G/P", Type = DmxChannelType.Dimmer,
                        Segments = { new() { ValueFrom = 0, ValueTo = 255, Name = "Intensity" } }
                    },
                    new DmxDeviceChannelInfo {
                        Channel = 10, Group = "Ball", Name = "Ball B/W", Type = DmxChannelType.Dimmer,
                        Segments = { new() { ValueFrom = 0, ValueTo = 255, Name = "Intensity" } }
                    },
                    new DmxDeviceChannelInfo {
                        Channel = 11, Group = "Laser", Name = "Laser Red", Type = DmxChannelType.DimmerWithOff,
                        Segments = {
                            new() { ValueFrom = 0,  ValueTo = 9,   Name = "Off", IsOff = true },
                            new() { ValueFrom = 10, ValueTo = 255, Name = "Intensity" }
                        }
                    },
                    new DmxDeviceChannelInfo {
                        Channel = 12, Group = "Laser", Name = "Laser Green", Type = DmxChannelType.DimmerWithOff,
                        Segments = {
                            new() { ValueFrom = 0,  ValueTo = 9,   Name = "Off", IsOff = true },
                            new() { ValueFrom = 10, ValueTo = 255, Name = "Intensity" }
                        }
                    },
                    new DmxDeviceChannelInfo {
                        Channel = 13, Group = "Wash", Name = "Wash R", Type = DmxChannelType.Dimmer,
                        Segments = { new() { ValueFrom = 0, ValueTo = 255, Name = "Intensity" } }
                    },
                    new DmxDeviceChannelInfo {
                        Channel = 14, Group = "Wash", Name = "Wash G", Type = DmxChannelType.Dimmer,
                        Segments = { new() { ValueFrom = 0, ValueTo = 255, Name = "Intensity" } }
                    },
                    new DmxDeviceChannelInfo {
                        Channel = 15, Group = "Wash", Name = "Wash B", Type = DmxChannelType.Dimmer,
                        Segments = { new() { ValueFrom = 0, ValueTo = 255, Name = "Intensity" } }
                    },
                    new DmxDeviceChannelInfo {
                        Channel = 16, Group = "Wash", Name = "Wash Y/Amber", Type = DmxChannelType.Dimmer,
                        Segments = { new() { ValueFrom = 0, ValueTo = 255, Name = "Intensity" } }
                    },
                    new DmxDeviceChannelInfo {
                        Channel = 17, Group = "Programs", Name = "Auto / Sound / Presets", Type = DmxChannelType.Options,
                        Segments = {
                            new() { ValueFrom = 0,   ValueTo = 9,   Name = "No function", IsOff = true },
                            new() { ValueFrom = 10,  ValueTo = 99,  Name = "Auto" },
                            new() { ValueFrom = 100, ValueTo = 129, Name = "Sound P1" },
                            new() { ValueFrom = 130, ValueTo = 159, Name = "Sound P2" },
                            new() { ValueFrom = 160, ValueTo = 189, Name = "Sound P3" },
                            new() { ValueFrom = 190, ValueTo = 219, Name = "Sound P4" },
                            new() { ValueFrom = 220, ValueTo = 255, Name = "Sound P5" },
                        }
                    }
                }
            };
    }
}
