import React from "react";
import { useTranslation } from "react-i18next";
import {
  type ArpConfig,
  type ArpRate,
  DEFAULT_ARP_CONFIG,
  getArpModes,
  getArpRates,
} from "../../../../utils/arpeggiator";

interface Props {
  config: ArpConfig;
  onChange: (config: ArpConfig) => void;
  /** Whether the arpeggiator is currently active */
  active: boolean;
  onToggleActive: () => void;
}

const ArpeggiatorPanel: React.FC<Props> = ({ config, onChange, active, onToggleActive }) => {
  const { t } = useTranslation();
  const modes = getArpModes();
  const rates = getArpRates();

  const update = (partial: Partial<ArpConfig>) => onChange({ ...config, ...partial });

  return (
    <div className="card p-3 mb-3" style={{ background: "#0d1117", color: "#e6edf3", borderRadius: 8, opacity: active ? 1 : 0.6 }}>
      <div className="d-flex align-items-center gap-2 mb-2">
        <h6 className="mb-0" style={{ color: "#58a6ff" }}>
          {t("arp.title", "Arpeggiator")}
        </h6>
        <button
          className={`btn btn-sm ${active ? "btn-success" : "btn-outline-secondary"}`}
          onClick={onToggleActive}
        >
          {active ? "ON" : "OFF"}
        </button>
        <button
          className={`btn btn-sm ${config.latch ? "btn-warning" : "btn-outline-secondary"}`}
          onClick={() => update({ latch: !config.latch })}
          title="Latch — keep arp running after releasing keys"
        >
          Latch
        </button>
        <button
          className="btn btn-sm btn-outline-secondary"
          onClick={() => onChange(DEFAULT_ARP_CONFIG)}
          title="Reset to defaults"
        >
          Reset
        </button>
      </div>

      <div className="row g-2">
        {/* Mode */}
        <div className="col-12">
          <label style={{ fontSize: 12 }} className="mb-1">
            {t("arp.mode", "Mode")}
          </label>
          <div className="btn-group btn-group-sm w-100">
            {modes.map(m => (
              <button
                key={m.mode}
                className={`btn ${config.mode === m.mode ? "btn-primary" : "btn-outline-secondary"}`}
                onClick={() => update({ mode: m.mode })}
                title={m.description}
                style={{ fontSize: 11 }}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Rate */}
        <div className="col-6">
          <label style={{ fontSize: 12 }} className="mb-1">
            {t("arp.rate", "Rate")}
          </label>
          <select
            className="form-select form-select-sm"
            style={{ background: "#161b22", color: "#e6edf3", border: "1px solid #30363d" }}
            value={config.rate}
            onChange={e => update({ rate: e.target.value as ArpRate })}
          >
            {rates.map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>

        {/* Octaves */}
        <div className="col-6">
          <label style={{ fontSize: 12 }} className="mb-1">
            {t("arp.octaves", "Octaves")}: {config.octaves}
          </label>
          <input
            type="range"
            className="form-range"
            min={1}
            max={4}
            step={1}
            value={config.octaves}
            onChange={e => update({ octaves: Number(e.target.value) })}
          />
        </div>

        {/* Gate */}
        <div className="col-6">
          <label style={{ fontSize: 12 }} className="mb-1">
            {t("arp.gate", "Gate")}: {Math.round(config.gate * 100)}%
          </label>
          <input
            type="range"
            className="form-range"
            min={0.05}
            max={1}
            step={0.05}
            value={config.gate}
            onChange={e => update({ gate: Number(e.target.value) })}
          />
        </div>

        {/* Swing */}
        <div className="col-6">
          <label style={{ fontSize: 12 }} className="mb-1">
            {t("arp.swing", "Swing")}: {Math.round(config.swing * 100)}%
          </label>
          <input
            type="range"
            className="form-range"
            min={0}
            max={1}
            step={0.01}
            value={config.swing}
            onChange={e => update({ swing: Number(e.target.value) })}
          />
        </div>

        {/* Repeats */}
        <div className="col-6">
          <label style={{ fontSize: 12 }} className="mb-1">
            {t("arp.repeats", "Repeats")}: {config.repeats}
          </label>
          <input
            type="range"
            className="form-range"
            min={1}
            max={4}
            step={1}
            value={config.repeats}
            onChange={e => update({ repeats: Number(e.target.value) })}
          />
        </div>
      </div>
    </div>
  );
};

export default ArpeggiatorPanel;
