/**
 * ModelEditorLeftPanel — outliner / scene hierarchy panel.
 */
import React from "react";
import styles from "./ModelEditor.module.css";
import type { ModelEditorAPI } from "./useModelEditor";
import type { SceneNode } from "./modelEditorTypes";

interface Props {
  api: ModelEditorAPI;
}

const ModelEditorLeftPanel: React.FC<Props> = React.memo(({ api }) => {
  const {
    sceneTree,
    selectedId,
    outlinerSearch,
    setOutlinerSearch,
    selectObject,
    rebuildTree,
    toggleNodeExpanded,
    toggleNodeVisibility,
  } = api;

  const renderTreeNode = (node: SceneNode, depth: number): React.ReactNode => {
    // Outliner search filter
    if (outlinerSearch) {
      const q = outlinerSearch.toLowerCase();
      const match = node.name.toLowerCase().includes(q);
      const childMatch = node.children.some(function cm(c: SceneNode): boolean {
        return c.name.toLowerCase().includes(q) || c.children.some(cm);
      });
      if (!match && !childMatch) return null;
    }

    const hasChildren = node.children.length > 0;
    const icon =
      node.type === "mesh"   ? "◆" :
      node.type === "bone"   ? "🦴" :
      node.type === "light"  ? "💡" :
      node.type === "camera" ? "📷" :
      node.type === "helper" ? "◇" : "📁";

    return (
      <React.Fragment key={node.id}>
        <div
          className={`${styles.treeItem} ${selectedId === node.id ? styles.treeItemActive : ""}`}
          style={{ paddingLeft: depth * 16 + 4 }}
          onClick={() => selectObject(node)}
        >
          {hasChildren ? (
            <span
              className={styles.treeToggle}
              onClick={(e) => {
                e.stopPropagation();
                toggleNodeExpanded(node);
              }}
            >
              {node.expanded ? "▼" : "▶"}
            </span>
          ) : (
            <span className={styles.treeToggle} />
          )}
          <span className={styles.treeIcon}>{icon}</span>
          <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis" }}>
            {node.name}
          </span>
          <span
            className={styles.treeVisibility}
            onClick={(e) => {
              e.stopPropagation();
              toggleNodeVisibility(node);
            }}
          >
            {node.visible ? "👁" : "◌"}
          </span>
        </div>
        {node.expanded &&
          node.children.map((c) => renderTreeNode(c, depth + 1))}
      </React.Fragment>
    );
  };

  return (
    <div className={styles.leftPanel}>
      <div className={styles.panelSection}>
        <div className={styles.panelTitle}>
          📋 Outliner
          <button onClick={rebuildTree} title="Refresh" aria-label="Refresh outliner">⟳</button>
        </div>
        {/* Search / filter */}
        <div className={styles.outlinerSearch}>
          <input
            className={styles.propInput}
            placeholder="🔍 Filter..."
            value={outlinerSearch}
            onChange={(e) => setOutlinerSearch(e.target.value)}
            style={{ width: "100%", marginBottom: 4 }}
          />
        </div>
        <div className={styles.panelContent} style={{ overflowY: "auto", flex: 1 }}>
          {sceneTree.length === 0 && (
            <div style={{ color: "#666", fontSize: 10, padding: "8px 0" }}>
              Drop a 3D file to begin
            </div>
          )}
          {sceneTree.map((n) => renderTreeNode(n, 0))}
        </div>
      </div>
    </div>
  );
});

ModelEditorLeftPanel.displayName = "ModelEditorLeftPanel";
export default ModelEditorLeftPanel;
