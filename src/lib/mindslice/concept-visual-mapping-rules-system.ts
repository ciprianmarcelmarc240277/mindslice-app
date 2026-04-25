import type { ParsedSliceObject } from "@/lib/mindslice/concept-parser-engine-system";

export type VisualConceptType =
  | "structure"
  | "control"
  | "will"
  | "action"
  | "tension"
  | "conflict"
  | "uncertainty"
  | "identity"
  | "growth"
  | "collapse"
  | "general";

export type VisualFormType =
  | "square"
  | "straight_line"
  | "vector_line"
  | "offset_position"
  | "close_proximity"
  | "intersection"
  | "incomplete_shape"
  | "central_shape"
  | "circle";

export type VisualConcept = {
  label: string;
  type: VisualConceptType;
  importance: number;
};

export type VisualMappedForm = {
  concept: string;
  concept_type: VisualConceptType;
  form: VisualFormType;
  weight: "high" | "low";
  size: "large" | "small";
  priority: 1 | 2;
  position?: "center" | "overlap" | "peripheral";
  distance?: "close" | "far";
  offset?: "directional" | "none";
  direction?: "right" | "left" | "up" | "down" | "none";
};

export type VisualTensionLink = {
  pair: [string, string];
  distance: "close" | "far";
  tension: "high" | "low";
};

export type VisualComposition = {
  empty_space: "dominant";
  fill_ratio: "low";
  forms: VisualMappedForm[];
  layout: "minimal";
  color_mode: "limited_palette";
};

export type VisualBlueprint = {
  dominant_concepts: VisualConcept[];
  secondary_concepts: VisualConcept[];
  mapped_forms: VisualMappedForm[];
  composition: VisualComposition;
  tension_map: VisualTensionLink[];
  semantic_axis: string | null;
  layout_seed: number;
};

const STOPWORDS = new Set([
  "si",
  "sau",
  "este",
  "sunt",
  "pentru",
  "prin",
  "unde",
  "care",
  "din",
  "acest",
  "aceasta",
  "aceste",
  "the",
  "and",
  "with",
  "that",
  "this",
  "from",
]);

function unique(values: string[]) {
  return [...new Set(values.filter(Boolean))];
}

