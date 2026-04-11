import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './app/App'
import { FontProvider } from './lib/FontContext'
import './styles/index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <FontProvider>
        <App />
      </FontProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
