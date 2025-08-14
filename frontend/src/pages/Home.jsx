import React from "react";
import HeroSection from "../components/home/HeroSection";
import FeaturedCases from "../components/home/FeaturedCases";
import MissionSection from "../components/home/MissionSection";

export default function Home() {
  return (
    <div className="overflow-x-hidden">
      <HeroSection />
      <FeaturedCases />
      <MissionSection />
    </div>
  );
}