// Supabase Client for SmartBite Multi-Stall Canteen Food Hub & Inventory Engine
// Compliant with 3NF Normalized Schema, Stored Procedures, and Multi-Tier RBAC

export const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_URL ||
  'https://zkarmieyteouuvzhojrv.supabase.co'

export const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'sb_publishable_cJk4jM2_UbvuoFJq0bbNAg_MPRdR3QS'

const MENU_IMAGE_BUCKET = 'menu-images'
const MAX_MENU_IMAGE_SIZE = 5 * 1024 * 1024

export async function uploadMenuImage(file: File, stallId: number): Promise<string> {
  const allowedTypes: Record<string, string> = {
    'image/avif': 'avif',
    'image/gif': 'gif',
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
  }
  const extension = allowedTypes[file.type]

  if (!extension) {
    throw new Error('Choose a JPG, PNG, WebP, GIF, or AVIF image.')
  }
  if (file.size > MAX_MENU_IMAGE_SIZE) {
    throw new Error('The image must be 5 MB or smaller.')
  }

  const fileName = `${stallId}/${Date.now()}-${crypto.randomUUID()}.${extension}`
  const response = await fetch(
    `${SUPABASE_URL}/storage/v1/object/${MENU_IMAGE_BUCKET}/${fileName}`,
    {
      method: 'POST',
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': file.type,
        'x-upsert': 'false',
      },
      body: file,
    }
  )

  if (!response.ok) {
    const details = await response.text()
    throw new Error(`Image upload failed (${response.status}): ${details}`)
  }

  return `${SUPABASE_URL}/storage/v1/object/public/${MENU_IMAGE_BUCKET}/${fileName}`
}

export type UserRole = 'student' | 'staff' | 'stall_manager' | 'admin'

export interface Profile {
  id: string
  student_id: string
  email?: string
  first_name?: string
  middle_name?: string
  last_name?: string
  full_name: string
  grade_or_dept: string
  role: UserRole
  balance: number
  stall_id?: number
  password?: string
  avatar_url?: string
  phone_number?: string
  is_active?: boolean
  created_at?: string
}

export interface Stall {
  id: number
  name: string
  stall_code: string
  description: string
  is_open: boolean
  rating: number
  manager_id?: string | null
  created_at?: string
}

export interface Category {
  id: number
  stall_id: number
  name: string
  description?: string
  display_order: number
}

export interface MenuItem {
  id: number
  stall_id: number
  category_id: number
  name: string
  description: string
  price: number
  preparation_time_minutes: number
  rating: string
  image_url: string
  is_available: boolean
  category?: string
}

export interface InventoryItem {
  id: number
  stall_id: number
  item_name: string
  unit_of_measure: string
  current_stock: number
  minimum_threshold: number
  reorder_quantity: number
  last_restocked_at?: string
}

export interface OrderItem {
  id?: number
  order_id?: string
  menu_item_id: number
  item_name: string
  quantity: number
  unit_price: number
  item_subtotal: number
  special_instructions?: string
  item_status?: 'pending' | 'cooking' | 'prepared'
}

export interface OrderRecord {
  id: string
  student_id?: string | null
  stall_id: number
  student_number: string
  student_name: string
  subtotal: number
  service_fee: number
  total_amount: number
  order_status: 'Order placed' | 'Preparing' | 'Ready for pickup' | 'Completed' | 'Cancelled'
  pickup_time?: string
  payment_method: string
  payment_status: 'pending' | 'paid' | 'refunded'
  created_at?: string
  order_items?: OrderItem[]
}

export interface AuditLog {
  id: number
  table_name: string
  record_id: string
  action: 'INSERT' | 'UPDATE' | 'DELETE'
  performed_by?: string
  old_data?: any
  new_data?: any
  change_summary?: string
  created_at: string
}

