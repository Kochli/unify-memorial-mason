
import { Order, MainStatus, StoneStatus, ProofStatus, Message, Person, Product, PaymentRecord, AppNotification, StoneShape, UserRole, ModulePermission, PermitPhase, PermitForm } from '@/shared/types/prototype.types';

export const MODULE_LIST = [
  { id: 'orders', name: 'Order Pipeline' },
  { id: 'map', name: 'Field Logistics' },
  { id: 'jobs', label: 'Work Orders', name: 'Workshop Management' },
  { id: 'inscriptions', name: 'Stonecraft Studio' },
  { id: 'permits', name: 'Permit Agent' },
  { id: 'inbox', name: 'Communications' },
  { id: 'payments', name: 'Financials & Stripe' },
  { id: 'reporting', name: 'BI Analytics' },
  { id: 'roles', name: 'Security & Access' }
];

export const DUMMY_PERMIT_FORMS: PermitForm[] = [
  { id: 'f-001', authorityName: 'Landican Cemetery', formName: 'Memorial Application Form 12A', sourceUrl: 'https://landican.gov.uk/forms/memorials', lastUpdated: '2024-01-01' },
  { id: 'f-002', authorityName: 'Wirral Council', formName: 'Erection of Memorial - Form B', sourceUrl: 'https://wirral.gov.uk/cemeteries/permit-b', lastUpdated: '2023-11-15' },
  { id: 'f-003', authorityName: 'Liverpool Diocese', formName: 'Churchyard Memorial Permission', sourceUrl: 'https://liverpool.anglican.org/memorials', lastUpdated: '2024-02-10' }
];

export const DUMMY_ORDERS: Order[] = [
  {
    id: 'ORD-101',
    type: 'Kerb Set',
    sku: 'KB-01',
    customerName: 'Alice Thompson',
    customerEmail: 'alice@example.com',
    cemetery: 'Landican Cemetery',
    deceasedName: 'John Thompson',
    mainStatus: MainStatus.PENDING,
    stoneStatus: StoneStatus.ORDERED,
    proofStatus: ProofStatus.AWAITING_REVIEW,
    permitStatus: { orderId: 'ORD-101', phase: PermitPhase.SUBMITTED_TO_COUNCIL, fee: 180, readinessScore: 95, submissionDate: '2024-03-01' },
    baseValue: 3200,
    permitCost: 180,
    paidAmount: 1600,
    dueInDays: 45,
    messagesCount: 2,
    timelineWeeks: 12,
    coordinates: { lat: 53.3524, lng: -3.0856 },
    inscription: {
      rawText: "IN LOVING MEMORY OF JOHN THOMPSON 1940 - 2023 FOREVER IN OUR HEARTS",
      parsedText: "IN LOVING MEMORY OF JOHN THOMPSON 1940 - 2023 FOREVER IN OUR HEARTS",
      characterCount: 65,
      layoutType: "centered",
      symbols: ["Rose"],
      lines: [
        { text: "IN LOVING MEMORY OF", y: 120, fontSize: 18 },
        { text: "JOHN THOMPSON", y: 160, fontSize: 24 },
        { text: "1940 - 2023", y: 200, fontSize: 16 },
        { text: "FOREVER IN OUR HEARTS", y: 260, fontSize: 14 }
      ]
    }
  },
  {
    id: 'ORD-102',
    type: 'New Memorial',
    sku: 'OG-01',
    customerName: 'Brenda Jarvie',
    customerEmail: 'brenda@example.com',
    cemetery: 'Flaybrick Cemetery',
    deceasedName: 'Catherine Harkness',
    mainStatus: MainStatus.INSTALL,
    stoneStatus: StoneStatus.ONSITE,
    proofStatus: ProofStatus.LETTERED,
    permitStatus: { orderId: 'ORD-102', phase: PermitPhase.APPROVED, fee: 77, readinessScore: 100, approvalDate: '2024-02-15' },
    baseValue: 1080,
    permitCost: 77,
    paidAmount: 1157,
    dueInDays: 3,
    messagesCount: 5,
    timelineWeeks: 8,
    coordinates: { lat: 53.3985, lng: -3.0531 },
    inscription: {
      rawText: "IN LOVING MEMORY OF CATHERINE HARKNESS WHO DIED 24TH DEC 2023",
      parsedText: "IN LOVING MEMORY OF CATHERINE HARKNESS WHO DIED 24TH DEC 2023",
      characterCount: 88,
      layoutType: "ogee",
      symbols: ["Cross"],
      lines: [
        { text: "IN LOVING MEMORY OF", y: 120, fontSize: 18 },
        { text: "CATHERINE HARKNESS", y: 160, fontSize: 24 },
        { text: "DIED 24TH DEC 2023", y: 200, fontSize: 16 }
      ]
    }
  },
  {
    id: 'ORD-103',
    type: 'Kerb Set',
    sku: 'KB-01',
    customerName: 'Charles Xavier',
    customerEmail: 'charles@xmen.com',
    cemetery: 'Anfield Cemetery',
    deceasedName: 'Erik Lehnsherr',
    mainStatus: MainStatus.DEPOSIT_PAID,
    stoneStatus: StoneStatus.ORDERED,
    proofStatus: ProofStatus.IN_PROGRESS,
    permitStatus: { orderId: 'ORD-103', phase: PermitPhase.SEARCHING, fee: 150, readinessScore: 40 },
    baseValue: 2800,
    permitCost: 150,
    paidAmount: 1400,
    dueInDays: 20,
    messagesCount: 1,
    timelineWeeks: 6,
    coordinates: { lat: 53.4312, lng: -2.9615 },
    inscription: {
      rawText: "TO THE MEMORY OF ERIK LEHNSHERR 1930 - 2024 THE MASTER OF METAL",
      parsedText: "TO THE MEMORY OF ERIK LEHNSHERR 1930 - 2024 THE MASTER OF METAL",
      characterCount: 60,
      layoutType: "centered",
      symbols: ["Shield"],
      lines: [
        { text: "TO THE MEMORY OF", y: 120, fontSize: 18 },
        { text: "ERIK LEHNSHERR", y: 160, fontSize: 24 },
        { text: "1930 - 2024", y: 200, fontSize: 16 },
        { text: "THE MASTER OF METAL", y: 250, fontSize: 14 }
      ]
    }
  },
  {
    id: 'ORD-104',
    type: 'New Memorial',
    sku: 'HT-01',
    customerName: 'David Bowie',
    customerEmail: 'ziggy@stardust.com',
    cemetery: 'Frankby Cemetery',
    deceasedName: 'Major Tom',
    mainStatus: MainStatus.INSTALL,
    stoneStatus: StoneStatus.ONSITE,
    proofStatus: ProofStatus.LETTERED,
    permitStatus: { orderId: 'ORD-104', phase: PermitPhase.PREFILLED, fee: 100, readinessScore: 85 },
    baseValue: 1500,
    permitCost: 100,
    paidAmount: 1600,
    dueInDays: 5,
    messagesCount: 8,
    timelineWeeks: 10,
    coordinates: { lat: 53.3685, lng: -3.1254 },
    inscription: {
      rawText: "MAJOR TOM. COMMENCING COUNTDOWN, ENGINES ON.",
      parsedText: "MAJOR TOM. COMMENCING COUNTDOWN, ENGINES ON.",
      characterCount: 40,
      layoutType: "heart",
      symbols: ["Star"],
      lines: [
        { text: "MAJOR TOM", y: 160, fontSize: 26 },
        { text: "COMMENCING COUNTDOWN", y: 210, fontSize: 14 },
        { text: "ENGINES ON", y: 240, fontSize: 14 }
      ]
    }
  }
];

