import { useEffect, useEffectEvent, useState } from 'react'

export function useFileDrop(enabled, onFiles) {
  const [dragging, setDragging] = useState(false)
  const handleFiles = useEffectEvent((files) => onFiles(files))

  useEffect(() => {
    let depth = 0
    const hasFiles = (event) => Array.from(event.dataTransfer?.types || []).includes('Files')
    const enter = (event) => { if (!hasFiles(event)) return; event.preventDefault(); depth++; if (enabled) setDragging(true) }
    const over = (event) => { if (hasFiles(event)) { event.preventDefault(); event.dataTransfer.dropEffect = enabled ? 'copy' : 'none' } }
    const leave = (event) => { if (!hasFiles(event)) return; depth = Math.max(0, depth - 1); if (!depth) setDragging(false) }
    const drop = (event) => { if (!hasFiles(event)) return; event.preventDefault(); depth = 0; setDragging(false); if (enabled) handleFiles(event.dataTransfer.files) }
    const reset = () => { depth = 0; setDragging(false) }
    window.addEventListener('dragenter', enter)
    window.addEventListener('dragover', over)
    window.addEventListener('dragleave', leave)
    window.addEventListener('drop', drop)
    window.addEventListener('blur', reset)
    return () => {
      setDragging(false)
      window.removeEventListener('dragenter', enter)
      window.removeEventListener('dragover', over)
      window.removeEventListener('dragleave', leave)
      window.removeEventListener('drop', drop)
      window.removeEventListener('blur', reset)
    }
  }, [enabled])
  return dragging && enabled
}
