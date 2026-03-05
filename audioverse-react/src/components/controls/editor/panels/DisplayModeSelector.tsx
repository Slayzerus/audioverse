import React from 'react';
import {
    EditorDisplayMode,
    DISPLAY_MODES,
    DISPLAY_MODE_ORDER,
} from '../editorDisplayModes';

interface DisplayModeSelectorProps {
    mode: EditorDisplayMode;
    onChange: (mode: EditorDisplayMode) => void;
}

/**
 * Compact display-mode selector for the AudioEditor sidebar.
 * Shows 5 progressive levels: Fun → Beginner → Mid → Expert → Master.
 */
const DisplayModeSelectorInner: React.FC<DisplayModeSelectorProps> = ({ mode, onChange }) => (
    <div className="card p-2 mb-3" style={{ maxWidth: 520 }}>
        <div className="d-flex align-items-center gap-2 flex-wrap">
            <span style={{ fontSize: 12, fontWeight: 600, color: '#555' }}>Tryb:</span>
            {DISPLAY_MODE_ORDER.map((m) => {
                const cfg = DISPLAY_MODES[m];
                const isActive = m === mode;
                return (
                    <button
                        key={m}
                        className={`btn btn-sm ${isActive ? 'btn-primary' : 'btn-outline-secondary'}`}
                        style={{ fontSize: 11, padding: '2px 8px' }}
                        title={cfg.description}
                        onClick={() => onChange(m)}
                    >
                        {cfg.label}
                    </button>
                );
            })}
        </div>
        <div style={{ fontSize: 11, color: '#888', marginTop: 4 }}>
            {DISPLAY_MODES[mode].description}
        </div>
    </div>
);

export const DisplayModeSelector = React.memo(DisplayModeSelectorInner);
