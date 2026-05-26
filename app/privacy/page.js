import Navbar from '../components/Navbar'
import Link from 'next/link'

export default function Privacy() {
  const sections = [
    {
      title: '1. Information you provide',
      text: 'Nagomi stores account information such as your email, username, profile details, avatar, anime preferences, posts, comments, reactions, messages, reports, blocks, mutes, and settings.',
    },
    {
      title: '2. How we use information',
      text: 'We use this information to run the app, show your profile, display posts and comments, send notifications, enable messaging, support moderation, and keep the community safe.',
    },
    {
      title: '3. Messages',
      text: 'Direct messages are part of the platform. Do not share private personal details such as your address, school, phone number, exact location, passwords, or financial information.',
    },
    {
      title: '4. Avatars and uploads',
      text: 'If you upload a profile picture, it is stored and displayed as your avatar across the app. You can replace it from settings.',
    },
    {
      title: '5. Moderation and reports',
      text: 'Reports and moderation actions may be stored so admins can review harmful behaviour, enforce rules, and protect users.',
    },
    {
      title: '6. Account deletion',
      text: 'You can request or perform account deletion from settings. This removes your account data where possible, although some moderation or safety records may remain if needed.',
    },
    {
      title: '7. Protecting yourself',
      text: 'Use privacy settings, message requests, blocking, muting, and reporting to control your experience. Never share private personal information with people you do not know.',
    },
  ]

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg)' }}>
      <Navbar />

      <div style={{ maxWidth: '760px', margin: '0 auto', padding: '40px 24px' }}>
        <h1 style={{
          fontFamily: 'Playfair Display, serif',
          fontSize: '36px',
          fontWeight: '600',
          color: 'var(--text)',
          marginBottom: '8px',
        }}>
          Privacy Policy
        </h1>

        <p style={{
          fontSize: '15px',
          color: 'var(--text-soft)',
          lineHeight: '1.7',
          marginBottom: '32px',
        }}>
          This explains what Nagomi stores and how it is used.
        </p>

        {sections.map(section => (
          <div key={section.title} style={{
            backgroundColor: 'white',
            border: '1px solid var(--border)',
            borderRadius: '16px',
            padding: '24px',
            marginBottom: '12px',
          }}>
            <h2 style={{
              fontSize: '17px',
              fontWeight: '600',
              color: 'var(--text)',
              marginBottom: '8px',
            }}>
              {section.title}
            </h2>
            <p style={{
              fontSize: '14px',
              color: 'var(--text-soft)',
              lineHeight: '1.7',
            }}>
              {section.text}
            </p>
          </div>
        ))}

        <div style={{
          backgroundColor: 'var(--lavender)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          padding: '24px',
          marginTop: '24px',
        }}>
          <p style={{ fontSize: '14px', color: 'var(--text)', lineHeight: '1.7' }}>
            You can manage your profile, privacy, safety, notification, and account settings from{' '}
            <Link href="/settings" style={{ color: 'var(--primary)', fontWeight: '500', textDecoration: 'none' }}>
              Settings
            </Link>.
          </p>
        </div>
      </div>
    </div>
  )
}