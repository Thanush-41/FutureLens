import './globals.css'
import { Providers } from './providers'

export const metadata = {
  title: 'FutureLens — See the Future Consequences of Today\'s Decisions',
  description: 'AI-powered decision simulation. Explore 5-year future scenarios with a board of AI advisors.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <head>
        <script dangerouslySetInnerHTML={{__html:'window.addEventListener("error",function(e){if(e.error instanceof DOMException&&e.error.name==="DataCloneError"&&e.message&&e.message.includes("PerformanceServerTiming")){e.stopImmediatePropagation();e.preventDefault()}},true);'}} />
      </head>
      <body className="antialiased bg-[#0a0a0b] text-white">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
