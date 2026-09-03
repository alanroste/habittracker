import { CHARACTER_SETS, artUrl, type CharacterSetKey } from '../lib/character'

/** Pick which character represents you. Previews each set's top level. */
export default function CharacterPicker({
  value, onChange, disabled,
}: { value: string; onChange: (key: CharacterSetKey) => void; disabled?: boolean }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {Object.values(CHARACTER_SETS).map((set) => {
        const active = set.key === value
        return (
          <button
            key={set.key}
            type="button"
            disabled={disabled}
            onClick={() => onChange(set.key)}
            aria-pressed={active}
            className={`overflow-hidden rounded-xl border text-left transition disabled:opacity-50 ${
              active ? 'border-accent ring-1 ring-accent' : 'border-border hover:border-ink-3'
            }`}
          >
            <img
              src={artUrl(set.key, 'level-5')}
              alt=""
              className="block w-full"
              loading="lazy"
            />
            <div className="px-2 py-1.5">
              <div className={`text-sm font-semibold ${active ? 'text-accent' : ''}`}>{set.label}</div>
              <div className="text-[10px] leading-tight text-ink-3">{set.blurb}</div>
            </div>
          </button>
        )
      })}
    </div>
  )
}
