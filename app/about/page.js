import Navbar from '../components/Navbar'
import Link from 'next/link'

export default function About() {
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
          About Nagomi
        </h1>

        <p style={{
          fontSize: '15px',
          color: 'var(--text-soft)',
          lineHeight: '1.7',
          marginBottom: '32px',
        }}>
          Nagomi is a cosy community for romance anime fans — especially for those moments after finishing an anime when you feel empty, emotional, healed, heartbroken, or just need someone who understands.
        </p>

        <div style={{
          backgroundColor: 'white',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          padding: '24px',
          marginBottom: '12px',
        }}>
          <h2 style={{
            fontSize: '18px',
            fontWeight: '600',
            color: 'var(--text)',
            marginBottom: '8px',
          }}>
            Why Nagomi exists
          </h2>
          <p style={{
            fontSize: '14px',
            color: 'var(--text-soft)',
            lineHeight: '1.7',
          }}>
            Romance anime can leave people with strong feelings — happiness, sadness, comfort, loneliness, nostalgia, or the need to talk about an ending. Nagomi gives people a place to share those feelings through anime rooms, mood rooms, recommendations, posts, comments, and conversations.
          </p>
        </div>

        <div style={{
          backgroundColor: 'white',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          padding: '24px',
          marginBottom: '12px',
        }}>
          <h2 style={{
            fontSize: '18px',
            fontWeight: '600',
            color: 'var(--text)',
            marginBottom: '8px',
          }}>
            What you can do here
          </h2>
          <p style={{
            fontSize: '14px',
            color: 'var(--text-soft)',
            lineHeight: '1.7',
          }}>
            You can find anime rooms, join mood rooms, ask for recommendations, react to posts, comment on emotional moments, follow people with similar taste, and build a profile around the romance anime that shaped you.
          </p>
        </div>

        <div style={{
          backgroundColor: 'white',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          padding: '24px',
          marginBottom: '12px',
        }}>
          <h2 style={{
            fontSize: '18px',
            fontWeight: '600',
            color: 'var(--text)',
            marginBottom: '8px',
          }}>
            A safer kind of anime community
          </h2>
          <p style={{
            fontSize: '14px',
            color: 'var(--text-soft)',
            lineHeight: '1.7',
          }}>
            Nagomi is designed to feel warm and respectful. The platform includes community rules, reporting, blocking, muting, moderation tools, message requests, spoiler controls, and safety reminders to help keep the space comfortable.
          </p>
        </div>

        <div style={{
          backgroundColor: 'var(--lavender)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          padding: '24px',
          marginTop: '24px',
          textAlign: 'center',
        }}>
          <p style={{
            fontSize: '14px',
            color: 'var(--text)',
            lineHeight: '1.7',
            marginBottom: '16px',
          }}>
            Whether an anime broke you, healed you, or left you staring at the ceiling after the ending — Nagomi is here for that feeling.
          </p>

          <Link href="/moods" style={{
            backgroundColor: 'var(--primary)',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '20px',
            padding: '10px 20px',
            fontSize: '14px',
            fontWeight: '600',
            display: 'inline-block',
          }}>
            Explore mood rooms
          </Link>
        </div>
      </div>
    </div>
  )
}