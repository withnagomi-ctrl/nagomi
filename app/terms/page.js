import Navbar from '../components/Navbar'
import Link from 'next/link'

export default function Terms() {
  const sections = [
    {
      title: '1. Using Nagomi',
      text: 'Nagomi is a community platform for romance anime discussion, recommendations, mood rooms, posts, comments, reactions, and messaging. By using Nagomi, you agree to follow the community rules and treat other users respectfully.',
    },
    {
      title: '2. Accounts',
      text: 'You are responsible for your account and the content you post. Do not create accounts to spam, harass, impersonate others, or avoid moderation actions.',
    },
    {
      title: '3. Community safety',
      text: 'Do not post harassment, hate speech, explicit content, graphic violence, threats, spam, or requests for private personal information. Do not pressure other users for photos, social media accounts, romantic attention, or meetups.',
    },
    {
      title: '4. Content you share',
      text: 'You keep ownership of your own posts, comments, profile information, and messages. By posting on Nagomi, you allow Nagomi to display that content inside the app.',
    },
    {
      title: '5. Moderation',
      text: 'We may remove content, restrict accounts, ban users, dismiss reports, or take other moderation actions to protect the community.',
    },
    {
      title: '6. Account deletion',
      text: 'You can delete your account from settings. Some safety records, moderation records, or technical logs may be kept when needed to protect the platform.',
    },
    {
      title: '7. Changes',
      text: 'These terms may be updated as Nagomi grows. Continued use of the platform means you accept the latest version.',
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
          Terms of Use
        </h1>

        <p style={{
          fontSize: '15px',
          color: 'var(--text-soft)',
          lineHeight: '1.7',
          marginBottom: '32px',
        }}>
          These terms explain the basic rules for using Nagomi.
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
            Please also read our{' '}
            <Link href="/privacy" style={{ color: 'var(--primary)', fontWeight: '500', textDecoration: 'none' }}>
              Privacy Policy
            </Link>{' '}
            and{' '}
            <Link href="/rules" style={{ color: 'var(--primary)', fontWeight: '500', textDecoration: 'none' }}>
              Community Rules
            </Link>.
          </p>
        </div>
      </div>
    </div>
  )
}