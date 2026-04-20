import type { CSSProperties } from "react";
import type { ConceptExpression } from "@/lib/mindslice/mindslice-types";
import styles from "./concept-palette-visual.module.css";

type ConceptPaletteVisualProps = {
  expression: ConceptExpression | null | undefined;
  compositionBrief?: string | null;
  compact?: boolean;
};

function inferMotionVariant(motionMode: string) {
  const normalized = motionMode.toLowerCase();

  if (normalized.includes("fracture") || normalized.includes("sharp")) {
    return "fracture";
  }

  if (normalized.includes("drift") || normalized.includes("collision")) {
    return "drift";
  }

  if (normalized.includes("radial") || normalized.includes("convergence")) {
    return "radial";
  }

  return "hold";
}

export function ConceptPaletteVisual(props: ConceptPaletteVisualProps) {
  const { expression, compositionBrief, compact = false } = props;

  if (!expression?.palette) {
    return null;
  }

  const palette = expression.palette;
  const style = {
    "--background-color": palette.valueMap[0]?.replace("background:", "") ?? "#f0e6d8",
    "--ink-color": palette.valueMap[1]?.replace("ink:", "") ?? "#181411",
    "--dominant-color": palette.dominant,
    "--secondary-color": palette.secondary,
    "--accent-color": palette.accent,
  } as CSSProperties;

  return (
    <div
      className={`${styles.visual} ${compact ? styles.compact : ""}`}
      style={style}
      data-motion={inferMotionVariant(expression.motionMode)}
      aria-hidden="true"
    >
      <div className={styles.grain} />
      <div className={styles.halo} />
      <div className={styles.haloSecondary} />
      <div className={styles.axis} />
      <div className={styles.axisSecondary} />
      <div className={styles.wave} />

      <div className={styles.copy}>
        <span className={styles.marker}>Sistem cromatic</span>
        <p className={styles.signature}>{expression.visualSignature}</p>
        <p className={styles.brief}>
          {compositionBrief ?? palette.outputText}
        </p>
      </div>

      <div className={styles.chips}>
        {[palette.dominant, palette.secondary, palette.accent].map((tone) => (
          <span key={tone} className={styles.chip}>
            {tone}
          </span>
        ))}
      </div>
    </div>
  );
}
