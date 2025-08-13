import LightHeroWidget from "./LightHeroWidget";
import MapWidget from "./MapWidget";
// ...more widgets

export const WIDGETS = {
    "Hero Widget Light": {
    label: "Hero Widget Light",
    component: LightHeroWidget,
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
