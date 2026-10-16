import { LandingHeader } from "@/components/landing/landing-header";
import { HeroSection } from "@/components/landing/hero-section";
import { WhyAbrinakSection } from "@/components/landing/why-abrinak-section";
import { WorkflowSection } from "@/components/landing/workflow-section";
import { FeatureShowcase } from "@/components/landing/feature-showcase";
import { DemoCTA } from "@/components/landing/demo-cta";
import { LandingFooter } from "@/components/landing/landing-footer";
import { DemoRequestProvider } from "@/components/landing/demo-request-dialog";

export function LandingPage() {
  return (
    <DemoRequestProvider>
      <div className="relative">
        <LandingHeader />
        <HeroSection />
      </div>
      <main>
        <WhyAbrinakSection />
        <WorkflowSection />
        <FeatureShowcase />
        <DemoCTA />
      </main>
      <LandingFooter />
    </DemoRequestProvider>
  );
}
