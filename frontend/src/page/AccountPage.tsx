import { useAppSelector } from '../store/hooks'
import { useMeQuery } from '../store/apiSlice'

export default function AccountPage() {
  const user = useAppSelector(s => s.auth.user)
  const { data: me, isLoading } = useMeQuery()

  return (
    <div className="max-w-2xl mx-auto mt-8 bg-white p-8 rounded-lg shadow">
      <h1 className="text-2xl font-bold mb-6">Account Settings</h1>

      {isLoading ? (
        <div className="text-center text-gray-600">Loading...</div>
      ) : me || user ? (
        <div className="space-y-6">
          <div className="flex items-center gap-4 pb-6 border-b">
            <div className="w-16 h-16 rounded-full bg-blue-600 text-white flex items-center justify-center text-2xl font-bold">
              {(me?.name || user?.name)?.[0]?.toUpperCase() || 'U'}
            </div>
            <div>
              <h2 className="text-lg font-semibold">{me?.name || user?.name}</h2>
              <p className="text-gray-600">{me?.email || user?.email}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Role</label>
              <p className="font-medium px-3 py-2 bg-gray-50 rounded">
                {(me?.role || user?.role) === 'SUPERUSER' ? '👑 Superuser' : me?.role || user?.role}
              </p>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Status</label>
              <p className={`font-medium px-3 py-2 rounded ${
                (me?.status || user?.status) === 'APPROVED' ? 'bg-green-50 text-green-700' :
                (me?.status || user?.status) === 'PENDING' ? 'bg-yellow-50 text-yellow-700' :
                'bg-red-50 text-red-700'
              }`}>
                {(me?.status || user?.status) === 'APPROVED' ? '✓ Approved' :
                 (me?.status || user?.status) === 'PENDING' ? '⏳ Pending approval' :
                 '✗ Rejected'}
              </p>
            </div>
          </div>

          {me?.createdAt && (
            <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
              <div>
                <span className="font-medium">Joined:</span> {new Date(me.createdAt).toLocaleDateString()}
              </div>
              <div>
                <span className="font-medium">Updated:</span> {new Date(me.updatedAt).toLocaleDateString()}
              </div>
            </div>
          )}

          {(me?.status || user?.status) === 'PENDING' && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded text-blue-700 text-sm">
              Your account is awaiting approval from a superuser. You'll be notified once you're approved.
            </div>
          )}

          {(me?.status || user?.status) === 'REJECTED' && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
              Your registration was rejected. Please contact support for more information.
            </div>
          )}
        </div>
      ) : (
        <div className="text-center text-gray-600">No user data</div>
      )}
    </div>
  )
}
