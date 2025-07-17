import LightHeroWidget from "./LightHeroWidget";
import MapWidget from "./MapWidget";
// ...more widgets

export const WIDGETS = {
  "widget-hero": {
    label: "Hero Widget",
    component: LightHeroWidget, // If you mean to use LightHeroWidget
    defaultProps: { title: "A Life Remembered", subtitle: "In loving memory..." }
  },
  "widget-map": {
    label: "Incident Map",
    component: MapWidget,
    defaultProps: {
      lat: 37.0902,
      lng: -95.7129,
      zoom: 4,
    }
  }
};
