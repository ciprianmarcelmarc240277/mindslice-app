import type { CSSProperties } from "react";
import type { ConceptExpression } from "@/lib/mindslice/mindslice-types";
import styles from "./concept-art-composition-visual.module.css";

type ConceptArtCompositionVisualProps = {
  expression: ConceptExpression | null | undefined;
  compact?: boolean;
};

function inferLayoutVariant(compositionMode: string) {
  const normalized = compositionMode.toLowerCase();

  if (normalized.includes("contaminated")) {
    return "contaminated";
  }

  if (normalized.includes("field")) {
    return "field";
  }

  return "base";
}

export function ConceptArtCompositionVisual(props: ConceptArtCompositionVisualProps) {
  const { expression, compact = false } = props;

  if (!expression?.artComposition || !expression.palette) {
    return null;
  }

  const composition = expression.artComposition;
  const palette = expression.palette;
  const style = {
    "--composition-bg": palette.valueMap[0]?.replace("background:", "") ?? "#f4ede2",
    "--composition-ink": palette.valueMap[1]?.replace("ink:", "") ?? "#1a1613",
    "--composition-accent": palette.accent,
    "--composition-secondary": palette.secondary,
  } as CSSProperties;

  return (
    <div
      className={`${styles.visual} ${compact ? styles.compact : ""}`}
      style={style}
      data-layout={inferLayoutVariant(expression.compositionMode)}
      aria-hidden="true"
    >
      <div className={styles.grid} />
      <div className={styles.massPrimary} />
      <div className={styles.massSecondary} />
      <div className={styles.pathPrimary} />
      <div className={styles.pathSecondary} />
      <div className={styles.focusNode}>
        <span>{composition.focusNode}</span>
      </div>

      <div className={styles.copy}>
        <span className={styles.marker}>Sistem compozițional</span>
        <p className={styles.signature}>{expression.compositionMode}</p>
        <p className={styles.brief}>{composition.outputText}</p>
      </div>

      <div className={styles.metrics}>
        {[
          composition.unityMap[0] ?? "unity",
          composition.balanceMap[0] ?? "balance",
          composition.rhythmMap[0] ?? "rhythm",
        ].map((item) => (
          <span key={item} className={styles.metric}>
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
