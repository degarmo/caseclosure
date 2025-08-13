import React, { useEffect } from "react";
import { Droppable } from "@hello-pangea/dnd";
import GridLayout from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import { WIDGETS } from "@/widgets";

export default function PageCanvas({ widgets, onLayoutChange, TemplateComponent }) {
  // Add custom styles for resize handles positioned on widget content
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .react-grid-item {
        background: transparent !important;
        border: none !important;
      }
      
      .react-grid-item .react-resizable-handle {
        width: 16px !important;
        height: 16px !important;
        z-index: 1000 !important;
        opacity: 0 !important;
        transition: opacity 0.2s ease !important;
        background-color: #3b82f6 !important;
        border: 2px solid white !important;
        border-radius: 3px !important;
        position: absolute !important;
      }
      
      .react-grid-item:hover .react-resizable-handle {
        opacity: 1 !important;
      }
      
      /* Position handles on the actual widget content edges */
      .react-grid-item .react-resizable-handle-se {
        cursor: se-resize !important;
      }
      .react-grid-item .react-resizable-handle-sw {
        cursor: sw-resize !important;
      }
      .react-grid-item .react-resizable-handle-ne {
        cursor: ne-resize !important;
      }
      .react-grid-item .react-resizable-handle-nw {
        cursor: nw-resize !important;
      }
      .react-grid-item .react-resizable-handle-s {
        cursor: s-resize !important;
      }
      .react-grid-item .react-resizable-handle-n {
        cursor: n-resize !important;
      }
      .react-grid-item .react-resizable-handle-e {
        cursor: e-resize !important;
      }
      .react-grid-item .react-resizable-handle-w {
        cursor: w-resize !important;
      }
    `;
    document.head.appendChild(style);
    
    // Function to position handles exactly on widget content bounds
    const positionHandles = () => {
      document.querySelectorAll('.react-grid-item').forEach(gridItem => {
        const widgetContent = gridItem.querySelector('.widget-content');
        if (!widgetContent) return;
        
        const gridRect = gridItem.getBoundingClientRect();
        const contentRect = widgetContent.getBoundingClientRect();
        
        // Calculate exact position relative to grid item
        const offsetX = contentRect.left - gridRect.left;
        const offsetY = contentRect.top - gridRect.top;
        const contentWidth = contentRect.width;
        const contentHeight = contentRect.height;
        
        // Position handles exactly on content edges
        const handlePositions = {
          'se': { left: offsetX + contentWidth - 8, top: offsetY + contentHeight - 8 },
          'sw': { left: offsetX - 8, top: offsetY + contentHeight - 8 },
          'ne': { left: offsetX + contentWidth - 8, top: offsetY - 8 },
          'nw': { left: offsetX - 8, top: offsetY - 8 },
          's': { left: offsetX + contentWidth / 2 - 8, top: offsetY + contentHeight - 8 },
          'n': { left: offsetX + contentWidth / 2 - 8, top: offsetY - 8 },
          'e': { left: offsetX + contentWidth - 8, top: offsetY + contentHeight / 2 - 8 },
          'w': { left: offsetX - 8, top: offsetY + contentHeight / 2 - 8 }
        };
        
        // Apply positions to handles
        Object.entries(handlePositions).forEach(([direction, pos]) => {
          const handle = gridItem.querySelector(`.react-resizable-handle-${direction}`);
          if (handle) {
            handle.style.left = `${pos.left}px`;
            handle.style.top = `${pos.top}px`;
            handle.style.right = 'auto';
            handle.style.bottom = 'auto';
            handle.style.transform = 'none';
          }
        });
      });
    };
    
    // Update handle positions when anything changes
    const updatePositions = () => {
      requestAnimationFrame(positionHandles);
    };
    
    // Watch for DOM changes and resize events
    const observer = new MutationObserver(updatePositions);
    const resizeObserver = new ResizeObserver(updatePositions);
    
    observer.observe(document.body, { 
      childList: true, 
      subtree: true,
      attributes: true,
      attributeFilter: ['style']
    });
    
    // Observe all grid items for size changes
    setTimeout(() => {
      document.querySelectorAll('.react-grid-item').forEach(item => {
        resizeObserver.observe(item);
        const content = item.querySelector('.widget-content');
        if (content) resizeObserver.observe(content);
      });
      updatePositions();
    }, 100);
    
    // Also update on scroll and resize
    window.addEventListener('scroll', updatePositions);
    window.addEventListener('resize', updatePositions);
    
    return () => {
      document.head.removeChild(style);
      observer.disconnect();
      resizeObserver.disconnect();
      window.removeEventListener('scroll', updatePositions);
      window.removeEventListener('resize', updatePositions);
    };
  }, [widgets]);

  // Responsive grid width for the canvas, subtract sidebar width (256px)
  const gridWidth = Math.max(window.innerWidth - 256, 320);

  // Calculate dynamic height based on widget positions
  const calculateDynamicHeight = () => {
    if (!widgets.length) return '100vh';
    
    let maxBottom = 0;
    widgets.forEach(widget => {
      const bottom = (widget.y + widget.h) * 30; // rowHeight is 30px
      if (bottom > maxBottom) maxBottom = bottom;
    });
    
    // Add extra space (minimum 100vh, or widget bottom + 200px padding)
    const minHeight = Math.max(window.innerHeight, maxBottom + 200);
    return `${minHeight}px`;
  };

  const dynamicHeight = calculateDynamicHeight();

  // DEBUG: Log the widget list and layout
  console.log("PageCanvas widgets:", widgets);
  console.log("Dynamic height:", dynamicHeight);

  return (
    <div className="relative w-full bg-white mx-auto overflow-auto" style={{ height: '100vh' }}>
      {/* Template rendered as background/base layer */}
      <div className="absolute inset-0 z-0" style={{ height: dynamicHeight }}>
        <TemplateComponent isPreviewMode />
      </div>

      {/* Widgets grid positioned absolutely to allow full-screen placement */}
      <div className="absolute z-10" style={{ 
        left: 0, 
        top: 0, 
        right: 0, 
        height: dynamicHeight,
        minHeight: '100vh'
      }}>
        <Droppable droppableId="canvas">
          {(provided) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className="relative w-full px-2 sm:px-6 lg:px-12"
              style={{ height: dynamicHeight }}
            >
              <GridLayout
                className="layout"
                layout={widgets}
                cols={12}
                rowHeight={30}
                width={gridWidth}
                onLayoutChange={onLayoutChange}
                isResizable
                isDraggable
                compactType={null} // Allow free positioning
                preventCollision={false}
                useCSSTransforms={true}
                resizeHandles={['se', 'sw', 'ne', 'nw', 's', 'n', 'e', 'w']}
              >
                {widgets.map((widget) => {
                  const WidgetComp = WIDGETS[widget.widgetType]?.component;
                  if (!WidgetComp) {
                    // Error state: Widget type not found
                    return (
                      <div
                        key={widget.i}
                        className="relative z-20 widget-container"
                        style={{ 
                          width: '100%',
                          height: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <div className="bg-red-50 text-red-800 border border-red-400 rounded shadow-lg inline-block p-4 widget-content">
                          <span>
                            <strong>Missing Widget:</strong> {widget.widgetType}
                          </span>
                        </div>
                      </div>
                    );
                  }
                  // Render widget component with container that responds to grid size
                  return (
                    <div
                      key={widget.i}
                      className="relative z-20 widget-container w-full h-full"
                    >
                      <div 
                        className="bg-white border rounded-lg shadow-lg widget-content w-full h-full"
                        style={{ 
                          minWidth: '200px',
                          minHeight: '150px'
                        }}
                      >
                        <WidgetComp {...widget.props} />
                      </div>
                    </div>
                  );
                })}
              </GridLayout>
              {/* DND placeholder for drag-and-drop */}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </div>
    </div>
  );
}