function normalizeText(text: string) {
  return text
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function tokenize(text: string) {
  return normalizeText(text)
    .replace(/[^a-z0-9 -]+/g, " ")
    .split(/[\s-]+/u)
    .map((token) => token.trim())
    .filter((token) => token.length > 2 && !STOPWORDS.has(token));
}

function scoreMap(tokens: string[]) {
  const counts = new Map<string, number>();

  tokens.forEach((token) => {
    counts.set(token, (counts.get(token) ?? 0) + 1);
  });

  return counts;
}

function classifyConceptType(token: string): VisualConceptType {
  if (
    [
      "structura",
      "structure",
      "schema",
      "grid",
      "cadru",
      "framework",
      "arhitectura",
      "architecture",
      "plan",
      "matrix",
      "sistem",
      "system",
    ].includes(token)
  ) {
    return "structure";
  }

  if (
    [
      "control",
      "disciplina",
      "regula",
      "ordine",
      "constraint",
      "protocol",
      "logic",
      "governance",
      "stability",
      "stable",
      "stabilitate",
    ].includes(token)
  ) {
    return "control";
  }

  if (
    [
      "vointa",
      "will",
      "intent",
      "intentie",
      "drive",
      "vector",
      "push",
      "directive",
      "decision",
      "decizie",
    ].includes(token)
  ) {
    return "will";
  }

  if (
    [
      "actiune",
      "action",
      "miscare",
      "move",
      "deplasare",
      "gesture",
      "gesturei",
      "direction",
      "directional",
      "shift",
      "passage",
    ].includes(token)
  ) {
    return "action";
  }

  if (
    [
      "tensiune",
      "tension",
      "pressure",
      "presiune",
      "compression",
      "dense",
      "density",
      "frictional",
      "strain",
    ].includes(token)
  ) {
    return "tension";
  }

  if (
    [
      "conflict",
      "friction",
      "rupture",
      "ciocnire",
      "collision",
      "intersection",
      "break",
      "breakage",
      "split",
    ].includes(token)
  ) {
    return "conflict";
  }

  if (
    [
      "incertitudine",
      "uncertainty",
      "ambiguity",
      "ambiguitate",
      "blur",
      "unknown",
      "fragment",
      "partial",
      "incomplete",
    ].includes(token)
  ) {
    return "uncertainty";
  }

  if (
    [
      "identitate",
      "identity",
      "self",
      "nume",
      "author",
      "autor",
      "name",
      "signature",
      "center",
      "core",
    ].includes(token)
  ) {
    return "identity";
  }

  if (
    ["growth", "crestere", "expand", "expansion", "emergence", "rise", "develop", "branch"].includes(
      token,
    )
  ) {
    return "growth";
  }

  if (
    ["collapse", "colaps", "fall", "cadere", "decay", "sink", "ruina", "erosion"].includes(token)
  ) {
    return "collapse";
  }

  return "general";
}

function parseKeywords(text: string) {
  return [...scoreMap(tokenize(text)).entries()]
    .sort((left, right) => {
      if (right[1] !== left[1]) {
        return right[1] - left[1];
      }

      return right[0].length - left[0].length;
    })
    .slice(0, 10)
    .map(([label, score]) => ({
      label,
      type: classifyConceptType(label),
      importance: score,
    }));
}

export function extractConcepts(slice: ParsedSliceObject) {
  const fromText = parseKeywords(slice.content.text);
  const fromTags = unique(slice.metadata.tags).map((tag, index) => ({
    label: tag,
    type: classifyConceptType(normalizeText(tag)),
    importance: Math.max(2, 6 - index),
  }));
  const fromPipeline = unique(slice.process.pipeline).map((step, index) => ({
    label: step,
    type: classifyConceptType(normalizeText(step)),
    importance: Math.max(1, 4 - index),
  }));
  const fromPriority = slice.identity.priority
    ? [
        {
          label: slice.identity.priority,
          type: classifyConceptType(normalizeText(slice.identity.priority)),
          importance: 4,
        },
      ]
    : [];
  const contentTypeHint =
    slice.content.type && slice.content.type !== "unknown"
      ? [
          {
            label: slice.content.type,
            type: classifyConceptType(normalizeText(slice.content.type)),
            importance: 3,
          },
        ]
      : [];

  return [...fromText, ...fromTags, ...fromPipeline, ...fromPriority, ...contentTypeHint].sort(
    (left, right) => right.importance - left.importance,
  );
}

export function reduceConcepts(concepts: VisualConcept[]) {
  const uniqueConcepts = concepts.reduce<VisualConcept[]>((accumulator, concept) => {
    const existingIndex = accumulator.findIndex(
      (entry) => entry.label === concept.label || entry.type === concept.type,
    );

    if (existingIndex === -1) {
      accumulator.push(concept);
      return accumulator;
    }

    if (concept.importance > accumulator[existingIndex].importance) {
      accumulator[existingIndex] = concept;
    }

    return accumulator;
  }, []);

  return {
    dominant_concepts: uniqueConcepts.slice(0, 3),
    secondary_concepts: uniqueConcepts.slice(3, 6),
  };
}

export function mapToForm(conceptType: VisualConceptType): VisualFormType {
  switch (conceptType) {
    case "structure":
      return "square";
    case "control":
      return "straight_line";
    case "will":
      return "vector_line";
    case "action":
      return "offset_position";
    case "tension":
      return "close_proximity";
    case "conflict":
      return "intersection";
    case "uncertainty":
      return "incomplete_shape";
    case "identity":
      return "central_shape";
    default:
      return "circle";
  }
}

export function buildForms(
  dominant: VisualConcept[],
  secondary: VisualConcept[],
) {
  const mappedForms: VisualMappedForm[] = [];
  const appendSupportForm = (
    concept: VisualConcept,
    weight: "high" | "low",
    priority: 1 | 2,
  ) => {
    let supportForm: VisualFormType | null = null;

    switch (concept.type) {
      case "identity":
        supportForm = "circle";
        break;
      case "structure":
        supportForm = "straight_line";
        break;
      case "will":
        supportForm = "offset_position";
        break;
      case "action":
        supportForm = "vector_line";
        break;
      case "tension":
        supportForm = "intersection";
        break;
      case "conflict":
        supportForm = "close_proximity";
        break;
      case "uncertainty":
        supportForm = "circle";
        break;
      case "growth":
        supportForm = "vector_line";
        break;
      case "collapse":
        supportForm = "straight_line";
        break;
      default:
        supportForm = null;
        break;
    }

    if (!supportForm || supportForm === mapToForm(concept.type)) {
      return;
    }

    mappedForms.push({
      concept: `${concept.label}_support`,
      concept_type: concept.type,
      form: supportForm,
      weight,
      size: weight === "high" ? "large" : "small",
      priority,
    });
  };

  dominant.forEach((concept) => {
    mappedForms.push({
      concept: concept.label,
      concept_type: concept.type,
      form: mapToForm(concept.type),
      weight: "high",
      size: "large",
      priority: 1,
    });
    appendSupportForm(concept, "low", 2);
  });

  secondary.forEach((concept) => {
    mappedForms.push({
      concept: concept.label,
      concept_type: concept.type,
      form: mapToForm(concept.type),
      weight: "low",
      size: "small",
      priority: 2,
    });
    if (concept.type !== "general") {
      appendSupportForm(concept, "low", 2);
    }
  });

  return mappedForms;
}

export function applyHierarchy(mappedForms: VisualMappedForm[]) {
  return mappedForms.map((form) => ({
    ...form,
    size: (form.weight === "high" ? "large" : "small") as "large" | "small",
    priority: (form.weight === "high" ? 1 : 2) as 1 | 2,
  }));
}

export function applyPosition(mappedForms: VisualMappedForm[]) {
  return mappedForms.map((form) => {
    if (form.concept_type === "tension") {
      return { ...form, distance: "close" as const, position: "peripheral" as const };
    }

    if (form.concept_type === "conflict") {
      return { ...form, position: "overlap" as const, distance: "close" as const };
    }

    if (form.concept_type === "identity") {
      return { ...form, position: "center" as const };
    }

    if (form.concept_type === "action") {
      return { ...form, offset: "directional" as const, position: "peripheral" as const };
    }

    if (form.concept_type === "structure") {
      return { ...form, position: "center" as const, distance: "far" as const };
    }

    if (form.concept_type === "growth" || form.concept_type === "collapse") {
      return { ...form, position: "peripheral" as const, distance: "far" as const };
    }

    return {
      ...form,
      position: form.position ?? "peripheral",
      distance: form.distance ?? "far",
      offset: form.offset ?? "none",
    };
  });
}

export function applyDirection(mappedForms: VisualMappedForm[]) {
  return mappedForms.map((form) => {
    if (form.concept_type === "will") {
      return { ...form, direction: "right" as const };
    }

    if (form.concept_type === "collapse") {
      return { ...form, direction: "down" as const };
    }

    if (form.concept_type === "growth") {
      return { ...form, direction: "up" as const };
    }

    if (form.concept_type === "action") {
      const fingerprint = form.concept.length % 3;

      return {
        ...form,
        direction: (fingerprint === 0 ? "right" : fingerprint === 1 ? "up" : "left") as
          | "right"
          | "up"
          | "left",
      };
    }

    return { ...form, direction: form.direction ?? "none" };
  });
}

export function measureDistance(pair: [VisualMappedForm, VisualMappedForm]) {
  const [left, right] = pair;

  if (
    left.distance === "close" ||
    right.distance === "close" ||
    left.position === "overlap" ||
    right.position === "overlap"
  ) {
    return "close" as const;
  }

  if (
    left.position === "center" ||
    right.position === "center" ||
    left.priority !== right.priority
  ) {
    return "close" as const;
  }

  return "far" as const;
}

export function computeTension(mappedForms: VisualMappedForm[]) {
  const tensionMap: VisualTensionLink[] = [];

  for (let index = 0; index < mappedForms.length; index += 1) {
    for (let offset = index + 1; offset < mappedForms.length; offset += 1) {
      const pair: [VisualMappedForm, VisualMappedForm] = [mappedForms[index], mappedForms[offset]];
      const distance = measureDistance(pair);
      const strongPair =
        pair.some((entry) => entry.concept_type === "conflict" || entry.concept_type === "tension") ||
        (pair[0].concept_type === "will" && pair[1].concept_type === "action") ||
        (pair[0].concept_type === "action" && pair[1].concept_type === "will");

      tensionMap.push({
        pair: [pair[0].concept, pair[1].concept],
        distance: strongPair ? "close" : distance,
        tension: strongPair || distance === "close" ? "high" : "low",
      });
    }
  }

  return tensionMap;
}

export function applyNegativeSpace() {
  return {
    empty_space: "dominant" as const,
    fill_ratio: "low" as const,
  };
}

function removingKeepsMeaning(form: VisualMappedForm, mappedForms: VisualMappedForm[]) {
  if (form.weight === "high") {
    return false;
  }

  if (mappedForms.length <= 5) {
    return false;
  }

  const sameTypeCount = mappedForms.filter(
    (entry) => entry !== form && entry.concept_type === form.concept_type,
  ).length;

  return sameTypeCount >= 2;
}

export function simplify(mappedForms: VisualMappedForm[]) {
  return mappedForms.filter((form) => !removingKeepsMeaning(form, mappedForms));
}

export function buildComposition(
  mappedForms: VisualMappedForm[],
  tensionMap: VisualTensionLink[],
) {
  const compositionBase = applyNegativeSpace();

  return {
    ...compositionBase,
    forms: mappedForms,
    tension: tensionMap,
    layout: "minimal" as const,
    color_mode: "limited_palette" as const,
  };
}

function dominantConcept(concepts: VisualConcept[]) {
  return concepts[0]?.label ?? null;
}

function computeLayoutSeed(slice: ParsedSliceObject, concepts: VisualConcept[]) {
  const seedSource = [
    slice.content.type,
    slice.identity.priority ?? "",
    ...slice.metadata.tags,
    ...concepts.map((concept) => `${concept.type}:${concept.label}`),
  ].join("|");

  return [...seedSource].reduce((sum, char, index) => sum + char.charCodeAt(0) * (index + 1), 0);
}

export function runVisualMappingRulesV1(slice: ParsedSliceObject): VisualBlueprint {
  const concepts = extractConcepts(slice);
  const { dominant_concepts, secondary_concepts } = reduceConcepts(concepts);

  let forms = buildForms(dominant_concepts, secondary_concepts);
  forms = applyHierarchy(forms);
  forms = applyPosition(forms);
  forms = applyDirection(forms);

  const simplifiedForms = simplify(forms);
  const tensionMap = computeTension(simplifiedForms);
  const composition = buildComposition(simplifiedForms, tensionMap);

  return {
    dominant_concepts,
    secondary_concepts,
    mapped_forms: simplifiedForms,
    composition,
    tension_map: tensionMap,
    semantic_axis: dominantConcept(dominant_concepts),
    layout_seed: computeLayoutSeed(slice, [...dominant_concepts, ...secondary_concepts]),
  };
}
