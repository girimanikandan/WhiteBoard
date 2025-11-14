// src/components/Toolbar/Toolbar.jsx
import React, { useRef, useCallback } from "react";

const TOOL_BUTTONS = [
  { id: "select", icon: "🖱", label: "Select", description: "Select and move objects" },
  { id: "draw", icon: "✏️", label: "Draw", description: "Freehand drawing" },
  { id: "sticky", icon: "📝", label: "Sticky", description: "Add sticky note" },
  { id: "text", icon: "🔤", label: "Text", description: "Add text box" },
  { id: "rect", icon: "▭", label: "Rect", description: "Add rectangle" },
  { id: "circle", icon: "⚪", label: "Circle", description: "Add circle" },
  { id: "line", icon: "㣣", label: "Line", description: "Draw straight line" },
  { id: "arrow", icon: "➤", label: "Arrow", description: "Connect objects" },
];

function Toolbar({
  mode,
  setMode,
  onColorChange,
  onImageUpload, // This prop IS the file handler function from BoardCanvas
  onUndo,
  onRedo,
  onZoomIn,
  onZoomOut,
  onClearBoard,
  canUndo = true,
  canRedo = true,
}) {
  // This ref is for the file input *within* this component
  const fileInputRef = useRef();

  // This handler just clicks the hidden file input
  const handleImageButtonClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // This handler gets the file event and passes it to the prop
  // which is the onImageUpload function from BoardCanvas
  const handleFileSelect = useCallback((e) => {
    onImageUpload(e);
    // Clear the input value so the same file can be uploaded again
    if (fileInputRef.current) {
      fileInputRef.current.value = null;
    }
  }, [onImageUpload]);

  return (
    <div className="absolute top-4 left-4 z-50 bg-white shadow-xl rounded-2xl p-3 flex items-center gap-2 border border-gray-200">
      {/* Tools */}
      <div className="flex items-center gap-1">
        {TOOL_BUTTONS.map((tool) => (
          <button
            key={tool.id}
            onClick={() => setMode(tool.id)}
            title={tool.description}
            className={`relative group flex items-center gap-2 px-3 py-2 rounded-lg border transition-all duration-200 font-medium text-sm
              ${mode === tool.id 
                ? 'bg-blue-500 text-white border-blue-600 shadow-md' 
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
          >
            <span className="text-base">{tool.icon}</span>
            <span>{tool.label}</span>
          </button>
        ))}
      </div>

      <div className="w-px h-6 bg-gray-300 mx-1" />

      {/* Color Picker */}
      <div className="relative group">
        <input
          type="color"
          className="w-9 h-9 rounded-lg cursor-pointer border border-gray-300 hover:border-gray-400 transition-colors"
          onChange={(e) => onColorChange(e.target.value)}
          title="Choose color"
        />
      </div>

      <div className="w-px h-6 bg-gray-300 mx-1" />

      {/* Actions */}
      <div className="flex items-center gap-1">
        <button
          onClick={onUndo}
          disabled={!canUndo}
          title="Undo"
          className={`px-3 py-2 rounded-lg border transition-all font-medium text-sm
            ${canUndo 
              ? 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50' 
              : 'opacity-40 cursor-not-allowed'
            }`}
        >
          ↩️ Undo
        </button>

        <button
          onClick={onRedo}
          disabled={!canRedo}
          title="Redo"
          className={`px-3 py-2 rounded-lg border transition-all font-medium text-sm
            ${canRedo 
              ? 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50' 
              : 'opacity-40 cursor-not-allowed'
            }`}
        >
          ↪️ Redo
        </button>
      </div>

      <div className="w-px h-6 bg-gray-300 mx-1" />

      {/* Zoom */}
      <div className="flex items-center gap-1">
        <button
          onClick={onZoomIn}
          title="Zoom In"
          className="px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-all font-medium text-sm"
        >
          🔍+
        </button>
        <button
          onClick={onZoomOut}
          title="Zoom Out"
          className="px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-all font-medium text-sm"
        >
          🔍-
        </button>
      </div>

      <div className="w-px h-6 bg-gray-300 mx-1" />

      {/* Media */}
      <button
        onClick={handleImageButtonClick} // Click the button
        title="Upload image"
        className="px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-all font-medium text-sm"
      >
        🖼️ Image
      </button>

      {/* This input is hidden. It is clicked by the button above. */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={handleFileSelect} // When file is selected, call handler
      />

      <div className="w-px h-6 bg-gray-300 mx-1" />

      {/* Clear Board */}
      <button
        onClick={onClearBoard}
        title="Clear entire board"
        className="px-3 py-2 rounded-lg border border-red-300 bg-red-500 text-white hover:bg-red-600 transition-all font-medium text-sm"
      >
        🗑️ Clear
      </button>
    </div>
  );
}

export default React.memo(Toolbar);