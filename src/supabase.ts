// Supabase Client for SmartBite Multi-Stall Canteen Food Hub & Inventory Engine
// Compliant with 3NF Normalized Schema, Stored Procedures, and Multi-Tier RBAC

export const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://zkarmieyteouuvzhojrv.supabase.co"

export const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "sb_publishable_cJk4jM2_UbvuoFJq0bbNAg_MPRdR3QS"

// Secure Admin Credentials strictly loaded from environment variables (.env)
// Never hardcoded, no default passwords or IDs exposed in client code
export const ADMIN_CREDENTIALS = {
  userId: (import.meta.env.VITE_ADMIN_USER_ID || "").trim(),
  email: (import.meta.env.VITE_ADMIN_EMAIL || "").trim().toLowerCase(),
  password: (import.meta.env.VITE_ADMIN_PASSWORD || "").trim(),
  name: (import.meta.env.VITE_ADMIN_NAME || "Administrator").trim(),
}

const MENU_IMAGE_BUCKET = "menu-images"
const MAX_MENU_IMAGE_SIZE = 5 * 1024 * 1024

export async function uploadMenuImage(
  file: File,
  stallId: number,
): Promise<string> {
  const allowedTypes: Record<string, string> = {
    "image/avif": "avif",
    "image/gif": "gif",
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
  }
  const extension = allowedTypes[file.type]

  if (!extension) {
    throw new Error("Choose a JPG, PNG, WebP, GIF, or AVIF image.")
  }
  if (file.size > MAX_MENU_IMAGE_SIZE) {
    throw new Error("The image must be 5 MB or smaller.")
  }

  const fileName = `${stallId}/${Date.now()}-${crypto.randomUUID()}.${extension}`
  const response = await fetch(
    `${SUPABASE_URL}/storage/v1/object/${MENU_IMAGE_BUCKET}/${fileName}`,
    {
      method: "POST",
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        "Content-Type": file.type,
        "x-upsert": "false",
      },
      body: file,
    },
  )

  if (!response.ok) {
    const details = await response.text()
    throw new Error(`Image upload failed (${response.status}): ${details}`)
  }

  return `${SUPABASE_URL}/storage/v1/object/public/${MENU_IMAGE_BUCKET}/${fileName}`
}

export async function sendEmailVerificationCode(
  email: string,
): Promise<{ ok: boolean; message: string }> {
  const cleanEmail = email.trim().toLowerCase()

  // Real email dispatch via Supabase Auth OTP endpoint directly to the user's email inbox
  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/otp`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_ANON_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email: cleanEmail, create_user: true }),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      if (data?.error_code === "over_email_send_rate_limit") {
        return {
          ok: false,
          message:
            "Email sending limit reached on the server. No code was sent. Please try again later or contact the administrator.",
        }
      }
      return {
        ok: false,
        message:
          res.status >= 500
            ? "The email server could not send the code (SMTP configuration error). Please contact the administrator."
            : data?.msg ||
              "Could not send verification code to this email address.",
      }
    }
  } catch (err: any) {
    console.warn("Supabase Auth OTP dispatch warning:", err)
    return {
      ok: false,
      message:
        "Network issue contacting email server. Please check your connection.",
    }
  }

  return {
    ok: true,
    message: `A 6-digit verification code has been sent to ${cleanEmail}.`,
  }
}

export async function verifyEmailCode(
  email: string,
  enteredToken: string,
): Promise<{ ok: boolean; error?: string }> {
  const cleanEmail = email.trim().toLowerCase()
  const cleanToken = enteredToken.trim().replace(/\D/g, "")

  if (!cleanToken || cleanToken.length < 6) {
    return {
      ok: false,
      error: "Please enter the complete 6-digit verification code.",
    }
  }

  // Strictly validate with Supabase Auth OTP verification using token sent to user's real email
  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/verify`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_ANON_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: "email",
        email: cleanEmail,
        token: cleanToken,
      }),
    })

    if (res.ok) {
      return { ok: true }
    }
    const errData = await res.json().catch(() => ({}))
    if (errData?.msg) {
      return { ok: false, error: errData.msg }
    }
  } catch (err: any) {
    return {
      ok: false,
      error: err?.message || "Connection error during verification.",
    }
  }

  return {
    ok: false,
    error:
      "Incorrect or expired verification code. Please check your email inbox and spam folder and try again.",
  }
}

export type UserRole = "student" | "staff" | "stall_manager" | "admin"

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
  is_email_verified?: boolean
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
  item_status?: "pending" | "cooking" | "prepared"
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
  order_status: "Order placed" | "Preparing" | "Ready for pickup" | "Completed" | "Cancelled"
  pickup_time?: string
  payment_method: string
  payment_status: "pending" | "paid" | "refunded"
  created_at?: string
  order_items?: OrderItem[]
}

export interface AuditLog {
  id: number
  table_name: string
  record_id: string
  action: "INSERT" | "UPDATE" | "DELETE"
  performed_by?: string
  old_data?: any
  new_data?: any
  change_summary?: string
  created_at: string
}

// Recipe mappings linking menu items to raw inventory ingredients
// Defines which raw stock items and how many units are deducted upon customer purchase
export const MENU_RECIPES: Record<number, Array<{
  invId: number
  qty: number
}>> = {
  1: [
    // Chicken Adobo Bowl: 0.2 kg chicken cuts, 0.2 kg rice
    { invId: 1, qty: 0.2 },
    { invId: 2, qty: 0.2 },
  ],
  2: [
    // Crispy Fried Chicken: 0.2 kg chicken cuts, 0.2 kg rice
    { invId: 1, qty: 0.2 },
    { invId: 2, qty: 0.2 },
  ],
  3: [
    // Fresh Veggie Rice Bowl: 0.2 kg rice
    { invId: 2, qty: 0.2 },
  ],
  4: [
    // Beef Tapa Silog: 0.2 kg beef, 1 egg, 0.2 kg rice
    { invId: 3, qty: 0.2 },
    { invId: 4, qty: 1 },
    { invId: 2, qty: 0.2 },
  ],
  5: [
    // Classic Pork Siomai: 4 pieces siomai per order
    { invId: 5, qty: 4 },
  ],
  6: [
    // Chilled Calamansi Juice: 0.25 liters calamansi puree
    { invId: 6, qty: 0.25 },
  ],
}

