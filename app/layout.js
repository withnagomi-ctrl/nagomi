import './globals.css'

export const metadata = {
  title: 'Nagomi',
  description: 'A cosy place for romance recovery.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}