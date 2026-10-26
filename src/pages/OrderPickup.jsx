import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Button, Card, Input, Textarea, Badge, Alert, Spinner, toast, PageHeader } from '../components/ui'

const TIME_SLOTS = [
  "09:00 AM - 10:00 AM",
  "10:00 AM - 11:00 AM",
  "11:00 AM - 12:00 PM",
  "12:00 PM - 01:00 PM",
  "02:00 PM - 03:00 PM",
  "03:00 PM - 04:00 PM",
  "04:00 PM - 05:00 PM",
  "05:00 PM - 06:00 PM",
  "06:00 PM - 07:00 PM",
  "07:00 PM - 08:00 PM"
]

const LAHORE_BRANCHES = [
  "Gulberg III Branch (Main Boulevard, near MM Alam)",
  "DHA Phase 5 Branch (CCA Commercial)",
  "Johar Town Branch (Emporium Expressway)"
]

export default function OrderPickup() {
  const navigate = useNavigate()
  const location = useLocation()

  // Cart state initialized from location state if passed, or default empty
  const [cart, setCart] = useState(() => {
    if (location.state && location.state.cartItem) {
      return [{ ...location.state.cartItem, quantity: 1 }]
    }
    return []
  })

  // Available menu items to add extra items directly on this page
  const [menuItems, setMenuItems] = useState([])
  const [loadingMenu, setLoadingMenu] = useState(true)
  const [menuError, setMenuError] = useState(null)

  // Form input state
  const [customerName, setCustomerName] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [pickupDate, setPickupDate] = useState(() => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    return tomorrow.toISOString().split('T')[0]
  })
  const [pickupTimeSlot, setPickupTimeSlot] = useState(TIME_SLOTS[1])
  const [branch, setBranch] = useState(LAHORE_BRANCHES[0])
  const [specialNotes, setSpecialNotes] = useState('')

  // Form submission state
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)
  const [completedOrder, setCompletedOrder] = useState(null)

  // Fetch menu items for quick-add list
  useEffect(() => {
    async function fetchMenuItems() {
      try {
        setLoadingMenu(true)
        const { data, error } = await supabase
          .from('menu_items')
          .select('*')
          .eq('is_available', true)
          .order('category', { ascending: true })

        if (error) throw error
        setMenuItems(data || [])
      } catch (err) {
        setMenuError(err.message || 'Failed to load menu items for quick selection')
      } finally {
        setLoadingMenu(false)
      }
    }
    fetchMenuItems()
  }, [])

  // Cart manipulation handlers
  const updateQuantity = (id, delta) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const newQty = item.quantity + delta
            return newQty > 0 ? { ...item, quantity: newQty } : null
          }
          return item
        })
        .filter(Boolean)
    )
  }

  const removeFromCart = (id) => {
    setCart((prev) => prev.filter((item) => item.id !== id))
    toast.info('Item removed from order')
  }

  const addToCartFromQuickList = (item) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id)
      if (existing) {
        toast.success(`Increased ${item.name} quantity`)
        return prev.map((i) => (i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i))
      }
      toast.success(`Added ${item.name} to order`)
      return [...prev, { id: item.id, name: item.name, price_pkr: item.price_pkr, quantity: 1, image_url: item.image_url }]
    })
  }

  const calculateSubtotal = () => cart.reduce((sum, item) => sum + item.price_pkr * item.quantity, 0)
  const subtotal = calculateSubtotal()
  const tax = Math.round(subtotal * 0.05) // 5% provincial sales tax
  const grandTotal = subtotal + tax

  // Submit order handler
  const handleSubmitOrder = async (e) => {
    e.preventDefault()
    setSubmitError(null)

    if (cart.length === 0) {
      setSubmitError('Your cart is empty. Please select at least one delicious bakery item before submitting.')
      return
    }

    if (!customerName.trim()) {
      setSubmitError('Please enter your full name.')
      return
    }

    if (!phoneNumber.trim() || phoneNumber.length < 10) {
      setSubmitError('Please enter a valid Pakistani contact phone number (e.g. 0300 1234567).')
      return
    }

    try {
      setIsSubmitting(true)

      // Combine date, slot, branch and notes into ISO timestamp + formatted detail
      const fullPickupString = `${pickupDate} ${pickupTimeSlot}`
      const pickupTimeISO = new Date(fullPickupString.split(' - ')[0]).toISOString()
      
      const payloadItems = cart.map((i) => ({
        id: i.id,
        name: i.name,
        price_pkr: i.price_pkr,
        quantity: i.quantity,
        total: i.price_pkr * i.quantity
      }))

      const noteDetails = `Branch: ${branch} | Slot: ${pickupTimeSlot}${specialNotes ? ` | Note: ${specialNotes}` : ''}`

      const { data, error } = await supabase
        .from('pickup_orders')
        .insert([
          {
            customer_name: customerName.trim(),
            phone_number: phoneNumber.trim(),
            pickup_time: pickupTimeISO,
            order_items: payloadItems,
            total_price_pkr: grandTotal,
            status: 'pending',
            special_notes: noteDetails
          }
        ])
        .select()
        .single()

      if (error) throw error

      setCompletedOrder(data)
      setCart([])
      toast.success('Your pickup order has been placed successfully!')
    } catch (err) {
      setSubmitError(err.message || 'An error occurred while placing your order. Please try again.')
      toast.error('Could not submit pickup order')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="order-pickup-page">
      {/* Compact Page Hero */}
      <section className="section hero-compact" style={{ paddingBottom: '2rem' }}>
        <div className="container">
          <PageHeader
            title="Order Fresh Bakery Pickup"
            subtitle="Select your freshly baked treats, pick your nearest Lahore bakery counter, and schedule a convenient pickup time."
          >
            <div className="hero-actions" style={{ marginTop: '1rem' }}>
              <Link to="/menu" className="btn btn-secondary btn-sm">
                ← Browse Full Menu
              </Link>
            </div>
          </PageHeader>
        </div>
      </section>

      {/* SECTION 1: Order Confirmation Modal / View */}
      {completedOrder ? (
        <section className="section order-success-section">
          <div className="container container-narrow">
            <Card padding="lg" className="order-success-card animate-in">
              <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <span style={{ fontSize: '3.5rem', display: 'block', marginBottom: '0.5rem' }}>🎉</span>
                <Badge variant="success" style={{ fontSize: '1rem', padding: '0.4rem 1rem' }}>
                  Order Confirmed #{completedOrder.id.slice(0, 8).toUpperCase()}
                </Badge>
                <h2 style={{ marginTop: '1rem' }}>We are preparing your artisanal bake!</h2>
                <p className="text-muted">
                  Thank you, <strong>{completedOrder.customer_name}</strong>. Your order has been dispatched to our main oven line.
                </p>
              </div>

              <div className="order-summary-box" style={{ background: 'var(--surface)', padding: '1.5rem', borderRadius: 'var(--radius)', marginBottom: '1.5rem' }}>
                <h3 style={{ marginTop: 0, fontSize: '1.1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
                  Pickup Details
                </h3>
                <p style={{ margin: '0.5rem 0' }}>
                  <strong>Phone:</strong> {completedOrder.phone_number}
                </p>
                <p style={{ margin: '0.5rem 0' }}>
                  <strong>Pickup Schedule & Notes:</strong> {completedOrder.special_notes}
                </p>
                <p style={{ margin: '0.5rem 0' }}>
                  <strong>Total Amount Due at Counter:</strong>{' '}
                  <span style={{ color: 'var(--primary)', fontWeight: 700, fontSize: '1.2rem' }}>
                    Rs. {completedOrder.total_price_pkr.toLocaleString()}
                  </span>
                </p>
              </div>

              <div className="order-items-breakdown" style={{ marginBottom: '2rem' }}>
                <h4 style={{ marginBottom: '0.75rem' }}>Ordered Items</h4>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {Array.isArray(completedOrder.order_items) &&
                    completedOrder.order_items.map((item, idx) => (
                      <li key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px dashed var(--border)' }}>
                        <span>
                          {item.quantity}x {item.name}
                        </span>
                        <strong>Rs. {(item.price_pkr * item.quantity).toLocaleString()}</strong>
                      </li>
                    ))}
                </ul>
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                <Button variant="primary" onClick={() => setCompletedOrder(null)}>
                  Place Another Pickup Order
                </Button>
                <Link to="/staff" className="btn btn-secondary">
                  View Staff Live Queue
                </Link>
              </div>
            </Card>
          </div>
        </section>
      ) : (
        /* SECTION 2: Interactive Checkout & Cart Form */
        <section className="section checkout-section">
          <div className="container">
            {submitError && (
              <Alert variant="error" title="Unable to Submit Order" style={{ marginBottom: '2rem' }}>
                {submitError}
              </Alert>
            )}

            <div className="grid-2" style={{ gridTemplateColumns: '1.2fr 0.8fr', gap: '2.5rem', alignItems: 'start' }}>
              {/* Left Column: Pickup Form & Details */}
              <div className="checkout-form-container">
                <Card padding="lg">
                  <h2 style={{ marginTop: 0, marginBottom: '1.5rem', fontSize: '1.5rem' }}>
                    1. Customer & Pickup Information
                  </h2>
                  <form onSubmit={handleSubmitOrder}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                      <Input
                        label="Full Name *"
                        placeholder="e.g. Shahbaz Ahmed"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        required
                      />

                      <Input
                        label="Phone Number (for Pickup SMS / WhatsApp) *"
                        placeholder="e.g. 0300 1234567"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        required
                      />

                      <div className="form-group">
                        <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                          Select Lahore Bakery Branch *
                        </label>
                        <select
                          className="form-control"
                          value={branch}
                          onChange={(e) => setBranch(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '0.75rem',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid var(--border)',
                            background: 'var(--surface)',
                            fontSize: '1rem'
                          }}
                        >
                          {LAHORE_BRANCHES.map((b) => (
                            <option key={b} value={b}>
                              {b}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="grid-2" style={{ gap: '1rem' }}>
                        <Input
                          label="Pickup Date *"
                          type="date"
                          value={pickupDate}
                          onChange={(e) => setPickupDate(e.target.value)}
                          required
                        />

                        <div className="form-group">
                          <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                            Preferred Time Slot *
                          </label>
                          <select
                            className="form-control"
                            value={pickupTimeSlot}
                            onChange={(e) => setPickupTimeSlot(e.target.value)}
                            style={{
                              width: '100%',
                              padding: '0.75rem',
                              borderRadius: 'var(--radius-sm)',
                              border: '1px solid var(--border)',
                              background: 'var(--surface)',
                              fontSize: '1rem'
                            }}
                          >
                            {TIME_SLOTS.map((slot) => (
                              <option key={slot} value={slot}>
                                {slot}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <Textarea
                        label="Special Instructions / Cake Inscriptions"
                        placeholder="e.g. Please write 'Happy Birthday Ayesha' in dark chocolate or slice the sourdough loaf."
                        rows={3}
                        value={specialNotes}
                        onChange={(e) => setSpecialNotes(e.target.value)}
                      />

                      <div style={{ marginTop: '1rem' }}>
                        <Button
                          type="submit"
                          variant="primary"
                          disabled={isSubmitting || cart.length === 0}
                          loading={isSubmitting}
                          style={{ width: '100%', padding: '1rem', fontSize: '1.1rem' }}
                        >
                          {isSubmitting ? 'Confirming Order...' : `Confirm Pickup Order (Rs. ${grandTotal.toLocaleString()})`}
                        </Button>
                        <p className="text-muted" style={{ textAlign: 'center', fontSize: '0.85rem', marginTop: '0.75rem' }}>
                          💵 Payment will be collected in cash or card when you collect your warm treats at the counter.
                        </p>
                      </div>
                    </div>
                  </form>
                </Card>
              </div>

              {/* Right Column: Interactive Cart Review */}
              <div className="cart-summary-container">
                <Card padding="lg">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                    <h2 style={{ margin: 0, fontSize: '1.5rem' }}>2. Selected Items</h2>
                    <Badge variant="primary">{cart.reduce((a, b) => a + b.quantity, 0)} Items</Badge>
                  </div>

                  {cart.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '2rem 1rem', background: 'var(--surface)', borderRadius: 'var(--radius)' }}>
                      <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '0.5rem' }}>🛒</span>
                      <p style={{ fontWeight: 600, margin: '0 0 0.5rem 0' }}>Your order basket is currently empty</p>
                      <p className="text-muted" style={{ fontSize: '0.9rem', marginBottom: '1.25rem' }}>
                        Add items from our quick selection below or browse the full fresh bakery catalog.
                      </p>
                      <Link to="/menu" className="btn btn-secondary btn-sm">
                        Go to Full Menu
                      </Link>
                    </div>
                  ) : (
                    <div className="cart-items-list" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {cart.map((item) => (
                        <div
                          key={item.id}
                          style={{
                            display: 'flex',
                            gap: '1rem',
                            alignItems: 'center',
                            paddingBottom: '1rem',
                            borderBottom: '1px solid var(--border)'
                          }}
                        >
                          {item.image_url && (
                            <img
                              src={item.image_url}
                              alt={item.name}
                              style={{ width: '56px', height: '56px', borderRadius: 'var(--radius-sm)', objectFit: 'cover' }}
                            />
                          )}
                          <div style={{ flex: 1 }}>
                            <h4 style={{ margin: 0, fontSize: '1rem' }}>{item.name}</h4>
                            <span className="text-muted" style={{ fontSize: '0.85rem' }}>
                              Rs. {item.price_pkr.toLocaleString()} each
                            </span>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.id, -1)}
                              style={{
                                width: '28px',
                                height: '28px',
                                border: '1px solid var(--border)',
                                borderRadius: '4px',
                                background: 'var(--bg)',
                                cursor: 'pointer',
                                fontWeight: 'bold'
                              }}
                            >
                              -
                            </button>
                            <span style={{ fontWeight: 600, minWidth: '20px', textAlign: 'center' }}>
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.id, 1)}
                              style={{
                                width: '28px',
                                height: '28px',
                                border: '1px solid var(--border)',
                                borderRadius: '4px',
                                background: 'var(--bg)',
                                cursor: 'pointer',
                                fontWeight: 'bold'
                              }}
                            >
                              +
                            </button>
                          </div>

                          <div style={{ textAlign: 'right', minWidth: '70px' }}>
                            <div style={{ fontWeight: 700 }}>
                              Rs. {(item.price_pkr * item.quantity).toLocaleString()}
                            </div>
                            <button
                              type="button"
                              onClick={() => removeFromCart(item.id)}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: '#d90429',
                                fontSize: '0.75rem',
                                cursor: 'pointer',
                                padding: 0,
                                textDecoration: 'underline'
                              }}
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ))}

                      {/* Financial Breakdown */}
                      <div className="cart-totals" style={{ marginTop: '0.5rem', background: 'var(--surface)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.95rem' }}>
                          <span>Subtotal</span>
                          <span>Rs. {subtotal.toLocaleString()}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--muted)' }}>
                          <span>PRA Provincial Tax (5%)</span>
                          <span>Rs. {tax.toLocaleString()}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: '0.5rem', fontWeight: 700, fontSize: '1.2rem', color: 'var(--text)' }}>
                          <span>Grand Total</span>
                          <span style={{ color: 'var(--primary)' }}>Rs. {grandTotal.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </Card>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* SECTION 3: Add Fresh Add-ons / Menu Direct Selection */}
      <section className="section quick-add-section" style={{ background: 'var(--surface)' }}>
        <div className="container">
          <div className="section-head" style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <span className="eyebrow">Fresh Batch Add-ons</span>
            <h2>Add Popular Bakery Items to Your Order</h2>
            <p className="text-muted">
              Explore our freshly baked breads, signature flaky croissants, and indulgent pastries straight from today's oven.
            </p>
          </div>

          {loadingMenu ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
              <Spinner size="lg" />
            </div>
          ) : menuError ? (
            <Alert variant="error" title="Could not load menu add-ons">
              {menuError}
            </Alert>
          ) : menuItems.length === 0 ? (
            <p className="text-muted" style={{ textAlign: 'center' }}>No available menu items found.</p>
          ) : (
            <div className="grid-3" style={{ gap: '1.5rem' }}>
              {menuItems.slice(0, 6).map((item) => (
                <Card key={item.id} padding="md" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', height: '160px' }}>
                      <img
                        src={item.image_url || 'https://picsum.photos/seed/bakery/400/300'}
                        alt={item.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                      <span
                        style={{
                          position: 'absolute',
                          top: '8px',
                          right: '8px',
                          background: 'rgba(0,0,0,0.7)',
                          color: '#fff',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '0.75rem',
                          textTransform: 'uppercase',
                          fontWeight: 600
                        }}
                      >
                        {item.category}
                      </span>
                    </div>

                    <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1.15rem' }}>{item.name}</h3>
                    <p className="text-muted" style={{ fontSize: '0.875rem', lineHeight: '1.4', marginBottom: '1rem', minHeight: '2.5rem' }}>
                      {item.description}
                    </p>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.75rem', borderTop: '1px solid var(--border)' }}>
                    <span style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--primary)' }}>
                      Rs. {item.price_pkr.toLocaleString()}
                    </span>
                    <Button variant="secondary" onClick={() => addToCartFromQuickList(item)}>
                      + Add to Order
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* SECTION 4: Pickup Policy & Bakery Instructions */}
      <section className="section pickup-info-section">
        <div className="container">
          <div className="grid-3" style={{ gap: '2rem' }}>
            <Card padding="md">
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⏱️</div>
              <h3>Freshness Window</h3>
              <p className="text-muted" style={{ fontSize: '0.9rem' }}>
                We bake in small artisanal batches throughout the morning. Your scheduled time guarantees warm bread and soft flaky crusts.
              </p>
            </Card>

            <Card padding="md">
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📍</div>
              <h3>Express Counter Pickup</h3>
              <p className="text-muted" style={{ fontSize: '0.9rem' }}>
                Skip the regular store line! Just show your order confirmation name or mobile number at our dedicated express pickup shelf.
              </p>
            </Card>

            <Card padding="md">
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🍰</div>
              <h3>Custom Decor & Catering</h3>
              <p className="text-muted" style={{ fontSize: '0.9rem' }}>
                Need customized birthday cakes or catering packages for over 20 guests? Please mention special notes or call our Gulberg head baker directly.
              </p>
            </Card>
          </div>
        </div>
      </section>
    </div>
  )
}