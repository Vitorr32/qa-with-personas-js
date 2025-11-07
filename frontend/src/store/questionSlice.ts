import { createSlice } from "@reduxjs/toolkit";
import { Tag } from "../utils/Tag";
import { Persona } from "../utils/Persona";
import { AnalysisData } from "../utils/interfaces";
import { ResponseStatus } from "../types/utils";

interface QuestionState {
    question: string;
    personas: Persona[];
    attachedFiles: File[];
    tags: Tag[];
    responses: { [id: string]: string };
    analysisStatus: ResponseStatus;
    analysisData?: AnalysisData;
}

const initialState: QuestionState = {
    question: '',
    personas: [],
    attachedFiles: [],
    tags: [],
    responses: {},
    analysisStatus: 'idle',
    analysisData: undefined
};

export const questionSlice = createSlice({
    name: 'question',
    initialState,
    reducers: {
        setQuestion: (state, action) => { state.question = action.payload; },
        setPersonas: (state, action) => { state.personas = action.payload; },
        setFiles: (state, action) => { state.attachedFiles = action.payload; },
        setTags: (state, action) => { state.tags = action.payload; },
        updateResponse: (state, action) => {
            const { personaId, chunk } = action.payload;
            const currentResponse = state.responses[personaId] || '';
            state.responses[personaId] = currentResponse + chunk;
        },
        updateFullResponse: (state, action) => {
            const { personaId, response } = action.payload;
            state.responses[personaId] = response;
        },
        cleanResponses: (state) => {
            state.responses = {};
        },
        setAnalysisStatus: (state, action) => {
            state.analysisStatus = action.payload as ResponseStatus;
        },
        setAnalysisData: (state, action) => {
            state.analysisData = action.payload as AnalysisData | undefined;
        },
        resetAnalysis: (state) => {
            state.analysisStatus = 'idle';
            state.analysisData = undefined;
        }
    },
});

export const { setQuestion, setPersonas, setFiles, setTags, updateResponse, updateFullResponse, cleanResponses, setAnalysisStatus, setAnalysisData, resetAnalysis } = questionSlice.actions;
export default questionSlice.reducer;