// src/components/Canvas/BoardCanvas.jsx
import React, { useRef, useState, useCallback, useEffect } from "react";
import { Stage, Layer, Rect, Line } from "react-konva";
import { getRelativePointer } from "../../utils/konvaHelpers";
import LayerObjects from "./LayerObjects";
import Toolbar from "../Toolbar/Toolbar";
import { useAppState, useAppDispatch, ActionTypes } from "../../context/AppProvider";
import { uuid } from "../../utils/uuid"; // Added import

export default function BoardCanvas() {
  const stageRef = useRef();
  const layerRef = useRef();
  const selectionRectRef = useRef();
  const fileInputRef = useRef();

  const [currentLine, setCurrentLine] = useState(null);
  const [previewShape, setPreviewShape] = useState(null);
  const [selectedColor, setSelectedColor] = useState("#000000");
  const [selection, setSelection] = useState({ start: null, active: false });
  const [viewport, setViewport] = useState({
    scale: 1,
    x: 0,
    y: 0
  });

  const { objects, selectedIds, mode } = useAppState();
  const dispatch = useAppDispatch();

  // Create object helper with validation
  const createObject = useCallback((type, props) => {
    const id = 'obj-' + uuid(); // Use uuid()
    const obj = {
      id,
      type,
      x: props.x || 0,
      y: props.y || 0,
      ...props
    };

    // Validate required properties based on type
    if (type === "freehand" && (!props.points || props.points.length < 4)) {
      console.warn("Freehand object requires at least 4 points");
      return null;
    }

    dispatch({ type: ActionTypes.ADD_OBJECT, payload: obj });
    return id;
  }, [dispatch]);

  // Update viewport on stage changes
  const updateViewport = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return;

    setViewport({
      scale: stage.scaleX(),
      x: stage.x(),
      y: stage.y()
    });
  }, []);

  // Handler for color changes from Toolbar
  const handleColorChange = useCallback((newColor) => {
    // 1. Update the local color state (for creating new shapes)
    setSelectedColor(newColor);

    // 2. Update all selected objects
    if (selectedIds.length > 0) {
      selectedIds.forEach(id => {
        const obj = objects[id];
        
        // Check if the object is a type that can be filled
        if (obj && (obj.type === 'rect' || obj.type === 'circle' || obj.type === 'sticky' || obj.type === 'text')) {
          dispatch({
            type: ActionTypes.UPDATE_OBJECT,
            payload: { id: id, updates: { fill: newColor } }
          });
        }
      });
    }
  }, [selectedIds, dispatch, objects]);

  // Mouse event handlers
  const handleMouseDown = useCallback((e) => {
    const pos = getRelativePointer(stageRef.current); // Use imported helper
    if (!pos) return;

    // Prevent default behavior
    e.evt.preventDefault();

    // Drawing mode
    if (mode === "draw") {
      setCurrentLine({
        points: [pos.x, pos.y],
        stroke: selectedColor,
        strokeWidth: 3,
        tension: 0.5, // Smooth curves
      });
      return;
    }

    // Shape creation modes
    const shapeHandlers = {
      sticky: () => createObject("sticky", {
        x: pos.x,
        y: pos.y,
        width: 200,
        height: 120,
        fill: "#FFF59D",
        text: "New Note",
      }),

      text: () => createObject("text", {
        x: pos.x,
        y: pos.y,
        text: "Text",
        fontSize: 18,
        fill: selectedColor,
        width: 200,
      }),

      rect: () => createObject("rect", {
        x: pos.x,
        y: pos.y,
        width: 150,
        height: 100,
        fill: selectedColor || "#D1D1D1",
      }),

      circle: () => createObject("circle", {
        x: pos.x,
        y: pos.y,
        radius: 50,
        fill: selectedColor || "#8ECAE6",
      }),

      arrow: () => {
        // Arrow tool requires two clicks - start implementation
        console.log("Arrow tool clicked at:", pos);
        // You'll need to implement arrow connection logic here
      }
    };

    if (shapeHandlers[mode]) {
      shapeHandlers[mode]();
      // Only switch back to select for single-click tools
      if (mode !== "arrow") {
        dispatch({ type: ActionTypes.SET_MODE, payload: "select" });
      }
      return;
    }

    if (mode === "line") {
      setPreviewShape({
        type: "line",
        stroke: selectedColor,
        strokeWidth: 3,
        points: [pos.x, pos.y, pos.x, pos.y],
      });
      return;
    }

    // Selection mode
    if (e.target === stageRef.current) { // Check against stageRef
      setSelection({ start: pos, active: true });
      dispatch({ type: ActionTypes.SET_SELECTED, payload: [] });
    }
  }, [mode, selectedColor, createObject, dispatch]);

  const handleMouseMove = useCallback((e) => {
    const pos = getRelativePointer(stageRef.current); // Use imported helper
    if (!pos) return;

    // Drawing with performance optimization
    if (mode === "draw" && currentLine) {
      // Throttle points for better performance
      setCurrentLine(prev => {
        const newPoints = [...prev.points];
        // Only add point if it's significantly different from last point
        const lastX = newPoints[newPoints.length - 2];
        const lastY = newPoints[newPoints.length - 1];

        if (Math.abs(pos.x - lastX) > 2 || Math.abs(pos.y - lastY) > 2) {
          newPoints.push(pos.x, pos.y);
        }

        return { ...prev, points: newPoints };
      });
      return;
    }

    // Line preview
    if (mode === "line" && previewShape) {
      setPreviewShape(prev => ({
        ...prev,
        points: [prev.points[0], prev.points[1], pos.x, pos.y],
      }));
      return;
    }

    // Selection rectangle
    if (selection.active && selection.start) {
      const sel = selectionRectRef.current;
      const start = selection.start;

      sel.position({
        x: Math.min(pos.x, start.x),
        y: Math.min(pos.y, start.y),
      });
      sel.width(Math.abs(pos.x - start.x));
      sel.height(Math.abs(pos.y - start.y));
      sel.visible(true);

      // Batch draw for performance
      layerRef.current?.batchDraw();
    }
  }, [mode, currentLine, previewShape, selection]); // Removed getRelativePointer from deps

  const handleMouseUp = useCallback(() => {
    // Finish drawing
    if (mode === "draw" && currentLine) {
      if (currentLine.points.length >= 4) {
        createObject("freehand", {
          points: currentLine.points,
          stroke: currentLine.stroke,
          strokeWidth: currentLine.strokeWidth,
          tension: currentLine.tension,
        });
      }
      setCurrentLine(null);
      return;
    }

    // Finish line
    if (mode === "line" && previewShape) {
      // Only create line if it has meaningful length
      const [x1, y1, x2, y2] = previewShape.points;
      const distance = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));

      if (distance > 10) { // Minimum line length
        createObject("line", {
          points: previewShape.points,
          stroke: previewShape.stroke,
          strokeWidth: previewShape.strokeWidth,
        });
      }

      setPreviewShape(null);
      dispatch({ type: ActionTypes.SET_MODE, payload: "select" });
      return;
    }

    // Finish selection
    if (selection.active) {
      setSelection({ start: null, active: false });
      if (selectionRectRef.current) {
        selectionRectRef.current.visible(false);
      }
    }
  }, [mode, currentLine, previewShape, selection, createObject, dispatch]);

  // Image upload handler with better error handling
  const handleImageUpload = useCallback((e) => {
    const file = e?.target?.files?.[0];
    if (!file) return;

    // Validate file type and size
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file (JPEG, PNG, GIF, etc.)');
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      alert('Image size must be less than 10MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      const dataUrl = loadEvent.target?.result;
      if (typeof dataUrl === 'string') {
        createObject("image", {
          x: 150,
          y: 150,
          width: 250,
          height: 180,
          src: dataUrl,
        });
      }
    };

    reader.onerror = () => {
      alert('Error reading image file');
      console.error('FileReader error:', reader.error);
    };

    reader.readAsDataURL(file);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [createObject]);

  // Zoom handlers with constraints
  const zoomAt = useCallback((scaleBy, fixedPoint = null) => {
    const stage = stageRef.current;
    if (!stage) return;

    const oldScale = stage.scaleX();
    const pointer = fixedPoint || stage.getPointerPosition();

    if (!pointer) return;

    const mousePoint = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };

    // Constrain zoom levels
    const newScale = Math.max(0.05, Math.min(20, oldScale * scaleBy));

    // Only zoom if scale actually changes
    if (Math.abs(newScale - oldScale) > 0.001) {
      stage.scale({ x: newScale, y: newScale });

      const newPos = {
        x: pointer.x - mousePoint.x * newScale,
        y: pointer.y - mousePoint.y * newScale,
      };

      stage.position(newPos);
      stage.batchDraw();
      updateViewport();
    }
  }, [updateViewport]);

  const handleWheel = useCallback((e) => {
    e.evt.preventDefault();
    const direction = e.evt.deltaY > 0 ? 1 / 1.2 : 1.2; // Smoother zoom
    zoomAt(direction);
  }, [zoomAt]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl/Cmd + Z for undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        dispatch({ type: ActionTypes.UNDO });
      }

      // Ctrl/Cmd + Shift + Z or Ctrl/Cmd + Y for redo
      if ((e.ctrlKey || e.metaKey) && (e.shiftKey && e.key === 'z') || e.key === 'y') {
        e.preventDefault();
        dispatch({ type: ActionTypes.REDO });
      }

      // Delete key to remove selected objects
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        selectedIds.forEach(id => {
          dispatch({ type: ActionTypes.DELETE_OBJECT, payload: id });
        });
      }

      // Escape to clear selection
      if (e.key === 'Escape') {
        dispatch({ type: ActionTypes.SET_SELECTED, payload: [] });
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [dispatch, selectedIds]);

  // Reset mode when component unmounts
  useEffect(() => {
    return () => {
      dispatch({ type: ActionTypes.SET_MODE, payload: "select" });
    };
  }, [dispatch]);

  return (
    <div className="canvas-container canvas-bg-grid relative w-full h-full overflow-hidden">
      <Toolbar
        mode={mode}
        setMode={(m) => dispatch({ type: ActionTypes.SET_MODE, payload: m })}
        onColorChange={handleColorChange}
        onImageUpload={() => fileInputRef.current?.click()}
        onUndo={() => dispatch({ type: ActionTypes.UNDO })}
        onRedo={() => dispatch({ type: ActionTypes.REDO })}
        onZoomIn={() => zoomAt(1.2)}
        onZoomOut={() => zoomAt(1 / 1.2)}
        onClearBoard={() => {
          if (window.confirm("Are you sure you want to clear the entire board? This action cannot be undone.")) {
            dispatch({ type: ActionTypes.CLEAR_BOARD });
          }
        }}
      />

      {/* Hidden file input for image upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageUpload}
      />

      {/* Konva Stage */}
      <Stage
        ref={stageRef}
        width={window.innerWidth}
        height={window.innerHeight}
        draggable={mode === "select"}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onDragEnd={updateViewport}
        className="konva-container"
      >
        <Layer ref={layerRef}>
          {/* Render all objects */}
          <LayerObjects
            objects={objects}
            selectedIds={selectedIds}
            onSelect={(ids) => dispatch({ type: ActionTypes.SET_SELECTED, payload: ids })}
            onUpdate={(id, updates) => dispatch({
              type: ActionTypes.UPDATE_OBJECT,
              payload: { id, updates }
            })}
            layerRef={layerRef}
            viewportScale={viewport.scale}
          />

          {/* Drawing preview */}
          {currentLine && (
            <Line
              points={currentLine.points}
              stroke={currentLine.stroke}
              strokeWidth={currentLine.strokeWidth}
              lineCap="round"
              lineJoin="round"
              tension={currentLine.tension}
              listening={false}
              perfectDrawEnabled={false}
              globalCompositeOperation="source-over"
            />
          )}

          {/* Line preview */}
          {previewShape && (
            <Line
              points={previewShape.points}
              stroke={previewShape.stroke}
              strokeWidth={previewShape.strokeWidth}
              lineCap="round"
              lineJoin="round"
              listening={false}
              perfectDrawEnabled={false}
            />
          )}

          {/* Selection rectangle */}
          <Rect
            ref={selectionRectRef}
            fill="rgba(59, 130, 246, 0.1)"
            stroke="rgba(59, 130, 246, 0.8)"
            strokeWidth={1.5}
            dash={[5, 5]}
            visible={false}
            listening={false}
            perfectDrawEnabled={false}
          />
        </Layer>
      </Stage>

      {/* Viewport info (optional debug overlay) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute bottom-4 left-4 bg-black/80 text-white text-xs px-2 py-1 rounded">
          Zoom: {viewport.scale.toFixed(2)}x | Objects: {Object.keys(objects).length}
        </div>
      )}
    </div>
  );
}