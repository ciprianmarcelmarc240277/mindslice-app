export type ArtMovement =
  | "RENAISSANCE"
  | "BAROQUE"
  | "ROCOCO"
  | "NEOCLASSICISM"
  | "ROMANTICISM"
  | "REALISM"
  | "IMPRESSIONISM"
  | "CUBISM"
  | "EXPRESSIONISM"
  | "SURREALISM"
  | "FUTURISM"
  | "DADAISM"
  | "MODERNISM"
  | "POSTMODERNISM";

export type ArtMovementsSystemInput = {
  historical_period?: string | null;
  technology_level?: string | null;
  philosophy?: string | null;
  social_tension?: string | null;
  artist_intention?: string | null;
  visual_language?: string[];
};

export type ArtMovementLogic = {
  perception: string;
  form: string;
  goal: string;
};

export type ArtMovementsSystemOutput = {
  movement_identification: ArtMovement;
  visual_logic: string;
  perception_model: string;
  artistic_intent: string;
};

const MOVEMENT_LOGIC: Record<ArtMovement, ArtMovementLogic> = {
  RENAISSANCE: {
    perception: "world_as_order",
    form: "proportion + perspective",
    goal: "harmony_between_man_and_universe",
  },
  BAROQUE: {
    perception: "world_as_drama",
    form: "contrast + movement + chiaroscuro",
    goal: "emotional_impact",
  },
  ROCOCO: {
    perception: "world_as_ornament",
    form: "lightness + pleasure + decorative asymmetry",
    goal: "sensory_delight",
  },
  NEOCLASSICISM: {
    perception: "world_as_reasoned_order",
    form: "clarity + restraint + antique reference",
    goal: "moral_and_formal_clarity",
  },
  ROMANTICISM: {
    perception: "world_as_sublime_feeling",
    form: "intensity + atmosphere + gesture",
    goal: "express_inner_and_natural_force",
  },
  REALISM: {
    perception: "world_as_observed_condition",
    form: "detail + social description + grounded space",
    goal: "render_social_truth",
  },
  IMPRESSIONISM: {
    perception: "world_as_light",
    form: "broken_color + loose_brush",
    goal: "capture_moment",
  },
  CUBISM: {
    perception: "world_as_structure",
    form: "fragmentation + geometry",
    goal: "multiple_viewpoints",
  },
  EXPRESSIONISM: {
    perception: "world_as_inner_pressure",
    form: "distortion + heightened mark + emotional color",
    goal: "externalize_inner_state",
  },
  SURREALISM: {
    perception: "world_as_dream",
    form: "irrational_composition",
    goal: "access_subconscious",
  },
  FUTURISM: {
    perception: "world_as_velocity",
    form: "machine rhythm + force lines + acceleration",
    goal: "glorify_motion_and_future",
  },
  DADAISM: {
    perception: "world_as_absurd",
    form: "anti_form",
    goal: "destroy_meaning",
  },
  MODERNISM: {
    perception: "world_as_construct",
    form: "reduction + abstraction",
    goal: "purity_of_form",
  },
  POSTMODERNISM: {
    perception: "world_as_simulation",
    form: "collage + remix",
    goal: "question_everything",
  },
};

