import { useRef, useState } from 'react'
import { supabase } from '../../lib/supabase'

type Props = {
  bucket: string
  folder: string
  label: string
  onUploaded: (url: string) => void
}

export default function ImageUploader({ bucket, folder, label, onUploaded }: Props) {
  const ref = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleFile(file: File) {
    setUploading(true)
    setError(null)
    const ext = file.name.split('.').pop() ?? 'jpg'
    const path = `${folder}/${Date.now()}.${ext}`
    const { error: upErr } = await supabase.storage.from(bucket).upload(path, file, { upsert: true })
    if (upErr) { setError(upErr.message); setUploading(false); return }
    const { data } = supabase.storage.from(bucket).getPublicUrl(path)
    onUploaded(data.publicUrl)
    setUploading(false)
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        disabled={uploading}
        onClick={() => ref.current?.click()}
        className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/70 hover:bg-white/10 disabled:opacity-50"
      >
        {uploading ? 'Uploading…' : `↑ Upload ${label}`}
      </button>
      {error ? <span className="text-xs text-red-300">{error}</span> : null}
      <input
        ref={ref}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = '' }}
      />
    </div>
  )
}
