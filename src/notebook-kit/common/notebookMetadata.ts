/**
 * Notebook-level metadata utilities for Observable Kit notebooks.
 * These values are persisted in the HTML (handled by the serializer) and
 * editable via commands (see commands.ts).
 */

export const NOTEBOOK_THEMES = [
    "air",
    "coffee",
    "cotton",
    "deep-space",
    "glacier",
    "ink",
    "midnight",
    "near-midnight",
    "ocean-floor",
    "parchment",
    "slate",
    "stark",
    "sun-faded"
] as const;

export type NotebookTheme = typeof NOTEBOOK_THEMES[number];
