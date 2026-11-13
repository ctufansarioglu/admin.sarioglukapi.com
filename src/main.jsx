import React from 'react'
import { createRoot } from 'react-dom/client'
import { Global } from '@emotion/react'
import App from './App.jsx'
import { baseStyles } from './styles/base.js'
import { layoutStyles } from './styles/layout.js'
import { galleryStyles } from './styles/gallery.js'
import { feedbackStyles } from './styles/feedback.js'
import { responsiveStyles } from './styles/responsive.js'

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Global styles={[baseStyles, layoutStyles, galleryStyles, feedbackStyles, responsiveStyles]} />
    <App />
  </React.StrictMode>,
)
