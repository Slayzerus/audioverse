import React from 'react';

const PageSpinner: React.FC = React.memo(function PageSpinner() {
  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "60vh" }}>
      <div className="spinner-border text-primary" role="status">
        <span className="visually-hidden">Loading…</span>
      </div>
    </div>
  );
});
PageSpinner.displayName = "PageSpinner";

export default PageSpinner;
