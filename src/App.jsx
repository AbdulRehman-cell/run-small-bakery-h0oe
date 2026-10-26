import { useEffect, useState } from 'react'
import { Routes, Route, NavLink, Link, useLocation } from 'react-router-dom'
import Home from './pages/Home.jsx'
import Menu from './pages/Menu.jsx'
import OrderPickup from './pages/OrderPickup.jsx'
import StaffOrders from './pages/StaffOrders.jsx'

const BRAND = "Golden Crust Bakery"
const NAV = [
  { to: "/", label: "Home" },
  { to: "/menu", label: "Bakery Menu" },
  { to: "/order", label: "Order Pickup" },
  { to: "/staff", label: "Staff Dashboard" },
]

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return null
}

function NotFound() {
  return (
    <section className="section not-found">
      <div className="container section-head">
        <span className="eyebrow">404</span>
        <h1>Page not found</h1>
        <p>The page you are looking for does not exist.</p>
        <Link to="/" className="btn btn-primary">Back home</Link>
      </div>
    </section>
  )
}

export default function App() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div className="app-shell">
      <ScrollToTop />
      <header className={`site-header${scrolled ? ' scrolled' : ''}`}>
        <Link to="/" className="nav-brand">
          <span className="brand-mark" aria-hidden="true">🥐</span>
          <span className="brand-name">{BRAND}</span>
        </Link>
        <nav className="nav-links" aria-label="Main navigation">
          {NAV.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.to === '/'} className={({ isActive }) => (isActive ? 'active' : undefined)}>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <Link to="/menu" className="nav-cta">Order Pickup Now</Link>
      </header>

      <main className="site-main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/menu" element={<Menu />} />
          <Route path="/order" element={<OrderPickup />} />
          <Route path="/staff" element={<StaffOrders />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

      <footer className="site-footer">
        <div className="container footer-grid">
          <div className="footer-brand">
            <Link to="/" className="footer-logo">🥐 {BRAND}</Link>
            <p className="footer-desc">Freshly Baked Artisanal Breads & Treats in Gulberg, Lahore</p>
          </div>
          <div className="footer-col">
            <h4 className="footer-col-title">Explore</h4>
            <ul className="footer-col-links">
              {NAV.map((item) => <li key={item.to}><Link to={item.to}>{item.label}</Link></li>)}
            </ul>
          </div>
        </div>
        <div className="container footer-bottom">
          <span>© {new Date().getFullYear()} {BRAND}. All rights reserved.</span>
        </div>
      </footer>
    </div>
  )
}
