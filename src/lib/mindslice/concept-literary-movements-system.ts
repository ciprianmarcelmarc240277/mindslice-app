export type LiteraryMovement =
  | "CLASSICISM"
  | "ROMANTICISM"
  | "REALISM"
  | "NATURALISM"
  | "SYMBOLISM"
  | "AVANT_GARDE"
  | "MODERNISM"
  | "POSTMODERNISM";

export type LiteraryMovementsSystemInput = {
  historical_period?: string | null;
  social_context?: string | null;
  dominant_values?: string[];
  author_intention?: string | null;
  literary_form?: string | null;
  language_style?: string | null;
  themes?: string[];
  character_type?: string | null;
  reality_model?: string | null;
};

export type LiteraryMovementLogic = {
  values: string[];
  character: string;
  style: string;
  reality_model: string;
};

export type LiteraryMovementsSystemOutput = {
  movement_identification: LiteraryMovement;
  historical_logic: string;
  style_profile: {
    values: string[];
    style: string;
    literary_form: string | null;
    language_style: string | null;
  };
  narrative_strategy: {
    character_type: string;
    themes: string[];
    reality_model: string;
    author_intention: string | null;
  };
  worldview: string;
};

const MOVEMENT_LOGIC: Record<LiteraryMovement, LiteraryMovementLogic> = {
  CLASSICISM: {
    values: ["order", "clarity", "balance", "reason"],
    character: "universal_type",
    style: "controlled, symmetrical, normative",
    reality_model: "idealized_order",
  },
  ROMANTICISM: {
    values: ["emotion", "imagination", "freedom", "nature"],
    character: "exceptional_individual",
    style: "expressive, intense, subjective",
    reality_model: "world_as_mystery",
  },
  REALISM: {
    values: ["observation", "society", "causality", "detail"],
    character: "social_individual",
    style: "precise, descriptive, objective",
    reality_model: "world_as_social_structure",
  },
  NATURALISM: {
    values: ["determinism", "biology", "environment", "heredity"],
    character: "conditioned_being",
    style: "clinical, harsh, documentary",
    reality_model: "world_as_experiment",
  },
  SYMBOLISM: {
    values: ["suggestion", "mystery", "music", "correspondence"],
    character: "sensitive_consciousness",
    style: "metaphorical, musical, indirect",
    reality_model: "visible_world_hides_invisible_meaning",
  },
  AVANT_GARDE: {
    values: ["rupture", "anti-tradition", "speed", "experiment"],
    character: "destabilized_subject",
    style: "collage, shock, absurdity, manifesto",
    reality_model: "world_must_be_broken_and_rebuilt",
  },
  MODERNISM: {
    values: ["consciousness", "ambiguity", "fragmentation", "depth"],
    character: "interior_subject",
    style: "complex, experimental, layered",
    reality_model: "reality_filtered_by_mind",
  },
  POSTMODERNISM: {
    values: ["irony", "quotation", "game", "plurality"],
    character: "constructed_identity",
    style: "hybrid, intertextual, self-aware",
    reality_model: "reality_as_text_and_simulation",
  },
};

function normalizeText(value: string | null | undefined) {
  return (value ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function joined(input: LiteraryMovementsSystemInput) {
  return [
    normalizeText(input.historical_period),
    normalizeText(input.social_context),
    normalizeText(input.author_intention),
    normalizeText(input.literary_form),
    normalizeText(input.language_style),
    normalizeText(input.character_type),
    normalizeText(input.reality_model),
    ...(input.dominant_values ?? []).map(normalizeText),
    ...(input.themes ?? []).map(normalizeText),
  ].join(" ");
}

function score(tokens: string, candidates: string[]) {
  return candidates.reduce((total, candidate) => {
    return total + (tokens.includes(candidate) ? 1 : 0);
  }, 0);
}

function identifyMovement(input: LiteraryMovementsSystemInput): LiteraryMovement {
  const corpus = joined(input);

  const movementScores: Record<LiteraryMovement, number> = {
    CLASSICISM: score(corpus, ["order", "reason", "clarity", "rules", "balance", "normative"]),
    ROMANTICISM: score(corpus, ["emotion", "nature", "individual", "soul", "freedom", "mystery"]),
    REALISM: score(corpus, ["reality", "society", "observation", "detail", "causality", "social"]),
    NATURALISM: score(corpus, ["determinism", "heredity", "environment", "biology", "clinical"]),
    SYMBOLISM: score(corpus, ["symbol", "suggestion", "musicality", "mystery", "correspondence"]),
    AVANT_GARDE: score(corpus, ["rupture", "experiment", "speed", "shock", "manifesto", "anti-tradition"]),
    MODERNISM: score(corpus, ["interiority", "fragmentation", "ambiguity", "depth", "consciousness"]),
    POSTMODERNISM: score(corpus, ["irony", "intertextuality", "play", "relativism", "quotation", "simulation"]),
  };

  const ranked = Object.entries(movementScores).sort((left, right) => right[1] - left[1]);
  const top = ranked[0];

  if (!top || top[1] <= 0) {
    return "MODERNISM";
  }

  return top[0] as LiteraryMovement;
}

function historicalLogic(
  movement: LiteraryMovement,
  input: LiteraryMovementsSystemInput,
) {
  const period = input.historical_period ?? "unspecified period";
  const social = input.social_context ?? "unstated social field";

  switch (movement) {
    case "CLASSICISM":
      return `Order, reason and rule-driven form dominate in ${period}, reacting to ${social} through clarity and balance.`;
    case "ROMANTICISM":
      return `Emotion, nature and singular inwardness dominate in ${period}, reacting to ${social} through expressive freedom.`;
    case "REALISM":
      return `Observation, society and causal detail dominate in ${period}, reacting to ${social} through lucid social description.`;
    case "NATURALISM":
      return `Determinism, heredity and environment dominate in ${period}, reacting to ${social} through documentary harshness.`;
    case "SYMBOLISM":
      return `Suggestion, mystery and musicality dominate in ${period}, reacting to ${social} by seeking invisible meaning behind surfaces.`;
    case "AVANT_GARDE":
      return `Rupture, speed and experiment dominate in ${period}, reacting to ${social} by breaking inherited artistic rules.`;
    case "POSTMODERNISM":
      return `Irony, plurality and textual play dominate in ${period}, reacting to ${social} through self-aware simulation and quotation.`;
    case "MODERNISM":
    default:
      return `Interiority, fragmentation and ambiguity dominate in ${period}, reacting to ${social} through layered consciousness.`;
  }
}

export function runLiteraryMovementsSystem(
  input: LiteraryMovementsSystemInput,
): LiteraryMovementsSystemOutput {
  const movement_identification = identifyMovement(input);
  const movementLogic = MOVEMENT_LOGIC[movement_identification];

  return {
    movement_identification,
    historical_logic: historicalLogic(movement_identification, input),
    style_profile: {
      values: movementLogic.values,
      style: movementLogic.style,
      literary_form: input.literary_form ?? null,
      language_style: input.language_style ?? null,
    },
    narrative_strategy: {
      character_type: input.character_type ?? movementLogic.character,
      themes: input.themes ?? [],
      reality_model: input.reality_model ?? movementLogic.reality_model,
      author_intention: input.author_intention ?? null,
    },
    worldview: movementLogic.reality_model,
  };
}
