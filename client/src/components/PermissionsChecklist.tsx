import { PERMISSION_GROUPS, PERMISSIONS } from '../permissions'

export function PermissionsChecklist({
  values,
  onToggle,
  overriddenKeys,
}: {
  values: Record<string, boolean>
  onToggle: (key: string, value: boolean) => void
  overriddenKeys?: Set<string>
}) {
  return (
    <div className="space-y-4">
      {PERMISSION_GROUPS.map((group) => (
        <div key={group}>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{group}</p>
          <div className="mt-1 space-y-1.5">
            {PERMISSIONS.filter((p) => p.group === group).map((p) => (
              <label key={p.key} className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={!!values[p.key]}
                  onChange={(e) => onToggle(p.key, e.target.checked)}
                />
                {p.label}
                {overriddenKeys?.has(p.key) && (
                  <span className="rounded-full bg-titan-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-titan-700">
                    Custom
                  </span>
                )}
              </label>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
