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
            { items: Persona[]; nextCursor?: string; hasMore: boolean },
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

        getTags: builder.query<Tag[], string | void>({
            query: (inputQuery: string | void) => ({
                url: '/tags',
                params: { inputQuery },
                method: 'GET',
            }),
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

        // OpenAI helpers converted to RTK Query mutations
        startOpenAIStream: builder.mutation<any, { personaId: string; question: string; fileIds?: string[] } | void>({
        }),

        uploadOpenAIFile: builder.mutation<any, File>({
        }),

        checkOpenAIFile: builder.mutation<any, File>({
        }),

        deletePersona: builder.mutation<
            { deleted?: number } | void,
            Persona | Persona[] | { ids: string[] }
        >({
            query: (arg) => {
                // If arg is an array, it may be Persona[] or string[]; extract ids accordingly
                if (Array.isArray(arg)) {
                    if (arg.length === 0) return { url: '/personas', method: 'DELETE', body: {} };
                    const first = arg[0];
                    // array of Persona objects
                    if (first && typeof first === 'object' && 'id' in first) {
                        const ids = arg.map((p) => p.id);
                        return { url: '/personas', method: 'DELETE', body: { ids } };
                    }
                    // fallback: array of ids
                    return { url: '/personas', method: 'DELETE', body: { ids: arg as any } };
                }

                // Single Persona object with id -> delete via route
                if (arg && typeof arg === 'object' && 'id' in arg && typeof arg.id === 'string') {
                    return { url: `/personas/${(arg as any).id}`, method: 'DELETE' };
                }

                // fallback
                return { url: '/personas', method: 'DELETE', body: {} };
            },
            invalidatesTags: (_result, _error, arg) => {
                if (Array.isArray(arg)) {
                    const first = arg[0] as any;
                    if (first && typeof first === 'object' && 'id' in first) {
                        const ids = (arg as Persona[]).map((p) => p.id);
                        return [{ type: 'Personas' as const, id: 'LIST' }, ...ids.map((id) => ({ type: 'Personas' as const, id }))];
                    }
                    // fallback: array of ids
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
    useStartOpenAIStreamMutation,
    useUploadOpenAIFileMutation,
    useCheckOpenAIFileMutation,
} = apiSlice
