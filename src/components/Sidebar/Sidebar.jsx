// src/components/Sidebar/Sidebar.jsx
import React, { useMemo, useCallback, useState, useEffect } from "react";

// Enhanced color presets with better organization
const COLOR_PRESETS = [
  // Primary colors
  { value: "#000000", name: "Black", category: "basic" },
  { value: "#ffffff", name: "White", category: "basic" },
  { value: "#64748b", name: "Gray", category: "basic" },
  
  // Brand colors
  { value: "#3b82f6", name: "Blue", category: "brand" },
  { value: "#ef4444", name: "Red", category: "brand" },
  { value: "#10b981", name: "Green", category: "brand" },
  { value: "#f59e0b", name: "Amber", category: "brand" },
  
  // Extended palette
  { value: "#8b5cf6", name: "Purple", category: "extended" },
  { value: "#ec4899", name: "Pink", category: "extended" },
  { value: "#06b6d4", name: "Cyan", category: "extended" },
  { value: "#84cc16", name: "Lime", category: "extended" },
];

// Enhanced tool modes with categories
const TOOL_MODES = [
  { 
    id: "select", 
    icon: "🖱", 
    label: "Select", 
    description: "Select and move objects",
    category: "basic"
  },
  { 
    id: "draw", 
    icon: "✏️", 
    label: "Draw", 
    description: "Freehand drawing",
    category: "drawing"
  },
  { 
    id: "text", 
    icon: "🔤", 
    label: "Text", 
    description: "Add text boxes",
    category: "content"
  },
  { 
    id: "arrow", 
    icon: "➡️", 
    label: "Arrow", 
    description: "Connect objects with arrows",
    category: "connectors"
  },
  { 
    id: "line", 
    icon: "〰️", 
    label: "Line", 
    description: "Draw straight lines",
    category: "drawing"
  },
];

const SHAPE_TYPES = [
  { 
    id: "rect", 
    icon: "▭", 
    label: "Rectangle", 
    description: "Add rectangle shape",
    category: "shapes"
  },
  { 
    id: "circle", 
    icon: "⚪", 
    label: "Circle", 
    description: "Add circle shape",
    category: "shapes"
  },
];

// Quick actions for common tasks
const QUICK_ACTIONS = [
  { 
    id: "sticky", 
    icon: "📝", 
    label: "Sticky Note", 
    description: "Add a new sticky note",
    action: "onAddSticky"
  },
];

