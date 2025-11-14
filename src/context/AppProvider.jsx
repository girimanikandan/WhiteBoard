// src/context/AppProvider.jsx
import React, { createContext, useContext, useReducer, useEffect, useRef } from "react";
import { uuid } from "../utils/uuid"; // Import uuid

const AppStateContext = createContext();
const AppDispatchContext = createContext();

const initialState = {
  objects: {},
  selectedIds: [],
  mode: "select",
  boardId: "default",
  remoteCursors: [],
  user: {
    id: 'user-' + uuid(), // Use uuid()
    name: "Guest-" + Math.floor(Math.random() * 999),
  },
  history: [],
  future: [],
  historyLimit: 50,
  reconnect: {
  active: false,
  arrowId: null,
  endpoint: null, 
},

};

const ActionTypes = {
  SET_MODE: "SET_MODE",
  SET_SELECTED: "SET_SELECTED",
  ADD_OBJECT: "ADD_OBJECT",
  UPDATE_OBJECT: "UPDATE_OBJECT",
  DELETE_OBJECT: "DELETE_OBJECT",
  CLEAR_BOARD: "CLEAR_BOARD",
  UNDO: "UNDO",
  REDO: "REDO",
};

function reducer(state, action) {
  switch (action.type) {
    case ActionTypes.SET_MODE:
      return { ...state, mode: action.payload };

    case ActionTypes.SET_SELECTED:
      return { ...state, selectedIds: action.payload };

    case ActionTypes.ADD_OBJECT: {
      const newObjects = {
        ...state.objects,
        [action.payload.id]: action.payload,
      };
      return {
        ...state,
        objects: newObjects,
        selectedIds: [action.payload.id],
        history: [...state.history, state.objects],
        future: [],
      };
    }

    case ActionTypes.UPDATE_OBJECT: {
      const { id, updates } = action.payload;
      const existingObject = state.objects[id];
      if (!existingObject) return state;

      const newObjects = {
        ...state.objects,
        [id]: { ...existingObject, ...updates },
      };

      // --- THIS IS THE FIX ---
      return { 
        ...state, 
        objects: newObjects,
        history: [...state.history, state.objects], // Save previous state
        future: [], // Clear future on update
      };
      // --- END OF FIX ---
    }

    case ActionTypes.DELETE_OBJECT: {
      const idToDelete = action.payload;
      const newObjects = { ...state.objects };
      delete newObjects[idToDelete];

      // --- THIS IS THE FIX ---
      return {
        ...state,
        objects: newObjects,
        selectedIds: state.selectedIds.filter(id => id !== idToDelete),
        history: [...state.history, state.objects], // Save previous state
        future: [], // Clear future on delete
      };
      // --- END OF FIX ---
    }

    case ActionTypes.CLEAR_BOARD:
      return { 
        ...state, 
        objects: {}, 
        selectedIds: [],
        history: [...state.history, state.objects],
        future: [],
      };

    case ActionTypes.UNDO: {
      if (state.history.length === 0) return state;
      const previous = state.history[state.history.length - 1];
      return {
        ...state,
        objects: previous,
        history: state.history.slice(0, -1),
        future: [...state.future, state.objects],
        selectedIds: [],
      };
    }

    case ActionTypes.REDO: {
      if (state.future.length === 0) return state;
      const next = state.future[state.future.length - 1];
      return {
        ...state,
        objects: next,
        future: state.future.slice(0, -1),
        history: [...state.history, state.objects],
        selectedIds: [],
      };
    }
    case "RECONNECT_START":
  return {
    ...state,
    reconnect: {
      active: true,
      arrowId: action.payload.arrowId,
      endpoint: action.payload.endpoint,
    }
  };

case "RECONNECT_END":
  return {
    ...state,
    reconnect: { active: false, arrowId: null, endpoint: null }
  };


    default:
      return state;
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const saveTimeoutRef = useRef();

  // Auto-save to localStorage
  useEffect(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      try {
        localStorage.setItem("miro-board", JSON.stringify(state.objects));
      } catch (error) {
        console.warn("Failed to save board:", error);
      }
    }, 500);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [state.objects]);

  return (
    <AppStateContext.Provider value={state}>
      <AppDispatchContext.Provider value={dispatch}>
        {children}
      </AppDispatchContext.Provider>
    </AppStateContext.Provider>
  );
}

export function useAppState() {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error("useAppState must be used within an AppProvider");
  }
  return context;
}

export function useAppDispatch() {
  const context = useContext(AppDispatchContext);
  if (!context) {
    throw new Error("useAppDispatch must be used within an AppProvider");
  }
  return context;
}

export { ActionTypes };