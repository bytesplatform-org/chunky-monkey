import type { Metadata } from "next";
import ArcadeClient from "@/components/arcade/ArcadeClient";

export const metadata: Metadata = {
  title: "Arcade",
  description: "Walk the Chunky Monkey arcade in first person: the lobby, the machine aisle and the bumper car arena.",
};

export default function ArcadePage() {
  return <ArcadeClient />;
}
