import React from "react";
import { Droppable } from "@hello-pangea/dnd";
import GridLayout from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import SalientTemplate from "@/templates/salient/SalientTemplate"; // NEW PATH!
import { WIDGETS } from "@/widgets"; // NEW: use registry

export default function PageCanvas({ widgets, onLayoutChange }) {
  return (
    <Droppable droppableId="canvas">
      {(provided) => (
        <div
          ref={provided.innerRef}
          {...provided.droppableProps}
          className="relative w-full h-full overflow-auto"
          style={{ minHeight: "100vh" }}
        >
          {/* --- Template background --- */}
          <div className="absolute inset-0 z-0 pointer-events-none">
            <SalientTemplate isPreviewMode />
          </div>
          {/* --- Widgets grid --- */}
          <div className="relative z-10" style={{ minHeight: 600, paddingTop: 40 }}>
            <GridLayout
              className="layout"
              layout={widgets}
              cols={12}
              rowHeight={30}
              width={window.innerWidth - 256}
              onLayoutChange={onLayoutChange}
              isResizable
              isDraggable
            >
              {widgets.map((widget, idx) => {
                const WidgetComp = WIDGETS[widget.widgetType]?.component || (() => <div>Missing Widget</div>);
                return (
                  <div key={widget.i} className="bg-white border rounded p-2 flex items-center justify-center">
                    <WidgetComp {...widget.props} />
                    {/* You can add an Edit button here */}
                  </div>
                );
              })}
            </GridLayout>
          </div>
          {provided.placeholder}
        </div>
      )}
    </Droppable>
  );
}
