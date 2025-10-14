import { createSlice } from "@reduxjs/toolkit";

// Redux Slice
export const questionSlice = createSlice({
    name: 'question',
    initialState: {
        question: '',
        personas: [],
        attachedFiles: [],
        tags: [],
    },
    reducers: {
        setQuestion: (state, action) => { state.question = action.payload; },
        setPersonas: (state, action) => { state.personas = action.payload; },
        setFiles: (state, action) => { state.attachedFiles = action.payload; },
        setTags: (state, action) => { state.tags = action.payload; },
    },
});

export const { setQuestion, setPersonas, setFiles, setTags } = questionSlice.actions;
export default questionSlice.reducer;