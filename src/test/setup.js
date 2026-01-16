import '@testing-library/jest-dom'

// Mock Firebase modules
vi.mock('../firebase/config', () => ({
  storage: {},
  db: {},
}))

// Mock Firebase Storage functions
vi.mock('firebase/storage', () => ({
  ref: vi.fn(),
  uploadBytesResumable: vi.fn(),
  getDownloadURL: vi.fn(),
}))

// Mock Firebase Firestore functions
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  addDoc: vi.fn(),
  serverTimestamp: vi.fn(),
  onSnapshot: vi.fn(),
  doc: vi.fn(),
  getDoc: vi.fn(),
  updateDoc: vi.fn(),
}))

// Mock React Router
vi.mock('react-router-dom', () => ({
  Navigate: vi.fn(({ to }) => null),
  useNavigate: () => vi.fn(),
  useLocation: () => ({ pathname: '/upload' }),
}))

// Mock Firebase Auth Context
vi.mock('../context/FirebaseAuthContext', () => ({
  useAuth: () => ({
    hasPermission: vi.fn(() => true),
    isAdmin: true,
    user: { uid: 'test-user' },
  }),
}))

// Mock URL.createObjectURL and URL.revokeObjectURL
global.URL.createObjectURL = vi.fn(() => 'mock-url')
global.URL.revokeObjectURL = vi.fn()

// Mock alert
global.alert = vi.fn()

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
}