import type { CSSProperties } from "react";

import { SectionHead } from "@/components/landing/SectionHead";
import { CLAIM, FACTS, SYNOPSIS } from "@/lib/landing-content";

export function TheCase() {
  return (
    <section className="section wrap" id="el-caso" style={{ "--accent": "var(--teal)" } as CSSProperties}>
      <SectionHead n={1} title="El caso" />
      <div className="prose reveal">
        {SYNOPSIS.map((p) => (
          <p key={p}>{p}</p>
        ))}
      </div>
      <p className="display claim reveal">{CLAIM}</p>
      <ul className="facts reveal">
        {FACTS.map((f) => (
          <li key={f}>{f}</li>
        ))}
      </ul>
    </section>
  );
}
