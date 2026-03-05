/**
 * ModelEditorRightPanel — properties panel with Object, Material,
 * World, Modifiers, and Physics tabs.
 */
import React from "react";
import * as THREE from "three";
import styles from "./ModelEditor.module.css";
import type { ModelEditorAPI } from "./useModelEditor";
import type { PropTab } from "./modelEditorTypes";
import { DEG } from "./modelEditorTypes";
import { Vec3Row, Vec3RowDeg, MaterialCard } from "./ModelEditorSubComponents";

interface Props {
  api: ModelEditorAPI;
}

const ModelEditorRightPanel: React.FC<Props> = React.memo(({ api }) => {
  const {
    propTab, setPropTab,
    selectedNode,
    selectedMaterials,
    selMaterialIdx, setSelMaterialIdx,
    setMatRefresh,
    rebuildTree,
    aiBusy, aiStatus,
    rootObjectRef,
    videoInputRef,
    bgColor, setBgColor,
    fogEnabled, setFogEnabled,
    fogColor, setFogColor,
    fogNear, setFogNear,
    fogFar, setFogFar,
    showLightHelpers, setShowLightHelpers,
    showGrid, setShowGrid,
    showAxes, setShowAxes,
    showSkeleton, setShowSkeleton,
    snapEnabled, setSnapEnabled,
    snapGrid, setSnapGrid,
    setStatusText,
  } = api;

  return (
    <div className={styles.rightPanel}>
      {/* Property tabs */}
      <div className={styles.propTabs}>
        {(["object", "material", "world", "modifiers", "physics"] as PropTab[]).map(
          (t) => (
            <button
              key={t}
              className={`${styles.propTabBtn} ${propTab === t ? styles.propTabBtnActive : ""}`}
              onClick={() => setPropTab(t)}
              title={t.charAt(0).toUpperCase() + t.slice(1)}
            >
              {t === "object" ? "🔧" : t === "material" ? "🎨" : t === "world" ? "🌍" : t === "modifiers" ? "🔩" : "⚡"}
            </button>
          ),
        )}
      </div>

      {/* ── Object tab ── */}
      {propTab === "object" && (
        <>
          <div className={styles.panelSection}>
            <div className={styles.panelTitle}>🔧 Transform</div>
            <div className={styles.panelContent}>
              {selectedNode ? (
                <>
                  <div className={styles.propRow}>
                    <span className={styles.propLabel}>Name</span>
                    <input
                      className={styles.propInput}
                      value={selectedNode.name}
                      onChange={(e) => {
                        selectedNode.object.name = e.target.value;
                        rebuildTree();
                      }}
                    />
                  </div>
                  <div className={styles.propRow}>
                    <span className={styles.propLabel}>Type</span>
                    <span style={{ fontSize: 10, color: "#888" }}>{selectedNode.type}</span>
                  </div>
                  <Vec3Row
                    label="Position"
                    value={selectedNode.object.position}
                    onChange={() => setMatRefresh((n) => n + 1)}
                  />
                  <Vec3RowDeg
                    label="Rotation"
                    value={selectedNode.object.rotation}
                    onChange={() => setMatRefresh((n) => n + 1)}
                  />
                  <Vec3Row
                    label="Scale"
                    value={selectedNode.object.scale}
                    onChange={() => setMatRefresh((n) => n + 1)}
                  />
                </>
              ) : (
                <div style={{ color: "#666", fontSize: 10 }}>
                  Select an object
                </div>
              )}
            </div>
          </div>

          {/* Light properties */}
          {selectedNode && selectedNode.object instanceof THREE.Light && (
            <div className={styles.panelSection}>
              <div className={styles.panelTitle}>💡 Light</div>
              <div className={styles.panelContent}>
                <div className={styles.propRow}>
                  <span className={styles.propLabel}>Color</span>
                  <div
                    className={styles.propColorSwatch}
                    style={{ background: `#${(selectedNode.object as THREE.Light).color.getHexString()}` }}
                  >
                    <input
                      type="color"
                      value={`#${(selectedNode.object as THREE.Light).color.getHexString()}`}
                      onChange={(e) => {
                        (selectedNode.object as THREE.Light).color.set(e.target.value);
                        setMatRefresh((n) => n + 1);
                      }}
                    />
                  </div>
                </div>
                <div className={styles.propRow}>
                  <span className={styles.propLabel}>Intensity</span>
                  <input
                    type="range"
                    min={0}
                    max={10}
                    step={0.1}
                    value={(selectedNode.object as THREE.Light).intensity}
                    onChange={(e) => {
                      (selectedNode.object as THREE.Light).intensity = parseFloat(e.target.value);
                      setMatRefresh((n) => n + 1);
                    }}
                    style={{ flex: 1, accentColor: "#5566cc" }}
                  />
                  <span style={{ fontSize: 9, color: "#888", width: 28, textAlign: "right" }}>
                    {(selectedNode.object as THREE.Light).intensity.toFixed(1)}
                  </span>
                </div>
                {"castShadow" in selectedNode.object && (
                  <div className={styles.propRow}>
                    <span className={styles.propLabel}>Shadow</span>
                    <input
                      type="checkbox"
                      checked={selectedNode.object.castShadow}
                      onChange={(e) => {
                        selectedNode.object.castShadow = e.target.checked;
                        setMatRefresh((n) => n + 1);
                      }}
                    />
                  </div>
                )}
                {selectedNode.object instanceof THREE.SpotLight && (
                  <>
                    <div className={styles.propRow}>
                      <span className={styles.propLabel}>Angle</span>
                      <input
                        type="range"
                        min={0}
                        max={90}
                        step={1}
                        value={(selectedNode.object.angle * DEG)}
                        onChange={(e) => {
                          (selectedNode.object as THREE.SpotLight).angle = parseFloat(e.target.value) / DEG;
                          setMatRefresh((n) => n + 1);
                        }}
                        style={{ flex: 1, accentColor: "#5566cc" }}
                      />
                      <span style={{ fontSize: 9, color: "#888", width: 28, textAlign: "right" }}>
                        {((selectedNode.object as THREE.SpotLight).angle * DEG).toFixed(0)}°
                      </span>
                    </div>
                    <div className={styles.propRow}>
                      <span className={styles.propLabel}>Penumbra</span>
                      <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.01}
                        value={(selectedNode.object as THREE.SpotLight).penumbra}
                        onChange={(e) => {
                          (selectedNode.object as THREE.SpotLight).penumbra = parseFloat(e.target.value);
                          setMatRefresh((n) => n + 1);
                        }}
                        style={{ flex: 1, accentColor: "#5566cc" }}
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Camera properties */}
          {selectedNode && selectedNode.object instanceof THREE.PerspectiveCamera && (
            <div className={styles.panelSection}>
              <div className={styles.panelTitle}>📷 Camera</div>
              <div className={styles.panelContent}>
                <div className={styles.propRow}>
                  <span className={styles.propLabel}>FOV</span>
                  <input
                    type="range"
                    min={10}
                    max={120}
                    step={1}
                    value={(selectedNode.object as THREE.PerspectiveCamera).fov}
                    onChange={(e) => {
                      const cam = selectedNode.object as THREE.PerspectiveCamera;
                      cam.fov = parseFloat(e.target.value);
                      cam.updateProjectionMatrix();
                      setMatRefresh((n) => n + 1);
                    }}
                    style={{ flex: 1, accentColor: "#5566cc" }}
                  />
                  <span style={{ fontSize: 9, color: "#888", width: 28, textAlign: "right" }}>
                    {(selectedNode.object as THREE.PerspectiveCamera).fov.toFixed(0)}°
                  </span>
                </div>
                <div className={styles.propRow}>
                  <span className={styles.propLabel}>Near</span>
                  <input
                    className={styles.propInput}
                    type="number"
                    step={0.01}
                    value={(selectedNode.object as THREE.PerspectiveCamera).near}
                    onChange={(e) => {
                      const cam = selectedNode.object as THREE.PerspectiveCamera;
                      cam.near = parseFloat(e.target.value);
                      cam.updateProjectionMatrix();
                      setMatRefresh((n) => n + 1);
                    }}
                    style={{ width: 60 }}
                  />
                </div>
                <div className={styles.propRow}>
                  <span className={styles.propLabel}>Far</span>
                  <input
                    className={styles.propInput}
                    type="number"
                    step={1}
                    value={(selectedNode.object as THREE.PerspectiveCamera).far}
                    onChange={(e) => {
                      const cam = selectedNode.object as THREE.PerspectiveCamera;
                      cam.far = parseFloat(e.target.value);
                      cam.updateProjectionMatrix();
                      setMatRefresh((n) => n + 1);
                    }}
                    style={{ width: 80 }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* AI Animation */}
          <div className={styles.panelSection}>
            <div className={styles.panelTitle}>🤖 AI Animation</div>
            <div className={styles.panelContent}>
              <div className={styles.aiPanel}>
                <div className={styles.aiHeader}>
                  ✨ Generate animation from video
                </div>
                <p style={{ fontSize: 10, color: "#888", margin: "0 0 6px" }}>
                  Upload a video and AI will extract 3D pose data to create an
                  animation clip for the current model.
                </p>
                <div className={styles.aiBtnRow}>
                  <button
                    className={styles.aiBtn}
                    disabled={aiBusy || !rootObjectRef.current}
                    onClick={() => videoInputRef.current?.click()}
                  >
                    {aiBusy ? "Processing..." : "Upload Video"}
                  </button>
                </div>
                {aiStatus && (
                  <div className={styles.aiStatus}>{aiStatus}</div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Material tab ── */}
      {propTab === "material" && (
        <div className={styles.panelSection}>
          <div className={styles.panelTitle}>🎨 Materials</div>
          <div className={styles.panelContent}>
            {selectedMaterials.length > 0 ? (
              selectedMaterials.map((mat, i) => (
                <MaterialCard
                  key={i}
                  material={mat}
                  active={i === selMaterialIdx}
                  onClick={() => setSelMaterialIdx(i)}
                  onUpdate={() => setMatRefresh((n) => n + 1)}
                />
              ))
            ) : (
              <div style={{ color: "#666", fontSize: 10 }}>
                {selectedNode
                  ? "No materials on this object"
                  : "Select a mesh to inspect"}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── World tab ── */}
      {propTab === "world" && (
        <>
          <div className={styles.panelSection}>
            <div className={styles.panelTitle}>🌍 Environment</div>
            <div className={styles.panelContent}>
              <div className={styles.propRow}>
                <span className={styles.propLabel}>Background</span>
                <div className={styles.propColorSwatch} style={{ background: bgColor }}>
                  <input
                    type="color"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                  />
                </div>
                <span style={{ fontSize: 9, color: "#888" }}>{bgColor}</span>
              </div>
            </div>
          </div>
          <div className={styles.panelSection}>
            <div className={styles.panelTitle}>🌫 Fog</div>
            <div className={styles.panelContent}>
              <div className={styles.propRow}>
                <span className={styles.propLabel}>Enable</span>
                <input
                  type="checkbox"
                  checked={fogEnabled}
                  onChange={() => setFogEnabled((v) => !v)}
                />
              </div>
              {fogEnabled && (
                <>
                  <div className={styles.propRow}>
                    <span className={styles.propLabel}>Color</span>
                    <div className={styles.propColorSwatch} style={{ background: fogColor }}>
                      <input
                        type="color"
                        value={fogColor}
                        onChange={(e) => setFogColor(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className={styles.propRow}>
                    <span className={styles.propLabel}>Near</span>
                    <input
                      className={styles.propInput}
                      type="number"
                      value={fogNear}
                      onChange={(e) => setFogNear(parseFloat(e.target.value))}
                      style={{ width: 60 }}
                    />
                  </div>
                  <div className={styles.propRow}>
                    <span className={styles.propLabel}>Far</span>
                    <input
                      className={styles.propInput}
                      type="number"
                      value={fogFar}
                      onChange={(e) => setFogFar(parseFloat(e.target.value))}
                      style={{ width: 60 }}
                    />
                  </div>
                </>
              )}
            </div>
          </div>
          <div className={styles.panelSection}>
            <div className={styles.panelTitle}>🔆 Scene Lights</div>
            <div className={styles.panelContent}>
              <div className={styles.propRow}>
                <span className={styles.propLabel}>Show Helpers</span>
                <input
                  type="checkbox"
                  checked={showLightHelpers}
                  onChange={() => setShowLightHelpers((v) => !v)}
                />
              </div>
              <div className={styles.propRow}>
                <span className={styles.propLabel}>Grid</span>
                <input
                  type="checkbox"
                  checked={showGrid}
                  onChange={() => setShowGrid((v) => !v)}
                />
              </div>
              <div className={styles.propRow}>
                <span className={styles.propLabel}>Axes</span>
                <input
                  type="checkbox"
                  checked={showAxes}
                  onChange={() => setShowAxes((v) => !v)}
                />
              </div>
              <div className={styles.propRow}>
                <span className={styles.propLabel}>Skeleton</span>
                <input
                  type="checkbox"
                  checked={showSkeleton}
                  onChange={() => setShowSkeleton((v) => !v)}
                />
              </div>
            </div>
          </div>
          <div className={styles.panelSection}>
            <div className={styles.panelTitle}>🧲 Snapping</div>
            <div className={styles.panelContent}>
              <div className={styles.propRow}>
                <span className={styles.propLabel}>Snap</span>
                <input
                  type="checkbox"
                  checked={snapEnabled}
                  onChange={() => setSnapEnabled((v) => !v)}
                />
              </div>
              {snapEnabled && (
                <div className={styles.propRow}>
                  <span className={styles.propLabel}>Grid Size</span>
                  <input
                    className={styles.propInput}
                    type="number"
                    step={0.25}
                    min={0.1}
                    value={snapGrid}
                    onChange={(e) => setSnapGrid(parseFloat(e.target.value) || 1)}
                    style={{ width: 60 }}
                  />
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* ── Modifiers tab ── */}
      {propTab === "modifiers" && (
        <div className={styles.panelSection}>
          <div className={styles.panelTitle}>🔩 Modifiers</div>
          <div className={styles.panelContent}>
            {selectedNode && selectedNode.object instanceof THREE.Mesh ? (
              <>
                <button
                  className={styles.btnSecondary}
                  style={{ width: "100%", marginBottom: 4 }}
                  onClick={() => {
                    const mesh = selectedNode.object as THREE.Mesh;
                    const geo = mesh.geometry;
                    const pos = geo.attributes.position;
                    if (pos) {
                      const wireGeo = new THREE.WireframeGeometry(geo);
                      mesh.geometry = wireGeo;
                      setStatusText("Applied Wireframe modifier");
                      rebuildTree();
                    }
                  }}
                >
                  + Wireframe Modifier
                </button>
                <button
                  className={styles.btnSecondary}
                  style={{ width: "100%", marginBottom: 4 }}
                  onClick={() => {
                    const mesh = selectedNode.object as THREE.Mesh;
                    mesh.geometry.computeVertexNormals();
                    setStatusText("Recomputed normals");
                  }}
                >
                  Recompute Normals
                </button>
                <button
                  className={styles.btnSecondary}
                  style={{ width: "100%", marginBottom: 4 }}
                  onClick={() => {
                    const mesh = selectedNode.object as THREE.Mesh;
                    const geo = mesh.geometry;
                    geo.center();
                    setStatusText("Centered geometry");
                    setMatRefresh((n) => n + 1);
                  }}
                >
                  Center Geometry
                </button>
                <button
                  className={styles.btnSecondary}
                  style={{ width: "100%", marginBottom: 4 }}
                  onClick={() => {
                    const mesh = selectedNode.object as THREE.Mesh;
                    const geo = mesh.geometry;
                    const idx = geo.index;
                    if (idx) {
                      const arr = idx.array as Uint16Array | Uint32Array;
                      for (let i = 0; i < arr.length; i += 3) {
                        const tmp = arr[i];
                        arr[i] = arr[i + 2];
                        arr[i + 2] = tmp;
                      }
                      idx.needsUpdate = true;
                      geo.computeVertexNormals();
                      setStatusText("Flipped normals");
                    }
                  }}
                >
                  Flip Normals
                </button>
              </>
            ) : (
              <div style={{ color: "#666", fontSize: 10 }}>
                Select a mesh to apply modifiers
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Physics tab ── */}
      {propTab === "physics" && (
        <div className={styles.panelSection}>
          <div className={styles.panelTitle}>⚡ Physics (Info)</div>
          <div className={styles.panelContent}>
            <div style={{ color: "#666", fontSize: 10, lineHeight: 1.5 }}>
              Physics simulation preview is not yet available.
              <br /><br />
              Planned features:
              <br />• Rigid body simulation
              <br />• Soft body dynamics
              <br />• Cloth simulation
              <br />• Particle systems
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

ModelEditorRightPanel.displayName = "ModelEditorRightPanel";
export default ModelEditorRightPanel;
