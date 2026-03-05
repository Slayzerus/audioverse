import React from "react";

interface SectionPanelProps {
    sectionName: string;
    setSectionName: (v: string) => void;
    sectionOrder: string;
    setSectionOrder: (v: string) => void;
    handleSaveSection: () => void;
}

export const SectionPanel: React.FC<SectionPanelProps> = ({
    sectionName,
    setSectionName,
    sectionOrder,
    setSectionOrder,
    handleSaveSection,
}) => (
    <div className="card p-3 mb-3" style={{ maxWidth: 520 }}>
        <h6 className="mb-2">Section</h6>
        <div className="mb-2">
            <label className="form-label">Name</label>
            <input className="form-control" value={sectionName} onChange={(e) => setSectionName(e.target.value)} />
        </div>
        <div className="mb-2">
            <label className="form-label">Order</label>
            <input className="form-control" type="number" value={sectionOrder} onChange={(e) => setSectionOrder(e.target.value)} />
        </div>
        <button className="btn btn-secondary" onClick={handleSaveSection}>
            Save section (PUT)
        </button>
    </div>
);
