// Import the RTK Query methods from the React-specific entry point
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { Persona } from '../utils/Persona'
import { Prompt } from '../utils/Prompt'
import { Tag } from '../utils/Tag';

export const apiSlice = createApi({
    reducerPath: 'api',
    baseQuery: fetchBaseQuery({ baseUrl: import.meta.env.VITE_API_BASE_URL }),
    tagTypes: ['Personas', 'Tags', 'Prompts'],
    endpoints: (builder) => ({
        getPersonas: builder.query<
            { items: Persona[]; nextCursor?: string; hasMore: boolean; totalCount?: number },
            { pageSize?: number; cursor?: string; inputQuery?: string; tags?: Tag[] } | void
        >({
            query: (args = {}) => {
                const { pageSize, cursor, inputQuery, tags } = args as {
                    pageSize?: number;
                    cursor?: string;
                    inputQuery?: string;
                    tags?: Tag[];
                };

                const params: Record<string, any> = {};
                if (pageSize) params.pageSize = pageSize;
                if (cursor) params.cursor = cursor;
                if (inputQuery) params.inputQuery = inputQuery;
                if (tags) params.tags = JSON.stringify(tags.map(t => t.id));

                return {
                    url: '/personas',
                    params,
                    method: 'GET',
                };
            },
            providesTags: (result) => {
                if (!result) return [{ type: 'Personas' as const, id: 'LIST' }];

                const maybeItems: Persona[] = Array.isArray(result) ? (result as unknown as Persona[]) : (result as any).items || [];

                return [
                    { type: 'Personas' as const, id: 'LIST' },
                    ...maybeItems.map(({ id }) => ({ type: 'Personas' as const, id })),
                ];
            },
        }),

        addPersona: builder.mutation<Persona, Partial<Persona> | FormData>({
            query: (persona: Partial<Persona> | FormData) => {
                if (persona instanceof FormData) {
                    return {
                        url: '/personas',
                        method: 'POST',
                        body: persona,
                    };
                }
                return {
                    url: '/personas',
                    method: 'POST',
                    body: persona as Partial<Persona>,
                };
            },
            invalidatesTags: [{ type: 'Personas', id: 'LIST' }],
        }),

        updatePersona: builder.mutation<Persona, Partial<Persona>>({
            query: (persona: Partial<Persona>) => ({
                url: `/personas/${persona.id}`,
                method: 'PUT',
                body: persona,
            }),
            invalidatesTags: (_result, _error, { id }) =>
                id ? [{ type: 'Personas', id: 'LIST' }, { type: 'Personas', id }] : [{ type: 'Personas', id: 'LIST' }],
        }),

        deletePersona: builder.mutation<
            { deleted?: number } | void,
            Persona | Persona[] | { ids: string[] }
        >({
            query: (arg) => {
                if (Array.isArray(arg)) {
                    if (arg.length === 0) return { url: '/personas', method: 'DELETE', body: {} };
                    const first = arg[0];
                    if (first && typeof first === 'object' && 'id' in first) {
                        const ids = arg.map((p) => p.id);
                        return { url: '/personas', method: 'DELETE', body: { ids } };
                    }
                    return { url: '/personas', method: 'DELETE', body: { ids: arg as any } };
                }

                if (arg && typeof arg === 'object' && 'id' in arg && typeof arg.id === 'string') {
                    return { url: `/personas/${(arg as any).id}`, method: 'DELETE' };
                }

                return { url: '/personas', method: 'DELETE', body: {} };
            },
            invalidatesTags: (_result, _error, arg) => {
                if (Array.isArray(arg)) {
                    const first = arg[0] as any;
                    if (first && typeof first === 'object' && 'id' in first) {
                        const ids = (arg as Persona[]).map((p) => p.id);
                        return [{ type: 'Personas' as const, id: 'LIST' }, ...ids.map((id) => ({ type: 'Personas' as const, id }))];
                    }
                    return [{ type: 'Personas' as const, id: 'LIST' }, ...((arg as any) || []).map((id: string) => ({ type: 'Personas' as const, id }))];
                }

                if (arg && typeof arg === 'object' && 'id' in arg && typeof (arg as any).id === 'string') {
                    return [{ type: 'Personas' as const, id: 'LIST' }, { type: 'Personas' as const, id: (arg as any).id }];
                }

                if (arg && typeof arg === 'object' && Array.isArray((arg as any).ids)) {
                    const ids = (arg as any).ids as string[];
                    return [{ type: 'Personas' as const, id: 'LIST' }, ...ids.map((id) => ({ type: 'Personas' as const, id }))];
                }

                return [{ type: 'Personas' as const, id: 'LIST' }];
            },
        }),

        getTags: builder.query<Tag[], string | void>({
            query: (inputQuery: string | void) => {
                const hasQuery = typeof inputQuery === 'string' && inputQuery.trim().length > 0;
                const params: Record<string, any> = {};

                if (hasQuery) {
                    params.inputQuery = inputQuery;
                    // Cap suggestions during typing
                    params.limit = 15;
                } else {
                    // Initial small set
                    params.limit = 5;
                }

                return {
                    url: '/tags',
                    params,
                    method: 'GET',
                };
            },
            providesTags: [{ type: 'Tags', id: 'LIST' }],
        }),

        getPrompts: builder.query<Prompt, void>({
            query: () => ({ url: '/prompts', method: 'GET' }),
            providesTags: [{ type: 'Prompts', id: 'SINGLE' }],
        }),

        updatePrompts: builder.mutation<Prompt, Partial<Prompt>>({
            query: (prompts: Partial<Prompt>) => ({ url: '/prompts', method: 'PUT', body: prompts }),
            invalidatesTags: [{ type: 'Prompts', id: 'SINGLE' }],
        }),

        // Upload file to OpenAI
        uploadOpenAIFile: builder.mutation<{ id: string; raw: any }, File>({
            query: (file: File) => {
                const formData = new FormData();
                formData.append('file', file);

                return {
                    url: '/openai/upload',
                    method: 'POST',
                    body: formData,
                };
            },
        }),

        // Check if file is valid before uploading
        checkOpenAIFile: builder.mutation<{ ok: boolean; reason?: string }, File>({
            query: (file: File) => {
                const formData = new FormData();
                formData.append('file', file);

                return {
                    url: '/openai/check',
                    method: 'POST',
                    body: formData,
                };
            },
        }),

        fetchAnalysis: builder.mutation<{
            analysis: string,
            metadata: {
                model: string,
                tokensUsed: string,
                responsesAnalyzed: string,
            }
        }, { responses: { persona: string; response: string }[], question: string, fileIds: string[] }>({
            query: ({ question, responses, fileIds }) => ({
                url: '/openai/analyze',
                method: 'POST',
                body: { question, responses, fileIds },
            }),
        }),
    }),
})

export const {
    useGetPersonasQuery,
    useAddPersonaMutation,
    useUpdatePersonaMutation,
    useDeletePersonaMutation,
    useGetTagsQuery,
    useGetPromptsQuery,
    useUpdatePromptsMutation,
    useUploadOpenAIFileMutation,
    useCheckOpenAIFileMutation,
    useFetchAnalysisMutation
} = apiSlice