function Sidebar({
  onAddSticky,
  onAddShape,
  setMode,
  onImageUpload,
  onUndo,
  onRedo,
  onZoomIn,
  onZoomOut,
  onClearBoard,
  onColorChange,
  mode: currentMode,
  canUndo = true,
  canRedo = true,
  isCollapsed = false,
  onToggleCollapse,
}) {
  const [selectedColor, setSelectedColor] = useState("#000000");
  const [activeCategory, setActiveCategory] = useState("all");

  // Memoized color change handler with validation
  const handleColorChange = useCallback((color) => {
    if (color && /^#[0-9A-F]{6}$/i.test(color)) {
      setSelectedColor(color);
      onColorChange(color);
    }
  }, [onColorChange]);

  // Memoized shape addition
  const handleAddShape = useCallback((shapeType) => {
    onAddShape(shapeType);
    // Auto-switch to select mode after adding shape
    setMode("select");
  }, [onAddShape, setMode]);

  // Memoized mode change
  const handleModeChange = useCallback((newMode) => {
    setMode(newMode);
  }, [setMode]);

  // Enhanced clear board with more descriptive confirmation
  const handleClearBoard = useCallback(() => {
    const objectCount = Object.keys(window.boardObjects || {}).length;
    if (objectCount > 0) {
      const message = `Are you sure you want to clear the entire board? This will remove ${objectCount} object${objectCount !== 1 ? 's' : ''} and cannot be undone.`;
      if (window.confirm(message)) {
        onClearBoard();
      }
    } else {
      alert("The board is already empty!");
    }
  }, [onClearBoard]);

  // Keyboard shortcuts helper
  useEffect(() => {
    const handleKeyPress = (e) => {
      // Only handle shortcuts when sidebar is likely focused
      if (e.target.tagName === 'BODY') {
        switch (e.key) {
          case '1': setMode("select"); break;
          case '2': setMode("draw"); break;
          case '3': setMode("text"); break;
          case '4': setMode("rect"); break;
          case '5': setMode("circle"); break;
          default: break;
        }
      }
    };

    document.addEventListener('keypress', handleKeyPress);
    return () => document.removeEventListener('keypress', handleKeyPress);
  }, [setMode]);

  // Enhanced ToolButton with better styling from your CSS system
  const ToolButton = useCallback(({ 
    icon, 
    label, 
    onClick, 
    isActive = false, 
    disabled = false, 
    title = "",
    showShortcut = false,
    shortcutKey = ""
  }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`
        tool-btn group relative
        flex items-center gap-3 w-full px-3 py-2.5
        text-left rounded-lg border-2 transition-all duration-200
        hover-lift focus-visible
        ${isActive 
          ? 'tool-active border-primary shadow-glow' 
          : 'bg-surface border-border text-text-primary hover:border-primary-light'
        }
        ${disabled 
          ? 'opacity-40 cursor-not-allowed hover:transform-none' 
          : 'cursor-pointer'
        }
      `}
    >
      <span className="tool-icon text-lg flex-shrink-0">{icon}</span>
      <span className="font-medium text-sm flex-1">{label}</span>
      
      {/* Shortcut badge */}
      {showShortcut && shortcutKey && (
        <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-mono">
          {shortcutKey}
        </span>
      )}
      
      {/* Enhanced hover tooltip */}
      {title && (
        <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-50 whitespace-nowrap shadow-lg">
          {title}
          <div className="absolute top-1/2 right-full -mt-1 border-4 border-transparent border-r-gray-900" />
        </div>
      )}
    </button>
  ), []);

  // Enhanced ColorButton with better styling
  const ColorButton = useCallback(({ color, name, isSelected, onClick }) => (
    <button
      onClick={() => onClick(color)}
      title={name}
      className={`
        color-swatch relative
        w-8 h-8 rounded-full border-2 transition-all duration-200
        hover-lift focus-visible
        ${isSelected 
          ? 'border-text-primary shadow-md scale-110' 
          : 'border-border hover:border-primary-light'
        }
      `}
      style={{ background: color }}
    >
      {/* Checkmark for selected color */}
      {isSelected && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-white text-sm font-bold drop-shadow-md">✓</span>
        </div>
      )}
    </button>
  ), []);

  // Enhanced Section component
  const Section = useCallback(({ title, children, className = "" }) => (
    <div className={`flex flex-col gap-2 ${className}`}>
      <h3 className="section-title text-xs font-semibold text-text-secondary uppercase tracking-wide mb-1">
        {title}
      </h3>
      {children}
    </div>
  ), []);

  // Filter tools by category
  const filteredTools = useMemo(() => {
    if (activeCategory === "all") return TOOL_MODES;
    return TOOL_MODES.filter(tool => tool.category === activeCategory);
  }, [activeCategory]);

  // Get current mode info for display
  const currentModeInfo = useMemo(() => {
    return TOOL_MODES.find(tool => tool.id === currentMode) || 
           SHAPE_TYPES.find(shape => shape.id === currentMode) || 
           { label: "Select", icon: "🖱" };
  }, [currentMode]);

  if (isCollapsed) {
    return (
      <div className="sidebar collapsed glass">
        <button
          onClick={onToggleCollapse}
          className="w-12 h-12 flex items-center justify-center bg-primary text-white rounded-r-lg hover:bg-primary-dark transition-colors"
          title="Expand sidebar"
        >
          ➤
        </button>
      </div>
    );
  }

  return (
    <div className="sidebar glass custom-scrollbar">
      {/* Enhanced Header */}
      <div className="sidebar-header p-4 border-b border-border-light bg-gradient-to-r from-gray-50 to-surface">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onToggleCollapse}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-border-light transition-colors"
              title="Collapse sidebar"
            >
              ◀
            </button>
            <div>
              <h2 className="text-lg font-bold text-gradient">Design Tools</h2>
              <p className="text-xs text-text-muted mt-0.5">
                {currentModeInfo.label} Mode
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 p-4 space-y-6 overflow-y-auto">
        {/* Quick Actions */}
        <Section title="Quick Add">
          {QUICK_ACTIONS.map((action) => (
            <ToolButton
              key={action.id}
              icon={action.icon}
              label={action.label}
              onClick={onAddSticky}
              title={action.description}
              showShortcut={true}
              shortcutKey="S"
            />
          ))}
        </Section>

        {/* Category Filter */}
        <Section title="Tool Categories">
          <div className="flex gap-1">
            {["all", "basic", "drawing", "content", "connectors"].map(category => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`
                  px-2 py-1 text-xs rounded capitalize transition-colors
                  ${activeCategory === category
                    ? 'bg-primary text-white'
                    : 'bg-border-light text-text-secondary hover:bg-border'
                  }
                `}
              >
                {category}
              </button>
            ))}
          </div>
        </Section>

        {/* Tools */}
        <Section title="Tools">
          {filteredTools.map((tool, index) => (
            <ToolButton
              key={tool.id}
              icon={tool.icon}
              label={tool.label}
              onClick={() => handleModeChange(tool.id)}
              isActive={currentMode === tool.id}
              title={tool.description}
              showShortcut={true}
              shortcutKey={(index + 1).toString()}
            />
          ))}
        </Section>

        {/* Shapes */}
        <Section title="Shapes">
          {SHAPE_TYPES.map((shape, index) => (
            <ToolButton
              key={shape.id}
              icon={shape.icon}
              label={shape.label}
              onClick={() => handleAddShape(shape.id)}
              isActive={currentMode === shape.id}
              title={shape.description}
              showShortcut={true}
              shortcutKey={(index + 4).toString()}
            />
          ))}
        </Section>

        {/* Enhanced Color Picker */}
        <Section title="Colors">
          <div className="color-grid grid grid-cols-4 gap-2">
            {COLOR_PRESETS.map((color) => (
              <ColorButton
                key={color.value}
                color={color.value}
                name={color.name}
                isSelected={selectedColor === color.value}
                onClick={handleColorChange}
              />
            ))}
          </div>
          
          {/* Enhanced current color display */}
          <div className="flex items-center justify-between gap-2 mt-3 p-2 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              <div 
                className="w-6 h-6 rounded border-2 border-border shadow-sm"
                style={{ background: selectedColor }}
              />
              <span className="text-sm font-medium text-text-primary">
                Current Color
              </span>
            </div>
            <span className="text-xs text-text-muted font-mono">
              {selectedColor.toUpperCase()}
            </span>
          </div>

          {/* Custom color input */}
          <div className="mt-2">
            <label className="text-xs text-text-secondary block mb-1">
              Custom Color:
            </label>
            <input
              type="color"
              value={selectedColor}
              onChange={(e) => handleColorChange(e.target.value)}
              className="color-picker w-full h-8 rounded-lg cursor-pointer"
              title="Choose custom color"
            />
          </div>
        </Section>

        {/* Media */}
        <Section title="Media">
          <ToolButton
            icon="🖼️"
            label="Upload Image"
            onClick={onImageUpload}
            title="Upload an image to the board"
          />
        </Section>

        {/* History */}
        <Section title="History">
          <div className="grid grid-cols-2 gap-2">
            <ToolButton
              icon="↩️"
              label="Undo"
              onClick={onUndo}
              disabled={!canUndo}
              title={canUndo ? "Undo last action (Ctrl+Z)" : "Nothing to undo"}
              showShortcut={true}
              shortcutKey="Z"
            />
            <ToolButton
              icon="↪️"
              label="Redo"
              onClick={onRedo}
              disabled={!canRedo}
              title={canRedo ? "Redo last action (Ctrl+Shift+Z)" : "Nothing to redo"}
              showShortcut={true}
              shortcutKey="Y"
            />
          </div>
        </Section>

        {/* Zoom */}
        <Section title="Zoom">
          <div className="grid grid-cols-2 gap-2">
            <ToolButton
              icon="🔍+"
              label="Zoom In"
              onClick={onZoomIn}
              title="Zoom in (Ctrl +)"
              showShortcut={true}
              shortcutKey="+"
            />
            <ToolButton
              icon="🔍-"
              label="Zoom Out"
              onClick={onZoomOut}
              title="Zoom out (Ctrl -)"
              showShortcut={true}
              shortcutKey="-"
            />
          </div>
        </Section>

        {/* Dangerous Actions */}
        <Section title="Actions" className="mt-auto pt-4 border-t border-border-light">
          <ToolButton
            icon="🗑️"
            label="Clear Board"
            onClick={handleClearBoard}
            title="Remove all objects from the board"
            className="btn-danger"
          />
        </Section>
      </div>

      {/* Enhanced Footer */}
      <div className="p-3 border-t border-border-light bg-gray-50">
        <div className="text-xs text-text-muted text-center">
          <div>Made with ❤️</div>
          <div className="mt-1 text-[10px] opacity-70">
            Press 1-5 for quick tools
          </div>
        </div>
      </div>
    </div>
  );
}

// Enhanced memoization with custom comparison
const areEqual = (prevProps, nextProps) => {
  return (
    prevProps.mode === nextProps.mode &&
    prevProps.canUndo === nextProps.canUndo &&
    prevProps.canRedo === nextProps.canRedo &&
    prevProps.isCollapsed === nextProps.isCollapsed
  );
};

export default React.memo(Sidebar, areEqual);