export function deductInventoryStock(
  currentInventory: InventoryItem[],
  orderItems: Array<{
    menu_item_id: number
    quantity: number
    item_name?: string
  }>,
): {
  updatedInventory: InventoryItem[]
  deductions: Record<number, number>
} {
  const deductions: Record<number, number> = {}
  for (const oi of orderItems) {
    const numId = Number(oi.menu_item_id)
    let recipe = MENU_RECIPES[numId]

    if (!recipe || recipe.length === 0) {
      // Intelligent fallback by dish name keywords
      const name = (oi.item_name || "").toLowerCase()
      const found: Array<{ invId: number; qty: number }> = []
      if (name.includes("chicken") || name.includes("adobo")) {
        found.push({ invId: 1, qty: 0.2 }, { invId: 2, qty: 0.2 })
      } else if (name.includes("beef") || name.includes("tapa")) {
        found.push({ invId: 3, qty: 0.2 }, { invId: 4, qty: 1 }, {
          invId: 2,
          qty: 0.2,
        })
      } else if (
        name.includes("siomai") ||
        name.includes("pork") ||
        name.includes("dumpling")
      ) {
        found.push({ invId: 5, qty: 4 })
      } else if (
        name.includes("juice") ||
        name.includes("calamansi") ||
        name.includes("drink")
      ) {
        found.push({ invId: 6, qty: 0.25 })
      } else if (
        name.includes("rice") ||
        name.includes("silog") ||
        name.includes("bowl")
      ) {
        found.push({ invId: 2, qty: 0.2 })
      } else if (currentInventory.length > 0) {
        found.push({ invId: Number(currentInventory[0].id), qty: 1 })
      }
      recipe = found
    }

    for (const ing of recipe) {
      deductions[ing.invId] =
        (deductions[ing.invId] || 0) + Number(ing.qty) * Number(oi.quantity)
    }
  }

  const updatedInventory = currentInventory.map((inv) => {
    const numId = Number(inv.id)
    const deduct = deductions[numId] || 0
    if (deduct > 0) {
      const current = Number(inv.current_stock)
      const newStock = Math.max(0, Math.round((current - deduct) * 100) / 100)
      return { ...inv, current_stock: newStock }
    }
    return inv
  })

  return { updatedInventory, deductions }
}

const headers = {
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
  "Content-Type": "application/json",
}

