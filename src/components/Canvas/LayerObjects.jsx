// src/components/Canvas/LayerObjects.jsx
import React, { useEffect, useRef, useMemo } from "react";
import { Transformer } from "react-konva";

import StickyNote from "./tools/StickyNote.jsx";
import Shape from "./tools/Shape.jsx";
import Freehand from "./tools/Freehand.jsx";
import TextBox from "./tools/TextBox.jsx";
import Arrow from "./tools/Arrow.jsx";
import ImageObject from "./tools/ImageObject.jsx";
import Line from "./tools/Line.jsx";

function LayerObjects({
  objects = {},
  selectedIds = [],
  onSelect,
  onUpdate, // For final history update
  onLiveUpdate, // For smooth dragging
  layerRef,
  onStartReconnect,   // REQUIRED for reconnect feature
}) {
  const transformerRef = useRef();

  // --- Create objectsMap once (prevents re-renders)
  const objectsMap = useMemo(() => {
    return objects || {};
  }, [objects]);

  // --- Apply Konva Transformer
  useEffect(() => {
    if (!transformerRef.current || !layerRef.current) return;

    const nodes = selectedIds
      .map((id) => layerRef.current.findOne(`#${id}`))
      .filter(Boolean);

    transformerRef.current.nodes(nodes);
    transformerRef.current.getLayer()?.batchDraw();
  }, [selectedIds, layerRef]);

  // --- Render an object based on its type
  const renderObject = (obj) => {
    const isSelected = selectedIds.includes(obj.id);

    const commonProps = {
      key: obj.id,
      obj,
      selected: isSelected,
      onSelect,
      onUpdate,
      onLiveUpdate, // Pass live update handler
    };

    switch (obj.type) {
      case "sticky":
        return <StickyNote {...commonProps} />;

      case "rect":
      case "circle":
        return <Shape {...commonProps} />;

      case "freehand":
        return <Freehand {...commonProps} />;

      case "text":
        return <TextBox {...commonProps} />;

      case "line":
        return <Line {...commonProps} />;

      case "image":
        return <ImageObject {...commonProps} />;

      case "arrow":
        return (
          <Arrow
            key={obj.id}
            obj={obj}
            selected={isSelected}
            objectsMap={objectsMap}
            onSelect={onSelect}
            onUpdate={onUpdate}
            onStartReconnect={(endpoint, handlePos) => // Pass handlePos
              onStartReconnect(obj.id, endpoint, handlePos)
            }
          />
        );

      default:
        console.warn("Unknown object type:", obj.type);
        return null;
    }
  };

  return (
    <>
      {Object.values(objects).map(renderObject)}

      <Transformer
        ref={transformerRef}
        rotateEnabled={true}
        resizeEnabled={true}
        keepRatio={false}
        enabledAnchors={[
          "top-left",
          "top-right",
          "bottom-left",
          "bottom-right",
        ]}
        borderStroke="#0099ff"
        borderStrokeWidth={1.5}
      />
    </>
  );
}

export default React.memo(LayerObjects);