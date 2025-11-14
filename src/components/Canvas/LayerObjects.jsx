// src/components/Canvas/LayerObjects.jsx
import React, { useEffect, useRef } from "react";
import { Transformer } from "react-konva";
import StickyNote from "./tools/StickyNote";
import Shape from "./tools/Shape";
import Freehand from "./tools/Freehand";
import TextBox from "./tools/TextBox";
import Arrow from "./tools/Arrow";
import ImageObject from "./tools/ImageObject";
import Line from "./tools/Line";

function LayerObjects({
  objects = [],
  selectedIds = [],
  onSelect,
  onUpdate,
  layerRef,
}) {
  const transformerRef = useRef();

  // Update transformer when selection changes
  useEffect(() => {
    if (!transformerRef.current || !layerRef.current) return;

    const nodes = selectedIds
      .map(id => layerRef.current.findOne(`#${id}`))
      .filter(node => node);

    transformerRef.current.nodes(nodes);
    transformerRef.current.getLayer()?.batchDraw();
  }, [selectedIds, layerRef]);

  const renderObject = (obj) => {
    const isSelected = selectedIds.includes(obj.id);
    
    const commonProps = {
      key: obj.id,
      obj,
      selected: isSelected,
      onSelect,
      onUpdate,
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
      case "arrow":
        return <Arrow {...commonProps} objectsMap={objects.reduce((acc, obj) => {
          acc[obj.id] = obj;
          return acc;
        }, {})} />;
      case "image":
        return <ImageObject {...commonProps} />;
      default:
        console.warn("Unknown object type:", obj.type);
        return null;
    }
  };

  return (
    <>
      {objects.map(renderObject)}
      <Transformer 
        ref={transformerRef}
        rotateEnabled={true}
        resizeEnabled={true}
        keepRatio={false}
        enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right']}
        borderStroke="#0099ff"
        borderStrokeWidth={1.5}
      />
    </>
  );
}

export default React.memo(LayerObjects);