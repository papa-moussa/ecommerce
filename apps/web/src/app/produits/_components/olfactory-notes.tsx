interface OlfactoryNotesProps {
  topNotes: string[];
  heartNotes: string[];
  baseNotes: string[];
  storyTelling?: string | null;
}

function NoteIcon({ type }: { type: 'top' | 'heart' | 'base' }) {
  if (type === 'top') {
    return (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <path
          d="M10 2C10 2 5 7 5 11a5 5 0 0010 0c0-4-5-9-5-9z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  if (type === 'heart') {
    return (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <path
          d="M10 16s-7-4.5-7-9a4 4 0 018 0 4 4 0 018 0c0 4.5-7 9-7 9z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="10" cy="14" r="4" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M10 10V4M7 7l3-3 3 3"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const PYRAMID = [
  { type: 'top' as const, label: 'Notes de tête', description: 'Première impression · 15–30 min' },
  { type: 'heart' as const, label: 'Notes de cœur', description: "L'âme du parfum · 1–4 h" },
  { type: 'base' as const, label: 'Notes de fond', description: 'La signature · 4–8 h' },
] as const;

export function OlfactoryNotes({
  topNotes,
  heartNotes,
  baseNotes,
  storyTelling,
}: OlfactoryNotesProps): JSX.Element | null {
  const hasNotes = topNotes.length > 0 || heartNotes.length > 0 || baseNotes.length > 0;
  const notesByType = { top: topNotes, heart: heartNotes, base: baseNotes };

  if (!hasNotes && !storyTelling) return null;

  return (
    <section aria-labelledby="olfactory-title" className="border-t border-brand-ink/10 pt-8">
      <h2 id="olfactory-title" className="mb-6 font-serif text-2xl text-brand-ink">
        La pyramide olfactive
      </h2>

      {storyTelling && (
        <blockquote className="mb-8 border-l-2 border-brand-gold pl-4 font-serif italic leading-relaxed text-brand-ink/70">
          {storyTelling}
        </blockquote>
      )}

      {hasNotes && (
        <div className="grid gap-6 sm:grid-cols-3">
          {PYRAMID.map(({ type, label, description }) => {
            const notes = notesByType[type];
            if (notes.length === 0) return null;
            return (
              <div
                key={type}
                className="group relative overflow-hidden rounded-xl bg-brand-ivory px-5 py-6 transition-shadow hover:shadow-md"
              >
                {/* Gold accent top bar */}
                <div className="absolute left-0 right-0 top-0 h-0.5 bg-gradient-to-r from-brand-gold/0 via-brand-gold to-brand-gold/0" />

                <div className="mb-3 flex items-center gap-2 text-brand-gold">
                  <NoteIcon type={type} />
                  <span className="text-xs font-semibold uppercase tracking-widest">{label}</span>
                </div>

                <p className="mb-4 text-xs text-brand-ink/40">{description}</p>

                <ul className="space-y-1.5">
                  {notes.map((note) => (
                    <li key={note} className="flex items-center gap-2 text-sm text-brand-ink/80">
                      <span
                        className="h-1 w-1 flex-shrink-0 rounded-full bg-brand-gold"
                        aria-hidden="true"
                      />
                      {note}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
