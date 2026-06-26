"use client";

import { useState, type ReactNode } from "react";

type Props = {
  title: string;
  summary?: string;
  defaultOpen?: boolean;
  children: ReactNode;
  className?: string;
};

export function ExpandableSection({
  title,
  summary,
  defaultOpen = false,
  children,
  className = "",
}: Props) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className={`expandable${open ? " open" : ""}${className ? ` ${className}` : ""}`}>
      <button
        type="button"
        className="expandableTrigger"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className="expandableTriggerText">
          <span className="expandableTitle">{title}</span>
          {summary && !open ? <span className="expandableSummary">{summary}</span> : null}
        </span>
        <span className="expandableChevron" aria-hidden>
          {open ? "−" : "+"}
        </span>
      </button>
      {open ? <div className="expandableBody">{children}</div> : null}
    </section>
  );
}
