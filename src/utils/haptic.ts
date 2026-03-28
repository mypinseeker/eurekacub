let _enabled = true

export const haptic = {
  tap: () => { if (_enabled) navigator.vibrate?.(10) },
  click: () => { if (_enabled) navigator.vibrate?.(20) },
  success: () => { if (_enabled) navigator.vibrate?.([20, 50, 20]) },
  aha: () => { if (_enabled) navigator.vibrate?.([50, 30, 30, 30, 20]) },
  celebrate: () => { if (_enabled) navigator.vibrate?.([30, 50, 30, 50, 30, 50, 80]) },
  drag: () => { if (_enabled) navigator.vibrate?.(15) },
  hint: () => { if (_enabled) navigator.vibrate?.(8) },
  nudge: () => { if (_enabled) navigator.vibrate?.(12) },
}

export const setHapticEnabled = (v: boolean) => { _enabled = v }
