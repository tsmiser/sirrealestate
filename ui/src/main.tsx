import React from 'react'
import ReactDOM from 'react-dom/client'
import { Amplify } from 'aws-amplify'
import { amplifyConfig } from '@/config/amplify'
import App from './App'
import './index.css'

Amplify.configure(amplifyConfig)

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
