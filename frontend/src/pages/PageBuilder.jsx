import React, { useState } from "react";
import { DragDropContext } from "@hello-pangea/dnd";
import BuilderSidebar from "@/builder/BuilderSidebar";
import PageCanvas from "@/builder/PageCanvas";

// Define available widgets (expand as you grow)
const AVAILABLE_WIDGETS = [
  { id: "widget-hero", label: "Hero Widget" },
  { id: "widget-map", label: "Memory Map (Coming Soon)" },
];

export default function PageBuilder() {
  const [canvasWidgets, setCanvasWidgets] = useState([]);
  const [isDirty, setIsDirty] = useState(false); // Track unsaved changes

  function handleDragEnd(result) {
    if (!result.destination) return;
    if (
      result.source.droppableId === "widgetList" &&
      result.destination.droppableId === "canvas"
    ) {
      const widget = AVAILABLE_WIDGETS.find(w => w.id === result.draggableId);
      if (!widget) return;
      setCanvasWidgets(prev => [
        ...prev,
        {
          i: `${widget.id}-${prev.length}`,
          x: 0,
          y: Infinity,
          w: 4,
          h: 2,
          widgetType: widget.label,
        }
      ]);
      setIsDirty(true);
    }
  }

  function handleLayoutChange(newLayout) {
    setCanvasWidgets(newLayout.map(layoutItem => ({
      ...canvasWidgets.find(w => w.i === layoutItem.i),
      ...layoutItem,
    })));
    setIsDirty(true);
  }

  function handleSave() {
    // TODO: Save to backend or state as needed
    setIsDirty(false);
    alert("Saved!");
  }

  function handleBack() {
    if (isDirty) {
      if (!window.confirm("You have unsaved changes. Save before leaving?")) return;
    }
    window.location.href = "/dashboard";
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      {/* Sidebar: fixed on the far left, full height */}
      <BuilderSidebar onBack={handleBack} onSave={handleSave} isDirty={isDirty} />
      {/* Main canvas: fill the screen except for sidebar width */}
      <main
        className="absolute left-64 top-0 w-[calc(100vw-16rem)] h-screen bg-gray-50"
        style={{ left: 256 }} // 64px * 4 = 256px for sidebar width
      >
        <PageCanvas
          widgets={canvasWidgets}
          onLayoutChange={handleLayoutChange}
        />
      </main>
    </DragDropContext>
  );
}
