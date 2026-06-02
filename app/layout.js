import './globals.css'

export const metadata = {
  title: 'Nagomi',
  description: 'A cosy place for romance recovery.',
  verification: {
    google: 'P0T_1RZ5SbQGOEAenm4gpMt22g2xZjUSrEbTb_6Qn0c',
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}