'use client'

import { useState, useCallback } from 'react'
import Cropper from 'react-easy-crop'
import { createClient } from '../lib/supabase-client'

function getCroppedImg(imageSrc, croppedAreaPixels) {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.addEventListener('load', () => {
      const canvas = document.createElement('canvas')
      const size = 300
      canvas.width = size
      canvas.height = size
      const ctx = canvas.getContext('2d')
      ctx.drawImage(
        image,
        croppedAreaPixels.x,
        croppedAreaPixels.y,
        croppedAreaPixels.width,
        croppedAreaPixels.height,
        0,
        0,
        size,
        size
      )
      canvas.toBlob(blob => {
        if (!blob) { reject(new Error('Canvas is empty')); return }
        resolve(blob)
      }, 'image/jpeg', 0.9)
    })
    image.addEventListener('error', reject)
    image.src = imageSrc
  })
}

export default function AvatarUpload({ currentAvatarUrl, userId, onUploadComplete }) {
  const [imageSrc, setImageSrc] = useState(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [showCropper, setShowCropper] = useState(false)
  const supabase = createClient()

  function onCropComplete(croppedArea, croppedAreaPixels) {
    setCroppedAreaPixels(croppedAreaPixels)
  }

  function onFileChange(e) {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be under 5MB.')
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      setImageSrc(reader.result)
      setShowCropper(true)
    }
    reader.readAsDataURL(file)
  }

  async function handleRemovePhoto() {
    if (!userId) return

    const confirmed = window.confirm('Remove your profile photo?')
    if (!confirmed) return

    setUploading(true)

    const fileName = `${userId}/avatar.jpg`

    // Remove from storage if it exists
    await supabase.storage
        .from('avatars')
        .remove([fileName])

    // Clear avatar URL from profile
    const { error } = await supabase
        .from('profiles')
        .update({ avatar_url: null })
        .eq('id', userId)

    if (error) {
        alert(error.message)
        setUploading(false)
        return
    }

    onUploadComplete(null)
    setUploading(false)
    }
  
  async function handleUpload() {
    if (!croppedAreaPixels || !imageSrc) return
    setUploading(true)

    try {
      const blob = await getCroppedImg(imageSrc, croppedAreaPixels)
      const fileName = `${userId}/avatar.jpg`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, blob, { upsert: true, contentType: 'image/jpeg' })

      if (uploadError) { alert('Upload failed. Please try again.'); setUploading(false); return }

      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(fileName)
      const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`

      await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', userId)

      onUploadComplete(publicUrl)
      setShowCropper(false)
      setImageSrc(null)
    } catch (err) {
      console.error(err)
      alert('Something went wrong. Please try again.')
    }

    setUploading(false)
  }

  return (
    <div>
      {/* Current avatar and upload button */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <div style={{ position: 'relative', width: '80px', height: '80px' }}>
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            backgroundColor: 'var(--lavender)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '32px',
            overflow: 'hidden',
          }}>
            {currentAvatarUrl ? (
              <img src={currentAvatarUrl} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : '🌸'}
          </div>
        </div>
        <div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
            <label style={{
                backgroundColor: 'white',
                border: '2px solid var(--border)',
                borderRadius: '12px',
                padding: '10px 20px',
                fontSize: '14px',
                fontWeight: '500',
                color: 'var(--text)',
                cursor: 'pointer',
                display: 'inline-block',
            }}>
                Choose photo
                <input type="file" accept="image/*" onChange={onFileChange} style={{ display: 'none' }} />
            </label>

            {currentAvatarUrl && (
                <button
                type="button"
                onClick={handleRemovePhoto}
                disabled={uploading}
                style={{
                    backgroundColor: '#ffe4e4',
                    border: '2px solid #e85555',
                    borderRadius: '12px',
                    padding: '10px 20px',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#e85555',
                    cursor: uploading ? 'not-allowed' : 'pointer',
                    opacity: uploading ? 0.7 : 1,
                }}
                >
                Remove photo
                </button>
            )}
            </div>

            <p style={{ fontSize: '12px', color: 'var(--text-soft)', marginTop: '6px' }}>
            Max 5MB. JPG, PNG, GIF.
            </p>
        </div>
      </div>

      {/* Cropper modal */}
      {showCropper && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.8)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: '24px',
        }}>
          <div style={{
            backgroundColor: 'white', borderRadius: '20px',
            width: '100%', maxWidth: '480px', overflow: 'hidden',
          }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
              <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '20px', fontWeight: '600', color: 'var(--text)' }}>
                Crop your photo
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-soft)', marginTop: '4px' }}>
                Drag to reposition, scroll to zoom.
              </p>
            </div>

            {/* Crop area */}
            <div style={{ position: 'relative', height: '320px', backgroundColor: '#222' }}>
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </div>

            {/* Zoom slider */}
            <div style={{ padding: '16px 24px' }}>
              <label style={{ fontSize: '13px', color: 'var(--text-soft)', display: 'block', marginBottom: '8px' }}>
                Zoom
              </label>
              <input
                type="range"
                min={1}
                max={3}
                step={0.1}
                value={zoom}
                onChange={e => setZoom(Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--primary)' }}
              />
            </div>

            {/* Actions */}
            <div style={{ padding: '0 24px 24px', display: 'flex', gap: '12px' }}>
              <button
                onClick={() => { setShowCropper(false); setImageSrc(null) }}
                style={{
                  flex: 1, backgroundColor: 'white', border: '2px solid var(--border)',
                  borderRadius: '12px', padding: '12px', fontSize: '14px',
                  fontWeight: '500', color: 'var(--text)', cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={uploading}
                style={{
                  flex: 1, backgroundColor: 'var(--primary)', border: 'none',
                  borderRadius: '12px', padding: '12px', fontSize: '14px',
                  fontWeight: '600', color: 'white',
                  cursor: uploading ? 'not-allowed' : 'pointer',
                  opacity: uploading ? 0.7 : 1,
                }}
              >
                {uploading ? 'Uploading...' : 'Save photo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}