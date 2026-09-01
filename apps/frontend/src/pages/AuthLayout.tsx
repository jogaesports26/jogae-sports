import type { ReactNode } from 'react'
import './AuthLayout.css'
import DeviceMockup from './DeviceMockup'

interface AuthLayoutProps {
  headline: string
  subtitle: string
  children: ReactNode
}

export default function AuthLayout({ headline, subtitle, children }: AuthLayoutProps) {
  return (
    <div className="auth">
      <div className="auth__panel auth__panel--form">
        <div className="auth__form">{children}</div>
      </div>

      <div className="auth__panel auth__panel--illustration">
        <h2 className="auth__headline">{headline}</h2>
        <p className="auth__headline-subtitle">{subtitle}</p>
        <DeviceMockup className="auth__mockup" />
      </div>
    </div>
  )
}
