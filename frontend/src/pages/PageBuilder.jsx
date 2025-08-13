import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { DragDropContext } from "@hello-pangea/dnd";
import BuilderSidebar from "@/pages/CaseBuilder/BuilderSidebar";
import PageCanvas from "@/pages/CaseBuilder/PageCanvas";
import SalientTemplate from "@/templates/salient/SalientTemplate";
import LogoSelector from "@/components/LogoSelector";
import api from "@/utils/axios";
import { WIDGETS } from "@/widgets";

// Get list of available widgets for the sidebar
const AVAILABLE_WIDGETS = Object.entries(WIDGETS).map(([id, obj]) => ({
  id,
  label: obj.label
}));

// Helper: Find the next available Y coordinate for a new widget
function getNextAvailableY(widgets) {
  if (!widgets.length) return 2; // Start with some margin from top
  
  // Find the bottom-most widget
  let maxY = 0;
  widgets.forEach(w => {
    const bottom = (w.y || 0) + (w.h || 2);
    if (bottom > maxY) {
      maxY = bottom;
    }
  });
  
  // Add some spacing between widgets
  return maxY + 1;
}

// Helper: Check if a position is available (no collision)
function isPositionAvailable(widgets, x, y, w, h, excludeId = null) {
  return !widgets.some(widget => {
    if (widget.i === excludeId) return false;
    
    const widgetRight = (widget.x || 0) + (widget.w || 4);
    const widgetBottom = (widget.y || 0) + (widget.h || 2);
    const newRight = x + w;
    const newBottom = y + h;
    
    return !(
      x >= widgetRight ||
      newRight <= (widget.x || 0) ||
      y >= widgetBottom ||
      newBottom <= (widget.y || 0)
    );
  });
}

// Helper: Find a good position for a new widget
function findAvailablePosition(widgets, w = 4, h = 2) {
  const maxCols = 12;
  
  // Try to find a position starting from top
  for (let y = 0; y < 50; y++) { // Max 50 rows to prevent infinite loop
    for (let x = 0; x <= maxCols - w; x++) {
      if (isPositionAvailable(widgets, x, y, w, h)) {
        return { x, y };
      }
    }
  }
  
  // Fallback: place at bottom
  return { x: 0, y: getNextAvailableY(widgets) };
}

