export default function Banned() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#fdf6f0', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ backgroundColor: 'white', border: '1px solid #f0ddd8', borderRadius: '24px', padding: '48px', width: '100%', maxWidth: '480px', textAlign: 'center' }}>
        <p style={{ fontSize: '48px', marginBottom: '16px' }}>🚫</p>
        <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '28px', fontWeight: '600', color: '#3d2c2c', marginBottom: '12px' }}>Your account has been banned</h1>
        <p style={{ fontSize: '15px', color: '#8a6a6a', lineHeight: '1.7', marginBottom: '24px' }}>Your account has been banned from Nagomi for violating our community rules. If you believe this was a mistake or would like to appeal, please contact us.</p>
        <a href="mailto:withnagomi@gmail.com" style={{ backgroundColor: '#e8748a', color: 'white', textDecoration: 'none', borderRadius: '12px', padding: '12px 24px', fontSize: '15px', fontWeight: '600', display: 'inline-block', marginBottom: '16px' }}>Email us to appeal</a>
        <p style={{ fontSize: '13px', color: '#8a6a6a' }}>withnagomi@gmail.com</p>
      </div>
    </div>
  )
}