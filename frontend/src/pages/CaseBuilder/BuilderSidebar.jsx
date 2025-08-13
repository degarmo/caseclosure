import React, { useState } from "react";
import { Droppable, Draggable } from "@hello-pangea/dnd";
import LogoSelector from "@/components/LogoSelector"; // Adjust import path if needed
import { WIDGETS } from "@/widgets"; // <<-- KEEP THIS!

export default function BuilderSidebar({ onBack, onSave, isDirty }) {
  const [logoModalOpen, setLogoModalOpen] = useState(false);
  const [logoValue, setLogoValue] = useState(null);

  // Optional: callback for saving logo change
  const handleLogoChange = (value) => {
    setLogoValue(value);
    // Call API/save as needed, or lift state to parent if required
    setLogoModalOpen(false);
  };

  // Turn WIDGETS (object) into a list for display
  const widgetList = Object.entries(WIDGETS).map(([id, obj]) => ({
    id,
    label: obj.label,
  }));

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

      {/* Change Logo Button */}
      <button
        className="mb-4 px-4 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 font-semibold"
        type="button"
        onClick={() => setLogoModalOpen(true)}
      >
        Change Logo
      </button>

      <h2 className="text-lg font-bold mb-6">Site Builder</h2>
      <div className="mb-8 flex-1">
        <h3 className="font-semibold mb-3">Widgets</h3>
        <Droppable droppableId="widgetList" isDropDisabled={true}>
          {(provided) => (
            <ul ref={provided.innerRef} {...provided.droppableProps} className="space-y-2">
              {widgetList.map((widget, idx) => (
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

      {/* LogoSelector Modal */}
      {logoModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded shadow-xl max-w-md w-full relative">
            <button
              className="absolute top-2 right-3 text-gray-400 hover:text-gray-700 text-2xl"
              onClick={() => setLogoModalOpen(false)}
              aria-label="Close"
              type="button"
            >
              &times;
            </button>
            <h3 className="text-lg font-bold mb-4">Change Site Logo</h3>
            <LogoSelector value={logoValue} onChange={handleLogoChange} />
          </div>
        </div>
      )}
    </aside>
  );
}
