
export enum MainStatus {
  ENQUIRY = 'Enquiry/Quote',
  INVOICE_SENT = 'Invoice Sent',
  DEPOSIT_PAID = 'Deposit Paid',
  FORM_SENT = 'Form Sent',
  CUSTOMER_COMPLETED = 'Customer Completed',
  PENDING = 'Pending',
  PERMIT_APPROVED = 'Permit Approved',
  INSTALL = 'Install',
  COMPLETE = 'Complete'
}

export enum StoneStatus {
  NA = 'NA',
  PRE_APPROVED = 'Pre-Approved',
  ORDERED = 'Ordered',
  IN_PRODUCTION = 'In Production',
  READY_FOR_COLLECTION = 'Ready for Collection',
  IN_STOCK = 'In-stock & Reserved',
  NEEDS_COLLECTION = 'Needs Collection',
  COLLECTED = 'Collected',
  ONSITE = 'Onsite'
}

export enum ProofStatus {
  NOT_RECEIVED = 'Not Received',
  INSCRIPTION_RECEIVED = 'Inscription Received',
  AI_DRAFTED = 'AI Drafted',
  AWAITING_REVIEW = 'AWAITING REVIEW',
  AWAITING_CLIENT = 'AWAITING CLIENT',
  CHANGES_REQUESTED = 'Changes Requested',
  IN_PROGRESS = 'In Progress',
  LETTERED = 'Lettered'
}

export enum PermitPhase {
  REQUIRED = 'Required',
  SEARCHING = 'Searching',
  FORM_FOUND = 'Form Found',
  PREFILLED = 'Pre-filled',
  SENT_FOR_SIGNATURE = 'Awaiting Signature',
  SUBMITTED_TO_COUNCIL = 'Submitted to Council',
  APPROVED = 'Approved',
  REJECTED = 'Rejected'
}

export interface PermitForm {
  id: string;
  authorityName: string;
  formName: string;
  sourceUrl?: string;
  drivePath?: string;
  lastUpdated: string;
}

export interface PermitRecord {
  orderId: string;
  phase: PermitPhase;
  formId?: string;
  submissionDate?: string;
  approvalDate?: string;
  fee: number;
  notes?: string;
  readinessScore: number; // 0-100
}

export type PermissionLevel = 'NONE' | 'READ' | 'WRITE';

export interface ModulePermission {
  moduleId: string;
  moduleName: string;
  level: PermissionLevel;
}

export interface UserRole {
  id: string;
  name: string;
  description: string;
  permissions: ModulePermission[];
}

export interface ProofComment {
  id: string;
  author: 'Customer' | 'Mason';
  text: string;
  timestamp: string;
}

export interface InscriptionVersion {
  id: string;
  text: string;
  characterCount: number;
  timestamp: string;
  author: string;
  notes?: string;
}

export interface Inscription {
  rawText: string;
  parsedText: string;
  characterCount: number;
  layoutType: string;
  symbols: string[];
  lines?: { text: string; y: number; fontSize: number }[];
  versions?: InscriptionVersion[];
  publicLink?: string;
  comments?: ProofComment[];
}

export interface Job {
  assignedWorkerId?: string;
  foundationDate?: string;
  fixDate?: string;
  notes?: string;
  cemeterySection?: string;
  graveNumber?: string;
}

export interface InvoiceRecord {
  id: string;
  amount: number;
  type: 'Deposit' | 'Balance' | 'Permit';
  status: 'Draft' | 'Sent' | 'Paid';
  stripeLink?: string;
  dateSent?: string;
}

export interface Order {
  id: string;
  type: 'New Memorial' | 'Renovation' | 'Kerb Set' | 'Additional Inscription';
  sku: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  cemetery: string;
  deceasedName: string;
  mainStatus: MainStatus;
  stoneStatus: StoneStatus;
  proofStatus: ProofStatus;
  permitStatus?: PermitRecord;
  baseValue: number;
  permitCost: number;
  paidAmount: number;
  depositDate?: string;
  installationDate?: string;
  dueInDays: number;
  messagesCount: number;
  timelineWeeks: number;
  inscription?: Inscription;
  job?: Job;
  invoices?: InvoiceRecord[];
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface Person {
  id: string;
  name: string;
  role: 'Customer' | 'Worker' | 'Council Contact';
  roleId?: string; // Reference to UserRole.id
  email: string;
  phone: string;
  address?: string;
}

export type StoneShape = 'ogee' | 'half-round' | 'square' | 'heart' | 'kerb-set';

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  material: string;
  price: number;
  stock: number;
  image?: string;
  shape: StoneShape;
  dimensions: {
    height: number; // mm
    width: number;  // mm
    thickness: number; // mm
  };
}

export interface PaymentRecord {
  id: string;
  orderId: string;
  customerName: string;
  amount: number;
  date: string;
  method: 'Bank Transfer' | 'Card' | 'Cash';
  status: 'Cleared' | 'Pending';
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  time: string;
  type: 'alert' | 'activity' | 'ai';
  status: 'success' | 'warning' | 'info' | 'error';
  linkedTabId?: string;
  linkedResourceId?: string;
  author?: string;
  deceasedName?: string;
  cemetery?: string;
  material?: string;
  contactId?: string;
}

export interface Message {
  id: string;
  from: string;
  subject: string;
  preview: string;
  date: string;
  channel: 'email' | 'whatsapp' | 'sms';
  linkedOrderId?: string;
  isRead: boolean;
  aiDetectedInscription?: boolean;
}
