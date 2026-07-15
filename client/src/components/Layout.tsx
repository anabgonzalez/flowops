import { NavLink, Outlet } from 'react-router-dom'

const links = [
  { to: '/jobs', label: 'Jobs' },
  { to: '/customers', label: 'Customers' },
  { to: '/pricebook', label: 'Pricebook' },
  { to: '/technicians', label: 'Technicians' },
]

export function Layout() {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center gap-1 overflow-x-auto px-3 py-3">
          <span className="mr-3 shrink-0 text-lg font-semibold text-slate-900">FlowOps</span>
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `shrink-0 rounded-md px-3 py-1.5 text-sm font-medium ${
                  isActive ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-3 py-4">
        <Outlet />
      </main>
    </div>
  )
}
