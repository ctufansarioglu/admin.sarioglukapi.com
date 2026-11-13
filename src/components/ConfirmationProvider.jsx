import { createContext, useContext, useMemo, useState } from 'react'
import ConfirmDialog from './ConfirmDialog.jsx'

const ConfirmationOpenContext = createContext(false)
const ConfirmationActionsContext = createContext(null)

export function useConfirmationOpen() {
  return useContext(ConfirmationOpenContext)
}

export function useConfirmationActions() {
  const actions = useContext(ConfirmationActionsContext)
  if (!actions) throw new Error('Confirmation actions require ConfirmationProvider')
  return actions
}

export default function ConfirmationProvider({ category, changes, onPublish, onDiscard, children }) {
  const [action, setAction] = useState(null)
  const actions = useMemo(() => ({
    confirmDiscard: () => setAction('discard'),
    confirmPublish: () => setAction('publish'),
  }), [])

  return <ConfirmationActionsContext.Provider value={actions}>
    <ConfirmationOpenContext.Provider value={action !== null}>
      {children}
    </ConfirmationOpenContext.Provider>
    {action && <ConfirmDialog mode={action} category={category} changes={changes} onCancel={() => setAction(null)} onConfirm={() => {
      const confirmed = action
      setAction(null)
      if (confirmed === 'publish') onPublish()
      else onDiscard()
    }} />}
  </ConfirmationActionsContext.Provider>
}
