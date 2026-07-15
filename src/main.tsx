import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'; // ou './main.css', dependendo do nome do arquivo no Passo 1
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
