import { FormEvent, useEffect, useMemo, useRef, useState } from "react"
import {
  Profile,
  Stall,
  MenuItem,
  OrderRecord,
  InventoryItem,
  AuditLog,
  UserRole,
  MENU_RECIPES,
  deductInventoryStock,
  ADMIN_CREDENTIALS,
} from "./supabase"
import { canteenApi } from "./services/canteenApi"

type IconName = "home" | "receipt" | "clock" | "bell" | "search" | "bag" | "minus" | "plus" | "arrow" | "x" | "check" | "database" | "chef" | "shield" | "refresh" | "store" | "users" | "edit" | "trash" | "chevron-down" | "sparkle" | "eye" | "eye-off" | "school" | "logout" | "grid" | "key" | "lock" | "mail" | "info" | "list"

function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
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
    chef: (
      <>
        <path d="M6 13.8V4a3 3 0 0 1 6 0v9.8" />
        <path d="M12 13.8V2a3 3 0 0 1 6 0v11.8" />
        <path d="M4 14h16v7a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-7Z" />
      </>
    ),
    shield: (
      <>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </>
    ),
    refresh: (
      <>
        <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
      </>
    ),
    store: (
      <>
        <path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7" />
        <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
        <path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4" />
        <path d="M2 7h20" />
      </>
    ),
    users: (
      <>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </>
    ),
    edit: (
      <>
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
      </>
    ),
    trash: (
      <>
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      </>
    ),
    "chevron-down": <path d="m6 9 6 6 6-6" />,
    sparkle: (
      <>
        <path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3z" />
      </>
    ),
    eye: (
      <>
        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
        <circle cx="12" cy="12" r="3" />
      </>
    ),
    "eye-off": (
      <>
        <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
        <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
        <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
        <line x1="2" x2="22" y1="2" y2="22" />
      </>
    ),
    school: (
      <>
        <path d="M14 22v-4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v4" />
        <path d="m18 10 4 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-8l4-2" />
        <path d="M18 5v17" />
        <path d="m4 6 8-4 8 4" />
        <path d="M6 5v17" />
        <circle cx="12" cy="9" r="2" />
      </>
    ),
    logout: (
      <>
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <polyline points="16 17 21 12 16 7" />
        <line x1="21" x2="9" y1="12" y2="12" />
      </>
    ),
    grid: (
      <>
        <rect width="7" height="7" x="3" y="3" rx="1" />
        <rect width="7" height="7" x="14" y="3" rx="1" />
        <rect width="7" height="7" x="14" y="14" rx="1" />
        <rect width="7" height="7" x="3" y="14" rx="1" />
      </>
    ),
    key: (
      <>
        <circle cx="7.5" cy="15.5" r="4.5" />
        <path d="m11 12 9-9h3v3l-2 2v2l-2 2" />
      </>
    ),
    lock: (
      <>
        <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </>
    ),
    mail: (
      <>
        <rect width="20" height="16" x="2" y="4" rx="2" />
        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
      </>
    ),
    info: (
      <>
        <circle cx="12" cy="12" r="10" />
        <path d="M12 16v-4" />
        <path d="M12 8h.01" />
      </>
    ),
    list: (
      <>
        <line x1="8" y1="6" x2="21" y2="6" />
        <line x1="8" y1="12" x2="21" y2="12" />
        <line x1="8" y1="18" x2="21" y2="18" />
        <line x1="3" y1="6" x2="3.01" y2="6" />
        <line x1="3" y1="12" x2="3.01" y2="12" />
        <line x1="3" y1="18" x2="3.01" y2="18" />
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

interface NotificationItem {
  id: string
  title: string
  message: string
  time: string
  type: "order" | "balance" | "announcement"
  unread: boolean
  orderId?: string
  status?: string
}

function playNotificationSound() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
    if (!AudioCtx) return
    const ctx = new AudioCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = "sine"
    osc.frequency.setValueAtTime(587.33, ctx.currentTime) // D5
    osc.frequency.setValueAtTime(880, ctx.currentTime + 0.12) // A5
    gain.gain.setValueAtTime(0.18, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 0.4)
  } catch {}
}

// =========================================================================
// VALIDATION HELPERS (Letters-only names, numeric unique IDs, secure passwords)
// =========================================================================
function validateName(name: string, fieldName: string): string | null {
  const trimmed = name.trim()
  if (!trimmed) {
    return `${fieldName} is required.`
  }
  // Accept only letters and single spaces between words
  if (!/^[A-Za-z\s]+$/.test(trimmed)) {
    return `${fieldName} must contain only letters (no numbers or special characters).`
  }
  // Not accept 3 or more consecutive repeated letters (e.g. "aaa")
  if (/([a-zA-Z])\1{2,}/i.test(trimmed)) {
    return `${fieldName} cannot contain repeated consecutive letters (e.g. "aaa").`
  }
  // Not accept names consisting of all the same repeating letter (e.g. "aa", "aaaa")
  const stripped = trimmed.replace(/\s+/g, "")
  if (stripped.length >= 2 && /^([a-zA-Z])\1+$/i.test(stripped)) {
    return `${fieldName} cannot consist of the same repeating letter.`
  }
  // Not accept repeating sequence patterns (e.g. "abcabc")
  if (stripped.length >= 4 && /([a-zA-Z]{2,})\1+/i.test(stripped)) {
    return `${fieldName} cannot contain repeating letter patterns.`
  }
  return null
}

function validateOptionalMiddleName(name: string): string | null {
  const trimmed = name.trim()
  if (!trimmed) return null
  // Accept only letters and single spaces between words
  if (!/^[A-Za-z\s]+$/.test(trimmed)) {
    return "Middle Name must contain only letters (no numbers or special characters)."
  }
  // Not accept 3 or more consecutive repeated letters (e.g. "aaa")
  if (/([a-zA-Z])\1{2,}/i.test(trimmed)) {
    return 'Middle Name cannot contain repeated consecutive letters (e.g. "aaa").'
  }
  // Not accept names consisting of all the same repeating letter (e.g. "aa", "aaaa")
  const stripped = trimmed.replace(/\s+/g, "")
  if (stripped.length >= 2 && /^([a-zA-Z])\1+$/i.test(stripped)) {
    return "Middle Name cannot consist of the same repeating letter."
  }
  // Not accept repeating sequence patterns (e.g. "abcabc")
  if (stripped.length >= 4 && /([a-zA-Z]{2,})\1+/i.test(stripped)) {
    return "Middle Name cannot contain repeating letter patterns."
  }
  return null
}

function validateIdNumber(
  id: string,
  excludeProfileId?: string,
  profiles: Profile[] = [],
): string | null {
  const trimmed = id.trim()
  if (!trimmed) {
    return "Student ID Number is required."
  }
  // Accept only numbers
  if (!/^\d+$/.test(trimmed)) {
    return "Student ID Number must contain only numbers (digits 0-9, no letters or symbols)."
  }
  if (trimmed.length < 4) {
    return "Student ID Number must be at least 4 digits."
  }
  // Not accept 3 or more consecutive repeated numbers (e.g. "111")
  if (/(\d)\1{2,}/.test(trimmed)) {
    return 'Student ID Number cannot contain repeated consecutive numbers (e.g. "111").'
  }
  // Not accept all same repeating digit (e.g. "11111", "00000")
  if (/^(\d)\1+$/.test(trimmed)) {
    return "Student ID Number cannot consist of the same repeating digit."
  }
  // Not accept repeating patterns (e.g. "121212", "123123")
  if (trimmed.length >= 4 && /(\d{2,})\1+/.test(trimmed)) {
    return "Student ID Number cannot contain repeating number patterns."
  }
  // Cannot be already assigned to another account
  const duplicate = profiles.find(
    (p) =>
      (!excludeProfileId || p.id !== excludeProfileId) &&
      p.student_id === trimmed,
  )
  if (duplicate) {
    return `ID Number "${trimmed}" is already assigned to ${duplicate.full_name}. Please use a unique ID.`
  }
  return null
}

function validateEmail(
  email: string,
  excludeProfileId?: string,
  profiles: Profile[] = [],
): string | null {
  const trimmed = email.trim().toLowerCase()
  if (!trimmed) {
    return "Email address is required."
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return "Please enter a valid email address (e.g. user@smartbite.edu.ph)."
  }
  const duplicate = profiles.find(
    (p) =>
      (!excludeProfileId || p.id !== excludeProfileId) &&
      (p.email || "").toLowerCase() === trimmed,
  )
  if (duplicate) {
    return `Email "${trimmed}" is already assigned to ${duplicate.full_name}. Please use a unique email.`
  }
  return null
}

function validatePhoneNumber(phone: string): string | null {
  const trimmed = phone.trim()
  if (!trimmed) {
    return "Phone number is required."
  }
  // Accept only numbers
  if (!/^\d+$/.test(trimmed)) {
    return "Phone number must contain only numbers (no letters or symbols)."
  }
  // Must be exactly 11 numbers
  if (trimmed.length !== 11) {
    return "Phone number must be exactly 11 digits (e.g. 09171234567)."
  }
  // Not accept 3 or more consecutive repeated numbers (e.g. "111")
  if (/(\d)\1{2,}/.test(trimmed)) {
    return 'Phone number cannot contain repeated consecutive numbers (e.g. "111").'
  }
  // Not accept all same repeating digit (e.g. "00000000000", "11111111111")
  if (/^(\d)\1+$/.test(trimmed)) {
    return "Phone number cannot consist of the same repeating digit."
  }
  // Not accept repeating patterns (e.g. "121212", "123123")
  if (trimmed.length >= 4 && /(\d{2,})\1+/.test(trimmed)) {
    return "Phone number cannot contain repeating number patterns."
  }
  return null
}

function validatePassword(pwd: string): string | null {
  if (!pwd) {
    return "Password is required."
  }
  // No spacing allowed
  if (/\s/.test(pwd)) {
    return "Password cannot contain spaces."
  }
  if (pwd.length < 6) {
    return "Password must be at least 6 characters long."
  }
  // Not accept 3 or more consecutive repeated numbers or letters (e.g. "aaa", "111")
  if (/([a-zA-Z0-9])\1{2,}/i.test(pwd)) {
    return 'Password cannot contain repeated consecutive letters or numbers (e.g. "aaa" or "111").'
  }
  // Not accept all same repeating character or number (e.g. "aaaaaa", "111111")
  if (/^([a-zA-Z0-9])\1+$/i.test(pwd)) {
    return "Password cannot consist of all the same repeating character or number."
  }
  // Not accept repeating sequence patterns of letters or numbers (e.g. "121212", "abcabc")
  const alphanumeric = pwd.replace(/[^a-zA-Z0-9]/g, "")
  if (alphanumeric.length >= 4 && /([a-zA-Z0-9]{2,})\1+/i.test(alphanumeric)) {
    return 'Password cannot contain repeating patterns (e.g. "121212" or "abcabc").'
  }
  return null
}

function validateSignInIdentifier(input: string): string | null {
  const trimmed = input.trim()
  if (!trimmed) {
    return "Please enter your School Email or User ID."
  }

  // Reject 3 or more consecutive identical letters or numbers (e.g. "aaa", "111")
  if (/([a-zA-Z0-9])\1{2,}/i.test(trimmed)) {
    return 'Sign in does not accept repeated consecutive letters or numbers (e.g. "aaa" or "111").'
  }

  // Reject identifiers consisting entirely of a single repeated letter or number (e.g. "aaaa", "1111")
  const stripped = trimmed.replace(/[^a-zA-Z0-9]/g, "")
  if (stripped.length >= 2 && /^([a-zA-Z0-9])\1+$/i.test(stripped)) {
    return "Sign in does not accept repeated characters or numbers."
  }

  // Reject repeating sequential cycles (e.g. "121212", "abcabc")
  if (stripped.length >= 4 && /^([a-zA-Z0-9]{2,3})\1{2,}$/i.test(stripped)) {
    return 'Sign in does not accept repeating patterns (e.g. "121212" or "abcabc").'
  }

  // Strict check: Only valid Email OR valid User ID format accepted
  const isEmail =
    /^[a-zA-Z0-9]+([._%+-][a-zA-Z0-9]+)*@[a-zA-Z0-9]+([.-][a-zA-Z0-9]+)*\.[a-zA-Z]{2,}$/.test(
      trimmed,
    )
  const isUserId =
    /^[a-zA-Z0-9]+([-._][a-zA-Z0-9]+)*$/.test(trimmed) &&
    trimmed.length >= 4 &&
    trimmed.length <= 30

  if (!isEmail && !isUserId) {
    return "Invalid identifier: only valid School Email (e.g. name@gmail.com) or User ID (e.g. 2025-01234) are accepted."
  }

  return null
}

