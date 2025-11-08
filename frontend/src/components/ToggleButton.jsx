import React from 'react'

export default function ToggleButton({ value, onChange, disabled }) {
  const isOn = Number(value) === 1
  const handleClick = () => {
    if (disabled) return
    onChange?.(isOn ? 0 : 1)
  }

  return (
    <button
      type="button"
      className={`toggle ${isOn ? 'on' : 'off'} ${disabled ? 'disabled' : ''}`}
      aria-pressed={isOn}
      aria-label={isOn ? 'Turn OFF' : 'Turn ON'}
      onClick={handleClick}
      title={isOn ? 'ON' : 'OFF'}
    >
      <span className="toggle-thumb" />
      <span className="toggle-label" style={{ fontSize: 0 }} aria-hidden>
        {isOn ? 'ON' : 'OFF'}
      </span>
    </button>
  )
}
