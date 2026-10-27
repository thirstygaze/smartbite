// Decoupled API Service Layer for SmartBite
// Complies with Section VII.1: Strict Decoupled Controller/Service Architecture
import {
  supabase,
  Profile,
  Stall,
  MenuItem,
  OrderRecord,
  InventoryItem,
  AuditLog,
} from '../supabase'

export const canteenApi = {
  // 1. Auth & Profiles Service (Admin User Management)
  auth: {
    async getProfiles(): Promise<Profile[]> {
      return await supabase.getProfiles()
    },
    async createProfile(profile: Partial<Profile>): Promise<Profile> {
      return await supabase.createProfile(profile)
    },
    async updateProfile(id: string, updates: Partial<Profile>): Promise<void> {
      return await supabase.updateProfile(id, updates)
    },
    async deleteProfile(id: string): Promise<void> {
      return await supabase.deleteProfile(id)
    },
    async changePassword(profileId: string, newPassword: string): Promise<boolean> {
      return await supabase.changePassword(profileId, newPassword)
    },
  },

  // 2. Mini Stalls & Branches Service (At least 2 Branches)
  stalls: {
    async getStalls(): Promise<Stall[]> {
      return await supabase.getStalls()
    },
    async createStall(stall: Omit<Stall, 'id'>): Promise<Stall> {
      return await supabase.createStall(stall)
    },
    async updateStall(id: number, updates: Partial<Stall>): Promise<void> {
      return await supabase.updateStall(id, updates)
    },
  },

  // 3. Menu Catalog CRUD Service (Staff Full CRUD)
  menu: {
    async getItems(stallId?: number): Promise<MenuItem[]> {
      return await supabase.getMenuItems(stallId)
    },
    async createItem(item: Omit<MenuItem, 'id'>): Promise<MenuItem> {
      return await supabase.createMenuItem(item)
    },
    async updateItem(id: number, updates: Partial<MenuItem>): Promise<void> {
      return await supabase.updateMenuItem(id, updates)
    },
    async deleteItem(id: number): Promise<void> {
      return await supabase.deleteMenuItem(id)
    },
  },

  // 4. Inventory CRUD Service (Staff Full CRUD)
  inventory: {
    async list(stallId?: number): Promise<InventoryItem[]> {
      return await supabase.getInventory(stallId)
    },
    async create(item: Omit<InventoryItem, 'id'>): Promise<InventoryItem> {
      return await supabase.createInventoryItem(item)
    },
    async update(id: number, updates: Partial<InventoryItem>): Promise<void> {
      return await supabase.updateInventoryItem(id, updates)
    },
    async restock(inventoryId: number, amount: number): Promise<any> {
      return await supabase.restockInventory(inventoryId, amount)
    },
    async getLowStockAlerts(): Promise<any[]> {
      return await supabase.getLowStockAlerts()
    },
  },

  // 5. Orders Service (Atomic Transactions & KDS Queue)
  orders: {
    async place(
      header: {
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
      return await supabase.placeOrder(header, items)
    },
    async list(options?: { studentNumber?: string; stallId?: number }): Promise<OrderRecord[]> {
      return await supabase.getOrders(options)
    },
    async updateStatus(orderId: string, newStatus: OrderRecord['order_status']): Promise<void> {
      return await supabase.updateOrderStatus(orderId, newStatus)
    },
  },

  // 6. Analytics & Audit Trail
  analytics: {
    async getSalesSummary(): Promise<any[]> {
      return await supabase.getSalesAnalytics()
    },
    async getAuditLogs(limit = 25): Promise<AuditLog[]> {
      return await supabase.getAuditLogs(limit)
    },
  },

  // 7. System Diagnostics
  system: {
    async verifyConnection(): Promise<{ ok: boolean; message: string }> {
      return await supabase.testConnection()
    },
  },
}
