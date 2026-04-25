export type PhotographyIntention =
  | "documentary"
  | "artistic"
  | "commercial"
  | "cinematic"
  | "portrait"
  | "fashion"
  | "product"
  | "abstract";

export type PhotographyTheorySystemInput = {
  subject?: string | null;
  light?: string | null;
  camera_position?: string | null;
  lens?: string | null;
  framing?: string | null;
  exposure?: string | null;
  color?: string | null;
  texture?: string | null;
  motion?: string | null;
  intention?: string | null;
  viewer_attention?: string | null;
};

export type PhotographyTheorySystemOutput = {
  visual_reading: {
    intention: PhotographyIntention;
    light_logic: string;
    composition_logic: string;
    perspective_logic: string;
    color_logic: string;
    meaning_logic: string;
  };
  technical_diagnosis: {
    lens_language: string;
    exposure_logic: string;
    time_logic: string;
    texture_logic: string;
    coherence: "image_is_coherent" | "image_needs_refinement";
  };
  emotional_effect: {
    mood: string;
    attention_path: string;
    narrative_hint: string;
    memory_anchor: string;
  };
  composition_score: number;
  advertising_potential: {
    score: number;
    brand_alignment: string;
    attention_strength: string;
  };
};

function normalizeText(value: string | null | undefined) {
  return (value ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function score(tokens: string, candidates: string[]) {
  return candidates.reduce((total, candidate) => {
    return total + (tokens.includes(candidate) ? 1 : 0);
  }, 0);
}

function resolveIntention(input: PhotographyTheorySystemInput): PhotographyIntention {
  const corpus = [
    input.subject,
    input.intention,
    input.viewer_attention,
    input.framing,
    input.motion,
  ]
    .map(normalizeText)
    .join(" ");

  const scores: Record<PhotographyIntention, number> = {
    documentary: score(corpus, ["documentary", "truth", "reportage", "evidence"]),
    artistic: score(corpus, ["artistic", "poetic", "conceptual", "atmosphere"]),
    commercial: score(corpus, ["commercial", "brand", "campaign", "promotion"]),
    cinematic: score(corpus, ["cinematic", "scene", "film", "dramatic"]),
    portrait: score(corpus, ["portrait", "face", "person", "identity"]),
    fashion: score(corpus, ["fashion", "style", "editorial", "garment"]),
    product: score(corpus, ["product", "object", "packshot", "detail"]),
    abstract: score(corpus, ["abstract", "texture", "shape", "gesture"]),
  };

  const ranked = Object.entries(scores).sort((left, right) => right[1] - left[1]);
  const top = ranked[0];

  if (!top || top[1] <= 0) {
    return "artistic";
  }

  return top[0] as PhotographyIntention;
}

function analyzeLight(light: string | null | undefined) {
  const corpus = normalizeText(light);
  const direction =
    corpus.includes("back") ? "backlit" :
    corpus.includes("side") ? "side-lit" :
    corpus.includes("top") ? "top-lit" :
    "front_or_ambient";
  const softness =
    corpus.includes("soft") || corpus.includes("diffuse") ? "soft" :
    corpus.includes("hard") ? "hard" :
    "moderate";
  const contrast =
    corpus.includes("high contrast") || corpus.includes("dramatic") ? "high contrast" :
    corpus.includes("flat") ? "low contrast" :
    "balanced contrast";
  const temperature =
    corpus.includes("warm") ? "warm" :
    corpus.includes("cold") || corpus.includes("cool") ? "cool" :
    "neutral";

  return `${direction}, ${softness}, ${contrast}, ${temperature}`;
}

function analyzeComposition(framing: string | null | undefined, viewerAttention: string | null | undefined) {
  const corpus = `${normalizeText(framing)} ${normalizeText(viewerAttention)}`;
  const thirds = corpus.includes("third") ? "rule_of_thirds" : "free_balance";
  const balance = corpus.includes("symmetry") ? "symmetry" : "asymmetric balance";
  const space = corpus.includes("negative") || corpus.includes("space") ? "negative_space active" : "space compact";
  const focus = corpus.includes("focus") || corpus.includes("subject") ? "focal_point reinforced" : "distributed attention";

  return `${thirds}, ${balance}, ${space}, ${focus}`;
}

function analyzePerspective(cameraPosition: string | null | undefined, lens: string | null | undefined) {
  const position = normalizeText(cameraPosition);
  const optic = normalizeText(lens);

  const angle =
    position.includes("low") ? "low_angle" :
    position.includes("high") ? "high_angle" :
    position.includes("close") ? "close_up" :
    position.includes("wide") ? "wide_shot" :
    "eye_level";

  const lensLanguage =
    optic.includes("tele") ? "compression + isolation" :
    optic.includes("macro") ? "detail + intimacy" :
    optic.includes("wide") ? "space + distortion + proximity" :
    "natural_perception";

  return { angle, lensLanguage };
}

function analyzeExposure(exposure: string | null | undefined, motion: string | null | undefined) {
  const corpus = `${normalizeText(exposure)} ${normalizeText(motion)}`;
  const depth =
    corpus.includes("shallow") || corpus.includes("wide aperture") ? "shallow depth of field" :
    corpus.includes("deep") || corpus.includes("closed aperture") ? "deep depth of field" :
    "moderate depth of field";
  const shutter =
    corpus.includes("blur") || corpus.includes("long exposure") ? "motion-preserving shutter" :
    corpus.includes("freeze") || corpus.includes("fast shutter") ? "motion-freezing shutter" :
    "balanced shutter";
  const sensitivity =
    corpus.includes("noise") || corpus.includes("high iso") ? "high sensitivity / visible noise" :
    corpus.includes("clean") || corpus.includes("low iso") ? "clean sensitivity" :
    "moderate sensitivity";

  return `${depth}, ${shutter}, ${sensitivity}`;
}

function analyzeTime(motion: string | null | undefined) {
  const corpus = normalizeText(motion);

  if (corpus.includes("long exposure")) {
    return "long_exposure";
  }

  if (corpus.includes("blur")) {
    return "motion_blur";
  }

  if (corpus.includes("decisive")) {
    return "decisive_moment";
  }

  if (corpus.includes("freeze") || corpus.includes("frozen")) {
    return "frozen_moment";
  }

  return "rhythm_of_sequence";
}

function analyzeColor(color: string | null | undefined, intention: PhotographyIntention) {
  const corpus = normalizeText(color);
  const harmony =
    corpus.includes("monochrome") ? "monochrome harmony" :
    corpus.includes("contrast") ? "high color contrast" :
    "moderate harmony";
  const temperature =
    corpus.includes("warm") ? "warm mood" :
    corpus.includes("cool") || corpus.includes("cold") ? "cool mood" :
    "neutral mood";
  const saturation =
    corpus.includes("muted") ? "muted saturation" :
    corpus.includes("vivid") ? "vivid saturation" :
    "balanced saturation";
  const brandIdentity =
    intention === "commercial" || intention === "fashion" || intention === "product"
      ? "brand_identity relevant"
      : "brand_identity secondary";

  return `${harmony}, ${temperature}, ${saturation}, ${brandIdentity}`;
}

function analyzeMeaning(input: PhotographyTheorySystemInput) {
  const literal_subject = input.subject ?? "unstated subject";
  const symbolic_layer = input.intention ?? "open symbolic layer";
  const emotional_charge = input.light ?? "ambient emotional charge";
  const narrative_hint = input.motion ?? input.camera_position ?? "still narrative";
  const memory_anchor = input.viewer_attention ?? input.framing ?? "lingering focal trace";

  return {
    literal_subject,
    symbolic_layer,
    emotional_charge,
    narrative_hint,
    memory_anchor,
  };
}

function computeCompositionScore(input: PhotographyTheorySystemInput) {
  let scoreValue = 0;
  const light = normalizeText(input.light);
  const framing = normalizeText(input.framing);
  const camera = normalizeText(input.camera_position);
  const exposure = normalizeText(input.exposure);
  const attention = normalizeText(input.viewer_attention);

  if (light) scoreValue += 2;
  if (framing) scoreValue += 2;
  if (camera) scoreValue += 1;
  if (exposure) scoreValue += 2;
  if (attention) scoreValue += 2;
  if (framing.includes("third") || framing.includes("symmetry") || framing.includes("negative")) scoreValue += 1;

  return Math.max(0, Math.min(10, scoreValue));
}

function computeAdvertisingPotential(
  intention: PhotographyIntention,
  input: PhotographyTheorySystemInput,
) {
  let scoreValue = 2;
  const attention = normalizeText(input.viewer_attention);
  const color = normalizeText(input.color);
  const subject = normalizeText(input.subject);

  if (["commercial", "fashion", "product"].includes(intention)) {
    scoreValue += 4;
  }

  if (attention.includes("focus") || attention.includes("brand") || attention.includes("subject")) {
    scoreValue += 2;
  }

  if (color.includes("contrast") || color.includes("vivid")) {
    scoreValue += 1;
  }

  if (subject.includes("object") || subject.includes("product") || subject.includes("face")) {
    scoreValue += 1;
  }

  const clampedScore = Math.max(0, Math.min(10, scoreValue));

  return {
    score: clampedScore,
    brand_alignment: clampedScore >= 7 ? "strong" : clampedScore >= 4 ? "moderate" : "limited",
    attention_strength: clampedScore >= 7 ? "high" : clampedScore >= 4 ? "medium" : "low",
  };
}

function validateImage(
  lightLogic: string,
  compositionLogic: string,
  perspectiveLogic: string,
  exposureLogic: string,
  meaning: ReturnType<typeof analyzeMeaning>,
) {
  const conditions = [
    lightLogic.length > 0,
    compositionLogic.includes("focal_point") || compositionLogic.includes("focus"),
    perspectiveLogic.length > 0,
    exposureLogic.length > 0,
    Boolean(meaning.emotional_charge || meaning.symbolic_layer),
  ];

  const satisfied = conditions.filter(Boolean).length;

  return satisfied >= 4 ? "image_is_coherent" : "image_needs_refinement";
}

export function runPhotographyTheorySystem(
  input: PhotographyTheorySystemInput,
): PhotographyTheorySystemOutput {
  const intention = resolveIntention(input);
  const lightLogic = analyzeLight(input.light);
  const compositionLogic = analyzeComposition(input.framing, input.viewer_attention);
  const perspective = analyzePerspective(input.camera_position, input.lens);
  const exposureLogic = analyzeExposure(input.exposure, input.motion);
  const timeLogic = analyzeTime(input.motion);
  const colorLogic = analyzeColor(input.color, intention);
  const meaning = analyzeMeaning(input);
  const composition_score = computeCompositionScore(input);
  const advertising_potential = computeAdvertisingPotential(intention, input);
  const coherence = validateImage(
    lightLogic,
    compositionLogic,
    `${perspective.angle}, ${perspective.lensLanguage}`,
    exposureLogic,
    meaning,
  );

  return {
    visual_reading: {
      intention,
      light_logic: lightLogic,
      composition_logic: compositionLogic,
      perspective_logic: `${perspective.angle}, ${perspective.lensLanguage}`,
      color_logic: colorLogic,
      meaning_logic: `${meaning.literal_subject}; ${meaning.symbolic_layer}; ${meaning.emotional_charge}`,
    },
    technical_diagnosis: {
      lens_language: perspective.lensLanguage,
      exposure_logic: exposureLogic,
      time_logic: timeLogic,
      texture_logic: input.texture ?? "texture not foregrounded",
      coherence,
    },
    emotional_effect: {
      mood: `${lightLogic}; ${colorLogic}`,
      attention_path: input.viewer_attention ?? "eye led by subject and contrast",
      narrative_hint: meaning.narrative_hint,
      memory_anchor: meaning.memory_anchor,
    },
    composition_score,
    advertising_potential,
  };
}
