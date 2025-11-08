import React, { useRef } from 'react'

export default function ToggleButton({ value, onChange, disabled, cooldownMs = 800 }) {
  const isOn = Number(value) === 1
  const lockRef = useRef(false)

  const handleClick = () => {
    if (disabled || lockRef.current) return
    lockRef.current = true
    try {
      onChange?.(isOn ? 0 : 1)
    } finally {
      setTimeout(() => { lockRef.current = false }, cooldownMs)
    }
  }

  const isLocked = !!lockRef.current
  const className = `toggle ${isOn ? 'on' : 'off'} ${(disabled || isLocked) ? 'disabled' : ''}`

  return (
    <button
      type="button"
      className={className}
      aria-pressed={isOn}
      aria-disabled={disabled || isLocked}
      data-busy={isLocked ? 'true' : 'false'}
      aria-label={isOn ? 'Turn OFF' : 'Turn ON'}
      onClick={handleClick}
      title={isLocked ? 'Please wait...' : (isOn ? 'ON' : 'OFF')}
    >
      <span className="toggle-thumb" />
      <span className="toggle-label" style={{ fontSize: 0 }} aria-hidden>
        {isOn ? 'ON' : 'OFF'}
      </span>
    </button>
  )
}
