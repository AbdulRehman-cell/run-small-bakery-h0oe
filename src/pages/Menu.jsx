import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Button, Card, Badge, Modal, Input, Select, toast } from '../components/ui'

const CATEGORIES = [
  { id: 'all', label: 'All Items' },
  { id: 'Breads', label: 'Artisanal Breads' },
  { id: 'Pastries', label: 'Flaky Pastries' },
  { id: 'Cakes', label: 'Signature Cakes' },
  { id: 'Savory', label: 'Savory Bakes' }
]

const SAMPLE_MENU = [
  {
    name: 'Sourdough Country Loaf',
    category: 'Breads',
    description: '36-hour slow fermented sourdough with a dark crispy crust and open airy crumb.',
    price_pkr: 650,
    image_url: 'https://images.unsplash.com/photo-1585478259715-876acc5be8eb?auto=format&fit=crop&q=80&w=800',
    is_available: true,
    is_featured: true
  },
  {
    name: 'Butter Croissant',
    category: 'Pastries',
    description: 'Classic French croissant made with 84% fat Normandy butter, layered to flaky perfection.',
    price_pkr: 380,
    image_url: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&q=80&w=800',
    is_available: true,
    is_featured: true
  },
  {
    name: 'Pistachio Belgian Chocolate Cake',
    category: 'Cakes',
    description: 'Rich dark chocolate sponge layered with roasted pistachio cream and dark chocolate ganache.',
    price_pkr: 3200,
    image_url: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&q=80&w=800',
    is_available: true,
    is_featured: true
  },
  {
    name: 'Almond Pain au Chocolat',
    category: 'Pastries',
    description: 'Double baked croissant filled with rich almond frangipane and Belgian chocolate batons.',
    price_pkr: 450,
    image_url: 'https://images.unsplash.com/photo-1608198093002-ad4e005484ec?auto=format&fit=crop&q=80&w=800',
    is_available: true,
    is_featured: false
  },
  {
    name: 'Chicken & Mushroom Danish',
    category: 'Savory',
    description: 'Savory puff pastry shell filled with creamy chicken, wild mushrooms, and thyme.',
    price_pkr: 520,
    image_url: 'https://images.unsplash.com/photo-1621236378699-8597faf6a176?auto=format&fit=crop&q=80&w=800',
    is_available: true,
    is_featured: false
  },
  {
    name: 'Classic Brioche Bun (Pack of 4)',
    category: 'Breads',
    description: 'Soft, golden, enriched brioche buns topped with sesame seeds. Perfect for burgers or sandwiches.',
    price_pkr: 480,
    image_url: 'https://images.unsplash.com/photo-1586444248902-2f64eddc13df?auto=format&fit=crop&q=80&w=800',
    is_available: true,
    is_featured: false
  }
]

