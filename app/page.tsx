export default function HomePage() {
  // Middleware handles all routing:
  // - Unauthenticated users: see this landing page
  // - Platform Owner/Admin: redirected to /admin
  // - Providers: redirected to /prescriptions
  // - Patients: check intake completion, redirect accordingly

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#1E3A8A] via-[#2563EB] to-[#00AEEF] flex items-center justify-center">
      <div className="text-center text-white">
        <h1 className="text-4xl font-bold mb-4">Welcome to RxPortal</h1>
        <p className="text-xl mb-8">Your Healthcare Platform</p>
        <div className="space-x-4">
          <a
            href="/auth/login"
            className="inline-block px-6 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-gray-100 transition"
          >
            Sign In
          </a>
          <a
            href="/auth/register"
            className="inline-block px-6 py-3 bg-transparent border-2 border-white text-white rounded-lg font-semibold hover:bg-white/10 transition"
          >
            Sign Up
          </a>
        </div>
      </div>
    </div>
  );
}
