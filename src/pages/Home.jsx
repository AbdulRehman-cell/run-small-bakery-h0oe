import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Card, Spinner, Badge, Alert } from '../components/ui'

export default function Home() {
  const [featuredItems, setFeaturedItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchFeatured() {
      try {
        setLoading(true)
        setError(null)
        const { data, error: err } = await supabase
          .from('menu_items')
          .select('*')
          .eq('is_available', true)
          .order('is_featured', { ascending: false })
          .limit(6)

        if (err) throw err
        setFeaturedItems(data || [])
      } catch (err) {
        console.error('Error fetching menu items:', err)
        setError(err.message || 'Failed to load daily specials')
      } finally {
        setLoading(false)
      }
    }

    fetchFeatured()
  }, [])

  return (
    <div className="home-page">
      {/* SECTION 1: HERO */}
      <section className="hero section animate-in">
        <div className="container hero-container">
          <div className="hero-content">
            <span className="hero-eyebrow eyebrow">Artisanal Bakery in Gulberg, Lahore</span>
            <h1 className="hero-title">
              Freshly Baked Joy, Every Single <span className="gradient-text">Morning</span>.
            </h1>
            <p className="hero-description">
              From golden sourdough breads and flaky butter croissants to handcrafted birthday cakes. Experience authentic European baking infused with local Lahori warmth.
            </p>
            <div className="hero-actions">
              <Link to="/order" className="btn btn-primary">
                Order Pickup Now
              </Link>
              <Link to="/menu" className="btn btn-secondary">
                Explore Full Menu
              </Link>
            </div>
            <div className="hero-stats-row">
              <div className="hero-stat">
                <span className="stat-value">100%</span>
                <span className="stat-label">Organic Flour</span>
              </div>
              <div className="hero-stat">
                <span className="stat-value">6:30 AM</span>
                <span className="stat-label">Fresh Oven Daily</span>
              </div>
              <div className="hero-stat">
                <span className="stat-value">4.9 ★</span>
                <span className="stat-label">1,200+ Reviews</span>
              </div>
            </div>
          </div>
          <div className="hero-media">
            <div className="hero-image-wrapper card-glass">
              <img
                src="https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80"
                alt="Golden sourdough bread fresh from the oven"
                className="img-cover hero-img img-rounded"
              />
              <div className="hero-floating-badge card-white">
                <span className="badge-icon">🔥</span>
                <div>
                  <strong>Fresh Batch Alert</strong>
                  <p>Hot Croissants ready in 15 mins!</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: BRAND STORY & CRAFT */}
      <section className="section section-story bg-surface">
        <div className="container">
          <div className="grid-2 align-center">
            <div className="story-image-grid">
              <img
                src="https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=600&q=80"
                alt="Golden Crust Baker shaping dough"
                className="img-cover story-img-1 img-rounded img-shadow"
              />
              <img
                src="https://images.unsplash.com/photo-1517433670267-08bbd4be890f?auto=format&fit=crop&w=600&q=80"
                alt="Flaky pastries display"
                className="img-cover story-img-2 img-rounded img-shadow"
              />
            </div>
            <div className="story-content">
              <span className="eyebrow">Our Heritage</span>
              <h2>Crafted with Patience, Baked with Passion</h2>
              <p>
                Founded in the heart of Gulberg, Golden Crust Bakery was born out of an obsession with slow-fermented sourdoughs and uncompromised French pastry standards.
              </p>
              <p>
                We use pure New Zealand butter, unbleached stone-ground Pakistani wheat, and wild yeast cultures nurtured for over 6 years. No shortcuts, no artificial preservatives—just real ingredient magic.
              </p>
              <div className="story-highlights">
                <div className="highlight-item">
                  <span className="highlight-icon">✨</span>
                  <div>
                    <h4>36-Hour Fermentation</h4>
                    <p>Easier to digest, rich in flavor, perfectly crusty.</p>
                  </div>
                </div>
                <div className="highlight-item">
                  <span className="highlight-icon">🧈</span>
                  <div>
                    <h4>84% Butterfat Pastries</h4>
                    <p>Unmatched honeycomb cross-sections and rich texture.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: FEATURED MENU HIGHLIGHTS (LIVE DATA) */}
      <section className="section section-specials">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Fresh Today</span>
            <h2>Oven-Fresh Daily Specials</h2>
            <p>Browse a selection of today’s freshly baked items. Reserve yours for pickup before they sell out.</p>
          </div>

          {loading && (
            <div className="loading-container">
              <Spinner size="lg" />
              <p>Fetching today's baked delights...</p>
            </div>
          )}

          {error && (
            <Alert variant="error" title="Could not load daily specials">
              {error}
            </Alert>
          )}

          {!loading && !error && featuredItems.length === 0 && (
            <div className="empty-specials card">
              <h3>No items available right now</h3>
              <p>Check back later or view our full menu catalog!</p>
              <Link to="/menu" className="btn btn-primary">View Full Menu</Link>
            </div>
          )}

          {!loading && !error && featuredItems.length > 0 && (
            <div className="grid-3 features-grid">
              {featuredItems.map((item) => (
                <Card key={item.id} interactive className="menu-specials-card">
                  <div className="card-media-wrapper">
                    <img
                      src={item.image_url || 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=500&q=80'}
                      alt={item.name}
                      className="card-media-img img-cover"
                    />
                    <div className="card-badge-pos">
                      <Badge variant={item.category === 'Breads' ? 'primary' : 'secondary'}>
                        {item.category}
                      </Badge>
                    </div>
                  </div>
                  <div className="card-specials-body">
                    <div className="card-header-row">
                      <h3 className="card-title">{item.name}</h3>
                      <span className="price-tag">PKR {item.price_pkr}</span>
                    </div>
                    <p className="card-description">{item.description}</p>
                    <div className="card-footer-row">
                      <Link to="/order" className="btn btn-ghost btn-sm">
                        Add to Pickup Order →
                      </Link>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          <div className="specials-cta-row">
            <Link to="/menu" className="btn btn-primary">
              View All Bakery Menu Items
            </Link>
          </div>
        </div>
      </section>

      {/* SECTION 4: HOW PICKUP WORKS */}
      <section className="section section-how bg-surface">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Convenient & Fast</span>
            <h2>How Express Pickup Works</h2>
            <p>Skip the waiting queue in-store with our seamless 3-step pickup system.</p>
          </div>

          <div className="grid-3 steps-grid">
            <div className="step-card card card-white">
              <div className="step-number">01</div>
              <h3>Select Items</h3>
              <p>Browse our live online menu, choose your preferred loaves, cakes, or savories, and assemble your basket.</p>
            </div>
            <div className="step-card card card-white">
              <div className="step-number">02</div>
              <h3>Set Pickup Time</h3>
              <p>Specify your exact pickup window and leave any custom notes for our head baker.</p>
            </div>
            <div className="step-card card card-white">
              <div className="step-number">03</div>
              <h3>Grab & Enjoy</h3>
              <p>Walk into our Gulberg bakery, state your name or phone number, and pick up your hot, packed box immediately.</p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 5: CUSTOMER TESTIMONIALS */}
      <section className="section section-testimonials">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Love from Lahore</span>
            <h2>What Our Regulars Say</h2>
            <p>We take pride in bringing smiling faces and warm aromas to thousands of homes.</p>
          </div>

          <div className="grid-3 testimonials-grid">
            <div className="testimonial card card-white">
              <p className="testimonial-text">
                "Golden Crust's Sourdough is hands down the best in Lahore. Crisp shell, airy interior, and perfectly tangy. Pickup is always warm and ready!"
              </p>
              <div className="testimonial-author-box">
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80"
                  alt="Ayesha Khan"
                  className="author-avatar"
                />
                <div>
                  <h4 className="testimonial-author">Ayesha Khan</h4>
                  <span className="testimonial-role">Gulberg III Resident</span>
                </div>
              </div>
            </div>

            <div className="testimonial card card-white">
              <p className="testimonial-text">
                "Ordered a custom Belgian Chocolate Cake for my daughter's birthday. Not only was it stunning, but it melted in the mouth. Highly recommended!"
              </p>
              <div className="testimonial-author-box">
                <img
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80"
                  alt="Usman Tariq"
                  className="author-avatar"
                />
                <div>
                  <h4 className="testimonial-author">Usman Tariq</h4>
                  <span className="testimonial-role">Food Blogger & Architect</span>
                </div>
              </div>
            </div>

            <div className="testimonial card card-white">
              <p className="testimonial-text">
                "Their Almond Croissants are dangerous—I get them every Sunday morning. Pre-ordering online saves me so much time in traffic!"
              </p>
              <div className="testimonial-author-box">
                <img
                  src="https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=120&q=80"
                  alt="Zainab Raza"
                  className="author-avatar"
                />
                <div>
                  <h4 className="testimonial-author">Zainab Raza</h4>
                  <span className="testimonial-role">Regular Patron</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 6: FAQ & LOCATION DETAILS */}
      <section className="section section-faq bg-surface">
        <div className="container">
          <div className="grid-2">
            <div className="faq-intro">
              <span className="eyebrow">Got Questions?</span>
              <h2>Frequently Asked Questions</h2>
              <p>Everything you need to know about our daily baking schedule and pickup orders.</p>
              <div className="location-box card card-white">
                <h4>📍 Bakery Location & Hours</h4>
                <p><strong>Address:</strong> 42-C Main Boulevard, Gulberg III, Lahore</p>
                <p><strong>Hours:</strong> Mon – Sun: 7:00 AM – 10:00 PM</p>
                <p><strong>Call Us:</strong> +92 (42) 3578-9012</p>
              </div>
            </div>

            <div className="faq-list">
              <div className="faq-item card card-white">
                <h4>How far in advance should I place a pickup order?</h4>
                <p>For standard bread and pastry orders, placing your order 1 to 2 hours in advance ensures fresh boxing. For custom cakes, we recommend 24 hours.</p>
              </div>

              <div className="faq-item card card-white">
                <h4>Are all your ingredients certified halal and fresh?</h4>
                <p>Yes! We use 100% halal, high-grade local and imported ingredients with zero artificial flavor enhancers or pre-packaged premixes.</p>
              </div>

              <div className="faq-item card card-white">
                <h4>What if I am running late for my pickup time?</h4>
                <p>No worries! We keep your order in temperature-controlled holding units until you arrive during operational hours.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 7: CALL TO ACTION BANNER */}
      <section className="cta-section">
        <div className="container container-narrow cta-container">
          <h2>Ready to Taste Real Artisanal Baking?</h2>
          <p>
            Order your freshly baked loaves, delicate croissants, or rich celebration cakes online now and collect them warm at your selected time.
          </p>
          <div className="cta-actions">
            <Link to="/order" className="btn btn-primary">
              Place Express Pickup Order
            </Link>
            <Link to="/menu" className="btn btn-secondary">
              Browse Full Catalog
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}