function normalizeText(value: string | null | undefined) {
  return (value ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function joined(input: ArtMovementsSystemInput) {
  return [
    normalizeText(input.historical_period),
    normalizeText(input.technology_level),
    normalizeText(input.philosophy),
    normalizeText(input.social_tension),
    normalizeText(input.artist_intention),
    ...(input.visual_language ?? []).map(normalizeText),
  ].join(" ");
}

function score(tokens: string, candidates: string[]) {
  return candidates.reduce((total, candidate) => {
    return total + (tokens.includes(candidate) ? 1 : 0);
  }, 0);
}

function identifyMovement(input: ArtMovementsSystemInput): ArtMovement {
  const corpus = joined(input);

  const movementScores: Record<ArtMovement, number> = {
    RENAISSANCE: score(corpus, ["harmony", "ideal", "proportion", "order", "perspective"]),
    BAROQUE: score(corpus, ["drama", "contrast", "movement", "tension", "chiaroscuro"]),
    ROCOCO: score(corpus, ["light", "pleasure", "ornament", "spontaneity", "decorative"]),
    NEOCLASSICISM: score(corpus, ["reason", "clarity", "antiquity", "restraint", "classical"]),
    ROMANTICISM: score(corpus, ["emotion", "sublime", "nature", "individualism", "imagination"]),
    REALISM: score(corpus, ["observation", "reality", "social", "truth", "detail"]),
    IMPRESSIONISM: score(corpus, ["light effect", "light", "moment", "perception", "atmosphere"]),
    CUBISM: score(corpus, ["structure", "geometry", "multiple perspectives", "fragmentation", "plane"]),
    EXPRESSIONISM: score(corpus, ["distortion", "inner state", "emotional", "pressure", "gesture"]),
    SURREALISM: score(corpus, ["dream", "subconscious", "irrational", "uncanny", "automatic"]),
    FUTURISM: score(corpus, ["speed", "machine", "future", "aggression", "velocity"]),
    DADAISM: score(corpus, ["anti-art", "absurd", "negation", "anti form", "nonsense"]),
    MODERNISM: score(corpus, ["simplicity", "abstraction", "function", "reduction", "purity"]),
    POSTMODERNISM: score(corpus, ["irony", "mix styles", "simulation", "collage", "remix"]),
  };

  const ranked = Object.entries(movementScores).sort((left, right) => right[1] - left[1]);
  const top = ranked[0];

  if (!top || top[1] <= 0) {
    return "MODERNISM";
  }

  return top[0] as ArtMovement;
}

function buildVisualLogic(
  movement: ArtMovement,
  input: ArtMovementsSystemInput,
) {
  const period = input.historical_period ?? "unspecified period";
  const philosophy = input.philosophy ?? "unstated philosophy";
  const tension = input.social_tension ?? "unstated social tension";

  switch (movement) {
    case "RENAISSANCE":
      return `Order, ideal proportion and perspective dominate in ${period}, translating ${philosophy} into balanced visual harmony against ${tension}.`;
    case "BAROQUE":
      return `Drama, contrast and movement dominate in ${period}, translating ${philosophy} into forceful emotional staging against ${tension}.`;
    case "ROCOCO":
      return `Lightness, pleasure and ornament dominate in ${period}, translating ${philosophy} into decorative play against ${tension}.`;
    case "NEOCLASSICISM":
      return `Reason, clarity and antique restraint dominate in ${period}, translating ${philosophy} into disciplined order against ${tension}.`;
    case "ROMANTICISM":
      return `Emotion, nature and individual force dominate in ${period}, translating ${philosophy} into sublime intensity against ${tension}.`;
    case "REALISM":
      return `Observation, reality and social truth dominate in ${period}, translating ${philosophy} into grounded visual testimony against ${tension}.`;
    case "IMPRESSIONISM":
      return `Light, moment and perception dominate in ${period}, translating ${philosophy} into atmospheric immediacy against ${tension}.`;
    case "CUBISM":
      return `Structure, geometry and multiple viewpoints dominate in ${period}, translating ${philosophy} into analytic fragmentation against ${tension}.`;
    case "EXPRESSIONISM":
      return `Distortion, intensity and inner state dominate in ${period}, translating ${philosophy} into emotional pressure against ${tension}.`;
    case "SURREALISM":
      return `Dream, subconscious and irrational association dominate in ${period}, translating ${philosophy} into psychic displacement against ${tension}.`;
    case "FUTURISM":
      return `Speed, machine force and future-oriented aggression dominate in ${period}, translating ${philosophy} into acceleration against ${tension}.`;
    case "DADAISM":
      return `Absurdity, negation and anti-art dominate in ${period}, translating ${philosophy} into destructive irony against ${tension}.`;
    case "POSTMODERNISM":
      return `Irony, style-mixing and simulation dominate in ${period}, translating ${philosophy} into remix and quotation against ${tension}.`;
    case "MODERNISM":
    default:
      return `Reduction, abstraction and function dominate in ${period}, translating ${philosophy} into purified form against ${tension}.`;
  }
}

export function runArtMovementsSystem(
  input: ArtMovementsSystemInput,
): ArtMovementsSystemOutput {
  const movement_identification = identifyMovement(input);
  const movementLogic = MOVEMENT_LOGIC[movement_identification];

  return {
    movement_identification,
    visual_logic: buildVisualLogic(movement_identification, input),
    perception_model: movementLogic.perception,
    artistic_intent: movementLogic.goal,
  };
}
