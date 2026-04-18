export default function AppCrashedPage() {
  return (
    <div className="min-h-dvh flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-3xl border p-5 text-center" style={{ background: 'var(--surface)', borderColor: 'var(--separator)' }}>
        <div className="text-lg font-bold text-[var(--label)]">Something went wrong</div>
        <p className="mt-1 text-sm text-[var(--label2)]">
          Try refreshing the page. If this keeps happening, check the console for details.
        </p>
        <div className="mt-4 flex justify-center gap-2">
          <button
            onClick={() => window.location.reload()}
            className="rounded-full px-5 py-2 text-sm font-semibold text-white hover:opacity-85 transition-opacity"
            style={{ background: 'var(--accent)' }}
          >
            Refresh
          </button>
          <button
            onClick={() => (window.location.href = '/')}
            className="rounded-full px-5 py-2 text-sm font-semibold text-[var(--label2)] hover:text-[var(--label)] transition-colors"
            style={{ background: 'var(--surface2)' }}
          >
            Go home
          </button>
        </div>
      </div>
    </div>
  )
}
