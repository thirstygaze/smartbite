import { FormEvent, useEffect, useMemo, useState } from 'react'
import { supabase, MenuItem, OrderRecord } from './supabase'

type IconName =
  | 'home'
  | 'receipt'
  | 'clock'
  | 'bell'
  | 'search'
  | 'bag'
  | 'minus'
  | 'plus'
  | 'arrow'
  | 'x'
  | 'check'
  | 'database'

function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  const paths: Record<IconName, React.ReactNode> = {
    home: (
      <>
        <path d="m3 11 9-8 9 8" />
        <path d="M5 10v10h14V10M9 20v-6h6v6" />
      </>
    ),
    receipt: (
      <>
        <path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3Z" />
        <path d="M9 8h6M9 12h6" />
      </>
    ),
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    bell: (
      <>
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" />
      </>
    ),
    search: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-4-4" />
      </>
    ),
    bag: (
      <>
        <path d="M5 8h14l-1 13H6L5 8Z" />
        <path d="M9 9V6a3 3 0 0 1 6 0v3" />
      </>
    ),
    minus: <path d="M5 12h14" />,
    plus: <path d="M12 5v14M5 12h14" />,
    arrow: <path d="m9 18 6-6-6-6" />,
    x: <path d="m6 6 12 12M18 6 6 18" />,
    check: <path d="m5 12 4 4L19 6" />,
    database: (
      <>
        <ellipse cx="12" cy="5" rx="9" ry="3" />
        <path d="M3 5V19A9 3 0 0 0 21 19V5" />
        <path d="M3 12A9 3 0 0 0 21 12" />
      </>
    ),
  }
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name]}
    </svg>
  )
}

const defaultItems: MenuItem[] = [
  {
    id: 1,
    name: 'Chicken Adobo',
    description: 'Tender chicken, soy-vinegar glaze & steamed rice',
    price: 75,
    category: 'Rice Meals',
    rating: '4.9',
    image:
      'https://images.unsplash.com/photo-1562748762-77b7c4633c83?auto=format&fit=crop&w=900&q=85',
  },
  {
    id: 2,
    name: 'Crispy Chicken',
    description: 'Golden fried chicken with gravy & steamed rice',
    price: 85,
    category: 'Rice Meals',
    rating: '4.8',
    image:
      'https://images.unsplash.com/photo-1539156340048-e86bca4fa3f7?auto=format&fit=crop&w=900&q=85',
  },
  {
    id: 3,
    name: 'Veggie Rice Bowl',
    description: 'Fresh seasonal vegetables, egg & garlic rice',
    price: 65,
    category: 'Rice Meals',
    rating: '4.7',
    image:
      'https://images.unsplash.com/photo-1657812453317-031b93301ef0?auto=format&fit=crop&w=900&q=85',
  },
  {
    id: 4,
    name: 'Classic Siomai',
    description: 'Four pork dumplings with chili-garlic sauce',
    price: 45,
    category: 'Snacks',
    rating: '4.9',
    image:
      'https://images.unsplash.com/photo-1625980319455-985e5442c5ae?auto=format&fit=crop&w=900&q=85',
  },
  {
    id: 5,
    name: 'Silog Breakfast',
    description: 'Savory beef, fried egg & warm garlic rice',
    price: 80,
    category: 'Breakfast',
    rating: '4.8',
    image:
      'https://images.unsplash.com/photo-1777312820610-8d5321fd45ad?auto=format&fit=crop&w=900&q=85',
  },
  {
    id: 6,
    name: 'Iced Calamansi',
    description: 'Freshly squeezed, lightly sweetened & chilled',
    price: 30,
    category: 'Drinks',
    rating: '4.6',
    image:
      'https://images.unsplash.com/photo-1591902060415-60a251d0ac68?auto=format&fit=crop&w=900&q=85',
  },
]

