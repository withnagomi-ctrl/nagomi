import Link from 'next/link'
import Navbar from '../components/Navbar'

export default function StartPage() {
  const actions = [
    {
      emoji: '🔎',
      title: 'Find anime rooms',
      desc: 'Search for an anime you finished and see how others felt.',
      href: '/anime',
      button: 'Search anime',
    },
    {
      emoji: '🌙',
      title: 'Join a mood room',
      desc: 'Pick the mood that matches how you feel right now.',
      href: '/moods',
      button: 'Explore mood rooms',
    },
    {
      emoji: '💕',
      title: 'Get recommendations',
      desc: 'Answer a few questions and find your next romance anime.',
      href: '/recommendations',
      button: 'Find anime',
    },
    {
      emoji: '👥',
      title: 'Find people',
      desc: 'Discover romance anime fans with similar taste.',
      href: '/explore',
      button: 'Explore users',
    },
  ]

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg)' }}>
      <Navbar />

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '48px 24px' }}>
        <div style={{
          backgroundColor: 'white',
          border: '1px solid var(--border)',
          borderRadius: '24px',
          padding: '40px',
          marginBottom: '28px',
          textAlign: 'center',
        }}>
          <p style={{ fontSize: '42px', marginBottom: '12px' }}>🌸</p>
          <h1 style={{
            fontFamily: 'Playfair Display, serif',
            fontSize: '34px',
            fontWeight: '600',
            color: 'var(--text)',
            marginBottom: '10px',
          }}>
            Welcome to Nagomi
          </h1>
          <p style={{
            fontSize: '15px',
            color: 'var(--text-soft)',
            lineHeight: '1.7',
            maxWidth: '560px',
            margin: '0 auto',
          }}>
            Start by joining a room, finding people with similar taste, or asking for your next romance anime.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
        }}>
          {actions.map(action => (
            <Link key={action.title} href={action.href} style={{ textDecoration: 'none' }}>
              <div style={{
                backgroundColor: 'white',
                border: '1px solid var(--border)',
                borderRadius: '18px',
                padding: '24px',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
              }}>
                <p style={{ fontSize: '32px', marginBottom: '14px' }}>{action.emoji}</p>
                <h2 style={{
                  fontSize: '17px',
                  fontWeight: '600',
                  color: 'var(--text)',
                  marginBottom: '8px',
                }}>
                  {action.title}
                </h2>
                <p style={{
                  fontSize: '13px',
                  color: 'var(--text-soft)',
                  lineHeight: '1.6',
                  flex: 1,
                  marginBottom: '18px',
                }}>
                  {action.desc}
                </p>
                <span style={{
                  backgroundColor: 'var(--primary)',
                  color: 'white',
                  borderRadius: '20px',
                  padding: '9px 16px',
                  fontSize: '13px',
                  fontWeight: '600',
                  textAlign: 'center',
                }}>
                  {action.button}
                </span>
              </div>
            </Link>
          ))}
        </div>

        <div style={{
          backgroundColor: 'var(--lavender)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          padding: '20px',
          marginTop: '24px',
          textAlign: 'center',
        }}>
          <p style={{ fontSize: '13px', color: 'var(--text-soft)', lineHeight: '1.6' }}>
            Tip: verify your email to unlock posting, commenting, messaging, following, reactions, and reports.
          </p>
        </div>
      </div>
    </div>
  )
}