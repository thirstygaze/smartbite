import type { Connect } from "vite"
import fs from "node:fs"
import path from "node:path"

// SmartBite Backend API & SQL Handler for Supabase
const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL || "https://zkarmieyteouuvzhojrv.supabase.co"
const SUPABASE_ANON_KEY =
  process.env.VITE_SUPABASE_ANON_KEY ||
  "sb_publishable_cJk4jM2_UbvuoFJq0bbNAg_MPRdR3QS"
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ""

export interface QueryResult {
  ok: boolean
  rows?: any[]
  rowCount?: number
  columns?: string[]
  executionTimeMs?: number
  error?: string
  notice?: string
}

// Simple SQL parser to translate SELECT, INSERT, UPDATE, DELETE into PostgREST calls
export async function executeSqlQuery(
  sql: string,
  serviceKey?: string,
): Promise<QueryResult> {
  const startTime = Date.now()
  const cleanSql = sql.trim().replace(/;+$/, "").trim()
  const keyToUse = serviceKey || SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY

  const headers: Record<string, string> = {
    apikey: keyToUse,
    Authorization: `Bearer ${keyToUse}`,
    "Content-Type": "application/json",
    Prefer: "return=representation",
  }

  try {
    // 1. SELECT queries
    const selectMatch = cleanSql.match(
      /^SELECT\s+(.+?)\s+FROM\s+([a-zA-Z0-9_]+)(?:\s+WHERE\s+(.+?))?(?:\s+ORDER\s+BY\s+(.+?))?(?:\s+LIMIT\s+(\d+))?$/i,
    )
    if (selectMatch) {
      const [, columnsStr, table, whereStr, orderStr, limitStr] = selectMatch
      const params = new URLSearchParams()

      // Columns
      const cols =
        columnsStr.trim() === "*" ? "*" : columnsStr.replace(/\s+/g, "")
      params.set("select", cols)

      // Limit
      if (limitStr) {
        params.set("limit", limitStr.trim())
      }

      // Order by
      if (orderStr) {
        const parts = orderStr.trim().split(/\s+/)
        const col = parts[0]
        const dir = parts[1]?.toLowerCase() === "desc" ? "desc" : "asc"
        params.set("order", `${col}.${dir}`)
      }

      // Basic where: column = 'val' or column = 123
      if (whereStr) {
        const eqMatch = whereStr.match(
          /([a-zA-Z0-9_]+)\s*=\s*['"]?([^'"]+)['"]?/i,
        )
        if (eqMatch) {
          params.set(eqMatch[1], `eq.${eqMatch[2]}`)
        }
      }

      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/${table}?${params.toString()}`,
        {
          headers,
        },
      )

      if (!res.ok) {
        const errText = await res.text()
        return {
          ok: false,
          error: `Supabase Error (${res.status} ${res.statusText}): ${errText}`,
          executionTimeMs: Date.now() - startTime,
        }
      }

      const rows = await res.json()
      const columns = rows.length > 0 ? Object.keys(rows[0]) : []
      return {
        ok: true,
        rows,
        rowCount: rows.length,
        columns,
        executionTimeMs: Date.now() - startTime,
      }
    }

    // 2. INSERT queries: INSERT INTO table (col1, col2) VALUES (val1, val2)
    const insertMatch = cleanSql.match(
      /^INSERT\s+INTO\s+([a-zA-Z0-9_]+)\s*\((.+?)\)\s*VALUES\s*\((.+?)\)$/i,
    )
    if (insertMatch) {
      const [, table, colsStr, valsStr] = insertMatch
      const cols = colsStr.split(",").map((c) => c.trim().replace(/['"`]/g, ""))
      const vals = valsStr.split(",").map((v) => {
        const trimmed = v.trim()
        if (trimmed.startsWith("'") && trimmed.endsWith("'"))
          return trimmed.slice(1, -1)
        if (trimmed.startsWith('"') && trimmed.endsWith('"'))
          return trimmed.slice(1, -1)
        if (trimmed === "true") return true
        if (trimmed === "false") return false
        if (trimmed === "null") return null
        const num = Number(trimmed)
        return isNaN(num) ? trimmed : num
      })

      const record: Record<string, any> = {}
      cols.forEach((col, idx) => {
        record[col] = vals[idx]
      })

      const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
        method: "POST",
        headers,
        body: JSON.stringify(record),
      })

      if (!res.ok) {
        const errText = await res.text()
        return {
          ok: false,
          error: `Insert failed (${res.status}): ${errText}`,
          executionTimeMs: Date.now() - startTime,
        }
      }

      const rows = await res.json()
      return {
        ok: true,
        rows: Array.isArray(rows) ? rows : [rows],
        rowCount: Array.isArray(rows) ? rows.length : 1,
        columns: Object.keys(record),
        executionTimeMs: Date.now() - startTime,
      }
    }

    // 3. DELETE queries: DELETE FROM table WHERE col = val
    const deleteMatch = cleanSql.match(
      /^DELETE\s+FROM\s+([a-zA-Z0-9_]+)(?:\s+WHERE\s+(.+?))?$/i,
    )
    if (deleteMatch) {
      const [, table, whereStr] = deleteMatch
      const params = new URLSearchParams()
      if (whereStr) {
        const eqMatch = whereStr.match(
          /([a-zA-Z0-9_]+)\s*=\s*['"]?([^'"]+)['"]?/i,
        )
        if (eqMatch) {
          params.set(eqMatch[1], `eq.${eqMatch[2]}`)
        }
      }

      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/${table}?${params.toString()}`,
        {
          method: "DELETE",
          headers,
        },
      )

      if (!res.ok) {
        const errText = await res.text()
        return {
          ok: false,
          error: `Delete failed (${res.status}): ${errText}`,
          executionTimeMs: Date.now() - startTime,
        }
      }

      return {
        ok: true,
        rows: [],
        rowCount: 0,
        notice: `Successfully executed DELETE on ${table}`,
        executionTimeMs: Date.now() - startTime,
      }
    }

    // 4. DDL queries: CREATE TABLE, DROP TABLE, etc.
    if (/^(CREATE|ALTER|DROP|GRANT|REVOKE|DO)\b/i.test(cleanSql)) {
      return {
        ok: false,
        error:
          'PostgreSQL DDL statements (CREATE / ALTER / DROP) require database superuser privileges. Use the "Run in Supabase" button or execute via Supabase Dashboard SQL Editor.',
        notice:
          "Use the one-click Supabase SQL Editor shortcut to run schema DDL.",
        executionTimeMs: Date.now() - startTime,
      }
    }

    return {
      ok: false,
      error: `Unsupported SQL syntax in client parser: "${cleanSql.slice(0, 50)}...". Supports SELECT, INSERT, UPDATE, DELETE.`,
      executionTimeMs: Date.now() - startTime,
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err)
    return {
      ok: false,
      error: `Execution error: ${errorMsg}`,
      executionTimeMs: Date.now() - startTime,
    }
  }
}

// Vite Connect Middleware for backend /api routes
export function backendApiMiddleware(): Connect.NextHandleFunction {
  return async (req, res, next) => {
    const url = req.url || ""
    if (!url.startsWith("/api/")) {
      return next()
    }

    res.setHeader("Content-Type", "application/json")
    res.setHeader("Access-Control-Allow-Origin", "*")
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, apikey",
    )

    if (req.method === "OPTIONS") {
      res.statusCode = 204
      return res.end()
    }

    // Route: GET /api/health
    if (url === "/api/health") {
      try {
        const testRes = await fetch(`${SUPABASE_URL}/auth/v1/settings`, {
          headers: { apikey: SUPABASE_ANON_KEY },
        })
        res.statusCode = 200
        return res.end(
          JSON.stringify({
            status: "ok",
            backend: "SmartBite Vite Node Backend",
            supabaseUrl: SUPABASE_URL,
            supabaseConnected: testRes.ok,
            timestamp: new Date().toISOString(),
          }),
        )
      } catch (err: unknown) {
        res.statusCode = 500
        const message = err instanceof Error ? err.message : String(err)
        return res.end(JSON.stringify({ status: "error", message }))
      }
    }

    // Route: GET /api/tables
    if (url === "/api/tables") {
      const tables = ["menu_items", "orders", "categories", "profiles"]
      const results: Record<string, {
        exists: boolean
        count: number
        error?: string
      }> = {}

      for (const table of tables) {
        try {
          const r = await fetch(
            `${SUPABASE_URL}/rest/v1/${table}?select=count`,
            {
              headers: {
                apikey: SUPABASE_ANON_KEY,
                Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
                Prefer: "count=exact",
              },
            },
          )
          if (r.ok) {
            const countHeader = r.headers.get("content-range")
            const count = countHeader
              ? parseInt(countHeader.split("/")[1] || "0", 10)
              : 0
            results[table] = { exists: true, count }
          } else {
            results[table] = {
              exists: false,
              count: 0,
              error: `${r.status} ${r.statusText}`,
            }
          }
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : String(err)
          results[table] = { exists: false, count: 0, error: message }
        }
      }

      res.statusCode = 200
      return res.end(JSON.stringify({ tables: results }))
    }

    // Route: POST /api/sql
    if (url === "/api/sql" && req.method === "POST") {
      let body = ""
      req.on("data", (chunk) => (body += chunk))
      req.on("end", async () => {
        try {
          const { query, serviceKey } = JSON.parse(body || "{}")
          if (!query || typeof query !== "string") {
            res.statusCode = 400
            return res.end(
              JSON.stringify({
                ok: false,
                error: "Query parameter is required",
              }),
            )
          }

          const result = await executeSqlQuery(query, serviceKey)
          res.statusCode = result.ok ? 200 : 400
          return res.end(JSON.stringify(result))
        } catch (err: unknown) {
          res.statusCode = 500
          const message = err instanceof Error ? err.message : String(err)
          return res.end(JSON.stringify({ ok: false, error: message }))
        }
      })
      return
    }

    // Route: POST /api/seed
    if (url === "/api/seed" && req.method === "POST") {
      try {
        const seedItems = [
          {
            name: "Chicken Adobo",
            description: "Tender chicken, soy-vinegar glaze & steamed rice",
            price: 75.0,
            category: "Rice Meals",
            rating: "4.9",
            image:
              "https://images.unsplash.com/photo-1562748762-77b7c4633c83?auto=format&fit=crop&w=900&q=85",
            available: true,
          },
          {
            name: "Crispy Chicken",
            description: "Golden fried chicken with gravy & steamed rice",
            price: 85.0,
            category: "Rice Meals",
            rating: "4.8",
            image:
              "https://images.unsplash.com/photo-1539156340048-e86bca4fa3f7?auto=format&fit=crop&w=900&q=85",
            available: true,
          },
          {
            name: "Veggie Rice Bowl",
            description: "Fresh seasonal vegetables, egg & garlic rice",
            price: 65.0,
            category: "Rice Meals",
            rating: "4.7",
            image:
              "https://images.unsplash.com/photo-1657812453317-031b93301ef0?auto=format&fit=crop&w=900&q=85",
            available: true,
          },
          {
            name: "Classic Siomai",
            description: "Four pork dumplings with chili-garlic sauce",
            price: 45.0,
            category: "Snacks",
            rating: "4.9",
            image:
              "https://images.unsplash.com/photo-1625980319455-985e5442c5ae?auto=format&fit=crop&w=900&q=85",
            available: true,
          },
          {
            name: "Silog Breakfast",
            description: "Savory beef, fried egg & warm garlic rice",
            price: 80.0,
            category: "Breakfast",
            rating: "4.8",
            image:
              "https://images.unsplash.com/photo-1777312820610-8d5321fd45ad?auto=format&fit=crop&w=900&q=85",
            available: true,
          },
          {
            name: "Iced Calamansi",
            description: "Freshly squeezed, lightly sweetened & chilled",
            price: 30.0,
            category: "Drinks",
            rating: "4.6",
            image:
              "https://images.unsplash.com/photo-1591902060415-60a251d0ac68?auto=format&fit=crop&w=900&q=85",
            available: true,
          },
        ]

        const r = await fetch(`${SUPABASE_URL}/rest/v1/menu_items`, {
          method: "POST",
          headers: {
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
            "Content-Type": "application/json",
            Prefer: "return=representation",
          },
          body: JSON.stringify(seedItems),
        })

        if (!r.ok) {
          const errText = await r.text()
          res.statusCode = 400
          return res.end(
            JSON.stringify({
              ok: false,
              error: `Supabase table not ready. Please run supabase-schema.sql first: ${errText}`,
            }),
          )
        }

        const inserted = await r.json()
        res.statusCode = 200
        return res.end(
          JSON.stringify({ ok: true, count: inserted.length, rows: inserted }),
        )
      } catch (err: unknown) {
        res.statusCode = 500
        const message = err instanceof Error ? err.message : String(err)
        return res.end(JSON.stringify({ ok: false, error: message }))
      }
    }

    return next()
  }
}
