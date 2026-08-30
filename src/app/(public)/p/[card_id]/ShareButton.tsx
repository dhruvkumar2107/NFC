"use client"

export default function ShareButton({ name }: { name: string }) {
  async function handleShare() {
    try {
      if (navigator.share) {
        await navigator.share({ title: name, url: window.location.href })
      } else {
        await navigator.clipboard.writeText(window.location.href)
        alert('Link copied to clipboard!')
      }
    } catch {
      try {
        await navigator.clipboard.writeText(window.location.href)
        alert('Link copied to clipboard!')
      } catch {
        alert('Could not copy link.')
      }
    }
  }

  return (
    <button onClick={handleShare} className="btn-primary w-full">
      Share Profile
    </button>
  )
}
