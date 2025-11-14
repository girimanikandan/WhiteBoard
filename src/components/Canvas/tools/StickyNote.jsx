// src/components/Canvas/tools/StickyNote.jsx
import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Group, Rect, Text } from "react-konva";

const COLORS = ["#FFF59D", "#81D4FA", "#C8E6C9", "#F8BBD0", "#FFCC80"];
const EMOJIS = ["😀", "😍", "👍", "🚀", "💡", "❗"];

// --- START: New Feature (Live Arrow Move) ---
const THROTTLE_MS = 16; // Throttle updates to ~60fps
// --- END: New Feature (Live Arrow Move) ---

// --- FIX: Add onLiveUpdate to props ---
function StickyNote({ obj, selected, onSelect, onUpdate, onLiveUpdate }) {
  const groupRef = useRef();
  const textRef = useRef();
  const textareaRef = useRef();
  const isDraggingRef = useRef(false);
  const lastUpdateRef = useRef(0); // Renamed for drag + transform

  const [isEditing, setIsEditing] = useState(false);
  const [textValue, setTextValue] = useState(obj.text || "");
  const [showToolbar, setShowToolbar] = useState(false);

  const stickyConfig = useMemo(() => ({
    width: obj.width,
    height: obj.height,
    fill: obj.fill || "#FFF59D",
    rotation: obj.rotation || 0,
    text: textValue,
  }), [obj.width, obj.height, obj.fill, obj.rotation, textValue]);

  const enableEditing = useCallback(() => {
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      return;
    }
    setIsEditing(true);
    setShowToolbar(false);
    setTimeout(() => textareaRef.current?.focus(), 0);
  }, []);

  const finishEditing = useCallback(() => {
    setIsEditing(false);
    onUpdate(obj.id, { text: textValue });
  }, [obj.id, textValue, onUpdate]);

  const handleClick = useCallback((e) => {
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      return;
    }
    e.cancelBubble = true;
    onSelect(obj.id);
    setShowToolbar(true);
  }, [obj.id, onSelect]);

  const handleDragStart = useCallback(() => {
    isDraggingRef.current = true;
    setShowToolbar(false);
  }, []);

  // --- START: MODIFIED handleDragMove ---
  // Throttled drag move handler
  const handleDragMove = useCallback((e) => {
    // --- THIS IS THE FIX: Uncommented and changed to onLiveUpdate ---
    
    const now = Date.now();
    if (now - lastUpdateRef.current < THROTTLE_MS) {
      return;
    }
    lastUpdateRef.current = now;

    const node = e.target;
    // --- FIX: Use onLiveUpdate ---
    if (onLiveUpdate) {
      onLiveUpdate(obj.id, {
        x: node.x(),
        y: node.y(),
      });
    }
    
    // --- END OF FIX ---
  }, [obj.id, onLiveUpdate, onUpdate]); // --- FIX: Add onLiveUpdate to dependencies ---
  // --- END: MODIFIED handleDragMove ---

  const handleDragEnd = useCallback((e) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;

    onUpdate(obj.id, {
      x: e.target.x(),
      y: e.target.y(),
    });
  }, [obj.id, onUpdate]);

  const handleTransformEnd = useCallback(() => {
    const now = Date.now();
    if (now - lastUpdateRef.current < THROTTLE_MS) {
      return;
    }
    lastUpdateRef.current = now;

    const node = groupRef.current;
    if (!node) return;

    const scaleX = node.scaleX();
    const scaleY = node.scaleY();

    node.scaleX(1);
    node.scaleY(1);

    onUpdate(obj.id, {
      x: node.x(),
      y: node.y(),
      width: Math.max(80, obj.width * scaleX),
      height: Math.max(50, obj.height * scaleY),
      rotation: node.rotation(),
    });
  }, [obj.id, obj.width, obj.height, onUpdate]);

  const handleTextTyping = useCallback((e) => {
    const t = e.target.value;
    setTextValue(t);
    const textarea = e.target;
    textarea.style.height = 'auto';
    const newHeight = textarea.scrollHeight;
    textarea.style.height = newHeight + 'px';
    const newStickyHeight = Math.max(80, newHeight + 40);
    if (newStickyHeight !== obj.height) {
      onUpdate(obj.id, {
        text: t,
        height: newStickyHeight,
      });
    }
  }, [obj.id, obj.height, onUpdate]);

  const handleColorChange = useCallback((color) => {
    onUpdate(obj.id, { fill: color });
    setShowToolbar(false);
  }, [obj.id, onUpdate]);

  const handleEmojiAdd = useCallback((emoji) => {
    const updatedText = textValue + " " + emoji;
    setTextValue(updatedText);
    onUpdate(obj.id, { text: updatedText });
    setShowToolbar(false);
  }, [obj.id, textValue, onUpdate]);

  const handleDelete = useCallback(() => {
    // A soft delete might be better, but for now, we dispatch an update
    // A full delete should be handled by dispatching DELETE_OBJECT
    // Let's assume for now this is just a placeholder
    console.warn("Delete action from sticky note toolbar not fully implemented.");
    // onUpdate(obj.id, { _deleted: true }); // Example of soft delete
  }, []);

  useEffect(() => {
    if (!isEditing || !groupRef.current) return;

    const groupNode = groupRef.current;
    const stage = groupNode.getStage();
    if (!stage) return;

    const updateTextareaPosition = () => {
      const absPos = groupNode.getAbsolutePosition();
      const scale = groupNode.getAbsoluteScale();
      
      const textarea = textareaRef.current;
      if (!textarea) return;

      textarea.style.position = 'absolute';
      textarea.style.top = `${absPos.y}px`;
      textarea.style.left = `${absPos.x}px`;
      textarea.style.width = `${obj.width * scale.x}px`;
      textarea.style.height = `${obj.height * scale.y}px`;
      textarea.style.transform = `rotate(${obj.rotation || 0}deg)`;
      textarea.style.transformOrigin = 'top left';
    };

    updateTextareaPosition();
    const rafId = requestAnimationFrame(updateTextareaPosition);
    
    return () => cancelAnimationFrame(rafId);
  }, [isEditing, obj.width, obj.height, obj.rotation, obj.x, obj.y]);

  useEffect(() => {
    if (!selected && isEditing) {
      finishEditing();
    }
    if (!selected) {
      setShowToolbar(false);
    }
  }, [selected, isEditing, finishEditing]);

  useEffect(() => {
    const handleClickOutside = () => {
      if (showToolbar && !isEditing) {
        setShowToolbar(false);
      }
    };
    if (showToolbar) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showToolbar, isEditing]);

  const Toolbar = useMemo(() => {
    if (!showToolbar || isEditing) return null;
    // Position toolbar above the sticky note
    const toolbarY = -50; // 40px height + 10px spacing
    const toolbarX = 0;

    return (
      <Group x={toolbarX} y={toolbarY}>
        <Rect
          width={200}
          height={40}
          fill="white"
          cornerRadius={8}
          shadowBlur={10}
          shadowColor="rgba(0,0,0,0.2)"
        />
        {COLORS.slice(0, 3).map((color, index) => (
          <Rect
            key={color}
            x={10 + index * 30}
            y={10}
            width={20}
            height={20}
            fill={color}
            cornerRadius={4}
            onClick={(e) => {
              e.cancelBubble = true;
              handleColorChange(color);
            }}
          />
        ))}
        {EMOJIS.slice(0, 3).map((emoji, index) => (
          <Text
            key={emoji}
            x={100 + index * 25}
            y={10}
            text={emoji}
            fontSize={16}
            onClick={(e) => {
              e.cancelBubble = true;
              handleEmojiAdd(emoji);
            }}
          />
        ))}
        <Rect
          x={170}
          y={10}
          width={20}
          height={20}
          fill="#EF4444"
          cornerRadius={4}
          onClick={(e) => {
            e.cancelBubble = true;
            handleDelete();
          }}
        />
        <Text
          x={174}
          y={10}
          text="×"
          fontSize={16}
          fill="white"
          onClick={(e) => {
            e.cancelBubble = true;
            handleDelete();
          }}
        />
      </Group>
    );
  // Position toolbar relative to the group, so we don't need obj.x/y
  }, [showToolbar, isEditing, handleColorChange, handleEmojiAdd, handleDelete]);

  const TextareaOverlay = useMemo(() => {
    if (!isEditing) return null;
    
    // We will calculate position in useEffect
    return (
      <textarea
        ref={textareaRef}
        className="sticky-textarea"
        style={{
          position: "fixed", // Use fixed, position will be set in effect
          background: stickyConfig.fill,
          border: '2px solid #4299e1',
          borderRadius: '8px',
          padding: '12px',
          fontSize: '18px',
          fontFamily: 'Arial, sans-serif',
          lineHeight: '1.4',
          resize: 'none',
          outline: 'none',
          zIndex: 1000,
          boxSizing: 'border-box',
          overflow: 'hidden',
        }}
        value={textValue}
        onChange={handleTextTyping}
        onBlur={finishEditing}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            finishEditing();
          }
          if (e.key === "Escape") {
            finishEditing();
          }
        }}
      />
    );
  }, [isEditing, stickyConfig.fill, textValue, handleTextTyping, finishEditing]);

  return (
    <>
      {/* TextareaOverlay is rendered at root, not inside Konva */}
      {TextareaOverlay} 

      <Group
        id={obj.id}
        ref={groupRef}
        x={obj.x}
        y={obj.y}
        rotation={stickyConfig.rotation}
        draggable
        perfectDrawEnabled={false}
        shadowForStrokeEnabled={false}
        listening={true}
        hitStrokeWidth={20}
        onClick={handleClick}
        onDblClick={enableEditing}
        onDragStart={handleDragStart}
        onDragMove={handleDragMove} // Added for live arrow updates
        onDragEnd={handleDragEnd}
        onTransformEnd={handleTransformEnd}
        // Apply offset for rotation
        offsetX={obj.width / 2}
        offsetY={obj.height / 2}
      >
        {/* Toolbar is now part of the group */}
        {Toolbar} 
        
        <Rect
          width={stickyConfig.width}
          height={stickyConfig.height}
          fill={stickyConfig.fill}
          cornerRadius={8}
          shadowBlur={6}
          shadowColor="rgba(0,0,0,0.2)"
          shadowOffset={{ x: 0, y: 2 }}
          shadowOpacity={0.1}
          stroke={selected ? "#EF4444" : "transparent"}
          strokeWidth={selected ? 3 : 0}
        />
        <Text
          ref={textRef}
          text={stickyConfig.text}
          x={12}
          y={12}
          width={stickyConfig.width - 24}
          height={stickyConfig.height - 24}
          wrap="word"
          fontSize={18}
          fontFamily="Arial"
          fill="#333"
          lineHeight={1.4}
          perfectDrawEnabled={false}
          listening={false}
        />
      </Group>
    </>
  );
}

const areEqual = (prevProps, nextProps) => {
  if (prevProps.obj.id !== nextProps.obj.id) return false;
  if (prevProps.selected !== nextProps.selected) return false;
  
  const prevObj = prevProps.obj;
  const nextObj = nextProps.obj;
  
  if (prevObj.x !== nextObj.x) return false;
  if (prevObj.y !== nextObj.y) return false;
  if (prevObj.width !== nextObj.width) return false;
  if (prevObj.height !== nextObj.height) return false;
  if (prevObj.rotation !== nextObj.rotation) return false;
  if (prevObj.fill !== nextObj.fill) return false;
  if (prevObj.text !== nextObj.text) return false;
  
  if (prevProps.onSelect !== nextProps.onSelect) return false;
  if (prevProps.onUpdate !== nextProps.onUpdate) return false;
  // --- FIX: Add check for onLiveUpdate ---
  if (prevProps.onLiveUpdate !== nextProps.onLiveUpdate) return false;
  
  return true;
};

export default React.memo(StickyNote, areEqual);