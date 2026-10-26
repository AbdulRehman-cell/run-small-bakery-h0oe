import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { PageHeader, Card, Button, Badge, Table, Modal, Input, Select, Textarea, Stat, Spinner, Alert, toast } from '../components/ui'

export default function StaffOrders() {
  const [orders, setOrders] = useState([])
  const [menuItems, setMenuItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Tab/Filter state: 'all' | 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled'
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')

  // Order Details Modal
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)

  // Status Updating state
  const [updatingId, setUpdatingId] = useState(null)

  // Menu Item Management state (Tab: 'orders' | 'menu')
  const [activeTab, setActiveTab] = useState('orders')
  
  // Menu Item Modal state (Create / Edit)
  const [isMenuModalOpen, setIsMenuModalOpen] = useState(false)
  const [editingMenuItem, setEditingMenuItem] = useState(null)
  const [savingMenu, setSavingMenu] = useState(false)
  
  // Menu Form fields
  const [menuForm, setMenuForm] = useState({
    name: '',
    category: 'Bread',
    description: '',
    price_pkr: '',
    image_url: '',
    is_available: true,
    is_featured: false
  })

  // Fetch orders and menu items
  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [ordersRes, menuRes] = await Promise.all([
        supabase.from('pickup_orders').select('*').order('created_at', { ascending: false }),
        supabase.from('menu_items').select('*').order('category', { ascending: true })
      ])

      if (ordersRes.error) throw ordersRes.error
      if (menuRes.error) throw menuRes.error

      setOrders(ordersRes.data || [])
      setMenuItems(menuRes.data || [])
    } catch (err) {
      console.error('Error fetching staff data:', err)
      setError(err.message || 'Failed to load dashboard data. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()

    // Realtime subscription for pickup orders
    const channel = supabase
      .channel('staff_orders_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pickup_orders' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            toast.info(`New pickup order received from ${payload.new.customer_name}!`)
            setOrders((prev) => [payload.new, ...prev])
          } else if (payload.eventType === 'UPDATE') {
            setOrders((prev) => prev.map((item) => (item.id === payload.new.id ? payload.new : item)))
          } else if (payload.eventType === 'DELETE') {
            setOrders((prev) => prev.filter((item) => item.id !== payload.old.id))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  // Order Status update handler
  const handleUpdateStatus = async (orderId, newStatus) => {
    setUpdatingId(orderId)
    try {
      const { error: updateErr } = await supabase
        .from('pickup_orders')
        .update({ status: newStatus })
        .eq('id', orderId)

      if (updateErr) throw updateErr

      setOrders((prev) =>
        prev.map((ord) => (ord.id === orderId ? { ...ord, status: newStatus } : ord))
      )
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder((prev) => ({ ...prev, status: newStatus }))
      }
      toast.success(`Order status updated to ${newStatus}`)
    } catch (err) {
      toast.error(`Failed to update status: ${err.message}`)
    } finally {
      setUpdatingId(null)
    }
  }

  // Delete Order
  const handleDeleteOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to delete this order record permanently?')) return

    try {
      const { error: delErr } = await supabase
        .from('pickup_orders')
        .delete()
        .eq('id', orderId)

      if (delErr) throw delErr

      setOrders((prev) => prev.filter((ord) => ord.id !== orderId))
      setIsDetailModalOpen(false)
      toast.success('Order deleted successfully.')
    } catch (err) {
      toast.error(`Delete failed: ${err.message}`)
    }
  }

  // Menu Item Modal open handler
  const handleOpenMenuModal = (item = null) => {
    if (item) {
      setEditingMenuItem(item)
      setMenuForm({
        name: item.name || '',
        category: item.category || 'Bread',
        description: item.description || '',
        price_pkr: item.price_pkr ? String(item.price_pkr) : '',
        image_url: item.image_url || '',
        is_available: item.is_available ?? true,
        is_featured: item.is_featured ?? false
      })
    } else {
      setEditingMenuItem(null)
      setMenuForm({
        name: '',
        category: 'Bread',
        description: '',
        price_pkr: '',
        image_url: 'https://picsum.photos/seed/bakery' + Math.floor(Math.random() * 100) + '/600/400',
        is_available: true,
        is_featured: false
      })
    }
    setIsMenuModalOpen(true)
  }

  // Menu Item Submit handler
  const handleSaveMenuItem = async (e) => {
    e.preventDefault()
    if (!menuForm.name || !menuForm.category || !menuForm.description || !menuForm.price_pkr || !menuForm.image_url) {
      toast.error('Please fill in all required fields.')
      return
    }

    setSavingMenu(true)
    const payload = {
      name: menuForm.name.trim(),
      category: menuForm.category,
      description: menuForm.description.trim(),
      price_pkr: parseInt(menuForm.price_pkr, 10),
      image_url: menuForm.image_url.trim(),
      is_available: menuForm.is_available,
      is_featured: menuForm.is_featured
    }

    try {
      if (editingMenuItem) {
        const { error: updateErr, data } = await supabase
          .from('menu_items')
          .update(payload)
          .eq('id', editingMenuItem.id)
          .select()
          .single()

        if (updateErr) throw updateErr

        setMenuItems((prev) => prev.map((item) => (item.id === editingMenuItem.id ? data : item)))
        toast.success('Menu item updated successfully!')
      } else {
        const { error: insertErr, data } = await supabase
          .from('menu_items')
          .insert([payload])
          .select()
          .single()

        if (insertErr) throw insertErr

        setMenuItems((prev) => [data, ...prev])
        toast.success('New menu item created successfully!')
      }

      setIsMenuModalOpen(false)
    } catch (err) {
      toast.error(`Error saving item: ${err.message}`)
    } finally {
      setSavingMenu(false)
    }
  }

  // Delete Menu Item
  const handleDeleteMenuItem = async (itemId) => {
    if (!window.confirm('Are you sure you want to remove this item from the bakery menu?')) return

    try {
      const { error: delErr } = await supabase
        .from('menu_items')
        .delete()
        .eq('id', itemId)

      if (delErr) throw delErr

      setMenuItems((prev) => prev.filter((item) => item.id !== itemId))
      toast.success('Menu item removed.')
    } catch (err) {
      toast.error(`Delete failed: ${err.message}`)
    }
  }

  // Toggle availability fast
  const handleToggleAvailability = async (item) => {
    try {
      const { error: updateErr } = await supabase
        .from('menu_items')
        .update({ is_available: !item.is_available })
        .eq('id', item.id)

      if (updateErr) throw updateErr

      setMenuItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, is_available: !i.is_available } : i))
      )
      toast.info(`${item.name} availability toggled to ${!item.is_available ? 'In Stock' : 'Out of Stock'}`)
    } catch (err) {
      toast.error(`Failed to update availability: ${err.message}`)
    }
  }

  // Stats Calculations
  const pendingCount = orders.filter((o) => o.status === 'pending' || o.status === 'preparing').length
  const readyCount = orders.filter((o) => o.status === 'ready').length
  const completedTodayCount = orders.filter((o) => o.status === 'completed').length
  const totalRevenuePKR = orders
    .filter((o) => o.status === 'completed')
    .reduce((sum, o) => sum + (o.total_price_pkr || 0), 0)

  // Filtered orders list
  const filteredOrders = orders.filter((ord) => {
    const matchesFilter = statusFilter === 'all' ? true : ord.status === statusFilter
    const matchesSearch =
      ord.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ord.phone_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (ord.id && ord.id.toLowerCase().includes(searchTerm.toLowerCase()))
    return matchesFilter && matchesSearch
  })

  // Helper badge color
  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <Badge variant="warning">Pending</Badge>
      case 'preparing':
        return <Badge variant="info">Preparing</Badge>
      case 'ready':
        return <Badge variant="success">Ready for Pickup</Badge>
      case 'completed':
        return <Badge variant="secondary">Completed</Badge>
      case 'cancelled':
        return <Badge variant="danger">Cancelled</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  // Helper date/time formatter
  const formatTime = (isoString) => {
    if (!isoString) return 'N/A'
    try {
      const date = new Date(isoString)
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }) + ' (' + date.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ')'
    } catch (e) {
      return isoString
    }
  }

  return (
    <div className="staff-dashboard-page">
      {/* SECTION 1: Page Header & Realtime Pulse Bar */}
      <section className="section dashboard-header-section">
        <div className="container">
          <div className="dashboard-top-row">
            <div>
              <span className="eyebrow">Bakery Control Panel</span>
              <h1 className="dashboard-title">Golden Crust Staff Portal</h1>
              <p className="dashboard-subtitle">
                Manage incoming orders in real-time, update baking status, and control active menu offerings.
              </p>
            </div>
            <div className="dashboard-top-actions">
              <Button
                variant={activeTab === 'orders' ? 'primary' : 'secondary'}
                onClick={() => setActiveTab('orders')}
              >
                📦 Orders Workflow
              </Button>
              <Button
                variant={activeTab === 'menu' ? 'primary' : 'secondary'}
                onClick={() => setActiveTab('menu')}
              >
                🥖 Menu Items Management
              </Button>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="stats-grid">
            <Stat
              label="Active & Preparing"
              value={pendingCount}
              change={pendingCount > 0 ? "Requires Attention" : "All Caught Up"}
            />
            <Stat
              label="Ready for Pickup"
              value={readyCount}
              change="Awaiting Customer"
            />
            <Stat
              label="Completed Orders"
              value={completedTodayCount}
              change="Fulfilled"
            />
            <Stat
              label="Total Revenue"
              value={`Rs. ${totalRevenuePKR.toLocaleString()}`}
              change="Completed Pickups"
            />
          </div>
        </div>
      </section>

      {/* SECTION 2: Main Dashboard Content (Orders or Menu) */}
      <section className="section dashboard-main-section">
        <div className="container">
          {error && (
            <Alert variant="error" title="Database Error">
              {error}
              <div style={{ marginTop: '8px' }}>
                <Button variant="secondary" onClick={fetchData}>
                  Retry Sync
                </Button>
              </div>
            </Alert>
          )}

          {/* TAB 1: ORDERS WORKFLOW */}
          {activeTab === 'orders' && (
            <div className="orders-workflow-block">
              {/* Order Controls & Search */}
              <div className="filter-bar-card">
                <div className="filter-controls">
                  <div className="search-box-wrapper">
                    <Input
                      placeholder="Search by customer name or phone..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <div className="filter-chips">
                    {['all', 'pending', 'preparing', 'ready', 'completed', 'cancelled'].map((st) => (
                      <button
                        key={st}
                        className={`chip-btn ${statusFilter === st ? 'active' : ''}`}
                        onClick={() => setStatusFilter(st)}
                      >
                        {st.charAt(0).toUpperCase() + st.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Loading State */}
              {loading ? (
                <div className="dashboard-loading-box">
                  <Spinner size="lg" />
                  <p>Synchronizing live orders with oven desk...</p>
                </div>
              ) : filteredOrders.length === 0 ? (
                <div className="empty-state-wrapper">
                  <p className="empty-title">No orders found matching your filter</p>
                  <p className="empty-sub">
                    {searchTerm ? "Try adjusting your search terms." : "New online orders will appear here automatically."}
                  </p>
                  <Button variant="secondary" onClick={() => { setSearchTerm(''); setStatusFilter('all') }}>
                    Reset Filters
                  </Button>
                </div>
              ) : (
                <div className="orders-grid">
                  {filteredOrders.map((order) => {
                    const itemsList = Array.isArray(order.order_items) ? order.order_items : []
                    const isUpdating = updatingId === order.id

                    return (
                      <Card key={order.id} className={`order-card status-${order.status}`}>
                        <div className="order-card-header">
                          <div>
                            <span className="order-id-label"># {order.id ? order.id.slice(0, 8) : 'ORD'}</span>
                            <h3 className="customer-name">{order.customer_name}</h3>
                          </div>
                          {getStatusBadge(order.status)}
                        </div>

                        <div className="order-details-meta">
                          <p className="meta-item">
                            <strong>📞 Phone:</strong> <a href={`tel:${order.phone_number}`}>{order.phone_number}</a>
                          </p>
                          <p className="meta-item">
                            <strong>⏰ Target Pickup:</strong> {formatTime(order.pickup_time)}
                          </p>
                        </div>

                        <div className="order-items-preview">
                          <p className="preview-heading">Order Summary ({itemsList.length} items):</p>
                          <ul className="order-items-list">
                            {itemsList.map((item, idx) => (
                              <li key={idx} className="item-row">
                                <span className="item-qty">{item.quantity}x</span>
                                <span className="item-name">{item.name}</span>
                                <span className="item-price">Rs. {item.price_pkr * item.quantity}</span>
                              </li>
                            ))}
                          </ul>
                          {order.special_notes && (
                            <div className="special-notes-box">
                              <strong>Note:</strong> "{order.special_notes}"
                            </div>
                          )}
                        </div>

                        <div className="order-card-footer">
                          <div className="order-total-price">
                            <span>Total Due:</span>
                            <span className="amount">Rs. {order.total_price_pkr ? order.total_price_pkr.toLocaleString() : 0}</span>
                          </div>

                          <div className="order-actions">
                            {order.status === 'pending' && (
                              <Button
                                variant="primary"
                                loading={isUpdating}
                                onClick={() => handleUpdateStatus(order.id, 'preparing')}
                              >
                                Start Baking
                              </Button>
                            )}

                            {order.status === 'preparing' && (
                              <Button
                                variant="primary"
                                loading={isUpdating}
                                onClick={() => handleUpdateStatus(order.id, 'ready')}
                              >
                                Mark Ready
                              </Button>
                            )}

                            {order.status === 'ready' && (
                              <Button
                                variant="secondary"
                                loading={isUpdating}
                                onClick={() => handleUpdateStatus(order.id, 'completed')}
                              >
                                Complete Pickup
                              </Button>
                            )}

                            <Button
                              variant="ghost"
                              onClick={() => {
                                setSelectedOrder(order)
                                setIsDetailModalOpen(true)
                              }}
                            >
                              Details
                            </Button>
                          </div>
                        </div>
                      </Card>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: MENU ITEMS MANAGEMENT */}
          {activeTab === 'menu' && (
            <div className="menu-management-block">
              <div className="menu-mgmt-header">
                <div>
                  <h2>Bakery Offerings Catalog</h2>
                  <p>Add new pastries, edit PKR pricing, toggle item availability, or feature daily specials.</p>
                </div>
                <Button variant="primary" onClick={() => handleOpenMenuModal()}>
                  + Add New Menu Item
                </Button>
              </div>

              {loading ? (
                <div className="dashboard-loading-box">
                  <Spinner size="lg" />
                  <p>Fetching Golden Crust menu items...</p>
                </div>
              ) : menuItems.length === 0 ? (
                <div className="empty-state-wrapper">
                  <p className="empty-title">No menu items standard in database</p>
                  <Button variant="primary" onClick={() => handleOpenMenuModal()}>
                    Create First Item
                  </Button>
                </div>
              ) : (
                <div className="menu-table-wrapper">
                  <Table>
                    <Table.Head>
                      <Table.Row>
                        <Table.Th>Item</Table.Th>
                        <Table.Th>Category</Table.Th>
                        <Table.Th>Price (PKR)</Table.Th>
                        <Table.Th>Status</Table.Th>
                        <Table.Th>Featured</Table.Th>
                        <Table.Th>Actions</Table.Th>
                      </Table.Row>
                    </Table.Head>
                    <Table.Body>
                      {menuItems.map((item) => (
                        <Table.Row key={item.id}>
                          <Table.Td>
                            <div className="table-item-cell">
                              <img
                                src={item.image_url}
                                alt={item.name}
                                className="table-item-img"
                                onError={(e) => { e.target.src = 'https://picsum.photos/seed/bakery/100/100' }}
                              />
                              <div>
                                <strong className="table-item-title">{item.name}</strong>
                                <p className="table-item-desc">{item.description}</p>
                              </div>
                            </div>
                          </Table.Td>
                          <Table.Td>
                            <Badge variant="secondary">{item.category}</Badge>
                          </Table.Td>
                          <Table.Td>
                            <strong>Rs. {item.price_pkr}</strong>
                          </Table.Td>
                          <Table.Td>
                            <button
                              className={`status-toggle-btn ${item.is_available ? 'available' : 'unavailable'}`}
                              onClick={() => handleToggleAvailability(item)}
                            >
                              {item.is_available ? 'In Stock' : 'Out of Stock'}
                            </button>
                          </Table.Td>
                          <Table.Td>
                            {item.is_featured ? (
                              <Badge variant="warning">⭐ Featured</Badge>
                            ) : (
                              <span style={{ color: 'var(--muted)' }}>Standard</span>
                            )}
                          </Table.Td>
                          <Table.Td>
                            <div className="table-actions-cell">
                              <Button variant="ghost" onClick={() => handleOpenMenuModal(item)}>
                                Edit
                              </Button>
                              <Button variant="danger" onClick={() => handleDeleteMenuItem(item.id)}>
                                Delete
                              </Button>
                            </div>
                          </Table.Td>
                        </Table.Row>
                      ))}
                    </Table.Body>
                  </Table>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* SECTION 3: STAFF INSTRUCTIONS & OPERATIONAL GUIDELINES */}
      <section className="section dashboard-guidelines-section">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Standard Operating Procedure</span>
            <h2>Bakery Fulfillment Workflow</h2>
            <p>Follow these steps to ensure peak freshness and accurate pickup handoffs for our Lahore customers.</p>
          </div>

          <div className="grid-3 workflow-steps-grid">
            <Card className="sop-card">
              <div className="card-icon">1</div>
              <h3>Order Receipt & Queueing</h3>
              <p>
                Incoming web orders auto-sync in real time. Inspect customer pickup requested time and special notes immediately upon chime.
              </p>
            </Card>

            <Card className="sop-card">
              <div className="card-icon">2</div>
              <h3>Prep & Oven Assembly</h3>
              <p>
                Click <strong>"Start Baking"</strong> to shift status to <em>Preparing</em>. Gather fresh croissants, warm sourdough, or box pastries.
              </p>
            </Card>

            <Card className="sop-card">
              <div className="card-icon">3</div>
              <h3>Ready & Cashier Pickup</h3>
              <p>
                Click <strong>"Mark Ready"</strong> when packed in Golden Crust eco bags. Verify customer phone number at pickup counter before completing.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* MODAL 1: ORDER DETAILS OVERLAY */}
      {selectedOrder && (
        <Modal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          title={`Order #${selectedOrder.id ? selectedOrder.id.slice(0, 8) : ''} - Detailed View`}
          size="lg"
        >
          <div className="order-modal-content">
            <div className="modal-status-bar">
              <span>Current Status:</span>
              {getStatusBadge(selectedOrder.status)}
            </div>

            <div className="modal-customer-info">
              <h4>Customer Information</h4>
              <p><strong>Name:</strong> {selectedOrder.customer_name}</p>
              <p><strong>Phone:</strong> {selectedOrder.phone_number}</p>
              <p><strong>Target Pickup Time:</strong> {formatTime(selectedOrder.pickup_time)}</p>
              <p><strong>Order Created:</strong> {formatTime(selectedOrder.created_at)}</p>
            </div>

            <div className="modal-items-breakdown">
              <h4>Ordered Items</h4>
              <div className="modal-table-wrapper">
                <table className="mini-details-table">
                  <thead>
                    <tr>
                      <th>Item Name</th>
                      <th>Qty</th>
                      <th>Unit Price</th>
                      <th>Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.isArray(selectedOrder.order_items) &&
                      selectedOrder.order_items.map((it, idx) => (
                        <tr key={idx}>
                          <td>{it.name}</td>
                          <td>{it.quantity}</td>
                          <td>Rs. {it.price_pkr}</td>
                          <td>Rs. {it.price_pkr * it.quantity}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>

              {selectedOrder.special_notes && (
                <div className="modal-notes-box">
                  <strong>Special Instructions from Customer:</strong>
                  <p>{selectedOrder.special_notes}</p>
                </div>
              )}

              <div className="modal-total-bar">
                <span>Total Amount Due (Cash on Pickup):</span>
                <span className="total-val">Rs. {selectedOrder.total_price_pkr}</span>
              </div>
            </div>

            <div className="modal-status-changer">
              <h4>Update Order Status</h4>
              <div className="status-button-group">
                <Button
                  variant={selectedOrder.status === 'pending' ? 'primary' : 'secondary'}
                  onClick={() => handleUpdateStatus(selectedOrder.id, 'pending')}
                >
                  Pending
                </Button>
                <Button
                  variant={selectedOrder.status === 'preparing' ? 'primary' : 'secondary'}
                  onClick={() => handleUpdateStatus(selectedOrder.id, 'preparing')}
                >
                  Preparing
                </Button>
                <Button
                  variant={selectedOrder.status === 'ready' ? 'primary' : 'secondary'}
                  onClick={() => handleUpdateStatus(selectedOrder.id, 'ready')}
                >
                  Ready for Pickup
                </Button>
                <Button
                  variant={selectedOrder.status === 'completed' ? 'primary' : 'secondary'}
                  onClick={() => handleUpdateStatus(selectedOrder.id, 'completed')}
                >
                  Completed
                </Button>
                <Button
                  variant="danger"
                  onClick={() => handleUpdateStatus(selectedOrder.id, 'cancelled')}
                >
                  Cancel Order
                </Button>
              </div>
            </div>
          </div>

          <Modal.Footer>
            <Button variant="danger" onClick={() => handleDeleteOrder(selectedOrder.id)}>
              Delete Order
            </Button>
            <Button variant="secondary" onClick={() => setIsDetailModalOpen(false)}>
              Close
            </Button>
          </Modal.Footer>
        </Modal>
      )}

      {/* MODAL 2: EDIT / CREATE MENU ITEM */}
      <Modal
        isOpen={isMenuModalOpen}
        onClose={() => setIsMenuModalOpen(false)}
        title={editingMenuItem ? `Edit "${editingMenuItem.name}"` : 'Add New Bakery Menu Item'}
        size="lg"
      >
        <form onSubmit={handleSaveMenuItem} className="menu-form">
          <div className="form-grid-2">
            <Input
              label="Item Name *"
              placeholder="e.g. Artisanal Almond Croissant"
              value={menuForm.name}
              onChange={(e) => setMenuForm({ ...menuForm, name: e.target.value })}
              required
            />
            <Select
              label="Category *"
              value={menuForm.category}
              onChange={(e) => setMenuForm({ ...menuForm, category: e.target.value })}
            >
              <option value="Bread">Bread</option>
              <option value="Cakes">Cakes</option>
              <option value="Pastries">Pastries</option>
              <option value="Beverages">Beverages</option>
              <option value="Savory">Savory</option>
            </Select>
          </div>

          <Textarea
            label="Description *"
            placeholder="Describe flavors, ingredients, dietary notes..."
            value={menuForm.description}
            onChange={(e) => setMenuForm({ ...menuForm, description: e.target.value })}
            rows={3}
            required
          />

          <div className="form-grid-2">
            <Input
              label="Price in PKR (Rs.) *"
              type="number"
              placeholder="e.g. 450"
              value={menuForm.price_pkr}
              onChange={(e) => setMenuForm({ ...menuForm, price_pkr: e.target.value })}
              required
            />
            <Input
              label="Photo Image URL *"
              placeholder="https://images.unsplash.com/photo-..."
              value={menuForm.image_url}
              onChange={(e) => setMenuForm({ ...menuForm, image_url: e.target.value })}
              required
            />
          </div>

          <div className="form-checkboxes-row">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={menuForm.is_available}
                onChange={(e) => setMenuForm({ ...menuForm, is_available: e.target.checked })}
              />
              <span>In Stock & Available for Order</span>
            </label>

            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={menuForm.is_featured}
                onChange={(e) => setMenuForm({ ...menuForm, is_featured: e.target.checked })}
              />
              <span>Feature on Home Page Highlight</span>
            </label>
          </div>

          <Modal.Footer>
            <Button variant="ghost" onClick={() => setIsMenuModalOpen(false)} type="button">
              Cancel
            </Button>
            <Button variant="primary" loading={savingMenu} type="submit">
              {savingMenu ? 'Saving Changes...' : editingMenuItem ? 'Update Menu Item' : 'Create Menu Item'}
            </Button>
          </Modal.Footer>
        </form>
      </Modal>
    </div>
  )
}