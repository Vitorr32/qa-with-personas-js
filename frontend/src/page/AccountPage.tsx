import { useAppSelector } from '../store/hooks'

export default function AccountPage() {
  const user = useAppSelector(s => s.auth.user)
  return (
    <div className="max-w-xl mx-auto mt-8 bg-white p-6 rounded shadow">
      <h2 className="text-xl font-semibold mb-4">Account</h2>
      {!user ? (
        <div>Not logged in.</div>
      ) : (
        <div className="space-y-2 text-sm">
          <div><span className="font-medium">Name:</span> {user.name}</div>
          <div><span className="font-medium">Email:</span> {user.email}</div>
          <div><span className="font-medium">Role:</span> {user.role}</div>
          <div><span className="font-medium">Status:</span> {user.status}</div>
        </div>
      )}
    </div>
  )
}
