import { useEffect } from 'react'

export default function MuiLayerOverride() {
  useEffect(() => {
    const styleElement = document.createElement('style')
    styleElement.setAttribute('id', 'mui-layer-override')
    styleElement.setAttribute('data-priority', 'high')
    styleElement.textContent = `
      @layer theme, base, mui, components, utilities;
      @layer mui {
        .mui-layer-override { --mui-layer-order-fixed: true; }
      }
    `
    const head = document.head
    if (head.firstChild) {
      head.insertBefore(styleElement, head.firstChild)
    } else {
      head.appendChild(styleElement)
    }
    return () => {
      document.getElementById('mui-layer-override')?.remove()
    }
  }, [])

  return null
}
