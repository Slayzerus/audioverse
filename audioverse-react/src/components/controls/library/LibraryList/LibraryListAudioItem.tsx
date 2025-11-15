// src/components/library/LibraryList/AudioRowItem.tsx
import * as React from "react";
import type { LibraryListAudioItemProps } from "./LibraryListAudioItem.types.tsx";

/// Single row for an audio record with cover, title, artists and format.
export const AudioRowItem: React.FC<LibraryListAudioItemProps> = ({
                                                              record: r,
                                                              checked,
                                                              onToggle,
                                                          }) => {
    return (
        <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
            <td style={{ padding: 6, width: 28 }}>
                <input type="checkbox" checked={checked} onChange={onToggle} />
            </td>
            <td style={{ padding: 6, width: 44 }}>
                {r.albumDetails?.coverUrl ? (
                    <img
                        alt=""
                        src={r.albumDetails.coverUrl}
                        style={{
                            width: 36,
                            height: 36,
                            objectFit: "cover",
                            borderRadius: 6,
                        }}
                    />
                ) : (
                    <div
                        style={{ width: 36, height: 36, borderRadius: 6, background: "#e2e8f0" }}
                    />
                )}
            </td>
            <td style={{ padding: 6 }}>
                <div style={{ fontWeight: 600 }}>{r.title}</div>
                <div style={{ color: "#64748b", fontSize: 12 }}>
                    {(r.artists ?? []).join(", ")}
                </div>
            </td>
            <td
                style={{
                    padding: 6,
                    color: "#64748b",
                    fontSize: 12,
                    textAlign: "right",
                }}
            >
                {r.bitsPerSample
                    ? `${Math.round(r.sampleRateHz / 1000)} kHz / ${r.bitsPerSample}-bit`
                    : r.codecDescription}
            </td>
        </tr>
    );
};
