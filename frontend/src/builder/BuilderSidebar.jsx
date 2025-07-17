import React from "react";
import { Droppable, Draggable } from "@hello-pangea/dnd";

// Sync with AVAILABLE_WIDGETS
const WIDGETS = [
  { id: "widget-hero", label: "Hero Widget" },
  { id: "widget-map", label: "Memory Map (Coming Soon)" },
];

export default function BuilderSidebar({ onBack, onSave, isDirty }) {
  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-white border-r shadow flex flex-col py-8 px-4 z-40">
      {/* Top: Arrow + Dashboard link */}
      <button
        className="flex items-center gap-2 text-blue-600 font-bold mb-8 focus:outline-none hover:underline"
        onClick={onBack}
        type="button"
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Dashboard
      </button>

      {/* Save button (if changes) */}
      {isDirty && (
        <button
          className="mb-6 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 font-semibold"
          onClick={onSave}
          type="button"
        >
          Save
        </button>
      )}

      <h2 className="text-lg font-bold mb-6">Site Builder</h2>
      <div className="mb-8 flex-1">
        <h3 className="font-semibold mb-3">Widgets</h3>
        <Droppable droppableId="widgetList" isDropDisabled={true}>
          {(provided) => (
            <ul ref={provided.innerRef} {...provided.droppableProps} className="space-y-2">
              {WIDGETS.map((widget, idx) => (
                <Draggable draggableId={widget.id} index={idx} key={widget.id}>
                  {(provided) => (
                    <li
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      className="p-2 bg-gray-100 rounded cursor-pointer"
                    >
                      {widget.label}
                    </li>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </ul>
          )}
        </Droppable>
      </div>
      {/* Bottom button for changing template */}
      <button
        className="mt-auto text-gray-400 border-t pt-4 text-left hover:text-gray-600"
        type="button"
        disabled
      >
        Change Template <span className="text-xs">(coming soon)</span>
      </button>
    </aside>
  );
}
