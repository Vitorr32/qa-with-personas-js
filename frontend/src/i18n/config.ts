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
                addRandom: 'Add Random',
                addRandomCount: 'Add Random {{count}}',
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
                cancel: 'Cancel',
                loading: 'Loading...'
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
                responseModelLabel: 'Response Model',
                responseModelHelp: 'Select the Bedrock model to generate responses. Leave as "Default" to use environment configuration.',
                analystModelLabel: 'Analyst Model',
                analystModelHelp: 'Select the Bedrock model to use for analysis. Leave as "Default" to use environment configuration.',
                defaultEnvOption: 'Default (env)',
                ctxAbbrev: '(ctx {{count}})',
                temperatureLabel: 'Temperature',
                temperatureHelp: 'Controls randomness for main prompt questions (0.1–2.0)',
                temperatureRange: 'Allowed range: 0.1 – 2.0',
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
                downloadJson: 'Download JSON',
                keyPoints: 'Key Points',
                divergences: 'Points of Divergence',
                consensusView: 'Consensus View',
                wordCloud: 'Word Cloud',
                sentimentDistribution: 'Sentiment Distribution',
                commonThemes: 'Common Themes',
                readyTitle: 'Ready to Analyze',
                readyHelpCan: "Click 'Start Analysis' to generate insights from all persona responses",
                readyHelpCant: 'Complete all persona responses first to enable analysis',
                runAgain: 'Run Again',
                lastAnalysisInfo: 'Last analysis used {{last}} responses. Now {{current}} responses ({{new}} new).',
                noNewSince: 'No new responses since last analysis ({{last}} used, {{current}} now).'
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
            mainpage: {
                selectedPersonaCount_one: 'Obtén respuestas de {{count}} persona seleccionada',
                selectedPersonaCount_other: 'Obtén respuestas de {{count}} personas seleccionadas',
                defaultPersonaText: 'Obtén respuestas de miles de personas especializadas',
                askPersona_one: 'Preguntar a {{count}} Persona',
                askPersona_other: 'Preguntar a {{count}} Personas',
                askAllPersonas: 'Preguntar a Todas las Personas',
                selectPersonas: 'Seleccionar Personas',
                editSelection: 'Editar Selección',
                selectedPersonas: 'Personas Seleccionadas:',
                selectedBadge: '{{count}} seleccionadas',
                done: 'Listo'
            },
            response: {
                personaResponses: 'Respuestas de Personas',
                askingPersonasAbout_one: 'Preguntando a {{count}} persona sobre: "{{question}}"',
                askingPersonasAbout_other: 'Preguntando a {{count}} personas sobre: "{{question}}"',
                responsesTab: 'Respuestas',
                analysisTab: 'Análisis',
                completedCounter: '{{completed}} / {{total}} completadas',
                allReceived: 'Todas las respuestas recibidas',
                preparingPersonas: 'Preparando personas y subiendo archivos...'
            },
            personagrid: {
                foundCount_one: '{{count}} Persona Encontrada',
                foundCount_other: '{{count}} Personas Encontradas',
                allSelected: 'Todas Seleccionadas',
                addAll: 'Agregar Todo a la Lista',
                addRandom: 'Agregar al azar',
                addRandomCount: 'Agregar {{count}} al azar',
                noFound: 'No se encontraron personas',
                tryAdjustSearch: 'Intenta ajustar tu búsqueda o filtros',
                loadMore: 'Cargar Más'
            },
            remove: {
                title: 'Eliminar Personas',
                subtitle: 'Selecciona y elimina personas',
                foundCount_one: '{{count}} Persona Encontrada',
                foundCount_other: '{{count}} Personas Encontradas',
                noSelected: 'Ninguna Persona Seleccionada',
                removeCount_one: 'Eliminar {{count}} Persona',
                removeCount_other: 'Eliminar {{count}} Personas',
                noFound: 'No se encontraron personas',
                confirmTitle: 'Confirmar Eliminación',
                confirmText_one: 'Estás a punto de eliminar permanentemente {{count}} persona. Esta acción no se puede deshacer.',
                confirmText_other: 'Estás a punto de eliminar permanentemente {{count}} personas. Esta acción no se puede deshacer.',
                toBeRemovedLabel: 'Personas a eliminar:',
                andMore: '... y {{count}} más',
                confirmButton: 'Sí, Eliminar'
            },
            common: {
                done: 'Listo',
                cancel: 'Cancelar',
                loading: 'Cargando...'
            },
            personaadd: {
                title: 'Agregar Nueva Persona',
                subtitle: 'Crea una nueva persona con atributos personalizados',
                avatarLabel: 'Avatar (Opcional)',
                chooseImage: 'Elegir Imagen',
                nameLabel: 'Nombre *',
                namePlaceholder: 'p. ej., Experto en Código',
                greetingLabel: 'Saludo *',
                greetingPlaceholder: 'p. ej., ¡Hola! Estoy aquí para ayudarte a programar.',
                descriptionLabel: 'Descripción *',
                descriptionPlaceholder: 'Describe la experiencia y capacidades de la persona...',
                tagsLabel: 'Etiquetas',
                createButton: 'Crear Persona'
            },
            prompts: {
                title: 'Indicaciones del Sistema',
                subtitle: 'Configura las indicaciones predeterminadas del sistema',
                mainLabel: 'Prompt Principal',
                mainHelp: 'Usado para consultas generales',
                mainPlaceholder: 'Ingresa el prompt principal del sistema...',
                analystLabel: 'Prompt de Analista',
                analystHelp: 'Usado para analizar respuestas',
                analystPlaceholder: 'Ingresa el prompt del analista...',
                responseModelLabel: 'Modelo de respuesta',
                responseModelHelp: 'Selecciona el modelo de Bedrock para generar respuestas. Deja "Predeterminado" para usar la configuración del entorno.',
                analystModelLabel: 'Modelo de analista',
                analystModelHelp: 'Selecciona el modelo de Bedrock para el análisis. Deja "Predeterminado" para usar la configuración del entorno.',
                defaultEnvOption: 'Predeterminado (entorno)',
                ctxAbbrev: '(ctx {{count}})',
                temperatureLabel: 'Temperatura',
                temperatureHelp: 'Controla la aleatoriedad para preguntas del prompt principal (0.1–2.0)',
                temperatureRange: 'Rango permitido: 0.1 – 2.0',
                charCount: '{{count}} caracteres',
                saveButton: 'Guardar Prompts',
                saving: 'Guardando...',
                saved: '¡Guardado!'
            },
            personaeditmodal: {
                title: 'Editar Persona',
                nameLabel: 'Nombre',
                greetingLabel: 'Saludo',
                descriptionLabel: 'Descripción',
                tagsLabel: 'Etiquetas',
                addTagPlaceholder: 'Agregar etiqueta...',
                addButton: 'Agregar',
                saveChangesButton: 'Guardar Cambios'
            },
            personaedit: {
                title: 'Editar Personas',
                subtitle: 'Buscar y modificar personas existentes',
                updatedSuccess: '¡La persona {{name}} se actualizó correctamente!',
                updateFailed: 'Error al actualizar la persona: {{message}}'
            },
            personachip: {
                ariaRemove: 'Eliminar {{name}}'
            },
            personacard: {
                ariaViewDetails: 'Ver detalles',
                description: 'Descripción',
                tagsLabel: 'Etiquetas ({{count}})',
                metadata: 'Metadatos',
                id: 'ID',
                totalTags: 'Etiquetas Totales',
                close: 'Cerrar',
                addToSelection: 'Agregar a la Selección',
                removeFromSelection: 'Quitar de la Selección'
            },
            tagpicker: {
                clearAll: 'Borrar todo',
                inputPlaceholder: 'Escribe para buscar etiquetas...',
                ariaRemove: 'Eliminar {{name}}',
                noTagsFound: 'No se encontraron etiquetas',
                createTag: 'Crear etiqueta "{{name}}"',
                noMatchingFound: 'No se encontraron etiquetas que coincidan con "{{value}}"'
            },
            header: {
                home: 'Inicio',
                settings: 'Configuración',
                changeLanguage: 'Cambiar idioma'
            },
            questioninput: {
                placeholder: '¿Qué te gustaría preguntar?'
            },
            analysistab: {
                analysisTitle: 'Análisis de IA',
                subtitle: 'Análisis integral de respuestas',
                startAnalysis: 'Iniciar Análisis',
                analyzing: 'Analizando...',
                analysisComplete: 'Análisis Completo',
                analysisFailed: 'Error en el análisis',
                downloadJsonTitle: 'Descargar análisis en JSON',
                downloadJson: 'Descargar JSON',
                keyPoints: 'Puntos Clave',
                divergences: 'Puntos de Divergencia',
                consensusView: 'Vista de Consenso',
                wordCloud: 'Nube de Palabras',
                sentimentDistribution: 'Distribución del Sentimiento',
                commonThemes: 'Temas Comunes',
                readyTitle: 'Listo para Analizar',
                readyHelpCan: "Haz clic en 'Iniciar Análisis' para generar ideas de todas las respuestas de las personas",
                readyHelpCant: 'Completa todas las respuestas de las personas para habilitar el análisis',
                runAgain: 'Volver a ejecutar',
                lastAnalysisInfo: 'El último análisis usó {{last}} respuestas. Ahora hay {{current}} respuestas ({{new}} nuevas).',
                noNewSince: 'No hay respuestas nuevas desde el último análisis ({{last}} usadas, {{current}} ahora).'
            },
            responsecard: {
                waiting: 'Esperando...',
                responding: 'Respondiendo...',
                completed: 'Completado',
                error: 'Error',
                idle: 'Inactivo',
                waitingInQueue: 'Esperando en la cola...',
                failedToGetResponse: 'No se pudo obtener la respuesta',
                completedIn: 'Completado en {{seconds}} s'
            },
            sentiment: {
                positive: 'Positivo',
                neutral: 'Neutral',
                negative: 'Negativo'
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
            },
            mainpage: {
                selectedPersonaCount_one: '選択した{{count}}件のペルソナから回答を得る',
                selectedPersonaCount_other: '選択した{{count}}件のペルソナから回答を得る',
                defaultPersonaText: '何千もの専門ペルソナから回答を得る',
                askPersona_one: '{{count}}件のペルソナに質問',
                askPersona_other: '{{count}}件のペルソナに質問',
                askAllPersonas: 'すべてのペルソナに質問',
                selectPersonas: 'ペルソナを選択',
                editSelection: '選択を編集',
                selectedPersonas: '選択したペルソナ:',
                selectedBadge: '{{count}} 件選択',
                done: '完了'
            },
            response: {
                personaResponses: 'ペルソナの回答',
                askingPersonasAbout_one: '{{count}}件のペルソナに質問中: "{{question}}"',
                askingPersonasAbout_other: '{{count}}件のペルソナに質問中: "{{question}}"',
                responsesTab: '回答',
                analysisTab: '分析',
                completedCounter: '{{total}} 中 {{completed}} 完了',
                allReceived: 'すべての回答を受信しました',
                preparingPersonas: 'ペルソナを準備し、ファイルをアップロードしています...'
            },
            personagrid: {
                foundCount_one: '{{count}} 件のペルソナが見つかりました',
                foundCount_other: '{{count}} 件のペルソナが見つかりました',
                allSelected: 'すべて選択済み',
                addAll: 'すべてをリストに追加',
                addRandom: 'ランダム追加',
                addRandomCount: 'ランダムで{{count}}件追加',
                noFound: 'ペルソナが見つかりません',
                tryAdjustSearch: '検索条件やフィルターを調整してください',
                loadMore: 'さらに読み込む'
            },
            remove: {
                title: 'ペルソナを削除',
                subtitle: 'ペルソナを選択して削除',
                foundCount_one: '{{count}} 件のペルソナが見つかりました',
                foundCount_other: '{{count}} 件のペルソナが見つかりました',
                noSelected: 'ペルソナが選択されていません',
                removeCount_one: '{{count}} 件のペルソナを削除',
                removeCount_other: '{{count}} 件のペルソナを削除',
                noFound: 'ペルソナが見つかりません',
                confirmTitle: '削除の確認',
                confirmText_one: '{{count}} 件のペルソナを完全に削除しようとしています。この操作は元に戻せません。',
                confirmText_other: '{{count}} 件のペルソナを完全に削除しようとしています。この操作は元に戻せません。',
                toBeRemovedLabel: '削除するペルソナ:',
                andMore: '... ほか {{count}} 件',
                confirmButton: 'はい、削除します'
            },
            common: {
                done: '完了',
                cancel: 'キャンセル',
                loading: '読み込み中...'
            },
            personaadd: {
                title: '新しいペルソナを追加',
                subtitle: 'カスタム属性で新しいペルソナを作成',
                avatarLabel: 'アバター（任意）',
                chooseImage: '画像を選択',
                nameLabel: '名前 *',
                namePlaceholder: '例: コードのエキスパート',
                greetingLabel: '挨拶 *',
                greetingPlaceholder: '例: こんにちは！ コーディングをお手伝いします。',
                descriptionLabel: '説明 *',
                descriptionPlaceholder: 'ペルソナの専門性と能力を説明してください...',
                tagsLabel: 'タグ',
                createButton: 'ペルソナを作成'
            },
            prompts: {
                title: 'システムプロンプト',
                subtitle: '既定のシステムプロンプトを設定',
                mainLabel: 'メインプロンプト',
                mainHelp: '一般的な問い合わせに使用',
                mainPlaceholder: 'メインのシステムプロンプトを入力...',
                analystLabel: 'アナリストプロンプト',
                analystHelp: '返信の分析に使用',
                analystPlaceholder: 'アナリスト用プロンプトを入力...',
                responseModelLabel: '応答モデル',
                responseModelHelp: '応答生成に使用する Bedrock モデルを選択します。「既定」を選ぶと環境設定を使用します。',
                analystModelLabel: 'アナリストモデル',
                analystModelHelp: '分析に使用する Bedrock モデルを選択します。「既定」を選ぶと環境設定を使用します。',
                defaultEnvOption: '既定 (環境)',
                ctxAbbrev: '(ctx {{count}})',
                temperatureLabel: '温度',
                temperatureHelp: 'メインプロンプトの質問に対するランダム性を調整 (0.1–2.0)',
                temperatureRange: '許容範囲: 0.1 – 2.0',
                charCount: '{{count}} 文字',
                saveButton: 'プロンプトを保存',
                saving: '保存中...',
                saved: '保存しました！'
            },
            personaeditmodal: {
                title: 'ペルソナを編集',
                nameLabel: '名前',
                greetingLabel: '挨拶',
                descriptionLabel: '説明',
                tagsLabel: 'タグ',
                addTagPlaceholder: 'タグを追加...',
                addButton: '追加',
                saveChangesButton: '変更を保存'
            },
            personaedit: {
                title: 'ペルソナを編集',
                subtitle: '既存のペルソナを検索して編集',
                updatedSuccess: 'ペルソナ {{name}} を更新しました！',
                updateFailed: 'ペルソナの更新に失敗しました: {{message}}'
            },
            personachip: {
                ariaRemove: '{{name}} を削除'
            },
            personacard: {
                ariaViewDetails: '詳細を表示',
                description: '説明',
                tagsLabel: 'タグ ({{count}})',
                metadata: 'メタデータ',
                id: 'ID',
                totalTags: 'タグ合計',
                close: '閉じる',
                addToSelection: '選択に追加',
                removeFromSelection: '選択から削除'
            },
            tagpicker: {
                clearAll: 'すべてクリア',
                inputPlaceholder: 'タグを検索...',
                ariaRemove: '{{name}} を削除',
                noTagsFound: 'タグが見つかりません',
                createTag: '"{{name}}" タグを作成',
                noMatchingFound: '"{{value}}" に一致するタグは見つかりません'
            },
            header: {
                home: 'ホーム',
                settings: '設定',
                changeLanguage: '言語を変更'
            },
            questioninput: {
                placeholder: '何を質問しますか？'
            },
            analysistab: {
                analysisTitle: 'AI分析',
                subtitle: '包括的な回答分析',
                startAnalysis: '分析を開始',
                analyzing: '分析中...',
                analysisComplete: '分析完了',
                analysisFailed: '分析に失敗しました',
                downloadJsonTitle: '分析をJSONとしてダウンロード',
                downloadJson: 'JSONをダウンロード',
                keyPoints: '重要ポイント',
                divergences: '相違点',
                consensusView: '合意見解',
                wordCloud: 'ワードクラウド',
                sentimentDistribution: '感情分布',
                commonThemes: '共通テーマ',
                readyTitle: '分析の準備完了',
                readyHelpCan: '「分析を開始」をクリックして、すべてのペルソナの回答から洞察を生成します',
                readyHelpCant: '分析を有効にするには、すべてのペルソナの回答を完了してください',
                runAgain: '再実行',
                lastAnalysisInfo: '前回の分析では {{last}} 件の回答を使用しました。現在は {{current}} 件（新規 {{new}} 件）。',
                noNewSince: '前回の分析以降、新しい回答はありません（{{last}} 件使用、現在 {{current}} 件）。'
            },
            responsecard: {
                waiting: '待機中...',
                responding: '返答中...',
                completed: '完了',
                error: 'エラー',
                idle: 'アイドル',
                waitingInQueue: 'キューで待機中...',
                failedToGetResponse: '応答の取得に失敗しました',
                completedIn: '{{seconds}}秒で完了'
            },
            sentiment: {
                positive: 'ポジティブ',
                neutral: 'ニュートラル',
                negative: 'ネガティブ'
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