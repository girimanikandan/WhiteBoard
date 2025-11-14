// src/components/Canvas/BoardCanvas.jsx
import React, { useRef, useState, useCallback, useEffect } from "react";
import { Stage, Layer, Rect, Line } from "react-konva";
import LayerObjects from "./LayerObjects";
import Toolbar from "../Toolbar/Toolbar";
import { getRelativePointer } from "../../utils/konvaHelpers";
import { uuid } from "../../utils/uuid";
import { useAppState, useAppDispatch, ActionTypes } from "../../context/AppProvider";

// Shared helper for arrow center
const getObjectCenter = (o) => {
  if (!o) return { x: 0, y: 0 };
  switch (o.type) {
    case "circle":
    case "image":
    case "sticky":
      return { x: o.x, y: o.y };
    case "rect":
      return { x: o.x + o.width / 2, y: o.y + o.height / 2 };
    case "text":
      return { x: o.x + (o.width || 80) / 2, y: o.y + 12 };
    default:
      return { x: o.x || 0, y: o.y || 0 };
  }
};

export default function BoardCanvas() {
  const stageRef = useRef();
  const layerRef = useRef();
  const selectionRectRef = useRef();
  const fileInputRef = useRef();

  // UI states
  const [currentLine, setCurrentLine] = useState(null);
  const [previewShape, setPreviewShape] = useState(null);
  const [selection, setSelection] = useState({ start: null, active: false });
  const [selectedColor, setSelectedColor] = useState("#000");

  // NEW: Arrow reconnect state
  const [reconnect, setReconnect] = useState({
    active: false,
    arrowId: null,
    endpoint: null,     // "start" | "end"
    startPos: null
  });

  const { objects, selectedIds, mode } = useAppState();
  const dispatch = useAppDispatch();

  // Find real object node
  const getClickedObjectNode = useCallback(
    (node) => {
      if (!node || node === stageRef.current) return null;
      if (node.id() && objects[node.id()]) return node;
      return getClickedObjectNode(node.getParent());
    },
    [objects]
  );

  // Create object helper
  const createObject = useCallback(
    (type, props) => {
      const id = "obj-" + uuid();
      const obj = { id, type, ...props };
      dispatch({ type: ActionTypes.ADD_OBJECT, payload: obj });
      return id;
    },
    [dispatch]
  );

  // ============ START RECONNECT ===============
  const handleStartReconnect = useCallback(
    (arrowId, endpoint, handlePos) => {
      const arrow = objects[arrowId];
      if (!arrow) return; // Add guard clause
      const pos =
        handlePos?.sx != null
          ? { x: handlePos.sx, y: handlePos.sy }
          // Fix: Check if start object exists before getting center
          : (objects[arrow.startId] ? getObjectCenter(objects[arrow.startId]) : { x: 0, y: 0 });


      setReconnect({
        active: true,
        arrowId,
        endpoint,
        startPos: pos
      });

      // Start preview
      setPreviewShape({
        type: "arrow",
        stroke: arrow.stroke || "#000",
        strokeWidth: arrow.strokeWidth || 3,
        points: [pos.x, pos.y, pos.x, pos.y]
      });
    },
    [objects] // objects is a dependency
  );
  // ============ END RECONNECT ===============

  // MOUSE DOWN
  const handleMouseDown = useCallback(
    (e) => {
      const pos = getRelativePointer(stageRef.current);
      if (!pos) return;

      // Check if clicking on an existing object (for arrow mode)
      const objNode = getClickedObjectNode(e.target);

      // Freehand
      if (mode === "draw") {
        setCurrentLine({
          type: "freehand",
          points: [pos.x, pos.y],
          stroke: selectedColor,
          strokeWidth: 3
        });
        return;
      }

      // Arrow creation
      if (mode === "arrow") {
        if (objNode) {
          const id = objNode.id();
          const center = getObjectCenter(objects[id]);
          setPreviewShape({
            type: "arrow",
            startId: id,
            stroke: selectedColor,
            strokeWidth: 3,
            points: [center.x, center.y, pos.x, pos.y]
          });
        }
        return;
      }

      // Line
      if (mode === "line") {
        setPreviewShape({
          type: "line",
          stroke: selectedColor,
          strokeWidth: 3,
          points: [pos.x, pos.y, pos.x, pos.y]
        });
        return;
      }

      // --- START: MODIFIED/ADDED LOGIC FOR MISSING TOOLS ---
      // Only create new shapes if clicking the stage itself
      if (e.target === stageRef.current) {
        if (mode === "rect") {
          createObject("rect", {
            x: pos.x - 50, // Center the shape on click
            y: pos.y - 50,
            width: 100,
            height: 100,
            fill: selectedColor,
          });
          dispatch({ type: ActionTypes.SET_MODE, payload: "select" });
          return;
        }

        if (mode === "circle") {
          createObject("circle", {
            x: pos.x,
            y: pos.y,
            radius: 50,
            fill: selectedColor,
          });
          dispatch({ type: ActionTypes.SET_MODE, payload: "select" });
          return;
        }

        if (mode === "text") {
          createObject("text", {
            x: pos.x,
            y: pos.y,
            text: "New Text",
            fill: selectedColor,
            fontSize: 24,
            width: 150,
          });
          dispatch({ type: ActionTypes.SET_MODE, payload: "select" });
          return;
        }
        
        if (mode === "sticky") {
          createObject("sticky", {
            x: pos.x, // Place top-left at cursor
            y: pos.y,
            width: 150,
            height: 150,
            fill: "#FFF59D", // Default sticky color
            text: "Sticky Note",
          });
          dispatch({ type: ActionTypes.SET_MODE, payload: "select" });
          return;
        }
        // --- END: MODIFIED/ADDED LOGIC ---

        // Selection box (moved inside the stage click check)
        if (mode === "select") {
          setSelection({ start: pos, active: true });
          dispatch({ type: ActionTypes.SET_SELECTED, payload: [] });
        }
      }
    },
    // Added createObject to dependency array
    [mode, objects, selectedColor, getClickedObjectNode, dispatch, createObject]
  );

  // MOUSE MOVE
  const handleMouseMove = useCallback(
    (e) => {
      const pos = getRelativePointer(stageRef.current);
      if (!pos) return;

      // Freehand append
      if (currentLine) {
        setCurrentLine((line) => ({
          ...line,
          points: [...line.points, pos.x, pos.y]
        }));
        return;
      }

      // RECONNECT PREVIEW
      if (reconnect.active && reconnect.startPos) {
        setPreviewShape((p) => ({
          ...p,
          points: [reconnect.startPos.x, reconnect.startPos.y, pos.x, pos.y]
        }));
        return;
      }

      // Regular arrow preview
      if (previewShape && previewShape.type === "arrow") {
        const sObj = objects[previewShape.startId];
        // Add guard check for object existence
        if (sObj) {
          const c = getObjectCenter(sObj);
          setPreviewShape((p) => ({
            ...p,
            points: [c.x, c.y, pos.x, pos.y]
          }));
        }
        return;
      }

      // Line preview
      if (previewShape?.type === "line") {
        setPreviewShape((p) => ({
          ...p,
          points: [p.points[0], p.points[1], pos.x, pos.y]
        }));
      }

      // Selection box update
      if (selection.active && selection.start) {
        const sel = selectionRectRef.current;
        const s = selection.start;
        sel.position({ x: Math.min(pos.x, s.x), y: Math.min(pos.y, s.y) });
        sel.width(Math.abs(pos.x - s.x));
        sel.height(Math.abs(pos.y - s.y));
        sel.visible(true);
        layerRef.current?.batchDraw();
      }
    },
    [currentLine, previewShape, reconnect, objects, selection]
  );

  // MOUSE UP
  const handleMouseUp = useCallback(() => {
    // END FREEHAND
    if (currentLine) {
      if (currentLine.points.length > 3) createObject("freehand", currentLine);
      setCurrentLine(null);
      return;
    }

    // END RECONNECT
    if (reconnect.active) {
      const pos = getRelativePointer(stageRef.current);
      const found = stageRef.current.getIntersection(pos);
      const node = getClickedObjectNode(found);
      const id = node?.id();

      const arrow = objects[reconnect.arrowId];
      if (id && arrow && id !== arrow.startId) { // Check arrow exists
        dispatch({
          type: ActionTypes.UPDATE_OBJECT,
          payload: {
            id: arrow.id,
            updates:
              reconnect.endpoint === "start"
                ? { startId: id }
                : { endId: id }
          }
        });
      }

      setReconnect({ active: false, arrowId: null, endpoint: null, startPos: null });
      setPreviewShape(null);
      dispatch({ type: ActionTypes.SET_MODE, payload: "select" });
      return;
    }

    // END ARROW CREATION
    if (previewShape?.type === "arrow" && previewShape.startId) {
      const pos = getRelativePointer(stageRef.current);
      const found = stageRef.current.getIntersection(pos);
      const node = getClickedObjectNode(found);
      const endId = node?.id();

      if (endId && endId !== previewShape.startId) {
        createObject("arrow", {
          startId: previewShape.startId,
          endId,
          stroke: previewShape.stroke,
          strokeWidth: previewShape.strokeWidth
        });
      }
      setPreviewShape(null);
      dispatch({ type: ActionTypes.SET_MODE, payload: "select" });
      return;
    }

    // END LINE CREATION
    if (previewShape?.type === "line") {
      const pts = previewShape.points;
      const dist = Math.hypot(pts[2] - pts[0], pts[3] - pts[1]);
      if (dist > 10) createObject("line", previewShape);
      setPreviewShape(null);
      dispatch({ type: ActionTypes.SET_MODE, payload: "select" });
      return;
    }

    // END SELECTION
    if (selection.active) {
      selectionRectRef.current.visible(false);
      setSelection({ start: null, active: false });
    }
  }, [
    currentLine,
    previewShape,
    reconnect,
    selection,
    createObject,
    dispatch,
    objects,
    getClickedObjectNode
  ]);

  // IMAGE UPLOAD
  const handleImageUpload = useCallback(
    (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        createObject("image", {
          x: 150,
          y: 150,
          width: 250,
          height: 180,
          src: ev.target.result
        });
      };
      reader.readAsDataURL(file);
    },
    [createObject]
  );

  // RENDER
  return (
    <div className="w-full h-full relative">
      <Toolbar
        mode={mode}
        setMode={(m) => dispatch({ type: ActionTypes.SET_MODE, payload: m })}
        onColorChange={setSelectedColor}
        onImageUpload={() => fileInputRef.current.click()}
      />

      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={handleImageUpload}
      />

      <Stage
        ref={stageRef}
        width={window.innerWidth}
        height={window.innerHeight}
        draggable={mode === "select"}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        className="bg-gray-100"
      >
        <Layer ref={layerRef}>
          <LayerObjects
            objects={objects}
            selectedIds={selectedIds}
            layerRef={layerRef}
            onSelect={(ids) => dispatch({ type: ActionTypes.SET_SELECTED, payload: ids })}
            onUpdate={(id, updates) =>
              dispatch({ type: ActionTypes.UPDATE_OBJECT, payload: { id, updates } })
            }
            onStartReconnect={handleStartReconnect}
          />

          {currentLine && (
            <Line
              points={currentLine.points}
              stroke={currentLine.stroke}
              strokeWidth={currentLine.strokeWidth}
              lineCap="round"
              lineJoin="round"
              listening={false} // Performance boost
            />
          )}

          {previewShape && (
            <Line
              points={previewShape.points}
              stroke={previewShape.stroke}
              strokeWidth={previewShape.strokeWidth}
              lineCap="round"
              lineJoin="round"
              dash={[10, 5]} // Add dash to preview line
              listening={false} // Performance boost
            />
          )}

          <Rect
            ref={selectionRectRef}
            fill="rgba(0,120,255,0.15)"
            stroke="rgba(0,120,255,0.5)"
            strokeWidth={1}
            visible={false}
            listening={false} // Performance boost
          />
        </Layer>
      </Stage>
    </div>
  );
}