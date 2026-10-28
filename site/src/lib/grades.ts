// The four attestation grades, labelled and defined as in the pilot brief
// ("Attestation grades") and prompts/verify.md. Shown as the badge on every spread.

export const GRADES = {
  "widely-attested": { label: "Widely attested", definition: "Multiple peoples, multiple independent sources." },
  regional: { label: "Regional", definition: "One people, multiple sources." },
  literary: {
    label: "Literary",
    definition: "Traceable mainly to one 19th-century compiler; possible cabinet mythology.",
  },
  disputed: { label: "Disputed", definition: "Contested, or suspected modern invention." },
} as const;

export type GradeId = keyof typeof GRADES;

/** Plain-English labels for related-entry relations and note kinds. */
export const RELATION_LABELS: Record<string, string> = {
  "often-confused": "Often confused with",
  related: "Related",
  "class-of": "A class that includes",
  "instance-of": "An instance of",
};

export const NOTE_KIND_LABELS: Record<string, string> = {
  accretion: "Accretion",
  disputed: "Disputed",
  scope: "Scope",
  "empty-field": "Empty field",
  other: "Note",
};

/** The fixed line under every interpretive plate (plan phase-3, settled decisions). */
export const INTERPRETIVE_LINE = "A drawing after the folk tradition. The sources describe:";

/** Shown when an entry has neither appearance nor scene clauses. */
export const NO_APPEARANCE_LINE = "The sources give no description of its appearance.";
