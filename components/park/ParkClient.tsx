"use client";

import dynamic from "next/dynamic";
import ParkLoader from "./ParkLoader";

// WebGL only exists in the browser: load the whole experience there, and keep
// three, R3F and drei out of the page's first bundle.
const ParkExperience = dynamic(() => import("./ParkExperience"), {
  ssr: false,
  loading: () => <ParkLoader progress={0} />,
});

export default function ParkClient() {
  return <ParkExperience />;
}
