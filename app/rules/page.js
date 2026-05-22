import Navbar from '../components/Navbar'
import Link from 'next/link'

export default function Rules() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg)' }}>
      <Navbar />

      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '40px 24px' }}>
        <h1 style={{
          fontFamily: 'Playfair Display, serif',
          fontSize: '36px',
          fontWeight: '600',
          color: 'var(--text)',
          marginBottom: '8px',
        }}>
          Community Rules
        </h1>
        <p style={{ fontSize: '15px', color: 'var(--text-soft)', marginBottom: '40px' }}>
          Nagomi is a cosy place. Help us keep it that way.
        </p>

        {[
          {
            title: '1. Be kind',
            desc: 'Treat everyone with respect. Nagomi is built around emotional experiences — be gentle with people who are sharing how they feel.',
          },
          {
            title: '2. No harassment',
            desc: 'Do not target, bully, or repeatedly bother another user. If someone asks you to stop, stop.',
          },
          {
            title: '3. No explicit content',
            desc: 'Nagomi is for all ages. No sexual content, graphic violence, or anything inappropriate for a general audience.',
          },
          {
            title: '4. Protect your privacy',
            desc: 'Do not share your school, address, phone number, exact location, or any other private information. Do not ask others for this information either.',
          },
          {
            title: '5. No pressuring people',
            desc: 'Nagomi is for anime discussion and community. Do not pressure people for romantic attention, photos, personal social media accounts, or meetups.',
          },
          {
            title: '6. Mark spoilers',
            desc: 'Always tag your posts with the correct spoiler level. Not everyone has finished the anime you are discussing.',
          },
          {
            title: '7. No spam',
            desc: 'Do not flood the live chat or post feed with repeated messages or irrelevant content.',
          },
          {
            title: '8. No hate speech',
            desc: 'No content that attacks people based on race, gender, sexuality, religion, disability, or any other characteristic.',
          },
          {
            title: '9. Respect boundaries',
            desc: 'If someone does not want to talk, that is their right. Respect it.',
          },
          {
            title: '10. Keep it anime-focused',
            desc: 'Nagomi is a romance anime community. Keep conversations relevant and on topic.',
          },
        ].map(rule => (
          <div key={rule.title} style={{
            backgroundColor: 'white',
            border: '1px solid var(--border)',
            borderRadius: '16px',
            padding: '24px',
            marginBottom: '12px',
          }}>
            <h2 style={{
              fontSize: '16px',
              fontWeight: '600',
              color: 'var(--text)',
              marginBottom: '8px',
            }}>
              {rule.title}
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--text-soft)', lineHeight: '1.7' }}>
              {rule.desc}
            </p>
          </div>
        ))}

        <div style={{
          backgroundColor: 'var(--lavender)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          padding: '24px',
          marginTop: '24px',
          textAlign: 'center',
        }}>
          <p style={{ fontSize: '14px', color: 'var(--text)', lineHeight: '1.7' }}>
            Breaking these rules may result in your account being warned, restricted, or permanently banned.
            If you see something that breaks these rules, please{' '}
            <Link href="/report" style={{ color: 'var(--primary)', fontWeight: '500', textDecoration: 'none' }}>
              report it
            </Link>.
          </p>
        </div>
      </div>
    </div>
  )
}