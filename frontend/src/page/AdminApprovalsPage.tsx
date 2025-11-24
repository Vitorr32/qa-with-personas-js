import { useApproveUserMutation, useListPendingUsersQuery, useRejectUserMutation } from '../store/apiSlice'

export default function AdminApprovalsPage() {
  const { data, isFetching, refetch } = useListPendingUsersQuery()
  const [approve, { isLoading: approving }] = useApproveUserMutation()
  const [reject, { isLoading: rejecting }] = useRejectUserMutation()

  return (
    <div className="max-w-3xl mx-auto mt-8 bg-white p-6 rounded shadow">
      <h2 className="text-xl font-semibold mb-4">Pending Registrations</h2>
      <button className="mb-4 text-sm text-blue-700 underline" onClick={() => refetch()}>Refresh</button>
      {isFetching ? (
        <div>Loading…</div>
      ) : !data || data.length === 0 ? (
        <div>No pending users</div>
      ) : (
        <ul className="space-y-3">
          {data.map(u => (
            <li key={u.id} className="flex items-center justify-between border rounded p-3">
              <div>
                <div className="font-medium">{u.name}</div>
                <div className="text-sm text-gray-600">{u.email}</div>
              </div>
              <div className="flex gap-2">
                <button
                  className="px-3 py-1 rounded bg-green-600 text-white"
                  disabled={approving}
                  onClick={() => approve({ id: u.id }).unwrap().then(() => refetch())}
                >Approve</button>
                <button
                  className="px-3 py-1 rounded bg-red-600 text-white"
                  disabled={rejecting}
                  onClick={() => reject({ id: u.id }).unwrap().then(() => refetch())}
                >Reject</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
