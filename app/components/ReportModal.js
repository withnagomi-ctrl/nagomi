'use client'

import { useState } from 'react'
import { createClient } from '../lib/supabase-client'
import { checkRateLimit } from '../lib/rateLimit'

const reasons = [
  'Harassment or bullying',
  'Inappropriate content',
  'Spam',
  'Asking for personal information',
  'Threatening behaviour',
  'Other',
]

export default function ReportModal({ reportedUserId, reportedPostId, messageContent, onClose }) {
  const [selectedReason, setSelectedReason] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const supabase = createClient()

  async function handleSubmit() {
    if (!selectedReason) return

    setSubmitting(true)

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        setSubmitting(false)
        return
    }

    const { allowed, message: limitMessage } = await checkRateLimit(user.id, 'report')

    if (!allowed) {
        alert(limitMessage)
        setSubmitting(false)
        return
    }

    await supabase
        .from('reports')
        .insert({
        reporter_id: user.id,
        reported_user_id: reportedUserId || null,
        reported_post_id: reportedPostId || null,
        reason: selectedReason,
        status: 'pending',
        })

    setSubmitted(true)
    setSubmitting(false)
    }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.4)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '24px',
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '20px',
        padding: '32px',
        width: '100%',
        maxWidth: '420px',
      }}>
        {submitted ? (
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '40px', marginBottom: '16px' }}>✅</p>
            <h2 style={{
              fontFamily: 'Playfair Display, serif',
              fontSize: '22px',
              fontWeight: '600',
              color: 'var(--text)',
              marginBottom: '8px',
            }}>
              Report submitted
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--text-soft)', marginBottom: '24px' }}>
              Thank you for helping keep Nagomi safe. We'll review this report.
            </p>
            <button
              onClick={onClose}
              style={{
                backgroundColor: 'var(--primary)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                padding: '12px 24px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              Done
            </button>
          </div>
        ) : (
          <>
            <h2 style={{
              fontFamily: 'Playfair Display, serif',
              fontSize: '22px',
              fontWeight: '600',
              color: 'var(--text)',
              marginBottom: '8px',
            }}>
              Report
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--text-soft)', marginBottom: '24px' }}>
              What's the reason for this report?
            </p>

            {messageContent && (
              <div style={{
                backgroundColor: 'var(--bg)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                padding: '12px 16px',
                marginBottom: '20px',
                fontSize: '13px',
                color: 'var(--text-soft)',
                fontStyle: 'italic',
              }}>
                "{messageContent.slice(0, 100)}{messageContent.length > 100 ? '...' : ''}"
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
              {reasons.map(reason => (
                <button
                  key={reason}
                  onClick={() => setSelectedReason(reason)}
                  style={{
                    backgroundColor: selectedReason === reason ? 'var(--lavender)' : 'white',
                    border: `2px solid ${selectedReason === reason ? 'var(--secondary)' : 'var(--border)'}`,
                    borderRadius: '12px',
                    padding: '12px 16px',
                    fontSize: '14px',
                    color: 'var(--text)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontWeight: selectedReason === reason ? '600' : '400',
                  }}
                >
                  {reason}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={onClose}
                style={{
                  flex: 1,
                  backgroundColor: 'white',
                  border: '2px solid var(--border)',
                  borderRadius: '12px',
                  padding: '12px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: 'var(--text)',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!selectedReason || submitting}
                style={{
                  flex: 1,
                  backgroundColor: 'var(--primary)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '12px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: !selectedReason || submitting ? 'not-allowed' : 'pointer',
                  opacity: !selectedReason || submitting ? 0.7 : 1,
                }}
              >
                {submitting ? 'Submitting...' : 'Submit report'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}