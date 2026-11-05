import type { Metadata } from "next";
import ParkClient from "@/components/park/ParkClient";

export const metadata: Metadata = {
  title: "Park Tour",
  description: "A drone tour of Chunky Monkey: the gate, the Octopus, the drop tower, the roller coaster, the Ferris wheel, the bumper cars and the swing ride.",
};

export default function ParkPage() {
  return <ParkClient />;
}
