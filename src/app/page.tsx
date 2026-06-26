import { Suspense } from "react";
import HomeClient from "./HomeClient";

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="authGate">
          <div className="authCard">
            <div className="logo">CM</div>
            <p className="muted">Loading…</p>
          </div>
        </div>
      }
    >
      <HomeClient />
    </Suspense>
  );
}
