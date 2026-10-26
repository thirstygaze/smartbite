// Supabase Client for SmartBite Canteen Ordering System
// Built with native browser Fetch API for zero-dependency speed and reliability

export const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_URL ||
  'https://zkarmieyteouuvzhojrv.supabase.co'

export const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'sb_publishable_cJk4jM2_UbvuoFJq0bbNAg_MPRdR3QS'

export interface MenuItem {
  id: number | string
  name: string
  description: string
  price: number
  category: string
  rating: string
  image: string
  available?: boolean
}

export interface OrderItem {
  id: number | string
  name: string
  price: number
  quantity: number
}

export interface OrderRecord {
  id: string
  user_id?: string | null
  student_id: string
  student_name: string
  items: OrderItem[]
  subtotal: number
  service_fee: number
  total: number
  status: 'Order placed' | 'Preparing' | 'Ready for pickup' | 'Completed' | 'Cancelled'
  pickup_time: string
  payment_method: string
  payment_status: 'pending' | 'paid' | 'failed'
  created_at?: string
}

const headers = {
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
  'Content-Type': 'application/json',
}

export const supabase = {
  // Test connection to Supabase
  async testConnection(): Promise<{ ok: boolean; message: string }> {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/menu_items?select=count`, {
        headers,
      })
      if (res.ok) {
        return { ok: true, message: 'Connected to Supabase successfully' }
      }
      if (res.status === 404 || res.status === 401) {
        // May mean table is not created yet or credentials check
        return {
          ok: false,
          message: `Supabase reached (${res.status}). Make sure you ran supabase-schema.sql in the Supabase SQL editor.`,
        }
      }
      return { ok: false, message: `Status ${res.status}: ${res.statusText}` }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      return { ok: false, message: `Connection error: ${message}` }
    }
  },

  // Fetch Menu Items from Supabase
  async getMenuItems(): Promise<MenuItem[]> {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/menu_items?select=*&order=id.asc`, {
        headers,
      })
      if (!res.ok) {
        throw new Error(`Failed to load menu items: ${res.statusText}`)
      }
      const data = await res.json()
      return data
    } catch (err) {
      console.warn('Supabase getMenuItems warning:', err)
      throw err
    }
  },

  // Create Order in Supabase
  async createOrder(order: OrderRecord): Promise<OrderRecord> {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/orders`, {
        method: 'POST',
        headers: {
          ...headers,
          Prefer: 'return=representation',
        },
        body: JSON.stringify(order),
      })

      if (!res.ok) {
        const errorText = await res.text()
        throw new Error(`Order failed (${res.status}): ${errorText}`)
      }

      const created = await res.json()
      return Array.isArray(created) ? created[0] : created
    } catch (err) {
      console.error('Supabase createOrder error:', err)
      throw err
    }
  },

  // Fetch Orders
  async getOrders(studentId?: string): Promise<OrderRecord[]> {
    try {
      const filter = studentId ? `&student_id=eq.${encodeURIComponent(studentId)}` : ''
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/orders?select=*${filter}&order=created_at.desc&limit=10`,
        { headers }
      )
      if (!res.ok) {
        throw new Error(`Failed to fetch orders: ${res.statusText}`)
      }
      return await res.json()
    } catch (err) {
      console.warn('Supabase getOrders warning:', err)
      return []
    }
  },

  // Update Order Status
  async updateOrderStatus(id: string, status: OrderRecord['status']): Promise<void> {
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/orders?id=eq.${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ status }),
      })
    } catch (err) {
      console.error('Supabase updateOrderStatus error:', err)
    }
  },
}