// Recipe mappings linking menu items to raw inventory ingredients
// Defines which raw stock items and how many units are deducted upon customer purchase
export const MENU_RECIPES: Record<number, Array<{ invId: number; qty: number }>> = {
  1: [ // Chicken Adobo Bowl: 1 serving chicken cuts, 1 serving rice
    { invId: 1, qty: 1 },
    { invId: 2, qty: 1 },
  ],
  2: [ // Crispy Fried Chicken: 1 serving chicken cuts, 1 serving rice
    { invId: 1, qty: 1 },
    { invId: 2, qty: 1 },
  ],
  3: [ // Fresh Veggie Rice Bowl: 1 serving rice
    { invId: 2, qty: 1 },
  ],
  4: [ // Beef Tapa Silog: 1 serving beef tapa, 1 fresh egg, 1 serving rice
    { invId: 3, qty: 1 },
    { invId: 4, qty: 1 },
    { invId: 2, qty: 1 },
  ],
  5: [ // Classic Pork Siomai: 4 pieces siomai per order
    { invId: 5, qty: 4 },
  ],
  6: [ // Chilled Calamansi Juice: 1 serving calamansi puree
    { invId: 6, qty: 1 },
  ],
}

export function deductInventoryStock(
  currentInventory: InventoryItem[],
  orderItems: Array<{ menu_item_id: number; quantity: number }>
): { updatedInventory: InventoryItem[]; deductions: Record<number, number> } {
  const deductions: Record<number, number> = {}
  for (const oi of orderItems) {
    const recipe = MENU_RECIPES[Number(oi.menu_item_id)] || [
      { invId: Number(oi.menu_item_id), qty: 1 },
    ]
    for (const ing of recipe) {
      deductions[ing.invId] = (deductions[ing.invId] || 0) + ing.qty * oi.quantity
    }
  }

  const updatedInventory = currentInventory.map(inv => {
    const numId = Number(inv.id)
    const deduct = deductions[numId] || 0
    if (deduct > 0) {
      const newStock = Math.max(0, Number(inv.current_stock) - deduct)
      return { ...inv, current_stock: newStock }
    }
    return inv
  })

  return { updatedInventory, deductions }
}

const headers = {
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
  'Content-Type': 'application/json',
}

// Local storage seed profiles for instant offline & demo compatibility
const INITIAL_PROFILES: Profile[] = [
  {
    id: 'p-1',
    student_id: '2025-01234',
    first_name: 'Rommel',
    middle_name: '',
    last_name: 'Custodio',
    full_name: 'Rommel Custodio',
    grade_or_dept: 'Grade 12 - STEM A',
    role: 'student',
    balance: 500.0,
    password: 'student123',
    is_active: true,
    created_at: '2026-10-26T08:00:00Z',
  },
  {
    id: 'p-2',
    student_id: 'STAFF-KITCHEN',
    first_name: 'Maria',
    middle_name: 'Alvarez',
    last_name: 'Santos',
    full_name: 'Maria Alvarez Santos',
    grade_or_dept: 'Stall #1 Main Kitchen Staff',
    role: 'staff',
    stall_id: 1,
    balance: 1200.0,
    password: 'staff123',
    is_active: true,
    created_at: '2026-10-26T08:30:00Z',
  },
  {
    id: 'p-2b',
    student_id: 'STAFF-SNACKS',
    first_name: 'Rey',
    middle_name: 'Anthony',
    last_name: 'Using',
    full_name: 'Rey Anthony Using',
    grade_or_dept: 'Stall #2 Snack Bar Staff',
    role: 'staff',
    stall_id: 2,
    balance: 1100.0,
    password: 'staff123',
    is_active: true,
    created_at: '2026-10-26T08:45:00Z',
  },
  {
    id: 'p-3',
    student_id: 'ADMIN-DBA',
    first_name: 'David',
    middle_name: 'Cruz',
    last_name: 'Reyes',
    full_name: 'David Cruz Reyes',
    grade_or_dept: 'Campus Canteen Management & IT',
    role: 'admin',
    balance: 5000.0,
    password: 'admin123',
    is_active: true,
    created_at: '2026-10-26T07:00:00Z',
  },
  {
    id: 'p-4',
    student_id: 'MGR-BRANCH',
    first_name: 'Carlos',
    middle_name: 'Jose',
    last_name: 'Mendoza',
    full_name: 'Carlos Jose Mendoza',
    grade_or_dept: 'Stall Operations Manager',
    role: 'stall_manager',
    stall_id: 1,
    balance: 3500.0,
    password: 'manager123',
    is_active: true,
    created_at: '2026-10-26T07:30:00Z',
  },
]

