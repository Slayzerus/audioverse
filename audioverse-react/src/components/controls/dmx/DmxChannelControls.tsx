import React, { useMemo, useState } from "react";
import { useTranslation } from 'react-i18next';
import {
    DmxChannelType,
    DmxDeviceChannelInfo,
    DmxChannelSegment,
} from "../../../models/modelsDmx";

// ---------- helpers ----------
const OFF_MATCH = ["off", "no function", "brak"];

const hasOff = (ch: DmxDeviceChannelInfo) =>
    ch.segments.some(
        s => s.isOff || OFF_MATCH.some(m => s.name.toLowerCase().includes(m))
    );

const offSegment = (ch: DmxDeviceChannelInfo) =>
    ch.segments.find(
        s => s.isOff || OFF_MATCH.some(m => s.name.toLowerCase().includes(m))
    );

const midOf = (seg: DmxChannelSegment) =>
    Math.floor((seg.valueFrom + seg.valueTo) / 2);

const offValue = (ch: DmxDeviceChannelInfo) => offSegment(ch) ? midOf(offSegment(ch)!) : 0;

const resolveSegment = (ch: DmxDeviceChannelInfo, v: number) =>
    ch.segments.find(s => v >= s.valueFrom && v <= s.valueTo);

// ---------- common pieces ----------
type BaseProps = {
    channel: DmxDeviceChannelInfo;
    value: number;               // 0..255
    onChange: (val: number) => void;   // live change
    onCommit?: (val: number) => void;  // mouse up / blur
};

const NumberClamp = (n: number, min = 0, max = 255) =>
    Math.max(min, Math.min(max, Math.round(n)));

const Field = ({ children }: { children: React.ReactNode }) => (
    <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: 12 }}>
        {children}
    </div>
);

const Label = ({ title, extra }: { title: string; extra?: React.ReactNode }) => (
    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <strong>{title}</strong>
        {extra}
    </div>
);

// ---------- Dimmer/Rotation ----------
export const DmxSliderControl: React.FC<BaseProps & { showDirectionHint?: boolean }> = ({
                                                                                            channel, value, onChange, onCommit, showDirectionHint
                                                                                        }) => {
    const { t } = useTranslation();
    const [local, setLocal] = useState(NumberClamp(value));
    const seg = useMemo(() => resolveSegment(channel, local), [channel, local]);

    // sync external changes
    React.useEffect(() => setLocal(NumberClamp(value)), [value]);

    const commit = (val: number) => {
        const v = NumberClamp(val);
        setLocal(v);
        onChange(v);
        onCommit?.(v);
    };

    const offBtn = hasOff(channel) ? (
        <button
            type="button"
            onClick={() => commit(offValue(channel))}
            style={{
                width: "100%", marginTop: 8, padding: "6px 10px",
                borderRadius: 6, border: "1px solid #d1d5db", background: "#f9fafb", cursor: "pointer"
            }}
            title={t('dmxChannel.turnOffChannel', 'Turn off channel (set OFF range)')}
        >
            OFF
        </button>
    ) : null;

    const hint = showDirectionHint && seg ? (
        <span style={{ fontSize: 12, color: "#6b7280" }}>{seg.name}</span>
    ) : null;

    return (
        <Field>
            <Label title={`${channel.channel}. ${channel.name}`} extra={hint} />
            <input
                type="range"
                min={0}
                max={255}
                value={local}
                onChange={e => {
                    const v = NumberClamp(Number(e.target.value));
                    setLocal(v);
                    onChange(v);
                }}
                onMouseUp={() => onCommit?.(local)}
                onTouchEnd={() => onCommit?.(local)}
                style={{ width: "100%" }}
            />
            <div style={{ marginTop: 6 }}>
                <input
                    type="number"
                    min={0}
                    max={255}
                    value={local}
                    onChange={e => {
                        const v = NumberClamp(Number(e.target.value));
                        setLocal(v);
                        onChange(v);
                    }}
                    onBlur={() => onCommit?.(local)}
                    style={{ width: 80, padding: 6, border: "1px solid #d1d5db", borderRadius: 6 }}
                />
            </div>
            {offBtn}
        </Field>
    );
};

// ---------- Options (lista przycisków) ----------
export const DmxOptionsControl: React.FC<BaseProps> = ({
                                                           channel, value, onChange, onCommit
                                                       }) => {
    // Sort: OFF first, rest by name
    const segments = useMemo(() => {
        const segs = [...channel.segments];
        segs.sort((a, b) => {
            const ao = (a.isOff ? -1 : 0) + (OFF_MATCH.some(m => a.name.toLowerCase().includes(m)) ? -1 : 0);
            const bo = (b.isOff ? -1 : 0) + (OFF_MATCH.some(m => b.name.toLowerCase().includes(m)) ? -1 : 0);
            if (ao !== bo) return ao - bo;
            return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
        });
        return segs;
    }, [channel]);

    const current = resolveSegment(channel, value);
    const commit = (seg: DmxChannelSegment) => {
        const v = midOf(seg);
        onChange(v);
        onCommit?.(v);
    };

    return (
        <Field>
            <Label title={`${channel.channel}. ${channel.name}`} />
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
                    gap: 8,
                    maxHeight: 220,
                    overflowY: "auto",
                    paddingRight: 2,
                }}
            >
                {segments.map((seg, idx) => {
                    const selected = current && value >= seg.valueFrom && value <= seg.valueTo;
                    return (
                        <button
                            key={`${seg.name}-${idx}`}
                            type="button"
                            onClick={() => commit(seg)}
                            style={{
                                padding: "8px 10px",
                                borderRadius: 8,
                                border: selected ? "2px solid #2563eb" : "1px solid #d1d5db",
                                background: selected ? "#eff6ff" : "#fff",
                                textAlign: "left",
                                cursor: "pointer",
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                            }}
                            title={`${seg.name} [${seg.valueFrom}..${seg.valueTo}]`}
                        >
                            {seg.name}
                        </button>
                    );
                })}
            </div>
        </Field>
    );
};

// ---------- Wrapper: wybiera kontrolkę po typie ----------
export const DmxChannelControl: React.FC<BaseProps> = (props) => {
    const { channel } = props;
    switch (channel.type) {
        case DmxChannelType.Dimmer:
        case DmxChannelType.DimmerWithOff:
            return <DmxSliderControl {...props} />;

        case DmxChannelType.RotationWithOff:
        case DmxChannelType.RotationWithOffAndCcw:
            return <DmxSliderControl {...props} showDirectionHint />;

        case DmxChannelType.Options:
            return <DmxOptionsControl {...props} />;

        default:
            return <DmxSliderControl {...props} />;
    }
};
