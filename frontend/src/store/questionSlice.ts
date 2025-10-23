import { createSlice } from "@reduxjs/toolkit";
import { Tag } from "../utils/Tag";
import { Persona } from "../utils/Persona";

interface QuestionState {
    question: string;
    personas: Persona[];
    attachedFiles: File[];
    tags: Tag[];
    responses: { [id: string]: string };
    fileIds: string[];
}

const initialState: QuestionState = {
    question: '',
    personas: [],
    attachedFiles: [],
    tags: [],
    responses: {},
    fileIds: [],
};

export const questionSlice = createSlice({
    name: 'question',
    initialState,
    reducers: {
        setQuestion: (state, action) => { state.question = action.payload; },
        setPersonas: (state, action) => { state.personas = action.payload; },
        setFiles: (state, action) => { state.attachedFiles = action.payload; },
        setTags: (state, action) => { state.tags = action.payload; },
        setFilesIds: (state, action) => { state.fileIds = action.payload; },
        updateResponse: (state, action) => {
            const { personaId, response } = action.payload;
            const currentResponse = state.responses[personaId] || '';
            state.responses[personaId] = currentResponse + response;
        },
        updateFullResponse: (state, action) => {
            const { personaId, response } = action.payload;
            state.responses[personaId] = response;
        }
    },
});

export const { setQuestion, setPersonas, setFiles, setTags, setFilesIds, updateResponse, updateFullResponse } = questionSlice.actions;
export default questionSlice.reducer;