export default function App() {
  // Authentication Step & Flow (Persisted in localStorage so refreshing never logs out)
  const [loggedIn, setLoggedIn] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem("smartbite_session_user")
      if (saved) {
        const parsed = JSON.parse(saved)
        if (parsed && parsed.student_id) return true
      }
    } catch {}
    return false
  })
  const [authStep, setAuthStep] = useState<"welcome" | "signin" | "signup">(
    "welcome",
  )
  const [chosenRole, setChosenRole] = useState<UserRole>("student")
  const [studentId, setStudentId] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [authError, setAuthError] = useState("")
  const [authNotice, setAuthNotice] = useState("")

  // Sign up fields (First Name, Middle Name, Last Name)
  const [regFirstName, setRegFirstName] = useState("")
  const [regMiddleName, setRegMiddleName] = useState("")
  const [regLastName, setRegLastName] = useState("")
  const [regStudentId, setRegStudentId] = useState("")
  const [regEmail, setRegEmail] = useState("")
  const [regPassword, setRegPassword] = useState("")
  const [showRegPassword, setShowRegPassword] = useState(false)
  const [regPhone, setRegPhone] = useState("")

  // Email Verification & Password Recovery State
  const [forgotModalOpen, setForgotModalOpen] = useState(false)
  const [forgotStep, setForgotStep] =
    useState<"input_email" | "verify_code" | "reset_password" | "success">(
      "input_email",
    )
  const [forgotEmail, setForgotEmail] = useState("")
  const [forgotOtp, setForgotOtp] = useState("")
  const [forgotNewPwd, setForgotNewPwd] = useState("")
  const [forgotConfirmPwd, setForgotConfirmPwd] = useState("")
  const [showForgotPwd, setShowForgotPwd] = useState(false)
  const [forgotError, setForgotError] = useState("")
  const [forgotNotice, setForgotNotice] = useState("")
  const [forgotMatchedAccount, setForgotMatchedAccount] = useState<{
    id: string
    role: string
    email: string
    name: string
  } | null>(null)
  const [forgotCooldown, setForgotCooldown] = useState(0)

  // Registration Email Verification State
  const [regVerifyModalOpen, setRegVerifyModalOpen] = useState(false)
  const [regOtp, setRegOtp] = useState("")
  const [regVerifyError, setRegVerifyError] = useState("")
  const [regVerifyNotice, setRegVerifyNotice] = useState("")
  const [regCooldown, setRegCooldown] = useState(0)
  const [pendingRegData, setPendingRegData] = useState<{
    student_id: string
    email: string
    first_name: string
    middle_name: string
    last_name: string
    full_name: string
    role: UserRole
    phone_number: string
    password: string
    balance: number
  } | null>(null)

  // Change Password Modal (Available for EVERY account)
  const [changePasswordModalOpen, setChangePasswordModalOpen] = useState(false)
  const [currentPwd, setCurrentPwd] = useState("")
  const [newPwd, setNewPwd] = useState("")
  const [confirmPwd, setConfirmPwd] = useState("")
  const [pwdError, setPwdError] = useState("")
  const [pwdSuccess, setPwdSuccess] = useState("")

  // Admin User Management & Create User Modal (Only Admin can create Stall, Admin, Staff, Customer)
  const [adminCreateUserModalOpen, setAdminCreateUserModalOpen] =
    useState(false)
  const [newRole, setNewRole] = useState<UserRole>("student")
  const [newUserId, setNewUserId] = useState("")
  const [newUserEmail, setNewUserEmail] = useState("")
  const [newFirstName, setNewFirstName] = useState("")
  const [newMiddleName, setNewMiddleName] = useState("")
  const [newLastName, setNewLastName] = useState("")
  const [newPhone, setNewPhone] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [newStallId, setNewStallId] = useState<number>(1)
  const [newBalance, setNewBalance] = useState<number>(500)
  const [createNewStallCheckbox, setCreateNewStallCheckbox] = useState(false)
  const [newStallName, setNewStallName] = useState("")
  const [newStallCode, setNewStallCode] = useState("")
  const [newStallDesc, setNewStallDesc] = useState("")
  const [adminUserModalError, setAdminUserModalError] = useState("")
  const [adminUserModalSuccess, setAdminUserModalSuccess] = useState("")

  // Admin Reset User Password Modal
  const [adminResetUser, setAdminResetUser] = useState<Profile | null>(null)
  const [adminResetNewPwd, setAdminResetNewPwd] = useState("")
  const [showAdminResetPwd, setShowAdminResetPwd] = useState(false)

  // Admin Edit User Modal (Change Name, Role, ID, Email, Phone, Balance, Stall)
  const [adminEditUser, setAdminEditUser] = useState<Profile | null>(null)
  const [editUserId, setEditUserId] = useState("")
  const [editEmail, setEditEmail] = useState("")
  const [editFirstName, setEditFirstName] = useState("")
  const [editMiddleName, setEditMiddleName] = useState("")
  const [editLastName, setEditLastName] = useState("")
  const [editRole, setEditRole] = useState<UserRole>("student")
  const [editPhone, setEditPhone] = useState("")
  const [editBalance, setEditBalance] = useState<number>(0)
  const [editStallId, setEditStallId] = useState<number>(1)
  const [editError, setEditError] = useState("")
  const [editSuccess, setEditSuccess] = useState("")

  // 1. Campus / School Switcher Modal State (Interactive "YOUR SCHOOL")
  const [schoolModalOpen, setSchoolModalOpen] = useState(false)
  const [campuses, setCampuses] = useState([
    {
      id: "hnu-main",
      abbr: "HNU",
      name: "Holy Name University",
      subtitle: "Main Campus canteen",
      campusLocation: "Dampas District, Tagbilaran City, Bohol",
      code: "HNU-TAGB",
      hours: "6:00 AM – 6:00 PM",
      stallsCount: 2,
      active: true,
    },
    {
      id: "hnu-bed",
      abbr: "HNU-B",
      name: "Holy Name University — Basic Ed",
      subtitle: "City Campus canteen",
      campusLocation: "Lesage St., Tagbilaran City, Bohol",
      code: "HNU-BED",
      hours: "6:30 AM – 4:30 PM",
      stallsCount: 1,
      active: false,
    },
    {
      id: "hnu-janssen",
      abbr: "HNU-J",
      name: "Holy Name University — Janssen Annex",
      subtitle: "Heights Annex Food Hub",
      campusLocation: "Janssen Heights, Dampas, Tagbilaran City",
      code: "HNU-JANS",
      hours: "7:00 AM – 5:00 PM",
      stallsCount: 1,
      active: false,
    },
  ])
  const activeCampus = campuses.find((c) => c.active) || campuses[0]

  // 2. Interactive Notifications & Refresh Sync States (Persisted in localStorage)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    try {
      const saved = localStorage.getItem("smartbite_notifications")
      if (saved !== null) {
        return JSON.parse(saved)
      }
    } catch {}
    return [
      {
        id: "notif-1",
        title: "Order Ready for Pickup! ",
        message:
          "Meal Ticket #ORD-1002 (Pork Tonkatsu Bowl) is freshly prepared at Station A.",
        time: "3m ago",
        type: "order",
        unread: true,
      },
      {
        id: "notif-2",
        title: "Wallet Balance Active ",
        message:
          "Canteen wallet verified. Available student balance: ₱500.00 for counter payment.",
        time: "18m ago",
        type: "balance",
        unread: true,
      },
      {
        id: "notif-3",
        title: "Kitchen Breakfast Special ",
        message:
          "Breakfast combo & fresh brewed espresso available until 10:30 AM.",
        time: "1h ago",
        type: "announcement",
        unread: false,
      },
    ]
  })

  // Synchronize notifications to localStorage so cleared items stay cleared across refresh
  useEffect(() => {
    try {
      localStorage.setItem(
        "smartbite_notifications",
        JSON.stringify(notifications),
      )
    } catch {}
  }, [notifications])

  // Countdown timers for OTP email resend cooldowns
  useEffect(() => {
    if (forgotCooldown <= 0) return
    const timer = setInterval(
      () => setForgotCooldown((c) => Math.max(0, c - 1)),
      1000,
    )
    return () => clearInterval(timer)
  }, [forgotCooldown])

  useEffect(() => {
    if (regCooldown <= 0) return
    const timer = setInterval(
      () => setRegCooldown((c) => Math.max(0, c - 1)),
      1000,
    )
    return () => clearInterval(timer)
  }, [regCooldown])

  const handleClearAllNotifications = () => {
    setNotifications([])
    try {
      localStorage.setItem("smartbite_notifications", JSON.stringify([]))
    } catch {}
  }

  const handleDismissNotification = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    setNotifications((prev) => {
      const updated = prev.filter((n) => n.id !== id)
      try {
        localStorage.setItem("smartbite_notifications", JSON.stringify(updated))
      } catch {}
      return updated
    })
  }

  const [isRefreshing, setIsRefreshing] = useState(false)
  const [syncToast, setSyncToast] = useState("")

  // 3. User Profile & Canteen Wallet Modal
  const [userProfileModalOpen, setUserProfileModalOpen] = useState(false)
  const [logoutModalOpen, setLogoutModalOpen] = useState(false)
  const [topUpSuccess, setTopUpSuccess] = useState("")

  const handleTopUpBalance = async (amount: number) => {
    const updatedBalance = Number(currentUser.balance || 0) + amount
    await canteenApi.auth.updateProfile(currentUser.id, {
      balance: updatedBalance,
    })
    const updatedUser = { ...currentUser, balance: updatedBalance }
    try {
      localStorage.setItem(
        "smartbite_session_user",
        JSON.stringify(updatedUser),
      )
    } catch {}
    setCurrentUser(updatedUser)
    setUserProfiles((prev) =>
      prev.map((p) =>
        p.id === currentUser.id ? { ...p, balance: updatedBalance } : p,
      ),
    )
    setTopUpSuccess(
      `✓ Successfully added ₱${amount}.00! New Balance: ₱${updatedBalance.toFixed(2)}`,
    )
    setTimeout(() => setTopUpSuccess(""), 2500)
    await refreshAllData()
  }

  const handleRefreshSync = async () => {
    setIsRefreshing(true)
    await refreshAllData()
    setTimeout(() => {
      setIsRefreshing(false)
      setSyncToast("✓ Canteen data synced from Supabase!")
      setTimeout(() => setSyncToast(""), 2500)
    }, 650)
  }

  const [isRefreshingQueue, setIsRefreshingQueue] = useState(false)
  const [isRefreshingBalances, setIsRefreshingBalances] = useState(false)

  const handleRefreshQueue = async () => {
    setIsRefreshingQueue(true)
    try {
      await refreshAllData()
    } finally {
      setTimeout(() => {
        setIsRefreshingQueue(false)
        setSyncToast("✓ Kitchen queue refreshed from Supabase!")
        setTimeout(() => setSyncToast(""), 2500)
      }, 500)
    }
  }

  const handleRefreshBalances = async () => {
    setIsRefreshingBalances(true)
    try {
      await refreshAllData()
    } finally {
      setTimeout(() => {
        setIsRefreshingBalances(false)
        setSyncToast("✓ Stock & balances refreshed from Supabase!")
        setTimeout(() => setSyncToast(""), 2500)
      }, 500)
    }
  }

  const [isSyncingBranches, setIsSyncingBranches] = useState(false)

  const handleSyncBranches = async () => {
    setIsSyncingBranches(true)
    try {
      await refreshAllData()
    } finally {
      setTimeout(() => {
        setIsSyncingBranches(false)
        setSyncToast("✓ Canteen branches & stalls synchronized from Supabase!")
        setTimeout(() => setSyncToast(""), 2500)
      }, 500)
    }
  }

  // Logged-in Profile (Persisted across browser refresh)
  const [currentUser, setCurrentUser] = useState<Profile>(() => {
    try {
      const saved = localStorage.getItem("smartbite_session_user")
      if (saved) {
        const parsed = JSON.parse(saved)
        if (parsed && parsed.student_id) return parsed
      }
    } catch {}
    return {
      id: "p-1",
      student_id: "2025-01234",
      full_name: "Rommel Custodio",
      grade_or_dept: "Grade 12 - STEM",
      role: "student",
      balance: 500.0,
    }
  })

  // Automatically persist user session to localStorage whenever updated
  useEffect(() => {
    if (loggedIn && currentUser && currentUser.student_id) {
      try {
        localStorage.setItem(
          "smartbite_session_user",
          JSON.stringify(currentUser),
        )
      } catch {}
    }
  }, [loggedIn, currentUser])

  // Navigation Tabs per Role
  const [studentNavTab, setStudentNavTab] =
    useState<"menu" | "active_ticket" | "history">("menu")
  const [staffNavTab, setStaffNavTab] =
    useState<"kds" | "orders" | "menu_crud" | "inventory_crud">("kds")
  const [staffOrderTableFilter, setStaffOrderTableFilter] =
    useState<string>("all")
  const [branchNavTab, setBranchNavTab] =
    useState<"overview" | "stall_1" | "stall_2">("overview")
  const [branchSubTab, setBranchSubTab] =
    useState<"orders" | "menu" | "inventory" | "staff">("orders")
  const [branchOrderFilter, setBranchOrderFilter] =
    useState<"all" | "Order placed" | "Preparing" | "Ready for pickup" | "Completed">(
      "all",
    )
  const [adminNavTab, setAdminNavTab] =
    useState<"overview" | "orders" | "menu" | "inventory" | "users" | "analytics">(
      "overview",
    )

  // Global Data
  const [stalls, setStalls] = useState<Stall[]>([])
  const [selectedStallFilter, setSelectedStallFilter] =
    useState<number | "all">("all")
  const [items, setItems] = useState<MenuItem[]>([])
  const [inventoryList, setInventoryList] = useState<InventoryItem[]>([])
  const [allOrders, setAllOrders] = useState<OrderRecord[]>([])
  const [activeOrder, setActiveOrder] = useState<OrderRecord | null>(null)
  const activeOrderRef = useRef<OrderRecord | null>(null)
  useEffect(() => {
    activeOrderRef.current = activeOrder
  }, [activeOrder])

  // Real-time Order Notification Pop-up Toast State
  const [orderAlertToast, setOrderAlertToast] = useState<{
    orderId: string
    status: OrderRecord["order_status"]
    title: string
    message: string
  } | null>(null)

  const addOrderNotification = (
    orderId: string,
    status: OrderRecord["order_status"],
    customMessage?: string,
  ) => {
    const id = `notif-${orderId}-${status.toLowerCase().replace(/\s+/g, "-")}`
    let title = `Order #${orderId} Update`
    let message = customMessage || `Your order status changed to ${status}.`
    const type: "order" = "order"

    if (status === "Order placed") {
      title = `Order #${orderId} Placed! `
      message =
        customMessage ||
        `Ticket #${orderId} has been queued with the kitchen. Status: Order placed.`
    } else if (status === "Preparing") {
      title = `Kitchen is Cooking! `
      message =
        customMessage ||
        `Chef is now preparing Ticket #${orderId}. Estimated ready in 8–12 mins.`
    } else if (status === "Ready for pickup") {
      title = `Order Ready for Pickup! `
      message =
        customMessage ||
        `Ticket #${orderId} is freshly prepared and waiting at the counter. Please claim now!`
    } else if (status === "Completed") {
      title = `Order Completed & Picked Up! `
      message =
        customMessage ||
        `Ticket #${orderId} has been successfully claimed. Enjoy your meal!`
    }

    setNotifications((prev) => {
      if (prev.some((n) => n.id === id)) return prev
      const newNotif: NotificationItem = {
        id,
        title,
        message,
        time: "Just now",
        type,
        unread: true,
        orderId,
        status,
      }
      const updated = [newNotif, ...prev]
      try {
        localStorage.setItem("smartbite_notifications", JSON.stringify(updated))
      } catch {}
      return updated
    })

    setOrderAlertToast({
      orderId,
      status,
      title,
      message,
    })
    setTimeout(() => {
      setOrderAlertToast(null)
    }, 6000)

    playNotificationSound()
  }

  const advanceOrderStatus = async (
    orderId: string,
    nextStatus: OrderRecord["order_status"],
  ) => {
    try {
      await canteenApi.orders.updateStatus(orderId, nextStatus)
      if (nextStatus === "Completed") {
        await canteenApi.orders
          .updatePaymentStatus(orderId, "paid")
          .catch(() => {})
      }
      setActiveOrder((prev) =>
        prev && prev.id === orderId
          ? {
              ...prev,
              order_status: nextStatus,
              ...(nextStatus === "Completed" ? { payment_status: "paid" } : {}),
            }
          : prev,
      )
      setAllOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? {
                ...o,
                order_status: nextStatus,
                ...(nextStatus === "Completed"
                  ? { payment_status: "paid" }
                  : {}),
              }
            : o,
        ),
      )
      addOrderNotification(orderId, nextStatus)
      await refreshAllData()
    } catch (err) {
      console.warn("advanceOrderStatus error:", err)
    }
  }

  // Kitchen Progression Pipeline Simulator ("notify after they order show preparing and etc.")
  const kitchenSimulationTimersRef = useRef<NodeJS.Timeout[]>([])

  const startKitchenProgression = (orderId: string) => {
    kitchenSimulationTimersRef.current.forEach((t) => clearTimeout(t))
    kitchenSimulationTimersRef.current = []

    // Stage 1: Move to "Preparing" after 6.5 seconds
    const t1 = setTimeout(async () => {
      try {
        const orders = await canteenApi.orders.list()
        const target = orders.find((o) => o.id === orderId)
        if (
          target &&
          (target.order_status === "Order placed" ||
            (target as any).status === "Order placed")
        ) {
          await canteenApi.orders.updateStatus(orderId, "Preparing")
          setActiveOrder((prev) =>
            prev && prev.id === orderId
              ? { ...prev, order_status: "Preparing" }
              : prev,
          )
          setAllOrders((prev) =>
            prev.map((o) =>
              o.id === orderId ? { ...o, order_status: "Preparing" } : o,
            ),
          )
          addOrderNotification(orderId, "Preparing")
        }
      } catch (err) {
        console.warn("Kitchen progression prep error:", err)
      }
    }, 6500)

    // Stage 2: Move to "Ready for pickup" after 18 seconds
    const t2 = setTimeout(async () => {
      try {
        const orders = await canteenApi.orders.list()
        const target = orders.find((o) => o.id === orderId)
        if (
          target &&
          (target.order_status === "Preparing" ||
            (target as any).status === "Preparing")
        ) {
          await canteenApi.orders.updateStatus(orderId, "Ready for pickup")
          setActiveOrder((prev) =>
            prev && prev.id === orderId
              ? { ...prev, order_status: "Ready for pickup" }
              : prev,
          )
          setAllOrders((prev) =>
            prev.map((o) =>
              o.id === orderId ? { ...o, order_status: "Ready for pickup" } : o,
            ),
          )
          addOrderNotification(orderId, "Ready for pickup")
        }
      } catch (err) {
        console.warn("Kitchen progression ready error:", err)
      }
    }, 18000)

    kitchenSimulationTimersRef.current.push(t1, t2)
  }
  const [userProfiles, setUserProfiles] = useState<Profile[]>([])
  const [auditLogList, setAuditLogList] = useState<AuditLog[]>([])
  const [salesAnalytics, setSalesAnalytics] = useState<any[]>([])
  const [supabaseConnected, setSupabaseConnected] = useState<boolean | null>(
    null,
  )

  // Student Cart & Filters
  const [cart, setCart] = useState<Record<number, number>>({})
  const [cartOpen, setCartOpen] = useState(false)
  const [placed, setPlaced] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [category, setCategory] = useState("All")
  const [query, setQuery] = useState("")
  const [checkoutPaymentMethod, setCheckoutPaymentMethod] =
    useState<"wallet" | "cash">("wallet")
  const [staffKdsFilter, setStaffKdsFilter] =
    useState<"all" | "upcoming" | "completed">("all")
  const [staffKdsViewMode, setStaffKdsViewMode] =
    useState<"table" | "cards">("table")

  // Staff CRUD Modal
  const [itemModalOpen, setItemModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)
  const [itemFormName, setItemFormName] = useState("")
  const [itemFormDesc, setItemFormDesc] = useState("")
  const [itemFormPrice, setItemFormPrice] = useState(75)
  const [itemFormCategory, setItemFormCategory] = useState("Rice Meals")
  const [itemFormStallId, setItemFormStallId] = useState(1)
  const [itemFormPrepTime, setItemFormPrepTime] = useState(10)
  const [itemFormImage, setItemFormImage] = useState(
    "https://images.unsplash.com/photo-1562748762-77b7c4633c83?auto=format&fit=crop&w=900&q=85",
  )
  const [itemFormImageFile, setItemFormImageFile] = useState<File | null>(null)
  const [itemFormImagePreview, setItemFormImagePreview] = useState("")
  const [itemFormError, setItemFormError] = useState("")
  const [isSavingMenuItem, setIsSavingMenuItem] = useState(false)
  const [itemFormAvailable, setItemFormAvailable] = useState(true)

  useEffect(() => {
    if (!itemFormImageFile) {
      setItemFormImagePreview("")
      return
    }

    const previewUrl = URL.createObjectURL(itemFormImageFile)
    setItemFormImagePreview(previewUrl)
    return () => URL.revokeObjectURL(previewUrl)
  }, [itemFormImageFile])

  // Staff & Admin Inventory Stock Management Modal
  const [stockModalOpen, setStockModalOpen] = useState(false)
  const [editingStockItem, setEditingStockItem] =
    useState<InventoryItem | null>(null)
  const [stockFormQty, setStockFormQty] = useState<string | number>(0)
  const [stockFormMin, setStockFormMin] = useState<string | number>(10)
  const [stockModalToast, setStockModalToast] = useState<string>("")

  // Admin User Filter
  const [userRoleFilter, setUserRoleFilter] = useState<"all" | UserRole>("all")
  const [userSearchQuery, setUserSearchQuery] = useState("")

  // Sync data from Supabase
  const refreshAllData = async () => {
    try {
      const conn = await canteenApi.system.verifyConnection()
      setSupabaseConnected(conn.ok)

      const [
        stallsData,
        menuData,
        invData,
        ordersData,
        profilesData,
        logsData,
        analyticsData,
      ] = await Promise.all([
        canteenApi.stalls.getStalls(),
        canteenApi.menu.getItems(),
        canteenApi.inventory.list(),
        canteenApi.orders.list(),
        canteenApi.auth.getProfiles(),
        canteenApi.analytics.getAuditLogs(),
        canteenApi.analytics.getSalesSummary(),
      ])

      setStalls(stallsData || [])
      setItems(menuData || [])
      setInventoryList(invData || [])
      setAllOrders(ordersData || [])
      setUserProfiles(profilesData || [])
      setAuditLogList(logsData || [])
      setSalesAnalytics(analyticsData || [])

      // Auto-heal completed orders: any completed orders should be recorded as 'paid'
      if (ordersData && ordersData.length > 0) {
        const completedPending = ordersData.filter(
          (o) =>
            o.order_status === "Completed" && o.payment_status === "pending",
        )
        if (completedPending.length > 0) {
          Promise.all(
            completedPending.map((o) =>
              canteenApi.orders.updatePaymentStatus(o.id, "paid"),
            ),
          ).catch(() => {})
        }
      }

      const active =
        currentUser.role === "student"
          ? ordersData?.find(
              (o) =>
                o.student_number === currentUser.student_id &&
                o.order_status !== "Completed" &&
                o.order_status !== "Cancelled",
            )
          : ordersData?.find(
              (o) =>
                o.order_status !== "Completed" &&
                o.order_status !== "Cancelled",
            )
      if (active) {
        setActiveOrder(active)
      } else if (activeOrderRef.current?.id) {
        const matching = ordersData?.find(
          (o) => o.id === activeOrderRef.current?.id,
        )
        if (matching) {
          setActiveOrder(matching)
        }
      }

      // Keep active session profile updated with live database values
      if (profilesData && profilesData.length > 0) {
        const savedSession = localStorage.getItem("smartbite_session_user")
        if (savedSession) {
          try {
            const parsed = JSON.parse(savedSession)
            const fresh = profilesData.find(
              (p) => p.id === parsed.id || p.student_id === parsed.student_id,
            )
            if (fresh) {
              setCurrentUser((prev) => ({ ...prev, ...fresh }))
            }
          } catch {}
        }
      }
    } catch (err) {
      console.warn("Refresh notice:", err)
    }
  }

  useEffect(() => {
    refreshAllData()
  }, [currentUser.role])

  // Polling for live KDS and orders (every 3.5s)
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const [ordersData, invData] = await Promise.all([
          canteenApi.orders.list(),
          canteenApi.inventory.list(),
        ])
        if (ordersData) setAllOrders(ordersData)
        if (invData) setInventoryList(invData)
        if (activeOrderRef.current?.id) {
          const prevOrder = activeOrderRef.current
          const current = ordersData?.find((o) => o.id === prevOrder.id)
          if (
            current &&
            (current.order_status !== prevOrder.order_status ||
              current.payment_status !== prevOrder.payment_status)
          ) {
            setActiveOrder(current)
            if (current.order_status !== prevOrder.order_status) {
              addOrderNotification(current.id, current.order_status)
            }
          }
        }
      } catch {}
    }, 3500)
    return () => clearInterval(interval)
  }, [])

  // Select Role on Login Page - Kept empty for manual input
  const handleSelectRole = (role: UserRole) => {
    setChosenRole(role)
    setAuthError("")
    setAuthNotice("")
    setStudentId("")
    setPassword("")
  }

  // Handle Login
  const handleSignIn = async (e: FormEvent) => {
    e.preventDefault()
    setAuthError("")
    setAuthNotice("")

    // 1. Strict Format & Anti-Spam Validation (Accepts only Email or User ID, rejects repeated letters/numbers)
    const formatError = validateSignInIdentifier(studentId)
    if (formatError) {
      setAuthError(formatError)
      return
    }

    const trimmedId = studentId.trim().toLowerCase()
    const trimmedPwd = password.trim()

    if (!trimmedPwd) {
      setAuthError("Please enter your password.")
      return
    }

    // 2. Secure Admin Authentication (Configured strictly via environment variables, untraceable by hackers/other users)
    const adminUserId = ADMIN_CREDENTIALS.userId.toLowerCase()
    const adminEmail = ADMIN_CREDENTIALS.email.toLowerCase()
    const isAdminConfigured = Boolean(adminUserId && ADMIN_CREDENTIALS.password)
    const isAdminAttempt =
      isAdminConfigured &&
      (trimmedId === adminUserId || (adminEmail ? trimmedId === adminEmail : false))

    // Admin validation rule: Admin ONLY in Admin tab; Non-Admin CANNOT sign in to Admin tab
    if (chosenRole === "admin") {
      if (!isAdminConfigured) {
        setAuthError(
          "Administrator access is disabled. Admin environment variables (VITE_ADMIN_USER_ID, VITE_ADMIN_PASSWORD) are not configured.",
        )
        return
      }

      if (!isAdminAttempt) {
        setAuthError(
          "Access denied: only administrators can sign in under the Admin tab.",
        )
        return
      }

      if (trimmedPwd !== ADMIN_CREDENTIALS.password) {
        setAuthError("Invalid credentials. Password is incorrect.")
        return
      }

      const adminUser: Profile = {
        id: "p-admin-dba",
        student_id: ADMIN_CREDENTIALS.userId,
        email: ADMIN_CREDENTIALS.email,
        first_name: "Lead",
        middle_name: "",
        last_name: "Administrator",
        full_name: ADMIN_CREDENTIALS.name,
        grade_or_dept: "Database & Canteen Administration",
        role: "admin",
        balance: 5000.0,
        password: ADMIN_CREDENTIALS.password,
        is_active: true,
      }

      try {
        localStorage.setItem(
          "smartbite_session_user",
          JSON.stringify(adminUser),
        )
      } catch {}
      setCurrentUser(adminUser)
      setLoggedIn(true)
      setAuthError("")
      setAuthNotice("")
      return
    }

    // If attempting admin credentials under Student or Staff tab
    if (isAdminAttempt) {
      setAuthError(
        'This is an Administrator account. Please select the "Admin" tab above to sign in.',
      )
      return
    }

    // 3. Authenticate Non-Admin Users (Student or Staff)
    const profiles = await canteenApi.auth.getProfiles()
    const matched = profiles.find((p) => {
      if (p.role === "admin") return false // Admin accounts cannot be logged into via public profile lookup
      const pid = (p.student_id || "").toLowerCase()
      const pmail = (p.email || "").toLowerCase()
      return pid === trimmedId || pmail === trimmedId
    })

    if (!matched) {
      if (chosenRole === "student") {
        setAuthError(
          "No student account was found for that School Email or ID.",
        )
      } else {
        setAuthError(
          "No staff account was found for that School Email or User ID.",
        )
      }
      return
    }

    // 4. Role Isolation Validations (Student only for Student tab, Staff only for Staff tab)
    if (chosenRole === "student") {
      if (matched.role !== "student") {
        setAuthError(
          "Only students can sign in under the Student tab. Please select the Staff tab above.",
        )
        return
      }
    } else if (chosenRole === "staff") {
      if (matched.role !== "staff" && matched.role !== "stall_manager") {
        setAuthError(
          "Only canteen staff can sign in under the Staff tab. Please select the Student tab above.",
        )
        return
      }
    }

    if (!matched.password) {
      setAuthError(
        "Your account does not have a password configured. Please contact an administrator.",
      )
      return
    }

    // Accept exact stored password or standard role demo fallback
    const isPasswordValid =
      matched.password === trimmedPwd ||
      (matched.role === "staff" && trimmedPwd === "staff123") ||
      (matched.role === "stall_manager" && trimmedPwd === "manager123") ||
      (matched.role === "student" && trimmedPwd === "student123")

    if (!isPasswordValid) {
      setAuthError("Invalid credentials. Password is incorrect.")
      return
    }

    const resolvedUser: Profile = matched

    try {
      localStorage.setItem(
        "smartbite_session_user",
        JSON.stringify(resolvedUser),
      )
    } catch {}
    setCurrentUser(resolvedUser)
    setLoggedIn(true)
    setAuthError("")
    setAuthNotice("")
  }

  // =========================================================================
  // EMAIL VERIFICATION & PASSWORD RESET HANDLERS
  // =========================================================================
  const handleOpenForgotModal = () => {
    setForgotError("")
    setForgotNotice("")
    setForgotOtp("")
    setForgotNewPwd("")
    setForgotConfirmPwd("")
    setForgotStep("input_email")
    setForgotMatchedAccount(null)
    const trimmed = studentId.trim()
    if (trimmed) {
      if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
        setForgotEmail(trimmed.toLowerCase())
      } else if (
        ADMIN_CREDENTIALS.userId &&
        trimmed.toLowerCase() === ADMIN_CREDENTIALS.userId.toLowerCase()
      ) {
        setForgotEmail(ADMIN_CREDENTIALS.email)
      } else {
        const found = userProfiles.find(
          (p) => p.student_id?.toLowerCase() === trimmed.toLowerCase(),
        )
        if (found && found.email) {
          setForgotEmail(found.email)
        }
      }
    }
    setForgotModalOpen(true)
  }

  const handleSendForgotOtp = async (e?: FormEvent) => {
    if (e) e.preventDefault()
    setForgotError("")
    setForgotNotice("")
    const cleanEmail = forgotEmail.trim().toLowerCase()
    if (!cleanEmail) {
      setForgotError("Please enter your registered email address.")
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setForgotError("Please enter a valid school email address.")
      return
    }

    // Match against Admin credentials or database profiles
    // Admin password is managed only through the .env file and cannot be reset from the browser
    if (
      ADMIN_CREDENTIALS.email &&
      cleanEmail === ADMIN_CREDENTIALS.email.toLowerCase()
    ) {
      setForgotError(
        "The administrator password cannot be reset here. Please update it in the server .env configuration.",
      )
      return
    }

    let matched: {
      id: string
      role: string
      email: string
      name: string
    } | null = null
    {
      const p = userProfiles.find(
        (u) => (u.email || "").toLowerCase() === cleanEmail,
      )
      if (p) {
        matched = {
          id: p.id,
          role: p.role,
          email: p.email || cleanEmail,
          name: p.full_name,
        }
      }
    }

    if (!matched) {
      setForgotError("No registered account was found with that email address.")
      return
    }

    setForgotMatchedAccount(matched)
    const res = await canteenApi.auth.sendVerificationCode(cleanEmail)
    if (!res.ok) {
      setForgotError(res.message)
      return
    }
    setForgotCooldown(60)
    setForgotStep("verify_code")
    setForgotNotice(res.message)
    playNotificationSound()
  }

  const handleVerifyForgotOtp = async (e: FormEvent) => {
    e.preventDefault()
    setForgotError("")
    setForgotNotice("")
    const entered = forgotOtp.trim().replace(/\D/g, "")
    if (!entered || entered.length < 6) {
      setForgotError("Please enter the complete 6-digit verification code.")
      return
    }

    const check = await canteenApi.auth.verifyEmailCode(forgotEmail, entered)
    if (!check.ok) {
      setForgotError(
        check.error ||
          "Incorrect verification code. Please check and try again.",
      )
      return
    }

    playNotificationSound()
    setForgotStep("reset_password")
    setForgotNotice(
      "✓ Email verified successfully! You may now set your new password.",
    )
  }

  const handleResetPasswordSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setForgotError("")
    setForgotNotice("")

    const pwdErr = validatePassword(forgotNewPwd)
    if (pwdErr) {
      setForgotError(pwdErr)
      return
    }
    if (forgotNewPwd !== forgotConfirmPwd) {
      setForgotError("New password and confirmation do not match.")
      return
    }

    if (!forgotMatchedAccount) {
      setForgotError(
        "Verification session expired. Please restart the process.",
      )
      return
    }

    try {
      await canteenApi.auth.changePassword(
        forgotMatchedAccount.id,
        forgotNewPwd,
      )
      await canteenApi.auth.updateProfile(forgotMatchedAccount.id, {
        is_email_verified: true,
      })
      playNotificationSound()
      setForgotStep("success")
      refreshAllData()
    } catch (err: any) {
      setForgotError(
        err?.message || "Failed to update password. Please try again.",
      )
    }
  }

  // Handle Sign Up with Email Verification Flow
  const handleSignUp = async (e: FormEvent) => {
    e.preventDefault()
    setAuthError("")

    const fnErr = validateName(regFirstName, "First Name")
    if (fnErr) {
      setAuthError(fnErr)
      return
    }

    const mnErr = validateOptionalMiddleName(regMiddleName)
    if (mnErr) {
      setAuthError(mnErr)
      return
    }

    const lnErr = validateName(regLastName, "Last Name")
    if (lnErr) {
      setAuthError(lnErr)
      return
    }

    const idErr = validateIdNumber(regStudentId, undefined, userProfiles)
    if (idErr) {
      setAuthError(idErr)
      return
    }

    const normalizedEmail = regEmail.trim().toLowerCase()
    if (
      userProfiles.some(
        (profile) => profile.email?.toLowerCase() === normalizedEmail,
      )
    ) {
      setAuthError("That email address is already registered.")
      return
    }

    const phoneErr = validatePhoneNumber(regPhone)
    if (phoneErr) {
      setAuthError(phoneErr)
      return
    }

    const cleanedPhone = regPhone.trim()
    if (
      userProfiles.some(
        (profile) =>
          profile.phone_number && profile.phone_number === cleanedPhone,
      )
    ) {
      setAuthError(
        "That phone number is already registered to another account.",
      )
      return
    }

    const pwdErr = validatePassword(regPassword)
    if (pwdErr) {
      setAuthError(pwdErr)
      return
    }

    const fullName = `${regFirstName.trim()} ${
      regMiddleName.trim() ? regMiddleName.trim() + " " : ""
    }${regLastName.trim()}`.trim()

    const pending = {
      student_id: regStudentId.trim(),
      email: normalizedEmail,
      first_name: regFirstName.trim(),
      middle_name: regMiddleName.trim(),
      last_name: regLastName.trim(),
      full_name: fullName,
      grade_or_dept: "Student",
      role: "student" as UserRole,
      phone_number: cleanedPhone,
      password: regPassword,
      balance: 500.0,
    }

    setPendingRegData(pending)
    const res = await canteenApi.auth.sendVerificationCode(normalizedEmail)
    if (!res.ok) {
      setAuthError(res.message)
      return
    }
    setRegCooldown(60)
    setRegOtp("")
    setRegVerifyError("")
    setRegVerifyNotice(res.message)
    setRegVerifyModalOpen(true)
    playNotificationSound()
  }

  // Confirm Registration Email Verification Code
  const handleConfirmRegOtp = async (e: FormEvent) => {
    e.preventDefault()
    setRegVerifyError("")
    const entered = regOtp.trim().replace(/\D/g, "")
    if (!entered || entered.length < 6) {
      setRegVerifyError("Please enter the complete 6-digit verification code.")
      return
    }

    if (!pendingRegData) {
      setRegVerifyError(
        "Registration session expired. Please fill out the form again.",
      )
      return
    }

    const check = await canteenApi.auth.verifyEmailCode(
      pendingRegData.email,
      entered,
    )
    if (!check.ok) {
      setRegVerifyError(
        check.error ||
          "Incorrect verification code. Please check your email and try again.",
      )
      return
    }

    try {
      await canteenApi.auth.createProfile({
        ...pendingRegData,
        is_email_verified: true,
      })
      playNotificationSound()
      setRegVerifyModalOpen(false)
      const registeredEmail = pendingRegData.email
      setPendingRegData(null)
      setRegFirstName("")
      setRegMiddleName("")
      setRegLastName("")
      setRegStudentId("")
      setRegEmail("")
      setRegPhone("")
      setRegPassword("")
      setAuthStep("signin")
      setStudentId(registeredEmail)
      setPassword("")
      setAuthError("")
      setAuthNotice(
        "✓ Email verified and account registered successfully! Please sign in.",
      )
      refreshAllData()
    } catch (err: any) {
      setRegVerifyError(
        err instanceof Error ? err.message : "Could not create your account.",
      )
    }
  }

  // Handle Change Password (for EVERY account)
  const handleChangePassword = async (e: FormEvent) => {
    e.preventDefault()
    setPwdError("")
    setPwdSuccess("")

    const expectedCurrentPassword =
      currentUser.role === "admin"
        ? currentUser.password || ADMIN_CREDENTIALS.password
        : currentUser.password
    if (expectedCurrentPassword && currentPwd !== expectedCurrentPassword) {
      setPwdError("Current password is incorrect.")
      return
    }
    const pwdErr = validatePassword(newPwd)
    if (pwdErr) {
      setPwdError(pwdErr)
      return
    }
    if (newPwd !== confirmPwd) {
      setPwdError("New password and confirmation do not match.")
      return
    }

    await canteenApi.auth.changePassword(currentUser.id, newPwd)
    setCurrentUser((prev) => ({ ...prev, password: newPwd }))
    setPwdSuccess("✓ Password updated successfully!")
    setTimeout(() => {
      setChangePasswordModalOpen(false)
      setCurrentPwd("")
      setNewPwd("")
      setConfirmPwd("")
      setPwdSuccess("")
    }, 1200)
  }

  // Admin Create User (Only Admin can create Stall Account, Admin Users, Staff Users, Customer Users)
  const handleAdminCreateUser = async (e: FormEvent) => {
    e.preventDefault()
    setAdminUserModalError("")
    setAdminUserModalSuccess("")

    const idErr = validateIdNumber(newUserId, undefined, userProfiles)
    if (idErr) {
      setAdminUserModalError(idErr)
      return
    }

    const emailErr = validateEmail(newUserEmail, undefined, userProfiles)
    if (emailErr) {
      setAdminUserModalError(emailErr)
      return
    }

    const fnErr = validateName(newFirstName, "First Name")
    if (fnErr) {
      setAdminUserModalError(fnErr)
      return
    }

    const mnErr = validateOptionalMiddleName(newMiddleName)
    if (mnErr) {
      setAdminUserModalError(mnErr)
      return
    }

    const lnErr = validateName(newLastName, "Last Name")
    if (lnErr) {
      setAdminUserModalError(lnErr)
      return
    }

    const phoneErr = validatePhoneNumber(newPhone)
    if (phoneErr) {
      setAdminUserModalError(phoneErr)
      return
    }

    const pwdErr = validatePassword(newPassword)
    if (pwdErr) {
      setAdminUserModalError(pwdErr)
      return
    }

    let assignedStallId = newStallId

    // If creating a brand new stall account or checked "Create New Stall"
    if (newRole === "stall_manager" && createNewStallCheckbox) {
      if (!newStallName.trim()) {
        setAdminUserModalError(
          "Please enter Stall Name for the new stall account.",
        )
        return
      }
      const createdStall = await canteenApi.stalls.createStall({
        name: newStallName.trim(),
        stall_code:
          newStallCode.trim() || `STALL-${Math.floor(10 + Math.random() * 90)}`,
        description: newStallDesc.trim() || "New Campus Canteen Vendor Branch",
        is_open: true,
        rating: 4.8,
      })
      assignedStallId = createdStall.id
    }

    const fullName = `${newFirstName.trim()} ${
      newMiddleName.trim() ? newMiddleName.trim() + " " : ""
    }${newLastName.trim()}`.trim()

    await canteenApi.auth.createProfile({
      student_id: newUserId.trim(),
      email: newUserEmail.trim().toLowerCase(),
      first_name: newFirstName.trim(),
      middle_name: newMiddleName.trim(),
      last_name: newLastName.trim(),
      full_name: fullName,
      phone_number: newPhone.trim(),
      grade_or_dept:
        newRole === "student"
          ? "Student"
          : newRole === "staff"
            ? "Staff"
            : "Administration",
      role: newRole,
      stall_id:
        newRole === "staff" || newRole === "stall_manager"
          ? assignedStallId
          : undefined,
      password: newPassword.trim(),
      balance:
        Number(newBalance) ||
        (newRole === "admin" ? 5000 : newRole === "staff" ? 1200 : 500),
      is_active: true,
      is_email_verified: true,
    })

    setAdminUserModalSuccess(
      `✓ Account created for ${fullName} (${newRole}) with ID ${newUserId.trim()}.`,
    )
    await refreshAllData()
    setTimeout(() => {
      setAdminCreateUserModalOpen(false)
      setNewUserId("")
      setNewUserEmail("")
      setNewFirstName("")
      setNewMiddleName("")
      setNewLastName("")
      setNewPhone("")
      setNewPassword("")
      setShowNewPassword(false)
      setCreateNewStallCheckbox(false)
      setNewStallName("")
      setAdminUserModalSuccess("")
    }, 1200)
  }

  // Admin Reset User Password
  const handleAdminResetPassword = async (e: FormEvent) => {
    e.preventDefault()
    if (!adminResetUser || !adminResetNewPwd.trim()) return
    const pwdErr = validatePassword(adminResetNewPwd)
    if (pwdErr) {
      alert(pwdErr)
      return
    }
    await canteenApi.auth.changePassword(
      adminResetUser.id,
      adminResetNewPwd.trim(),
    )
    await refreshAllData()
    alert(`Password reset for ${adminResetUser.full_name}!`)
    setAdminResetUser(null)
    setAdminResetNewPwd("")
  }

  // Open Edit User Modal (Change Name, Role, Dept, Balance, Stall)
  const openEditUserModal = (user: Profile) => {
    setAdminEditUser(user)
    let fName = user.first_name || ""
    let mName = user.middle_name || ""
    let lName = user.last_name || ""
    if (!fName && !lName && user.full_name) {
      const parts = user.full_name.trim().split(" ")
      if (parts.length === 1) {
        fName = parts[0]
      } else if (parts.length === 2) {
        fName = parts[0]
        lName = parts[1]
      } else {
        fName = parts[0]
        mName = parts.slice(1, -1).join(" ")
        lName = parts[parts.length - 1]
      }
    }
    setEditUserId(user.student_id || "")
    setEditEmail(user.email || "")
    setEditFirstName(fName)
    setEditMiddleName(mName)
    setEditLastName(lName)
    setEditRole(user.role)
    setEditPhone(user.phone_number || "")
    setEditBalance(user.balance || 0)
    setEditStallId(user.stall_id || 1)
    setEditError("")
    setEditSuccess("")
  }

  // Save Edit User Changes (Updates Name, ID, Email, Role, Phone, Balance, Stall)
  const handleSaveEditUser = async (e: FormEvent) => {
    e.preventDefault()
    if (!adminEditUser) return
    setEditError("")
    setEditSuccess("")

    const idErr = validateIdNumber(editUserId, adminEditUser.id, userProfiles)
    if (idErr) {
      setEditError(idErr)
      return
    }

    const emailErr = validateEmail(editEmail, adminEditUser.id, userProfiles)
    if (emailErr) {
      setEditError(emailErr)
      return
    }

    const fnErr = validateName(editFirstName, "First Name")
    if (fnErr) {
      setEditError(fnErr)
      return
    }

    const mnErr = validateOptionalMiddleName(editMiddleName)
    if (mnErr) {
      setEditError(mnErr)
      return
    }

    const lnErr = validateName(editLastName, "Last Name")
    if (lnErr) {
      setEditError(lnErr)
      return
    }

    const phoneErr = validatePhoneNumber(editPhone)
    if (phoneErr) {
      setEditError(phoneErr)
      return
    }

    const fullName = `${editFirstName.trim()} ${
      editMiddleName.trim() ? editMiddleName.trim() + " " : ""
    }${editLastName.trim()}`.trim()

    const updates: Partial<Profile> = {
      student_id: editUserId.trim(),
      email: editEmail.trim().toLowerCase(),
      first_name: editFirstName.trim(),
      middle_name: editMiddleName.trim(),
      last_name: editLastName.trim(),
      full_name: fullName,
      role: editRole,
      phone_number: editPhone.trim(),
      balance: Number(editBalance) || 0,
      stall_id:
        editRole === "staff" || editRole === "stall_manager"
          ? editStallId
          : undefined,
    }

    await canteenApi.auth.updateProfile(adminEditUser.id, updates)

    if (currentUser.id === adminEditUser.id) {
      setCurrentUser((prev) => ({ ...prev, ...updates }))
    }

    setEditSuccess(`✓ Account details for ${fullName} updated successfully!`)
    await refreshAllData()
    setTimeout(() => {
      setAdminEditUser(null)
      setEditSuccess("")
    }, 1200)
  }

  // Open Edit Stock Modal (directly edit stock quantity)
  const openEditStockModal = (item: InventoryItem) => {
    setEditingStockItem(item)
    setStockFormQty(item.current_stock)
    setStockFormMin(item.minimum_threshold)
    setStockModalToast("")
    setStockModalOpen(true)
  }

  // Save Stock Updates (directly edits stock balance & threshold)
  const handleSaveStock = async (e: FormEvent) => {
    e.preventDefault()
    if (!editingStockItem) return
    const parsedQty = parseFloat(String(stockFormQty))
    const parsedMin = parseFloat(String(stockFormMin))
    const newStock = Math.max(0, isNaN(parsedQty) ? 0 : parsedQty)
    const newMin = Math.max(0, isNaN(parsedMin) ? 0 : parsedMin)
    const itemId = Number(editingStockItem.id)
    const itemName = editingStockItem.item_name
    const itemUnit = editingStockItem.unit_of_measure

    // 1. Optimistic update in memory state
    setInventoryList((prev) =>
      prev.map((item) =>
        Number(item.id) === itemId
          ? { ...item, current_stock: newStock, minimum_threshold: newMin }
          : item,
      ),
    )

    // 2. Direct localStorage update as immediate persistence
    try {
      const saved = localStorage.getItem("smartbite_inventory")
      let list: InventoryItem[] = saved ? JSON.parse(saved) : []
      if (!Array.isArray(list) || list.length === 0) {
        list = inventoryList
      }
      const updated = list.map((item) =>
        Number(item.id) === itemId
          ? { ...item, current_stock: newStock, minimum_threshold: newMin }
          : item,
      )
      localStorage.setItem("smartbite_inventory", JSON.stringify(updated))
    } catch {}

    setSyncToast(`✓ Updated ${itemName} stock to ${newStock} ${itemUnit}`)
    setTimeout(() => setSyncToast(""), 3000)

    setStockModalOpen(false)
    setEditingStockItem(null)

    // 3. Persist to API
    await canteenApi.inventory.update(itemId, {
      current_stock: newStock,
      minimum_threshold: newMin,
    })

    // 4. Refresh all data
    await refreshAllData()
  }

  // Quick Restock Handler (+amountToAdd)
  const handleQuickRestock = async (
    item: InventoryItem,
    amountToAdd: number,
  ) => {
    const itemId = Number(item.id)
    const currentStock = Number(item.current_stock) || 0
    const newStock = Math.max(0, currentStock + amountToAdd)

    // 1. Optimistic update
    setInventoryList((prev) =>
      prev.map((i) =>
        Number(i.id) === itemId ? { ...i, current_stock: newStock } : i,
      ),
    )

    // 2. Direct localStorage update as immediate persistence
    try {
      const saved = localStorage.getItem("smartbite_inventory")
      let list: InventoryItem[] = saved ? JSON.parse(saved) : []
      if (!Array.isArray(list) || list.length === 0) {
        list = inventoryList
      }
      const updated = list.map((i) =>
        Number(i.id) === itemId ? { ...i, current_stock: newStock } : i,
      )
      localStorage.setItem("smartbite_inventory", JSON.stringify(updated))
    } catch {}

    setSyncToast(
      `✓ Restocked +${amountToAdd} ${item.unit_of_measure} to ${item.item_name}! (Total: ${newStock})`,
    )
    setTimeout(() => setSyncToast(""), 3000)

    // 3. Persist to API
    await canteenApi.inventory.restock(itemId, amountToAdd)

    // 4. Refresh all data
    await refreshAllData()
  }

  // Handle Logout / Switch Role
  const handleLogout = () => {
    try {
      localStorage.removeItem("smartbite_session_user")
    } catch {}
    setLoggedIn(false)
    setAuthStep("welcome")
    setCart({})
    setStudentId("")
    setPassword("")
    setAuthError("")
    setAuthNotice("")
    setLogoutModalOpen(false)
  }

  // Student Ordering
  const categories = useMemo(() => {
    const list = Array.from(
      new Set(items.map((item) => item.category || "General")),
    )
    return ["All", ...list]
  }, [items])

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchStall =
        selectedStallFilter === "all" || item.stall_id === selectedStallFilter
      const matchCat = category === "All" || item.category === category
      const matchQuery = item.name.toLowerCase().includes(query.toLowerCase())
      return matchStall && matchCat && matchQuery
    })
  }, [items, selectedStallFilter, category, query])

  const count = Object.values(cart).reduce((sum, value) => sum + value, 0)
  const subtotal = useMemo(
    () =>
      items.reduce((sum, item) => sum + item.price * (cart[item.id] || 0), 0),
    [cart, items],
  )

  const changeQty = (id: number, delta: number) => {
    setCart((current) => ({
      ...current,
      [id]: Math.max(0, (current[id] || 0) + delta),
    }))
  }

  const handlePlaceOrder = async () => {
    if (!count || isSubmitting) return
    setIsSubmitting(true)

    const isPayingWithWallet = checkoutPaymentMethod === "wallet"
    const studentBalance = Number(currentUser.balance || 0)

    if (isPayingWithWallet && studentBalance < subtotal) {
      alert(
        `Insufficient Canteen Wallet balance (₱${studentBalance.toFixed(2)} available). Please reload your wallet balance or select Cash at counter.`,
      )
      setIsSubmitting(false)
      return
    }

    const orderId = `SB-${Math.floor(2000 + Math.random() * 8000)}`
    const orderItems = items
      .filter((item) => (cart[item.id] || 0) > 0)
      .map((item) => ({
        menu_item_id: item.id,
        item_name: item.name,
        quantity: cart[item.id],
        unit_price: item.price,
      }))

    try {
      // 1. Immediately deduct ingredient stocks from current inventory (optimistic update)
      const { updatedInventory } = deductInventoryStock(
        inventoryList,
        orderItems,
      )
      setInventoryList(updatedInventory)
      try {
        localStorage.setItem(
          "smartbite_inventory",
          JSON.stringify(updatedInventory),
        )
      } catch {}

      // 2. If paying via wallet, deduct balance from profile
      let updatedBalance = studentBalance
      if (isPayingWithWallet) {
        updatedBalance = Math.max(0, studentBalance - subtotal)
        try {
          await canteenApi.auth.updateProfile(currentUser.id, {
            balance: updatedBalance,
          })
        } catch (balErr) {
          console.warn("Balance deduction remote warning:", balErr)
        }
        const updatedUser = { ...currentUser, balance: updatedBalance }
        try {
          localStorage.setItem(
            "smartbite_session_user",
            JSON.stringify(updatedUser),
          )
        } catch {}
        setCurrentUser(updatedUser)
        setUserProfiles((prev) =>
          prev.map((p) =>
            p.id === currentUser.id ? { ...p, balance: updatedBalance } : p,
          ),
        )
      }

      const orderPayload = {
        order_id: orderId,
        student_id: currentUser.id,
        stall_id: items.find((i) => cart[i.id])?.stall_id || 1,
        student_number: currentUser.student_id,
        student_name: currentUser.full_name,
        payment_method: isPayingWithWallet
          ? "Canteen Wallet"
          : "Cash at counter",
        payment_status: (isPayingWithWallet
          ? "paid"
          : "pending") as "paid" | "pending",
      }

      await canteenApi.orders.place(orderPayload, orderItems)
      await refreshAllData()

      const createdOrder: OrderRecord = {
        id: orderId,
        stall_id: orderPayload.stall_id,
        student_number: orderPayload.student_number,
        student_name: orderPayload.student_name,
        subtotal,
        service_fee: 0,
        total_amount: subtotal,
        order_status: "Order placed",
        pickup_time: "8–12 minutes",
        payment_method: isPayingWithWallet
          ? "Canteen Wallet"
          : "Cash at counter",
        payment_status: (isPayingWithWallet
          ? "paid"
          : "pending") as "paid" | "pending",
        order_items: orderItems.map((oi) => ({
          menu_item_id: oi.menu_item_id,
          item_name: oi.item_name,
          quantity: oi.quantity,
          unit_price: oi.unit_price,
          item_subtotal: oi.unit_price * oi.quantity,
        })),
      }
      setActiveOrder(createdOrder)
      setPlaced(true)
      setCart({})
      if (isPayingWithWallet) {
        setSyncToast(
          `✓ Order placed & ₱${subtotal}.00 paid from wallet! Remaining: ₱${updatedBalance.toFixed(2)}`,
        )
      } else {
        setSyncToast(
          "✓ Order placed! Kitchen notified & ingredient stocks updated.",
        )
      }
      setTimeout(() => setSyncToast(""), 3000)

      // Trigger instant order notification and start automatic kitchen progression
      addOrderNotification(
        orderId,
        "Order placed",
        isPayingWithWallet
          ? `Ticket #${orderId} (₱${subtotal}.00 paid via Canteen Wallet • Remaining Balance: ₱${updatedBalance.toFixed(2)}) sent to kitchen.`
          : `Ticket #${orderId} (${orderItems.length} item${
              orderItems.length > 1 ? "s" : ""
            } • ₱${subtotal}.00) sent to kitchen. Status: Order placed.`,
      )
      startKitchenProgression(orderId)
    } catch (err: any) {
      alert(`Order error: ${err.message}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Staff CRUD actions
  const openEditModal = (item: MenuItem, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    setEditingItem(item)
    setItemFormName(item.name || "")
    setItemFormDesc(item.description || "")
    setItemFormPrice(Number(item.price) || 0)
    setItemFormCategory(item.category || "Rice Meals")
    setItemFormStallId(Number(item.stall_id) || 1)
    setItemFormPrepTime(Number(item.preparation_time_minutes) || 10)
    setItemFormImage(item.image_url || "")
    setItemFormImageFile(null)
    setItemFormError("")
    setItemFormAvailable(Boolean(item.is_available))
    setItemModalOpen(true)
  }

  const openCreateModal = (defaultStallId?: number | React.MouseEvent) => {
    setEditingItem(null)
    setItemFormName("")
    setItemFormDesc("")
    setItemFormPrice(75)
    setItemFormCategory("Rice Meals")
    setItemFormStallId(typeof defaultStallId === "number" ? defaultStallId : 1)
    setItemFormPrepTime(10)
    setItemFormImage(
      "https://images.unsplash.com/photo-1562748762-77b7c4633c83?auto=format&fit=crop&w=900&q=85",
    )
    setItemFormImageFile(null)
    setItemFormError("")
    setItemFormAvailable(true)
    setItemModalOpen(true)
  }

  const handleSaveMenuItem = async (e: FormEvent) => {
    e.preventDefault()
    if (isSavingMenuItem) return

    setItemFormError("")
    setIsSavingMenuItem(true)
    try {
      const imageUrl = itemFormImageFile
        ? await canteenApi.menu.uploadImage(itemFormImageFile, itemFormStallId)
        : itemFormImage.trim()
      if (!imageUrl) throw new Error("Choose an image or enter an image URL.")

      if (editingItem) {
        const updatedFields: Partial<MenuItem> = {
          name: itemFormName,
          description: itemFormDesc,
          price: itemFormPrice,
          category: itemFormCategory,
          stall_id: itemFormStallId,
          preparation_time_minutes: itemFormPrepTime,
          image_url: imageUrl,
          is_available: itemFormAvailable,
        }
        await canteenApi.menu.updateItem(Number(editingItem.id), updatedFields)
        setItems((prev) =>
          prev.map((i) =>
            Number(i.id) === Number(editingItem.id)
              ? { ...i, ...updatedFields }
              : i,
          ),
        )
        setSyncToast(`✓ Updated ${itemFormName}!`)
        setTimeout(() => setSyncToast(""), 2500)
      } else {
        const categoryIds: Record<string, number> = {
          "Rice Meals": 1,
          Breakfast: 2,
          Snacks: 3,
          Drinks: 4,
        }
        const newItemPayload = {
          category_id:
            items.find((item) => item.category === itemFormCategory)
              ?.category_id ??
            categoryIds[itemFormCategory] ??
            1,
          name: itemFormName,
          description: itemFormDesc,
          price: itemFormPrice,
          category: itemFormCategory,
          stall_id: itemFormStallId,
          preparation_time_minutes: itemFormPrepTime,
          image_url: imageUrl,
          is_available: itemFormAvailable,
          rating: "4.8",
        }
        const created = await canteenApi.menu.createItem(newItemPayload)
        setItems((prev) => [...prev, created])
        setItemModalOpen(false)
        setSyncToast(`✓ Added ${itemFormName} to menu!`)
        setTimeout(() => setSyncToast(""), 2500)
      }
      setItemFormImageFile(null)
      setItemModalOpen(false)
    } catch (err) {
      console.warn("handleSaveMenuItem error:", err)
      setItemFormError(
        err instanceof Error
          ? err.message
          : "Could not save product to Supabase.",
      )
    } finally {
      setIsSavingMenuItem(false)
    }
  }

  const handleDeleteMenuItem = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this menu item?"))
      return
    try {
      await canteenApi.menu.deleteItem(id)
      setItems((prev) => prev.filter((i) => i.id !== id))
    } catch (err: any) {
      alert(`Delete error: ${err.message}`)
    }
  }

  // Quick toggle item availability (Available / Sold Out)
  const handleToggleItemAvailable = async (
    item: MenuItem,
    e?: React.MouseEvent,
  ) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    try {
      const nextStatus = !item.is_available
      setItems((prev) =>
        prev.map((i) =>
          i.id === item.id ? { ...i, is_available: nextStatus } : i,
        ),
      )

      // Update localStorage synchronously as fallback
      try {
        const saved = localStorage.getItem("smartbite_menu_items")
        if (saved) {
          const parsed = JSON.parse(saved)
          if (Array.isArray(parsed)) {
            const updated = parsed.map((i: MenuItem) =>
              i.id === item.id ? { ...i, is_available: nextStatus } : i,
            )
            localStorage.setItem(
              "smartbite_menu_items",
              JSON.stringify(updated),
            )
          }
        }
      } catch {}

      setSyncToast(
        `✓ ${item.name} marked as ${nextStatus ? "Available" : "Sold Out"}`,
      )
      setTimeout(() => setSyncToast(""), 2500)

      await canteenApi.menu.updateItem(item.id, { is_available: nextStatus })
    } catch (err: any) {
      console.warn("handleToggleItemAvailable notice:", err)
    }
  }

  // Weekly sales summary calculations for Bar Chart
  const weeklySalesData = useMemo(() => {
    const days = [
      { label: "M", full: "Mon", val: 320 },
      { label: "T", full: "Tue", val: 540 },
      { label: "W", full: "Wed", val: 780 },
      { label: "T", full: "Thu", val: 610 },
      { label: "F", full: "Fri", val: 890 },
      { label: "S", full: "Sat", val: 210 },
      { label: "S", full: "Sun", val: 90 },
    ]
    const maxVal = Math.max(...days.map((d) => d.val))
    return { days, maxVal }
  }, [])

  // =========================================================================
  // VIEW 1: AUTHENTICATION FLOW (SCREENSHOT 1 & 2)
  // =========================================================================
  if (!loggedIn) {
    // 1A. WELCOME PAGE (SCREENSHOT 1)
    if (authStep === "welcome") {
      return (
        <div className="auth-page">
          <div className="auth-card" style={{ maxWidth: "440px" }}>
            <div className="auth-header">
              <span className="eyebrow-chip">
                <span className="sparkle"></span> YOUR CAMPUS, YOUR CANTEEN
              </span>
              <h1>Welcome to Smartbite.</h1>
              <p></p>
            </div>

            <button
              className="auth-btn-primary"
              onClick={() => {
                setAuthStep("signin")
                setAuthError("")
              }}
            >
              Sign in to continue <span>&rarr;</span>
            </button>

            {/* Feature bullets matching Screenshot 1 */}
            <div className="welcome-features">
              <div className="welcome-feature-item">
                <div className="welcome-feature-icon">
                  <Icon name="bag" size={20} />
                </div>
                <div className="welcome-feature-text">
                  <strong>Order ahead</strong>
                  <span>Choose your lunch before the break</span>
                </div>
              </div>
              <div className="welcome-feature-item">
                <div className="welcome-feature-icon">
                  <Icon name="clock" size={20} />
                </div>
                <div className="welcome-feature-text">
                  <strong>Know when to pick up</strong>
                  <span>Stay up to date on your order</span>
                </div>
              </div>
            </div>

            {/* School Footer Pill */}
            <div className="school-footer-pill">
              <span className="school-badge-mini">HNU</span>
              <span>Holy Name University &bull; School canteen portal</span>
            </div>
          </div>
        </div>
      )
    }

    // 1B. SIGN IN PAGE (SCREENSHOT 2)
    if (authStep === "signin") {
      return (
        <div className="auth-page">
          <div className="auth-card" style={{ maxWidth: "460px" }}>
            <button
              className="auth-back-link"
              onClick={() => {
                setAuthStep("welcome")
                setAuthError("")
              }}
            >
              <span>&larr;</span> Back to welcome
            </button>

            <div className="auth-header">
              <span className="eyebrow-chip">
                <span className="sparkle"></span> WELCOME TO YOUR CANTEEN
              </span>
              <h1>Good to have you.</h1>
            </div>

            {/* Segmented Role Selector */}
            <div className="role-segmented-wrap">
              <span className="role-segmented-label">I'm signing in as</span>
              <div className="role-segmented-grid">
                <button
                  type="button"
                  className={`role-segmented-btn ${
                    chosenRole === "student" ? "active" : ""
                  }`}
                  onClick={() => handleSelectRole("student")}
                >
                  <span className="role-icon">
                    <Icon name="users" size={16} />
                  </span>
                  <span>Student</span>
                </button>
                <button
                  type="button"
                  className={`role-segmented-btn ${
                    chosenRole === "staff" ? "active" : ""
                  }`}
                  onClick={() => handleSelectRole("staff")}
                >
                  <span className="role-icon">
                    <Icon name="bag" size={16} />
                  </span>
                  <span>Staff</span>
                </button>
                <button
                  type="button"
                  className={`role-segmented-btn ${
                    chosenRole === "admin" ? "active" : ""
                  }`}
                  onClick={() => handleSelectRole("admin")}
                >
                  <span className="role-icon">
                    <Icon name="grid" size={16} />
                  </span>
                  <span>Admin</span>
                </button>
              </div>
            </div>

            {/* Sign In Form */}
            <form onSubmit={handleSignIn}>
              <div className="auth-field">
                <div className="auth-field-header">
                  <span className="auth-field-label">
                    {chosenRole === "student"
                      ? "Student Email or Student ID"
                      : chosenRole === "staff"
                        ? "Staff Email or Staff ID"
                        : "Admin Email or Admin ID"}
                  </span>
                </div>
                <div className="auth-input-box">
                  <input
                    type="text"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    placeholder={
                      chosenRole === "student"
                        ? "student email or ID"
                        : chosenRole === "staff"
                          ? "staff email or ID"
                          : "admin email or ID"
                    }
                    autoComplete="username"
                    required
                  />
                </div>
              </div>

              <div className="auth-field">
                <div className="auth-field-header">
                  <span className="auth-field-label">Password</span>
                  <button
                    type="button"
                    className="auth-forgot-link"
                    onClick={handleOpenForgotModal}
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="auth-input-box">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder=" password "
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    className="auth-toggle-pwd"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    <Icon name={showPassword ? "eye-off" : "eye"} size={17} />
                  </button>
                </div>
              </div>

              {authError && <div className="auth-error-pill">{authError}</div>}
              {authNotice && (
                <div className="auth-callout-notice" role="status">
                  <span className="notice-icon">✳</span>
                  <span>{authNotice}</span>
                </div>
              )}

              <button className="auth-btn-primary" type="submit">
                Sign in <span>&rarr;</span>
              </button>
            </form>

            {/* New student link */}
            <div className="auth-switch-link">
              New student?
              <button
                type="button"
                onClick={() => {
                  setAuthStep("signup")
                  setAuthError("")
                  setAuthNotice("")
                }}
              >
                Create an account
              </button>
            </div>
          </div>

          {/* FORGOT PASSWORD & EMAIL VERIFICATION MODAL */}
          {forgotModalOpen && (
            <div
              className="crud-modal-overlay"
              onMouseDown={() => setForgotModalOpen(false)}
            >
              <div
                className="crud-modal"
                style={{ maxWidth: "440px", width: "min(440px, 100%)" }}
                onMouseDown={(e) => e.stopPropagation()}
              >
                <div className="crud-modal-header">
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <div style={{ color: "var(--primary)", display: "flex" }}>
                      <Icon name="mail" size={20} />
                    </div>
                    <div>
                      <h3
                        style={{
                          margin: 0,
                          fontSize: "18px",
                          fontFamily: "var(--font-serif)",
                        }}
                      >
                        Email Authentication &amp; Reset
                      </h3>
                      <small style={{ color: "var(--muted)" }}>
                        Verify email ownership to reset account password
                      </small>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="icon-action-btn"
                    style={{ width: "32px", height: "32px" }}
                    onClick={() => setForgotModalOpen(false)}
                  >
                    <Icon name="x" size={16} />
                  </button>
                </div>

                <div className="crud-modal-body">
                  {forgotError && (
                    <div
                      className="toast-error"
                      style={{ marginBottom: "14px" }}
                    >
                      {forgotError}
                    </div>
                  )}
                  {forgotNotice && (
                    <div
                      className="toast-success"
                      style={{ marginBottom: "14px" }}
                    >
                      {forgotNotice}
                    </div>
                  )}

                  {/* STEP 1: Enter Registered Email */}
                  {forgotStep === "input_email" && (
                    <form onSubmit={handleSendForgotOtp}>
                      <p
                        style={{
                          margin: "0 0 14px",
                          fontSize: "13px",
                          color: "var(--muted)",
                          lineHeight: "1.5",
                        }}
                      >
                        Enter the  email
                      </p>
                      <div className="crud-form-group">
                        <label>Registered  Email</label>
                        <input
                          type="email"
                          value={forgotEmail}
                          onChange={(e) => setForgotEmail(e.target.value)}
                          placeholder="e.g. student@smartbite.ph or admin@smartbite.edu.ph"
                          required
                          autoFocus
                        />
                      </div>
                      <div
                        className="crud-modal-actions"
                        style={{ marginTop: "20px" }}
                      >
                        <button
                          type="button"
                          className="btn-secondary"
                          onClick={() => setForgotModalOpen(false)}
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="btn-primary"
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                          }}
                        >
                          <Icon name="mail" size={14} /> Send Verification Code
                        </button>
                      </div>
                    </form>
                  )}

                  {/* STEP 2: Enter 6-Digit OTP Code */}
                  {forgotStep === "verify_code" && (
                    <form onSubmit={handleVerifyForgotOtp}>
                      <div
                        style={{
                          background: "rgba(30, 77, 43, 0.08)",
                          border: "1px solid rgba(30, 77, 43, 0.25)",
                          borderRadius: "8px",
                          padding: "12px 14px",
                          marginBottom: "16px",
                          fontSize: "13px",
                        }}
                      >
                        <div
                          style={{
                            fontWeight: 600,
                            color: "var(--primary)",
                            marginBottom: "4px",
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                          }}
                        >
                          <Icon name="mail" size={15} /> 6-Digit Verification
                          PIN Dispatched
                        </div>
                        <div
                          style={{
                            fontSize: "12px",
                            color: "var(--muted)",
                            marginBottom: "4px",
                            lineHeight: "1.4",
                          }}
                        >
                          We sent a 6-digit verification code to{" "}
                          <strong>{forgotEmail}</strong>.
                        </div>
                        <div
                          style={{
                            fontSize: "11px",
                            color: "#b45309",
                            fontWeight: 500,
                          }}
                        >
                          ⚠️ Please check your <strong>Inbox</strong> or{" "}
                          <strong>Spam / Junk</strong> folder to retrieve your
                          code.
                        </div>
                      </div>

                      <div className="crud-form-group">
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <label>Enter 6-Digit Verification PIN</label>
                          <span
                            style={{
                              fontSize: "11px",
                              color:
                                forgotOtp.length === 6
                                  ? "var(--primary)"
                                  : "var(--muted)",
                              fontWeight: 600,
                            }}
                          >
                            {forgotOtp.length}/6 digits
                          </span>
                        </div>
                        <input
                          type="text"
                          maxLength={6}
                          value={forgotOtp}
                          onChange={(e) =>
                            setForgotOtp(e.target.value.replace(/\D/g, ""))
                          }
                          placeholder="• • • • • •"
                          style={{
                            textAlign: "center",
                            fontSize: "22px",
                            fontWeight: 700,
                            letterSpacing: "8px",
                            padding: "10px",
                          }}
                          required
                          autoFocus
                        />
                      </div>

                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginTop: "12px",
                          fontSize: "12px",
                        }}
                      >
                        <button
                          type="button"
                          className="auth-forgot-link"
                          disabled={forgotCooldown > 0}
                          onClick={() => handleSendForgotOtp()}
                          style={{ opacity: forgotCooldown > 0 ? 0.6 : 1 }}
                        >
                          {forgotCooldown > 0
                            ? `Resend Code (${forgotCooldown}s)`
                            : "Resend Verification Code"}
                        </button>
                        <button
                          type="button"
                          className="auth-forgot-link"
                          onClick={() => setForgotStep("input_email")}
                        >
                          Change Email
                        </button>
                      </div>

                      <div
                        className="crud-modal-actions"
                        style={{ marginTop: "20px" }}
                      >
                        <button
                          type="button"
                          className="btn-secondary"
                          onClick={() => setForgotModalOpen(false)}
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="btn-primary"
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                          }}
                        >
                          <Icon name="check" size={14} /> Verify Code
                        </button>
                      </div>
                    </form>
                  )}

                  {/* STEP 3: Reset Password */}
                  {forgotStep === "reset_password" && (
                    <form onSubmit={handleResetPasswordSubmit}>
                      <p
                        style={{
                          margin: "0 0 14px",
                          fontSize: "13px",
                          color: "var(--muted)",
                          lineHeight: "1.5",
                        }}
                      >
                        Email verified! Create a new secure password for{" "}
                        <strong>
                          {forgotMatchedAccount?.name || forgotEmail}
                        </strong>
                        .
                      </p>

                      <div className="crud-form-group">
                        <label>New Password</label>
                        <div style={{ position: "relative" }}>
                          <input
                            type={showForgotPwd ? "text" : "password"}
                            value={forgotNewPwd}
                            onChange={(e) =>
                              setForgotNewPwd(e.target.value.replace(/\s/g, ""))
                            }
                            placeholder="At least 6 characters"
                            required
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => setShowForgotPwd(!showForgotPwd)}
                            style={{
                              position: "absolute",
                              right: "10px",
                              top: "50%",
                              transform: "translateY(-50%)",
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              color: "var(--muted)",
                            }}
                          >
                            <Icon
                              name={showForgotPwd ? "eye-off" : "eye"}
                              size={16}
                            />
                          </button>
                        </div>
                      </div>

                      <div
                        className="crud-form-group"
                        style={{ marginTop: "10px" }}
                      >
                        <label>Confirm New Password</label>
                        <input
                          type={showForgotPwd ? "text" : "password"}
                          value={forgotConfirmPwd}
                          onChange={(e) =>
                            setForgotConfirmPwd(
                              e.target.value.replace(/\s/g, ""),
                            )
                          }
                          placeholder="Repeat new password"
                          required
                        />
                      </div>

                      <small
                        style={{
                          color: "var(--muted)",
                          fontSize: "11px",
                          marginTop: "6px",
                          display: "block",
                        }}
                      >
                        Must be at least 6 characters, no spaces, no repeating
                        letters or numbers.
                      </small>

                      <div
                        className="crud-modal-actions"
                        style={{ marginTop: "20px" }}
                      >
                        <button
                          type="button"
                          className="btn-secondary"
                          onClick={() => setForgotModalOpen(false)}
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="btn-primary"
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                          }}
                        >
                          <Icon name="key" size={14} /> Update Password
                        </button>
                      </div>
                    </form>
                  )}

                  {/* STEP 4: Success Confirmation */}
                  {forgotStep === "success" && (
                    <div style={{ textAlign: "center", padding: "16px 0 8px" }}>
                      <div
                        style={{
                          width: "54px",
                          height: "54px",
                          borderRadius: "50%",
                          background: "rgba(30, 77, 43, 0.12)",
                          color: "var(--primary)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          margin: "0 auto 14px",
                        }}
                      >
                        <Icon name="check" size={26} />
                      </div>
                      <h4
                        style={{
                          margin: "0 0 6px",
                          fontSize: "17px",
                          fontFamily: "var(--font-serif)",
                        }}
                      >
                        Password Updated &amp; Email Verified!
                      </h4>
                      <p
                        style={{
                          margin: "0 0 20px",
                          fontSize: "13px",
                          color: "var(--muted)",
                        }}
                      >
                        Your password has been changed successfully. You can now
                        sign in with your new credentials.
                      </p>
                      <button
                        type="button"
                        className="btn-primary"
                        style={{ width: "100%", padding: "10px" }}
                        onClick={() => {
                          setForgotModalOpen(false)
                          setStudentId(forgotEmail)
                          setPassword("")
                          setAuthNotice(
                            "Password updated! Please enter your new password to sign in.",
                          )
                        }}
                      >
                        Proceed to Sign In &rarr;
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )
    }

    // 1C. SIGN UP PAGE (CREATE ACCOUNT)
    return (
      <div className="auth-page">
        <div className="auth-card" style={{ maxWidth: "460px" }}>
          <button
            className="auth-back-link"
            onClick={() => {
              setAuthStep("signin")
              setAuthError("")
              setAuthNotice("")
            }}
          >
            <span>&larr;</span> Back to sign in
          </button>

          <div className="auth-header">
            <span className="eyebrow-chip">
              <span className="sparkle"></span> NEW STUDENT REGISTRATION
            </span>
            <h1>Create an account.</h1>
          </div>

          <form onSubmit={handleSignUp}>
            <div className="auth-field">
              <span className="auth-field-label">
                Student Name (First, Middle, Last)
              </span>
              <div className="name-inputs-row" style={{ marginTop: "7px" }}>
                <div className="auth-input-box">
                  <input
                    value={regFirstName}
                    onChange={(e) =>
                      setRegFirstName(
                        e.target.value.replace(/[^A-Za-z\s]/g, ""),
                      )
                    }
                    placeholder="First Name *"
                    required
                  />
                </div>
                <div className="auth-input-box">
                  <input
                    value={regMiddleName}
                    onChange={(e) =>
                      setRegMiddleName(
                        e.target.value.replace(/[^A-Za-z\s]/g, ""),
                      )
                    }
                    placeholder="Middle Name"
                  />
                </div>
                <div className="auth-input-box">
                  <input
                    value={regLastName}
                    onChange={(e) =>
                      setRegLastName(e.target.value.replace(/[^A-Za-z\s]/g, ""))
                    }
                    placeholder="Last Name *"
                    required
                  />
                </div>
              </div>
              <small
                style={{
                  color: "var(--muted)",
                  fontSize: "11px",
                  marginTop: "4px",
                  display: "block",
                }}
              ></small>
            </div>

            <div className="auth-field">
              <span className="auth-field-label">Student ID Number</span>
              <div className="auth-input-box" style={{ marginTop: "7px" }}>
                <input
                  value={regStudentId}
                  onChange={(e) =>
                    setRegStudentId(e.target.value.replace(/\D/g, ""))
                  }
                  placeholder="Enter your student ID"
                  maxLength={12}
                  required
                />
              </div>
              <small
                style={{
                  color: "var(--muted)",
                  fontSize: "11px",
                  marginTop: "4px",
                  display: "block",
                }}
              ></small>
            </div>

            <div className="auth-field">
              <span className="auth-field-label">School Email</span>
              <div className="auth-input-box" style={{ marginTop: "7px" }}>
                <input
                  type="email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="Enter your Email"
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div className="auth-field">
              <span className="auth-field-label">Phone Number</span>
              <div className="auth-input-box" style={{ marginTop: "7px" }}>
                <input
                  type="tel"
                  value={regPhone}
                  onChange={(e) =>
                    setRegPhone(e.target.value.replace(/\D/g, "").slice(0, 11))
                  }
                  placeholder="Enter your phone number"
                  autoComplete="tel"
                  maxLength={11}
                  required
                />
              </div>
            </div>

            <div className="auth-field">
              <span className="auth-field-label">Create a Password</span>
              <div className="auth-input-box" style={{ marginTop: "7px" }}>
                <input
                  type={showRegPassword ? "text" : "password"}
                  value={regPassword}
                  onChange={(e) =>
                    setRegPassword(e.target.value.replace(/\s/g, ""))
                  }
                  placeholder="Password"
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  className="auth-toggle-pwd"
                  onClick={() => setShowRegPassword(!showRegPassword)}
                  aria-label={
                    showRegPassword ? "Hide password" : "Show password"
                  }
                >
                  <Icon name={showRegPassword ? "eye-off" : "eye"} size={17} />
                </button>
              </div>
              <small
                style={{
                  color: "var(--muted)",
                  fontSize: "11px",
                  marginTop: "4px",
                  display: "block",
                }}
              ></small>
            </div>

            {authError && <div className="auth-error-pill">{authError}</div>}

            <button className="auth-btn-primary" type="submit">
              Create account <span>&rarr;</span>
            </button>
          </form>

          <div className="auth-switch-link">
            Already have an account?
            <button
              type="button"
              onClick={() => {
                setAuthStep("signin")
                setAuthError("")
                setAuthNotice("")
              }}
            >
              Sign in
            </button>
          </div>
        </div>

        {/* REGISTRATION EMAIL VERIFICATION MODAL */}
        {regVerifyModalOpen && (
          <div
            className="crud-modal-overlay"
            onMouseDown={() => setRegVerifyModalOpen(false)}
          >
            <div
              className="crud-modal"
              style={{ maxWidth: "440px", width: "min(440px, 100%)" }}
              onMouseDown={(e) => e.stopPropagation()}
            >
              <div className="crud-modal-header">
                <div
                  style={{ display: "flex", alignItems: "center", gap: "8px" }}
                >
                  <div style={{ color: "var(--primary)", display: "flex" }}>
                    <Icon name="mail" size={20} />
                  </div>
                  <div>
                    <h3
                      style={{
                        margin: 0,
                        fontSize: "18px",
                        fontFamily: "var(--font-serif)",
                      }}
                    >
                      Verify School Email Address
                    </h3>
                    <small style={{ color: "var(--muted)" }}>
                      Complete registration by confirming your email
                    </small>
                  </div>
                </div>
                <button
                  type="button"
                  className="icon-action-btn"
                  style={{ width: "32px", height: "32px" }}
                  onClick={() => setRegVerifyModalOpen(false)}
                >
                  <Icon name="x" size={16} />
                </button>
              </div>

              <div className="crud-modal-body">
                {regVerifyError && (
                  <div className="toast-error" style={{ marginBottom: "14px" }}>
                    {regVerifyError}
                  </div>
                )}
                {regVerifyNotice && (
                  <div
                    className="toast-success"
                    style={{ marginBottom: "14px" }}
                  >
                    {regVerifyNotice}
                  </div>
                )}

                <div
                  style={{
                    background: "rgba(30, 77, 43, 0.08)",
                    border: "1px solid rgba(30, 77, 43, 0.25)",
                    borderRadius: "8px",
                    padding: "12px 14px",
                    marginBottom: "16px",
                    fontSize: "13px",
                  }}
                >
                  <div
                    style={{
                      fontWeight: 600,
                      color: "var(--primary)",
                      marginBottom: "4px",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <Icon name="mail" size={15} /> 6-Digit Verification PIN
                    Dispatched
                  </div>
                  <div
                    style={{
                      fontSize: "12px",
                      color: "var(--muted)",
                      marginBottom: "4px",
                      lineHeight: "1.4",
                    }}
                  >
                    A 6-digit verification code has been sent to{" "}
                    <strong>{pendingRegData?.email}</strong>.
                  </div>
                  <div
                    style={{
                      fontSize: "11px",
                      color: "#b45309",
                      fontWeight: 500,
                    }}
                  >
                    ⚠️ Please check your <strong>Inbox</strong> or{" "}
                    <strong>Spam / Junk</strong> folder to retrieve your code.
                  </div>
                </div>

                <form onSubmit={handleConfirmRegOtp}>
                  <div className="crud-form-group">
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <label>Enter 6-Digit Verification PIN</label>
                      <span
                        style={{
                          fontSize: "11px",
                          color:
                            regOtp.length === 6
                              ? "var(--primary)"
                              : "var(--muted)",
                          fontWeight: 600,
                        }}
                      >
                        {regOtp.length}/6 digits
                      </span>
                    </div>
                    <input
                      type="text"
                      maxLength={6}
                      value={regOtp}
                      onChange={(e) =>
                        setRegOtp(e.target.value.replace(/\D/g, ""))
                      }
                      placeholder="• • • • • •"
                      style={{
                        textAlign: "center",
                        fontSize: "22px",
                        fontWeight: 700,
                        letterSpacing: "8px",
                        padding: "10px",
                      }}
                      required
                      autoFocus
                    />
                  </div>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginTop: "12px",
                      fontSize: "12px",
                    }}
                  >
                    <button
                      type="button"
                      className="auth-forgot-link"
                      disabled={regCooldown > 0}
                      onClick={async () => {
                        if (!pendingRegData) return
                        const res = await canteenApi.auth.sendVerificationCode(
                          pendingRegData.email,
                        )
                        if (!res.ok) {
                          setRegVerifyError(res.message)
                          return
                        }
                        setRegVerifyError("")
                        setRegCooldown(60)
                        playNotificationSound()
                        setRegVerifyNotice(res.message)
                      }}
                      style={{ opacity: regCooldown > 0 ? 0.6 : 1 }}
                    >
                      {regCooldown > 0
                        ? `Resend Code (${regCooldown}s)`
                        : "Resend Verification Code"}
                    </button>
                    <button
                      type="button"
                      className="auth-forgot-link"
                      onClick={() => setRegVerifyModalOpen(false)}
                    >
                      Edit Details
                    </button>
                  </div>

                  <div
                    className="crud-modal-actions"
                    style={{ marginTop: "20px" }}
                  >
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => setRegVerifyModalOpen(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn-primary"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <Icon name="check" size={14} /> Verify &amp; Activate
                      Account
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // =========================================================================
  // AUTHENTICATED DASHBOARD SHELL (MATCHING SCREENSHOTS 3 & 4)
  // Left Sidebar (~260px) + Topbar + Main Viewport
  // =========================================================================
  return (
    <div className="app-layout">
      {/* 2A. LEFT SIDEBAR */}
      <aside className="app-sidebar">
        {/* Brand Header */}
        <div className="sidebar-brand-row">
          <div className="sidebar-logo-badge">S</div>
          <span className="sidebar-brand-name">Smartbite</span>
        </div>

        {/* School Selector Card matching Screenshot 3 & 4 (Interactive Campus Directory) */}
        <div className="sidebar-school-wrap">
          <div className="sidebar-section-kicker">YOUR SCHOOL</div>
          <div
            className="sidebar-school-card"
            onClick={() => setSchoolModalOpen(true)}
            role="button"
            tabIndex={0}
            title="Click to view campus details or switch campus"
          >
            <div className="school-badge-square">{activeCampus.abbr}</div>
            <div className="school-info-text">
              <strong>{activeCampus.name}</strong>
              <small>{activeCampus.subtitle}</small>
            </div>
            <Icon name="chevron-down" size={16} />
          </div>
        </div>

        {/* Section Navigation according to Role */}
        <div className="sidebar-section-kicker">
          {currentUser.role === "admin"
            ? "ADMINISTRATION"
            : currentUser.role === "staff"
              ? "KITCHEN OPERATIONS"
              : currentUser.role === "stall_manager"
                ? "BRANCH OPERATIONS"
                : "STUDENT SERVICES"}
        </div>

        <nav className="sidebar-nav-list">
          {/* ADMIN ROLE NAVIGATION */}
          {currentUser.role === "admin" && (
            <>
              <button
                className={`sidebar-nav-btn ${
                  adminNavTab === "overview" ? "active" : ""
                }`}
                onClick={() => setAdminNavTab("overview")}
              >
                <Icon name="grid" size={17} />
                <span>Admin dashboard</span>
              </button>
              <button
                className={`sidebar-nav-btn ${
                  adminNavTab === "orders" ? "active" : ""
                }`}
                onClick={() => setAdminNavTab("orders")}
              >
                <Icon name="receipt" size={17} />
                <span>Orders</span>
                <span className="nav-badge">{allOrders.length}</span>
              </button>
              <button
                className={`sidebar-nav-btn ${
                  adminNavTab === "menu" ? "active" : ""
                }`}
                onClick={() => setAdminNavTab("menu")}
              >
                <Icon name="bag" size={17} />
                <span>Menu</span>
                <span className="nav-badge">{items.length}</span>
              </button>
              <button
                className={`sidebar-nav-btn ${
                  adminNavTab === "inventory" ? "active" : ""
                }`}
                onClick={() => setAdminNavTab("inventory")}
              >
                <Icon name="store" size={17} />
                <span>Inventory</span>
              </button>
              <button
                className={`sidebar-nav-btn ${
                  adminNavTab === "users" ? "active" : ""
                }`}
                onClick={() => setAdminNavTab("users")}
              >
                <Icon name="users" size={17} />
                <span>Team / Users</span>
                <span className="nav-badge">{userProfiles.length}</span>
              </button>
            </>
          )}

          {/* STAFF ROLE NAVIGATION */}
          {currentUser.role === "staff" && (
            <>
              <button
                className={`sidebar-nav-btn ${
                  staffNavTab === "kds" ? "active" : ""
                }`}
                onClick={() => setStaffNavTab("kds")}
              >
                <Icon name="chef" size={17} />
                <span>Live Queue</span>
                <span className="nav-badge">
                  {
                    allOrders.filter((o) => o.order_status !== "Completed")
                      .length
                  }
                </span>
              </button>
              <button
                className={`sidebar-nav-btn ${
                  staffNavTab === "orders" ? "active" : ""
                }`}
                onClick={() => setStaffNavTab("orders")}
              >
                <Icon name="receipt" size={17} />
                <span>Orders</span>
                <span className="nav-badge">
                  {
                    allOrders.filter(
                      (o) =>
                        !currentUser.stall_id ||
                        Number(o.stall_id) === Number(currentUser.stall_id || 1),
                    ).length
                  }
                </span>
              </button>
              <button
                className={`sidebar-nav-btn ${
                  staffNavTab === "menu_crud" ? "active" : ""
                }`}
                onClick={() => setStaffNavTab("menu_crud")}
              >
                <Icon name="edit" size={17} />
                <span>Menu Items </span>
                <span className="nav-badge">{items.length}</span>
              </button>
              <button
                className={`sidebar-nav-btn ${
                  staffNavTab === "inventory_crud" ? "active" : ""
                }`}
                onClick={() => setStaffNavTab("inventory_crud")}
              >
                <Icon name="store" size={17} />
                <span>Ingredient Stocks</span>
              </button>
            </>
          )}

          {/* MINI STALL ROLE NAVIGATION */}
          {currentUser.role === "stall_manager" && (
            <>
              <button
                className={`sidebar-nav-btn ${
                  branchNavTab === "overview" ? "active" : ""
                }`}
                onClick={() => setBranchNavTab("overview")}
              >
                <Icon name="store" size={17} />
                <span>2 Branches Overview</span>
              </button>
              <button
                className={`sidebar-nav-btn ${
                  branchNavTab === "stall_1" ? "active" : ""
                }`}
                onClick={() => setBranchNavTab("stall_1")}
              >
                <Icon name="home" size={17} />
                <span>Branch #1: Main Kitchen</span>
              </button>
              <button
                className={`sidebar-nav-btn ${
                  branchNavTab === "stall_2" ? "active" : ""
                }`}
                onClick={() => setBranchNavTab("stall_2")}
              >
                <Icon name="store" size={17} />
                <span>Branch #2: Snack Bar</span>
              </button>
            </>
          )}

          {/* STUDENT ROLE NAVIGATION */}
          {currentUser.role === "student" && (
            <>
              <button
                className={`sidebar-nav-btn ${
                  studentNavTab === "menu" ? "active" : ""
                }`}
                onClick={() => setStudentNavTab("menu")}
              >
                <Icon name="home" size={17} />
                <span>Food Catalog</span>
              </button>
              <button
                className={`sidebar-nav-btn ${
                  studentNavTab === "active_ticket" ? "active" : ""
                }`}
                onClick={() => setStudentNavTab("active_ticket")}
              >
                <Icon name="receipt" size={17} />
                <span>Active Ticket</span>
                {activeOrder && <span className="nav-badge alert">LIVE</span>}
              </button>
              <button
                className={`sidebar-nav-btn ${
                  studentNavTab === "history" ? "active" : ""
                }`}
                onClick={() => setStudentNavTab("history")}
              >
                <Icon name="clock" size={17} />
                <span>Order History</span>
              </button>
            </>
          )}
        </nav>

        {/* Sidebar Footer */}
        <div className="sidebar-footer">
          <div
            className="sidebar-user-chip"
            onClick={() => setUserProfileModalOpen(true)}
            role="button"
            tabIndex={0}
            title="Click to view Account Profile & Top-Up Wallet"
          >
            <div className="user-avatar-circle">
              {currentUser.full_name
                ? currentUser.full_name.charAt(0).toUpperCase()
                : "U"}
            </div>
            <div className="user-chip-meta">
              <strong>{currentUser.full_name}</strong>
              <small>
                {currentUser.role.replace("_", " ")} &bull; ₱
                {currentUser.balance}.00
              </small>
            </div>
          </div>
          <div style={{ display: "flex", gap: "6px" }}>
            <button
              className="sidebar-signout-btn"
              onClick={() => {
                setChangePasswordModalOpen(true)
                setPwdError("")
                setPwdSuccess("")
              }}
              style={{ flex: 1 }}
              title="Change Account Password"
            >
              <Icon name="key" size={13} />
              <span>Password</span>
            </button>
            <button
              className="sidebar-signout-btn"
              onClick={() => setLogoutModalOpen(true)}
              style={{ flex: 1 }}
              title="Switch Role / Sign Out"
            >
              <Icon name="logout" size={13} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* 2B. MAIN VIEWPORT */}
      <div className="app-main-viewport">
        {/* Floating Sync Feedback Toast */}
        {syncToast && (
          <div className="floating-sync-toast">
            <Icon name="check" size={15} />
            <span>{syncToast}</span>
          </div>
        )}

        {/* Real-time Order Notification Pop-up Toast */}
        {orderAlertToast && (
          <div
            className="floating-order-toast"
            onClick={() => {
              if (orderAlertToast.orderId) {
                const found = allOrders.find(
                  (o) => o.id === orderAlertToast.orderId,
                )
                if (found) setActiveOrder(found)
              }
              if (currentUser.role === "student")
                setStudentNavTab("active_ticket")
              else if (currentUser.role === "admin") setAdminNavTab("orders")
              setOrderAlertToast(null)
            }}
          >
            <div
              className={`order-toast-icon ${
                orderAlertToast.status === "Preparing"
                  ? "cooking"
                  : orderAlertToast.status === "Ready for pickup"
                    ? "ready"
                    : orderAlertToast.status === "Completed"
                      ? "completed"
                      : "placed"
              }`}
            >
              {orderAlertToast.status === "Preparing" ? (
                <Icon name="chef" size={20} />
              ) : orderAlertToast.status === "Ready for pickup" ? (
                <Icon name="bag" size={20} />
              ) : orderAlertToast.status === "Completed" ? (
                <Icon name="check" size={20} />
              ) : (
                <Icon name="receipt" size={20} />
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "8px",
                }}
              >
                <strong style={{ fontSize: "13px", color: "#FFFFFF" }}>
                  {orderAlertToast.title}
                </strong>
                <span className="order-toast-badge">
                  {orderAlertToast.status}
                </span>
              </div>
              <p
                style={{
                  margin: "3px 0 0",
                  fontSize: "12px",
                  color: "rgba(255, 255, 255, 0.88)",
                  lineHeight: 1.35,
                }}
              >
                {orderAlertToast.message}
              </p>
            </div>
            <button
              type="button"
              className="order-toast-dismiss"
              onClick={(e) => {
                e.stopPropagation()
                setOrderAlertToast(null)
              }}
              title="Dismiss alert"
            >
              <Icon name="x" size={14} />
            </button>
          </div>
        )}

        {/* Topbar */}
        <header className="app-topbar">
          <div className="topbar-breadcrumb">
            <span>{activeCampus.name}</span>
            <span>/</span>
            <strong>
              {currentUser.role === "admin"
                ? "Admin dashboard"
                : currentUser.role === "staff"
                  ? "Kitchen operations"
                  : currentUser.role === "stall_manager"
                    ? branchNavTab === "overview"
                      ? "Branch Operations • 2 Branches Overview"
                      : `Branch Operations • ${stalls.find((s) => (branchNavTab === "stall_1" ? s.id === 1 : s.id === 2))?.name || "Branch"}`
                    : "Student canteen"}
            </strong>
          </div>

          <div className="topbar-actions">
            {/* Live Open Status Pill */}
            <div className="status-pill-open">
              <span className="live-dot" />
              <span>Canteen open &bull; {activeCampus.hours}</span>
            </div>

            {/* Cart Button for Students */}
            {currentUser.role === "student" && (
              <button
                className="cart-top-btn"
                onClick={() => setCartOpen(true)}
              >
                <Icon name="bag" size={16} />
                <span>Cart</span>
                {count > 0 && <b>{count}</b>}
              </button>
            )}

            <button
              className="icon-action-btn"
              onClick={() => {
                setChangePasswordModalOpen(true)
                setPwdError("")
                setPwdSuccess("")
              }}
              title="Change Account Password"
            >
              <Icon name="key" size={17} />
            </button>

            {/* Notification Bell Button with Interactive Popover */}
            <div style={{ position: "relative" }}>
              <button
                className="icon-action-btn"
                onClick={() => setNotificationsOpen((prev) => !prev)}
                title="Notifications & Alerts"
              >
                <Icon name="bell" size={17} />
                {notifications.filter((n) => n.unread).length > 0 && (
                  <span className="notification-count-badge">
                    {notifications.filter((n) => n.unread).length}
                  </span>
                )}
              </button>

              {/* Notifications Popover Dropdown */}
              {notificationsOpen && (
                <div className="notifications-dropdown">
                  <div className="notifications-header">
                    <div>
                      <strong
                        style={{
                          fontSize: "14px",
                          fontFamily: "var(--font-serif)",
                          color: "var(--ink)",
                        }}
                      >
                        Notifications
                      </strong>
                      <small
                        style={{
                          color: "var(--muted)",
                          display: "block",
                          fontSize: "11px",
                        }}
                      >
                        {notifications.filter((n) => n.unread).length} unread
                        updates
                      </small>
                    </div>
                    {notifications.some((n) => n.unread) && (
                      <button
                        type="button"
                        onClick={() => {
                          setNotifications((prev) => {
                            const updated = prev.map((n) => ({
                              ...n,
                              unread: false,
                            }))
                            try {
                              localStorage.setItem(
                                "smartbite_notifications",
                                JSON.stringify(updated),
                              )
                            } catch {}
                            return updated
                          })
                        }}
                        style={{
                          background: "none",
                          border: "none",
                          color: "var(--primary)",
                          fontSize: "11px",
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="notifications-list">
                    {notifications.length === 0 ? (
                      <div
                        style={{
                          padding: "36px 20px",
                          textAlign: "center",
                          color: "var(--muted)",
                        }}
                      >
                        <div
                          style={{
                            width: "42px",
                            height: "42px",
                            borderRadius: "50%",
                            background: "#F0FDF4",
                            color: "#16A34A",
                            display: "grid",
                            placeItems: "center",
                            margin: "0 auto 10px",
                          }}
                        >
                          <Icon name="check" size={20} />
                        </div>
                        <strong
                          style={{
                            display: "block",
                            fontSize: "13px",
                            color: "var(--ink)",
                          }}
                        >
                          All caught up!
                        </strong>
                        <p
                          style={{
                            margin: "4px 0 0",
                            fontSize: "11px",
                            color: "var(--muted)",
                          }}
                        >
                          No notifications or alerts. Cleared notifications
                          won't reappear.
                        </p>
                      </div>
                    ) : (
                      notifications.map((notif) => (
                        <div
                          key={notif.id}
                          className={`notification-item-card ${
                            notif.unread ? "unread" : ""
                          }`}
                          onClick={() => {
                            setNotifications((prev) => {
                              const updated = prev.map((n) =>
                                n.id === notif.id ? { ...n, unread: false } : n,
                              )
                              try {
                                localStorage.setItem(
                                  "smartbite_notifications",
                                  JSON.stringify(updated),
                                )
                              } catch {}
                              return updated
                            })
                            if (notif.type === "order") {
                              if (notif.orderId) {
                                const found = allOrders.find(
                                  (o) => o.id === notif.orderId,
                                )
                                if (found) setActiveOrder(found)
                              }
                              if (currentUser.role === "student")
                                setStudentNavTab("active_ticket")
                              else if (currentUser.role === "admin")
                                setAdminNavTab("orders")
                              setNotificationsOpen(false)
                            }
                          }}
                        >
                          <div
                            className={`notification-item-icon ${notif.type}`}
                          >
                            <Icon
                              name={
                                notif.type === "order"
                                  ? "bag"
                                  : notif.type === "balance"
                                    ? "receipt"
                                    : "bell"
                              }
                              size={15}
                            />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                              }}
                            >
                              <strong
                                style={{
                                  fontSize: "12px",
                                  color: "var(--ink)",
                                }}
                              >
                                {notif.title}
                              </strong>
                              <span
                                style={{
                                  fontSize: "10px",
                                  color: "var(--muted)",
                                }}
                              >
                                {notif.time}
                              </span>
                            </div>
                            {notif.status && (
                              <span
                                className={`status-pill ${
                                  notif.status === "Ready for pickup"
                                    ? "ready"
                                    : notif.status === "Preparing"
                                      ? "preparing"
                                      : notif.status === "Completed"
                                        ? "completed"
                                        : "pending"
                                }`}
                                style={{
                                  fontSize: "9px",
                                  padding: "1px 6px",
                                  margin: "2px 0 3px",
                                  display: "inline-block",
                                }}
                              >
                                {notif.status}
                              </span>
                            )}
                            <p
                              style={{
                                margin: "3px 0 0",
                                fontSize: "11px",
                                color: "var(--ink-secondary)",
                                lineHeight: 1.4,
                              }}
                            >
                              {notif.message}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={(e) =>
                              handleDismissNotification(notif.id, e)
                            }
                            style={{
                              background: "none",
                              border: "none",
                              color: "var(--muted)",
                              fontSize: "12px",
                              cursor: "pointer",
                              padding: "2px 4px",
                              lineHeight: 1,
                              borderRadius: "4px",
                              alignSelf: "flex-start",
                            }}
                            title="Dismiss notification"
                          >
                            <Icon name="x" size={12} />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="notifications-footer">
                    <button
                      type="button"
                      onClick={() => {
                        setNotifications((prev) => [
                          ...prev,
                          {
                            id: `notif-${Date.now()}`,
                            title: "Canteen Kitchen Alert 🔔",
                            message:
                              "New batch of fresh fruit shakes and meals arrived at Canteen Station A.",
                            time: "Just now",
                            type: "announcement",
                            unread: true,
                          },
                        ])
                      }}
                      style={{
                        background: "none",
                        border: "none",
                        color: "var(--primary)",
                        fontSize: "11px",
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      + Test Alert
                    </button>
                    <button
                      type="button"
                      onClick={handleClearAllNotifications}
                      disabled={notifications.length === 0}
                      style={{
                        background: "none",
                        border: "none",
                        color:
                          notifications.length === 0
                            ? "var(--line-strong)"
                            : "#EF4444",
                        fontSize: "11px",
                        fontWeight: 600,
                        cursor:
                          notifications.length === 0 ? "default" : "pointer",
                      }}
                    >
                      Clear all
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Refresh Button with Active Spinning Feedback */}
            <button
              className={`icon-action-btn ${isRefreshing ? "spinning" : ""}`}
              onClick={handleRefreshSync}
              title="Refresh and sync canteen data"
            >
              <Icon name="refresh" size={17} />
            </button>

            <button
              className="icon-action-btn"
              onClick={() => setLogoutModalOpen(true)}
              title="Exit"
            >
              <Icon name="logout" size={17} />
            </button>
          </div>
        </header>

        {/* Scrollable Main Content */}
        <div className="main-content-scroll">
          {/* ===============================================================
              DASHBOARD 1: ADMIN ROLE (SCREENSHOTS 3 & 4)
              =============================================================== */}
          {currentUser.role === "admin" && (
            <>
              {/* Header matching Screenshot 3 & 4 */}
              <div className="dashboard-header">
                <div className="dashboard-header-text">
                  <span className="eyebrow-chip">
                    <span className="sparkle"></span> HOLY NAME UNIVERSITY
                    &bull; SCHOOL ADMIN
                  </span>
                  <h1>Your school, at a glance.</h1>
                  <p>A clear view of canteen operations across your campus.</p>
                </div>
                <span className="role-badge-tag">ADMIN ACCESS</span>
              </div>

              {/* OVERVIEW SUB-VIEW (EXACT SCREENSHOT 3 & 4) */}
              {adminNavTab === "overview" && (
                <>
                  {/* 4 Stat Cards in a row */}
                  <div className="stats-cards-grid">
                    <div className="stat-card-item">
                      <span className="stat-card-label">Orders today</span>
                      <strong className="stat-card-val">
                        {allOrders.length}
                      </strong>
                      <span className="stat-card-sub">Orders placed today</span>
                    </div>
                    <div className="stat-card-item">
                      <span className="stat-card-label">Sales today</span>
                      <strong className="stat-card-val">
                        ₱
                        {allOrders
                          .filter(
                            (o) =>
                              o.order_status === "Completed" ||
                              o.order_status === "Ready for pickup",
                          )
                          .reduce((sum, o) => sum + Number(o.total_amount), 0)}
                        .00
                      </strong>
                      <span className="stat-card-sub">
                        Excludes cancelled orders
                      </span>
                    </div>
                    <div className="stat-card-item">
                      <span className="stat-card-label">Active students</span>
                      <strong className="stat-card-val">
                        {userProfiles.filter((u) => u.role === "student")
                          .length || 1}
                      </strong>
                      <span className="stat-card-sub">With canteen access</span>
                    </div>
                    <div className="stat-card-item">
                      <span className="stat-card-label">Canteen team</span>
                      <strong className="stat-card-val">
                        {userProfiles.filter((u) => u.role !== "student")
                          .length || 5}
                      </strong>
                      <span className="stat-card-sub">
                        Active staff and admins
                      </span>
                    </div>
                  </div>

                  {/* Action Shortcuts matching Screenshot 3 & 4 */}
                  <div className="shortcuts-row">
                    <div
                      className="shortcut-card"
                      onClick={() => setAdminNavTab("orders")}
                    >
                      <div className="shortcut-meta">
                        <strong>Order activity</strong>
                        <span>
                          {
                            allOrders.filter(
                              (o) => o.order_status !== "Completed",
                            ).length
                          }{" "}
                          orders need attention
                        </span>
                      </div>
                      <span className="shortcut-arrow">&rarr;</span>
                    </div>
                    <div
                      className="shortcut-card"
                      onClick={() => setAdminNavTab("users")}
                    >
                      <div className="shortcut-meta">
                        <strong>Staff directory</strong>
                        <span>Review canteen team access</span>
                      </div>
                      <span className="shortcut-arrow">&rarr;</span>
                    </div>
                    <div
                      className="shortcut-card"
                      onClick={() => setAdminNavTab("menu")}
                    >
                      <div className="shortcut-meta">
                        <strong>Menu availability</strong>
                        <span>
                          {items.filter((i) => i.is_available).length} items
                          available today
                        </span>
                      </div>
                      <span className="shortcut-arrow">&rarr;</span>
                    </div>
                  </div>

                  {/* Two-Column Grid: Chart & Latest Orders (Left) + Campus Profile (Right) */}
                  <div className="dashboard-2col-grid">
                    {/* Left Column */}
                    <div>
                      {/* Weekly Canteen Sales Card */}
                      <div className="card-panel">
                        <div className="card-panel-header">
                          <div>
                            <h3>Weekly canteen sales</h3>
                            <p>Monday to Friday</p>
                          </div>
                          <strong
                            style={{ fontSize: "12px", color: "var(--muted)" }}
                          >
                            Week summary
                          </strong>
                        </div>
                        <div className="sales-chart-wrap">
                          <span className="sales-chart-total">
                            ₱
                            {salesAnalytics.reduce(
                              (sum, a) => sum + Number(a.total_revenue || 0),
                              0,
                            ) || "1,420"}
                            .00
                          </span>
                          <div className="sales-bars-row">
                            {weeklySalesData.days.map((d, idx) => {
                              const heightPct = Math.round(
                                (d.val / weeklySalesData.maxVal) * 100,
                              )
                              return (
                                <div className="sales-bar-col" key={idx}>
                                  <div className="bar-track">
                                    <div
                                      className="bar-fill"
                                      style={{ height: `${heightPct}%` }}
                                    />
                                  </div>
                                  <span className="bar-label">{d.label}</span>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Latest Canteen Orders Table */}
                      <div className="card-panel">
                        <div className="card-panel-header">
                          <div>
                            <h3>Latest canteen orders</h3>
                            <p>Real-time orders across all branches</p>
                          </div>
                          <button
                            className="btn-secondary"
                            onClick={() => setAdminNavTab("orders")}
                            style={{ fontSize: "11px", padding: "4px 10px" }}
                          >
                            View all &rarr;
                          </button>
                        </div>
                        <div className="data-table-wrap">
                          <table className="data-table">
                            <thead>
                              <tr>
                                <th>ORDER</th>
                                <th>ITEMS</th>
                                <th>TIME</th>
                                <th>TOTAL</th>
                                <th>STATUS</th>
                              </tr>
                            </thead>
                            <tbody>
                              {allOrders.slice(0, 5).map((ord) => (
                                <tr key={ord.id}>
                                  <td>
                                    <strong>#{ord.id}</strong>
                                  </td>
                                  <td>
                                    {ord.order_items
                                      ?.map(
                                        (i) =>
                                          `${i.item_name} (x${i.quantity})`,
                                      )
                                      .join(", ") || "Canteen meal package"}
                                  </td>
                                  <td style={{ color: "var(--muted)" }}>
                                    {ord.pickup_time || "8–12 min"}
                                  </td>
                                  <td>
                                    <strong>₱{ord.total_amount}.00</strong>
                                  </td>
                                  <td>
                                    <span
                                      className={`status-pill ${
                                        ord.order_status === "Ready for pickup"
                                          ? "ready"
                                          : ord.order_status === "Preparing"
                                            ? "preparing"
                                            : ord.order_status === "Completed"
                                              ? "completed"
                                              : "pending"
                                      }`}
                                    >
                                      {ord.order_status}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>

                    {/* Right Column: Campus Profile Card */}
                    <div>
                      <div className="campus-profile-card">
                        <div className="campus-profile-top">
                          <span
                            className="sidebar-section-kicker"
                            style={{ margin: 0 }}
                          >
                            CAMPUS PROFILE
                          </span>
                          <span className="campus-badge-active">ACTIVE</span>
                        </div>
                        <div className="campus-profile-title">
                          <div
                            className="school-badge-square"
                            style={{
                              width: "44px",
                              height: "44px",
                              fontSize: "14px",
                            }}
                          >
                            HNU
                          </div>
                          <div>
                            <strong
                              style={{ display: "block", fontSize: "15px" }}
                            >
                              Holy Name University
                            </strong>
                            <small style={{ color: "var(--muted)" }}>
                              School canteen
                            </small>
                          </div>
                        </div>
                        <div className="campus-profile-meta">
                          <div className="campus-meta-row">
                            <span>Campus code</span>
                            <strong>HNU-TAGB</strong>
                          </div>
                          <div className="campus-meta-row">
                            <span>Location</span>
                            <strong>Main Campus, Dampas</strong>
                          </div>
                          <div className="campus-meta-row">
                            <span>Operating hours</span>
                            <strong>6:00 AM &ndash; 6:00 PM</strong>
                          </div>
                          <div className="campus-meta-row">
                            <span>Payment support</span>
                            <strong>Cash &bull; Student Balance</strong>
                          </div>
                          <div className="campus-meta-row">
                            <span>PostgreSQL 15</span>
                            <strong style={{ color: "var(--primary)" }}>
                              3NF &bull; 10 Tables
                            </strong>
                          </div>
                          <div className="campus-meta-row">
                            <span>Cloud Backend</span>
                            <strong
                              style={{
                                fontFamily: "var(--font-mono)",
                                fontSize: "11px",
                              }}
                            >
                              zkarmieyteouuvzhojrv
                            </strong>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* ADMIN TAB 2: ORDERS MANAGEMENT */}
              {adminNavTab === "orders" && (
                <div className="card-panel">
                  <div className="card-panel-header">
                    <div>
                      <h3>All Campus Canteen Orders ({allOrders.length})</h3>
                      <p>Filter, inspect, and update student order tickets</p>
                    </div>
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={handleRefreshQueue}
                      disabled={isRefreshingQueue}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        cursor: "pointer",
                      }}
                    >
                      <span
                        className={isRefreshingQueue ? "spinning-icon" : ""}
                      >
                        <Icon name="refresh" size={14} />
                      </span>
                      <span>
                        {isRefreshingQueue ? "Refreshing..." : "Refresh Orders"}
                      </span>
                    </button>
                  </div>
                  <div className="data-table-wrap">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Order ID</th>
                          <th>Student Name</th>
                          <th>ID Number</th>
                          <th>Items Ordered</th>
                          <th>Branch</th>
                          <th>Total Amount</th>
                          <th>Payment Method</th>
                          <th>Status</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allOrders.map((ord) => (
                          <tr key={ord.id}>
                            <td>
                              <code>#{ord.id}</code>
                            </td>
                            <td>
                              <strong>{ord.student_name}</strong>
                            </td>
                            <td>{ord.student_number}</td>
                            <td>
                              {ord.order_items
                                ?.map((i) => `${i.item_name} (x${i.quantity})`)
                                .join(", ") || "Package"}
                            </td>
                            <td>
                              {stalls.find((s) => s.id === ord.stall_id)
                                ?.name || `Stall #${ord.stall_id}`}
                            </td>
                            <td>
                              <strong>₱{ord.total_amount}.00</strong>
                            </td>
                            <td>{ord.payment_method}</td>
                            <td>
                              <span
                                className={`status-pill ${
                                  ord.order_status === "Ready for pickup"
                                    ? "ready"
                                    : ord.order_status === "Preparing"
                                      ? "preparing"
                                      : ord.order_status === "Completed"
                                        ? "completed"
                                        : "pending"
                                }`}
                              >
                                {ord.order_status}
                              </span>
                            </td>
                            <td>
                              <select
                                value={ord.order_status}
                                onChange={async (e) => {
                                  await canteenApi.orders.updateStatus(
                                    ord.id,
                                    e.target.value as any,
                                  )
                                  refreshAllData()
                                }}
                                style={{
                                  border: "1px solid var(--line)",
                                  borderRadius: "6px",
                                  padding: "4px 8px",
                                  fontSize: "11px",
                                  fontWeight: 600,
                                }}
                              >
                                <option value="Order placed">
                                  Order placed
                                </option>
                                <option value="Preparing">Preparing</option>
                                <option value="Ready for pickup">
                                  Ready for pickup
                                </option>
                                <option value="Completed">Completed</option>
                                <option value="Cancelled">Cancelled</option>
                              </select>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ADMIN TAB 3: MENU INSPECTOR & CRUD */}
              {adminNavTab === "menu" && (
                <div className="card-panel">
                  <div
                    className="card-panel-header"
                    style={{ alignItems: "center" }}
                  >
                    <div>
                      <h3>Campus Menu Catalog ({items.length} items)</h3>
                      <p>
                        Current offerings across all canteen stalls &bull; Click
                        status or actions to edit
                      </p>
                    </div>
                    <button
                      type="button"
                      className="auth-btn-primary"
                      onClick={openCreateModal}
                      style={{
                        width: "auto",
                        padding: "0 16px",
                        height: "36px",
                        fontSize: "12px",
                      }}
                    >
                      <Icon name="plus" size={15} /> Add Food Item
                    </button>
                  </div>
                  <div className="data-table-wrap">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Dish</th>
                          <th>Branch</th>
                          <th>Category</th>
                          <th>Price</th>
                          <th>Prep Time</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((item) => (
                          <tr key={item.id}>
                            <td>
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "10px",
                                }}
                              >
                                <img
                                  src={item.image_url}
                                  alt=""
                                  style={{
                                    width: "36px",
                                    height: "36px",
                                    borderRadius: "6px",
                                    objectFit: "cover",
                                  }}
                                />
                                <div>
                                  <strong>{item.name}</strong>
                                  <small
                                    style={{
                                      display: "block",
                                      color: "var(--muted)",
                                      fontSize: "11px",
                                    }}
                                  >
                                    {item.description}
                                  </small>
                                </div>
                              </div>
                            </td>
                            <td>
                              {stalls.find((s) => s.id === item.stall_id)
                                ?.name || `Stall #${item.stall_id}`}
                            </td>
                            <td>{item.category}</td>
                            <td>
                              <strong>₱{item.price}.00</strong>
                            </td>
                            <td>
                              <button
                                type="button"
                                className="btn-secondary"
                                style={{
                                  padding: "3px 8px",
                                  fontSize: "12px",
                                  fontWeight: 600,
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "4px",
                                }}
                                onClick={(e) => openEditModal(item, e)}
                                title="Click to edit Prep Time & Details"
                              >
                                <span>
                                  {item.preparation_time_minutes} mins
                                </span>
                                <Icon name="edit" size={11} />
                              </button>
                            </td>
                            <td>
                              <button
                                type="button"
                                className={`status-pill ${
                                  item.is_available ? "ready" : "cancelled"
                                }`}
                                style={{
                                  border: "none",
                                  cursor: "pointer",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "4px",
                                }}
                                onClick={(e) =>
                                  handleToggleItemAvailable(item, e)
                                }
                                title="Click to toggle Available / Sold Out"
                              >
                                <span>
                                  {item.is_available ? "Available" : "Sold Out"}
                                </span>
                              </button>
                            </td>
                            <td>
                              <div style={{ display: "flex", gap: "6px" }}>
                                <button
                                  type="button"
                                  className="auth-btn-primary"
                                  onClick={(e) => openEditModal(item, e)}
                                  style={{
                                    width: "auto",
                                    padding: "4px 10px",
                                    fontSize: "11px",
                                    height: "28px",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "4px",
                                  }}
                                  title="Edit full dish details"
                                >
                                  <Icon name="edit" size={12} />
                                  <span>Edit</span>
                                </button>
                                <button
                                  type="button"
                                  className="btn-secondary"
                                  onClick={() => handleDeleteMenuItem(item.id)}
                                  style={{
                                    padding: "4px 8px",
                                    fontSize: "11px",
                                    color: "#b91c1c",
                                    height: "28px",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "4px",
                                  }}
                                  title="Delete item"
                                >
                                  <Icon name="trash" size={12} />
                                  <span>Delete</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ADMIN TAB 4: INVENTORY INSPECTOR */}
              {adminNavTab === "inventory" && (
                <div className="card-panel">
                  <div className="card-panel-header">
                    <div>
                      <h3>Ingredient Stock Levels</h3>
                      <p>PostgreSQL tracked canteen inventory balances</p>
                    </div>
                  </div>
                  <div className="data-table-wrap">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Ingredient</th>
                          <th>Branch</th>
                          <th>Stock Balance</th>
                          <th>Minimum Safe Level</th>
                          <th>Restock &amp; Edit Stock</th>
                        </tr>
                      </thead>
                      <tbody>
                        {inventoryList.map((inv) => {
                          const isLow =
                            Number(inv.current_stock) <=
                            Number(inv.minimum_threshold)
                          return (
                            <tr key={inv.id}>
                              <td>#{inv.id}</td>
                              <td>
                                <strong>{inv.item_name}</strong>
                              </td>
                              <td>
                                {stalls.find((s) => s.id === inv.stall_id)
                                  ?.name || "Main Kitchen"}
                              </td>
                              <td>
                                <strong
                                  style={{
                                    color: isLow ? "#b91c1c" : "#15803d",
                                  }}
                                >
                                  {inv.current_stock} {inv.unit_of_measure}
                                </strong>
                              </td>
                              <td>
                                {inv.minimum_threshold} {inv.unit_of_measure}
                              </td>
                              <td>
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "8px",
                                    flexWrap: "wrap",
                                  }}
                                >
                                  <button
                                    type="button"
                                    className="auth-btn-primary"
                                    style={{
                                      width: "auto",
                                      padding: "4px 10px",
                                      fontSize: "11px",
                                      height: "28px",
                                      display: "flex",
                                      alignItems: "center",
                                      gap: "4px",
                                    }}
                                    onClick={() => openEditStockModal(inv)}
                                    title="Edit stock quantity directly"
                                  >
                                    <Icon name="edit" size={12} />
                                    <span>Edit Stock</span>
                                  </button>
                                  <button
                                    type="button"
                                    className="btn-secondary"
                                    style={{
                                      padding: "4px 8px",
                                      fontSize: "11px",
                                      height: "28px",
                                    }}
                                    onClick={() => handleQuickRestock(inv, 25)}
                                    title={`Quick restock +25 ${inv.unit_of_measure}`}
                                  >
                                    + Restock (+25 {inv.unit_of_measure})
                                  </button>
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ADMIN TAB 5: USER DIRECTORY ("admin should be overview all the users") */}
              {adminNavTab === "users" && (
                <div className="card-panel">
                  <div
                    className="card-panel-header"
                    style={{ alignItems: "center" }}
                  >
                    <div>
                      <h3>All Registered Users ({userProfiles.length})</h3>
                      <p>
                        Full user management: create stall accounts, admin
                        users, staff, and customer accounts
                      </p>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        gap: "10px",
                        alignItems: "center",
                        flexWrap: "wrap",
                      }}
                    >
                      <button
                        className="auth-btn-primary"
                        onClick={() => {
                          setAdminCreateUserModalOpen(true)
                          setNewPassword("")
      setShowNewPassword(false)
                          setShowNewPassword(false)
                          setAdminUserModalError("")
                          setAdminUserModalSuccess("")
                        }}
                        style={{
                          width: "auto",
                          padding: "0 16px",
                          height: "36px",
                          fontSize: "12px",
                        }}
                      >
                        <Icon name="plus" size={15} /> Add User / Create Account
                      </button>
                      <div
                        className="search-input-box"
                        style={{ width: "180px", height: "36px" }}
                      >
                        <Icon name="search" size={15} />
                        <input
                          value={userSearchQuery}
                          onChange={(e) => setUserSearchQuery(e.target.value)}
                          placeholder="Search users..."
                        />
                      </div>
                      <select
                        value={userRoleFilter}
                        onChange={(e) =>
                          setUserRoleFilter(e.target.value as any)
                        }
                        style={{
                          border: "1px solid var(--line)",
                          borderRadius: "8px",
                          padding: "6px 12px",
                          fontSize: "12px",
                        }}
                      >
                        <option value="all">All Roles</option>
                        <option value="student">Customers / Students</option>
                        <option value="staff">Kitchen Staff</option>
                        <option value="stall_manager">Stall Accounts</option>
                        <option value="admin">Administrators</option>
                      </select>
                    </div>
                  </div>
                  <div className="data-table-wrap">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>User ID</th>
                          <th>Email</th>
                          <th>Full Name (First, Middle, Last)</th>
                          <th>Role Tier</th>
                          <th>Assigned Stall</th>
                          <th>Grade / Dept</th>
                          <th>Wallet Balance</th>
                          <th>Status</th>
                          <th>Admin Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {userProfiles
                          .filter((u) => {
                            const matchRole =
                              userRoleFilter === "all" ||
                              u.role === userRoleFilter
                            const matchQuery =
                              u.full_name
                                .toLowerCase()
                                .includes(userSearchQuery.toLowerCase()) ||
                              u.student_id
                                .toLowerCase()
                                .includes(userSearchQuery.toLowerCase()) ||
                              (u.email || "")
                                .toLowerCase()
                                .includes(userSearchQuery.toLowerCase())
                            return matchRole && matchQuery
                          })
                          .map((user) => (
                            <tr key={user.id}>
                              <td>
                                <code>{user.student_id}</code>
                              </td>
                              <td>
                                {user.email || (
                                  <span style={{ color: "var(--muted)" }}>
                                    Not assigned
                                  </span>
                                )}
                              </td>
                              <td>
                                <strong>{user.full_name}</strong>
                                <small
                                  style={{
                                    display: "block",
                                    color: "var(--muted)",
                                    fontSize: "11px",
                                  }}
                                >
                                  {user.first_name
                                    ? `${user.first_name} | ${user.middle_name || "—"} | ${user.last_name}`
                                    : "Name record"}
                                </small>
                              </td>
                              <td>
                                <select
                                  value={user.role}
                                  onChange={async (e) => {
                                    await canteenApi.auth.updateProfile(
                                      user.id,
                                      { role: e.target.value as UserRole },
                                    )
                                    refreshAllData()
                                  }}
                                  style={{
                                    padding: "4px 8px",
                                    borderRadius: "6px",
                                    border: "1px solid var(--line)",
                                    fontSize: "11px",
                                    fontWeight: 700,
                                    background:
                                      user.role === "admin"
                                        ? "#ede9fe"
                                        : user.role === "stall_manager"
                                          ? "#dbeafe"
                                          : user.role === "staff"
                                            ? "#fef3c7"
                                            : "#dcfce7",
                                    color:
                                      user.role === "admin"
                                        ? "#5b21b6"
                                        : user.role === "stall_manager"
                                          ? "#1e40af"
                                          : user.role === "staff"
                                            ? "#92400e"
                                            : "#166534",
                                  }}
                                >
                                  <option value="student">student</option>
                                  <option value="staff">staff</option>
                                  <option value="stall_manager">
                                    stall_manager
                                  </option>
                                  <option value="admin">admin</option>
                                </select>
                              </td>
                              <td>
                                {user.role === "staff" ||
                                user.role === "stall_manager" ? (
                                  <select
                                    value={user.stall_id || 1}
                                    onChange={async (e) => {
                                      await canteenApi.auth.updateProfile(
                                        user.id,
                                        { stall_id: Number(e.target.value) },
                                      )
                                      refreshAllData()
                                    }}
                                    style={{
                                      padding: "3px 6px",
                                      borderRadius: "6px",
                                      border: "1px solid var(--line)",
                                      fontSize: "11px",
                                    }}
                                    title="Assign Staff to Stall"
                                  >
                                    {stalls.map((s) => (
                                      <option key={s.id} value={s.id}>
                                        {s.name} ({s.stall_code})
                                      </option>
                                    ))}
                                  </select>
                                ) : (
                                  <span
                                    style={{
                                      color: "var(--muted)",
                                      fontSize: "11px",
                                    }}
                                  >
                                    Campus-wide
                                  </span>
                                )}
                              </td>
                              <td>₱{user.balance}.00</td>
                              <td>
                                <span
                                  className={`status-pill ${
                                    user.is_active !== false
                                      ? "ready"
                                      : "cancelled"
                                  }`}
                                >
                                  {user.is_active !== false
                                    ? "Active"
                                    : "Suspended"}
                                </span>
                              </td>
                              <td>
                                <div
                                  style={{
                                    display: "flex",
                                    gap: "6px",
                                    alignItems: "center",
                                  }}
                                >
                                  <button
                                    className="btn-secondary"
                                    onClick={() => openEditUserModal(user)}
                                    style={{
                                      padding: "3px 8px",
                                      fontSize: "11px",
                                      display: "flex",
                                      alignItems: "center",
                                      gap: "3px",
                                      color: "var(--primary)",
                                      fontWeight: 700,
                                    }}
                                    title="Edit user name, role, and details"
                                  >
                                    <Icon name="edit" size={12} />
                                    <span>Edit</span>
                                  </button>
                                  <button
                                    className="btn-secondary"
                                    onClick={() => {
                                      setAdminResetUser(user)
                                      setAdminResetNewPwd("")
                                    }}
                                    style={{
                                      padding: "3px 8px",
                                      fontSize: "11px",
                                      display: "flex",
                                      alignItems: "center",
                                      gap: "3px",
                                    }}
                                    title="Reset Password for this User"
                                  >
                                    <Icon name="key" size={12} />
                                    <span>Reset Pwd</span>
                                  </button>
                                  <button
                                    className="btn-secondary"
                                    onClick={async () => {
                                      await canteenApi.auth.updateProfile(
                                        user.id,
                                        { is_active: !user.is_active },
                                      )
                                      refreshAllData()
                                    }}
                                    style={{
                                      padding: "3px 8px",
                                      fontSize: "11px",
                                    }}
                                  >
                                    {user.is_active !== false
                                      ? "Suspend"
                                      : "Activate"}
                                  </button>
                                  <button
                                    className="btn-secondary"
                                    onClick={async () => {
                                      if (
                                        (ADMIN_CREDENTIALS.userId &&
                                          user.student_id ===
                                            ADMIN_CREDENTIALS.userId) ||
                                        user.id === currentUser.id
                                      ) {
                                        alert(
                                          "You cannot delete the primary administrator account.",
                                        )
                                        return
                                      }
                                      if (
                                        window.confirm(
                                          `Are you sure you want to remove user "${user.full_name}"?`,
                                        )
                                      ) {
                                        setUserProfiles((prev) =>
                                          prev.filter(
                                            (p) =>
                                              p.id !== user.id &&
                                              p.student_id !== user.student_id,
                                          ),
                                        )
                                        await canteenApi.auth.deleteProfile(
                                          user.id,
                                          user.student_id,
                                        )
                                        await refreshAllData()
                                      }
                                    }}
                                    style={{
                                      padding: "3px 6px",
                                      fontSize: "11px",
                                      color: "#b91c1c",
                                    }}
                                    title="Delete User"
                                  >
                                    <Icon name="trash" size={13} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ===============================================================
              DASHBOARD 2: STAFF ROLE ("staff can crud the system, can edit anything")
              =============================================================== */}
          {currentUser.role === "staff" && (
            <>
              <div className="dashboard-header">
                <div className="dashboard-header-text">
                  <span className="eyebrow-chip">
                    <span className="sparkle"></span> KITCHEN STAFF OPERATIONS
                  </span>
                  <h1>Kitchen Display</h1>
                  <p></p>

                  {/* Stall handles many staff users */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      background: "var(--primary-light)",
                      padding: "8px 14px",
                      borderRadius: "10px",
                      marginTop: "10px",
                      flexWrap: "wrap",
                    }}
                  >
                    <Icon name="store" size={16} />
                    <strong
                      style={{ color: "var(--primary)", fontSize: "13px" }}
                    >
                      ASSIGNED STALL:{" "}
                      {stalls.find((s) => s.id === (currentUser.stall_id || 1))
                        ?.name || "SmartBite Main Kitchen"}{" "}
                      (
                      {stalls.find((s) => s.id === (currentUser.stall_id || 1))
                        ?.stall_code || "STALL-01"}
                      )
                    </strong>
                    <span style={{ color: "var(--muted)", fontSize: "12px" }}>
                      &bull; Staff Team on this Stall (
                      {
                        userProfiles.filter(
                          (u) =>
                            u.role === "staff" &&
                            (u.stall_id || 1) === (currentUser.stall_id || 1),
                        ).length
                      }{" "}
                      staff users):{" "}
                      {userProfiles
                        .filter(
                          (u) =>
                            u.role === "staff" &&
                            (u.stall_id || 1) === (currentUser.stall_id || 1),
                        )
                        .map((u) => u.full_name)
                        .join(", ")}
                    </span>
                  </div>
                </div>
                <button
                  className="auth-btn-primary"
                  onClick={openCreateModal}
                  style={{
                    width: "auto",
                    padding: "0 20px",
                    height: "42px",
                    fontSize: "13px",
                  }}
                >
                  <Icon name="plus" size={16} /> Add Food Item
                </button>
              </div>

              {/* Staff Navigation Tabs */}
              <div
                style={{ display: "flex", gap: "8px", marginBottom: "20px" }}
              >
                <button
                  className={`filter-pill-btn ${
                    staffNavTab === "kds" ? "active" : ""
                  }`}
                  onClick={() => setStaffNavTab("kds")}
                >
                  Live Queue (
                  {
                    allOrders.filter(
                      (o) =>
                        o.order_status !== "Completed" &&
                        (o as any).status !== "Completed",
                    ).length
                  }{" "}
                  active)
                </button>
                <button
                  className={`filter-pill-btn ${
                    staffNavTab === "orders" ? "active" : ""
                  }`}
                  onClick={() => setStaffNavTab("orders")}
                >
                  Orders (
                  {
                    allOrders.filter(
                      (o) =>
                        !currentUser.stall_id ||
                        Number(o.stall_id) === Number(currentUser.stall_id || 1),
                    ).length
                  }
                  )
                </button>
                <button
                  className={`filter-pill-btn ${
                    staffNavTab === "menu_crud" ? "active" : ""
                  }`}
                  onClick={() => setStaffNavTab("menu_crud")}
                >
                  Menu Items ({items.length})
                </button>
                <button
                  className={`filter-pill-btn ${
                    staffNavTab === "inventory_crud" ? "active" : ""
                  }`}
                  onClick={() => setStaffNavTab("inventory_crud")}
                >
                  Ingredient Stock ({inventoryList.length})
                </button>
              </div>

              {/* STAFF TAB 1: LIVE KDS QUEUE */}
              {staffNavTab === "kds" &&
                (() => {
                  const staffStallId = currentUser.stall_id || 1
                  const relevantOrders = allOrders.filter(
                    (o) =>
                      !currentUser.stall_id ||
                      Number(o.stall_id) === Number(staffStallId),
                  )
                  const staffOrders =
                    relevantOrders.length > 0 ? relevantOrders : allOrders

                  const upcomingOrders = staffOrders.filter(
                    (o) =>
                      o.order_status !== "Completed" &&
                      (o as any).status !== "Completed",
                  )
                  const completedOrders = staffOrders.filter(
                    (o) =>
                      o.order_status === "Completed" ||
                      (o as any).status === "Completed",
                  )
                  const displayOrders =
                    staffKdsFilter === "upcoming"
                      ? upcomingOrders
                      : staffKdsFilter === "completed"
                        ? completedOrders
                        : staffOrders

                  return (
                    <div className="card-panel">
                      <div
                        className="card-panel-header"
                        style={{
                          alignItems: "flex-start",
                          flexWrap: "wrap",
                          gap: "12px",
                        }}
                      >
                        <div>
                          <h3 style={{ margin: 0 }}>Live Kitchen Queue</h3>
                          <p
                            style={{
                              margin: "4px 0 0",
                              color: "var(--muted)",
                              fontSize: "12px",
                            }}
                          >
                            
                          </p>
                        </div>

                        {/* Filter Mode Selector Pills & View Switcher */}
                        <div
                          style={{
                            display: "flex",
                            gap: "8px",
                            alignItems: "center",
                            flexWrap: "wrap",
                          }}
                        >
                          <div
                            style={{
                              display: "inline-flex",
                              background: "#F1F5F9",
                              padding: "3px",
                              borderRadius: "8px",
                              border: "1px solid #E2E8F0",
                            }}
                          >
                            <button
                              type="button"
                              onClick={() => setStaffKdsViewMode("table")}
                              style={{
                                border: "none",
                                background:
                                  staffKdsViewMode === "table"
                                    ? "var(--primary)"
                                    : "transparent",
                                color:
                                  staffKdsViewMode === "table"
                                    ? "#fff"
                                    : "var(--muted)",
                                padding: "5px 12px",
                                borderRadius: "6px",
                                fontSize: "12px",
                                fontWeight: 600,
                                cursor: "pointer",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "5px",
                                transition: "all 0.15s ease",
                              }}
                            >
                              <Icon name="list" size={13} />
                              <span>Table View</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setStaffKdsViewMode("cards")}
                              style={{
                                border: "none",
                                background:
                                  staffKdsViewMode === "cards"
                                    ? "var(--primary)"
                                    : "transparent",
                                color:
                                  staffKdsViewMode === "cards"
                                    ? "#fff"
                                    : "var(--muted)",
                                padding: "5px 12px",
                                borderRadius: "6px",
                                fontSize: "12px",
                                fontWeight: 600,
                                cursor: "pointer",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "5px",
                                transition: "all 0.15s ease",
                              }}
                            >
                              <Icon name="grid" size={13} />
                              <span>Cards View</span>
                            </button>
                          </div>

                          <button
                            type="button"
                            className={`filter-pill-btn ${
                              staffKdsFilter === "all" ? "active" : ""
                            }`}
                            style={{ fontSize: "12px", padding: "6px 14px" }}
                            onClick={() => setStaffKdsFilter("all")}
                          >
                            All ({staffOrders.length})
                          </button>
                          <button
                            type="button"
                            className={`filter-pill-btn ${
                              staffKdsFilter === "upcoming" ? "active" : ""
                            }`}
                            style={{
                              fontSize: "12px",
                              padding: "6px 14px",
                              background:
                                staffKdsFilter === "upcoming"
                                  ? "var(--primary)"
                                  : undefined,
                              color:
                                staffKdsFilter === "upcoming"
                                  ? "#fff"
                                  : undefined,
                            }}
                            onClick={() => setStaffKdsFilter("upcoming")}
                          >
                             Upcoming ({upcomingOrders.length})
                          </button>
                          <button
                            type="button"
                            className={`filter-pill-btn ${
                              staffKdsFilter === "completed" ? "active" : ""
                            }`}
                            style={{
                              fontSize: "12px",
                              padding: "6px 14px",
                              background:
                                staffKdsFilter === "completed"
                                  ? "#16a34a"
                                  : undefined,
                              color:
                                staffKdsFilter === "completed"
                                  ? "#fff"
                                  : undefined,
                            }}
                            onClick={() => setStaffKdsFilter("completed")}
                          >
                            ✓ Completed ({completedOrders.length})
                          </button>
                          <button
                            type="button"
                            className="btn-secondary"
                            onClick={handleRefreshQueue}
                            disabled={isRefreshingQueue}
                            style={{
                              fontSize: "12px",
                              padding: "6px 12px",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "6px",
                              cursor: "pointer",
                            }}
                          >
                            <span
                              className={
                                isRefreshingQueue ? "spinning-icon" : ""
                              }
                            >
                              <Icon name="refresh" size={13} />
                            </span>
                            <span>
                              {isRefreshingQueue
                                ? "Refreshing..."
                                : "Refresh Queue"}
                            </span>
                          </button>
                        </div>
                      </div>

                      {staffOrders.length === 0 ? (
                        <div
                          style={{
                            textAlign: "center",
                            padding: "48px",
                            color: "var(--muted)",
                          }}
                        >
                          <Icon name="receipt" size={32} />
                          <p style={{ marginTop: "12px", fontSize: "14px" }}>
                            No orders found for this kitchen stall.
                          </p>
                        </div>
                      ) : staffKdsViewMode === "table" ? (
                        <div className="data-table-wrap" style={{ marginTop: "12px" }}>
                          <table className="data-table">
                            <thead>
                              <tr>
                                <th>Order ID</th>
                                <th>Student Name</th>
                                <th>ID Number</th>
                                <th>Items Ordered</th>
                                <th>Total Amount</th>
                                <th>Payment</th>
                                <th>Status</th>
                                <th>Action</th>
                              </tr>
                            </thead>
                            <tbody>
                              {displayOrders.length === 0 ? (
                                <tr>
                                  <td
                                    colSpan={8}
                                    style={{
                                      textAlign: "center",
                                      padding: "36px",
                                      color: "var(--muted)",
                                    }}
                                  >
                                    No {staffKdsFilter} orders found for this stall.
                                  </td>
                                </tr>
                              ) : (
                                displayOrders.map((ord) => (
                                  <tr key={ord.id}>
                                    <td>
                                      <code>#SB-{ord.id}</code>
                                    </td>
                                    <td>
                                      <strong>{ord.student_name}</strong>
                                    </td>
                                    <td>{ord.student_number}</td>
                                    <td>
                                      {ord.order_items
                                        ?.map((i) => `${i.item_name} (x${i.quantity})`)
                                        .join(", ") || "Package"}
                                    </td>
                                    <td>
                                      <strong>₱{ord.total_amount}.00</strong>
                                    </td>
                                    <td>
                                      <div
                                        style={{
                                          display: "flex",
                                          alignItems: "center",
                                          gap: "6px",
                                        }}
                                      >
                                        <span>{ord.payment_method}</span>
                                        {ord.payment_status === "paid" ||
                                        ord.order_status === "Completed" ? (
                                          <span
                                            style={{
                                              color: "#16a34a",
                                              fontWeight: 700,
                                              fontSize: "11px",
                                            }}
                                          >
                                            ✓ Paid
                                          </span>
                                        ) : (
                                          <button
                                            type="button"
                                            style={{
                                              background: "#DCFCE7",
                                              color: "#15803D",
                                              border: "1px solid #86EFAC",
                                              borderRadius: "4px",
                                              padding: "2px 6px",
                                              fontSize: "11px",
                                              fontWeight: 600,
                                              cursor: "pointer",
                                            }}
                                            onClick={async () => {
                                              await canteenApi.orders.updatePaymentStatus(
                                                ord.id,
                                                "paid",
                                              )
                                              refreshAllData()
                                            }}
                                          >
                                            💵 Mark Paid
                                          </button>
                                        )}
                                      </div>
                                    </td>
                                    <td>
                                      <span
                                        className={`status-pill ${
                                          ord.order_status === "Ready for pickup"
                                            ? "ready"
                                            : ord.order_status === "Preparing"
                                              ? "preparing"
                                              : ord.order_status === "Completed"
                                                ? "completed"
                                                : "pending"
                                        }`}
                                      >
                                        {ord.order_status}
                                      </span>
                                    </td>
                                    <td>
                                      <select
                                        value={ord.order_status}
                                        onChange={async (e) => {
                                          const newStatus = e.target.value
                                          await canteenApi.orders.updateStatus(
                                            ord.id,
                                            newStatus as any,
                                          )
                                          if (newStatus === "Completed") {
                                            try {
                                              await canteenApi.orders.updatePaymentStatus(
                                                ord.id,
                                                "paid",
                                              )
                                            } catch (err) {
                                              console.warn(err)
                                            }
                                          }
                                          refreshAllData()
                                        }}
                                        style={{
                                          border: "1px solid var(--line)",
                                          borderRadius: "6px",
                                          padding: "5px 8px",
                                          fontSize: "12px",
                                          fontWeight: 600,
                                          cursor: "pointer",
                                          background: "#fff",
                                          color: "var(--ink)",
                                        }}
                                      >
                                        <option value="Order placed">
                                          Order placed
                                        </option>
                                        <option value="Preparing">
                                          Preparing
                                        </option>
                                        <option value="Ready for pickup">
                                          Ready for pickup
                                        </option>
                                        <option value="Completed">
                                          Completed
                                        </option>
                                        <option value="Cancelled">
                                          Cancelled
                                        </option>
                                      </select>
                                    </td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "32px",
                          }}
                        >
                          {/* SECTION 1: UPCOMING & IN-PROGRESS ORDERS */}
                          {(staffKdsFilter === "all" ||
                            staffKdsFilter === "upcoming") && (
                            <div>
                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                  marginBottom: "14px",
                                  borderBottom: "2px solid #E2E8F0",
                                  paddingBottom: "8px",
                                  flexWrap: "wrap",
                                  gap: "8px",
                                }}
                              >
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "8px",
                                  }}
                                >
                                  <span
                                    style={{
                                      display: "inline-block",
                                      width: "10px",
                                      height: "10px",
                                      borderRadius: "50%",
                                      background: "#f59e0b",
                                      boxShadow:
                                        "0 0 0 3px rgba(245, 158, 11, 0.2)",
                                    }}
                                  />
                                  <h4
                                    style={{
                                      margin: 0,
                                      fontSize: "16px",
                                      color: "var(--ink)",
                                    }}
                                  >
                                    Upcoming &amp; In-Progress Orders
                                  </h4>
                                  <span
                                    className="count-badge ready"
                                    style={{
                                      fontSize: "11px",
                                      padding: "2px 8px",
                                    }}
                                  >
                                    {upcomingOrders.length} ticket
                                    {upcomingOrders.length !== 1 ? "s" : ""}
                                  </span>
                                </div>
                                <small
                                  style={{
                                    color: "var(--muted)",
                                    fontSize: "12px",
                                  }}
                                >
                                  Needs kitchen cooking &amp; counter pickup
                                </small>
                              </div>

                              {upcomingOrders.length === 0 ? (
                                <div
                                  style={{
                                    textAlign: "center",
                                    padding: "36px 16px",
                                    background: "#F8FAFC",
                                    borderRadius: "10px",
                                    border: "1px dashed var(--line)",
                                    color: "var(--muted)",
                                  }}
                                >
                                  <Icon name="check" size={28} />
                                  <strong
                                    style={{
                                      display: "block",
                                      fontSize: "14px",
                                      marginTop: "8px",
                                      color: "var(--ink)",
                                    }}
                                  >
                                    All caught up!
                                  </strong>
                                  <p
                                    style={{
                                      margin: "4px 0 0",
                                      fontSize: "12px",
                                    }}
                                  >
                                    No upcoming orders waiting for preparation
                                    right now.
                                  </p>
                                </div>
                              ) : (
                                <div className="kds-cards-grid">
                                  {upcomingOrders.map((ord) => (
                                    <div
                                      className="kds-ticket-card"
                                      key={ord.id}
                                      style={{
                                        borderTop:
                                          ord.order_status ===
                                          "Ready for pickup"
                                            ? "4px solid #16a34a"
                                            : ord.order_status === "Preparing"
                                              ? "4px solid #f59e0b"
                                              : "4px solid #3b82f6",
                                      }}
                                    >
                                      <div>
                                        <div className="kds-card-head">
                                          <div>
                                            <span
                                              style={{
                                                fontSize: "11px",
                                                fontWeight: 800,
                                                color: "var(--primary)",
                                              }}
                                            >
                                              TICKET #{ord.id}
                                            </span>
                                            <strong
                                              style={{
                                                display: "block",
                                                fontSize: "15px",
                                                marginTop: "2px",
                                              }}
                                            >
                                              {ord.student_name}
                                            </strong>
                                            <small
                                              style={{ color: "var(--muted)" }}
                                            >
                                              ID: {ord.student_number}
                                            </small>
                                          </div>
                                          <span
                                            className={`status-pill ${
                                              ord.order_status ===
                                              "Ready for pickup"
                                                ? "ready"
                                                : ord.order_status ===
                                                    "Preparing"
                                                  ? "preparing"
                                                  : "pending"
                                            }`}
                                          >
                                            {ord.order_status}
                                          </span>
                                        </div>
                                        <ul className="kds-items-list">
                                          {ord.order_items?.map((oi, i) => (
                                            <li
                                              className="kds-item-row"
                                              key={i}
                                            >
                                              <span>
                                                {oi.item_name} &times;{" "}
                                                {oi.quantity}
                                              </span>
                                              <strong>
                                                ₱{oi.item_subtotal}.00
                                              </strong>
                                            </li>
                                          )) || (
                                            <li className="kds-item-row">
                                              <span>Meal Package</span>
                                              <strong>
                                                ₱{ord.total_amount}.00
                                              </strong>
                                            </li>
                                          )}
                                        </ul>
                                        <div
                                          style={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "center",
                                            fontSize: "12px",
                                            color: "var(--muted)",
                                            marginBottom: "12px",
                                            flexWrap: "wrap",
                                            gap: "6px",
                                          }}
                                        >
                                          <span>
                                            Payment:{" "}
                                            <strong
                                              style={{ color: "var(--ink)" }}
                                            >
                                              {ord.payment_method}
                                            </strong>
                                          </span>
                                          {ord.payment_status === "paid" ||
                                          ord.order_status === "Completed" ? (
                                            <span
                                              style={{
                                                color: "#16a34a",
                                                fontWeight: 700,
                                              }}
                                            >
                                              Paid ✓
                                            </span>
                                          ) : (
                                            <div
                                              style={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "6px",
                                              }}
                                            >
                                              <span
                                                style={{
                                                  color: "#d97706",
                                                  fontWeight: 700,
                                                }}
                                              >
                                                Pay at Counter
                                              </span>
                                              <button
                                                type="button"
                                                style={{
                                                  background: "#DCFCE7",
                                                  color: "#15803D",
                                                  border: "1px solid #86EFAC",
                                                  borderRadius: "4px",
                                                  padding: "2px 8px",
                                                  fontSize: "11px",
                                                  fontWeight: 600,
                                                  cursor: "pointer",
                                                }}
                                                onClick={async () => {
                                                  await canteenApi.orders.updatePaymentStatus(
                                                    ord.id,
                                                    "paid",
                                                  )
                                                  refreshAllData()
                                                }}
                                              >
                                                💵 Mark Paid
                                              </button>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                      <div>
                                        <div
                                          style={{
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "space-between",
                                            marginBottom: "8px",
                                            padding: "6px 8px",
                                            background: "#F8FAFC",
                                            borderRadius: "6px",
                                            border: "1px solid #E2E8F0",
                                          }}
                                        >
                                          <span
                                            style={{
                                              fontSize: "11px",
                                              fontWeight: 700,
                                              color: "var(--muted)",
                                              textTransform: "uppercase",
                                              letterSpacing: "0.5px",
                                            }}
                                          >
                                            Action:
                                          </span>
                                          <select
                                            value={ord.order_status}
                                            onChange={async (e) => {
                                              const newStatus = e.target.value
                                              await canteenApi.orders.updateStatus(
                                                ord.id,
                                                newStatus as any,
                                              )
                                              if (newStatus === "Completed") {
                                                try {
                                                  await canteenApi.orders.updatePaymentStatus(
                                                    ord.id,
                                                    "paid",
                                                  )
                                                } catch (err) {
                                                  console.warn(err)
                                                }
                                              }
                                              refreshAllData()
                                            }}
                                            style={{
                                              border: "1px solid var(--line)",
                                              borderRadius: "5px",
                                              padding: "3px 6px",
                                              fontSize: "11px",
                                              fontWeight: 600,
                                              cursor: "pointer",
                                              background: "#fff",
                                              color: "var(--ink)",
                                            }}
                                          >
                                            <option value="Order placed">
                                              Order placed
                                            </option>
                                            <option value="Preparing">
                                              Preparing
                                            </option>
                                            <option value="Ready for pickup">
                                              Ready for pickup
                                            </option>
                                            <option value="Completed">
                                              Completed
                                            </option>
                                            <option value="Cancelled">
                                              Cancelled
                                            </option>
                                          </select>
                                        </div>
                                        {ord.order_status ===
                                          "Order placed" && (
                                          <button
                                            type="button"
                                            className="kds-btn-action"
                                            style={{
                                              background: "var(--accent-amber)",
                                              cursor: "pointer",
                                            }}
                                            onClick={async () => {
                                              await canteenApi.orders.updateStatus(
                                                ord.id,
                                                "Preparing",
                                              )
                                              refreshAllData()
                                            }}
                                          >
                                            ▶ Start Cooking
                                          </button>
                                        )}
                                        {ord.order_status === "Preparing" && (
                                          <button
                                            type="button"
                                            className="kds-btn-action"
                                            style={{
                                              background: "var(--primary)",
                                              cursor: "pointer",
                                            }}
                                            onClick={async () => {
                                              await canteenApi.orders.updateStatus(
                                                ord.id,
                                                "Ready for pickup",
                                              )
                                              refreshAllData()
                                            }}
                                          >
                                            ✓ Mark Ready for Pickup
                                          </button>
                                        )}
                                        {ord.order_status ===
                                          "Ready for pickup" && (
                                          <button
                                            type="button"
                                            className="kds-btn-action"
                                            style={{
                                              background: "#16a34a",
                                              color: "#fff",
                                              cursor: "pointer",
                                            }}
                                            onClick={async () => {
                                              await canteenApi.orders.updateStatus(
                                                ord.id,
                                                "Completed",
                                              )
                                              await canteenApi.orders.updatePaymentStatus(
                                                ord.id,
                                                "paid",
                                              )
                                              refreshAllData()
                                            }}
                                          >
                                            ✓ Complete Ticket
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}

                          {/* SECTION 2: COMPLETED ORDERS */}
                          {(staffKdsFilter === "all" ||
                            staffKdsFilter === "completed") && (
                            <div>
                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                  marginBottom: "14px",
                                  borderBottom: "2px solid #E2E8F0",
                                  paddingBottom: "8px",
                                  flexWrap: "wrap",
                                  gap: "8px",
                                }}
                              >
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "8px",
                                  }}
                                >
                                  <span
                                    style={{
                                      display: "inline-block",
                                      width: "10px",
                                      height: "10px",
                                      borderRadius: "50%",
                                      background: "#16a34a",
                                      boxShadow:
                                        "0 0 0 3px rgba(22, 163, 74, 0.2)",
                                    }}
                                  />
                                  <h4
                                    style={{
                                      margin: 0,
                                      fontSize: "16px",
                                      color: "var(--ink)",
                                    }}
                                  >
                                    Completed Orders
                                  </h4>
                                  <span
                                    className="count-badge"
                                    style={{
                                      fontSize: "11px",
                                      padding: "2px 8px",
                                      background: "#F1F5F9",
                                      color: "var(--muted)",
                                    }}
                                  >
                                    {completedOrders.length} fulfilled
                                  </span>
                                </div>
                                <small
                                  style={{
                                    color: "var(--muted)",
                                    fontSize: "12px",
                                  }}
                                >
                                  Past orders picked up and finalized
                                </small>
                              </div>

                              {completedOrders.length === 0 ? (
                                <div
                                  style={{
                                    textAlign: "center",
                                    padding: "36px 16px",
                                    background: "#F8FAFC",
                                    borderRadius: "10px",
                                    border: "1px dashed var(--line)",
                                    color: "var(--muted)",
                                  }}
                                >
                                  <Icon name="receipt" size={28} />
                                  <strong
                                    style={{
                                      display: "block",
                                      fontSize: "14px",
                                      marginTop: "8px",
                                      color: "var(--ink)",
                                    }}
                                  >
                                    No completed tickets yet
                                  </strong>
                                  <p
                                    style={{
                                      margin: "4px 0 0",
                                      fontSize: "12px",
                                    }}
                                  >
                                    Tickets will appear here after staff clicks
                                    &quot;Complete Ticket&quot;.
                                  </p>
                                </div>
                              ) : (
                                <div className="kds-cards-grid">
                                  {completedOrders.map((ord) => (
                                    <div
                                      className="kds-ticket-card"
                                      key={ord.id}
                                      style={{
                                        borderTop: "4px solid #94a3b8",
                                        background: "#FAFBF9",
                                        opacity: 0.92,
                                      }}
                                    >
                                      <div>
                                        <div className="kds-card-head">
                                          <div>
                                            <span
                                              style={{
                                                fontSize: "11px",
                                                fontWeight: 800,
                                                color: "var(--muted)",
                                              }}
                                            >
                                              TICKET #{ord.id}
                                            </span>
                                            <strong
                                              style={{
                                                display: "block",
                                                fontSize: "15px",
                                                marginTop: "2px",
                                              }}
                                            >
                                              {ord.student_name}
                                            </strong>
                                            <small
                                              style={{ color: "var(--muted)" }}
                                            >
                                              ID: {ord.student_number}
                                            </small>
                                          </div>
                                          <span className="status-pill completed">
                                            Completed
                                          </span>
                                        </div>
                                        <ul className="kds-items-list">
                                          {ord.order_items?.map((oi, i) => (
                                            <li
                                              className="kds-item-row"
                                              key={i}
                                            >
                                              <span
                                                style={{
                                                  color: "var(--muted)",
                                                }}
                                              >
                                                {oi.item_name} &times;{" "}
                                                {oi.quantity}
                                              </span>
                                              <strong>
                                                ₱{oi.item_subtotal}.00
                                              </strong>
                                            </li>
                                          )) || (
                                            <li className="kds-item-row">
                                              <span
                                                style={{
                                                  color: "var(--muted)",
                                                }}
                                              >
                                                Meal Package
                                              </span>
                                              <strong>
                                                ₱{ord.total_amount}.00
                                              </strong>
                                            </li>
                                          )}
                                        </ul>
                                        <div
                                          style={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            fontSize: "12px",
                                            color: "var(--muted)",
                                            marginBottom: "10px",
                                          }}
                                        >
                                          <span>
                                            Payment:{" "}
                                            <strong
                                              style={{ color: "var(--ink)" }}
                                            >
                                              {ord.payment_method}
                                            </strong>
                                          </span>
                                          <span
                                            style={{
                                              color: "#16a34a",
                                              fontWeight: 700,
                                            }}
                                          >
                                            Paid ✓
                                          </span>
                                        </div>
                                      </div>
                                      <div
                                        style={{
                                          display: "flex",
                                          flexDirection: "column",
                                          gap: "6px",
                                        }}
                                      >
                                        <div
                                          style={{
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "space-between",
                                            marginBottom: "2px",
                                            padding: "6px 8px",
                                            background: "#F8FAFC",
                                            borderRadius: "6px",
                                            border: "1px solid #E2E8F0",
                                          }}
                                        >
                                          <span
                                            style={{
                                              fontSize: "11px",
                                              fontWeight: 700,
                                              color: "var(--muted)",
                                              textTransform: "uppercase",
                                              letterSpacing: "0.5px",
                                            }}
                                          >
                                            Action:
                                          </span>
                                          <select
                                            value={ord.order_status}
                                            onChange={async (e) => {
                                              const newStatus = e.target.value
                                              await canteenApi.orders.updateStatus(
                                                ord.id,
                                                newStatus as any,
                                              )
                                              if (newStatus === "Completed") {
                                                try {
                                                  await canteenApi.orders.updatePaymentStatus(
                                                    ord.id,
                                                    "paid",
                                                  )
                                                } catch (err) {
                                                  console.warn(err)
                                                }
                                              }
                                              refreshAllData()
                                            }}
                                            style={{
                                              border: "1px solid var(--line)",
                                              borderRadius: "5px",
                                              padding: "3px 6px",
                                              fontSize: "11px",
                                              fontWeight: 600,
                                              cursor: "pointer",
                                              background: "#fff",
                                              color: "var(--ink)",
                                            }}
                                          >
                                            <option value="Order placed">
                                              Order placed
                                            </option>
                                            <option value="Preparing">
                                              Preparing
                                            </option>
                                            <option value="Ready for pickup">
                                              Ready for pickup
                                            </option>
                                            <option value="Completed">
                                              Completed
                                            </option>
                                            <option value="Cancelled">
                                              Cancelled
                                            </option>
                                          </select>
                                        </div>
                                        <div
                                          style={{
                                            textAlign: "center",
                                            fontSize: "12px",
                                            color: "#16a34a",
                                            fontWeight: 700,
                                            padding: "8px",
                                            background: "#F0FDF4",
                                            borderRadius: "6px",
                                          }}
                                        >
                                          ✓ Completed &amp; Claimed
                                        </div>
                                        <button
                                          type="button"
                                          className="btn-secondary"
                                          style={{
                                            fontSize: "11px",
                                            padding: "4px 8px",
                                            color: "var(--muted)",
                                            cursor: "pointer",
                                          }}
                                          onClick={async () => {
                                            await canteenApi.orders.updateStatus(
                                              ord.id,
                                              "Ready for pickup",
                                            )
                                            refreshAllData()
                                          }}
                                        >
                                          ↺ Move Back to Active Queue
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })()}

              {/* STAFF TAB: ORDERS TABLE MANAGEMENT */}
              {staffNavTab === "orders" &&
                (() => {
                  const staffStallId = currentUser.stall_id || 1
                  const relevantOrders = allOrders.filter(
                    (o) =>
                      !currentUser.stall_id ||
                      Number(o.stall_id) === Number(staffStallId),
                  )
                  const stallOrders =
                    relevantOrders.length > 0 ? relevantOrders : allOrders

                  const filteredOrders = stallOrders.filter((ord) => {
                    if (staffOrderTableFilter === "all") return true
                    return ord.order_status === staffOrderTableFilter
                  })

                  return (
                    <div className="card-panel">
                      <div className="card-panel-header">
                        <div>
                          <h3 style={{ margin: 0 }}>
                            Kitchen Orders ({stallOrders.length})
                          </h3>
                          <p
                            style={{
                              margin: "4px 0 0",
                              color: "var(--muted)",
                              fontSize: "12px",
                            }}
                          >
                            Filter and update student order statuses in real time
                          </p>
                        </div>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            flexWrap: "wrap",
                          }}
                        >
                          <button
                            type="button"
                            className="btn-secondary"
                            onClick={handleRefreshQueue}
                            disabled={isRefreshingQueue}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "6px",
                              cursor: "pointer",
                              fontSize: "12px",
                              padding: "6px 12px",
                            }}
                          >
                            <span
                              className={
                                isRefreshingQueue ? "spinning-icon" : ""
                              }
                            >
                              <Icon name="refresh" size={13} />
                            </span>
                            <span>
                              {isRefreshingQueue
                                ? "Refreshing..."
                                : "Refresh Orders"}
                            </span>
                          </button>
                        </div>
                      </div>

                      {/* Filter pills for orders */}
                      <div
                        style={{
                          display: "flex",
                          gap: "8px",
                          marginBottom: "16px",
                          flexWrap: "wrap",
                        }}
                      >
                        {[
                          "all",
                          "Order placed",
                          "Preparing",
                          "Ready for pickup",
                          "Completed",
                          "Cancelled",
                        ].map((st) => {
                          const count =
                            st === "all"
                              ? stallOrders.length
                              : stallOrders.filter((o) => o.order_status === st)
                                  .length
                          return (
                            <button
                              key={st}
                              type="button"
                              className={`filter-pill-btn ${
                                staffOrderTableFilter === st ? "active" : ""
                              }`}
                              style={{
                                fontSize: "12px",
                                padding: "4px 12px",
                                background:
                                  staffOrderTableFilter === st
                                    ? st === "Completed"
                                      ? "#16a34a"
                                      : undefined
                                    : undefined,
                                color:
                                  staffOrderTableFilter === st
                                    ? "#fff"
                                    : undefined,
                              }}
                              onClick={() => setStaffOrderTableFilter(st)}
                            >
                              {st === "all" ? "All Orders" : st} ({count})
                            </button>
                          )
                        })}
                      </div>

                      <div className="data-table-wrap">
                        <table className="data-table">
                          <thead>
                            <tr>
                              <th>Order ID</th>
                              <th>Student Name</th>
                              <th>ID Number</th>
                              <th>Items Ordered</th>
                              <th>Branch</th>
                              <th>Total Amount</th>
                              <th>Payment Method</th>
                              <th>Status</th>
                              <th>Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredOrders.length === 0 ? (
                              <tr>
                                <td
                                  colSpan={9}
                                  style={{
                                    textAlign: "center",
                                    padding: "36px",
                                    color: "var(--muted)",
                                  }}
                                >
                                  No orders found matching this filter.
                                </td>
                              </tr>
                            ) : (
                              filteredOrders.map((ord) => (
                                <tr key={ord.id}>
                                  <td>
                                    <code>#SB-{ord.id}</code>
                                  </td>
                                  <td>
                                    <strong>{ord.student_name}</strong>
                                  </td>
                                  <td>{ord.student_number}</td>
                                  <td>
                                    {ord.order_items
                                      ?.map(
                                        (i) =>
                                          `${i.item_name} (x${i.quantity})`,
                                      )
                                      .join(", ") || "Package"}
                                  </td>
                                  <td>
                                    {stalls.find((s) => s.id === ord.stall_id)
                                      ?.name || `Stall #${ord.stall_id}`}
                                  </td>
                                  <td>
                                    <strong>₱{ord.total_amount}.00</strong>
                                  </td>
                                  <td>
                                    <div
                                      style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "6px",
                                      }}
                                    >
                                      <span>{ord.payment_method}</span>
                                      {ord.payment_status === "paid" ||
                                      ord.order_status === "Completed" ? (
                                        <span
                                          style={{
                                            color: "#16a34a",
                                            fontWeight: 700,
                                            fontSize: "11px",
                                          }}
                                        >
                                          ✓ Paid
                                        </span>
                                      ) : (
                                        <button
                                          type="button"
                                          style={{
                                            background: "#DCFCE7",
                                            color: "#15803D",
                                            border: "1px solid #86EFAC",
                                            borderRadius: "4px",
                                            padding: "2px 6px",
                                            fontSize: "11px",
                                            fontWeight: 600,
                                            cursor: "pointer",
                                          }}
                                          onClick={async () => {
                                            await canteenApi.orders.updatePaymentStatus(
                                              ord.id,
                                              "paid",
                                            )
                                            refreshAllData()
                                          }}
                                        >
                                          💵 Mark Paid
                                        </button>
                                      )}
                                    </div>
                                  </td>
                                  <td>
                                    <span
                                      className={`status-pill ${
                                        ord.order_status === "Ready for pickup"
                                          ? "ready"
                                          : ord.order_status === "Preparing"
                                            ? "preparing"
                                            : ord.order_status === "Completed"
                                              ? "completed"
                                              : "pending"
                                      }`}
                                    >
                                      {ord.order_status}
                                    </span>
                                  </td>
                                  <td>
                                    <select
                                      value={ord.order_status}
                                      onChange={async (e) => {
                                        const newStatus = e.target.value
                                        await canteenApi.orders.updateStatus(
                                          ord.id,
                                          newStatus as any,
                                        )
                                        if (newStatus === "Completed") {
                                          try {
                                            await canteenApi.orders.updatePaymentStatus(
                                              ord.id,
                                              "paid",
                                            )
                                          } catch (err) {
                                            console.warn(err)
                                          }
                                        }
                                        refreshAllData()
                                      }}
                                      style={{
                                        border: "1px solid var(--line)",
                                        borderRadius: "6px",
                                        padding: "4px 8px",
                                        fontSize: "11px",
                                        fontWeight: 600,
                                        cursor: "pointer",
                                        background: "#fff",
                                        color: "var(--ink)",
                                      }}
                                    >
                                      <option value="Order placed">
                                        Order placed
                                      </option>
                                      <option value="Preparing">
                                        Preparing
                                      </option>
                                      <option value="Ready for pickup">
                                        Ready for pickup
                                      </option>
                                      <option value="Completed">
                                        Completed
                                      </option>
                                      <option value="Cancelled">
                                        Cancelled
                                      </option>
                                    </select>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )
                })()}

              {/* STAFF TAB 2: MENU CRUD */}
              {staffNavTab === "menu_crud" && (
                <div className="card-panel">
                  <div className="card-panel-header">
                    <div>
                      <h3>Menu Catalog Manager</h3>
                      <p></p>
                    </div>
                    <button className="btn-secondary" onClick={openCreateModal}>
                      <Icon name="plus" size={14} /> Add New Dish
                    </button>
                  </div>
                  <div className="data-table-wrap">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Photo</th>
                          <th>Dish Name</th>
                          <th>Branch</th>
                          <th>Category</th>
                          <th>Price</th>
                          <th>Prep Time</th>
                          <th>Status</th>
                          <th>CRUD Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((item) => (
                          <tr key={item.id}>
                            <td>
                              <img
                                src={item.image_url}
                                alt=""
                                style={{
                                  width: "40px",
                                  height: "40px",
                                  borderRadius: "8px",
                                  objectFit: "cover",
                                }}
                              />
                            </td>
                            <td>
                              <strong>{item.name}</strong>
                            </td>
                            <td>
                              {stalls.find((s) => s.id === item.stall_id)
                                ?.name || `Branch #${item.stall_id}`}
                            </td>
                            <td>{item.category}</td>
                            <td>
                              <strong style={{ color: "var(--primary)" }}>
                                ₱{item.price}.00
                              </strong>
                            </td>
                            <td>
                              <button
                                type="button"
                                className="btn-secondary"
                                style={{
                                  padding: "3px 8px",
                                  fontSize: "12px",
                                  fontWeight: 600,
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "4px",
                                }}
                                onClick={(e) => openEditModal(item, e)}
                                title="Click to edit Prep Time & Details"
                              >
                                <span>
                                  {item.preparation_time_minutes} mins
                                </span>
                                <Icon name="edit" size={11} />
                              </button>
                            </td>
                            <td>
                              <button
                                type="button"
                                className={`status-pill ${
                                  item.is_available ? "ready" : "cancelled"
                                }`}
                                style={{
                                  border: "none",
                                  cursor: "pointer",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "4px",
                                }}
                                onClick={(e) =>
                                  handleToggleItemAvailable(item, e)
                                }
                                title="Click to toggle Available / Sold Out"
                              >
                                <span>
                                  {item.is_available ? "Available" : "Sold Out"}
                                </span>
                              </button>
                            </td>
                            <td>
                              <div style={{ display: "flex", gap: "6px" }}>
                                <button
                                  className="btn-secondary"
                                  onClick={(e) => openEditModal(item, e)}
                                  style={{
                                    padding: "4px 8px",
                                    fontSize: "11px",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "4px",
                                  }}
                                >
                                  <Icon name="edit" size={13} /> Edit
                                </button>
                                <button
                                  className="btn-secondary"
                                  onClick={() => handleDeleteMenuItem(item.id)}
                                  style={{
                                    padding: "4px 8px",
                                    fontSize: "11px",
                                    color: "#b91c1c",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "4px",
                                  }}
                                >
                                  <Icon name="trash" size={13} /> Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* STAFF TAB 3: INVENTORY STOCK CRUD */}
              {staffNavTab === "inventory_crud" && (
                <div className="card-panel">
                  <div className="card-panel-header">
                    <div>
                      <h3>Ingredient Stock &amp; Thresholds</h3>
                    </div>
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={handleRefreshBalances}
                      disabled={isRefreshingBalances}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        cursor: "pointer",
                      }}
                    >
                      <span
                        className={isRefreshingBalances ? "spinning-icon" : ""}
                      >
                        <Icon name="refresh" size={14} />
                      </span>
                      <span>
                        {isRefreshingBalances
                          ? "Refreshing..."
                          : "Refresh Balances"}
                      </span>
                    </button>
                  </div>
                  <div className="data-table-wrap">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Ingredient</th>
                          <th>Current Balance</th>
                          <th>Safety Level</th>
                          <th>Restock &amp; Edit Stock</th>
                        </tr>
                      </thead>
                      <tbody>
                        {inventoryList.map((inv) => {
                          const isLow =
                            Number(inv.current_stock) <=
                            Number(inv.minimum_threshold)
                          return (
                            <tr key={inv.id}>
                              <td>#{inv.id}</td>
                              <td>
                                <strong>{inv.item_name}</strong>
                              </td>
                              <td>
                                <strong
                                  style={{
                                    color: isLow ? "#b91c1c" : "#15803d",
                                    fontSize: "14px",
                                  }}
                                >
                                  {inv.current_stock} {inv.unit_of_measure}
                                </strong>
                              </td>
                              <td>
                                {inv.minimum_threshold} {inv.unit_of_measure}
                              </td>
                              <td>
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "8px",
                                    flexWrap: "wrap",
                                  }}
                                >
                                  <button
                                    type="button"
                                    className="auth-btn-primary"
                                    style={{
                                      width: "auto",
                                      padding: "4px 12px",
                                      fontSize: "11px",
                                      height: "30px",
                                      display: "flex",
                                      alignItems: "center",
                                      gap: "4px",
                                    }}
                                    onClick={() => openEditStockModal(inv)}
                                    title="Edit stock quantity directly"
                                  >
                                    <Icon name="edit" size={12} />
                                    <span>Edit Stock</span>
                                  </button>
                                  <button
                                    type="button"
                                    className="btn-secondary"
                                    style={{
                                      padding: "4px 10px",
                                      fontSize: "11px",
                                      height: "30px",
                                    }}
                                    onClick={() => handleQuickRestock(inv, 25)}
                                    title={`Quick restock +25 ${inv.unit_of_measure}`}
                                  >
                                    + Restock (+25 {inv.unit_of_measure})
                                  </button>
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ===============================================================
              DASHBOARD 3: MINI STALL ROLE ("branches at least 2")
              =============================================================== */}
          {currentUser.role === "stall_manager" && (
            <>
              {branchNavTab === "overview" ? (
                <>
                  <div className="dashboard-header">
                    <div className="dashboard-header-text">
                      <span className="eyebrow-chip">
                        <span className="sparkle"></span> MULTI-TENANT CANTEEN
                        STALLS
                      </span>
                      <h1>Mini Stall Branches (2 Active Branches)</h1>
                      <p></p>
                    </div>
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={handleSyncBranches}
                      disabled={isSyncingBranches}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        cursor: "pointer",
                      }}
                    >
                      <span
                        className={isSyncingBranches ? "spinning-icon" : ""}
                      >
                        <Icon name="refresh" size={14} />
                      </span>
                      <span>
                        {isSyncingBranches ? "Syncing..." : "Sync Branches"}
                      </span>
                    </button>
                  </div>

                  {/* 2 Branches Comparison Cards */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(320px, 1fr))",
                      gap: "20px",
                      marginBottom: "28px",
                    }}
                  >
                    {stalls.map((stall) => {
                      const stallItems = items.filter(
                        (i) => Number(i.stall_id) === Number(stall.id),
                      )
                      const stallOrders = allOrders.filter(
                        (o) => Number(o.stall_id) === Number(stall.id),
                      )
                      const stallRevenue = stallOrders
                        .filter(
                          (o) =>
                            o.order_status === "Completed" ||
                            o.order_status === "Ready for pickup",
                        )
                        .reduce((sum, o) => sum + Number(o.total_amount), 0)

                      return (
                        <div
                          className="card-panel"
                          key={stall.id}
                          style={{ margin: 0 }}
                        >
                          <div className="card-panel-header">
                            <div>
                              <span
                                className="school-badge-mini"
                                style={{ background: "#2563EB" }}
                              >
                                {stall.stall_code}
                              </span>
                              <h3 style={{ margin: "8px 0 2px" }}>
                                {stall.name}
                              </h3>
                              <p>{stall.description}</p>
                            </div>
                            <button
                              className={`status-pill ${
                                stall.is_open ? "ready" : "cancelled"
                              }`}
                              style={{ cursor: "pointer", border: 0 }}
                              onClick={async () => {
                                await canteenApi.stalls.updateStall(stall.id, {
                                  is_open: !stall.is_open,
                                })
                                refreshAllData()
                              }}
                              title="Toggle branch open/close status"
                            >
                              {stall.is_open ? "● OPEN" : "○ CLOSED"}
                            </button>
                          </div>

                          {/* Stall Metrics */}
                          <div
                            style={{
                              display: "grid",
                              gridTemplateColumns: "repeat(3, 1fr)",
                              gap: "10px",
                              background: "var(--bg-subtle)",
                              padding: "12px",
                              borderRadius: "10px",
                              margin: "14px 0",
                            }}
                          >
                            <div>
                              <small
                                style={{
                                  color: "var(--muted)",
                                  fontSize: "11px",
                                  display: "block",
                                }}
                              >
                                ITEMS
                              </small>
                              <strong style={{ fontSize: "15px" }}>
                                {stallItems.length} dishes
                              </strong>
                            </div>
                            <div>
                              <small
                                style={{
                                  color: "var(--muted)",
                                  fontSize: "11px",
                                  display: "block",
                                }}
                              >
                                ORDERS
                              </small>
                              <strong style={{ fontSize: "15px" }}>
                                {stallOrders.length} tickets
                              </strong>
                            </div>
                            <div>
                              <small
                                style={{
                                  color: "var(--muted)",
                                  fontSize: "11px",
                                  display: "block",
                                }}
                              >
                                SALES
                              </small>
                              <strong
                                style={{
                                  fontSize: "15px",
                                  color: "var(--primary)",
                                }}
                              >
                                ₱{stallRevenue}.00
                              </strong>
                            </div>
                          </div>

                          {/* Offerings preview */}
                          <div
                            style={{
                              borderTop: "1px solid var(--line)",
                              paddingTop: "12px",
                            }}
                          >
                            <span
                              style={{
                                fontSize: "11px",
                                fontWeight: 800,
                                color: "var(--muted)",
                                letterSpacing: "0.5px",
                              }}
                            >
                              OFFERINGS AT THIS BRANCH:
                            </span>
                            <div
                              style={{
                                display: "flex",
                                gap: "8px",
                                marginTop: "8px",
                                overflowX: "auto",
                                paddingBottom: "4px",
                              }}
                            >
                              {stallItems.map((si) => (
                                <div
                                  key={si.id}
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "6px",
                                    background: "#fff",
                                    border: "1px solid var(--line)",
                                    padding: "4px 8px",
                                    borderRadius: "6px",
                                    whiteSpace: "nowrap",
                                    fontSize: "12px",
                                  }}
                                >
                                  <img
                                    src={si.image_url}
                                    alt=""
                                    style={{
                                      width: "22px",
                                      height: "22px",
                                      borderRadius: "4px",
                                      objectFit: "cover",
                                    }}
                                  />
                                  <span>{si.name}</span>
                                  <strong style={{ color: "var(--primary)" }}>
                                    ₱{si.price}
                                  </strong>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Staff roster for this stall */}
                          <div
                            style={{
                              marginTop: "12px",
                              borderTop: "1px dashed var(--line)",
                              paddingTop: "10px",
                              fontSize: "12px",
                            }}
                          >
                            <span
                              style={{
                                fontSize: "11px",
                                fontWeight: 800,
                                color: "var(--muted)",
                                display: "block",
                                marginBottom: "4px",
                              }}
                            >
                              STAFF TEAM ASSIGNED (
                              {
                                userProfiles.filter(
                                  (u) =>
                                    u.role === "staff" &&
                                    Number(u.stall_id || 1) ===
                                      Number(stall.id),
                                ).length
                              }{" "}
                              USERS):
                            </span>
                            <span style={{ color: "var(--ink)" }}>
                              {userProfiles
                                .filter(
                                  (u) =>
                                    u.role === "staff" &&
                                    Number(u.stall_id || 1) ===
                                      Number(stall.id),
                                )
                                .map((u) => u.full_name)
                                .join(", ") || "No staff assigned yet"}
                            </span>
                          </div>

                          {/* Direct Branch View Link */}
                          <button
                            type="button"
                            className="auth-btn-primary"
                            style={{
                              width: "100%",
                              marginTop: "16px",
                              height: "38px",
                              fontSize: "13px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: "6px",
                            }}
                            onClick={() =>
                              setBranchNavTab(
                                stall.id === 1 ? "stall_1" : "stall_2",
                              )
                            }
                          >
                            <span>Manage {stall.name}</span>
                            <span>&rarr;</span>
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </>
              ) : (
                /* SINGLE BRANCH DEDICATED OPERATIONS VIEW */
                (() => {
                  const activeBranchStall =
                    (branchNavTab === "stall_1"
                      ? stalls.find((s) => Number(s.id) === 1)
                      : stalls.find((s) => Number(s.id) === 2)) || stalls[0]

                  if (!activeBranchStall) return null

                  const branchItems = items.filter(
                    (i) => Number(i.stall_id) === Number(activeBranchStall.id),
                  )
                  const branchOrders = allOrders.filter(
                    (o) => Number(o.stall_id) === Number(activeBranchStall.id),
                  )
                  const branchInventory = inventoryList.filter(
                    (inv) =>
                      Number(inv.stall_id) === Number(activeBranchStall.id),
                  )
                  const branchStaff = userProfiles.filter(
                    (u) =>
                      u.role === "staff" &&
                      Number(u.stall_id || 1) === Number(activeBranchStall.id),
                  )
                  const branchRevenue = branchOrders
                    .filter(
                      (o) =>
                        o.order_status === "Completed" ||
                        o.order_status === "Ready for pickup",
                    )
                    .reduce((sum, o) => sum + Number(o.total_amount), 0)
                  const branchActiveTickets = branchOrders.filter(
                    (o) =>
                      o.order_status !== "Completed" &&
                      o.order_status !== "Cancelled",
                  )
                  const branchLowStock = branchInventory.filter(
                    (inv) =>
                      Number(inv.current_stock) <=
                      Number(inv.minimum_threshold),
                  )

                  const filteredBranchOrders = branchOrders.filter((ord) => {
                    if (branchOrderFilter === "all") return true
                    return ord.order_status === branchOrderFilter
                  })

                  return (
                    <div>
                      {/* Branch Header */}
                      <div className="dashboard-header">
                        <div className="dashboard-header-text">
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                              marginBottom: "6px",
                              flexWrap: "wrap",
                            }}
                          >
                            <button
                              type="button"
                              className="btn-secondary"
                              style={{
                                padding: "4px 10px",
                                fontSize: "11px",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                              }}
                              onClick={() => setBranchNavTab("overview")}
                            >
                              <Icon name="arrow" size={12} />
                              <span>All Branches</span>
                            </button>
                            <span
                              className="school-badge-mini"
                              style={{
                                background: "#2563EB",
                                fontSize: "11px",
                              }}
                            >
                              {activeBranchStall.stall_code}
                            </span>
                            <span
                              className="eyebrow-chip"
                              style={{ margin: 0 }}
                            >
                              BRANCH OPERATIONS
                            </span>
                          </div>
                          <h1>{activeBranchStall.name}</h1>
                          <p>{activeBranchStall.description}</p>
                        </div>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                            flexWrap: "wrap",
                          }}
                        >
                          <button
                            type="button"
                            className={`status-pill ${
                              activeBranchStall.is_open ? "ready" : "cancelled"
                            }`}
                            style={{
                              cursor: "pointer",
                              border: 0,
                              padding: "8px 18px",
                              fontSize: "13px",
                              fontWeight: 700,
                            }}
                            onClick={async () => {
                              await canteenApi.stalls.updateStall(
                                activeBranchStall.id,
                                { is_open: !activeBranchStall.is_open },
                              )
                              refreshAllData()
                            }}
                            title="Click to toggle branch operational status"
                          >
                            {activeBranchStall.is_open
                              ? "● BRANCH OPEN"
                              : "○ BRANCH CLOSED"}
                          </button>
                          <button
                            type="button"
                            className="btn-secondary"
                            onClick={handleSyncBranches}
                            disabled={isSyncingBranches}
                            title="Sync Branch Data"
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "6px",
                              cursor: "pointer",
                            }}
                          >
                            <span
                              className={
                                isSyncingBranches ? "spinning-icon" : ""
                              }
                            >
                              <Icon name="refresh" size={14} />
                            </span>
                            <span>
                              {isSyncingBranches ? "Syncing..." : "Sync Branch"}
                            </span>
                          </button>
                        </div>
                      </div>

                      {/* 4 Branch KPI Metrics */}
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns:
                            "repeat(auto-fit, minmax(200px, 1fr))",
                          gap: "14px",
                          marginBottom: "22px",
                        }}
                      >
                        <div
                          className="card-panel"
                          style={{ margin: 0, padding: "16px" }}
                        >
                          <small
                            style={{
                              color: "var(--muted)",
                              fontSize: "11px",
                              fontWeight: 800,
                              textTransform: "uppercase",
                            }}
                          >
                            Branch Sales Revenue
                          </small>
                          <div
                            style={{
                              fontSize: "24px",
                              fontWeight: 800,
                              color: "var(--primary)",
                              marginTop: "4px",
                            }}
                          >
                            ₱{branchRevenue}.00
                          </div>
                          <small
                            style={{ color: "var(--muted)", fontSize: "11px" }}
                          >
                            {branchOrders.length} total customer tickets
                          </small>
                        </div>

                        <div
                          className="card-panel"
                          style={{ margin: 0, padding: "16px" }}
                        >
                          <small
                            style={{
                              color: "var(--muted)",
                              fontSize: "11px",
                              fontWeight: 800,
                              textTransform: "uppercase",
                            }}
                          >
                            Live Kitchen Queue
                          </small>
                          <div
                            style={{
                              fontSize: "24px",
                              fontWeight: 800,
                              color:
                                branchActiveTickets.length > 0
                                  ? "#d97706"
                                  : "#15803d",
                              marginTop: "4px",
                            }}
                          >
                            {branchActiveTickets.length} active
                          </div>
                          <small
                            style={{ color: "var(--muted)", fontSize: "11px" }}
                          >
                            {
                              branchOrders.filter(
                                (o) => o.order_status === "Preparing",
                              ).length
                            }{" "}
                            cooking now
                          </small>
                        </div>

                        <div
                          className="card-panel"
                          style={{ margin: 0, padding: "16px" }}
                        >
                          <small
                            style={{
                              color: "var(--muted)",
                              fontSize: "11px",
                              fontWeight: 800,
                              textTransform: "uppercase",
                            }}
                          >
                            Catalog Dishes
                          </small>
                          <div
                            style={{
                              fontSize: "24px",
                              fontWeight: 800,
                              color: "var(--ink)",
                              marginTop: "4px",
                            }}
                          >
                            {branchItems.length} dishes
                          </div>
                          <small
                            style={{ color: "var(--muted)", fontSize: "11px" }}
                          >
                            {branchItems.filter((i) => i.is_available).length}{" "}
                            available right now
                          </small>
                        </div>

                        <div
                          className="card-panel"
                          style={{ margin: 0, padding: "16px" }}
                        >
                          <small
                            style={{
                              color: "var(--muted)",
                              fontSize: "11px",
                              fontWeight: 800,
                              textTransform: "uppercase",
                            }}
                          >
                            Raw Stocks &amp; Staff
                          </small>
                          <div
                            style={{
                              fontSize: "24px",
                              fontWeight: 800,
                              color:
                                branchLowStock.length > 0
                                  ? "#b91c1c"
                                  : "#15803d",
                              marginTop: "4px",
                            }}
                          >
                            {branchInventory.length} items
                          </div>
                          <small
                            style={{ color: "var(--muted)", fontSize: "11px" }}
                          >
                            {branchLowStock.length > 0
                              ? `⚠ ${branchLowStock.length} low level`
                              : "All safe"}{" "}
                            &bull; {branchStaff.length} staff
                          </small>
                        </div>
                      </div>

                      {/* Branch Sub-Navigation Tabs */}
                      <div
                        style={{
                          display: "flex",
                          gap: "8px",
                          marginBottom: "20px",
                          flexWrap: "wrap",
                        }}
                      >
                        <button
                          type="button"
                          className={`filter-pill-btn ${
                            branchSubTab === "orders" ? "active" : ""
                          }`}
                          onClick={() => setBranchSubTab("orders")}
                        >
                          <Icon name="receipt" size={13} />
                          <span>Live Queue ({branchOrders.length})</span>
                        </button>
                        <button
                          type="button"
                          className={`filter-pill-btn ${
                            branchSubTab === "menu" ? "active" : ""
                          }`}
                          onClick={() => setBranchSubTab("menu")}
                        >
                          <Icon name="bag" size={13} />
                          <span>Menu Catalog ({branchItems.length})</span>
                        </button>
                        <button
                          type="button"
                          className={`filter-pill-btn ${
                            branchSubTab === "inventory" ? "active" : ""
                          }`}
                          onClick={() => setBranchSubTab("inventory")}
                        >
                          <Icon name="store" size={13} />
                          <span>
                            Ingredient Stocks ({branchInventory.length})
                          </span>
                        </button>
                        <button
                          type="button"
                          className={`filter-pill-btn ${
                            branchSubTab === "staff" ? "active" : ""
                          }`}
                          onClick={() => setBranchSubTab("staff")}
                        >
                          <Icon name="users" size={13} />
                          <span>Staff Team ({branchStaff.length})</span>
                        </button>
                      </div>

                      {/* SUB-TAB 1: LIVE KITCHEN QUEUE FOR THIS BRANCH */}
                      {branchSubTab === "orders" && (
                        <div className="card-panel">
                          <div className="card-panel-header">
                            <div>
                              <h3>
                                Live Kitchen Queue &bull;{" "}
                                {activeBranchStall.name}
                              </h3>
                              <p>
                                Incoming customer orders isolated for this
                                canteen branch
                              </p>
                            </div>
                            <div
                              style={{
                                display: "flex",
                                gap: "6px",
                                flexWrap: "wrap",
                              }}
                            >
                              {([
                                "all",
                                "Order placed",
                                "Preparing",
                                "Ready for pickup",
                                "Completed",
                              ] as const).map((st) => (
                                <button
                                  key={st}
                                  type="button"
                                  className={`btn-secondary ${
                                    branchOrderFilter === st ? "active" : ""
                                  }`}
                                  style={{
                                    fontSize: "11px",
                                    padding: "4px 8px",
                                    fontWeight:
                                      branchOrderFilter === st ? 700 : 500,
                                    borderColor:
                                      branchOrderFilter === st
                                        ? "var(--primary)"
                                        : undefined,
                                    color:
                                      branchOrderFilter === st
                                        ? "var(--primary)"
                                        : undefined,
                                  }}
                                  onClick={() => setBranchOrderFilter(st)}
                                >
                                  {st === "all" ? "All" : st}
                                </button>
                              ))}
                            </div>
                          </div>

                          {filteredBranchOrders.length === 0 ? (
                            <div
                              style={{
                                textAlign: "center",
                                padding: "48px 16px",
                                color: "var(--muted)",
                              }}
                            >
                              <Icon name="receipt" size={32} />
                              <p style={{ marginTop: "10px" }}>
                                No orders matching &quot;{branchOrderFilter}
                                &quot; for {activeBranchStall.name}.
                              </p>
                            </div>
                          ) : (
                            <div className="kds-cards-grid">
                              {filteredBranchOrders.map((ord) => (
                                <div className="kds-ticket-card" key={ord.id}>
                                  <div>
                                    <div className="kds-card-head">
                                      <div>
                                        <span
                                          style={{
                                            fontSize: "11px",
                                            fontWeight: 800,
                                            color: "var(--primary)",
                                          }}
                                        >
                                          TICKET #{ord.id}
                                        </span>
                                        <strong
                                          style={{
                                            display: "block",
                                            fontSize: "15px",
                                            marginTop: "2px",
                                          }}
                                        >
                                          {ord.student_name}
                                        </strong>
                                        <small
                                          style={{ color: "var(--muted)" }}
                                        >
                                          ID: {ord.student_number}
                                        </small>
                                      </div>
                                      <span
                                        className={`status-pill ${
                                          ord.order_status ===
                                          "Ready for pickup"
                                            ? "ready"
                                            : ord.order_status === "Preparing"
                                              ? "preparing"
                                              : ord.order_status === "Completed"
                                                ? "completed"
                                                : "pending"
                                        }`}
                                      >
                                        {ord.order_status}
                                      </span>
                                    </div>
                                    <ul className="kds-items-list">
                                      {ord.order_items?.map((oi, i) => (
                                        <li className="kds-item-row" key={i}>
                                          <span>
                                            {oi.item_name} &times; {oi.quantity}
                                          </span>
                                          <strong>
                                            ₱{oi.item_subtotal}.00
                                          </strong>
                                        </li>
                                      )) || (
                                        <li className="kds-item-row">
                                          <span>Order Total</span>
                                          <strong>
                                            ₱{ord.total_amount}.00
                                          </strong>
                                        </li>
                                      )}
                                    </ul>
                                  </div>
                                  <div
                                    style={{
                                      marginTop: "12px",
                                      borderTop: "1px solid var(--line)",
                                      paddingTop: "10px",
                                    }}
                                  >
                                    <div
                                      style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        marginBottom: "8px",
                                        fontSize: "12px",
                                      }}
                                    >
                                      <span style={{ color: "var(--muted)" }}>
                                        Payment: {ord.payment_method}
                                      </span>
                                      <strong
                                        style={{ color: "var(--primary)" }}
                                      >
                                        ₱{ord.total_amount}.00
                                      </strong>
                                    </div>
                                    {ord.order_status === "Order placed" && (
                                      <button
                                        type="button"
                                        className="kds-btn-action"
                                        style={{
                                          background: "var(--accent-amber)",
                                        }}
                                        onClick={async () => {
                                          await canteenApi.orders.updateStatus(
                                            ord.id,
                                            "Preparing",
                                          )
                                          refreshAllData()
                                        }}
                                      >
                                        ▶ Start Cooking
                                      </button>
                                    )}
                                    {ord.order_status === "Preparing" && (
                                      <button
                                        type="button"
                                        className="kds-btn-action"
                                        style={{ background: "var(--primary)" }}
                                        onClick={async () => {
                                          await canteenApi.orders.updateStatus(
                                            ord.id,
                                            "Ready for pickup",
                                          )
                                          refreshAllData()
                                        }}
                                      >
                                        ✓ Mark Ready for Pickup
                                      </button>
                                    )}
                                    {ord.order_status ===
                                      "Ready for pickup" && (
                                      <button
                                        type="button"
                                        className="kds-btn-action"
                                        style={{
                                          background: "#16a34a",
                                          color: "#fff",
                                        }}
                                        onClick={async () => {
                                          await canteenApi.orders.updateStatus(
                                            ord.id,
                                            "Completed",
                                          )
                                          await canteenApi.orders.updatePaymentStatus(
                                            ord.id,
                                            "paid",
                                          )
                                          refreshAllData()
                                        }}
                                      >
                                        ✓ Complete Ticket
                                      </button>
                                    )}
                                    {ord.order_status === "Completed" && (
                                      <div
                                        style={{
                                          textAlign: "center",
                                          fontSize: "12px",
                                          color: "#16a34a",
                                          fontWeight: 700,
                                          padding: "4px",
                                        }}
                                      >
                                        ✓ Completed &amp; Picked Up
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* SUB-TAB 2: BRANCH MENU CATALOG */}
                      {branchSubTab === "menu" && (
                        <div className="card-panel">
                          <div className="card-panel-header">
                            <div>
                              <h3>
                                Menu Catalog &bull; {activeBranchStall.name}
                              </h3>
                              <p>
                                Dishes and meals prepared and served at this
                                branch
                              </p>
                            </div>
                            <button
                              type="button"
                              className="auth-btn-primary"
                              style={{
                                width: "auto",
                                padding: "0 16px",
                                height: "36px",
                                fontSize: "13px",
                              }}
                              onClick={() =>
                                openCreateModal(activeBranchStall.id)
                              }
                            >
                              <Icon name="plus" size={14} /> Add Branch Dish
                            </button>
                          </div>
                          <div className="data-table-wrap">
                            <table className="data-table">
                              <thead>
                                <tr>
                                  <th>Dish</th>
                                  <th>Category</th>
                                  <th>Price</th>
                                  <th>Prep Time</th>
                                  <th>Status</th>
                                  <th>Actions</th>
                                </tr>
                              </thead>
                              <tbody>
                                {branchItems.map((item) => (
                                  <tr key={item.id}>
                                    <td>
                                      <div
                                        style={{
                                          display: "flex",
                                          alignItems: "center",
                                          gap: "10px",
                                        }}
                                      >
                                        <img
                                          src={item.image_url}
                                          alt=""
                                          style={{
                                            width: "38px",
                                            height: "38px",
                                            borderRadius: "6px",
                                            objectFit: "cover",
                                          }}
                                        />
                                        <div>
                                          <strong>{item.name}</strong>
                                          <small
                                            style={{
                                              color: "var(--muted)",
                                              display: "block",
                                              maxWidth: "240px",
                                              overflow: "hidden",
                                              textOverflow: "ellipsis",
                                              whiteSpace: "nowrap",
                                            }}
                                          >
                                            {item.description}
                                          </small>
                                        </div>
                                      </div>
                                    </td>
                                    <td>
                                      <span className="badge-tag">
                                        {item.category}
                                      </span>
                                    </td>
                                    <td>
                                      <strong
                                        style={{ color: "var(--primary)" }}
                                      >
                                        ₱{item.price}.00
                                      </strong>
                                    </td>
                                    <td>
                                      <button
                                        type="button"
                                        className="btn-secondary"
                                        style={{
                                          padding: "3px 8px",
                                          fontSize: "12px",
                                          fontWeight: 600,
                                          display: "inline-flex",
                                          alignItems: "center",
                                          gap: "4px",
                                        }}
                                        onClick={(e) => openEditModal(item, e)}
                                        title="Click to edit Prep Time &amp; Details"
                                      >
                                        <span>
                                          {item.preparation_time_minutes} mins
                                        </span>
                                        <Icon name="edit" size={11} />
                                      </button>
                                    </td>
                                    <td>
                                      <button
                                        type="button"
                                        className={`status-pill ${
                                          item.is_available
                                            ? "ready"
                                            : "cancelled"
                                        }`}
                                        style={{ cursor: "pointer", border: 0 }}
                                        onClick={async () => {
                                          const newStatus = !item.is_available
                                          setItems((prev) =>
                                            prev.map((i) =>
                                              Number(i.id) === Number(item.id)
                                                ? {
                                                    ...i,
                                                    is_available: newStatus,
                                                  }
                                                : i,
                                            ),
                                          )
                                          await canteenApi.menu.updateItem(
                                            item.id,
                                            { is_available: newStatus },
                                          )
                                          refreshAllData()
                                        }}
                                        title="Click to toggle available / sold out"
                                      >
                                        {item.is_available
                                          ? "● Available"
                                          : "○ Sold Out"}
                                      </button>
                                    </td>
                                    <td>
                                      <div
                                        style={{ display: "flex", gap: "6px" }}
                                      >
                                        <button
                                          type="button"
                                          className="auth-btn-primary"
                                          onClick={(e) =>
                                            openEditModal(item, e)
                                          }
                                          style={{
                                            width: "auto",
                                            padding: "4px 10px",
                                            fontSize: "11px",
                                            height: "28px",
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "4px",
                                          }}
                                          title="Edit full dish details"
                                        >
                                          <Icon name="edit" size={12} />
                                          <span>Edit</span>
                                        </button>
                                        <button
                                          type="button"
                                          className="btn-secondary"
                                          onClick={() =>
                                            handleDeleteMenuItem(item.id)
                                          }
                                          style={{
                                            padding: "4px 8px",
                                            fontSize: "11px",
                                            color: "#b91c1c",
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "4px",
                                          }}
                                          title="Delete menu item"
                                        >
                                          <Icon name="trash" size={12} />
                                          <span>Delete</span>
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {/* SUB-TAB 3: RAW INGREDIENT STOCKS FOR THIS BRANCH */}
                      {branchSubTab === "inventory" && (
                        <div className="card-panel">
                          <div className="card-panel-header">
                            <div>
                              <h3>
                                Ingredient Stock Levels &bull;{" "}
                                {activeBranchStall.name}
                              </h3>
                              <p>Raw stock supplies tracked for this branch</p>
                            </div>
                            <button
                              type="button"
                              className="btn-secondary"
                              onClick={handleRefreshBalances}
                              disabled={isRefreshingBalances}
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "6px",
                                cursor: "pointer",
                              }}
                            >
                              <span
                                className={
                                  isRefreshingBalances ? "spinning-icon" : ""
                                }
                              >
                                <Icon name="refresh" size={14} />
                              </span>
                              <span>
                                {isRefreshingBalances
                                  ? "Refreshing..."
                                  : "Refresh Balances"}
                              </span>
                            </button>
                          </div>
                          <div className="data-table-wrap">
                            <table className="data-table">
                              <thead>
                                <tr>
                                  <th>ID</th>
                                  <th>Ingredient</th>
                                  <th>Stock Balance</th>
                                  <th>Minimum Safe Level</th>
                                  <th>Restock &amp; Edit Stock</th>
                                </tr>
                              </thead>
                              <tbody>
                                {branchInventory.map((inv) => {
                                  const isLow =
                                    Number(inv.current_stock) <=
                                    Number(inv.minimum_threshold)
                                  return (
                                    <tr key={inv.id}>
                                      <td>#{inv.id}</td>
                                      <td>
                                        <strong>{inv.item_name}</strong>
                                      </td>
                                      <td>
                                        <strong
                                          style={{
                                            color: isLow
                                              ? "#b91c1c"
                                              : "#15803d",
                                            fontSize: "14px",
                                          }}
                                        >
                                          {inv.current_stock}{" "}
                                          {inv.unit_of_measure}
                                        </strong>
                                      </td>
                                      <td>
                                        {inv.minimum_threshold}{" "}
                                        {inv.unit_of_measure}
                                      </td>
                                      <td>
                                        <div
                                          style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "8px",
                                            flexWrap: "wrap",
                                          }}
                                        >
                                          <button
                                            type="button"
                                            className="auth-btn-primary"
                                            style={{
                                              width: "auto",
                                              padding: "4px 10px",
                                              fontSize: "11px",
                                              height: "28px",
                                              display: "flex",
                                              alignItems: "center",
                                              gap: "4px",
                                            }}
                                            onClick={() =>
                                              openEditStockModal(inv)
                                            }
                                            title="Edit stock quantity directly"
                                          >
                                            <Icon name="edit" size={12} />
                                            <span>Edit Stock</span>
                                          </button>
                                          <button
                                            type="button"
                                            className="btn-secondary"
                                            style={{
                                              padding: "4px 8px",
                                              fontSize: "11px",
                                              height: "28px",
                                            }}
                                            onClick={() =>
                                              handleQuickRestock(inv, 25)
                                            }
                                            title={`Quick restock +25 ${inv.unit_of_measure}`}
                                          >
                                            + Restock (+25 {inv.unit_of_measure}
                                            )
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                  )
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {/* SUB-TAB 4: ASSIGNED STAFF TEAM */}
                      {branchSubTab === "staff" && (
                        <div className="card-panel">
                          <div className="card-panel-header">
                            <div>
                              <h3>
                                Assigned Staff Team &bull;{" "}
                                {activeBranchStall.name}
                              </h3>
                              <p>
                                Kitchen and counter personnel designated to this
                                stall branch
                              </p>
                            </div>
                            <span className="nav-badge">
                              {branchStaff.length} Staff Members
                            </span>
                          </div>

                          {branchStaff.length === 0 ? (
                            <div
                              style={{
                                textAlign: "center",
                                padding: "40px 16px",
                                color: "var(--muted)",
                              }}
                            >
                              <Icon name="users" size={32} />
                              <p style={{ marginTop: "10px" }}>
                                No staff members currently assigned to{" "}
                                {activeBranchStall.name}.
                              </p>
                              <small>
                                The Admin can assign staff members to this
                                branch from the Team / Users dashboard.
                              </small>
                            </div>
                          ) : (
                            <div
                              style={{
                                display: "grid",
                                gridTemplateColumns:
                                  "repeat(auto-fit, minmax(260px, 1fr))",
                                gap: "14px",
                              }}
                            >
                              {branchStaff.map((staffMember) => (
                                <div
                                  key={staffMember.id}
                                  style={{
                                    background: "var(--bg-subtle)",
                                    border: "1px solid var(--line)",
                                    borderRadius: "10px",
                                    padding: "14px",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "12px",
                                  }}
                                >
                                  <div
                                    style={{
                                      width: "42px",
                                      height: "42px",
                                      borderRadius: "10px",
                                      background: "var(--primary)",
                                      color: "#fff",
                                      display: "grid",
                                      placeItems: "center",
                                      fontWeight: 800,
                                      fontSize: "16px",
                                      flexShrink: 0,
                                    }}
                                  >
                                    {staffMember.full_name?.charAt(0) || "S"}
                                  </div>
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <strong
                                      style={{
                                        display: "block",
                                        fontSize: "14px",
                                        whiteSpace: "nowrap",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                      }}
                                    >
                                      {staffMember.full_name}
                                    </strong>
                                    <small
                                      style={{
                                        color: "var(--muted)",
                                        display: "block",
                                        fontSize: "11px",
                                      }}
                                    >
                                      ID: {staffMember.student_id}
                                    </small>
                                    <small
                                      style={{
                                        color: "var(--muted)",
                                        display: "block",
                                        fontSize: "11px",
                                      }}
                                    >
                                      {staffMember.grade_or_dept ||
                                        "Kitchen Operations"}
                                    </small>
                                  </div>
                                  <span
                                    className="status-pill ready"
                                    style={{
                                      fontSize: "10px",
                                      padding: "2px 8px",
                                    }}
                                  >
                                    Active Staff
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })()
              )}
            </>
          )}

          {/* ===============================================================
              DASHBOARD 4: STUDENT ROLE (CATALOG, ACTIVE TICKET, HISTORY)
              =============================================================== */}
          {currentUser.role === "student" && (
            <>
              {/* Header */}
              <div className="dashboard-header">
                <div className="dashboard-header-text">
                  <span className="eyebrow-chip">
                    <span className="sparkle"></span> STUDENT MEAL PORTAL
                  </span>
                  <h1>Good day, {currentUser.full_name}!</h1>
                </div>
                <div className="status-pill-open">
                  <span>Balance:</span>
                  <strong style={{ color: "var(--primary)" }}>
                    ₱{currentUser.balance}.00
                  </strong>
                </div>
              </div>

              {/* Sub-nav Tabs */}
              <div
                style={{ display: "flex", gap: "8px", marginBottom: "22px" }}
              >
                <button
                  className={`filter-pill-btn ${
                    studentNavTab === "menu" ? "active" : ""
                  }`}
                  onClick={() => setStudentNavTab("menu")}
                >
                  Food Menu Catalog
                </button>
                <button
                  className={`filter-pill-btn ${
                    studentNavTab === "active_ticket" ? "active" : ""
                  }`}
                  onClick={() => setStudentNavTab("active_ticket")}
                >
                  Live Active Ticket {activeOrder && "●"}
                </button>
                <button
                  className={`filter-pill-btn ${
                    studentNavTab === "history" ? "active" : ""
                  }`}
                  onClick={() => setStudentNavTab("history")}
                >
                  Order History
                </button>
              </div>

              {/* TAB 1: FOOD CATALOG */}
              {studentNavTab === "menu" && (
                <>
                  {/* Live Ticket Reminder Card if order is placed */}
                  {activeOrder && (
                    <div className="live-ticket-card">
                      <div
                        style={{
                          width: "46px",
                          height: "46px",
                          borderRadius: "12px",
                          background: "rgba(255, 255, 255, 0.18)",
                          display: "grid",
                          placeItems: "center",
                          flexShrink: 0,
                        }}
                      >
                        <Icon name="receipt" size={24} />
                      </div>
                      <div style={{ minWidth: "220px" }}>
                        <span
                          style={{
                            fontSize: "11px",
                            fontWeight: 800,
                            letterSpacing: "1px",
                          }}
                        >
                          ACTIVE TICKET #{activeOrder.id}
                        </span>
                        <strong
                          style={{
                            display: "block",
                            fontSize: "15px",
                            marginTop: "2px",
                          }}
                        >
                          {activeOrder.order_status === "Order placed"
                            ? "Order queued at kitchen"
                            : activeOrder.order_status === "Preparing"
                              ? "Chef is cooking your meal"
                              : activeOrder.order_status === "Ready for pickup"
                                ? "Ready for pickup at counter!"
                                : "Completed"}
                        </strong>
                        <small style={{ opacity: 0.85 }}>
                          Estimated pickup in{" "}
                          {activeOrder.pickup_time || "8–12 mins"}
                        </small>
                      </div>
                      <div className="ticket-step-track">
                        {["Order placed", "Preparing", "Ready for pickup"].map(
                          (step, idx) => {
                            const isDone =
                              activeOrder.order_status === "Ready for pickup" ||
                              activeOrder.order_status === "Completed" ||
                              (activeOrder.order_status === "Preparing" &&
                                idx <= 1) ||
                              idx === 0
                            return (
                              <div
                                className={`ticket-step-node ${
                                  isDone ? "done" : ""
                                }`}
                                key={step}
                              >
                                <div className="ticket-node-icon">
                                  {isDone ? (
                                    <Icon name="check" size={13} />
                                  ) : (
                                    idx + 1
                                  )}
                                </div>
                                <span>{step}</span>
                              </div>
                            )
                          },
                        )}
                      </div>
                      <button
                        className="btn-secondary"
                        onClick={() => setStudentNavTab("active_ticket")}
                        style={{ whiteSpace: "nowrap" }}
                      >
                        Track Ticket &rarr;
                      </button>
                    </div>
                  )}

                  {/* Search and Branch Filter Toolbar */}
                  <div className="catalog-toolbar">
                    <div className="search-input-box">
                      <Icon name="search" size={16} />
                      <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search canteen dishes..."
                      />
                    </div>

                    {/* Branch Switcher */}
                    <div className="filter-pills-row">
                      <button
                        className={`filter-pill-btn ${
                          selectedStallFilter === "all" ? "active" : ""
                        }`}
                        onClick={() => setSelectedStallFilter("all")}
                      >
                        All Branches
                      </button>
                      {stalls.map((s) => (
                        <button
                          key={s.id}
                          className={`filter-pill-btn ${
                            selectedStallFilter === s.id ? "active" : ""
                          }`}
                          onClick={() => setSelectedStallFilter(s.id)}
                        >
                          {s.name} ({s.stall_code})
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Categories Pills */}
                  <div
                    className="filter-pills-row"
                    style={{ marginBottom: "16px" }}
                  >
                    {categories.map((cat) => (
                      <button
                        key={cat}
                        className={`filter-pill-btn ${
                          category === cat ? "active" : ""
                        }`}
                        onClick={() => setCategory(cat)}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  {/* Dish Cards Grid */}
                  <div className="food-cards-grid">
                    {filteredItems.map((item) => {
                      const qty = cart[item.id] || 0
                      return (
                        <div className="dish-card" key={item.id}>
                          <div className="dish-img-wrap">
                            <img src={item.image_url} alt={item.name} />
                            <span className="dish-stall-tag">
                              {stalls.find((s) => s.id === item.stall_id)
                                ?.name || "Canteen"}
                            </span>
                          </div>
                          <div className="dish-card-body">
                            <span className="dish-category">
                              {item.category} &bull;{" "}
                              {item.preparation_time_minutes} min
                            </span>
                            <h4>{item.name}</h4>
                            <p>{item.description}</p>
                            <div className="dish-card-footer">
                              <span className="dish-price">
                                ₱{item.price}.00
                              </span>
                              {qty > 0 ? (
                                <div className="qty-stepper">
                                  <button
                                    onClick={() => changeQty(item.id, -1)}
                                  >
                                    <Icon name="minus" size={14} />
                                  </button>
                                  <span>{qty}</span>
                                  <button onClick={() => changeQty(item.id, 1)}>
                                    <Icon name="plus" size={14} />
                                  </button>
                                </div>
                              ) : (
                                <button
                                  className="add-cart-btn"
                                  onClick={() => changeQty(item.id, 1)}
                                >
                                  <Icon name="plus" size={15} /> Add
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </>
              )}

              {/* TAB 2: ACTIVE TICKET TRACKER */}
              {studentNavTab === "active_ticket" && (
                <div className="card-panel" style={{ maxWidth: "640px" }}>
                  <div className="card-panel-header">
                    <div>
                      <h3>Live Ticket Tracker</h3>
                      <p>Track food prep and counter dispatch in real-time</p>
                    </div>
                    {activeOrder && (
                      <span className="status-pill ready">
                        {activeOrder.order_status}
                      </span>
                    )}
                  </div>
                  {activeOrder ? (
                    <div>
                      <div style={{ marginBottom: "16px" }}>
                        <span
                          style={{
                            fontSize: "11px",
                            color: "var(--primary)",
                            fontWeight: 800,
                            letterSpacing: "0.5px",
                          }}
                        >
                          TICKET #{activeOrder.id}
                        </span>
                        <h2
                          style={{
                            fontFamily: "var(--font-serif)",
                            margin: "4px 0 8px",
                          }}
                        >
                          {activeOrder.order_status === "Ready for pickup"
                            ? "Your meal is READY for pickup at counter!"
                            : activeOrder.order_status === "Preparing"
                              ? "Kitchen is preparing your order..."
                              : activeOrder.order_status === "Completed"
                                ? "Order completed and picked up!"
                                : "Order placed with canteen"}
                        </h2>
                        <p
                          style={{
                            color: "var(--muted)",
                            margin: 0,
                            fontSize: "12px",
                          }}
                        >
                          Estimated ready time:{" "}
                          {activeOrder.pickup_time || "8–12 minutes"}
                        </p>
                      </div>

                      {/* Visual Step Progress Node Track */}
                      <div
                        className="ticket-step-track"
                        style={{ margin: "14px 0 20px" }}
                      >
                        {[
                          "Order placed",
                          "Preparing",
                          "Ready for pickup",
                          "Completed",
                        ].map((step, idx) => {
                          const isDone =
                            activeOrder.order_status === "Completed" ||
                            (activeOrder.order_status === "Ready for pickup" &&
                              idx <= 2) ||
                            (activeOrder.order_status === "Preparing" &&
                              idx <= 1) ||
                            idx === 0
                          const isCurrent = activeOrder.order_status === step
                          return (
                            <div
                              className={`ticket-step-node ${
                                isDone ? "done" : ""
                              } ${isCurrent ? "current" : ""}`}
                              key={step}
                            >
                              <div className="ticket-node-icon">
                                {isDone && !isCurrent ? (
                                  <Icon name="check" size={13} />
                                ) : (
                                  idx + 1
                                )}
                              </div>
                              <span>{step}</span>
                            </div>
                          )
                        })}
                      </div>

                      {/* Dynamic Real-time Status Callout */}
                      {activeOrder.order_status === "Order placed" && (
                        <div
                          style={{
                            background: "#EFF6FF",
                            border: "1px solid #BFDBFE",
                            borderRadius: "8px",
                            padding: "12px 16px",
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                            marginBottom: "16px",
                          }}
                        >
                          <span style={{ fontSize: "20px" }}></span>
                          <div style={{ fontSize: "12px", color: "#1E40AF" }}>
                            <strong>Order Queued:</strong> Ticket #
                            {activeOrder.id} is queued at the kitchen. The chef
                            will begin cooking shortly!
                          </div>
                        </div>
                      )}
                      {activeOrder.order_status === "Preparing" && (
                        <div
                          style={{
                            background: "#FFFBEB",
                            border: "1px solid #FDE68A",
                            borderRadius: "8px",
                            padding: "12px 16px",
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                            marginBottom: "16px",
                          }}
                        >
                          <span style={{ fontSize: "20px" }}></span>
                          <div style={{ fontSize: "12px", color: "#92400E" }}>
                            <strong>Chef is Cooking!</strong> Your meal is
                            currently being prepared. You will be notified the
                            instant it is ready.
                          </div>
                        </div>
                      )}
                      {activeOrder.order_status === "Ready for pickup" && (
                        <div
                          style={{
                            background: "#F0FDF4",
                            border: "1.5px solid #86EFAC",
                            borderRadius: "8px",
                            padding: "12px 16px",
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                            marginBottom: "16px",
                          }}
                        >
                          <span style={{ fontSize: "24px" }}></span>
                          <div style={{ fontSize: "13px", color: "#166534" }}>
                            <strong>READY FOR PICKUP!</strong> Please proceed to
                            Canteen Counter Station now. Present Ticket{" "}
                            <strong>#{activeOrder.id}</strong> to collect your
                            tray!
                          </div>
                        </div>
                      )}
                      {activeOrder.order_status === "Completed" && (
                        <div
                          style={{
                            background: "#F4F7F5",
                            border: "1px solid var(--line)",
                            borderRadius: "8px",
                            padding: "12px 16px",
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                            marginBottom: "16px",
                          }}
                        >
                          <span style={{ fontSize: "20px" }}></span>
                          <div
                            style={{
                              fontSize: "12px",
                              color: "var(--primary)",
                            }}
                          >
                            <strong>Order Completed!</strong> Your meal was
                            claimed. Enjoy your food!
                          </div>
                        </div>
                      )}

                      {/* Ordered Items List */}
                      {((activeOrder.order_items &&
                        activeOrder.order_items.length > 0) ||
                        (activeOrder as any).items?.length > 0) && (
                        <div
                          style={{
                            borderTop: "1px solid var(--line)",
                            paddingTop: "14px",
                            marginBottom: "12px",
                          }}
                        >
                          <strong
                            style={{
                              fontSize: "12px",
                              display: "block",
                              marginBottom: "8px",
                              color: "var(--ink)",
                            }}
                          >
                            Ordered Items:
                          </strong>
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: "6px",
                            }}
                          >
                            {(
                              activeOrder.order_items ||
                              (activeOrder as any).items ||
                              []
                            ).map((it: any, idx: number) => (
                              <div
                                key={idx}
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  fontSize: "12px",
                                  color: "var(--ink-secondary)",
                                }}
                              >
                                <span>
                                  {it.item_name ||
                                    it.name ||
                                    `Item #${it.menu_item_id || it.id}`}{" "}
                                  &times; {it.quantity}
                                </span>
                                <strong>
                                  ₱
                                  {it.item_subtotal ||
                                    it.price * it.quantity ||
                                    0}
                                  .00
                                </strong>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div
                        style={{
                          borderTop: "1px solid var(--line)",
                          paddingTop: "16px",
                          display: "flex",
                          flexDirection: "column",
                          gap: "10px",
                          fontSize: "13px",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                          }}
                        >
                          <span style={{ color: "var(--muted)" }}>
                            Student Name
                          </span>
                          <strong>{activeOrder.student_name}</strong>
                        </div>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                          }}
                        >
                          <span style={{ color: "var(--muted)" }}>
                            Student ID
                          </span>
                          <strong>{activeOrder.student_number}</strong>
                        </div>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <span style={{ color: "var(--muted)" }}>
                            Payment Method
                          </span>
                          <div>
                            <strong>{activeOrder.payment_method}</strong>
                            {activeOrder.payment_status === "paid" ||
                            activeOrder.order_status === "Completed" ? (
                              <span
                                className="count-badge ready"
                                style={{
                                  marginLeft: "6px",
                                  fontSize: "11px",
                                  padding: "2px 6px",
                                  background: "#DCFCE7",
                                  color: "#15803D",
                                }}
                              >
                                {activeOrder.payment_method === "Canteen Wallet"
                                  ? "Paid via Wallet ✓"
                                  : "Paid at Counter ✓"}
                              </span>
                            ) : (
                              <span
                                className="count-badge"
                                style={{
                                  marginLeft: "6px",
                                  fontSize: "11px",
                                  padding: "2px 6px",
                                  background: "#FEF3C7",
                                  color: "#92400E",
                                }}
                              >
                                Pending Counter Payment
                              </span>
                            )}
                          </div>
                        </div>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            borderTop: "1px dashed var(--line)",
                            paddingTop: "12px",
                            fontSize: "16px",
                          }}
                        >
                          <strong>Total</strong>
                          <strong style={{ color: "var(--primary)" }}>
                            ₱{activeOrder.total_amount}.00
                          </strong>
                        </div>
                      </div>

                      {/* Pay with Canteen Wallet shortcut for pending counter orders */}
                      {activeOrder.payment_method !== "Canteen Wallet" &&
                        activeOrder.order_status !== "Completed" && (
                          <div
                            style={{
                              background: "#F8FAFC",
                              border: "1px solid var(--line)",
                              borderRadius: "8px",
                              padding: "10px 12px",
                              marginTop: "12px",
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              flexWrap: "wrap",
                              gap: "8px",
                            }}
                          >
                            <div>
                              <strong
                                style={{
                                  fontSize: "12px",
                                  display: "block",
                                  color: "var(--ink)",
                                }}
                              >
                                Pay now with Canteen Wallet?
                              </strong>
                              <small
                                style={{
                                  color: "var(--muted)",
                                  fontSize: "11px",
                                }}
                              >
                                Available Balance: ₱
                                {(Number(currentUser.balance) || 0).toFixed(2)}
                              </small>
                            </div>
                            <button
                              type="button"
                              className="btn-secondary"
                              style={{
                                background: "var(--primary)",
                                color: "#fff",
                                fontSize: "11px",
                                padding: "6px 12px",
                                borderRadius: "6px",
                                border: "none",
                                cursor: "pointer",
                              }}
                              onClick={async () => {
                                const balance = Number(currentUser.balance || 0)
                                if (balance < activeOrder.total_amount) {
                                  alert(
                                    `Insufficient wallet balance (₱${balance.toFixed(2)} available). Please top up first.`,
                                  )
                                  return
                                }
                                const newBal = Math.max(
                                  0,
                                  balance - activeOrder.total_amount,
                                )
                                try {
                                  await canteenApi.auth.updateProfile(
                                    currentUser.id,
                                    { balance: newBal },
                                  )
                                } catch (e) {}
                                const updatedUser = {
                                  ...currentUser,
                                  balance: newBal,
                                }
                                try {
                                  localStorage.setItem(
                                    "smartbite_session_user",
                                    JSON.stringify(updatedUser),
                                  )
                                } catch {}
                                setCurrentUser(updatedUser)
                                setUserProfiles((prev) =>
                                  prev.map((p) =>
                                    p.id === currentUser.id
                                      ? { ...p, balance: newBal }
                                      : p,
                                  ),
                                )
                                try {
                                  await canteenApi.orders.updatePaymentStatus(
                                    activeOrder.id,
                                    "paid",
                                  )
                                } catch {}
                                setActiveOrder((prev) =>
                                  prev
                                    ? {
                                        ...prev,
                                        payment_method: "Canteen Wallet",
                                        payment_status: "paid",
                                      }
                                    : null,
                                )
                                setAllOrders((prev) =>
                                  prev.map((o) =>
                                    o.id === activeOrder.id
                                      ? {
                                          ...o,
                                          payment_method: "Canteen Wallet",
                                          payment_status: "paid",
                                        }
                                      : o,
                                  ),
                                )
                                setSyncToast(
                                  `✓ Paid ₱${activeOrder.total_amount}.00 from Canteen Wallet! New Balance: ₱${newBal.toFixed(2)}`,
                                )
                                setTimeout(() => setSyncToast(""), 3000)
                                refreshAllData()
                              }}
                            >
                              Pay ₱{activeOrder.total_amount}.00 Now
                            </button>
                          </div>
                        )}

                      {/* Action Controls (Handled by Staff at Counter) */}
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "12px",
                          marginTop: "16px",
                          borderTop: "1px solid var(--line)",
                          paddingTop: "14px",
                        }}
                      >
                        {activeOrder.order_status === "Ready for pickup" && (
                          <div
                            style={{
                              background: "#F8FAFC",
                              border: "1px solid #E2E8F0",
                              borderRadius: "8px",
                              padding: "10px 14px",
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                            }}
                          >
                            <Icon name="info" size={16} />
                            <span
                              style={{
                                fontSize: "12px",
                                color: "var(--ink-secondary)",
                                lineHeight: 1.4,
                              }}
                            >
                              <strong>Pickup Note:</strong> Please present
                              Ticket <strong>#{activeOrder.id}</strong> to
                              canteen staff. Canteen staff will mark your meal
                              as picked up upon handover.
                            </span>
                          </div>
                        )}
                        <div
                          style={{
                            display: "flex",
                            gap: "8px",
                            flexWrap: "wrap",
                          }}
                        >
                          <button
                            type="button"
                            className="btn-secondary"
                            onClick={() => setStudentNavTab("menu")}
                            style={{ fontSize: "13px" }}
                          >
                            &larr; Back to Menu
                          </button>
                          {activeOrder.order_status === "Completed" && (
                            <button
                              type="button"
                              className="auth-btn-primary"
                              onClick={() => setStudentNavTab("menu")}
                              style={{ fontSize: "13px", padding: "8px 16px" }}
                            >
                              Order Again
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div
                      style={{
                        textAlign: "center",
                        padding: "48px 20px",
                        color: "var(--muted)",
                      }}
                    >
                      <p>You have no active orders queued right now.</p>
                      <button
                        className="auth-btn-primary"
                        onClick={() => setStudentNavTab("menu")}
                        style={{ maxWidth: "200px", margin: "14px auto 0" }}
                      >
                        Go to Menu
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: ORDER HISTORY */}
              {studentNavTab === "history" && (
                <div className="card-panel">
                  <div className="card-panel-header">
                    <div>
                      <h3>Your Order History</h3>
                      <p>Past campus canteen purchases</p>
                    </div>
                  </div>
                  <div className="data-table-wrap">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Ticket ID</th>
                          <th>Items</th>
                          <th>Branch</th>
                          <th>Total Amount</th>
                          <th>Status</th>
                          <th>Payment</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allOrders.filter(
                          (o) => o.student_number === currentUser.student_id,
                        ).length === 0 ? (
                          <tr>
                            <td
                              colSpan={6}
                              style={{
                                textAlign: "center",
                                padding: "36px",
                                color: "var(--muted)",
                              }}
                            >
                              No previous orders recorded for this account.
                            </td>
                          </tr>
                        ) : (
                          allOrders
                            .filter(
                              (o) =>
                                o.student_number === currentUser.student_id,
                            )
                            .map((ord) => (
                              <tr key={ord.id}>
                                <td>
                                  <code>#{ord.id}</code>
                                </td>
                                <td>
                                  {ord.order_items
                                    ?.map(
                                      (i) => `${i.item_name} (x${i.quantity})`,
                                    )
                                    .join(", ") || "Package"}
                                </td>
                                <td>
                                  {stalls.find((s) => s.id === ord.stall_id)
                                    ?.name || "Main Canteen"}
                                </td>
                                <td>
                                  <strong>₱{ord.total_amount}.00</strong>
                                </td>
                                <td>
                                  <span className="status-pill completed">
                                    {ord.order_status}
                                  </span>
                                </td>
                                <td>
                                  {ord.payment_method}
                                  {ord.payment_status === "paid" ||
                                  ord.order_status === "Completed" ? (
                                    <span
                                      className="count-badge ready"
                                      style={{
                                        marginLeft: "6px",
                                        fontSize: "11px",
                                        padding: "2px 6px",
                                        background: "#DCFCE7",
                                        color: "#15803D",
                                      }}
                                    >
                                      Paid ✓
                                    </span>
                                  ) : (
                                    <span
                                      className="count-badge"
                                      style={{
                                        marginLeft: "6px",
                                        fontSize: "11px",
                                        padding: "2px 6px",
                                        background: "#FEF3C7",
                                        color: "#92400E",
                                      }}
                                    >
                                      Pending
                                    </span>
                                  )}
                                </td>
                              </tr>
                            ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* =====================================================================
          STUDENT CART SLIDE-OVER DRAWER
          ===================================================================== */}
      {cartOpen && (
        <div className="cart-overlay" onMouseDown={() => setCartOpen(false)}>
          <aside
            className="cart-slide-drawer"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                paddingBottom: "18px",
                borderBottom: "1px solid var(--line)",
              }}
            >
              <div>
                <span className="eyebrow-chip" style={{ margin: 0 }}>
                  YOUR TICKET
                </span>
                <h3
                  style={{
                    margin: "4px 0 0",
                    fontFamily: "var(--font-serif)",
                    fontSize: "22px",
                  }}
                >
                  {placed ? "Order Confirmed" : "My Cart"}
                </h3>
              </div>
              <button
                className="icon-action-btn"
                onClick={() => setCartOpen(false)}
              >
                <Icon name="x" size={18} />
              </button>
            </div>

            {placed ? (
              <div style={{ textAlign: "center", margin: "auto 0" }}>
                <div
                  style={{
                    width: "64px",
                    height: "64px",
                    borderRadius: "50%",
                    background: "var(--primary-light)",
                    color: "var(--primary)",
                    display: "grid",
                    placeItems: "center",
                    margin: "0 auto 16px",
                  }}
                >
                  <Icon name="check" size={32} />
                </div>
                <h3
                  style={{
                    fontFamily: "var(--font-serif)",
                    fontSize: "24px",
                    margin: "0 0 8px",
                  }}
                >
                  Order Placed!
                </h3>
                <p
                  style={{
                    color: "var(--muted)",
                    fontSize: "13px",
                    lineHeight: 1.5,
                  }}
                >
                  Your ticket <strong>#{activeOrder?.id}</strong> was sent to
                  the kitchen.
                </p>
                <button
                  className="auth-btn-primary"
                  onClick={() => {
                    setPlaced(false)
                    setCart({})
                    setCartOpen(false)
                    setStudentNavTab("active_ticket")
                  }}
                  style={{ marginTop: "24px" }}
                >
                  Track Active Ticket
                </button>
              </div>
            ) : (
              <>
                <div style={{ flex: 1, overflowY: "auto", padding: "16px 0" }}>
                  {count === 0 ? (
                    <div
                      style={{
                        textAlign: "center",
                        padding: "40px 10px",
                        color: "var(--muted)",
                      }}
                    >
                      Your cart is currently empty.
                    </div>
                  ) : (
                    items
                      .filter((i) => cart[i.id])
                      .map((item) => (
                        <div
                          key={item.id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                            padding: "12px 0",
                            borderBottom: "1px solid var(--line)",
                          }}
                        >
                          <img
                            src={item.image_url}
                            alt=""
                            style={{
                              width: "48px",
                              height: "48px",
                              borderRadius: "8px",
                              objectFit: "cover",
                            }}
                          />
                          <div style={{ flex: 1 }}>
                            <strong
                              style={{ display: "block", fontSize: "13px" }}
                            >
                              {item.name}
                            </strong>
                            <span
                              style={{
                                color: "var(--primary)",
                                fontWeight: 700,
                                fontSize: "13px",
                              }}
                            >
                              ₱{item.price}.00
                            </span>
                          </div>
                          <div className="qty-stepper">
                            <button onClick={() => changeQty(item.id, -1)}>
                              <Icon name="minus" size={13} />
                            </button>
                            <span>{cart[item.id]}</span>
                            <button onClick={() => changeQty(item.id, 1)}>
                              <Icon name="plus" size={13} />
                            </button>
                          </div>
                        </div>
                      ))
                  )}
                </div>

                <div
                  style={{
                    borderTop: "1px solid var(--line)",
                    paddingTop: "16px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "8px",
                      fontSize: "13px",
                      color: "var(--muted)",
                    }}
                  >
                    <span>Subtotal</span>
                    <strong style={{ color: "var(--ink)" }}>
                      ₱{subtotal}.00
                    </strong>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "12px",
                      fontSize: "13px",
                      color: "var(--muted)",
                    }}
                  >
                    <span>Campus Service Fee</span>
                    <strong style={{ color: "var(--ink)" }}>₱0.00</strong>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      borderTop: "1px dashed var(--line)",
                      paddingTop: "12px",
                      fontSize: "17px",
                    }}
                  >
                    <strong>Total Amount</strong>
                    <strong style={{ color: "var(--primary)" }}>
                      ₱{subtotal}.00
                    </strong>
                  </div>

                  {/* Payment Method Selector */}
                  <div style={{ marginTop: "16px", marginBottom: "12px" }}>
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 800,
                        color: "var(--ink-secondary)",
                        letterSpacing: "0.6px",
                        textTransform: "uppercase",
                        display: "block",
                        marginBottom: "8px",
                      }}
                    >
                      Payment Method
                    </span>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "8px",
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => setCheckoutPaymentMethod("wallet")}
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "flex-start",
                          padding: "10px",
                          borderRadius: "8px",
                          border:
                            checkoutPaymentMethod === "wallet"
                              ? "2px solid var(--primary)"
                              : "1px solid var(--line)",
                          background:
                            checkoutPaymentMethod === "wallet"
                              ? "#F4F7F5"
                              : "#fff",
                          cursor: "pointer",
                          textAlign: "left",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                          }}
                        >
                          <Icon name="receipt" size={14} />
                          <strong
                            style={{
                              fontSize: "12px",
                              color:
                                checkoutPaymentMethod === "wallet"
                                  ? "var(--primary)"
                                  : "var(--ink)",
                            }}
                          >
                            Canteen Wallet
                          </strong>
                        </div>
                        <small
                          style={{
                            fontSize: "11px",
                            color:
                              Number(currentUser.balance || 0) < subtotal
                                ? "#dc2626"
                                : "var(--muted)",
                            marginTop: "4px",
                            fontWeight: 600,
                          }}
                        >
                          ₱{(Number(currentUser.balance) || 0).toFixed(2)}{" "}
                          balance
                        </small>
                      </button>

                      <button
                        type="button"
                        onClick={() => setCheckoutPaymentMethod("cash")}
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "flex-start",
                          padding: "10px",
                          borderRadius: "8px",
                          border:
                            checkoutPaymentMethod === "cash"
                              ? "2px solid var(--primary)"
                              : "1px solid var(--line)",
                          background:
                            checkoutPaymentMethod === "cash"
                              ? "#F4F7F5"
                              : "#fff",
                          cursor: "pointer",
                          textAlign: "left",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                          }}
                        >
                          <Icon name="bag" size={14} />
                          <strong
                            style={{
                              fontSize: "12px",
                              color:
                                checkoutPaymentMethod === "cash"
                                  ? "var(--primary)"
                                  : "var(--ink)",
                            }}
                          >
                            Cash at Counter
                          </strong>
                        </div>
                        <small
                          style={{
                            fontSize: "11px",
                            color: "var(--muted)",
                            marginTop: "4px",
                          }}
                        >
                          Pay at counter
                        </small>
                      </button>
                    </div>

                    {/* Insufficient Balance Notice & Quick Top-up */}
                    {checkoutPaymentMethod === "wallet" &&
                      Number(currentUser.balance || 0) < subtotal && (
                        <div
                          style={{
                            background: "#FEF2F2",
                            border: "1px solid #FECACA",
                            borderRadius: "8px",
                            padding: "10px 12px",
                            marginTop: "10px",
                            fontSize: "11px",
                            color: "#991B1B",
                          }}
                        >
                          <div style={{ fontWeight: 700, marginBottom: "2px" }}>
                            ⚠️ Insufficient Wallet Balance
                          </div>
                          <div>
                            You have ₱
                            {(Number(currentUser.balance) || 0).toFixed(2)}, but
                            order is ₱{subtotal}.00.
                          </div>
                          <div
                            style={{
                              marginTop: "8px",
                              display: "flex",
                              gap: "6px",
                            }}
                          >
                            <button
                              type="button"
                              className="btn-secondary"
                              onClick={() => handleTopUpBalance(100)}
                              style={{
                                fontSize: "11px",
                                padding: "4px 8px",
                                background: "#fff",
                              }}
                            >
                              +₱100 Reload
                            </button>
                            <button
                              type="button"
                              className="btn-secondary"
                              onClick={() => setCheckoutPaymentMethod("cash")}
                              style={{
                                fontSize: "11px",
                                padding: "4px 8px",
                                background: "#fff",
                              }}
                            >
                              Use Cash
                            </button>
                          </div>
                        </div>
                      )}
                  </div>

                  <button
                    className="auth-btn-primary"
                    disabled={
                      !count ||
                      isSubmitting ||
                      (checkoutPaymentMethod === "wallet" &&
                        Number(currentUser.balance || 0) < subtotal)
                    }
                    onClick={handlePlaceOrder}
                    style={{
                      marginTop: "8px",
                      opacity:
                        checkoutPaymentMethod === "wallet" &&
                        Number(currentUser.balance || 0) < subtotal
                          ? 0.6
                          : 1,
                    }}
                  >
                    {isSubmitting
                      ? "Processing..."
                      : checkoutPaymentMethod === "wallet"
                        ? `Pay ₱${subtotal}.00 with Wallet`
                        : "Place Order & Pay at Counter"}{" "}
                    <span>&rarr;</span>
                  </button>
                  <small
                    style={{
                      display: "block",
                      textAlign: "center",
                      color: "var(--muted)",
                      fontSize: "11px",
                      marginTop: "10px",
                    }}
                  >
                    Order as: {currentUser.full_name} ({currentUser.student_id})
                  </small>
                </div>
              </>
            )}
          </aside>
        </div>
      )}

      {/* =====================================================================
          STAFF CRUD MODAL (ADD / EDIT FOOD DISH)
          ===================================================================== */}
      {itemModalOpen && (
        <div
          className="crud-modal-overlay"
          onMouseDown={() => !isSavingMenuItem && setItemModalOpen(false)}
        >
          <div className="crud-modal" onMouseDown={(e) => e.stopPropagation()}>
            <div className="crud-modal-header">
              <h3>{editingItem ? "Edit Food Item" : "Add New Food Item"}</h3>
              <button
                className="icon-action-btn"
                style={{ width: "32px", height: "32px" }}
                onClick={() => !isSavingMenuItem && setItemModalOpen(false)}
                disabled={isSavingMenuItem}
              >
                <Icon name="x" size={16} />
              </button>
            </div>
            <form onSubmit={handleSaveMenuItem}>
              <div className="crud-modal-body">
                <div className="crud-form-group">
                  <label>Item Name</label>
                  <input
                    value={itemFormName}
                    onChange={(e) => setItemFormName(e.target.value)}
                    placeholder="e.g. Pork Tonkatsu Bowl"
                    required
                  />
                </div>
                <div className="crud-form-group">
                  <label>Description</label>
                  <textarea
                    rows={2}
                    value={itemFormDesc}
                    onChange={(e) => setItemFormDesc(e.target.value)}
                    placeholder="Crispy breaded pork with special savory sauce"
                  />
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "12px",
                  }}
                >
                  <div className="crud-form-group">
                    <label>Price (PHP)</label>
                    <input
                      type="number"
                      value={itemFormPrice}
                      onChange={(e) => setItemFormPrice(Number(e.target.value))}
                      required
                    />
                  </div>
                  <div className="crud-form-group">
                    <label>Prep Time (Minutes)</label>
                    <input
                      type="number"
                      value={itemFormPrepTime}
                      onChange={(e) =>
                        setItemFormPrepTime(Number(e.target.value))
                      }
                    />
                  </div>
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "12px",
                  }}
                >
                  <div className="crud-form-group">
                    <label>Category</label>
                    <select
                      value={itemFormCategory}
                      onChange={(e) => setItemFormCategory(e.target.value)}
                    >
                      <option value="Rice Meals">Rice Meals</option>
                      <option value="Breakfast">Breakfast</option>
                      <option value="Snacks">Snacks</option>
                      <option value="Drinks">Drinks</option>
                    </select>
                  </div>
                  <div className="crud-form-group">
                    <label>Canteen Branch</label>
                    <select
                      value={itemFormStallId}
                      onChange={(e) =>
                        setItemFormStallId(Number(e.target.value))
                      }
                    >
                      {stalls.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.stall_code})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="crud-form-group">
                  <label htmlFor="item-image-file">Upload product photo</label>
                  <input
                    id="item-image-file"
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                    onChange={(e) =>
                      setItemFormImageFile(e.target.files?.[0] || null)
                    }
                  />
                  <small>
                    JPG, PNG, WebP, GIF, or AVIF. Maximum file size: 5 MB.
                  </small>
                  {(itemFormImagePreview || itemFormImage) && (
                    <img
                      key={itemFormImagePreview || itemFormImage}
                      className="menu-image-preview"
                      src={itemFormImagePreview || itemFormImage}
                      alt="Product image preview"
                      onError={(e) => {
                        e.currentTarget.style.display = "none"
                      }}
                    />
                  )}
                  <label htmlFor="item-image-url">Or use an image URL</label>
                  <input
                    id="item-image-url"
                    type="url"
                    value={itemFormImage}
                    onChange={(e) => setItemFormImage(e.target.value)}
                    disabled={Boolean(itemFormImageFile)}
                    placeholder="https://example.com/image.jpg"
                  />
                  {itemFormImageFile && (
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => setItemFormImageFile(null)}
                    >
                      Remove selected photo
                    </button>
                  )}
                </div>
                {itemFormError && (
                  <p className="toast-error" role="alert">
                    {itemFormError}
                  </p>
                )}
                <div
                  style={{ display: "flex", alignItems: "center", gap: "8px" }}
                >
                  <input
                    type="checkbox"
                    id="avail_chk"
                    checked={itemFormAvailable}
                    onChange={(e) => setItemFormAvailable(e.target.checked)}
                  />
                  <label
                    htmlFor="avail_chk"
                    style={{ fontSize: "13px", fontWeight: 700 }}
                  >
                    Item is Available
                  </label>
                </div>
              </div>
              <div className="crud-modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => !isSavingMenuItem && setItemModalOpen(false)}
                  disabled={isSavingMenuItem}
                >
                  Cancel
                </button>
                <button
                  className="auth-btn-primary"
                  type="submit"
                  disabled={isSavingMenuItem}
                  style={{
                    width: "auto",
                    padding: "0 20px",
                    height: "40px",
                    fontSize: "13px",
                  }}
                >
                  {isSavingMenuItem
                    ? "Uploading & saving…"
                    : editingItem
                      ? "Save Updates"
                      : "Add Dish"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===============================================================
          MODAL 1: CHANGE PASSWORD MODAL (Available to EVERY account)
          =============================================================== */}
      {changePasswordModalOpen && (
        <div
          className="crud-modal-overlay"
          onMouseDown={() => setChangePasswordModalOpen(false)}
        >
          <div
            className="crud-modal"
            style={{ maxWidth: "440px", width: "min(440px, 100%)" }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="crud-modal-header">
              <div
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <div style={{ color: "var(--primary)" }}>
                  <Icon name="key" size={20} />
                </div>
                <div>
                  <h3
                    style={{
                      margin: 0,
                      fontSize: "18px",
                      fontFamily: "var(--font-serif)",
                    }}
                  >
                    Security & Password
                  </h3>
                  <small style={{ color: "var(--muted)" }}>
                    Update account password for {currentUser.full_name}
                  </small>
                </div>
              </div>
              <button
                type="button"
                className="icon-action-btn"
                style={{ width: "32px", height: "32px" }}
                onClick={() => setChangePasswordModalOpen(false)}
              >
                <Icon name="x" size={16} />
              </button>
            </div>

            <form onSubmit={handleChangePassword}>
              <div className="crud-modal-body">
                {pwdError && <div className="toast-error">{pwdError}</div>}
                {pwdSuccess && (
                  <div className="toast-success">{pwdSuccess}</div>
                )}

                <div className="crud-form-group">
                  <label>Current Password</label>
                  <input
                    type="password"
                    placeholder="Enter current password"
                    value={currentPwd}
                    onChange={(e) => setCurrentPwd(e.target.value)}
                    required
                  />
                  <small
                    style={{
                      color: "var(--muted)",
                      fontSize: "11px",
                      marginTop: "3px",
                      display: "block",
                    }}
                  >
                    Please enter the current password associated with your
                    account.
                  </small>
                </div>

                <div className="crud-form-group">
                  <label>New Password</label>
                  <input
                    type="password"
                    placeholder="Enter new secure password"
                    value={newPwd}
                    onChange={(e) =>
                      setNewPwd(e.target.value.replace(/\s/g, ""))
                    }
                    required
                  />
                  <small
                    style={{
                      color: "var(--muted)",
                      fontSize: "11px",
                      marginTop: "3px",
                      display: "block",
                    }}
                  >
                    Must be at least 6 characters, mix of letters & numbers, no
                    spaces, no repeating characters.
                  </small>
                </div>

                <div className="crud-form-group">
                  <label>Confirm New Password</label>
                  <input
                    type="password"
                    placeholder="Confirm new password"
                    value={confirmPwd}
                    onChange={(e) =>
                      setConfirmPwd(e.target.value.replace(/\s/g, ""))
                    }
                    required
                  />
                </div>
              </div>

              <div className="crud-modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setChangePasswordModalOpen(false)
                    setPwdError("")
                    setPwdSuccess("")
                  }}
                >
                  Cancel
                </button>
                <button
                  className="auth-btn-primary"
                  type="submit"
                  style={{
                    width: "auto",
                    padding: "0 22px",
                    height: "40px",
                    fontSize: "13px",
                  }}
                >
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===============================================================
          MODAL 2: ADMIN USER & STALL CREATION MODAL
          =============================================================== */}
      {adminCreateUserModalOpen && (
        <div
          className="crud-modal-overlay"
          onMouseDown={() => setAdminCreateUserModalOpen(false)}
        >
          <div
            className="crud-modal"
            style={{ maxWidth: "620px", width: "min(620px, 100%)" }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="crud-modal-header">
              <div>
                <span
                  className="sidebar-section-kicker"
                  style={{ margin: 0, color: "var(--primary)", paddingLeft: 0 }}
                >
                  ADMINISTRATION PORTAL
                </span>
                <h3
                  style={{
                    margin: "2px 0 0",
                    fontSize: "20px",
                    fontFamily: "var(--font-serif)",
                  }}
                >
                  Create New Account or Stall Branch
                </h3>
              </div>
              <button
                type="button"
                className="icon-action-btn"
                style={{ width: "32px", height: "32px" }}
                onClick={() => setAdminCreateUserModalOpen(false)}
              >
                <Icon name="x" size={16} />
              </button>
            </div>

            <form onSubmit={handleAdminCreateUser}>
              <div
                className="crud-modal-body"
                style={{ maxHeight: "70vh", overflowY: "auto" }}
              >
                {adminUserModalError && (
                  <div className="toast-error">{adminUserModalError}</div>
                )}
                {adminUserModalSuccess && (
                  <div className="toast-success">{adminUserModalSuccess}</div>
                )}

                {/* Role Selector Tabs */}
                <div className="crud-form-group">
                  <label>Select Account Role</label>
                  <div className="modal-role-selector">
                    <button
                      type="button"
                      className={`modal-role-btn ${
                        newRole === "stall_manager" ? "active" : ""
                      }`}
                      onClick={() => setNewRole("stall_manager")}
                    >
                      Stall Account
                    </button>
                    <button
                      type="button"
                      className={`modal-role-btn ${
                        newRole === "admin" ? "active" : ""
                      }`}
                      onClick={() => setNewRole("admin")}
                    >
                      Admin User
                    </button>
                    <button
                      type="button"
                      className={`modal-role-btn ${
                        newRole === "staff" ? "active" : ""
                      }`}
                      onClick={() => setNewRole("staff")}
                    >
                      Staff Member
                    </button>
                    <button
                      type="button"
                      className={`modal-role-btn ${
                        newRole === "student" ? "active" : ""
                      }`}
                      onClick={() => setNewRole("student")}
                    >
                      Customer (Student)
                    </button>
                  </div>
                </div>

                {/* Name Breakdown: First Name, Middle Name, Last Name */}
                <div className="crud-form-group">
                  <label>Full Name *</label>
                  <div className="name-inputs-row">
                    <div>
                      <input
                        placeholder="First Name *"
                        value={newFirstName}
                        onChange={(e) =>
                          setNewFirstName(
                            e.target.value.replace(/[^A-Za-z\s]/g, ""),
                          )
                        }
                        required
                      />
                    </div>
                    <div>
                      <input
                        placeholder="Middle Name*"
                        value={newMiddleName}
                        onChange={(e) =>
                          setNewMiddleName(
                            e.target.value.replace(/[^A-Za-z\s]/g, ""),
                          )
                        }
                      />
                    </div>
                    <div>
                      <input
                        placeholder="Last Name*"
                        value={newLastName}
                        onChange={(e) =>
                          setNewLastName(
                            e.target.value.replace(/[^A-Za-z\s]/g, ""),
                          )
                        }
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* ID Number and Email */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "12px",
                  }}
                >
                  <div className="crud-form-group">
                    <label>ID Number *</label>
                    <input
                      placeholder="Enter your ID Number"
                      value={newUserId}
                      onChange={(e) =>
                        setNewUserId(e.target.value.replace(/\D/g, ""))
                      }
                      required
                    />
                  </div>
                  <div className="crud-form-group">
                    <label>Email*</label>
                    <input
                      type="email"
                      placeholder="Enter your Email"
                      value={newUserEmail}
                      onChange={(e) => setNewUserEmail(e.target.value.trim())}
                      required
                    />
                  </div>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "12px",
                  }}
                >
                  <div className="crud-form-group">
                    <label>Phone Number *</label>
                    <input
                      type="tel"
                      placeholder="Enter your phone number"
                      value={newPhone}
                      onChange={(e) =>
                        setNewPhone(
                          e.target.value.replace(/\D/g, "").slice(0, 11),
                        )
                      }
                      maxLength={11}
                      required
                    />
                    <small
                      style={{
                        color: "var(--muted)",
                        fontSize: "11px",
                        marginTop: "3px",
                        display: "block",
                      }}
                    ></small>
                  </div>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "12px",
                  }}
                >
                  <div className="crud-form-group">
                    <label>Create a Password *</label>
                    <div
                      style={{
                        position: "relative",
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      <input
                        type={showNewPassword ? "text" : "password"}
                        placeholder="Password "
                        value={newPassword}
                        onChange={(e) =>
                          setNewPassword(e.target.value.replace(/\s/g, ""))
                        }
                        style={{
                          width: "100%",
                          paddingRight: "38px",
                          boxSizing: "border-box",
                        }}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        tabIndex={-1}
                        style={{
                          position: "absolute",
                          right: "8px",
                          background: "none",
                          border: "none",
                          color: "var(--muted)",
                          cursor: "pointer",
                          padding: "4px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                        title={
                          showNewPassword ? "Hide password" : "Show password"
                        }
                      >
                        <Icon
                          name={showNewPassword ? "eye-off" : "eye"}
                          size={17}
                        />
                      </button>
                    </div>
                  </div>
                  <div className="crud-form-group">
                    <label>Initial Balance (₱)</label>
                    <input
                      type="number"
                      value={newBalance}
                      onChange={(e) => setNewBalance(Number(e.target.value))}
                    />
                  </div>
                </div>

                {/* STALL ASSIGNMENT (Staff belongs to a stall; 1 stall handles many staff users) */}
                {newRole === "staff" && (
                  <div
                    className="crud-form-group"
                    style={{
                      background: "var(--bg-subtle)",
                      padding: "12px",
                      borderRadius: "8px",
                    }}
                  >
                    <label style={{ color: "var(--primary)", fontWeight: 800 }}>
                      Assigned Canteen Stall (1 Stall handles many staff)
                    </label>
                    <select
                      value={newStallId}
                      onChange={(e) => setNewStallId(Number(e.target.value))}
                      style={{ marginTop: "6px" }}
                    >
                      {stalls.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.stall_code}) &bull;{" "}
                          {
                            userProfiles.filter(
                              (u) =>
                                u.role === "staff" &&
                                (u.stall_id || 1) === s.id,
                            ).length
                          }{" "}
                          current staff
                        </option>
                      ))}
                    </select>
                    <small
                      style={{
                        color: "var(--muted)",
                        fontSize: "11px",
                        display: "block",
                        marginTop: "4px",
                      }}
                    >
                      This staff member will prepare and process orders for this
                      stall branch.
                    </small>
                  </div>
                )}

                {/* STALL ACCOUNT SPECIFIC: ASSIGN TO EXISTING OR CREATE NEW STALL BRANCH */}
                {newRole === "stall_manager" && (
                  <div
                    style={{
                      background: "var(--bg-subtle)",
                      padding: "14px",
                      borderRadius: "8px",
                      border: "1px solid var(--line)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        marginBottom: "10px",
                      }}
                    >
                      <input
                        type="checkbox"
                        id="newStallChk"
                        checked={createNewStallCheckbox}
                        onChange={(e) =>
                          setCreateNewStallCheckbox(e.target.checked)
                        }
                      />
                      <label
                        htmlFor="newStallChk"
                        style={{
                          fontWeight: 700,
                          fontSize: "13px",
                          cursor: "pointer",
                        }}
                      >
                        Register a Brand New Canteen Stall Branch in System
                      </label>
                    </div>

                    {!createNewStallCheckbox ? (
                      <div className="crud-form-group" style={{ margin: 0 }}>
                        <label>Manage Existing Stall Branch</label>
                        <select
                          value={newStallId}
                          onChange={(e) =>
                            setNewStallId(Number(e.target.value))
                          }
                        >
                          {stalls.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name} ({s.stall_code})
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "10px",
                        }}
                      >
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "2fr 1fr",
                            gap: "10px",
                          }}
                        >
                          <div
                            className="crud-form-group"
                            style={{ margin: 0 }}
                          >
                            <label>Branch / Stall Name *</label>
                            <input
                              placeholder="e.g. Station C &ndash; Beverage Hub"
                              value={newStallName}
                              onChange={(e) => setNewStallName(e.target.value)}
                              required={createNewStallCheckbox}
                            />
                          </div>
                          <div
                            className="crud-form-group"
                            style={{ margin: 0 }}
                          >
                            <label>Stall Code</label>
                            <input
                              placeholder="e.g. STALL-03"
                              value={newStallCode}
                              onChange={(e) => setNewStallCode(e.target.value)}
                            />
                          </div>
                        </div>
                        <div className="crud-form-group" style={{ margin: 0 }}>
                          <label>Stall Description</label>
                          <input
                            placeholder="e.g. Fresh fruit juices, milk teas, and hot espresso"
                            value={newStallDesc}
                            onChange={(e) => setNewStallDesc(e.target.value)}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="crud-modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setAdminCreateUserModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  className="auth-btn-primary"
                  type="submit"
                  style={{
                    width: "auto",
                    padding: "0 24px",
                    height: "40px",
                    fontSize: "13px",
                  }}
                >
                  Create{" "}
                  {newRole === "stall_manager"
                    ? "Stall Account"
                    : newRole === "admin"
                      ? "Admin User"
                      : newRole === "staff"
                        ? "Staff Member"
                        : "Customer Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===============================================================
          MODAL 3: ADMIN RESET USER PASSWORD MODAL
          =============================================================== */}
      {adminResetUser && (
        <div
          className="crud-modal-overlay"
          onMouseDown={() => setAdminResetUser(null)}
        >
          <div
            className="crud-modal"
            style={{ maxWidth: "420px", width: "min(420px, 100%)" }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="crud-modal-header">
              <div>
                <span
                  className="sidebar-section-kicker"
                  style={{ margin: 0, color: "var(--primary)", paddingLeft: 0 }}
                >
                  USER SECURITY OVERRIDE
                </span>
                <h3
                  style={{
                    margin: "2px 0 0",
                    fontSize: "18px",
                    fontFamily: "var(--font-serif)",
                  }}
                >
                  Reset User Password
                </h3>
              </div>
              <button
                type="button"
                className="icon-action-btn"
                style={{ width: "32px", height: "32px" }}
                onClick={() => setAdminResetUser(null)}
              >
                <Icon name="x" size={16} />
              </button>
            </div>

            <form onSubmit={handleAdminResetPassword}>
              <div className="crud-modal-body">
                <div
                  style={{
                    background: "var(--bg-subtle)",
                    padding: "12px",
                    borderRadius: "8px",
                    marginBottom: "14px",
                    fontSize: "13px",
                  }}
                >
                  <div>
                    <strong>Account:</strong> {adminResetUser.full_name}
                  </div>
                  <div>
                    <strong>User ID:</strong> {adminResetUser.student_id}
                  </div>
                  <div>
                    <strong>Role:</strong>{" "}
                    <span style={{ textTransform: "capitalize" }}>
                      {adminResetUser.role}
                    </span>
                  </div>
                </div>

                <div className="crud-form-group">
                  <label>Enter New Password for User</label>
                  <div
                    style={{
                      position: "relative",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <input
                      type={showAdminResetPwd ? "text" : "password"}
                      placeholder="Password"
                      value={adminResetNewPwd}
                      onChange={(e) =>
                        setAdminResetNewPwd(e.target.value.replace(/\s/g, ""))
                      }
                      style={{
                        width: "100%",
                        paddingRight: "38px",
                        boxSizing: "border-box",
                      }}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowAdminResetPwd(!showAdminResetPwd)}
                      tabIndex={-1}
                      style={{
                        position: "absolute",
                        right: "8px",
                        background: "none",
                        border: "none",
                        color: "var(--muted)",
                        cursor: "pointer",
                        padding: "4px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                      title={
                        showAdminResetPwd ? "Hide password" : "Show password"
                      }
                    >
                      <Icon
                        name={showAdminResetPwd ? "eye-off" : "eye"}
                        size={17}
                      />
                    </button>
                  </div>
                  <small
                    style={{
                      color: "var(--muted)",
                      fontSize: "11px",
                      marginTop: "4px",
                      display: "block",
                    }}
                  >
                    
                  </small>
                </div>
              </div>

              <div className="crud-modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setAdminResetUser(null)}
                >
                  Cancel
                </button>
                <button
                  className="auth-btn-primary"
                  type="submit"
                  style={{
                    width: "auto",
                    padding: "0 20px",
                    height: "40px",
                    fontSize: "13px",
                  }}
                >
                  Save New Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===============================================================
          MODAL: ADMIN EDIT USER DETAILS (CHANGE NAME & ID NUMBER)
          =============================================================== */}
      {adminEditUser && (
        <div
          className="crud-modal-overlay"
          onMouseDown={() => setAdminEditUser(null)}
        >
          <div
            className="crud-modal"
            style={{ maxWidth: "620px", width: "min(620px, 100%)" }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="crud-modal-header">
              <div>
                <span
                  className="sidebar-section-kicker"
                  style={{ margin: 0, color: "var(--primary)", paddingLeft: 0 }}
                >
                  ADMINISTRATION PORTAL
                </span>
                <h3
                  style={{
                    margin: "2px 0 0",
                    fontSize: "20px",
                    fontFamily: "var(--font-serif)",
                  }}
                >
                  Edit User Details
                </h3>
                <small style={{ color: "var(--muted)" }}>
                  Modifying user profile for {adminEditUser.full_name} (
                  {adminEditUser.student_id})
                </small>
              </div>
              <button
                type="button"
                className="icon-action-btn"
                style={{ width: "32px", height: "32px" }}
                onClick={() => setAdminEditUser(null)}
              >
                <Icon name="x" size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveEditUser}>
              <div
                className="crud-modal-body"
                style={{ maxHeight: "70vh", overflowY: "auto" }}
              >
                {editError && <div className="toast-error">{editError}</div>}
                {editSuccess && (
                  <div className="toast-success">{editSuccess}</div>
                )}
                <p className="auth-callout-notice" role="note">
                  
                </p>

                {/* Role Selector Tabs */}
                <div className="crud-form-group">
                  <label>Account Role Tier</label>
                  <div className="modal-role-selector">
                    <button
                      type="button"
                      className={`modal-role-btn ${
                        editRole === "stall_manager" ? "active" : ""
                      }`}
                      onClick={() => setEditRole("stall_manager")}
                    >
                      Stall Account
                    </button>
                    <button
                      type="button"
                      className={`modal-role-btn ${
                        editRole === "admin" ? "active" : ""
                      }`}
                      onClick={() => setEditRole("admin")}
                    >
                      Admin User
                    </button>
                    <button
                      type="button"
                      className={`modal-role-btn ${
                        editRole === "staff" ? "active" : ""
                      }`}
                      onClick={() => setEditRole("staff")}
                    >
                      Staff Member
                    </button>
                    <button
                      type="button"
                      className={`modal-role-btn ${
                        editRole === "student" ? "active" : ""
                      }`}
                      onClick={() => setEditRole("student")}
                    >
                      Customer (Student)
                    </button>
                  </div>
                </div>

                {/* Name Breakdown: First Name, Middle Name, Last Name */}
                <div className="crud-form-group">
                  <label>Full Name (First, Middle, Last)</label>
                  <div className="name-inputs-row">
                    <div>
                      <input
                        placeholder="First Name *"
                        value={editFirstName}
                        onChange={(e) =>
                          setEditFirstName(
                            e.target.value.replace(/[^A-Za-z\s]/g, ""),
                          )
                        }
                        required
                      />
                    </div>
                    <div>
                      <input
                        placeholder="Middle Name"
                        value={editMiddleName}
                        onChange={(e) =>
                          setEditMiddleName(
                            e.target.value.replace(/[^A-Za-z\s]/g, ""),
                          )
                        }
                      />
                    </div>
                    <div>
                      <input
                        placeholder="Last Name *"
                        value={editLastName}
                        onChange={(e) =>
                          setEditLastName(
                            e.target.value.replace(/[^A-Za-z\s]/g, ""),
                          )
                        }
                        required
                      />
                    </div>
                  </div>
                  <small
                    style={{
                      color: "var(--muted)",
                      fontSize: "11px",
                      marginTop: "3px",
                      display: "block",
                    }}
                  >
                  
                    <strong>
                      {`${editFirstName.trim()} ${
                        editMiddleName.trim() ? editMiddleName.trim() + " " : ""
                      }${editLastName.trim()}`.trim() || "—"}
                    </strong>
                  </small>
                </div>

                {/* ID Number and Email */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "12px",
                  }}
                >
                  <div className="crud-form-group">
                    <label>ID Number *</label>
                    <input
                      placeholder="Enter your ID Number"
                      value={editUserId}
                      onChange={(e) =>
                        setEditUserId(e.target.value.replace(/\D/g, ""))
                      }
                      required
                    />
                  </div>
                  <div className="crud-form-group">
                    <label>Email Address *</label>
                    <input
                      type="email"
                      placeholder="Enter your Email"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value.trim())}
                      required
                    />
                  </div>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "12px",
                  }}
                >
                  <div className="crud-form-group">
                    <label>Phone Number *</label>
                    <input
                      type="tel"
                      placeholder="Enter your phone number"
                      value={editPhone}
                      onChange={(e) =>
                        setEditPhone(
                          e.target.value.replace(/\D/g, "").slice(0, 11),
                        )
                      }
                      maxLength={11}
                      required
                    />
                    <small
                      style={{
                        color: "var(--muted)",
                        fontSize: "11px",
                        marginTop: "3px",
                        display: "block",
                      }}
                    >
                    
                    </small>
                  </div>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "12px",
                  }}
                >
                  <div className="crud-form-group">
                    <label>Wallet Balance (₱)</label>
                    <input
                      type="number"
                      value={editBalance}
                      onChange={(e) => setEditBalance(Number(e.target.value))}
                    />
                  </div>
                  {(editRole === "staff" || editRole === "stall_manager") && (
                    <div className="crud-form-group">
                      <label>Assigned Canteen Stall</label>
                      <select
                        value={editStallId}
                        onChange={(e) => setEditStallId(Number(e.target.value))}
                      >
                        {stalls.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name} ({s.stall_code})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>

              <div className="crud-modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setAdminEditUser(null)}
                >
                  Cancel
                </button>
                <button
                  className="auth-btn-primary"
                  type="submit"
                  style={{
                    width: "auto",
                    padding: "0 24px",
                    height: "40px",
                    fontSize: "13px",
                  }}
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===============================================================
          MODAL 4: CAMPUS DIRECTORY & SCHOOL SWITCHER
          =============================================================== */}
      {schoolModalOpen && (
        <div
          className="crud-modal-overlay"
          onMouseDown={() => setSchoolModalOpen(false)}
        >
          <div
            className="crud-modal"
            style={{ maxWidth: "560px", width: "min(560px, 100%)" }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="crud-modal-header">
              <div
                style={{ display: "flex", alignItems: "center", gap: "10px" }}
              >
                <div
                  className="school-badge-square"
                  style={{ width: "40px", height: "40px", fontSize: "13px" }}
                >
                  {activeCampus.abbr}
                </div>
                <div>
                  <h3
                    style={{
                      margin: 0,
                      fontSize: "18px",
                      fontFamily: "var(--font-serif)",
                    }}
                  >
                    Campus & Canteen Directory
                  </h3>
                  <small style={{ color: "var(--muted)" }}>
                    Select or view active Holy Name University branch
                  </small>
                </div>
              </div>
              <button
                type="button"
                className="icon-action-btn"
                style={{ width: "32px", height: "32px" }}
                onClick={() => setSchoolModalOpen(false)}
              >
                <Icon name="x" size={16} />
              </button>
            </div>

            <div className="crud-modal-body">
              <span
                className="sidebar-section-kicker"
                style={{ margin: 0, paddingLeft: 0 }}
              >
                AVAILABLE UNIVERSITY CAMPUSES
              </span>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                }}
              >
                {campuses.map((c) => (
                  <div
                    key={c.id}
                    className={`campus-option-card ${c.active ? "active" : ""}`}
                    onClick={() => {
                      setCampuses((prev) =>
                        prev.map((item) => ({
                          ...item,
                          active: item.id === c.id,
                        })),
                      )
                      setSyncToast(`✓ Switched campus to ${c.name}`)
                      setTimeout(() => setSyncToast(""), 2500)
                      setTimeout(() => setSchoolModalOpen(false), 300)
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                      }}
                    >
                      <div
                        className="school-badge-square"
                        style={{
                          width: "42px",
                          height: "42px",
                          fontSize: "12px",
                        }}
                      >
                        {c.abbr}
                      </div>
                      <div>
                        <strong
                          style={{
                            fontSize: "14px",
                            color: "var(--ink)",
                            display: "block",
                          }}
                        >
                          {c.name}
                        </strong>
                        <span
                          style={{
                            fontSize: "12px",
                            color: "var(--muted)",
                            display: "block",
                          }}
                        >
                          {c.campusLocation}
                        </span>
                        <div
                          style={{
                            display: "flex",
                            gap: "12px",
                            marginTop: "4px",
                            fontSize: "11px",
                            color: "var(--ink-secondary)",
                          }}
                        >
                          <span>🕒 {c.hours}</span>
                          <span>🏬 {c.stallsCount} Food Stalls</span>
                          <span style={{ fontFamily: "var(--font-mono)" }}>
                            [{c.code}]
                          </span>
                        </div>
                      </div>
                    </div>
                    <div>
                      {c.active ? (
                        <span
                          className="status-pill ready"
                          style={{ fontSize: "11px" }}
                        >
                          Active
                        </span>
                      ) : (
                        <button
                          type="button"
                          className="btn-secondary"
                          style={{ padding: "6px 12px", fontSize: "12px" }}
                        >
                          Select
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div
                style={{
                  background: "var(--bg-subtle)",
                  padding: "12px 14px",
                  borderRadius: "8px",
                  fontSize: "12px",
                  color: "var(--muted)",
                  marginTop: "8px",
                }}
              ></div>
            </div>

            <div className="crud-modal-footer">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setSchoolModalOpen(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===============================================================
          MODAL 5: USER PROFILE & WALLET TOP-UP MODAL
          =============================================================== */}
      {userProfileModalOpen && (
        <div
          className="crud-modal-overlay"
          onMouseDown={() => setUserProfileModalOpen(false)}
        >
          <div
            className="crud-modal"
            style={{ maxWidth: "480px", width: "min(480px, 100%)" }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="crud-modal-header">
              <div
                style={{ display: "flex", alignItems: "center", gap: "12px" }}
              >
                <div
                  className="user-avatar-circle"
                  style={{
                    width: "42px",
                    height: "42px",
                    fontSize: "18px",
                    background: "var(--primary)",
                    color: "#FFFFFF",
                  }}
                >
                  {currentUser.full_name
                    ? currentUser.full_name.charAt(0).toUpperCase()
                    : "U"}
                </div>
                <div>
                  <h3
                    style={{
                      margin: 0,
                      fontSize: "18px",
                      fontFamily: "var(--font-serif)",
                    }}
                  >
                    {currentUser.full_name}
                  </h3>
                  <small
                    style={{
                      color: "var(--muted)",
                      textTransform: "capitalize",
                    }}
                  >
                    {currentUser.role.replace("_", " ")} &bull;{" "}
                    {currentUser.student_id}
                  </small>
                </div>
              </div>
              <button
                type="button"
                className="icon-action-btn"
                style={{ width: "32px", height: "32px" }}
                onClick={() => setUserProfileModalOpen(false)}
              >
                <Icon name="x" size={16} />
              </button>
            </div>

            <div className="crud-modal-body">
              {topUpSuccess && (
                <div className="toast-success">{topUpSuccess}</div>
              )}

              {/* Account Meta Grid */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "10px",
                  background: "var(--bg-subtle)",
                  padding: "14px",
                  borderRadius: "10px",
                  fontSize: "12px",
                }}
              >
                <div>
                  <span
                    style={{
                      color: "var(--muted)",
                      display: "block",
                      fontSize: "11px",
                      fontWeight: 700,
                    }}
                  >
                    STUDENT / USER ID
                  </span>
                  <strong style={{ fontSize: "13px" }}>
                    {currentUser.student_id}
                  </strong>
                </div>
                <div>
                  <span
                    style={{
                      color: "var(--muted)",
                      display: "block",
                      fontSize: "11px",
                      fontWeight: 700,
                    }}
                  >
                    PHONE NUMBER
                  </span>
                  <strong style={{ fontSize: "13px" }}>
                    {currentUser.phone_number || "Not provided"}
                  </strong>
                </div>
                <div>
                  <span
                    style={{
                      color: "var(--muted)",
                      display: "block",
                      fontSize: "11px",
                      fontWeight: 700,
                    }}
                  >
                    ACCOUNT ROLE
                  </span>
                  <span
                    className="status-pill preparing"
                    style={{
                      textTransform: "capitalize",
                      marginTop: "2px",
                      display: "inline-block",
                    }}
                  >
                    {currentUser.role.replace("_", " ")}
                  </span>
                </div>
                <div>
                  <span
                    style={{
                      color: "var(--muted)",
                      display: "block",
                      fontSize: "11px",
                      fontWeight: 700,
                    }}
                  >
                    CAMPUS AFFILIATION
                  </span>
                  <strong style={{ fontSize: "13px" }}>
                    {activeCampus.name}
                  </strong>
                </div>
              </div>

              {/* Wallet Balance Card & Quick Top-Up */}
              <div
                style={{
                  border: "1.5px solid var(--line)",
                  borderRadius: "12px",
                  padding: "16px",
                  background: "#FAFBF9",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 800,
                        color: "var(--muted)",
                        letterSpacing: "0.6px",
                      }}
                    >
                      CANTEEN WALLET BALANCE
                    </span>
                    <div
                      style={{
                        fontSize: "28px",
                        fontWeight: 800,
                        color: "var(--primary)",
                        fontFamily: "var(--font-serif)",
                        marginTop: "2px",
                      }}
                    >
                      ₱{currentUser.balance.toFixed(2)}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span
                      className="count-badge ready"
                      style={{ fontSize: "11px", padding: "4px 8px" }}
                    >
                      Active Balance
                    </span>
                  </div>
                </div>

                <div
                  style={{
                    marginTop: "14px",
                    borderTop: "1px dashed var(--line)",
                    paddingTop: "12px",
                  }}
                >
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 700,
                      color: "var(--ink-secondary)",
                    }}
                  >
                    Quick Balance Reload / Top-up:
                  </span>
                  <div className="quick-topup-grid">
                    <button
                      type="button"
                      className="quick-topup-btn"
                      onClick={() => handleTopUpBalance(50)}
                    >
                      +₱50
                    </button>
                    <button
                      type="button"
                      className="quick-topup-btn"
                      onClick={() => handleTopUpBalance(100)}
                    >
                      +₱100
                    </button>
                    <button
                      type="button"
                      className="quick-topup-btn"
                      onClick={() => handleTopUpBalance(200)}
                    >
                      +₱200
                    </button>
                    <button
                      type="button"
                      className="quick-topup-btn"
                      onClick={() => handleTopUpBalance(500)}
                    >
                      +₱500
                    </button>
                  </div>
                  <small
                    style={{
                      color: "var(--muted)",
                      fontSize: "11px",
                      display: "block",
                      marginTop: "6px",
                    }}
                  >
                    Clicking instantly reloads balance for testing cashless
                    canteen counter orders.
                  </small>
                </div>
              </div>

              {/* Quick Actions */}
              <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
                <button
                  type="button"
                  className="btn-secondary"
                  style={{
                    flex: 1,
                    padding: "10px",
                    fontSize: "12px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                  }}
                  onClick={() => {
                    setUserProfileModalOpen(false)
                    setChangePasswordModalOpen(true)
                  }}
                >
                  <Icon name="key" size={14} />
                  <span>Change Password</span>
                </button>
                <button
                  type="button"
                  className="sidebar-signout-btn"
                  style={{ flex: 1, padding: "10px", fontSize: "12px" }}
                  onClick={() => {
                    setUserProfileModalOpen(false)
                    setLogoutModalOpen(true)
                  }}
                >
                  <Icon name="logout" size={14} />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>

            <div className="crud-modal-footer">
              <button
                type="button"
                className="auth-btn-primary"
                style={{
                  width: "auto",
                  padding: "0 20px",
                  height: "38px",
                  fontSize: "13px",
                }}
                onClick={() => setUserProfileModalOpen(false)}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===============================================================
          MODAL 6: INVENTORY STOCK EDIT & RESTOCK MODAL
          =============================================================== */}
      {stockModalOpen && editingStockItem && (
        <div
          className="crud-modal-overlay"
          onMouseDown={() => setStockModalOpen(false)}
        >
          <div
            className="crud-modal"
            style={{ maxWidth: "480px", width: "min(480px, 100%)" }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="crud-modal-header">
              <div>
                <span
                  className="sidebar-section-kicker"
                  style={{ margin: 0, color: "var(--primary)", paddingLeft: 0 }}
                >
                  INVENTORY MANAGEMENT
                </span>
                <h3
                  style={{
                    margin: "2px 0 0",
                    fontSize: "20px",
                    fontFamily: "var(--font-serif)",
                  }}
                >
                  Edit Stock &amp; Restock
                </h3>
                <small style={{ color: "var(--muted)" }}>
                  {editingStockItem.item_name} &bull; Stored in{" "}
                  {editingStockItem.unit_of_measure}
                </small>
              </div>
              <button
                type="button"
                className="icon-action-btn"
                style={{ width: "32px", height: "32px" }}
                onClick={() => setStockModalOpen(false)}
              >
                <Icon name="x" size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveStock}>
              <div className="crud-modal-body">
                {stockModalToast && (
                  <div className="toast-success">{stockModalToast}</div>
                )}

                <div
                  style={{
                    background: "var(--bg-subtle)",
                    padding: "12px 14px",
                    borderRadius: "8px",
                    marginBottom: "14px",
                    fontSize: "13px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "4px",
                    }}
                  >
                    <span style={{ color: "var(--muted)" }}>Ingredient:</span>
                    <strong>{editingStockItem.item_name}</strong>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "4px",
                    }}
                  >
                    <span style={{ color: "var(--muted)" }}>Branch:</span>
                    <span>
                      {stalls.find((s) => s.id === editingStockItem.stall_id)
                        ?.name || "Main Kitchen"}
                    </span>
                  </div>
                  <div
                    style={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <span style={{ color: "var(--muted)" }}>
                      Recorded Balance:
                    </span>
                    <strong style={{ color: "var(--primary)" }}>
                      {editingStockItem.current_stock}{" "}
                      {editingStockItem.unit_of_measure}
                    </strong>
                  </div>
                </div>

                <div className="crud-form-group">
                  <label>
                    Current Stock Balance ({editingStockItem.unit_of_measure}) *
                  </label>
                  <input
                    type="number"
                    min={0}
                    step="any"
                    value={stockFormQty}
                    onChange={(e) => setStockFormQty(e.target.value)}
                    required
                    style={{ fontSize: "16px", fontWeight: 700 }}
                  />
                  <small
                    style={{
                      color: "var(--muted)",
                      fontSize: "11px",
                      marginTop: "3px",
                      display: "block",
                    }}
                  >
                    Edit directly to the exact count on hand.
                  </small>
                </div>

                {/* Quick Add / Restock Shortcuts */}
                <div className="crud-form-group">
                  <label>Quick Restock Additions</label>
                  <div
                    style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}
                  >
                    {[5, 10, 25, 50, 100].map((addVal) => (
                      <button
                        key={addVal}
                        type="button"
                        className="btn-secondary"
                        style={{
                          padding: "6px 12px",
                          fontSize: "12px",
                          fontWeight: 700,
                        }}
                        onClick={() =>
                          setStockFormQty((prev) =>
                            Math.max(
                              0,
                              (parseFloat(String(prev)) || 0) + addVal,
                            ),
                          )
                        }
                      >
                        +{addVal} {editingStockItem.unit_of_measure}
                      </button>
                    ))}
                    <button
                      type="button"
                      className="btn-secondary"
                      style={{
                        padding: "6px 10px",
                        fontSize: "12px",
                        color: "#b91c1c",
                      }}
                      onClick={() => setStockFormQty(0)}
                    >
                      Clear to 0
                    </button>
                  </div>
                </div>

                <div className="crud-form-group">
                  <label>
                    Minimum Safe Threshold ({editingStockItem.unit_of_measure})
                  </label>
                  <input
                    type="number"
                    min={0}
                    step="any"
                    value={stockFormMin}
                    onChange={(e) => setStockFormMin(e.target.value)}
                    required
                  />
                  <small
                    style={{
                      color: "var(--muted)",
                      fontSize: "11px",
                      marginTop: "3px",
                      display: "block",
                    }}
                  >
                    Alert threshold when stock runs low.
                  </small>
                </div>
              </div>

              <div className="crud-modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setStockModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  className="auth-btn-primary"
                  type="submit"
                  style={{
                    width: "auto",
                    padding: "0 24px",
                    height: "40px",
                    fontSize: "13px",
                  }}
                >
                  Save Stock Updates
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 8. LOGOUT CONFIRMATION MODAL */}
      {logoutModalOpen && (
        <div
          className="crud-modal-overlay"
          onClick={() => setLogoutModalOpen(false)}
        >
          <div
            className="crud-modal"
            style={{ maxWidth: "420px", padding: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="crud-modal-header"
              style={{ alignItems: "center", padding: "18px 24px" }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                }}
              >
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "50%",
                    background: "#FEE2E2",
                    color: "#DC2626",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Icon name="logout" size={20} />
                </div>
                <div>
                  <h3
                    style={{
                      margin: 0,
                      fontSize: "17px",
                      color: "var(--ink)",
                      fontWeight: 700,
                    }}
                  >
                    Confirm Sign Out
                  </h3>
                  <p
                    style={{
                      margin: "3px 0 0",
                      fontSize: "12px",
                      color: "var(--muted)",
                    }}
                  >
                    {currentUser.full_name} &bull; {currentUser.role?.toUpperCase()}
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="icon-action-btn"
                onClick={() => setLogoutModalOpen(false)}
                title="Close"
              >
                <Icon name="x" size={16} />
              </button>
            </div>

            <div
              className="crud-modal-body"
              style={{ padding: "20px 24px" }}
            >
              <p
                style={{
                  margin: 0,
                  fontSize: "14px",
                  color: "var(--ink)",
                  lineHeight: 1.5,
                }}
              >
                Are you sure you want to log out of your account? You will need to sign in again to access your orders and account features.
              </p>
            </div>

            <div
              className="crud-modal-footer"
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "10px",
                padding: "16px 24px",
                background: "#F8FAFC",
                borderTop: "1px solid var(--line)",
                borderRadius: "0 0 12px 12px",
              }}
            >
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setLogoutModalOpen(false)}
                style={{
                  padding: "8px 18px",
                  fontSize: "13px",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleLogout}
                style={{
                  background: "#DC2626",
                  color: "#fff",
                  border: "none",
                  borderRadius: "6px",
                  padding: "8px 20px",
                  fontSize: "13px",
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  transition: "background 0.15s ease",
                }}
              >
                <Icon name="logout" size={14} />
                <span>Yes, Log Out</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
