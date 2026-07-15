import type { SVGProps } from 'react'

function base(props: SVGProps<SVGSVGElement>) {
  return {
    xmlns: 'http://www.w3.org/2000/svg',
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    ...props,
  }
}

export function JobsIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(props)}>
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M3 12h18" />
    </svg>
  )
}

export function CustomersIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(props)}>
      <circle cx="9" cy="8" r="3.25" />
      <path d="M2.75 20a6.25 6.25 0 0 1 12.5 0" />
      <path d="M15.5 5.5a3.25 3.25 0 0 1 0 6.3" />
      <path d="M17.5 14.2a6.25 6.25 0 0 1 3.75 5.8" />
    </svg>
  )
}

export function PricebookIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(props)}>
      <path d="M12 2 3 6.5V12c0 5 3.8 8.4 9 10 5.2-1.6 9-5 9-10V6.5L12 2Z" />
      <path d="M9.5 12.5 11 14l3.5-4" />
    </svg>
  )
}

export function TechniciansIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(props)}>
      <path d="M14.7 6.3a3.5 3.5 0 0 1-4.6 4.6L4 17v3h3l6.1-6.1a3.5 3.5 0 0 1 4.6-4.6l-2.6 2.6-2-2Z" />
    </svg>
  )
}
