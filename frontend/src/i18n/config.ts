import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Translation resources
const resources = {
    en: {
        translation: {
            app: {
                name: 'PersonaChat',
                addNew: 'Add New Persona'
            },
            search: {
                title: 'Ask Anything',
                subtitle: 'Get answers from thousands of specialized personas',
                placeholder: 'Ask a question or search personas...',
                askAll: 'Ask All Personas',
                filter: 'Filter Personas',
                closeFilter: 'Close Filters'
            }
        }
    },
    es: {
        translation: {
            app: {
                name: 'PersonaChat',
                addNew: 'Agregar Nueva Persona'
            },
            search: {
                title: 'Pregunta Cualquier Cosa',
                subtitle: 'Obtén respuestas de miles de personas especializadas',
                placeholder: 'Haz una pregunta o busca personas...',
                askAll: 'Preguntar a Todas las Personas',
                filter: 'Filtrar Personas',
                closeFilter: 'Cerrar Filtros'
            }
        }
    },
    ja: {
        translation: {
            app: {
                name: 'ペルソナチャット',
                addNew: '新しいペルソナを追加'
            },
            search: {
                title: '何でも聞いてください',
                subtitle: '何千もの専門ペルソナから回答を得る',
                placeholder: '質問するかペルソナを検索...',
                askAll: 'すべてのペルソナに質問',
                filter: 'ペルソナをフィルター',
                closeFilter: 'フィルターを閉じる'
            }
        }
    }
};

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources,
        fallbackLng: 'en',
        interpolation: {
            escapeValue: false
        },
        detection: {
            order: ['localStorage', 'navigator'],
            caches: ['localStorage']
        }
    });

export default i18n;