import type {
  ConceptContaminationDecision,
  ContaminationType,
  IdeaInterpretationResult,
  InfluenceMode,
  LiveInterference,
  ThoughtState,
} from "@/lib/mindslice/mindslice-types";

type ApplyContaminationInput = {
  thought: ThoughtState;
  influenceMode: InfluenceMode | null;
  interference: LiveInterference | null;
  interpretation: IdeaInterpretationResult;
};

type ApplyContaminationResult = {
  thought: ThoughtState;
  decision: ConceptContaminationDecision;
  notes: string[];
};

function unique(values: Array<string | null | undefined>) {
  return values.filter((value, index, array): value is string => {
    if (!value?.trim()) {
      return false;
    }

    return array.findIndex((candidate) => candidate?.trim() === value.trim()) === index;
  });
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function selectContaminationType(
  input: ApplyContaminationInput,
): ContaminationType {
  const { thought, influenceMode, interference, interpretation } = input;

  if (influenceMode) {
    return influenceMode;
  }

  if (interference?.influenceMode) {
    return interference.influenceMode;
  }

  if (thought.visual.fracture > 0.74 && thought.visual.convergence < 0.52) {
    return "collapse";
  }

  if (thought.visual.density > 1.58 && interpretation.memoryPressure > 0.42) {
    return "overload";
  }

  if (thought.visual.fracture > 0.62 || thought.fragments.length > 5) {
    return "fragment";
  }

  if (thought.visual.drift > 0.78 && thought.visual.convergence < 0.58) {
    return "noise";
  }

  return "none";
}

function applyPositiveContamination(
  thought: ThoughtState,
  type: InfluenceMode,
  interference: LiveInterference | null,
) {
  const trace = interference?.authorPseudonym ?? interference?.title ?? type;

  switch (type) {
    case "whisper":
      return {
        ...thought,
        thought: `${thought.thought} O șoaptă mută accentul spre ${trace}.`,
        fragments: unique([...thought.fragments, `șoaptă ${trace}`]).slice(0, 6),
      };
    case "echo":
      return {
        ...thought,
        thought: `${thought.thought} Ecoul repetă structura până când devine recognoscibilă.`,
        keywords: unique([...thought.keywords, "echo", "repetition"]).slice(0, 8),
        visual: {
          ...thought.visual,
          convergence: clamp(thought.visual.convergence + 0.05, 0.45, 0.95),
        },
      };
    case "counterpoint":
      return {
        ...thought,
        thought: `${thought.thought} Un contra-punct deschide opoziția fără să rupă centrul.`,
        fragments: unique([...thought.fragments, "opoziție activă"]).slice(0, 6),
        visual: {
          ...thought.visual,
          drift: clamp(thought.visual.drift + 0.06, 0.25, 1.2),
        },
      };
    case "stain":
      return {
        ...thought,
        thought: `${thought.thought} Rămâne și o urmă de memorie depusă peste axa actuală.`,
        keywords: unique([...thought.keywords, "memory-trace"]).slice(0, 8),
        mood: `${thought.mood}, cu urmă persistentă`,
      };
    case "rupture":
      return {
        ...thought,
        thought: `${thought.thought} Ruptura forțează o nouă tensiune compozițională.`,
        fragments: unique([...thought.fragments, "ruptură controlată"]).slice(0, 6),
        visual: {
          ...thought.visual,
          fracture: clamp(thought.visual.fracture + 0.08, 0.18, 0.95),
        },
      };
  }
}

function rejectContamination(
  thought: ThoughtState,
  type: Exclude<ContaminationType, InfluenceMode | "none">,
) {
  const rationale =
    type === "noise"
      ? "noise contamination rejected to preserve recognizability"
      : type === "overload"
        ? "overload contamination rejected to prevent density collapse"
        : type === "collapse"
          ? "collapse contamination rejected because the thought would lose its axis"
          : "fragment contamination rejected because the field is already too fractured";

  return {
    thought: {
      ...thought,
      thought: `${thought.thought} Artist AI respinge ${type} pentru a păstra axa conceptuală.`,
    },
    rationale,
  };
}

export function applyContamination(
  input: ApplyContaminationInput,
): ApplyContaminationResult {
  const { thought, interference } = input;
  const contaminationType = selectContaminationType(input);

  if (contaminationType === "none") {
    return {
      thought,
      decision: {
        requestedMode: "none",
        appliedMode: "none",
        accepted: true,
        rationale: "no contamination selected for this cycle",
      },
      notes: ["apply contamination: idle"],
    };
  }

  if (
    contaminationType === "noise" ||
    contaminationType === "overload" ||
    contaminationType === "collapse" ||
    contaminationType === "fragment"
  ) {
    const rejected = rejectContamination(thought, contaminationType);
    return {
      thought: rejected.thought,
      decision: {
        requestedMode: contaminationType,
        appliedMode: "none",
        accepted: false,
        rationale: rejected.rationale,
      },
      notes: [`apply contamination: rejected ${contaminationType}`],
    };
  }

  const hasMatchingInterference =
    !interference || interference.influenceMode === contaminationType;

  if (!hasMatchingInterference) {
    return {
      thought,
      decision: {
        requestedMode: contaminationType,
        appliedMode: "none",
        accepted: false,
        rationale: `contamination ${contaminationType} was requested but no matching interference is active`,
      },
      notes: [`apply contamination: rejected ${contaminationType} because source is missing`],
    };
  }

  return {
    thought: applyPositiveContamination(thought, contaminationType, interference),
    decision: {
      requestedMode: contaminationType,
      appliedMode: contaminationType,
      accepted: true,
      rationale: `contamination ${contaminationType} is integrated into the current thought`,
    },
    notes: [`apply contamination: accepted ${contaminationType}`],
  };
}
