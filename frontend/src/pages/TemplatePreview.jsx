import SalientTemplate from "@/components/templates/salient/SalientTemplate";
import LightHeroWidget from "@/components/widgets/LightHeroWidget";
import QuoteWidget from "@/components/widgets/QuoteWidget";

export default function TemplatePreview() {
  return (
    <SalientTemplate>
      <LightHeroWidget title="In Loving Memory of Jane Doe" description="Jane was..." />
      <QuoteWidget quote="Their memory is our greatest treasure." />
    </SalientTemplate>
  );
}
