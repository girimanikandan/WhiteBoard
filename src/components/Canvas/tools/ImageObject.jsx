// src/components/Canvas/tools/ImageObject.jsx
import React, { useCallback, useRef, useEffect, useMemo, useState } from "react";
import { Image as KImage } from "react-konva";

function ImageObject({ obj, selected, onSelect, onUpdate }) {
  const imageRef = useRef();
  const lastTransformRef = useRef(0);
  const TRANSFORM_THROTTLE_MS = 50;
  
  // Custom image loading state (replaces use-image)
  const [img, setImg] = useState(null);
  const [imgStatus, setImgStatus] = useState('loading'); // 'loading', 'loaded', 'failed'

  // Load image effect
  useEffect(() => {
    if (!obj.src) {
      setImgStatus('failed');
      return;
    }

    setImgStatus('loading');
    const image = new window.Image();
    image.crossOrigin = "anonymous";
    
    image.onload = () => {
      setImg(image);
      setImgStatus('loaded');
    };
    
    image.onerror = () => {
      console.error('Failed to load image:', obj.src);
      setImgStatus('failed');
    };
    
    image.src = obj.src;
  }, [obj.src]);

  // Create a canvas-based image cache for better performance
  const cachedImage = useMemo(() => {
    if (!img) return null;
    
    // For large images, create a scaled version for better performance
    const maxDimension = 1024;
    if (img.width <= maxDimension && img.height <= maxDimension) {
      return img; // Use original if already small
    }
    
    // Create optimized version for large images
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Calculate scaled dimensions while maintaining aspect ratio
    const scale = Math.min(maxDimension / img.width, maxDimension / img.height);
    const scaledWidth = img.width * scale;
    const scaledHeight = img.height * scale;
    
    canvas.width = scaledWidth;
    canvas.height = scaledHeight;
    
    // Draw scaled image
    ctx.drawImage(img, 0, 0, scaledWidth, scaledHeight);
    
    return canvas;
  }, [img]);

  // Use the cached image if available, otherwise use original
  const displayImage = cachedImage || img;

  // Optimized click handler
  const handleClick = useCallback((e) => {
    e.cancelBubble = true;
    onSelect(obj.id);
  }, [obj.id, onSelect]);

  // Optimized drag handler
  const handleDragEnd = useCallback((e) => {
    const node = e.target;
    onUpdate(obj.id, {
      x: node.x(),
      y: node.y(),
    });
  }, [obj.id, onUpdate]);

  // Throttled transform handler
  const handleTransformEnd = useCallback((e) => {
    const now = Date.now();
    if (now - lastTransformRef.current < TRANSFORM_THROTTLE_MS) {
      return;
    }
    lastTransformRef.current = now;

    const node = e.target;

    // Get scale values
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();

    // Reset scaling for Konva
    node.scaleX(1);
    node.scaleY(1);

    // Calculate new dimensions with constraints
    const newWidth = Math.max(20, obj.width * scaleX);
    const newHeight = Math.max(20, obj.height * scaleY);

    onUpdate(obj.id, {
      x: node.x(),
      y: node.y(),
      width: newWidth,
      height: newHeight,
      rotation: node.rotation(), // Preserve rotation
    });
  }, [obj.id, obj.width, obj.height, onUpdate]);

  // Handle image loading states
  const renderPlaceholder = useMemo(() => {
    if (imgStatus === 'loading') {
      return (
        <KImage
          id={obj.id}
          x={obj.x}
          y={obj.y}
          width={obj.width}
          height={obj.height}
          fill="#f0f0f0"
          stroke="#ccc"
          strokeWidth={1}
          listening={false}
        />
      );
    }
    
    if (imgStatus === 'failed') {
      return (
        <KImage
          id={obj.id}
          x={obj.x}
          y={obj.y}
          width={obj.width}
          height={obj.height}
          fill="#ffebee"
          stroke="#f44336"
          strokeWidth={2}
          listening={true}
          onClick={handleClick}
          draggable
          onDragEnd={handleDragEnd}
        />
      );
    }
    
    return null;
  }, [imgStatus, obj, handleClick, handleDragEnd]);

  // Selection styling
  const selectionStyle = useMemo(() => {
    if (!selected) return {};
    
    return {
      stroke: '#EF4444',
      strokeWidth: 2,
      shadowColor: '#EF4444',
      shadowBlur: 10,
      shadowOpacity: 0.3,
    };
  }, [selected]);

  // If image is still loading or failed, show placeholder
  if (imgStatus !== 'loaded' || !displayImage) {
    return renderPlaceholder;
  }

  return (
    <KImage
      ref={imageRef}
      id={obj.id}
      image={displayImage}
      x={obj.x}
      y={obj.y}
      width={obj.width}
      height={obj.height}
      draggable
      
      // Selection styling
      {...selectionStyle}
      
      // Performance optimizations
      perfectDrawEnabled={false}
      shadowForStrokeEnabled={false}
      imageSmoothingEnabled={true}
      listening={true}
      hitStrokeWidth={20}
      
      // Optimize rendering
      _useStrictMode={false}
      globalCompositeOperation="source-over"
      
      // Event handlers
      onClick={handleClick}
      onDragEnd={handleDragEnd}
      onTransformEnd={handleTransformEnd}
      
      // Transform constraints
      rotation={obj.rotation || 0}
      offsetX={obj.width / 2}
      offsetY={obj.height / 2}
    />
  );
}

// Custom comparison function for React.memo
const areEqual = (prevProps, nextProps) => {
  // Basic prop comparison
  if (prevProps.obj.id !== nextProps.obj.id) return false;
  if (prevProps.selected !== nextProps.selected) return false;
  
  // Deep comparison of image object properties
  const prevObj = prevProps.obj;
  const nextObj = nextProps.obj;
  
  if (prevObj.src !== nextObj.src) return false;
  if (prevObj.x !== nextObj.x) return false;
  if (prevObj.y !== nextObj.y) return false;
  if (prevObj.width !== nextObj.width) return false;
  if (prevObj.height !== nextObj.height) return false;
  if (prevObj.rotation !== nextObj.rotation) return false;
  
  return true;
};

export default React.memo(ImageObject, areEqual);