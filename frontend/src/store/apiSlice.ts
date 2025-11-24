// Import the RTK Query methods from the React-specific entry point
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { Persona } from '../utils/Persona'
import { Prompt } from '../utils/Prompt'
import { Tag } from '../utils/Tag';

export const apiSlice = createApi({
    reducerPath: 'api',
    baseQuery: fetchBaseQuery({
        baseUrl: import.meta.env.VITE_API_BASE_URL,
        prepareHeaders: (headers) => {
            const token = typeof localStorage !== 'undefined' ? localStorage.getItem('authToken') : null
            if (token != null) {
                headers.set('Authorization', `Bearer ${token}`)
            }
            return headers
        },
    }),
    tagTypes: ['Personas', 'Tags', 'Prompts', 'BedrockModels', 'UsersPending', 'UsersAll', 'AuthMe'],
    endpoints: (builder) => ({
        // AUTH
        register: builder.mutation<
            { id: string; email: string; name: string; role: string; status: string; message: string },
            { email: string; name: string; password: string }
        >({
            query: (body) => ({ url: '/auth/register', method: 'POST', body }),
        }),

        login: builder.mutation<
            { accessToken: string; user: { sub: string; email: string; name: string; role: string; status: string } },
            { email: string; password: string }
        >({
            query: (body) => ({ url: '/auth/login', method: 'POST', body }),
            invalidatesTags: [{ type: 'AuthMe', id: 'SINGLE' }],
        }),

        me: builder.query<
            { id: string; email: string; name: string; role: string; status: string; createdAt: string; updatedAt: string },
            void
        >({
            query: () => ({ url: '/auth/me', method: 'GET' }),
            providesTags: [{ type: 'AuthMe', id: 'SINGLE' }],
        }),

        listPendingUsers: builder.query<
            Array<{ id: string; email: string; name: string; role: string; status: string; createdAt: string }>,
            void
        >({
            query: () => ({ url: '/auth/pending', method: 'GET' }),
            providesTags: [{ type: 'UsersPending', id: 'LIST' }],
        }),

        approveUser: builder.mutation<{ id: string; status: string }, { id: string }>({
            query: ({ id }) => ({ url: `/auth/approve/${id}`, method: 'PATCH' }),
            invalidatesTags: [{ type: 'UsersPending', id: 'LIST' }],
        }),

        rejectUser: builder.mutation<{ id: string; status: string }, { id: string }>({
            query: ({ id }) => ({ url: `/auth/reject/${id}`, method: 'PATCH' }),
            invalidatesTags: [{ type: 'UsersPending', id: 'LIST' }],
        }),

        grantSuperuser: builder.mutation<{ id: string; role: string }, { id: string }>({
            query: ({ id }) => ({ url: `/auth/grant-superuser/${id}`, method: 'PATCH' }),
            invalidatesTags: [{ type: 'UsersPending', id: 'LIST' }, { type: 'UsersAll', id: 'LIST' }],
        }),

        listAllUsers: builder.query<
            Array<{ id: string; email: string; name: string; role: string; status: string; createdAt: string; updatedAt: string }>,
            void
        >({
            query: () => ({ url: '/auth/users/all', method: 'GET' }),
            providesTags: [{ type: 'UsersAll', id: 'LIST' }],
        }),

        searchUsers: builder.query<
            Array<{ id: string; email: string; name: string; role: string; status: string; createdAt: string; updatedAt: string }>,
            string
        >({
            query: (query) => ({ url: '/auth/users/search', method: 'GET', params: { q: query } }),
            providesTags: [{ type: 'UsersAll', id: 'LIST' }],
        }),

        updateUserStatus: builder.mutation<{ id: string; status: string }, { id: string; status: string }>({
            query: ({ id, status }) => ({ url: `/auth/users/${id}/status`, method: 'PATCH', body: { status } }),
            invalidatesTags: [{ type: 'UsersPending', id: 'LIST' }, { type: 'UsersAll', id: 'LIST' }],
        }),

        deleteUser: builder.mutation<{ id: string; deleted: boolean }, { id: string }>({
            query: ({ id }) => ({ url: `/auth/users/${id}`, method: 'DELETE' }),
            invalidatesTags: [{ type: 'UsersPending', id: 'LIST' }, { type: 'UsersAll', id: 'LIST' }],
        }),

        // Bulk delete rejected users
        deleteAllRejectedUsers: builder.mutation<{ deleted: number }, { ids: string[] }>({
            query: ({ ids }) => ({ url: '/auth/users/reject/delete-all', method: 'POST', body: { ids } }),
            invalidatesTags: [{ type: 'UsersAll', id: 'LIST' }, { type: 'UsersPending', id: 'LIST' }],
        }),
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

        // List Bedrock foundation models with context window
        getBedrockModels: builder.query<
            Array<{
                modelId: string;
                modelName?: string;
                providerName?: string;
                inputModalities?: string[];
                outputModalities?: string[];
                inferenceTypesSupported?: string[];
                contextWindow?: number | null;
            }>,
            void
        >({
            query: () => ({ url: '/bedrock/models', method: 'GET' }),
            providesTags: [{ type: 'BedrockModels', id: 'LIST' }],
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
        }, { responses: { persona: string; response: string }[], question: string, files?: File[] }>({
            query: ({ question, responses, files }) => {
                const provider = (import.meta.env.VITE_LLM_PROVIDER || 'openai').toLowerCase();
                const apiBase = provider === 'bedrock' ? '/bedrock' : '/openai';
                const hasFiles = files && files.length > 0;
                if (hasFiles) {
                    const form = new FormData();
                    form.append('question', question);
                    form.append('responses', JSON.stringify(responses));
                    for (const file of files!) {
                        form.append('files', file, file.name);
                    }
                    return {
                        url: `${apiBase}/analyze`,
                        method: 'POST',
                        body: form,
                    };
                }
                return {
                    url: `${apiBase}/analyze`,
                    method: 'POST',
                    body: { question, responses },
                };
            },
        }),

        // Bulk import personas dataset
        importPersonasDataset: builder.mutation<
            { jobId: string },
            { file: File; parser?: string; batchSize?: number }
        >({
            query: ({ file, parser, batchSize }) => {
                const form = new FormData();
                form.append('file', file, file.name);
                if (parser) form.append('parser', parser);
                if (typeof batchSize === 'number' && !Number.isNaN(batchSize)) {
                    form.append('batchSize', String(batchSize));
                }
                return {
                    url: '/import/personas',
                    method: 'POST',
                    body: form,
                };
            },
            invalidatesTags: [{ type: 'Personas', id: 'LIST' }],
        }),

        getImportStatus: builder.query<
            {
                id: string;
                status: 'pending' | 'running' | 'completed' | 'failed';
                processed: number;
                inserted: number;
                failed: number;
                total?: number;
                error?: string;
                startedAt: number;
                updatedAt: number;
                parser: string;
                batchSize?: number;
            },
            { jobId: string }
        >({
            query: ({ jobId }) => ({ url: `/import/status/${jobId}`, method: 'GET' }),
        }),
    }),
})

export const {
    useRegisterMutation,
    useLoginMutation,
    useMeQuery,
    useListPendingUsersQuery,
    useApproveUserMutation,
    useRejectUserMutation,
    useGrantSuperuserMutation,
    useListAllUsersQuery,
    useSearchUsersQuery,
    useUpdateUserStatusMutation,
    useDeleteUserMutation,
    useDeleteAllRejectedUsersMutation,
    useGetPersonasQuery,
    useAddPersonaMutation,
    useUpdatePersonaMutation,
    useDeletePersonaMutation,
    useGetTagsQuery,
    useGetPromptsQuery,
    useUpdatePromptsMutation,
    useGetBedrockModelsQuery,
    useUploadOpenAIFileMutation,
    useCheckOpenAIFileMutation,
    useFetchAnalysisMutation,
    useImportPersonasDatasetMutation,
    useGetImportStatusQuery
} = apiSlice