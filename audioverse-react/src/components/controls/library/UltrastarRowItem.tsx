// src/components/library/LibraryList/UltrastarRowItem.tsx
import * as React from "react";
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import type { UltrastarRowItemProps } from "./UltrastarRowItem.types";

/// Single row for an Ultrastar item with title, artist and file path.
export const UltrastarRowItem: React.FC<UltrastarRowItemProps> = ({
                                                                      song: s,
                                                                      checked,
                                                                      onToggle,
                                                                  }) => {
    const { t } = useTranslation();
    return (
        <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
            <td style={{ padding: 6, width: 28 }}>
                <input type="checkbox" checked={checked} onChange={onToggle} aria-label={`${t('common.select', 'Select')} ${s.title ?? t('common.noTitle', '(no title)')}`} />
            </td>
            <td style={{ padding: 6 }}>
                <div style={{ fontWeight: 600 }}>{s.title ?? t('common.noTitle', '(no title)')}</div>
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
            <td style={{ padding: 6, textAlign: 'center' }}>
                {s.id != null && (
                    <Link to={`/karaoke-editor/${s.id}`} style={{ color: '#3b82f6', textDecoration: 'none', fontSize: 13 }} title={t('ultrastarRow.editInKaraokeEditor', 'Edit in Karaoke Editor')}>
                        ✏️
                    </Link>
                )}
            </td>
        </tr>
    );
};
