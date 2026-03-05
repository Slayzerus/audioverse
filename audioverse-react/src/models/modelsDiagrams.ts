/**
 * Models for auto-generated data model diagram.
 *
 * These types mirror the JSON contract produced by
 * `AudioVerse.DiagramGenerator.JsonDiagramGenerator` on the backend.
 *
 * Endpoint: GET /api/admin/diagrams/data-model
 */

/** Root response from the diagram generator. */
export interface DiagramJson {
    /** ISO 8601 timestamp of last generation. */
    generatedAt: string;
    /** Generator name (e.g. "AudioVerse.DiagramGenerator"). */
    generator: string;
    /** Module-level groups containing entity nodes. */
    groups: DiagramGroup[];
    /** Relationship edges between entities. */
    edges: DiagramEdge[];
}

/** A logical group of entities — corresponds to a backend module. */
export interface DiagramGroup {
    /** Group name — matches `[DiagramNode("Events")]`. */
    name: string;
    /** Background fill color (#hex). */
    fillColor: string;
    /** Border stroke color (#hex). */
    strokeColor: string;
    /** Entity nodes belonging to this group. */
    nodes: DiagramNode[];
}

/** An entity on the diagram — reflects a C# class decorated with `[DiagramNode]`. */
export interface DiagramNode {
    /** Fully-qualified name (e.g. "AudioVerse.Domain.Entities.Events.Event"). */
    id: string;
    /** Short class name (e.g. "Event"). */
    name: string;
    /** Emoji icon (e.g. "📅"). */
    icon: string;
    /** Human-readable description. */
    description: string;
    /** Card fill color (#hex). */
    fillColor: string;
    /** Card stroke color (#hex). */
    strokeColor: string;
    /** List of properties as "type name" (e.g. ["int Id", "string Title"]). */
    properties: string[];
}

/** A relationship arrow between two entities. */
export interface DiagramEdge {
    /** Fully-qualified source entity id. */
    source: string;
    /** Fully-qualified target entity id. */
    target: string;
    /** Cardinality label (e.g. "1:N", "N:1", "N:M"). */
    label: string;
    /** Navigation property name (e.g. "Organizer"). */
    propertyName: string;
    /** True = dashed line (optional/nullable relation). */
    dashed: boolean;
}

/** Entry in the diagram list — GET /api/admin/diagrams. */
export interface DiagramListEntry {
    /** Filename (e.g. "auto-data-model.drawio"). */
    name: string;
    /** File size in bytes. */
    sizeBytes: number;
    /** Last modification timestamp (ISO 8601). */
    lastModified: string;
    /** Whether a companion .json exists. */
    hasJson: boolean;
}