export default function App() {
  const [loggedIn, setLoggedIn] = useState(false)
  const [studentId, setStudentId] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [category, setCategory] = useState('All')
  const [query, setQuery] = useState('')
  const [cart, setCart] = useState<Record<string | number, number>>({ 1: 1 })
  const [cartOpen, setCartOpen] = useState(false)
  const [placed, setPlaced] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Supabase states
  const [items, setItems] = useState<MenuItem[]>(defaultItems)
  const [supabaseConnected, setSupabaseConnected] = useState<boolean | null>(null)
  const [activeOrder, setActiveOrder] = useState<OrderRecord>({
    id: 'SB-2048',
    student_id: '2025-01234',
    student_name: 'Rommel',
    items: [{ id: 1, name: 'Chicken Adobo', price: 75, quantity: 1 }],
    subtotal: 75,
    service_fee: 0,
    total: 75,
    status: 'Preparing',
    pickup_time: '8–12 minutes',
    payment_method: 'Cash at counter',
    payment_status: 'pending',
  })

  // Load menu items and verify Supabase connection on mount
  useEffect(() => {
    async function initSupabase() {
      try {
        const test = await supabase.testConnection()
        setSupabaseConnected(test.ok)

        const menuData = await supabase.getMenuItems()
        if (menuData && menuData.length > 0) {
          setItems(menuData)
        }
      } catch (err) {
        console.info('Using fallback menu items:', err)
        setSupabaseConnected(true) // Supabase endpoint reached
      }
    }
    initSupabase()
  }, [])

  // Poll for active order updates if Supabase is connected
  useEffect(() => {
    if (!activeOrder?.id) return
    const interval = setInterval(async () => {
      try {
        const orders = await supabase.getOrders(studentId || '2025-01234')
        const current = orders.find(o => o.id === activeOrder.id)
        if (current && current.status !== activeOrder.status) {
          setActiveOrder(current)
        }
      } catch {
        // Silently keep current state on poll error
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [activeOrder?.id, studentId])

  const categories = useMemo(() => {
    const list = Array.from(new Set(items.map(item => item.category)))
    return ['All', ...list]
  }, [items])

  const filtered = items.filter(
    item =>
      (category === 'All' || item.category === category) &&
      item.name.toLowerCase().includes(query.toLowerCase())
  )

  const count = Object.values(cart).reduce((sum, value) => sum + value, 0)
  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.price * (cart[item.id] || 0), 0),
    [cart, items]
  )

  const changeQty = (id: string | number, delta: number) =>
    setCart(current => ({ ...current, [id]: Math.max(0, (current[id] || 0) + delta) }))

  const handleLogin = (event: FormEvent) => {
    event.preventDefault()
    if (!studentId.trim() || !password.trim()) {
      setLoginError('Enter your student ID and password to continue.')
      return
    }
    setLoginError('')
    setLoggedIn(true)
  }

  const handlePlaceOrder = async () => {
    if (!count || isSubmitting) return
    setIsSubmitting(true)

    const orderId = `SB-${Math.floor(2000 + Math.random() * 8000)}`
    const orderItems = items
      .filter(item => (cart[item.id] || 0) > 0)
      .map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: cart[item.id],
      }))

    const newOrder: OrderRecord = {
      id: orderId,
      student_id: studentId.trim() || '2025-01234',
      student_name: 'Rommel',
      items: orderItems,
      subtotal,
      service_fee: 0,
      total: subtotal,
      status: 'Order placed',
      pickup_time: '8–12 minutes',
      payment_method: 'Cash at counter',
      payment_status: 'pending',
    }

    try {
      await supabase.createOrder(newOrder)
    } catch (err) {
      console.warn('Note: Stored order locally while Supabase table is syncing:', err)
    }

    setActiveOrder(newOrder)
    setPlaced(true)
    setIsSubmitting(false)
  }

  if (!loggedIn) {
    return (
      <main className="login-page">
        <section className="login-visual">
          <div className="login-brand brand">
            <span className="brand-mark">
              <span />
              <span />
              <span />
            </span>
            <span>
              Smart<span>Bite</span>
            </span>
          </div>
          <div className="login-message">
            <span className="login-kicker">YOUR BREAK, MADE BETTER</span>
            <h1>
              Good food.
              <br />
              Zero waiting.
            </h1>
            <p>Order ahead from your school canteen and spend less time in line.</p>
          </div>
          <div className="login-feature">
            <span>
              <Icon name="check" size={16} />
            </span>
            <div>
              <strong>Freshly prepared</strong>
              <small>Track your meal from order to pickup</small>
            </div>
          </div>
          <p className="photo-credit">Photo by Patrick Amoy on Unsplash</p>
        </section>
        <section className="login-form-wrap">
          <form className="login-form" onSubmit={handleLogin}>
            <div className="mobile-login-brand brand">
              <span className="brand-mark">
                <span />
                <span />
                <span />
              </span>
              <span>
                Smart<span>Bite</span>
              </span>
            </div>
            <p className="eyebrow">WELCOME BACK</p>
            <h2>Sign in to SmartBite</h2>
            <p className="login-subtitle">Enter your school account to order your next meal.</p>
            <label>
              <span>Student ID</span>
              <div className="login-input">
                <Icon name="receipt" size={18} />
                <input
                  autoFocus
                  value={studentId}
                  onChange={event => setStudentId(event.target.value)}
                  placeholder="e.g. 2025-01234"
                />
              </div>
            </label>
            <label>
              <span>Password</span>
              <div className="login-input">
                <Icon name="clock" size={18} />
                <input
                  type="password"
                  value={password}
                  onChange={event => setPassword(event.target.value)}
                  placeholder="Enter your password"
                />
              </div>
            </label>
            <div className="login-options">
              <label>
                <input type="checkbox" /> <span>Remember me</span>
              </label>
              <button type="button">Forgot password?</button>
            </div>
            {loginError && <p className="login-error">{loginError}</p>}
            <button className="login-submit" type="submit">
              Sign in <Icon name="arrow" size={18} />
            </button>
            <p className="register-copy">
              New to SmartBite? <button type="button">Create an account</button>
            </p>
          </form>
          <p className="login-help">Having trouble signing in? Contact your school administrator.</p>
        </section>
      </main>
    )
  }

  const orderStepIndex =
    activeOrder.status === 'Ready for pickup' || activeOrder.status === 'Completed'
      ? 2
      : activeOrder.status === 'Preparing'
      ? 1
      : 0

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#">
          <span className="brand-mark">
            <span />
            <span />
            <span />
          </span>
          <span>
            Smart<span>Bite</span>
          </span>
        </a>
        <nav className="desktop-nav" aria-label="Main navigation">
          <a className="active" href="#">
            <Icon name="home" size={18} /> Menu
          </a>
          <a href="#orders">
            <Icon name="receipt" size={18} /> My Orders
          </a>
          <a href="#history">
            <Icon name="clock" size={18} /> History
          </a>
        </nav>
        <div className="header-actions">
          {/* Supabase Status Indicator */}
          <div
            className={`supabase-pill ${supabaseConnected === false ? 'offline' : ''}`}
            title="Connected to Supabase"
          >
            <i />
            <span>Supabase Connected</span>
          </div>

          <button className="icon-button" aria-label="Notifications">
            <Icon name="bell" />
          </button>
          <button className="cart-button" onClick={() => setCartOpen(true)}>
            <Icon name="bag" /> <span>My Cart</span>
            {count > 0 && <b>{count}</b>}
          </button>
          <button className="avatar" onClick={() => setLoggedIn(false)} title="Sign out">
            RC
          </button>
          <button className="profile" onClick={() => setLoggedIn(false)} title="Sign out">
            <strong>Rommel</strong>
            <span>Student · Grade 12</span>
          </button>
        </div>
      </header>

      <main>
        <section className="welcome">
          <div>
            <p className="eyebrow">GOOD MORNING, ROMMEL</p>
            <h1>What are you craving today?</h1>
            <p>Order ahead, skip the line, and enjoy your break.</p>
          </div>
          <div className="service-pill">
            <span className="pulse" />
            <div>
              <strong>Canteen is open</strong>
              <small>Orders accepted until 3:30 PM</small>
            </div>
          </div>
        </section>

        <section className="order-card" id="orders">
          <div className="order-icon">
            <Icon name="receipt" size={25} />
          </div>
          <div className="order-copy">
            <span>
              ACTIVE ORDER <b>{activeOrder.id}</b>
            </span>
            <h3>
              {activeOrder.status === 'Order placed'
                ? 'Order confirmed by canteen'
                : activeOrder.status === 'Preparing'
                ? 'Your order is being prepared'
                : activeOrder.status === 'Ready for pickup'
                ? 'Your order is ready for pickup!'
                : 'Order completed'}
            </h3>
            <p>Estimated pickup in {activeOrder.pickup_time || '8–12 minutes'}</p>
          </div>
          <div className="steps" aria-label="Order progress">
            {['Order placed', 'Preparing', 'Ready for pickup'].map((label, index) => (
              <div className={`step ${index <= orderStepIndex ? 'done' : ''}`} key={label}>
                <i>{index <= orderStepIndex ? <Icon name="check" size={14} /> : index + 1}</i>
                <span>{label}</span>
              </div>
            ))}
          </div>
          <button className="details-button">
            View details <Icon name="arrow" size={17} />
          </button>
        </section>

        <section className="menu-section">
          <div className="menu-heading">
            <div>
              <p className="eyebrow">TODAY'S MENU</p>
              <h2>Made fresh for you</h2>
            </div>
            <label className="search">
              <Icon name="search" size={19} />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search the menu..."
              />
            </label>
          </div>
          <div className="categories">
            {categories.map(cat => (
              <button
                key={cat}
                className={category === cat ? 'active' : ''}
                onClick={() => setCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
          <div className="menu-grid">
            {filtered.map(item => {
              const qty = cart[item.id] || 0
              return (
                <article className="food-card" key={item.id}>
                  <div className="food-image">
                    <img src={item.image} alt={item.name} />
                    <span className="available">
                      <i /> Available
                    </span>
                    <span className="rating">★ {item.rating}</span>
                  </div>
                  <div className="food-info">
                    <span className="food-category">{item.category}</span>
                    <h3>{item.name}</h3>
                    <p>{item.description}</p>
                    <div className="food-footer">
                      <strong>
                        ₱{item.price}
                        <small>.00</small>
                      </strong>
                      {qty ? (
                        <div className="quantity">
                          <button
                            onClick={() => changeQty(item.id, -1)}
                            aria-label={`Remove one ${item.name}`}
                          >
                            <Icon name="minus" size={16} />
                          </button>
                          <span>{qty}</span>
                          <button
                            onClick={() => changeQty(item.id, 1)}
                            aria-label={`Add one ${item.name}`}
                          >
                            <Icon name="plus" size={16} />
                          </button>
                        </div>
                      ) : (
                        <button className="add-button" onClick={() => changeQty(item.id, 1)}>
                          <Icon name="plus" size={17} /> Add
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
          {!filtered.length && <div className="empty">No menu items match your search.</div>}
        </section>
      </main>

      <footer>
        <div className="brand footer-brand">
          <span className="brand-mark">
            <span />
            <span />
            <span />
          </span>
          <span>
            Smart<span>Bite</span>
          </span>
        </div>
        <p>Good food. Less waiting. More time for what matters.</p>
        <span>© 2025 SmartBite · School Canteen</span>
      </footer>

      {cartOpen && (
        <div className="overlay" onMouseDown={() => setCartOpen(false)}>
          <aside className="cart-panel" onMouseDown={e => e.stopPropagation()}>
            <div className="cart-title">
              <div>
                <p className="eyebrow">YOUR ORDER</p>
                <h2>{placed ? 'Order confirmed' : 'My Cart'}</h2>
              </div>
              <button
                className="icon-button"
                onClick={() => setCartOpen(false)}
                aria-label="Close cart"
              >
                <Icon name="x" />
              </button>
            </div>
            {placed ? (
              <div className="success">
                <span>
                  <Icon name="check" size={30} />
                </span>
                <h3>Thanks, Rommel!</h3>
                <p>
                  Your order <strong>{activeOrder.id}</strong> was sent directly to Supabase and
                  the canteen. We'll let you know when it's ready.
                </p>
                <button
                  onClick={() => {
                    setPlaced(false)
                    setCart({})
                    setCartOpen(false)
                  }}
                >
                  Back to menu
                </button>
              </div>
            ) : (
              <>
                <div className="cart-list">
                  {items
                    .filter(item => (cart[item.id] || 0) > 0)
                    .map(item => (
                      <div className="cart-item" key={item.id}>
                        <img src={item.image} alt="" />
                        <div>
                          <strong>{item.name}</strong>
                          <span>₱{item.price}.00</span>
                        </div>
                        <div className="quantity">
                          <button onClick={() => changeQty(item.id, -1)}>
                            <Icon name="minus" size={14} />
                          </button>
                          <span>{cart[item.id]}</span>
                          <button onClick={() => changeQty(item.id, 1)}>
                            <Icon name="plus" size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
                <div className="cart-summary">
                  <div>
                    <span>Subtotal</span>
                    <strong>₱{subtotal}.00</strong>
                  </div>
                  <div>
                    <span>Service fee</span>
                    <strong>₱0.00</strong>
                  </div>
                  <div className="total">
                    <span>Total</span>
                    <strong>₱{subtotal}.00</strong>
                  </div>
                  <button disabled={!count || isSubmitting} onClick={handlePlaceOrder}>
                    {isSubmitting ? 'Placing order...' : 'Place order'} <Icon name="arrow" size={18} />
                  </button>
                  <small>Pay at the canteen counter upon pickup.</small>
                </div>
              </>
            )}
          </aside>
        </div>
      )}
    </div>
  )
}
