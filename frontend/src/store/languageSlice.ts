import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import i18n from '../i18n/config';

interface LanguageState {
    currentLanguage: string;
    availableLanguages: string[];
}

const initialState: LanguageState = {
    currentLanguage: i18n.language,
    availableLanguages: ['en', 'es', 'ja']
};

export const languageSlice = createSlice({
    name: 'language',
    initialState,
    reducers: {
        setLanguage: (state, action: PayloadAction<string>) => {
            state.currentLanguage = action.payload;
            i18n.changeLanguage(action.payload);
            localStorage.setItem('language', action.payload);
        }
    }
});

export const { setLanguage } = languageSlice.actions;
export default languageSlice.reducer;