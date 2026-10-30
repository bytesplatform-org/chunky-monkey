import type { Metadata } from "next";
import ParkClient from "@/components/park/ParkClient";

export const metadata: Metadata = {
  title: "Park Tour",
  description: "A drone tour of Chunky Monkey: the gate, the Octopus, the Big Top, the roller coaster and the Ferris wheel.",
};

export default function ParkPage() {
  return <ParkClient />;
}
