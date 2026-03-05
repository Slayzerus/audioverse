// DmxEditor.tsx
import React from "react";
import {
    fetchDmxState as getDmxState,
    fetchFtdiDevices as getFtdiDevices,
    postOpenDmxPort as openDmxPort,
    postCloseDmxPort as closeDmxPort,
    postConfigureDmx as configureDmx,
    putDmxChannel as setDmxChannel,
    postBlackout as blackoutDmx,
} from "../../../scripts/api/apiDmx";
import { useTranslation } from 'react-i18next';
import {
    DmxDeviceInfo,
    DmxDeviceChannelInfo,
    FtdiDeviceDto,
    DmxChannelType
} from "../../../models/modelsDmx";
import { DmxChannelControl } from "./DmxChannelControls";
import { logger } from "../../../utils/logger";

const log = logger.scoped('DmxEditor');

const clampByte = (n: number) => Math.max(0, Math.min(255, Math.round(n)));

export default function DmxEditor() {
    const { t } = useTranslation();
    // devices / selection
    const [devices, setDevices] = React.useState<FtdiDeviceDto[]>([]);
    const [selected, setSelected] = React.useState<FtdiDeviceDto | null>(null);

    // stan DMX
    const [values, setValues] = React.useState<number[]>(() => Array(513).fill(0));
    const [fps, setFps] = React.useState<number>(30);
    const [startCode, setStartCode] = React.useState<number>(0);
    const [portOpen, setPortOpen] = React.useState<boolean>(false);
    const pollRef = React.useRef<number | null>(null);

    // init
    React.useEffect(() => {
        (async () => {
            try {
                const devs = await getFtdiDevices();
                setDevices(devs);
                if (devs.length > 0) setSelected(devs[0]);
            } catch (e) {
                log.error('Failed to get FTDI devices', e);
            }
        })();
        return () => {
            if (pollRef.current) window.clearInterval(pollRef.current);
        };
    }, []);

    // polling stanu
    const startPolling = React.useCallback(() => {
        if (pollRef.current) window.clearInterval(pollRef.current);
        pollRef.current = window.setInterval(async () => {
            try {
                const s = await getDmxState();
                if (Array.isArray(s.frontSnapshot) && s.frontSnapshot.length >= 513) {
                    setValues(s.frontSnapshot.slice(0, 513));
                }
                if (typeof s.fps === "number") setFps(s.fps);
                if (typeof s.startCode === "number") setStartCode(s.startCode);
            } catch {
                // ignore polling error (e.g. no open port)
            }
        }, 500);
    }, []);

    React.useEffect(() => {
        startPolling();
    }, [startPolling]);

    // open/close
    const handleOpen = async () => {
        if (!selected) return;
        try {
            // prefer serialNumber; if empty, backend will handle it without the parameter
            await openDmxPort(selected.serialNumber || selected.description);
            setPortOpen(true);
            startPolling();
        } catch (e) {
            log.error('Failed to open DMX port', e);
        }
    };
    const handleClose = async () => {
        try {
            await closeDmxPort();
            setPortOpen(false);
        } catch (e) {
            log.error('Failed to close DMX port', e);
        }
    };

    // apply config
    const handleApplyConfig = async () => {
        await configureDmx(fps, startCode);
    };

    // blackout
    const handleBlackout = async () => {
        await blackoutDmx();
        setValues((prev) => {
            const next = [...prev];
            for (let i = 1; i < next.length; i++) next[i] = 0;
            return next;
        });
    };

    // update channel locally + commit to API
    const handleChange = (ch: number, v: number) => {
        const nv = clampByte(v);
        setValues((prev) => {
            const next = [...prev];
            next[ch] = nv;
            return next;
        });
    };
    const handleCommit = async (ch: number, v: number) => {
        await setDmxChannel(ch, clampByte(v));
    };

    // channels to display – taken from deviceInfo, if present
    const deviceInfo: DmxDeviceInfo | null = selected?.deviceInfo ?? null;
    const channels: DmxDeviceChannelInfo[] = React.useMemo(() => {
        if (deviceInfo?.channels?.length) return deviceInfo.channels;

        return Array.from({ length: 16 }, (_, i): DmxDeviceChannelInfo => ({
            channel: i + 1,
            name: `Channel ${i + 1}`,
            type: DmxChannelType.Dimmer, // <-- zamiast "Dimmer"
            segments: [{ valueFrom: 0, valueTo: 255, name: "Intensity" }],
        }));
    }, [deviceInfo]);

    // appearance
    return (
        <div style={{ padding: 16, display: "grid", gap: 16 }}>
            {/* Header / port control */}
            <section
                style={{
                    display: "grid",
                    gap: 12,
                    gridTemplateColumns: "1fr auto auto auto",
                    alignItems: "end",
                }}
            >
                <div>
                    <label style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>
                        Urządzenie FTDI
                    </label>
                    <select
                        value={selected?.serialNumber || ""}
                        onChange={(e) => {
                            const dev = devices.find((d) => d.serialNumber === e.target.value);
                            setSelected(dev ?? null);
                        }}
                        style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #d1d5db" }}
                    >
                        {devices.map((d) => (
                            <option key={d.serialNumber || d.description} value={d.serialNumber}>
                                {d.deviceInfo?.manufacturer ?? ""} {d.deviceInfo?.model ?? d.description} ({d.serialNumber || d.description})
                            </option>
                        ))}
                    </select>
                    {deviceInfo && (
                        <div style={{ marginTop: 6, fontSize: 12, color: "#6b7280" }}>
                            {t('dmxEditor.mode', 'Mode')}: <b>{deviceInfo.modeName}</b>, footprint: <b>{deviceInfo.footprint}</b>
                        </div>
                    )}
                </div>

                <button
                    onClick={handleOpen}
                    disabled={!selected || portOpen}
                    style={{ padding: "10px 14px", borderRadius: 8, border: "1px solid #10b981", background: "#ecfdf5", cursor: "pointer" }}
                >
                    {t('dmxEditor.openPort', 'Open port')}
                </button>
                <button
                    onClick={handleClose}
                    disabled={!portOpen}
                    style={{ padding: "10px 14px", borderRadius: 8, border: "1px solid #ef4444", background: "#fef2f2", cursor: "pointer" }}
                >
                    {t('dmxEditor.closePort', 'Close port')}
                </button>
                <button
                    onClick={handleBlackout}
                    style={{ padding: "10px 14px", borderRadius: 8, border: "1px solid #4b5563", background: "#f3f4f6", cursor: "pointer" }}
                >
                    Blackout
                </button>
            </section>

            {/* Konfiguracja FPS / StartCode */}
            <section
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(min(160px, 100%), 1fr))",
                    gap: 12,
                    alignItems: "end",
                }}
            >
                <div>
                    <label style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>FPS</label>
                    <input
                        type="number"
                        min={10}
                        max={44}
                        value={fps}
                        onChange={(e) => setFps(Number(e.target.value))}
                        style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #d1d5db" }}
                    />
                </div>
                <div>
                    <label style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>Start Code</label>
                    <input
                        type="number"
                        min={0}
                        max={255}
                        value={startCode}
                        onChange={(e) => setStartCode(clampByte(Number(e.target.value)))}
                        style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #d1d5db" }}
                    />
                </div>
                <div>
                    <button
                        onClick={handleApplyConfig}
                        style={{ padding: "10px 14px", borderRadius: 8, border: "1px solid #3b82f6", background: "#eff6ff", cursor: "pointer" }}
                    >
                        {t('dmxEditor.applyConfig', 'Apply configuration')}
                    </button>
                </div>
            </section>

            {/* Channels */}
            <section>
                <h3 style={{ margin: "8px 0 12px", fontSize: 16 }}>{t('dmxEditor.channels', 'Channels')}</h3>
                <div
                    style={{
                        display: "grid",
                        gap: 12,
                        gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
                    }}
                >
                    {channels.map((ch) => (
                        <DmxChannelControl
                            key={ch.channel}
                            channel={ch}
                            value={values[ch.channel] ?? 0}
                            onChange={(v) => handleChange(ch.channel, v)}
                            onCommit={(v) => handleCommit(ch.channel, v)}
                        />
                    ))}
                </div>
            </section>
        </div>
    );
}
