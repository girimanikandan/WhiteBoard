// src/components/Canvas/tools/TextBox.jsx
import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Text } from "react-konva";

function TextBox({ obj, selected, onSelect, onUpdate, onLiveUpdate }) {
  const textRef = useRef(null);
  const textareaRef = useRef(null);
  const isDraggingRef = useRef(false);

  const [isEditing, setIsEditing] = useState(false);
  const [textValue, setTextValue] = useState(obj.text || "");
  const [textareaStyle, setTextareaStyle] = useState({});

  // Direct Konva node updates for better performance
  useEffect(() => {
    const textNode = textRef.current;
    if (!textNode || isEditing) return;

    if (textNode.x() !== obj.x) textNode.x(obj.x);
    if (textNode.y() !== obj.y) textNode.y(obj.y);
    if (textNode.width() !== (obj.width || 200)) textNode.width(obj.width || 200);
    if (textNode.text() !== (obj.text || "")) textNode.text(obj.text || ""); // Use obj.text
    if (textNode.fontSize() !== (obj.fontSize || 24)) textNode.fontSize(obj.fontSize || 24);
    if (textNode.fill() !== (obj.fill || "#000")) textNode.fill(obj.fill || "#000");
    
    textNode.getLayer()?.batchDraw();
  }, [obj.x, obj.y, obj.width, obj.fontSize, obj.fill, obj.text, isEditing]); // Depend on obj.text

  // Update internal textValue when obj.text changes (e.g., from undo/redo)
  useEffect(() => {
    if (!isEditing) {
      setTextValue(obj.text || "");
    }
  }, [obj.text, isEditing]);


  const startEditing = useCallback(() => {
    if (isDraggingRef.current) return;
    setIsEditing(true);
    
    requestAnimationFrame(() => {
      textareaRef.current?.focus();
      textareaRef.current?.select();
    });
  }, []);

  const stopEditing = useCallback(() => {
    setIsEditing(false);
    if (textValue !== obj.text) {
      onUpdate(obj.id, { text: textValue }); // Final update to history
    }
  }, [obj.id, obj.text, textValue, onUpdate]);

  // Optimized textarea positioning
  useEffect(() => {
    if (!isEditing || !textRef.current) return;

    let rafId;
    const updatePosition = () => {
      const textNode = textRef.current;
      const stage = textNode.getStage();
      if (!stage) return;

      const absPos = textNode.getAbsolutePosition();
      const scale = textNode.getAbsoluteScale();
      
      const stageContainer = stage.container();
      const stageRect = stageContainer.getBoundingClientRect();

      setTextareaStyle({
        position: 'fixed', 
        top: `${stageRect.top + absPos.y}px`,
        left: `${stageRect.left + absPos.x}px`,
        width: `${(obj.width || 200) * scale.x}px`,
        height: 'auto',
        fontSize: `${(obj.fontSize || 24) * scale.y}px`,
        fontFamily: 'Arial, sans-serif',
        lineHeight: '1.2',
        background: "white",
        padding: "8px",
        border: selected ? "3px solid #EF4444" : "2px solid #4299e1",
        borderRadius: "4px",
        resize: "none",
        outline: "none",
        zIndex: 200,
        boxSizing: 'border-box',
        transform: 'translateZ(0)',
        minHeight: '40px',
      });

      rafId = requestAnimationFrame(updatePosition);
    };

    rafId = requestAnimationFrame(updatePosition);
    return () => cancelAnimationFrame(rafId);
  }, [isEditing, obj.width, obj.fontSize, selected, obj.x, obj.y]); 

  // Auto-resize textarea when text changes
  useEffect(() => {
    if (!isEditing || !textareaRef.current) return;
    const textarea = textareaRef.current;
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
  }, [textValue, isEditing, textareaStyle.width]); // Also update on width change

  // Close editor when deselected
  useEffect(() => {
    if (!selected && isEditing) {
      stopEditing();
    }
  }, [selected, isEditing, stopEditing]);

  // Handle keyboard events for the textarea
  const handleTextareaKeyDown = useCallback((e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      stopEditing();
    }
    if (e.key === "Escape") {
      stopEditing();
    }
  }, [stopEditing]);

  // Handle text changes with auto-resize and live update
  const handleTextChange = useCallback((e) => {
    const newText = e.target.value;
    setTextValue(newText);
    onLiveUpdate(obj.id, { text: newText }); // Live update
  }, [obj.id, onLiveUpdate]);

  // Handle drag end
  const handleDragEnd = useCallback((e) => {
    isDraggingRef.current = false;
    onUpdate(obj.id, { // Final history update
      x: e.target.x(), 
      y: e.target.y() 
    });
  }, [obj.id, onUpdate]);
  
  // Handle drag move
  const handleDragMove = useCallback((e) => {
     onLiveUpdate(obj.id, { // Live update
      x: e.target.x(), 
      y: e.target.y() 
    });
  }, [obj.id, onLiveUpdate]);


  // Handle click
  const handleClick = useCallback((e) => {
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      return;
    }
    e.cancelBubble = true;
    onSelect(obj.id);
  }, [obj.id, onSelect]);

  // Handle drag start
  const handleDragStart = useCallback(() => {
    isDraggingRef.current = true;
  }, []);

  // Selection styling
  const selectionStyle = useMemo(() => {
    if (!selected) return {};
    
    return {
      stroke: '#EF4444',
      strokeWidth: 2,
    };
  }, [selected]);

  return (
    <>
      {isEditing && (
        <textarea
          ref={textareaRef}
          className="k-textarea" 
          style={textareaStyle}
          value={textValue}
          onChange={handleTextChange}
          onBlur={stopEditing}
          onKeyDown={handleTextareaKeyDown}
        />
      )}

      <Text
        id={obj.id}
        ref={textRef}
        x={obj.x}
        y={obj.y}
        width={obj.width || 200}
        height={obj.height || 'auto'}
        text={textValue}
        fontSize={obj.fontSize || 24}
        fill={obj.fill || "#1F2937"}
        fontFamily="Arial, sans-serif"
        lineHeight={1.2}
        draggable
        perfectDrawEnabled={false}
        listening={!isEditing} // Stop listening when editing
        hitStrokeWidth={20}
        {...selectionStyle}
        onClick={handleClick}
        onDblClick={startEditing}
        onDragStart={handleDragStart}
        onDragMove={handleDragMove} // Use live update
        onDragEnd={handleDragEnd}
        wrap="word"
        visible={!isEditing} // Hide Konva text when editing
      />
    </>
  );
}

// Custom comparison for memoization
const areEqual = (prevProps, nextProps) => {
  if (prevProps.obj.id !== nextProps.obj.id) return false;
  if (prevProps.selected !== nextProps.selected) return false;
  
  const prevObj = prevProps.obj;
  const nextObj = nextProps.obj;
  
  // Check essential properties
  if (prevObj.x !== nextObj.x) return false;
  if (prevObj.y !== nextObj.y) return false;
  if (prevObj.width !== nextObj.width) return false;
  if (prevObj.fontSize !== nextObj.fontSize) return false;
  if (prevObj.fill !== nextObj.fill) return false;
  if (prevObj.text !== nextObj.text) return false;
  
  // Check if event handlers changed
  if (prevProps.onSelect !== nextProps.onSelect) return false;
  if (prevProps.onUpdate !== nextProps.onUpdate) return false;
  if (prevProps.onLiveUpdate !== nextProps.onLiveUpdate) return false;
  
  return true;
};

export default React.memo(TextBox, areEqual);