import { NavLink, Outlet } from 'react-router-dom'
import { CustomersIcon, JobsIcon, PricebookIcon, TechniciansIcon } from './icons'

const links = [
  { to: '/jobs', label: 'Jobs', Icon: JobsIcon },
  { to: '/customers', label: 'Customers', Icon: CustomersIcon },
  { to: '/pricebook', label: 'Pricebook', Icon: PricebookIcon },
  { to: '/technicians', label: 'Technicians', Icon: TechniciansIcon },
]

export function Layout() {
  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-navy-950 sticky top-0 z-10 border-b border-navy-800">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded bg-titan-500 text-sm font-bold text-white">
              F
            </span>
            <span className="text-lg font-semibold tracking-tight text-white">FlowOps</span>
          </div>
          <nav className="hidden items-center gap-1 md:flex">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                    isActive ? 'bg-titan-500 text-white' : 'text-slate-300 hover:bg-navy-800 hover:text-white'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-3 py-4 pb-20 md:pb-4">
        <Outlet />
      </main>

      <nav className="bg-navy-950 fixed inset-x-0 bottom-0 z-10 flex border-t border-navy-800 md:hidden">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-0.5 py-2 text-xs font-medium ${
                isActive ? 'text-titan-500' : 'text-slate-400'
              }`
            }
          >
            <link.Icon className="h-5 w-5" />
            {link.label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
