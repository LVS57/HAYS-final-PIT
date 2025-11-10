import React, { useRef, useEffect, useState } from 'react'

export default function ToggleButton({ value, onChange, disabled, cooldownMs = 800 }) {
  const isOn = Number(value) === 1
  const lockRef = useRef(false)
  const [locked, setLocked] = useState(false)

  const handleClick = () => {
    if (disabled || lockRef.current) return

    lockRef.current = true
    setLocked(true)

    try {
      onChange?.(isOn ? 0 : 1)
    } finally {
      setTimeout(() => {
        lockRef.current = false
        setLocked(false)
      }, cooldownMs)
    }
  }

  const className = `toggle ${isOn ? 'on' : 'off'} ${(disabled || locked) ? 'disabled' : ''}`

  return (
    <button
      type="button"
      className={className}
      aria-pressed={isOn}
      aria-disabled={disabled || locked}
      data-busy={locked ? 'true' : 'false'}
      aria-label={isOn ? 'Turn OFF' : 'Turn ON'}
      onClick={handleClick}
      title={locked ? 'Please wait...' : isOn ? 'ON' : 'OFF'}
    >
      <span className="toggle-thumb" />
      <span className="toggle-label" aria-hidden style={{ fontSize: 0 }}>
        {isOn ? 'ON' : 'OFF'}
      </span>
    </button>
  )
}
