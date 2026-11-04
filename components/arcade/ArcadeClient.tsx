"use client";

import dynamic from "next/dynamic";
import ArcadeLoader from "./ArcadeLoader";

// WebGL only exists in the browser: load the whole experience there, and keep
// three, R3F and drei out of the page's first bundle.
const ArcadeExperience = dynamic(() => import("./ArcadeExperience"), {
  ssr: false,
  loading: () => <ArcadeLoader progress={0} />,
});

export default function ArcadeClient() {
  return <ArcadeExperience />;
}
