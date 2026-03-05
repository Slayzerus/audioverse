// DynamicRuleEditor.tsx — Visual editor for dynamic playlist rules (nested AND/OR groups)
import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
    DynamicRuleField,
    DynamicRuleOperator,
} from "../../models/modelsPlaylistManager";
import type {
    DynamicRule,
    DynamicRuleGroup,
} from "../../models/modelsPlaylistManager";

// ══════════════════════════════════════════════════════════════
// Helpers
// ══════════════════════════════════════════════════════════════

const FIELD_OPTIONS: { value: DynamicRuleField; label: string }[] = [
    { value: DynamicRuleField.Artist, label: "Artist" },
    { value: DynamicRuleField.Title, label: "Title" },
    { value: DynamicRuleField.Album, label: "Album" },
    { value: DynamicRuleField.Genre, label: "Genre" },
    { value: DynamicRuleField.Year, label: "Year" },
    { value: DynamicRuleField.Duration, label: "Duration (s)" },
    { value: DynamicRuleField.Rating, label: "Rating" },
    { value: DynamicRuleField.PlayCount, label: "Play Count" },
    { value: DynamicRuleField.Tag, label: "Tag" },
    { value: DynamicRuleField.Source, label: "Source" },
    { value: DynamicRuleField.AddedDate, label: "Added Date" },
];

const OPERATOR_OPTIONS: { value: DynamicRuleOperator; label: string }[] = [
    { value: DynamicRuleOperator.Equals, label: "=" },
    { value: DynamicRuleOperator.NotEquals, label: "≠" },
    { value: DynamicRuleOperator.Contains, label: "contains" },
    { value: DynamicRuleOperator.NotContains, label: "not contains" },
    { value: DynamicRuleOperator.StartsWith, label: "starts with" },
    { value: DynamicRuleOperator.GreaterThan, label: ">" },
    { value: DynamicRuleOperator.LessThan, label: "<" },
    { value: DynamicRuleOperator.Between, label: "between" },
    { value: DynamicRuleOperator.In, label: "in" },
    { value: DynamicRuleOperator.NotIn, label: "not in" },
];

function isGroup(item: DynamicRule | DynamicRuleGroup): item is DynamicRuleGroup {
    return "logic" in item && "rules" in item;
}

function createEmptyRule(): DynamicRule {
    return {
        id: crypto.randomUUID(),
        field: DynamicRuleField.Artist,
        operator: DynamicRuleOperator.Contains,
        value: "",
    };
}

function createEmptyGroup(): DynamicRuleGroup {
    return {
        id: crypto.randomUUID(),
        logic: "and",
        rules: [createEmptyRule()],
    };
}

// ══════════════════════════════════════════════════════════════
// Single Rule Row
// ══════════════════════════════════════════════════════════════

interface RuleRowProps {
    rule: DynamicRule;
    onChange: (updated: DynamicRule) => void;
    onRemove: () => void;
}

const RuleRow: React.FC<RuleRowProps> = ({ rule, onChange, onRemove }) => (
    <div className="d-flex align-items-center gap-2 mb-2">
        <select
            className="form-select form-select-sm"
            style={{ width: 130 }}
            value={rule.field}
            onChange={(e) => onChange({ ...rule, field: e.target.value as DynamicRuleField })}
        >
            {FIELD_OPTIONS.map((f) => (
                <option key={f.value} value={f.value}>
                    {f.label}
                </option>
            ))}
        </select>

        <select
            className="form-select form-select-sm"
            style={{ width: 130 }}
            value={rule.operator}
            onChange={(e) => onChange({ ...rule, operator: e.target.value as DynamicRuleOperator })}
        >
            {OPERATOR_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                    {o.label}
                </option>
            ))}
        </select>

        <input
            type="text"
            className="form-control form-control-sm"
            style={{ width: 160 }}
            value={rule.value}
            placeholder="Value"
            onChange={(e) => onChange({ ...rule, value: e.target.value })}
        />

        {rule.operator === DynamicRuleOperator.Between && (
            <>
                <span className="text-muted">–</span>
                <input
                    type="text"
                    className="form-control form-control-sm"
                    style={{ width: 120 }}
                    value={rule.value2 ?? ""}
                    placeholder="Value 2"
                    onChange={(e) => onChange({ ...rule, value2: e.target.value })}
                />
            </>
        )}

        <button
            className="btn btn-outline-danger btn-sm"
            onClick={onRemove}
            title="Remove rule"
        >
            ✕
        </button>
    </div>
);

// ══════════════════════════════════════════════════════════════
// Rule Group (recursive)
// ══════════════════════════════════════════════════════════════

interface RuleGroupEditorProps {
    group: DynamicRuleGroup;
    onChange: (updated: DynamicRuleGroup) => void;
    onRemove?: () => void;
    depth?: number;
}

