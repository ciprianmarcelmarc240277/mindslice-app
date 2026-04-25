export type SnapProfileStyleMode =
  | "CONTROL_CALM"
  | "DEVIATION"
  | "FRAGMENT"
  | "STRICT_GRID";

export type SnapProfileAlignment =
  | "soft_grid"
  | "partial_grid"
  | "broken_grid"
  | "strict_grid"
  | "stricter_grid"
  | "displaced_grid"
  | "constellation_grid";

export type SnapProfileRandomness = "none" | "low" | "medium" | "controlled";

export type SnapProfileElementRole = "primary" | "secondary" | "accent";

export type SnapProfileDefinition = {
  snap_strength: number;
  offset_primary: number;
  offset_secondary: number;
  offset_accent: number;
  alignment: SnapProfileAlignment;
  randomness: SnapProfileRandomness;
};

export type SnapProfileResult = {
  style_mode: SnapProfileStyleMode;
  conceptual_modes: string[];
  snap_strength: number;
  offset_range: number;
  alignment: SnapProfileAlignment;
  randomness: SnapProfileRandomness;
};

const PROFILES: Record<SnapProfileStyleMode, SnapProfileDefinition> = {
  CONTROL_CALM: {
    snap_strength: 0.85,
    offset_primary: 20,
    offset_secondary: 12,
    offset_accent: 6,
    alignment: "soft_grid",
    randomness: "low",
  },
  DEVIATION: {
    snap_strength: 0.6,
    offset_primary: 45,
    offset_secondary: 25,
    offset_accent: 12,
    alignment: "partial_grid",
    randomness: "medium",
  },
  FRAGMENT: {
    snap_strength: 0.35,
    offset_primary: 70,
    offset_secondary: 45,
    offset_accent: 20,
    alignment: "broken_grid",
    randomness: "controlled",
  },
  STRICT_GRID: {
    snap_strength: 1,
    offset_primary: 0,
    offset_secondary: 0,
    offset_accent: 0,
    alignment: "strict_grid",
    randomness: "none",
  },
};

function clamp(value: number, min: number, max: number) {
  if (value < min) {
    return min;
  }

  if (value > max) {
    return max;
  }

  return value;
}

function resolveBaseProfile(style_mode: SnapProfileStyleMode | null | undefined) {
  if (style_mode && style_mode in PROFILES) {
    return { ...PROFILES[style_mode] };
  }

  return { ...PROFILES.CONTROL_CALM };
}

function clampProfile(profile: SnapProfileDefinition): SnapProfileDefinition {
  return {
    ...profile,
    snap_strength: clamp(profile.snap_strength, 0, 1),
    offset_primary: Math.max(profile.offset_primary, 0),
    offset_secondary: Math.max(profile.offset_secondary, 0),
    offset_accent: Math.max(profile.offset_accent, 0),
  };
}

function applyConceptualModifiers(
  profile: SnapProfileDefinition,
  conceptual_modes: string[],
): SnapProfileDefinition {
  const nextProfile = { ...profile };

  conceptual_modes.forEach((mode) => {
    if (mode === "Swiss Typography") {
      nextProfile.snap_strength += 0.1;
      nextProfile.offset_primary -= 5;
      nextProfile.offset_secondary -= 5;
      nextProfile.alignment = "stricter_grid";
    }

    if (mode === "Duchamp") {
      nextProfile.snap_strength -= 0.1;
      nextProfile.offset_primary += 15;
      nextProfile.alignment = "displaced_grid";
    }

    if (mode === "Derrida") {
      nextProfile.snap_strength -= 0.2;
      nextProfile.offset_secondary += 20;
      nextProfile.alignment = "broken_grid";
    }

    if (mode === "Warburg") {
      nextProfile.snap_strength -= 0.05;
      nextProfile.offset_secondary += 10;
      nextProfile.alignment = "constellation_grid";
    }

    if (mode === "Attention") {
      nextProfile.offset_accent += 5;
      nextProfile.snap_strength += 0.05;
    }
  });

  return clampProfile(nextProfile);
}

function getRoleOffset(
  profile: SnapProfileDefinition,
  element_role: SnapProfileElementRole,
) {
  if (element_role === "primary") {
    return profile.offset_primary;
  }

  if (element_role === "accent") {
    return profile.offset_accent;
  }

  return profile.offset_secondary;
}

export function runSnapProfileSystemV1(
  style_mode: SnapProfileStyleMode | null | undefined,
  conceptual_modes: string[] = [],
  element_role: SnapProfileElementRole = "secondary",
): SnapProfileResult {
  const resolvedStyleMode =
    style_mode && style_mode in PROFILES ? style_mode : "CONTROL_CALM";
  let profile = resolveBaseProfile(resolvedStyleMode);
  profile = applyConceptualModifiers(profile, conceptual_modes);

  return {
    style_mode: resolvedStyleMode,
    conceptual_modes,
    snap_strength: profile.snap_strength,
    offset_range: getRoleOffset(profile, element_role),
    alignment: profile.alignment,
    randomness: profile.randomness,
  };
}
