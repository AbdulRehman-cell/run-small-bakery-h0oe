import './index.css'
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)

// Scroll-reveal: add .visible to .reveal elements as they enter the viewport
const observer = new IntersectionObserver((entries) => {
  entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('visible'); observer.unobserve(e.target) } })
}, { threshold: 0.12 })
const wire = () => document.querySelectorAll('.reveal:not(.visible)').forEach((el) => observer.observe(el))
wire()
new MutationObserver(wire).observe(document.getElementById('root'), { childList: true, subtree: true })