export const supabase = {
  // Test connection
  async testConnection(): Promise<{ ok: boolean; message: string }> {
    try {
      const res = await fetch(`${SUPABASE_URL}/auth/v1/settings`, {
        headers: { apikey: SUPABASE_ANON_KEY },
      })
      if (res.ok) {
        return { ok: true, message: 'Supabase Cloud Cluster Live & Verified' }
      }
      return { ok: false, message: `Status ${res.status}: ${res.statusText}` }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      return { ok: false, message: `Connection error: ${message}` }
    }
  },

  // ==========================================
  // 1. PROFILES & USERS (Admin Overview & Management)
  // ==========================================
  async getProfiles(): Promise<Profile[]> {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/profiles?select=*&order=created_at.desc`, { headers })
      if (res.ok) {
        const data = await res.json()
        if (data && data.length > 0) return data
      }
    } catch {}

    // Fallback local storage
    const saved = localStorage.getItem('smartbite_profiles')
    if (saved) {
      try { return JSON.parse(saved) } catch {}
    }
    localStorage.setItem('smartbite_profiles', JSON.stringify(INITIAL_PROFILES))
    return INITIAL_PROFILES
  },

  async createProfile(profile: Partial<Profile>): Promise<Profile> {
    const firstName = profile.first_name?.trim() || ''
    const middleName = profile.middle_name?.trim() || ''
    const lastName = profile.last_name?.trim() || ''
    const fullName =
      profile.full_name?.trim() ||
      (firstName || lastName
        ? `${firstName} ${middleName ? middleName + ' ' : ''}${lastName}`.trim()
        : 'New User')

    const newProfile: Profile = {
      id: profile.id || crypto.randomUUID(),
      student_id: profile.student_id || `PENDING-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`,
      email: profile.email?.trim().toLowerCase() || undefined,
      first_name: firstName,
      middle_name: middleName,
      last_name: lastName,
      full_name: fullName,
      grade_or_dept: profile.grade_or_dept || 'Grade 12 - General',
      role: profile.role || 'student',
      stall_id: profile.stall_id,
      balance: profile.balance ?? 500.0,
      password: profile.password,
      is_active: true,
      created_at: new Date().toISOString(),
    }

    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/profiles`, {
        method: 'POST',
        headers: { ...headers, Prefer: 'return=representation' },
        body: JSON.stringify(newProfile),
      })
      if (res.ok) {
        const created = await res.json()
        const result = Array.isArray(created) ? created[0] : created
        return { ...newProfile, ...result }
      }
    } catch {}

    // Save to local storage
    const profiles = await this.getProfiles()
    const updated = [newProfile, ...profiles.filter(p => p.student_id !== newProfile.student_id)]
    localStorage.setItem('smartbite_profiles', JSON.stringify(updated))
    return newProfile
  },

  async updateProfile(id: string, updates: Partial<Profile>): Promise<void> {
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(updates),
      })
    } catch {}

    const profiles = await this.getProfiles()
    const updated = profiles.map(p => (p.id === id ? { ...p, ...updates } : p))
    localStorage.setItem('smartbite_profiles', JSON.stringify(updated))
  },

  async deleteProfile(id: string): Promise<void> {
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers,
      })
    } catch {}

    const profiles = await this.getProfiles()
    const updated = profiles.filter(p => p.id !== id)
    localStorage.setItem('smartbite_profiles', JSON.stringify(updated))
  },

  async changePassword(profileId: string, newPassword: string): Promise<boolean> {
    await this.updateProfile(profileId, { password: newPassword })
    return true
  },

  // ==========================================
  // 2. STALLS & MINI STALL BRANCHES
  // ==========================================
  async getStalls(): Promise<Stall[]> {
    let remoteData: Stall[] = []
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/stalls?select=*&order=id.asc`, { headers })
      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data) && data.length > 0) {
          remoteData = data.map((s: any) => ({
            ...s,
            id: Number(s.id),
            is_open: s.is_open ?? true,
          }))
        }
      }
    } catch {}

    const saved = localStorage.getItem('smartbite_stalls')
    let localList: Stall[] = []
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed)) localList = parsed
      } catch {}
    }

    if (remoteData.length > 0) {
      const merged = remoteData.map(rem => {
        const loc = localList.find(l => Number(l.id) === Number(rem.id))
        return loc ? { ...rem, ...loc } : rem
      })
      for (const loc of localList) {
        if (!merged.some(m => Number(m.id) === Number(loc.id))) {
          merged.push(loc)
        }
      }
      return merged
    }

    if (localList.length > 0) return localList

    const initialStalls: Stall[] = [
      {
        id: 1,
        name: 'SmartBite Main Kitchen',
        stall_code: 'STALL-01',
        description: 'Signature rice meals, breakfasts, and hot mains',
        is_open: true,
        rating: 4.9,
      },
      {
        id: 2,
        name: 'The Snack Bar & Drinks',
        stall_code: 'STALL-02',
        description: 'Quick finger bites, dimsum, and freshly pressed refreshments',
        is_open: true,
        rating: 4.8,
      },
    ]
    try {
      localStorage.setItem('smartbite_stalls', JSON.stringify(initialStalls))
    } catch {}
    return initialStalls
  },

  async updateStall(id: number, updates: Partial<Stall>): Promise<void> {
    const numId = Number(id)
    try {
      const saved = localStorage.getItem('smartbite_stalls')
      let stalls: Stall[] = saved ? JSON.parse(saved) : []
      if (!Array.isArray(stalls) || stalls.length === 0) {
        stalls = await this.getStalls()
      }
      const updated = stalls.map(s => (Number(s.id) === numId ? { ...s, ...updates } : s))
      localStorage.setItem('smartbite_stalls', JSON.stringify(updated))
    } catch {}

    try {
      await fetch(`${SUPABASE_URL}/rest/v1/stalls?id=eq.${numId}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(updates),
      })
    } catch (err) {
      console.error('updateStall error:', err)
    }
  },

  async createStall(stall: Omit<Stall, 'id'>): Promise<Stall> {
    const newStall: Stall = {
      id: Date.now(),
      name: stall.name,
      stall_code: stall.stall_code || `STALL-${Math.floor(10 + Math.random() * 90)}`,
      description: stall.description || '',
      is_open: stall.is_open ?? true,
      rating: stall.rating || 4.8,
      manager_id: stall.manager_id,
      created_at: new Date().toISOString(),
    }

    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/stalls`, {
        method: 'POST',
        headers: { ...headers, Prefer: 'return=representation' },
        body: JSON.stringify(newStall),
      })
      if (res.ok) {
        const created = await res.json()
        return Array.isArray(created) ? created[0] : created
      }
    } catch {}

    const stalls = await this.getStalls()
    const updated = [...stalls, newStall]
    localStorage.setItem('smartbite_stalls', JSON.stringify(updated))
    return newStall
  },

  // ==========================================
  // 3. MENU ITEMS CRUD (Staff Full CRUD)
  // ==========================================
  async getMenuItems(stallId?: number): Promise<MenuItem[]> {
    let remoteData: MenuItem[] = []
    try {
      const filter = stallId ? `&stall_id=eq.${stallId}` : ''
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/menu_items?select=*,category:categories(name)&order=id.asc${filter}`,
        { headers }
      )
      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data) && data.length > 0) {
          remoteData = data.map((item: any) => ({
            ...item,
            id: Number(item.id),
            stall_id: Number(item.stall_id),
            price: Number(item.price),
            preparation_time_minutes: Number(item.preparation_time_minutes),
            is_available: item.is_available ?? item.available ?? true,
            category: item.category?.name || item.category || 'General',
          }))
        }
      }
    } catch (err) {
      console.warn('getMenuItems notice:', err)
    }

    const saved = localStorage.getItem('smartbite_menu_items')
    let localList: MenuItem[] = []
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed)) localList = parsed
      } catch {}
    }

    if (remoteData.length > 0) {
      const merged = remoteData.map(rem => {
        const loc = localList.find(l => Number(l.id) === Number(rem.id))
        return loc ? { ...rem, ...loc } : rem
      })
      for (const loc of localList) {
        if (!merged.some(m => Number(m.id) === Number(loc.id))) {
          merged.push(loc)
        }
      }
      return stallId ? merged.filter(i => Number(i.stall_id) === Number(stallId)) : merged
    }

    if (localList.length > 0) {
      return stallId ? localList.filter(i => Number(i.stall_id) === Number(stallId)) : localList
    }

    const initialItems: MenuItem[] = [
      { id: 1, stall_id: 1, category_id: 1, category: 'Rice Meals', name: 'Chicken Adobo Bowl', description: 'Tender chicken braised in garlic-soy vinegar with jasmine rice', price: 75.00, preparation_time_minutes: 8, rating: '4.9', image_url: 'https://images.unsplash.com/photo-1562748762-77b7c4633c83?auto=format&fit=crop&w=900&q=85', is_available: true },
      { id: 2, stall_id: 1, category_id: 1, category: 'Rice Meals', name: 'Crispy Fried Chicken', description: 'Golden spiced chicken thigh with savory gravy and garlic rice', price: 85.00, preparation_time_minutes: 10, rating: '4.8', image_url: 'https://images.unsplash.com/photo-1539156340048-e86bca4fa3f7?auto=format&fit=crop&w=900&q=85', is_available: true },
      { id: 3, stall_id: 1, category_id: 1, category: 'Rice Meals', name: 'Fresh Veggie Rice Bowl', description: 'Wok-tossed market vegetables, fried tofu, and seasoned garlic rice', price: 65.00, preparation_time_minutes: 7, rating: '4.7', image_url: 'https://images.unsplash.com/photo-1657812453317-031b93301ef0?auto=format&fit=crop&w=900&q=85', is_available: true },
      { id: 4, stall_id: 1, category_id: 2, category: 'Breakfast', name: 'Beef Tapa Silog', description: 'Marinated cured beef sirloin with sunny fried egg and garlic rice', price: 80.00, preparation_time_minutes: 9, rating: '4.8', image_url: 'https://images.unsplash.com/photo-1777312820610-8d5321fd45ad?auto=format&fit=crop&w=900&q=85', is_available: true },
      { id: 5, stall_id: 2, category_id: 3, category: 'Snacks', name: 'Classic Pork Siomai', description: 'Four steamed pork-shrimp dumplings with garlic chili oil', price: 45.00, preparation_time_minutes: 5, rating: '4.9', image_url: 'https://images.unsplash.com/photo-1625980319455-985e5442c5ae?auto=format&fit=crop&w=900&q=85', is_available: true },
      { id: 6, stall_id: 2, category_id: 4, category: 'Drinks', name: 'Chilled Calamansi Juice', description: 'Freshly extracted native lime, honey, and crushed iced water', price: 30.00, preparation_time_minutes: 3, rating: '4.6', image_url: 'https://images.unsplash.com/photo-1591902060415-60a251d0ac68?auto=format&fit=crop&w=900&q=85', is_available: true },
    ]
    try {
      localStorage.setItem('smartbite_menu_items', JSON.stringify(initialItems))
    } catch {}
    return stallId ? initialItems.filter(i => Number(i.stall_id) === Number(stallId)) : initialItems
  },

  async createMenuItem(item: Omit<MenuItem, 'id'>): Promise<MenuItem> {
    const payload = {
      ...item,
      category: item.category || 'Rice Meals',
    }
    const res = await fetch(`${SUPABASE_URL}/rest/v1/menu_items`, {
      method: 'POST',
      headers: { ...headers, Prefer: 'return=representation' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      throw new Error(`Could not save product to Supabase (${res.status}): ${await res.text()}`)
    }

    const data = await res.json()
    const created = Array.isArray(data) ? data[0] : data
    if (!created) throw new Error('Supabase did not return the saved product.')
    return {
      ...created,
      id: Number(created.id),
      stall_id: Number(created.stall_id),
      price: Number(created.price),
    }
  },

  async updateMenuItem(id: number, updates: Partial<MenuItem>): Promise<void> {
    const numId = Number(id)
    const payload: any = { ...updates }
    if (typeof updates.is_available === 'boolean') {
      payload.is_available = updates.is_available
      payload.available = updates.is_available
    }
    const response = await fetch(`${SUPABASE_URL}/rest/v1/menu_items?id=eq.${numId}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(payload),
    })
    if (!response.ok) {
      throw new Error(`Could not update product in Supabase (${response.status}): ${await response.text()}`)
    }

    try {
      const all = await this.getMenuItems()
      const updated = all.map(i => (Number(i.id) === numId ? { ...i, ...updates } : i))
      localStorage.setItem('smartbite_menu_items', JSON.stringify(updated))
    } catch (err) {
      console.warn('updateMenuItem local storage notice:', err)
    }
  },

  async deleteMenuItem(id: number): Promise<void> {
    const numId = Number(id)
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/menu_items?id=eq.${numId}`, {
        method: 'DELETE',
        headers,
      })
    } catch {}

    const all = await this.getMenuItems()
    const updated = all.filter(i => Number(i.id) !== numId)
    localStorage.setItem('smartbite_menu_items', JSON.stringify(updated))
  },

  // ==========================================
  // 4. INVENTORY ITEMS CRUD (Staff Full CRUD)
  // ==========================================
  async getInventory(stallId?: number): Promise<InventoryItem[]> {
    let remoteData: InventoryItem[] = []
    try {
      const filter = stallId ? `&stall_id=eq.${stallId}` : ''
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/inventory_items?select=*&order=id.asc${filter}`,
        { headers }
      )
      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data) && data.length > 0) {
          remoteData = data.map((item: any) => ({
            id: Number(item.id),
            stall_id: Number(item.stall_id),
            item_name: item.item_name,
            unit_of_measure: item.unit_of_measure,
            current_stock: Number(item.current_stock),
            minimum_threshold: Number(item.minimum_threshold),
            reorder_quantity: Number(item.reorder_quantity || 50),
            last_restocked_at: item.last_restocked_at,
          }))
        }
      }
    } catch {}

    // Merge with locally persisted edits in localStorage so user edits never revert
    const saved = localStorage.getItem('smartbite_inventory')
    let localList: InventoryItem[] = []
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed)) localList = parsed
      } catch {}
    }

    if (remoteData.length > 0) {
      const merged = remoteData.map(rem => {
        const loc = localList.find(l => Number(l.id) === Number(rem.id))
        return loc
          ? {
              ...rem,
              current_stock: Number(loc.current_stock),
              minimum_threshold: Number(loc.minimum_threshold),
              item_name: loc.item_name || rem.item_name,
              unit_of_measure: loc.unit_of_measure || rem.unit_of_measure,
            }
          : rem
      })
      for (const loc of localList) {
        if (!merged.some(m => Number(m.id) === Number(loc.id))) {
          merged.push(loc)
        }
      }
      return stallId ? merged.filter(i => Number(i.stall_id) === Number(stallId)) : merged
    }

    if (localList.length > 0) {
      return stallId ? localList.filter(i => Number(i.stall_id) === Number(stallId)) : localList
    }

    const initial: InventoryItem[] = [
      { id: 1, stall_id: 1, item_name: 'Marinated Chicken Cuts', unit_of_measure: 'kg', current_stock: 45, minimum_threshold: 10, reorder_quantity: 50 },
      { id: 2, stall_id: 1, item_name: 'Jasmine Steamed Rice', unit_of_measure: 'kg', current_stock: 80, minimum_threshold: 15, reorder_quantity: 100 },
      { id: 3, stall_id: 1, item_name: 'Beef Tapa Cuts', unit_of_measure: 'kg', current_stock: 30, minimum_threshold: 8, reorder_quantity: 40 },
      { id: 4, stall_id: 1, item_name: 'Farm Fresh Eggs', unit_of_measure: 'pieces', current_stock: 120, minimum_threshold: 24, reorder_quantity: 150 },
      { id: 5, stall_id: 2, item_name: 'Pork Siomai Pack', unit_of_measure: 'pieces', current_stock: 200, minimum_threshold: 40, reorder_quantity: 250 },
      { id: 6, stall_id: 2, item_name: 'Fresh Calamansi Puree', unit_of_measure: 'liters', current_stock: 25, minimum_threshold: 5, reorder_quantity: 30 },
    ]
    try {
      localStorage.setItem('smartbite_inventory', JSON.stringify(initial))
    } catch {}
    return stallId ? initial.filter(i => Number(i.stall_id) === Number(stallId)) : initial
  },

  async createInventoryItem(item: Omit<InventoryItem, 'id'>): Promise<InventoryItem> {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/inventory_items`, {
        method: 'POST',
        headers: { ...headers, Prefer: 'return=representation' },
        body: JSON.stringify(item),
      })
      if (res.ok) {
        const data = await res.json()
        return Array.isArray(data) ? data[0] : data
      }
    } catch {}

    const all = await this.getInventory()
    const newItem: InventoryItem = { id: Date.now(), ...item }
    localStorage.setItem('smartbite_inventory', JSON.stringify([...all, newItem]))
    return newItem
  },

  async updateInventoryItem(id: number, updates: Partial<InventoryItem>): Promise<void> {
    const numId = Number(id)
    // 1. Immediately update localStorage so edit persists reliably
    try {
      const saved = localStorage.getItem('smartbite_inventory')
      let list: InventoryItem[] = saved ? JSON.parse(saved) : []
      if (!Array.isArray(list) || list.length === 0) {
        list = await this.getInventory()
      }
      const updated = list.map(i => (Number(i.id) === numId ? { ...i, ...updates } : i))
      localStorage.setItem('smartbite_inventory', JSON.stringify(updated))
    } catch (err) {
      console.warn('updateInventoryItem local error:', err)
    }

    // 2. Also try PATCHing remote Supabase
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/inventory_items?id=eq.${numId}`, {
        method: 'PATCH',
        headers: { ...headers, Prefer: 'return=representation' },
        body: JSON.stringify(updates),
      })
    } catch {}
  },

  async restockInventory(inventoryId: number, quantityAdded: number): Promise<any> {
    const numId = Number(inventoryId)
    let newStock = quantityAdded
    // 1. Immediately update localStorage so restock persists reliably
    try {
      const saved = localStorage.getItem('smartbite_inventory')
      let list: InventoryItem[] = saved ? JSON.parse(saved) : []
      if (!Array.isArray(list) || list.length === 0) {
        list = await this.getInventory()
      }
      const target = list.find(i => Number(i.id) === numId)
      newStock = target ? Math.max(0, Number(target.current_stock) + quantityAdded) : quantityAdded
      const updated = list.map(i => (Number(i.id) === numId ? { ...i, current_stock: newStock } : i))
      localStorage.setItem('smartbite_inventory', JSON.stringify(updated))
    } catch (err) {
      console.warn('restockInventory local error:', err)
    }

    // 2. Also try patching Supabase and RPC
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/inventory_items?id=eq.${numId}`, {
        method: 'PATCH',
        headers: { ...headers, Prefer: 'return=representation' },
        body: JSON.stringify({ current_stock: newStock }),
      })
    } catch {}

    try {
      await fetch(`${SUPABASE_URL}/rest/v1/rpc/sp_restock_inventory`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ p_inventory_id: numId, p_quantity_added: quantityAdded }),
      })
    } catch {}

    return { ok: true, current_stock: newStock }
  },

  // ==========================================
  // 5. ORDERS & ATOMIC TRANSACTIONS
  // ==========================================
  async placeOrder(
    order: {
      order_id: string
      student_id?: string | null
      stall_id: number
      student_number: string
      student_name: string
      payment_method: string
    },
    items: Array<{
      menu_item_id: number
      quantity: number
      unit_price: number
      special_instructions?: string
    }>
  ): Promise<any> {
    // 1. Deduct ingredient stock in inventory immediately
    try {
      const savedInv = localStorage.getItem('smartbite_inventory')
      let invList: InventoryItem[] = savedInv ? JSON.parse(savedInv) : []
      if (!Array.isArray(invList) || invList.length === 0) {
        invList = await this.getInventory()
      }
      const { updatedInventory, deductions } = deductInventoryStock(invList, items)
      localStorage.setItem('smartbite_inventory', JSON.stringify(updatedInventory))

      // Patch remote Supabase for each deducted item in the background
      for (const [invIdStr, deductQty] of Object.entries(deductions)) {
        const invId = Number(invIdStr)
        const updatedItem = updatedInventory.find(i => Number(i.id) === invId)
        if (updatedItem && deductQty > 0) {
          fetch(`${SUPABASE_URL}/rest/v1/inventory_items?id=eq.${invId}`, {
            method: 'PATCH',
            headers,
            body: JSON.stringify({ current_stock: updatedItem.current_stock }),
          }).catch(() => {})
        }
      }
    } catch (err) {
      console.warn('placeOrder stock deduction notice:', err)
    }

    try {
      const rpcRes = await fetch(`${SUPABASE_URL}/rest/v1/rpc/sp_place_canteen_order`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          p_order_id: order.order_id,
          p_student_id: order.student_id || null,
          p_stall_id: order.stall_id,
          p_student_number: order.student_number,
          p_student_name: order.student_name,
          p_payment_method: order.payment_method,
          p_items: items,
        }),
      })
      if (rpcRes.ok) return await rpcRes.json()
    } catch {}

    // Direct insertion fallback
    const subtotal = items.reduce((sum, i) => sum + i.unit_price * i.quantity, 0)
    const orderHeader: OrderRecord = {
      id: order.order_id,
      student_id: order.student_id || null,
      stall_id: order.stall_id,
      student_number: order.student_number,
      student_name: order.student_name,
      subtotal,
      service_fee: 0.0,
      total_amount: subtotal,
      order_status: 'Order placed',
      pickup_time: '8–12 minutes',
      payment_method: order.payment_method,
      payment_status: 'pending',
      created_at: new Date().toISOString(),
      order_items: items.map(i => ({
        menu_item_id: i.menu_item_id,
        item_name: `Item #${i.menu_item_id}`,
        quantity: i.quantity,
        unit_price: i.unit_price,
        item_subtotal: i.unit_price * i.quantity,
      })),
    }

    try {
      await fetch(`${SUPABASE_URL}/rest/v1/orders`, {
        method: 'POST',
        headers: { ...headers, Prefer: 'return=representation' },
        body: JSON.stringify(orderHeader),
      })
    } catch {}

    const saved = localStorage.getItem('smartbite_orders')
    const list: OrderRecord[] = saved ? JSON.parse(saved) : []
    localStorage.setItem('smartbite_orders', JSON.stringify([orderHeader, ...list]))
    return orderHeader
  },

  async getOrders(options?: { studentNumber?: string; stallId?: number }): Promise<OrderRecord[]> {
    try {
      const params = new URLSearchParams()
      params.set('select', '*,order_items(*)')
      params.set('order', 'created_at.desc')
      params.set('limit', '40')
      if (options?.studentNumber) params.set('student_number', `eq.${options.studentNumber}`)
      if (options?.stallId) params.set('stall_id', `eq.${options.stallId}`)

      const res = await fetch(`${SUPABASE_URL}/rest/v1/orders?${params.toString()}`, { headers })
      if (res.ok) {
        const data = await res.json()
        if (data && data.length > 0) return data
      }
    } catch {}

    const saved = localStorage.getItem('smartbite_orders')
    if (saved) {
      try {
        let list: OrderRecord[] = JSON.parse(saved)
        if (options?.studentNumber) list = list.filter(o => o.student_number === options.studentNumber)
        if (options?.stallId) list = list.filter(o => o.stall_id === options.stallId)
        return list
      } catch {}
    }
    return []
  },

  async updateOrderStatus(orderId: string, newStatus: OrderRecord['order_status']): Promise<void> {
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/rpc/sp_update_order_status`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ p_order_id: orderId, p_new_status: newStatus }),
      })
    } catch {}

    const saved = localStorage.getItem('smartbite_orders')
    if (saved) {
      try {
        const list: OrderRecord[] = JSON.parse(saved)
        const updated = list.map(o => (o.id === orderId ? { ...o, order_status: newStatus } : o))
        localStorage.setItem('smartbite_orders', JSON.stringify(updated))
      } catch {}
    }
  },

  // ==========================================
  // 6. AUDIT LOGS & ANALYTICS VIEWS
  // ==========================================
  async getAuditLogs(limit = 25): Promise<AuditLog[]> {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/audit_logs?select=*&order=created_at.desc&limit=${limit}`, { headers })
      if (res.ok) return await res.json()
    } catch {}
    return []
  },

  async getSalesAnalytics(): Promise<any[]> {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/v_stall_sales_analytics?select=*`, { headers })
      if (res.ok) return await res.json()
    } catch {}
    return [
      { stall_id: 1, stall_name: 'SmartBite Main Kitchen', total_orders: 12, total_revenue: 960, average_order_value: 80, pending_orders: 2 },
      { stall_id: 2, stall_name: 'The Snack Bar & Drinks', total_orders: 8, total_revenue: 340, average_order_value: 42.5, pending_orders: 1 },
    ]
  },

  async getLowStockAlerts(): Promise<any[]> {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/v_low_stock_alerts?select=*`, { headers })
      if (res.ok) return await res.json()
    } catch {}
    return []
  },
}