const RuleGroupEditor: React.FC<RuleGroupEditorProps> = ({
    group,
    onChange,
    onRemove,
    depth = 0,
}) => {
    const { t } = useTranslation();

    const updateRule = useCallback(
        (index: number, updated: DynamicRule | DynamicRuleGroup) => {
            const newRules = [...group.rules];
            newRules[index] = updated;
            onChange({ ...group, rules: newRules });
        },
        [group, onChange],
    );

    const removeRule = useCallback(
        (index: number) => {
            const newRules = group.rules.filter((_, i) => i !== index);
            onChange({ ...group, rules: newRules.length > 0 ? newRules : [createEmptyRule()] });
        },
        [group, onChange],
    );

    const addRule = useCallback(() => {
        onChange({ ...group, rules: [...group.rules, createEmptyRule()] });
    }, [group, onChange]);

    const addGroup = useCallback(() => {
        onChange({ ...group, rules: [...group.rules, createEmptyGroup()] });
    }, [group, onChange]);

    const toggleLogic = useCallback(() => {
        onChange({ ...group, logic: group.logic === "and" ? "or" : "and" });
    }, [group, onChange]);

    const borderColor = group.logic === "and" ? "var(--bs-primary)" : "var(--bs-warning)";

    return (
        <div
            className="p-2 mb-2 rounded"
            style={{
                borderLeft: `3px solid ${borderColor}`,
                backgroundColor: depth % 2 === 0 ? "rgba(var(--bs-body-color-rgb), 0.03)" : "transparent",
            }}
        >
            <div className="d-flex align-items-center gap-2 mb-2">
                <button
                    className={`btn btn-sm ${group.logic === "and" ? "btn-primary" : "btn-warning"}`}
                    onClick={toggleLogic}
                    title={t("playlistManager.toggleLogic", "Toggle AND/OR")}
                >
                    {group.logic.toUpperCase()}
                </button>

                <span className="text-muted small">{t("playlistManager.matchAll", "Match all / any of these rules")}</span>

                <div className="ms-auto d-flex gap-1">
                    <button className="btn btn-outline-secondary btn-sm" onClick={addRule} title="Add rule">
                        + Rule
                    </button>
                    {depth < 3 && (
                        <button className="btn btn-outline-secondary btn-sm" onClick={addGroup} title="Add nested group">
                            + Group
                        </button>
                    )}
                    {onRemove && (
                        <button className="btn btn-outline-danger btn-sm" onClick={onRemove} title="Remove group">
                            ✕
                        </button>
                    )}
                </div>
            </div>

            {group.rules.map((item, i) =>
                isGroup(item) ? (
                    <RuleGroupEditor
                        key={item.id}
                        group={item}
                        onChange={(updated) => updateRule(i, updated)}
                        onRemove={() => removeRule(i)}
                        depth={depth + 1}
                    />
                ) : (
                    <RuleRow
                        key={item.id}
                        rule={item}
                        onChange={(updated) => updateRule(i, updated)}
                        onRemove={() => removeRule(i)}
                    />
                ),
            )}
        </div>
    );
};

// ══════════════════════════════════════════════════════════════
// Main DynamicRuleEditor
// ══════════════════════════════════════════════════════════════

interface DynamicRuleEditorProps {
    rules: DynamicRuleGroup | undefined;
    onChange: (rules: DynamicRuleGroup) => void;
    limit?: number;
    onLimitChange?: (limit: number | undefined) => void;
}

const DynamicRuleEditor: React.FC<DynamicRuleEditorProps> = ({
    rules,
    onChange,
    limit,
    onLimitChange,
}) => {
    const { t } = useTranslation();
    const rootGroup = rules ?? createEmptyGroup();

    return (
        <div className="border rounded p-3">
            <h6 className="mb-3">
                🔄 {t("playlistManager.dynamicRules", "Dynamic Playlist Rules")}
            </h6>
            <p className="text-muted small mb-3">
                {t("playlistManager.dynamicRulesHint", "Tracks matching these rules will automatically be included in the playlist.")}
            </p>

            <RuleGroupEditor group={rootGroup} onChange={onChange} />

            {onLimitChange && (
                <div className="d-flex align-items-center gap-2 mt-3 pt-2 border-top">
                    <label className="form-label mb-0 small">
                        {t("playlistManager.maxTracks", "Max tracks:")}
                    </label>
                    <input
                        type="number"
                        className="form-control form-control-sm"
                        style={{ width: 100 }}
                        min={0}
                        value={limit ?? ""}
                        placeholder="∞"
                        onChange={(e) => {
                            const v = parseInt(e.target.value, 10);
                            onLimitChange(isNaN(v) || v <= 0 ? undefined : v);
                        }}
                    />
                    <span className="text-muted small">
                        {t("playlistManager.leaveEmptyForAll", "(leave empty for unlimited)")}
                    </span>
                </div>
            )}
        </div>
    );
};

export default DynamicRuleEditor;
