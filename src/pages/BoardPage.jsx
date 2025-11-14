// src/pages/BoardPage.jsx
import React, { useState, useCallback } from "react";
import { useParams } from "react-router-dom";

import BoardCanvas from "../components/Canvas/BoardCanvas";
import ShareModal from "../components/ShareModal";
import Toolbar from "../components/Toolbar/Toolbar";   // ✅ import Toolbar
import { useAppState } from "../context/AppProvider";

export default function BoardPage() {
  const { boardId } = useParams();
  const { objects, user } = useAppState();
  const [showShareModal, setShowShareModal] = useState(false);

  // --- Toolbar handlers ---
  const [mode, setMode] = useState("select");
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);

  const handleUndo = () => {
    if (undoStack.length > 0) {
      const last = undoStack.pop();
      setRedoStack([...redoStack, last]);
      setUndoStack([...undoStack]);
      console.log("Undo:", last);
    }
  };

  const handleRedo = () => {
    if (redoStack.length > 0) {
      const last = redoStack.pop();
      setUndoStack([...undoStack, last]);
      setRedoStack([...redoStack]);
      console.log("Redo:", last);
    }
  };

  const handleZoomIn = () => console.log("Zoom In");
  const handleZoomOut = () => console.log("Zoom Out");
  const handleClearBoard = () => console.log("Clear Board");
  const handleColorChange = (e) => console.log("Color:", e.target.value);
  const handleImageUpload = (e) => console.log("Image:", e.target.files[0]);

  // --- Export logic ---
  const handleExport = useCallback(() => {
    try {
      const dataStr = JSON.stringify(objects, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `board-${boardId || 'default'}-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      alert('Failed to export board data');
    }
  }, [objects, boardId]);

  return (
    <div className="w-screen h-screen flex flex-col bg-gray-50 overflow-hidden">
      {/* Top Navigation */}
      <div className="h-16 px-6 bg-white border-b border-gray-200 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-gray-800">Miro Clone</h1>
          <div className="px-3 py-1 bg-blue-500 text-white rounded-full text-sm font-medium">
            {Object.keys(objects).length} objects
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-sm text-gray-600">
            {user?.name || 'You'}
          </div>

          <button 
            onClick={() => setShowShareModal(true)}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
          >
            Share
          </button>

          <button 
            onClick={handleExport}
            className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors"
          >
            Export
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 relative">
        {/* ✅ Add Toolbar */}
        <Toolbar
          mode={mode}
          setMode={setMode}
          onColorChange={handleColorChange}
          onImageUpload={handleImageUpload}
          onUndo={handleUndo}
          onRedo={handleRedo}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onClearBoard={handleClearBoard}
          canUndo={undoStack.length > 0}
          canRedo={redoStack.length > 0}
        />

        <BoardCanvas />
      </div>

      {/* Share Modal */}
      <ShareModal 
        boardId={boardId}
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
      />
    </div>
  );
}
