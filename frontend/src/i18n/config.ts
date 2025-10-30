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
            },
            mainpage: {
                selectedPersonaCount_one: 'Get answers from {{count}} selected persona',
                selectedPersonaCount_other: 'Get answers from {{count}} selected personas',
                defaultPersonaText: 'Get answers from thousands of specialized personas',
                askPersona_one: 'Ask {{count}} Persona',
                askPersona_other: 'Ask {{count}} Personas',
                askAllPersonas: 'Ask All Personas',
                selectPersonas: 'Select Personas',
                editSelection: 'Edit Selection',
                selectedPersonas: 'Selected Personas:',
                selectedBadge: '{{count}} selected',
                done: 'Done'
            },
            response: {
                personaResponses: 'Persona Responses',
                askingPersonasAbout_one: 'Asking {{count}} persona about: "{{question}}"',
                askingPersonasAbout_other: 'Asking {{count}} personas about: "{{question}}"',
                responsesTab: 'Responses',
                analysisTab: 'Analysis',
                completedCounter: '{{completed}} / {{total}} completed',
                allReceived: 'All responses received',
                preparingPersonas: 'Preparing personas and uploading files...'
            },
            personagrid: {
                foundCount_one: '{{count}} Persona Found',
                foundCount_other: '{{count}} Personas Found',
                allSelected: 'All Selected',
                addAll: 'Add All to List',
                noFound: 'No personas found',
                tryAdjustSearch: 'Try adjusting your search or filters',
                loadMore: 'Load More'
            },
            remove: {
                title: 'Remove Personas',
                subtitle: 'Select and remove personas',
                foundCount_one: '{{count}} Persona Found',
                foundCount_other: '{{count}} Personas Found',
                noSelected: 'No Personas Selected',
                removeCount_one: 'Remove {{count}} Persona',
                removeCount_other: 'Remove {{count}} Personas',
                noFound: 'No personas found',
                confirmTitle: 'Confirm Removal',
                confirmText_one: 'You are about to permanently delete {{count}} persona. This action cannot be undone.',
                confirmText_other: 'You are about to permanently delete {{count}} personas. This action cannot be undone.',
                toBeRemovedLabel: 'Personas to be removed:',
                andMore: '... and {{count}} more',
                confirmButton: 'Yes, Remove'
            },
            common: {
                done: 'Done',
                cancel: 'Cancel'
            },
            personaadd: {
                title: 'Add New Persona',
                subtitle: 'Create a new persona with custom attributes',
                avatarLabel: 'Avatar (Optional)',
                chooseImage: 'Choose Image',
                nameLabel: 'Name *',
                namePlaceholder: 'e.g., Code Expert',
                greetingLabel: 'Greeting *',
                greetingPlaceholder: 'e.g., Hello! I\'m here to help you code.',
                descriptionLabel: 'Description *',
                descriptionPlaceholder: 'Describe the persona\'s expertise and capabilities...',
                tagsLabel: 'Tags',
                createButton: 'Create Persona'
            },
            prompts: {
                title: 'System Prompts',
                subtitle: 'Configure the default prompts for the system',
                mainLabel: 'Main Prompt',
                mainHelp: 'Used for general queries',
                mainPlaceholder: 'Enter the main system prompt...',
                analystLabel: 'Analyst Prompt',
                analystHelp: 'Used for analyzing responses',
                analystPlaceholder: 'Enter the analyst prompt...',
                charCount: '{{count}} characters',
                saveButton: 'Save Prompts',
                saving: 'Saving...',
                saved: 'Saved!'
            },
            personaeditmodal: {
                title: 'Edit Persona',
                nameLabel: 'Name',
                greetingLabel: 'Greeting',
                descriptionLabel: 'Description',
                tagsLabel: 'Tags',
                addTagPlaceholder: 'Add tag...',
                addButton: 'Add',
                saveChangesButton: 'Save Changes'
            },
            personaedit: {
                title: 'Edit Personas',
                subtitle: 'Search and modify existing personas',
                updatedSuccess: 'Persona {{name}} updated successfully!',
                updateFailed: 'Failed to update persona: {{message}}'
            },
            personachip: {
                ariaRemove: 'Remove {{name}}'
            },
            personacard: {
                ariaViewDetails: 'View details',
                description: 'Description',
                tagsLabel: 'Tags ({{count}})',
                metadata: 'Metadata',
                id: 'ID',
                totalTags: 'Total Tags',
                close: 'Close',
                addToSelection: 'Add to Selection',
                removeFromSelection: 'Remove from Selection'
            },
            tagpicker: {
                clearAll: 'Clear all',
                inputPlaceholder: 'Type to search tags...',
                ariaRemove: 'Remove {{name}}',
                noTagsFound: 'No tags found',
                createTag: 'Create "{{name}}" tag',
                noMatchingFound: 'No tags found matching "{{value}}"'
            },
            header: {
                home: 'Home',
                settings: 'Settings',
                changeLanguage: 'Change language'
            },
            questioninput: {
                placeholder: 'What would you like to ask?'
            },
            analysistab: {
                analysisTitle: 'AI Analysis',
                subtitle: 'Comprehensive response analysis',
                startAnalysis: 'Start Analysis',
                analyzing: 'Analyzing...',
                analysisComplete: 'Analysis Complete',
                analysisFailed: 'Analysis failed',
                downloadJsonTitle: 'Download Analysis as JSON',
                downloadJson: 'Download JSON'
            },
            responsecard: {
                waiting: 'Waiting...',
                responding: 'Responding...',
                completed: 'Completed',
                error: 'Error',
                idle: 'Idle',
                waitingInQueue: 'Waiting in queue...',
                failedToGetResponse: 'Failed to get response',
                completedIn: 'Completed in {{seconds}}s'
            },
            sentiment: {
                positive: 'Positive',
                neutral: 'Neutral',
                negative: 'Negative'
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
            },
            analysistab: {
                analysisFailed: 'Error en el análisis',
                downloadJsonTitle: 'Descargar análisis en JSON',
                downloadJson: 'Descargar JSON'
            }
            // TODO: Add translations for new keys in Spanish
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
            },
            analysistab: {
                analysisFailed: '分析に失敗しました',
                downloadJsonTitle: '分析をJSONとしてダウンロード',
                downloadJson: 'JSONをダウンロード'
            }
            // TODO: Add translations for new keys in Japanese
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