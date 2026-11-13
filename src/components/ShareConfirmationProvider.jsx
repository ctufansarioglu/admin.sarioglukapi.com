import { createContext, useCallback, useContext, useState } from 'react'
import ConfirmDialog from './ConfirmDialog.jsx'

const ShareConfirmationOpenContext = createContext(false)
const ShareConfirmationActionContext = createContext(null)

export function useShareConfirmationOpen() {
  return useContext(ShareConfirmationOpenContext)
}

export function useShareConfirmation() {
  const confirmShare = useContext(ShareConfirmationActionContext)
  if (!confirmShare) throw new Error('Share confirmation requires ShareConfirmationProvider')
  return confirmShare
}

export default function ShareConfirmationProvider({ children }) {
  const [action, setAction] = useState(null)
  const confirmShare = useCallback((onConfirm) => setAction({ onConfirm }), [])

  return <ShareConfirmationActionContext.Provider value={confirmShare}>
    <ShareConfirmationOpenContext.Provider value={action !== null}>
      {children}
    </ShareConfirmationOpenContext.Provider>
    {action && <ConfirmDialog mode="share" onCancel={() => setAction(null)} onConfirm={() => {
      setAction(null)
      action.onConfirm()
    }} />}
  </ShareConfirmationActionContext.Provider>
}
