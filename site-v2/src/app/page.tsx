import { Disambiguation } from "@/components/sections/Disambiguation";
import { Hero } from "@/components/sections/Hero";
import { Positioning } from "@/components/sections/Positioning";
import { Principles } from "@/components/sections/Principles";
import { Problem } from "@/components/sections/Problem";
import { Protocol } from "@/components/sections/Protocol";
import { ReviewersWanted } from "@/components/sections/ReviewersWanted";
import { Simulator } from "@/components/sections/Simulator";
import { Whitepaper } from "@/components/sections/Whitepaper";

// Landing assembly. Narrative order matters:
//   1. Hero            — what MonAI is, one line
//   2. Problem         — why anyone should care (concrete pain MonAI solves)
//   3. Disambiguation  — what MonAI is NOT, before the visitor mis-frames it
//   4. Positioning     — where MonAI sits vs the four closest neighbours
//   5. Protocol        — the three co-designed layers
//   6. Principles      — the six non-negotiables
//   7. Whitepaper      — reputation as a first-class protocol object
//   8. Simulator       — honest empirical verdict
//   9. ReviewersWanted — call to peer reviewers / GitHub
//
// Section IDs must stay in sync with `src/components/layout/nav-items.ts`.
// No dated roadmap section: it returns once a real timeline is arbitrated.
export default function Home() {
  return (
    <>
      <Hero />
      <Problem />
      <Disambiguation />
      <Positioning />
      <Protocol />
      <Principles />
      <Whitepaper />
      <Simulator />
      <ReviewersWanted />
    </>
  );
}