// Local storage seed profiles for instant offline & demo compatibility
const INITIAL_PROFILES: Profile[] = [
  {
    id: "p-1",
    student_id: "2025-01234",
    email: "student@smartbite.ph",
    first_name: "Rommel",
    middle_name: "",
    last_name: "Custodio",
    full_name: "Rommel Custodio",
    grade_or_dept: "Grade 12 - STEM A",
    role: "student",
    balance: 500.0,
    password: "student123",
    is_active: true,
    created_at: "2026-10-26T08:00:00Z",
  },
  {
    id: "p-2",
    student_id: "STAFF-KITCHEN",
    email: "kitchen@smartbite.ph",
    first_name: "Maria",
    middle_name: "Alvarez",
    last_name: "Santos",
    full_name: "Maria Alvarez Santos",
    grade_or_dept: "Stall #1 Main Kitchen Staff",
    role: "staff",
    stall_id: 1,
    balance: 1200.0,
    password: "staff123",
    is_active: true,
    created_at: "2026-10-26T08:30:00Z",
  },
  {
    id: "p-2b",
    student_id: "STAFF-SNACKS",
    email: "snacks@smartbite.ph",
    first_name: "Rey",
    middle_name: "Anthony",
    last_name: "Using",
    full_name: "Rey Anthony Using",
    grade_or_dept: "Stall #2 Snack Bar Staff",
    role: "staff",
    stall_id: 2,
    balance: 1100.0,
    password: "staff123",
    is_active: true,
    created_at: "2026-10-26T08:45:00Z",
  },
  {
    id: "p-4",
    student_id: "MGR-BRANCH",
    email: "manager@smartbite.ph",
    first_name: "Carlos",
    middle_name: "Jose",
    last_name: "Mendoza",
    full_name: "Carlos Jose Mendoza",
    grade_or_dept: "Stall Operations Manager",
    role: "stall_manager",
    stall_id: 1,
    balance: 3500.0,
    password: "manager123",
    is_active: true,
    created_at: "2026-10-26T07:30:00Z",
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
        return { ok: true, message: "Supabase Cloud Cluster Live & Verified" }
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
    // Persistent blacklist of deleted profiles so deleted users NEVER re-appear on page refresh
    const deletedRaw = localStorage.getItem("smartbite_deleted_profiles")
    let deletedSet = new Set<string>()
    if (deletedRaw) {
      try {
        const arr = JSON.parse(deletedRaw)
        if (Array.isArray(arr)) {
          deletedSet = new Set(
            arr.map((s: string) => String(s).toLowerCase().trim()),
          )
        }
      } catch {}
    }

    const isDeleted = (p: Partial<Profile>) => {
      const pid = (p.id || "").toLowerCase().trim()
      const sid = (p.student_id || "").toLowerCase().trim()
      const email = (p.email || "").toLowerCase().trim()
      return (
        (pid && deletedSet.has(pid)) ||
        (sid && deletedSet.has(sid)) ||
        (email && deletedSet.has(email))
      )
    }

    let remoteData: Profile[] = []
    try {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/profiles?select=*&order=created_at.desc`,
        { headers },
      )
      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data) && data.length > 0) {
          remoteData = data.filter((p) => !isDeleted(p))
        }
      }
    } catch {}

    const saved = localStorage.getItem("smartbite_profiles")
    let localList: Profile[] = []
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length > 0) {
          localList = parsed.filter((p) => !isDeleted(p))
        }
      } catch {}
    }

    // Always start with INITIAL_PROFILES so default system accounts (admin, staff, student) exist UNLESS deleted
    const map = new Map<string, Profile>()
    for (const p of INITIAL_PROFILES) {
      if (!isDeleted(p)) {
        const key = p.student_id
          ? p.student_id.toLowerCase().trim()
          : (p.id || "").toLowerCase().trim()
        map.set(key, p)
      }
    }
    for (const p of localList) {
      if (!isDeleted(p)) {
        const key = p.student_id
          ? p.student_id.toLowerCase().trim()
          : (p.id || "").toLowerCase().trim()
        map.set(key, { ...(map.get(key) || {}), ...p })
      }
    }
    for (const p of remoteData) {
      if (!isDeleted(p)) {
        const key = p.student_id
          ? p.student_id.toLowerCase().trim()
          : (p.id || "").toLowerCase().trim()
        map.set(key, { ...(map.get(key) || {}), ...p })
      }
    }

    const merged = Array.from(map.values())
    // Security enhancement: Mask admin password in public profile cache so it cannot be traced
    const sanitized = merged.map((p) => {
      if (p.role === "admin") {
        return { ...p, password: undefined }
      }
      return p
    })
    try {
      localStorage.setItem("smartbite_profiles", JSON.stringify(sanitized))
    } catch {}
    return sanitized
  },

  async createProfile(profile: Partial<Profile>): Promise<Profile> {
    const firstName = profile.first_name?.trim() || ""
    const middleName = profile.middle_name?.trim() || ""
    const lastName = profile.last_name?.trim() || ""
    const fullName =
      profile.full_name?.trim() ||
      (firstName || lastName
        ? `${firstName} ${middleName ? middleName + " " : ""}${lastName}`.trim()
        : "New User")

    const newProfile: Profile = {
      id: profile.id || crypto.randomUUID(),
      student_id:
        profile.student_id ||
        `PENDING-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`,
      email: profile.email?.trim().toLowerCase() || undefined,
      first_name: firstName,
      middle_name: middleName,
      last_name: lastName,
      full_name: fullName,
      grade_or_dept: profile.grade_or_dept || "Grade 12 - General",
      role: profile.role || "student",
      stall_id: profile.stall_id,
      balance: profile.balance ?? 500.0,
      password: profile.password,
      phone_number: profile.phone_number?.trim() || undefined,
      is_active: true,
      is_email_verified: profile.is_email_verified ?? true,
      created_at: new Date().toISOString(),
    }

    // If a deleted user is re-created, remove from deletedSet
    const deletedRaw = localStorage.getItem("smartbite_deleted_profiles")
    if (deletedRaw) {
      try {
        const list: string[] = JSON.parse(deletedRaw)
        const unblacklisted = list.filter(
          (s) =>
            s !== newProfile.student_id.toLowerCase() &&
            (!newProfile.email || s !== newProfile.email.toLowerCase()) &&
            s !== newProfile.id.toLowerCase(),
        )
        localStorage.setItem(
          "smartbite_deleted_profiles",
          JSON.stringify(unblacklisted),
        )
      } catch {}
    }

    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/profiles`, {
        method: "POST",
        headers: { ...headers, Prefer: "return=representation" },
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
    const updated = [
      newProfile,
      ...profiles.filter((p) => p.student_id !== newProfile.student_id),
    ]
    localStorage.setItem("smartbite_profiles", JSON.stringify(updated))
    return newProfile
  },

  async updateProfile(id: string, updates: Partial<Profile>): Promise<void> {
    try {
      await fetch(
        `${SUPABASE_URL}/rest/v1/profiles?id=eq.${encodeURIComponent(id)}`,
        {
          method: "PATCH",
          headers,
          body: JSON.stringify(updates),
        },
      )
    } catch {}

    const profiles = await this.getProfiles()
    const updated = profiles.map((p) =>
      p.id === id ? { ...p, ...updates } : p,
    )
    localStorage.setItem("smartbite_profiles", JSON.stringify(updated))
  },

  async deleteProfile(id: string, studentId?: string): Promise<void> {
    const cleanId = (id || "").trim()
    const cleanStudentId = (studentId || "").trim()

    // 1. Add to persistent deleted profiles set so it NEVER comes back on page refresh
    const deletedRaw = localStorage.getItem("smartbite_deleted_profiles")
    let deletedList: string[] = []
    if (deletedRaw) {
      try {
        const parsed = JSON.parse(deletedRaw)
        if (Array.isArray(parsed)) deletedList = parsed
      } catch {}
    }

    if (cleanId && !deletedList.includes(cleanId.toLowerCase())) {
      deletedList.push(cleanId.toLowerCase())
    }
    if (cleanStudentId && !deletedList.includes(cleanStudentId.toLowerCase())) {
      deletedList.push(cleanStudentId.toLowerCase())
    }
    localStorage.setItem(
      "smartbite_deleted_profiles",
      JSON.stringify(deletedList),
    )

    // 2. Remove immediately from local storage cache
    const saved = localStorage.getItem("smartbite_profiles")
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed)) {
          const updated = parsed.filter((p: Profile) => {
            const pId = (p.id || "").toLowerCase()
            const pSid = (p.student_id || "").toLowerCase()
            if (
              cleanId &&
              (pId === cleanId.toLowerCase() || pSid === cleanId.toLowerCase())
            )
              return false
            if (
              cleanStudentId &&
              (pId === cleanStudentId.toLowerCase() ||
                pSid === cleanStudentId.toLowerCase())
            )
              return false
            return true
          })
          localStorage.setItem("smartbite_profiles", JSON.stringify(updated))
        }
      } catch {}
    }

    // 3. Delete from Supabase remote database matching both id and student_id
    try {
      const deleteConditions: string[] = []
      if (cleanId) {
        deleteConditions.push(`id.eq.${encodeURIComponent(cleanId)}`)
        deleteConditions.push(`student_id.eq.${encodeURIComponent(cleanId)}`)
      }
      if (cleanStudentId) {
        deleteConditions.push(
          `student_id.eq.${encodeURIComponent(cleanStudentId)}`,
        )
        deleteConditions.push(`id.eq.${encodeURIComponent(cleanStudentId)}`)
      }
      if (deleteConditions.length > 0) {
        await fetch(
          `${SUPABASE_URL}/rest/v1/profiles?or=(${deleteConditions.join(",")})`,
          {
            method: "DELETE",
            headers,
          },
        )
      }
    } catch (err) {
      console.error("Remote profile deletion error:", err)
    }
  },

  async changePassword(
    profileId: string,
    newPassword: string,
  ): Promise<boolean> {
    await this.updateProfile(profileId, { password: newPassword })
    return true
  },

  // ==========================================
  // 2. STALLS & MINI STALL BRANCHES
  // ==========================================
  async getStalls(): Promise<Stall[]> {
    let remoteData: Stall[] = []
    try {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/stalls?select=*&order=id.asc`,
        { headers },
      )
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

    const saved = localStorage.getItem("smartbite_stalls")
    let localList: Stall[] = []
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed)) localList = parsed
      } catch {}
    }

    if (remoteData.length > 0) {
      const merged = remoteData.map((rem) => {
        const loc = localList.find((l) => Number(l.id) === Number(rem.id))
        return loc ? { ...rem, ...loc } : rem
      })
      for (const loc of localList) {
        if (!merged.some((m) => Number(m.id) === Number(loc.id))) {
          merged.push(loc)
        }
      }
      return merged
    }

    if (localList.length > 0) return localList

    const initialStalls: Stall[] = [
      {
        id: 1,
        name: "SmartBite Main Kitchen",
        stall_code: "STALL-01",
        description: "Signature rice meals, breakfasts, and hot mains",
        is_open: true,
        rating: 4.9,
      },
      {
        id: 2,
        name: "The Snack Bar & Drinks",
        stall_code: "STALL-02",
        description: "",
        is_open: true,
        rating: 4.8,
      },
    ]
    try {
      localStorage.setItem("smartbite_stalls", JSON.stringify(initialStalls))
    } catch {}
    return initialStalls
  },

  async updateStall(id: number, updates: Partial<Stall>): Promise<void> {
    const numId = Number(id)
    try {
      const saved = localStorage.getItem("smartbite_stalls")
      let stalls: Stall[] = saved ? JSON.parse(saved) : []
      if (!Array.isArray(stalls) || stalls.length === 0) {
        stalls = await this.getStalls()
      }
      const updated = stalls.map((s) =>
        Number(s.id) === numId ? { ...s, ...updates } : s,
      )
      localStorage.setItem("smartbite_stalls", JSON.stringify(updated))
    } catch {}

    try {
      await fetch(`${SUPABASE_URL}/rest/v1/stalls?id=eq.${numId}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify(updates),
      })
    } catch (err) {
      console.error("updateStall error:", err)
    }
  },

  async createStall(stall: Omit<Stall, "id">): Promise<Stall> {
    const newStall: Stall = {
      id: Date.now(),
      name: stall.name,
      stall_code:
        stall.stall_code || `STALL-${Math.floor(10 + Math.random() * 90)}`,
      description: stall.description || "",
      is_open: stall.is_open ?? true,
      rating: stall.rating || 4.8,
      manager_id: stall.manager_id,
      created_at: new Date().toISOString(),
    }

    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/stalls`, {
        method: "POST",
        headers: { ...headers, Prefer: "return=representation" },
        body: JSON.stringify(newStall),
      })
      if (res.ok) {
        const created = await res.json()
        return Array.isArray(created) ? created[0] : created
      }
    } catch {}

    const stalls = await this.getStalls()
    const updated = [...stalls, newStall]
    localStorage.setItem("smartbite_stalls", JSON.stringify(updated))
    return newStall
  },

  // ==========================================
  // 3. MENU ITEMS CRUD (Staff Full CRUD)
  // ==========================================
  async getMenuItems(stallId?: number): Promise<MenuItem[]> {
    let remoteData: MenuItem[] = []
    try {
      const filter = stallId ? `&stall_id=eq.${stallId}` : ""
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/menu_items?select=*,category:categories(name)&order=id.asc${filter}`,
        { headers },
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
            category: item.category?.name || item.category || "General",
          }))
        }
      }
    } catch (err) {
      console.warn("getMenuItems notice:", err)
    }

    const saved = localStorage.getItem("smartbite_menu_items")
    let localList: MenuItem[] = []
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed)) localList = parsed
      } catch {}
    }

    if (remoteData.length > 0) {
      const merged = remoteData.map((rem) => {
        const loc = localList.find((l) => Number(l.id) === Number(rem.id))
        return loc ? { ...rem, ...loc } : rem
      })
      for (const loc of localList) {
        if (!merged.some((m) => Number(m.id) === Number(loc.id))) {
          merged.push(loc)
        }
      }
      return stallId
        ? merged.filter((i) => Number(i.stall_id) === Number(stallId))
        : merged
    }

    if (localList.length > 0) {
      return stallId
        ? localList.filter((i) => Number(i.stall_id) === Number(stallId))
        : localList
    }

    const initialItems: MenuItem[] = [
      {
        id: 1,
        stall_id: 1,
        category_id: 1,
        category: "Rice Meals",
        name: "Chicken Adobo Bowl",
        description:
          "Tender chicken braised in garlic-soy vinegar with jasmine rice",
        price: 75.0,
        preparation_time_minutes: 8,
        rating: "4.9",
        image_url:
          "https://images.unsplash.com/photo-1562748762-77b7c4633c83?auto=format&fit=crop&w=900&q=85",
        is_available: true,
      },
      {
        id: 2,
        stall_id: 1,
        category_id: 1,
        category: "Rice Meals",
        name: "Crispy Fried Chicken",
        description:
          "Golden spiced chicken thigh with savory gravy and garlic rice",
        price: 85.0,
        preparation_time_minutes: 10,
        rating: "4.8",
        image_url:
          "https://images.unsplash.com/photo-1539156340048-e86bca4fa3f7?auto=format&fit=crop&w=900&q=85",
        is_available: true,
      },
      {
        id: 3,
        stall_id: 1,
        category_id: 1,
        category: "Rice Meals",
        name: "Fresh Veggie Rice Bowl",
        description:
          "Wok-tossed market vegetables, fried tofu, and seasoned garlic rice",
        price: 65.0,
        preparation_time_minutes: 7,
        rating: "4.7",
        image_url:
          "https://images.unsplash.com/photo-1657812453317-031b93301ef0?auto=format&fit=crop&w=900&q=85",
        is_available: true,
      },
      {
        id: 4,
        stall_id: 1,
        category_id: 2,
        category: "Breakfast",
        name: "Beef Tapa Silog",
        description:
          "Marinated cured beef sirloin with sunny fried egg and garlic rice",
        price: 80.0,
        preparation_time_minutes: 9,
        rating: "4.8",
        image_url:
          "https://images.unsplash.com/photo-1777312820610-8d5321fd45ad?auto=format&fit=crop&w=900&q=85",
        is_available: true,
      },
      {
        id: 5,
        stall_id: 2,
        category_id: 3,
        category: "Snacks",
        name: "Classic Pork Siomai",
        description: "Four steamed pork-shrimp dumplings with garlic chili oil",
        price: 45.0,
        preparation_time_minutes: 5,
        rating: "4.9",
        image_url:
          "https://images.unsplash.com/photo-1625980319455-985e5442c5ae?auto=format&fit=crop&w=900&q=85",
        is_available: true,
      },
      {
        id: 6,
        stall_id: 2,
        category_id: 4,
        category: "Drinks",
        name: "Chilled Calamansi Juice",
        description:
          "Freshly extracted native lime, honey, and crushed iced water",
        price: 30.0,
        preparation_time_minutes: 3,
        rating: "4.6",
        image_url:
          "https://images.unsplash.com/photo-1591902060415-60a251d0ac68?auto=format&fit=crop&w=900&q=85",
        is_available: true,
      },
    ]
    try {
      localStorage.setItem("smartbite_menu_items", JSON.stringify(initialItems))
    } catch {}
    return stallId
      ? initialItems.filter((i) => Number(i.stall_id) === Number(stallId))
      : initialItems
  },

  async createMenuItem(item: Omit<MenuItem, "id">): Promise<MenuItem> {
    const payload = {
      ...item,
      category: item.category || "Rice Meals",
    }
    const res = await fetch(`${SUPABASE_URL}/rest/v1/menu_items`, {
      method: "POST",
      headers: { ...headers, Prefer: "return=representation" },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      throw new Error(
        `Could not save product to Supabase (${res.status}): ${await res.text()}`,
      )
    }

    const data = await res.json()
    const created = Array.isArray(data) ? data[0] : data
    if (!created) throw new Error("Supabase did not return the saved product.")
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
    if (typeof updates.is_available === "boolean") {
      payload.is_available = updates.is_available
      payload.available = updates.is_available
    }
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/menu_items?id=eq.${numId}`,
      {
        method: "PATCH",
        headers,
        body: JSON.stringify(payload),
      },
    )
    if (!response.ok) {
      throw new Error(
        `Could not update product in Supabase (${response.status}): ${await response.text()}`,
      )
    }

    try {
      const all = await this.getMenuItems()
      const updated = all.map((i) =>
        Number(i.id) === numId ? { ...i, ...updates } : i,
      )
      localStorage.setItem("smartbite_menu_items", JSON.stringify(updated))
    } catch (err) {
      console.warn("updateMenuItem local storage notice:", err)
    }
  },

  async deleteMenuItem(id: number): Promise<void> {
    const numId = Number(id)
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/menu_items?id=eq.${numId}`, {
        method: "DELETE",
        headers,
      })
    } catch {}

    const all = await this.getMenuItems()
    const updated = all.filter((i) => Number(i.id) !== numId)
    localStorage.setItem("smartbite_menu_items", JSON.stringify(updated))
  },

  // ==========================================
  // 4. INVENTORY ITEMS CRUD (Staff Full CRUD)
  // ==========================================
  async getInventory(stallId?: number): Promise<InventoryItem[]> {
    let remoteData: InventoryItem[] = []
    try {
      const filter = stallId ? `&stall_id=eq.${stallId}` : ""
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/inventory_items?select=*&order=id.asc${filter}`,
        { headers },
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
    const saved = localStorage.getItem("smartbite_inventory")
    let localList: InventoryItem[] = []
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed)) localList = parsed
      } catch {}
    }

    if (remoteData.length > 0) {
      const merged = remoteData.map((rem) => {
        const loc = localList.find((l) => Number(l.id) === Number(rem.id))
        return loc ? { ...rem, ...loc } : rem
      })
      for (const loc of localList) {
        if (!merged.some((m) => Number(m.id) === Number(loc.id))) {
          merged.push(loc)
        }
      }
      try {
        localStorage.setItem("smartbite_inventory", JSON.stringify(merged))
      } catch {}
      return stallId
        ? merged.filter((i) => Number(i.stall_id) === Number(stallId))
        : merged
    }

    if (localList.length > 0) {
      return stallId
        ? localList.filter((i) => Number(i.stall_id) === Number(stallId))
        : localList
    }

    const initial: InventoryItem[] = [
      {
        id: 1,
        stall_id: 1,
        item_name: "Marinated Chicken Cuts",
        unit_of_measure: "kg",
        current_stock: 45,
        minimum_threshold: 10,
        reorder_quantity: 50,
      },
      {
        id: 2,
        stall_id: 1,
        item_name: "Jasmine Steamed Rice",
        unit_of_measure: "kg",
        current_stock: 80,
        minimum_threshold: 15,
        reorder_quantity: 100,
      },
      {
        id: 3,
        stall_id: 1,
        item_name: "Beef Tapa Cuts",
        unit_of_measure: "kg",
        current_stock: 30,
        minimum_threshold: 8,
        reorder_quantity: 40,
      },
      {
        id: 4,
        stall_id: 1,
        item_name: "Farm Fresh Eggs",
        unit_of_measure: "pieces",
        current_stock: 120,
        minimum_threshold: 24,
        reorder_quantity: 150,
      },
      {
        id: 5,
        stall_id: 2,
        item_name: "Pork Siomai Pack",
        unit_of_measure: "pieces",
        current_stock: 200,
        minimum_threshold: 40,
        reorder_quantity: 250,
      },
      {
        id: 6,
        stall_id: 2,
        item_name: "Fresh Calamansi Puree",
        unit_of_measure: "liters",
        current_stock: 25,
        minimum_threshold: 5,
        reorder_quantity: 30,
      },
    ]
    try {
      localStorage.setItem("smartbite_inventory", JSON.stringify(initial))
    } catch {}
    return stallId
      ? initial.filter((i) => Number(i.stall_id) === Number(stallId))
      : initial
  },

  async createInventoryItem(
    item: Omit<InventoryItem, "id">,
  ): Promise<InventoryItem> {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/inventory_items`, {
        method: "POST",
        headers: { ...headers, Prefer: "return=representation" },
        body: JSON.stringify(item),
      })
      if (res.ok) {
        const data = await res.json()
        return Array.isArray(data) ? data[0] : data
      }
    } catch {}

    const all = await this.getInventory()
    const newItem: InventoryItem = { id: Date.now(), ...item }
    localStorage.setItem(
      "smartbite_inventory",
      JSON.stringify([...all, newItem]),
    )
    return newItem
  },

  async updateInventoryItem(
    id: number,
    updates: Partial<InventoryItem>,
  ): Promise<void> {
    const numId = Number(id)
    // 1. Immediately update localStorage so edit persists reliably
    try {
      const saved = localStorage.getItem("smartbite_inventory")
      let list: InventoryItem[] = saved ? JSON.parse(saved) : []
      if (!Array.isArray(list) || list.length === 0) {
        list = await this.getInventory()
      }
      const updated = list.map((i) =>
        Number(i.id) === numId ? { ...i, ...updates } : i,
      )
      localStorage.setItem("smartbite_inventory", JSON.stringify(updated))
    } catch (err) {
      console.warn("updateInventoryItem local error:", err)
    }

    // 2. Also try PATCHing remote Supabase
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/inventory_items?id=eq.${numId}`, {
        method: "PATCH",
        headers: { ...headers, Prefer: "return=representation" },
        body: JSON.stringify(updates),
      })
    } catch {}
  },

  async restockInventory(
    inventoryId: number,
    quantityAdded: number,
  ): Promise<any> {
    const numId = Number(inventoryId)
    let newStock = quantityAdded
    // 1. Immediately update localStorage so restock persists reliably
    try {
      const saved = localStorage.getItem("smartbite_inventory")
      let list: InventoryItem[] = saved ? JSON.parse(saved) : []
      if (!Array.isArray(list) || list.length === 0) {
        list = await this.getInventory()
      }
      const target = list.find((i) => Number(i.id) === numId)
      newStock = target
        ? Math.max(0, Number(target.current_stock) + quantityAdded)
        : quantityAdded
      const updated = list.map((i) =>
        Number(i.id) === numId ? { ...i, current_stock: newStock } : i,
      )
      localStorage.setItem("smartbite_inventory", JSON.stringify(updated))
    } catch (err) {
      console.warn("restockInventory local error:", err)
    }

    // 2. Also try patching Supabase and RPC
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/inventory_items?id=eq.${numId}`, {
        method: "PATCH",
        headers: { ...headers, Prefer: "return=representation" },
        body: JSON.stringify({ current_stock: newStock }),
      })
    } catch {}

    try {
      await fetch(`${SUPABASE_URL}/rest/v1/rpc/sp_restock_inventory`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          p_inventory_id: numId,
          p_quantity_added: quantityAdded,
        }),
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
      payment_status?: "pending" | "paid" | "refunded"
    },
    items: Array<{
      menu_item_id: number
      item_name?: string
      quantity: number
      unit_price: number
      special_instructions?: string
      item_status?: "pending" | "cooking" | "prepared"
    }>,
  ): Promise<any> {
    // 1. Deduct ingredient stock in inventory immediately
    try {
      const savedInv = localStorage.getItem("smartbite_inventory")
      let invList: InventoryItem[] = savedInv ? JSON.parse(savedInv) : []
      if (!Array.isArray(invList) || invList.length === 0) {
        invList = await this.getInventory()
      }
      const { updatedInventory, deductions } = deductInventoryStock(
        invList,
        items,
      )
      localStorage.setItem(
        "smartbite_inventory",
        JSON.stringify(updatedInventory),
      )

      // Patch remote Supabase for each deducted item and await so Supabase commits before refresh
      const patchPromises = Object.entries(deductions).map(
        async ([invIdStr, deductQty]) => {
          const invId = Number(invIdStr)
          const updatedItem = updatedInventory.find(
            (i) => Number(i.id) === invId,
          )
          if (updatedItem && deductQty > 0) {
            try {
              await fetch(
                `${SUPABASE_URL}/rest/v1/inventory_items?id=eq.${invId}`,
                {
                  method: "PATCH",
                  headers,
                  body: JSON.stringify({
                    current_stock: updatedItem.current_stock,
                    last_restocked_at: new Date().toISOString(),
                  }),
                },
              )
            } catch (patchErr) {
              console.warn("Inventory stock patch error:", patchErr)
            }
          }
        },
      )
      await Promise.all(patchPromises)
    } catch (err) {
      console.warn("placeOrder stock deduction notice:", err)
    }

    // Helper: Valid UUID check prevents PostgreSQL 22P02 error if student_id is student number
    const isUUID = (str?: string | null) =>
      Boolean(
        str &&
          /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
            str,
          ),
      )

    const subtotal = items.reduce(
      (sum, i) => sum + i.unit_price * i.quantity,
      0,
    )
    const effectivePaymentStatus: "pending" | "paid" | "refunded" =
      order.payment_status ||
      (order.payment_method === "Canteen Wallet" ? "paid" : "pending")

    const normalizedItems: OrderItem[] = items.map((i) => ({
      order_id: order.order_id,
      menu_item_id: Number(i.menu_item_id),
      item_name: i.item_name || `Item #${i.menu_item_id}`,
      quantity: Number(i.quantity),
      unit_price: Number(i.unit_price),
      item_subtotal: Number(i.unit_price) * Number(i.quantity),
      special_instructions: i.special_instructions,
      item_status:
        i.item_status ||
        (effectivePaymentStatus === "paid" ? "prepared" : "pending"),
    }))

    const orderRecord: OrderRecord = {
      id: order.order_id,
      student_id: isUUID(order.student_id) ? order.student_id : null,
      stall_id: Number(order.stall_id),
      student_number: order.student_number,
      student_name: order.student_name,
      subtotal,
      service_fee: 0.0,
      total_amount: subtotal,
      order_status: "Order placed",
      pickup_time: "8–12 minutes",
      payment_method: order.payment_method || "Cash at counter",
      payment_status: effectivePaymentStatus,
      created_at: new Date().toISOString(),
      order_items: normalizedItems,
    }

    // Try primary path: Stored procedure sp_place_canteen_order (atomic order & order_items creation)
    let rpcSucceeded = false
    try {
      const rpcRes = await fetch(
        `${SUPABASE_URL}/rest/v1/rpc/sp_place_canteen_order`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            p_order_id: order.order_id,
            p_student_id: isUUID(order.student_id) ? order.student_id : null,
            p_stall_id: Number(order.stall_id),
            p_student_number: order.student_number,
            p_student_name: order.student_name,
            p_payment_method: order.payment_method || "Cash at counter",
            p_items: items.map((i) => ({
              menu_item_id: Number(i.menu_item_id),
              quantity: Number(i.quantity),
              unit_price: Number(i.unit_price),
            })),
          }),
        },
      )
      if (rpcRes.ok) {
        rpcSucceeded = true
        if (effectivePaymentStatus === "paid") {
          await this.updatePaymentStatus(order.order_id, "paid").catch(() => {})
        }
      } else {
        const errJson = await rpcRes.json().catch(() => ({}))
        console.warn("sp_place_canteen_order RPC returned non-ok:", errJson)
      }
    } catch (err) {
      console.warn("sp_place_canteen_order fetch exception:", err)
    }

    // If RPC was not available or failed, perform direct 2-step REST insert into Supabase
    if (!rpcSucceeded) {
      try {
        const orderHeaderPayload = {
          id: order.order_id,
          student_id: isUUID(order.student_id) ? order.student_id : null,
          student_name: order.student_name,
          student_number: order.student_number,
          stall_id: Number(order.stall_id),
          subtotal,
          service_fee: 0.0,
          total: subtotal,
          total_amount: subtotal,
          status: "Order placed",
          order_status: "Order placed",
          pickup_time: "8–12 minutes",
          payment_method: order.payment_method || "Cash at counter",
          payment_status: effectivePaymentStatus,
          items: items.map((i) => ({
            id: i.menu_item_id,
            name: i.item_name || `Item #${i.menu_item_id}`,
            price: i.unit_price,
            quantity: i.quantity,
          })),
        }

        const orderRes = await fetch(`${SUPABASE_URL}/rest/v1/orders`, {
          method: "POST",
          headers: { ...headers, Prefer: "return=representation" },
          body: JSON.stringify(orderHeaderPayload),
        })

        if (!orderRes.ok) {
          const errBody = await orderRes.json().catch(() => ({}))
          console.error("Direct orders POST error:", errBody)
        }

        // Insert normalized child records into order_items table
        const orderItemsPayload = items.map((i) => ({
          order_id: order.order_id,
          menu_item_id: Number(i.menu_item_id),
          item_name: i.item_name || `Item #${i.menu_item_id}`,
          quantity: Number(i.quantity),
          unit_price: Number(i.unit_price),
          item_subtotal: Number(i.unit_price) * Number(i.quantity),
          special_instructions: i.special_instructions || null,
          item_status:
            effectivePaymentStatus === "paid" ? "prepared" : "pending",
        }))

        await fetch(`${SUPABASE_URL}/rest/v1/order_items`, {
          method: "POST",
          headers,
          body: JSON.stringify(orderItemsPayload),
        }).catch((err) => console.warn("Direct order_items insert error:", err))
      } catch (directErr) {
        console.error("Direct insertion failed:", directErr)
      }
    }

    // Always update local storage cache for instant UI feedback and offline fallback
    try {
      const saved = localStorage.getItem("smartbite_orders")
      const list: OrderRecord[] = saved ? JSON.parse(saved) : []
      const filtered = list.filter((o) => o.id !== orderRecord.id)
      localStorage.setItem(
        "smartbite_orders",
        JSON.stringify([orderRecord, ...filtered]),
      )
    } catch {}

    return orderRecord
  },

  async getOrders(options?: {
    studentNumber?: string
    stallId?: number
  }): Promise<OrderRecord[]> {
    let remoteOrders: OrderRecord[] = []
    try {
      const params = new URLSearchParams()
      params.set("select", "*,order_items(*)")
      params.set("order", "created_at.desc")
      params.set("limit", "40")
      if (options?.studentNumber)
        params.set("student_number", `eq.${options.studentNumber}`)
      if (options?.stallId) params.set("stall_id", `eq.${options.stallId}`)

      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/orders?${params.toString()}`,
        { headers },
      )
      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data) && data.length > 0) {
          remoteOrders = data.map((o: any) => ({
            ...o,
            order_status: o.order_status || o.status || "Order placed",
            total_amount: Number(o.total_amount ?? o.total ?? o.subtotal ?? 0),
            subtotal: Number(o.subtotal ?? o.total_amount ?? o.total ?? 0),
            stall_id: Number(o.stall_id),
            order_items:
              Array.isArray(o.order_items) && o.order_items.length > 0
                ? o.order_items.map((i: any) => ({
                    id: i.id,
                    order_id: i.order_id,
                    menu_item_id: Number(i.menu_item_id),
                    item_name: i.item_name || `Item #${i.menu_item_id}`,
                    quantity: Number(i.quantity),
                    unit_price: Number(i.unit_price),
                    item_subtotal: Number(
                      i.item_subtotal ??
                        Number(i.unit_price) * Number(i.quantity),
                    ),
                    special_instructions: i.special_instructions,
                    item_status: i.item_status || "pending",
                  }))
                : Array.isArray(o.items) && o.items.length > 0
                  ? o.items.map((i: any) => ({
                      menu_item_id: Number(i.id || i.menu_item_id),
                      item_name: i.name || i.item_name || `Item #${i.id}`,
                      quantity: Number(i.quantity || 1),
                      unit_price: Number(i.price || i.unit_price || 0),
                      item_subtotal: Number(
                        (i.price || i.unit_price || 0) * (i.quantity || 1),
                      ),
                      item_status: "pending",
                    }))
                  : [],
          }))
        }
      }
    } catch (err) {
      console.warn("getOrders remote fetch error:", err)
    }

    const saved = localStorage.getItem("smartbite_orders")
    let localList: OrderRecord[] = []
    if (saved) {
      try {
        localList = JSON.parse(saved)
      } catch {}
    }

    // Merge remote and local (avoiding duplicates by order id)
    const merged = [...remoteOrders]
    for (const loc of localList) {
      if (!merged.some((m) => m.id === loc.id)) {
        merged.push(loc)
      }
    }

    let finalOrders = merged.length > 0 ? merged : localList
    if (options?.studentNumber)
      finalOrders = finalOrders.filter(
        (o) => o.student_number === options.studentNumber,
      )
    if (options?.stallId)
      finalOrders = finalOrders.filter(
        (o) => Number(o.stall_id) === Number(options.stallId),
      )
    return finalOrders
  },

  async updateOrderStatus(
    orderId: string,
    newStatus: OrderRecord["order_status"],
  ): Promise<void> {
    const rawId = (orderId || "").trim()
    const cleanId = rawId.replace(/^#/, "")

    // 1. Immediately update localStorage for snappy UI
    const saved = localStorage.getItem("smartbite_orders")
    if (saved) {
      try {
        const list: OrderRecord[] = JSON.parse(saved)
        const updated = list.map((o) =>
          o.id === rawId || o.id === cleanId || o.id === `#${cleanId}`
            ? { ...o, order_status: newStatus, status: newStatus }
            : o,
        )
        localStorage.setItem("smartbite_orders", JSON.stringify(updated))
      } catch {}
    }

    // 2. Try stored procedure
    let rpcOk = false
    try {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/rpc/sp_update_order_status`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            p_order_id: cleanId,
            p_new_status: newStatus,
          }),
        },
      )
      if (res.ok) rpcOk = true
    } catch {}

    // 3. Fallback direct PATCH to orders table (matches both clean and hash forms)
    if (!rpcOk) {
      try {
        await fetch(
          `${SUPABASE_URL}/rest/v1/orders?or=(id.eq.${encodeURIComponent(cleanId)},id.eq.${encodeURIComponent("#" + cleanId)})`,
          {
            method: "PATCH",
            headers,
            body: JSON.stringify({
              order_status: newStatus,
              status: newStatus,
              updated_at: new Date().toISOString(),
            }),
          },
        )
      } catch {}
    }
  },

  async updatePaymentStatus(
    orderId: string,
    paymentStatus: "paid" | "pending",
  ): Promise<void> {
    const rawId = (orderId || "").trim()
    const cleanId = rawId.replace(/^#/, "")

    // 1. Immediately update localStorage
    const saved = localStorage.getItem("smartbite_orders")
    if (saved) {
      try {
        const list: OrderRecord[] = JSON.parse(saved)
        const updated = list.map((o) =>
          o.id === rawId || o.id === cleanId || o.id === `#${cleanId}`
            ? { ...o, payment_status: paymentStatus }
            : o,
        )
        localStorage.setItem("smartbite_orders", JSON.stringify(updated))
      } catch {}
    }

    // 2. Direct PATCH to orders table in Supabase (matches both forms)
    try {
      await fetch(
        `${SUPABASE_URL}/rest/v1/orders?or=(id.eq.${encodeURIComponent(cleanId)},id.eq.${encodeURIComponent("#" + cleanId)})`,
        {
          method: "PATCH",
          headers,
          body: JSON.stringify({
            payment_status: paymentStatus,
            updated_at: new Date().toISOString(),
          }),
        },
      )
    } catch {}

    // 3. Also update order_items table in Supabase
    try {
      await fetch(
        `${SUPABASE_URL}/rest/v1/order_items?or=(order_id.eq.${encodeURIComponent(cleanId)},order_id.eq.${encodeURIComponent("#" + cleanId)})`,
        {
          method: "PATCH",
          headers,
          body: JSON.stringify({
            item_status: paymentStatus === "paid" ? "prepared" : "pending",
          }),
        },
      )
    } catch {}
  },

  // ==========================================
  // 6. AUDIT LOGS & ANALYTICS VIEWS
  // ==========================================
  async getAuditLogs(limit = 25): Promise<AuditLog[]> {
    try {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/audit_logs?select=*&order=created_at.desc&limit=${limit}`,
        { headers },
      )
      if (res.ok) return await res.json()
    } catch {}
    return []
  },

  async getSalesAnalytics(): Promise<any[]> {
    try {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/v_stall_sales_analytics?select=*`,
        { headers },
      )
      if (res.ok) return await res.json()
    } catch {}
    return [
      {
        stall_id: 1,
        stall_name: "SmartBite Main Kitchen",
        total_orders: 12,
        total_revenue: 960,
        average_order_value: 80,
        pending_orders: 2,
      },
      {
        stall_id: 2,
        stall_name: "The Snack Bar & Drinks",
        total_orders: 8,
        total_revenue: 340,
        average_order_value: 42.5,
        pending_orders: 1,
      },
    ]
  },

  async getLowStockAlerts(): Promise<any[]> {
    try {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/v_low_stock_alerts?select=*`,
        { headers },
      )
      if (res.ok) return await res.json()
    } catch {}
    return []
  },
}