export default function PageBuilder({ data: initialData, back, isLast, next }) {
  const { id } = useParams();
  const navigate = useNavigate();

  // State management
  const [caseData, setCaseData] = useState(initialData || null);
  const [canvasWidgets, setCanvasWidgets] = useState([]);
  const [template, setTemplate] = useState("");
  const [logo, setLogo] = useState(null);
  const [showLogoModal, setShowLogoModal] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load case data if ID is present
  useEffect(() => {
    if (id) {
      setLoading(true);
      api.get(`/cases/${id}/`)
        .then(res => {
          setCaseData(res.data);
          setError(null);
        })
        .catch(err => {
          console.error("Failed to load case data:", err);
          setError("Failed to load case data");
          navigate("/dashboard");
        })
        .finally(() => setLoading(false));
    } else if (initialData) {
      setCaseData(initialData);
    }
  }, [id, initialData, navigate]);

  // Sync state from loaded caseData
  useEffect(() => {
    if (!caseData) return;
    
    // Ensure widgets have required properties
    const validatedWidgets = (caseData.layout || []).map(widget => ({
      i: widget.i || `widget-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      x: Math.max(0, Math.min(widget.x || 0, 11)),
      y: Math.max(0, widget.y || 0),
      w: Math.max(1, Math.min(widget.w || 4, 12)),
      h: Math.max(1, widget.h || 2),
      widgetType: widget.widgetType,
      props: widget.props || {},
      ...widget
    }));
    
    setCanvasWidgets(validatedWidgets);
    setTemplate(caseData.template || "hope-justice");
    setLogo(caseData.logo || null);
  }, [caseData]);

  // Template mapping with fallback
  const TemplateComponent = useMemo(() => {
    const templateMap = { 
      "hope-justice": SalientTemplate,
      "salient": SalientTemplate
    };
    return templateMap[template] || SalientTemplate;
  }, [template]);

  // Drag and drop logic
  function handleDragEnd(result) {
    if (!result.destination) return;

    const { source, destination, draggableId } = result;

    // Handle widget dragging from sidebar to canvas
    if (
      source.droppableId === "widgetList" &&
      destination.droppableId === "canvas"
    ) {
      const widget = AVAILABLE_WIDGETS.find(w => w.id === draggableId);
      if (!widget) return;

      // Find a good position for the new widget
      const position = findAvailablePosition(canvasWidgets, 4, 2);
      
      const newWidget = {
        i: `${widget.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        x: position.x,
        y: position.y,
        w: 4,
        h: 2,
        widgetType: widget.id,
        props: {},
      };

      setCanvasWidgets(prev => [...prev, newWidget]);
      setIsDirty(true);
    }
  }

  // Handle layout changes from GridLayout
  function handleLayoutChange(newLayout) {
    // Merge layout properties with existing widget data
    const updatedWidgets = newLayout.map(layoutItem => {
      const existingWidget = canvasWidgets.find(w => w.i === layoutItem.i);
      return {
        ...existingWidget,
        ...layoutItem,
      };
    });

    setCanvasWidgets(updatedWidgets);
    setIsDirty(true);
    
    // Force re-render to update dynamic height
    setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 100);
  }

  // Handle widget deletion
  function handleDeleteWidget(widgetId) {
    if (window.confirm("Are you sure you want to delete this widget?")) {
      setCanvasWidgets(prev => prev.filter(w => w.i !== widgetId));
      setIsDirty(true);
    }
  }

  // Handle widget property updates
  function handleUpdateWidget(widgetId, newProps) {
    setCanvasWidgets(prev => 
      prev.map(widget => 
        widget.i === widgetId 
          ? { ...widget, props: { ...widget.props, ...newProps } }
          : widget
      )
    );
    setIsDirty(true);
  }

  // Save handler with error handling
  async function handleSave() {
    if (!caseData?.id) {
      alert("Cannot save: No case ID found");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        layout: canvasWidgets,
        template,
        logo,
      };

      await api.patch(`/cases/${caseData.id}/`, payload);
      
      setIsDirty(false);
      setError(null);
      
      // If this is part of a multi-step process, proceed to next step
      if (next) {
        next({ 
          ...caseData, 
          layout: canvasWidgets, 
          template, 
          logo 
        });
      }
    } catch (err) {
      console.error("Save failed:", err);
      setError("Failed to save layout. Please try again.");
      alert("Failed to save layout. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // Handle navigation back with unsaved changes check
  function handleBack() {
    if (isDirty && !window.confirm("You have unsaved changes. Discard and go back?")) {
      return;
    }
    
    if (back) {
      back();
    } else {
      navigate("/dashboard");
    }
  }

  // Handle logo changes
  function handleLogoChange({ file, galleryId, fileUrl }) {
    if (fileUrl) {
      setLogo(fileUrl);
    } else if (galleryId) {
      setLogo(galleryId);
    } else {
      setLogo(null);
    }
    setShowLogoModal(false);
    setIsDirty(true);
  }

  // Handle template changes
  function handleTemplateChange(newTemplate) {
    setTemplate(newTemplate);
    setIsDirty(true);
  }

  // Loading state
  if (loading && !caseData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading case data...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !caseData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <svg className="h-12 w-12 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.498 0L4.316 15.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <p className="text-gray-800 font-semibold mb-2">Error Loading Case</p>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => navigate("/dashboard")}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">No case data available</p>
      </div>
    );
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      {/* Builder Sidebar */}
      <BuilderSidebar
        onBack={handleBack}
        onSave={handleSave}
        isDirty={isDirty}
        onLogoClick={() => setShowLogoModal(true)}
        widgets={AVAILABLE_WIDGETS}
        loading={loading}
      />

      {/* Main Canvas Area */}
      <main
        className="fixed left-64 top-0 right-0 bottom-0 bg-gray-50 overflow-hidden"
        style={{ left: '256px' }}
      >
        <PageCanvas
          widgets={canvasWidgets}
          onLayoutChange={handleLayoutChange}
          onDeleteWidget={handleDeleteWidget}
          onUpdateWidget={handleUpdateWidget}
          TemplateComponent={TemplateComponent}
        />
      </main>

      {/* Logo Selection Modal */}
      {showLogoModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4 relative">
            <button
              onClick={() => setShowLogoModal(false)}
              className="absolute top-2 right-3 text-gray-400 hover:text-gray-700 text-2xl leading-none"
              aria-label="Close modal"
              type="button"
            >
              &times;
            </button>
            <h3 className="text-lg font-bold mb-4">Change Site Logo</h3>
            <LogoSelector 
              value={logo} 
              onChange={handleLogoChange}
            />
          </div>
        </div>
      )}

      {/* Error Toast */}
      {error && (
        <div className="fixed top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded z-50">
          <div className="flex items-center">
            <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              className="ml-4 text-red-500 hover:text-red-700"
            >
              &times;
            </button>
          </div>
        </div>
      )}

      {/* Save Status Indicator */}
      {loading && (
        <div className="fixed bottom-4 right-4 bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded z-50">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
            <span>Saving...</span>
          </div>
        </div>
      )}
    </DragDropContext>
  );
}