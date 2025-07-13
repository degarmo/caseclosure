import { useState } from "react";
import { TEMPLATE_REGISTRY } from "@/constants/templates";
import LightHeroWidget from "@/components/widgets/LightHeroWidget";
import QuoteWidget from "@/components/widgets/QuoteWidget";

export default function PageBuilder() {
  // This state would eventually come from your builder’s store/DB
  const [selectedTemplate, setSelectedTemplate] = useState("salient");
  const widgetsOnPage = [
    { type: "hero", props: { title: "In Loving Memory", description: "..." } },
    { type: "quote", props: { quote: "Gone but never forgotten." } },
  ];

  // Map widget type to component (in real life, use a registry)
  const WIDGET_REGISTRY = {
    hero: LightHeroWidget,
    quote: QuoteWidget,
    // more...
  };

  // Pick the template component dynamically
  const TemplateComponent = TEMPLATE_REGISTRY[selectedTemplate];

  return (
    <TemplateComponent>
      {widgetsOnPage.map((widget, idx) => {
        const WidgetComp = WIDGET_REGISTRY[widget.type];
        return <WidgetComp key={idx} {...widget.props} />;
      })}
    </TemplateComponent>
  );
}
