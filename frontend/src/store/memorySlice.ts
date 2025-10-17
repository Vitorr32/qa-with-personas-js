import { createSlice } from "@reduxjs/toolkit";

// Slice tasked with maintaining all the personas/tags/prompts in memory as they are fetched
export const memorySlice = createSlice({
    name: 'database',
    initialState: {
        isLoadingPrompts: false,
        dbMainPrompt: "",
        dbAnalystPrompt: "",
        isLoadingPersonas: false,
        dbPersonas: [],
        dbTags: [],
    },
    reducers: {
        setDBMainPrompt: (state, action) => { state.dbMainPrompt = action.payload; },
        setIsLoadingPrompts: (state, action) => { state.isLoadingPrompts = action.payload; },
        setDBAnalystPrompt: (state, action) => { state.dbAnalystPrompt = action.payload; },
        setDBPersonas: (state, action) => { state.dbPersonas = action.payload; },
        setDBTags: (state, action) => { state.dbTags = action.payload; },
        setIsLoadingPersonas: (state, action) => { state.isLoadingPrompts = action.payload; },
    },
});

export const { setDBMainPrompt, setDBAnalystPrompt, setDBPersonas, setDBTags } = memorySlice.actions;
export default memorySlice.reducer;