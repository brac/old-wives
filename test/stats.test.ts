import { describe, expect, test } from "vitest";
import { bucketOf, checkableItems, creatureStats, total } from "../src/report/stats.js";

const clause = (text: string) => ({ text, cites: ["ralston1872:p.123"] });

const draft = {
  id: "domovoi",
  names: {
    primary: { romanized: "domovoi", native: [{ script: "Cyrl", text: "домовой", people: "Russians", cites: ["ralston1872:p.123"] }] },
    variants: [{ romanized: "dedushka", peoples: ["Russians"], native: [], cites: ["ralston1872:p.123"] }],
    meaning: [clause("house spirit")],
  },
  peoples_regions: [{ people: "Russians", cites: ["ralston1872:p.123"] }],
  appearance: [clause("He is hairy."), clause("He wears a tall felt hat.")],
  scene: [],
  variants: [{ id: "v", label: "v", peoples: ["Russians"], appearance: [clause("Small.")], behavior_habitat: [] }],
  behavior_habitat: [clause("He lives behind the stove.")],
  dealing_with_it: [],
  origin: [],
  notes: [
    { kind: "scope", text: "uncited note is not checkable" },
    { kind: "disputed", text: "cited note", cites: ["ralston1872:p.124"] },
  ],
};

// Verify removed the canary, kept everything else, and added one cited note of its own.
const entry = {
  ...draft,
  appearance: [clause("He is hairy.")],
  notes: [...draft.notes, { kind: "disputed", text: "verifier note", cites: ["ralston1872:p.125"] }],
};

const log = {
  entry_id: "domovoi",
  removed: [{ field: "/appearance/1", text: "He wears a tall felt hat.", cites: ["machal1918:p.240"], reason: "page silent" }],
  downgraded: [],
  retagged: [],
  flagged: [],
  grade: "widely-attested",
};

describe("checkable items", () => {
  test("counts clauses, name rows, native rows, peoples rows and cited notes only", () => {
    const items = checkableItems(draft);
    // native 1, name variant 1, meaning 1, peoples 1, appearance 2, variant clause 1, behavior 1, cited note 1
    expect(items).toHaveLength(9);
    expect(items.map((i) => i.pointer)).toContain("/variants/0/appearance/0");
    expect(items.map((i) => i.pointer)).not.toContain("/notes/0");
  });

  test("buckets pointers", () => {
    expect(bucketOf("/names/variants/2/native/0")).toBe("native");
    expect(bucketOf("/names/primary/native/0")).toBe("native");
    expect(bucketOf("/names/variants/2")).toBe("name_variants");
    expect(bucketOf("/variants/0/appearance/3")).toBe("variants");
    expect(bucketOf("/appearance/1")).toBe("appearance");
  });
});

describe("reconciliation", () => {
  test("passes when draft = entry + removed, ignoring the verifier-added note, and counts the canary apart", () => {
    const s = creatureStats("domovoi", draft, entry, log);
    expect(s.reconcile).toEqual({ ok: true, mismatches: [] });
    expect(s.addedNotes).toBe(1);
    expect(s.removed).toBe(0);
    expect(s.canaryRemoved).toBe(1);
    expect(s.canaryKept).toBe(false);
    expect(total(s.verified!)).toBe(8);
  });

  test("fails, naming the field, when a removal is missing from the log", () => {
    const s = creatureStats("domovoi", draft, entry, { ...log, removed: [] });
    expect(s.reconcile!.ok).toBe(false);
    expect(s.reconcile!.mismatches).toEqual(["appearance: draft 2 != verified 1 + removed 0"]);
  });

  test("a creature with no entry or log is pending and not reconciled", () => {
    const s = creatureStats("domovoi", draft);
    expect(s.pending).toBe(true);
    expect(s.reconcile).toBeUndefined();
  });
});

describe("family", () => {
  const withFamily = { ...draft, family: { value: "household", cites: ["ralston1872:p.123"] } };

  test("a cited family is one checkable item; unclassified is none", () => {
    expect(checkableItems(withFamily).map((i) => i.pointer)).toContain("/family");
    expect(bucketOf("/family")).toBe("family");
    const unclassified = { ...draft, family: { value: "unclassified", cites: [] } };
    expect(checkableItems(unclassified).map((i) => i.pointer)).not.toContain("/family");
  });

  test("a family set to unclassified reconciles only when logged as removed", () => {
    const e = { ...entry, family: { value: "unclassified", cites: [] } };
    const removedFamily = { field: "/family", text: "household", cites: ["ralston1872:p.123"], reason: "no page supports it" };
    const ok = creatureStats("domovoi", withFamily, e, { ...log, removed: [...log.removed, removedFamily] });
    expect(ok.reconcile).toEqual({ ok: true, mismatches: [] });
    const bad = creatureStats("domovoi", withFamily, e, log);
    expect(bad.reconcile!.mismatches).toEqual(["family: draft 1 != verified 0 + removed 0"]);
  });
});

describe("appearance forms", () => {
  const formsDraft = {
    ...draft,
    appearance_forms: [{ id: "bald", label: "bald" }],
    appearance: [
      { ...clause("He is bald."), form: "bald" },
      { ...clause("He has a reed cap."), form: "bald" },
      clause("He has long green hair."),
    ],
  };
  // Verify moved the long hair into its own form and the reed cap along with it.
  const formsEntry = {
    ...formsDraft,
    appearance_forms: [
      { id: "bald", label: "bald" },
      { id: "long-haired", label: "long-haired" },
    ],
    appearance: [
      { ...clause("He is bald."), form: "bald" },
      { ...clause("He has a reed cap."), form: "long-haired" },
      { ...clause("He has long green hair."), form: "long-haired" },
    ],
  };
  const reformed = [
    { field: "/appearance/1", text: "He has a reed cap.", from_form: "bald", to_form: "long-haired", reason: "r" },
    { field: "/appearance/2", text: "He has long green hair.", from_form: null, to_form: "long-haired", reason: "r" },
  ];

  test("re-forms reconcile when every form change is logged, and forms are reported per creature", () => {
    const s = creatureStats("x", formsDraft, formsEntry, { ...log, removed: [], reformed });
    expect(s.reconcile).toEqual({ ok: true, mismatches: [] });
    expect(s.reformed).toBe(2);
    expect(s.forms).toEqual([
      { id: "bald", label: "bald", clauses: 1 },
      { id: "long-haired", label: "long-haired", clauses: 2 },
    ]);
    expect(s.commonAppearance).toBe(0);
  });

  test("a form change with no reformed row fails", () => {
    const s = creatureStats("x", formsDraft, formsEntry, { ...log, removed: [], reformed: reformed.slice(0, 1) });
    expect(s.reconcile!.mismatches).toEqual(["reformed: /appearance/2 moved from form null to long-haired with no reformed row"]);
  });

  test("a reformed row with no form change fails", () => {
    const s = creatureStats("x", formsDraft, formsDraft, { ...log, removed: [], reformed: reformed.slice(0, 1) });
    expect(s.reconcile!.mismatches).toEqual(["reformed: /appearance/1 is logged but its form did not change (bald)"]);
  });
});