export const DUMMY_ROLES: UserRole[] = [
  {
    id: 'role_admin',
    name: 'Master Admin',
    description: 'Full system access. Can manage financials, users, and global settings.',
    permissions: MODULE_LIST.map(m => ({ moduleId: m.id, moduleName: m.name, level: 'WRITE' }))
  }
];

export const DUMMY_PRODUCTS: Product[] = [
  {
    id: 'P-001',
    name: 'Standard Ogee',
    sku: 'OG-01',
    category: 'Headstones',
    material: 'Black Granite',
    price: 1200,
    stock: 15,
    shape: 'ogee' as StoneShape,
    dimensions: { height: 750, width: 600, thickness: 75 }
  },
  {
    id: 'P-002',
    name: 'Classic Square',
    sku: 'SQ-01',
    category: 'Headstones',
    material: 'Grey Granite',
    price: 950,
    stock: 8,
    shape: 'square' as StoneShape,
    dimensions: { height: 600, width: 600, thickness: 75 }
  }
];

export const DUMMY_PAYMENTS: PaymentRecord[] = [
  { id: 'PAY-001', orderId: 'ORD-102', customerName: 'Brenda Jarvie', amount: 617, date: '2024-01-10', method: 'Card', status: 'Cleared' }
];

export const DUMMY_MESSAGES: Message[] = [
  { id: 'msg_1', from: 'Brenda Jarvie', subject: 'Proof approval', preview: 'The inscription looks perfect...', date: '2 hours ago', channel: 'email', linkedOrderId: 'ORD-102', isRead: false }
];

export const DUMMY_PEOPLE: Person[] = [
  { id: 'P-001', name: 'Alice Thompson', role: 'Customer', email: 'alice@example.com', phone: '0151 555 0101' },
  { id: 'P-002', name: 'Mark Mason', role: 'Worker', email: 'mark@churchillmemorials.co.uk', phone: '0151 555 0102' }
];

export const DUMMY_NOTIFICATIONS: AppNotification[] = [
  { 
    id: 'ai_cemetery_1', title: 'AI Match: Cemetery Permit', 
    message: 'AI detected a permit approval email from Landican Office matching ORD-101.', 
    time: 'Just Now', type: 'ai', status: 'success', 
    linkedTabId: 'orders', linkedResourceId: 'ORD-101'
  }
];
