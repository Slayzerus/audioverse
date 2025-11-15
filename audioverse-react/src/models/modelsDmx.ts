// ==== DTO z /api/dmx/state ====
export interface DmxStateDto {
    fps: number;            // 10..44
    startCode: number;      // 0..255
    frontSnapshot: number[]; // 513 liczb (0=start code, 1..512 kanały)
}

// ==== Enum typów kanałów (zgodny z backendem) ====
export enum DmxChannelType {
    Unknown = "Unknown",
    Dimmer = "Dimmer",
    DimmerWithOff = "DimmerWithOff",
    RotationWithOff = "RotationWithOff",
    RotationWithOffAndCcw = "RotationWithOffAndCcw",
    Options = "Options",
}

// ==== Segment kanału (zakres wartości) ====
export interface DmxChannelSegment {
    valueFrom: number; // 0..255
    valueTo: number;   // 0..255
    name: string;
    notes?: string;
    isOff?: boolean;
}

// ==== Opis pojedynczego kanału ====
export interface DmxDeviceChannelInfo {
    channel: number;          // 1..512
    name: string;
    group?: string;
    type: DmxChannelType;
    segments: DmxChannelSegment[];
    defaultValue?: number;
    inverted?: boolean;
}

// ==== Opis fixture’a ====
export interface DmxDeviceInfo {
    manufacturer: string;
    model: string;
    version?: string | null;
    modeName: string;     // np. "17ch"
    footprint: number;    // liczba kanałów
    channels: DmxDeviceChannelInfo[];
}

// ==== DTO z /api/dmx/devices (rozszerzone o DmxDeviceInfo) ====
export interface FtdiDeviceDto {
    serialNumber: string;
    description: string;
    locId: number;
    deviceInfo: DmxDeviceInfo; // dostarczany przez Twój handler
}