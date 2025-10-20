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
    }),
})

export const {
    useGetPersonasQuery,
    useAddPersonaMutation,
    useUpdatePersonaMutation,
    useGetTagsQuery,
    useGetPromptsQuery,
    useUpdatePromptsMutation,
} = apiSlice