// src/components/library/LibraryList/UltrastarRowItem.tsx
import * as React from "react";
import type { UltrastarRowItemProps } from "./UltrastarRowItem.types";

/// Single row for an Ultrastar item with title, artist and file path.
export const UltrastarRowItem: React.FC<UltrastarRowItemProps> = ({
                                                                      song: s,
                                                                      checked,
                                                                      onToggle,
                                                                  }) => {
    return (
        <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
            <td style={{ padding: 6, width: 28 }}>
                <input type="checkbox" checked={checked} onChange={onToggle} />
            </td>
            <td style={{ padding: 6 }}>
                <div style={{ fontWeight: 600 }}>{s.title ?? "(brak tytułu)"}</div>
                <div style={{ color: "#64748b", fontSize: 12 }}>{s.artist ?? ""}</div>
            </td>
            <td
                style={{
                    padding: 6,
                    color: "#64748b",
                    fontSize: 12,
                    textAlign: "right",
                }}
            >
                {s.filePath ?? ""}
            </td>
        </tr>
    );
};
