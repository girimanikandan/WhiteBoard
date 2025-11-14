// src/components/Canvas/tools/StickyNote.jsx
import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Group, Rect, Text } from "react-konva";

// Color presets
const COLORS = ["#FFF59D", "#81D4FA", "#C8E6C9", "#F8BBD0", "#FFCC80"];

// Emoji presets
const EMOJIS = ["😀", "😍", "👍", "🚀", "💡", "❗"];

function StickyNote({ obj, selected, onSelect, onUpdate }) {
  const groupRef = useRef();
  const textRef = useRef();
  const textareaRef = useRef();
  const isDraggingRef = useRef(false);
  const lastTransformRef = useRef(0);
  const TRANSFORM_THROTTLE_MS = 50;

  const [isEditing, setIsEditing] = useState(false);
  const [textValue, setTextValue] = useState(obj.text || "");
  const [showToolbar, setShowToolbar] = useState(false);

  // Memoized configuration
  const stickyConfig = useMemo(() => ({
    width: obj.width,
    height: obj.height,
    fill: obj.fill || "#FFF59D",
    rotation: obj.rotation || 0,
    text: textValue,
  }), [obj.width, obj.height, obj.fill, obj.rotation, textValue]);

  // -------------------------------
  // OPTIMIZED EVENT HANDLERS
  // -------------------------------
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
    if (now - lastTransformRef.current < TRANSFORM_THROTTLE_MS) {
      return;
    }
    lastTransformRef.current = now;

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

  // -------------------------------
  // OPTIMIZED TEXT HANDLING
  // -------------------------------
  const handleTextTyping = useCallback((e) => {
    const t = e.target.value;
    setTextValue(t);

    // Auto-resize textarea
    const textarea = e.target;
    textarea.style.height = 'auto';
    const newHeight = textarea.scrollHeight;
    textarea.style.height = newHeight + 'px';

    // Auto-resize sticky note (with debouncing)
    const newStickyHeight = Math.max(80, newHeight + 40);
    if (newStickyHeight !== obj.height) {
      onUpdate(obj.id, {
        text: t,
        height: newStickyHeight,
      });
    }
  }, [obj.id, obj.height, onUpdate]);

  // Memoized toolbar actions
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
    onUpdate(obj.id, { _deleted: true });
  }, [obj.id, onUpdate]);

  // -------------------------------
  // TEXTAREA POSITIONING (Simplified)
  // -------------------------------
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

  // Close editor when deselected
  useEffect(() => {
    if (!selected && isEditing) {
      finishEditing();
    }
    if (!selected) {
      setShowToolbar(false);
    }
  }, [selected, isEditing, finishEditing]);

  // Close toolbar when clicking outside
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

  // -------------------------------
  // MEMOIZED COMPONENTS
  // -------------------------------
  const Toolbar = useMemo(() => {
    if (!showToolbar || isEditing) return null;

    return (
      <Group x={obj.x} y={obj.y - 60}>
        <Rect
          width={200}
          height={40}
          fill="white"
          cornerRadius={8}
          shadowBlur={10}
          shadowColor="rgba(0,0,0,0.2)"
        />
        
        {/* Color buttons */}
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
        
        {/* Emoji buttons */}
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
        
        {/* Delete button */}
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
  }, [showToolbar, isEditing, obj.x, obj.y, handleColorChange, handleEmojiAdd, handleDelete]);

  const TextareaOverlay = useMemo(() => {
    if (!isEditing) return null;

    return (
      <textarea
        ref={textareaRef}
        className="sticky-textarea"
        style={{
          position: "fixed",
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

  // -------------------------------
  // RENDER COMPONENT
  // -------------------------------
  return (
    <>
      {Toolbar}
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
        onDragEnd={handleDragEnd}
        onTransformEnd={handleTransformEnd}
      >
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

// Advanced memoization with custom comparison
const areEqual = (prevProps, nextProps) => {
  if (prevProps.obj.id !== nextProps.obj.id) return false;
  if (prevProps.selected !== nextProps.selected) return false;
  
  const prevObj = prevProps.obj;
  const nextObj = nextProps.obj;
  
  // Check essential properties
  if (prevObj.x !== nextObj.x) return false;
  if (prevObj.y !== nextObj.y) return false;
  if (prevObj.width !== nextObj.width) return false;
  if (prevObj.height !== nextObj.height) return false;
  if (prevObj.rotation !== nextObj.rotation) return false;
  if (prevObj.fill !== nextObj.fill) return false;
  if (prevObj.text !== nextObj.text) return false;
  
  // Check if event handlers changed
  if (prevProps.onSelect !== nextProps.onSelect) return false;
  if (prevProps.onUpdate !== nextProps.onUpdate) return false;
  
  return true;
};

export default React.memo(StickyNote, areEqual);