export default function Menu() {
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Filters & Search
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('default')

  // Selected Item Modal
  const [activeModalItem, setActiveModalItem] = useState(null)
  const [modalQuantity, setModalQuantity] = useState(1)

  // Cart State (stored in localStorage for pickup order sync)
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem('gc_cart')
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

  useEffect(() => {
    fetchMenuItems()
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem('gc_cart', JSON.stringify(cart))
    } catch (e) {
      console.error('Failed to sync cart', e)
    }
  }, [cart])

  const fetchMenuItems = async () => {
    setLoading(true)
    setError(null)
    try {
      const { data, error: fetchErr } = await supabase
        .from('menu_items')
        .select('*')
        .order('created_at', { ascending: false })

      if (fetchErr) throw fetchErr

      // Seed default items if table is empty
      if (!data || data.length === 0) {
        const { data: seeded, error: seedErr } = await supabase
          .from('menu_items')
          .insert(SAMPLE_MENU)
          .select()

        if (seedErr) throw seedErr
        setItems(seeded || [])
      } else {
        setItems(data)
      }
    } catch (err) {
      console.error('Error loading menu:', err)
      setError('Unable to load bakery menu. Please refresh or try again.')
    } finally {
      setLoading(false)
    }
  }

  const addToCart = (item, qty = 1) => {
    setCart((prevCart) => {
      const existingIdx = prevCart.findIndex((ci) => ci.id === item.id)
      if (existingIdx > -1) {
        const updated = [...prevCart]
        updated[existingIdx].quantity += qty
        return updated
      }
      return [...prevCart, { ...item, quantity: qty }]
    })

    toast.success(`Added ${qty}x ${item.name} to your pickup basket!`)
  }

  const updateCartQty = (id, delta) => {
    setCart((prevCart) => {
      return prevCart
        .map((ci) => {
          if (ci.id === id) {
            const newQty = ci.quantity + delta
            return newQty > 0 ? { ...ci, quantity: newQty } : null
          }
          return ci
        })
        .filter(Boolean)
    })
  }

  // Filtered & Sorted items
  const filteredItems = items.filter((item) => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  }).sort((a, b) => {
    if (sortBy === 'price-low') return a.price_pkr - b.price_pkr
    if (sortBy === 'price-high') return b.price_pkr - a.price_pkr
    if (sortBy === 'name') return a.name.localeCompare(b.name)
    return 0
  })

  const cartTotalItems = cart.reduce((sum, item) => sum + item.quantity, 0)
  const cartTotalPrice = cart.reduce((sum, item) => sum + item.price_pkr * item.quantity, 0)

  return (
    <div className="menu-page">
      {/* Page Hero */}
      <section className="section hero-mini">
        <div className="container">
          <div className="section-head text-left">
            <span className="eyebrow">Fresh Daily in Gulberg III, Lahore</span>
            <h1>Our Artisanal Bakery Menu</h1>
            <p className="hero-subtitle">
              Handcrafted sourdoughs, rich butter pastries, and decadent signature cakes baked fresh every morning using natural stone-ground flour and pure butter.
            </p>
          </div>
        </div>
      </section>

      {/* Main Filter & Menu Display */}
      <section className="section menu-section">
        <div className="container">
          {/* Controls Bar */}
          <div className="menu-controls-card card-white">
            <div className="menu-search-box">
              <Input
                placeholder="Search breads, croissants, cakes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="menu-categories-pills">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  className={`category-pill ${selectedCategory === cat.id ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(cat.id)}
                >
                  {cat.label}
                </button>
              ))}
            </div>
            <div className="menu-sort-box">
              <Select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                options={[
                  { value: 'default', label: 'Sort: Featured' },
                  { value: 'price-low', label: 'Price: Low to High' },
                  { value: 'price-high', label: 'Price: High to Low' },
                  { value: 'name', label: 'Name: A to Z' }
                ]}
              />
            </div>
          </div>

          {/* Loading & Error States */}
          {loading && (
            <div className="menu-loading-grid grid-3">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div key={n} className="card-skeleton">
                  <div className="skeleton-img"></div>
                  <div className="skeleton-body">
                    <div className="skeleton-line short"></div>
                    <div className="skeleton-line"></div>
                    <div className="skeleton-line"></div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {error && (
            <div className="menu-error-box alert alert-error">
              <p>{error}</p>
              <Button variant="secondary" onClick={fetchMenuItems}>
                Retry Loading
              </Button>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && filteredItems.length === 0 && (
            <div className="menu-empty-card card-white">
              <h3>No delicious items found</h3>
              <p>We couldn't find anything matching your search query or selected category.</p>
              <Button
                variant="ghost"
                onClick={() => {
                  setSearchQuery('')
                  setSelectedCategory('all')
                }}
              >
                Clear Filters
              </Button>
            </div>
          )}

          {/* Menu Items Grid */}
          {!loading && !error && filteredItems.length > 0 && (
            <div className="grid-3 menu-items-grid">
              {filteredItems.map((item) => (
                <Card key={item.id} className="menu-card" padding="none">
                  <div className="menu-card-image-wrap" onClick={() => setActiveModalItem(item)}>
                    <img src={item.image_url} alt={item.name} loading="lazy" />
                    {item.is_featured && <Badge variant="primary" className="featured-badge">Baker's Choice</Badge>}
                    {!item.is_available && <div className="sold-out-overlay">Sold Out Today</div>}
                  </div>
                  <div className="menu-card-body">
                    <div className="menu-card-header">
                      <span className="menu-card-category">{item.category}</span>
                      <span className="menu-card-price">PKR {item.price_pkr.toLocaleString()}</span>
                    </div>
                    <h3 className="menu-card-title" onClick={() => setActiveModalItem(item)}>
                      {item.name}
                    </h3>
                    <p className="menu-card-desc">{item.description}</p>
                    <div className="menu-card-footer">
                      <Button
                        variant="ghost"
                        onClick={() => setActiveModalItem(item)}
                      >
                        Quick View
                      </Button>
                      <Button
                        variant="primary"
                        disabled={!item.is_available}
                        onClick={() => addToCart(item)}
                      >
                        {item.is_available ? 'Add to Order' : 'Sold Out'}
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Floating Pickup Basket Banner */}
      {cartTotalItems > 0 && (
        <div className="floating-basket-bar">
          <div className="container floating-basket-content">
            <div className="basket-info">
              <span className="basket-count">{cartTotalItems} {cartTotalItems === 1 ? 'item' : 'items'} in your basket</span>
              <span className="basket-total">Total: PKR {cartTotalPrice.toLocaleString()}</span>
            </div>
            <div className="basket-actions">
              <Link to="/order" className="btn btn-primary">
                Proceed to Checkout &rarr;
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Bakery Promises / Quality Section */}
      <section className="section bg-surface section-promises">
        <div className="container">
          <div className="section-head text-center">
            <span className="eyebrow">Our Baking Philosophy</span>
            <h2>Why Golden Crust Bakes Better</h2>
          </div>
          <div className="grid-3 promise-grid">
            <div className="promise-card card-white">
              <div className="promise-icon">🌾</div>
              <h3>100% Organic Flours</h3>
              <p>We source stone-ground, unbleached organic flours with no additives or chemical improvers for high digestible gluten profile.</p>
            </div>
            <div className="promise-card card-white">
              <div className="promise-icon">⏱️</div>
              <h3>Slow Fermentation</h3>
              <p>Our sourdough cultures ferment naturally over 36 hours, producing rich prebiotic enzymes, deep complex flavor, and golden crusts.</p>
            </div>
            <div className="promise-card card-white">
              <div className="promise-icon">🧈</div>
              <h3>Pure European Butter</h3>
              <p>Every single croissant and Danish is laminated by hand with 84% fat churned butter, ensuring hundreds of paper-thin crispy layers.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Special Orders CTA */}
      <section className="section cta-section text-center">
        <div className="container container-narrow">
          <span className="eyebrow-dark">Custom Bakes & Catering</span>
          <h2>Planning a Birthday, Wedding, or Corporate Event?</h2>
          <p>
            We prepare custom multi-tiered cakes, dessert tables, and bulk breakfast boxes for events across Lahore. Place custom requests 48 hours in advance.
          </p>
          <div className="cta-buttons">
            <Link to="/order" className="btn btn-primary">
              Order Standard Pickup
            </Link>
            <a href="tel:+923001234567" className="btn btn-secondary">
              Call Bakery Manager
            </a>
          </div>
        </div>
      </section>

      {/* Item Detail Modal */}
      {activeModalItem && (
        <Modal
          isOpen={Boolean(activeModalItem)}
          onClose={() => {
            setActiveModalItem(null)
            setModalQuantity(1)
          }}
          title={activeModalItem.name}
          size="lg"
        >
          <div className="item-modal-content">
            <div className="item-modal-grid">
              <div className="item-modal-media">
                <img src={activeModalItem.image_url} alt={activeModalItem.name} />
              </div>
              <div className="item-modal-details">
                <div className="item-modal-badges">
                  <Badge variant="secondary">{activeModalItem.category}</Badge>
                  {activeModalItem.is_available ? (
                    <Badge variant="success">Available Today</Badge>
                  ) : (
                    <Badge variant="danger">Sold Out</Badge>
                  )}
                </div>
                <h3 className="item-modal-price">PKR {activeModalItem.price_pkr.toLocaleString()}</h3>
                <p className="item-modal-desc">{activeModalItem.description}</p>

                <div className="quantity-picker">
                  <label>Select Quantity:</label>
                  <div className="quantity-controls">
                    <button
                      type="button"
                      className="btn-qty"
                      disabled={modalQuantity <= 1}
                      onClick={() => setModalQuantity((q) => Math.max(1, q - 1))}
                    >
                      -
                    </button>
                    <span className="qty-value">{modalQuantity}</span>
                    <button
                      type="button"
                      className="btn-qty"
                      onClick={() => setModalQuantity((q) => q + 1)}
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="modal-subtotal">
                  <span>Subtotal:</span>
                  <strong>PKR {(activeModalItem.price_pkr * modalQuantity).toLocaleString()}</strong>
                </div>
              </div>
            </div>
          </div>
          <Modal.Footer>
            <Button
              variant="ghost"
              onClick={() => {
                setActiveModalItem(null)
                setModalQuantity(1)
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              disabled={!activeModalItem.is_available}
              onClick={() => {
                addToCart(activeModalItem, modalQuantity)
                setActiveModalItem(null)
                setModalQuantity(1)
              }}
            >
              Add to Basket
            </Button>
          </Modal.Footer>
        </Modal>
      )}
    </div>
  )
}