// ─── Auth ────────────────────────────────────────────────────────────────────
export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'MANAGER';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  tenantCode?: string;
  tenantId?: string;
  tenantStatus?: TenantStatus;
  trialEndsAt?: string | null;
  phone?: string;
  photo?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

// ─── API Response ─────────────────────────────────────────────────────────────
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

export interface ApiError {
  success: false;
  statusCode: number;
  message: string;
  timestamp: string;
  path: string;
}

export interface PaginatedData<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ─── Tenant / Plan ────────────────────────────────────────────────────────────
export type TenantStatus = 'TRIAL' | 'ACTIVE' | 'EXPIRED' | 'PAYMENT_PENDING' | 'SUSPENDED';
export type PlanName = 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE';

export interface Plan {
  id: string;
  name: PlanName;
  price: number;
  managerLimit: number;
  technicianLimit: number;
  ticketLimit: number;
  storageLimitGb: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Subscription {
  id: string;
  tenantId: string;
  planId: string;
  plan?: Plan;
  startDate: string;
  endDate: string;
  isActive: boolean;
  createdAt: string;
}

export interface Tenant {
  id: string;
  companyName: string;
  tenantCode: string;
  email: string;
  phone: string;
  address: string;
  adminName: string;
  adminEmail: string;
  status: TenantStatus;
  trialEndsAt?: string | null;
  selectedPlanId?: string | null;
  selectedPlan?: Plan | null;
  plan?: Plan;
  subscription?: Subscription;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface CreateTenantDto {
  companyName: string;
  tenantCode: string;
  email: string;
  phone: string;
  address: string;
  adminName: string;
  adminEmail: string;
  adminPassword: string;
  plan?: PlanName;
}

export interface TenantBranding {
  companyName: string;
  tenantCode?: string;
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  status?: TenantStatus;
  trialDaysLeft?: number | null;
}

// ─── Billing / Activity ───────────────────────────────────────────────────────
export interface Billing {
  id: string;
  tenantId: string;
  subscriptionId: string;
  tenant?: Tenant;
  subscription?: { plan?: Plan; startDate?: string; endDate?: string };
  amount: number;
  status: 'PAID' | 'PENDING' | 'FAILED';
  paidAt?: string;
  createdAt: string;
}

export interface TenantInfo {
  companyName: string;
  tenantCode: string;
  logoUrl: string | null;
  status?: TenantStatus;
  trialDaysLeft?: number | null;
}

export interface PlatformUpi {
  upiId: string | null;
  upiAccountName: string | null;
  upiQrImageUrl: string | null;
}

export interface MySubscription {
  subscription: (Subscription & { plan: Plan }) | null;
  pendingBill: Billing | null;
  billingHistory: Billing[];
  paymentInfo: PlatformUpi;
}

export interface BillingReport {
  billings: Billing[];
  summary: { totalPaid: number; totalPending: number };
}

export interface ActivityLog {
  id: string;
  userId: string;
  user?: User;
  entity: string;
  action: string;
  module?: string;
  ipAddress?: string;
  details?: Record<string, unknown>;
  createdAt: string;
}

// ─── Super Admin Reports ──────────────────────────────────────────────────────
export interface SuperAdminRevenueReport {
  total: number;
  byPlan: Partial<Record<PlanName, number>>;
  byTenant: Array<{ tenantId: string; tenantName: string; amount: number }>;
  payments: Array<{
    id: string;
    tenantName: string;
    planName: string;
    amount: number;
    status: string;
    paidAt?: string;
    createdAt: string;
  }>;
}

// ─── People ───────────────────────────────────────────────────────────────────
export interface Manager {
  id: string;
  name: string;
  email: string;
  phone: string;
  isActive: boolean;
  createdAt: string;
}

export interface Technician {
  id: string;
  name: string;
  email: string;
  phone: string;
  isActive: boolean;
  rating?: number;
  photo?: string;
  location?: { lat: number; lng: number };
  createdAt: string;
}

export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone: string;
  address?: string;
  createdAt: string;
}

// ─── Skill ────────────────────────────────────────────────────────────────────
export interface Skill {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
}

export interface TechnicianSkill {
  skillId: string;
  skill: Skill;
  experienceLevel: string;
  certificationNumber?: string;
  certificationExpiryDate?: string;
}

// ─── Service ──────────────────────────────────────────────────────────────────
export interface ServiceCategory {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: string;
}

export interface ServiceCharge {
  subCategoryId: string;
  serviceCharge: number;
  inspectionCharge: number;
  emergencyCharge: number;
}

export interface ServiceSubCategory {
  id: string;
  categoryId: string;
  category?: ServiceCategory;
  name: string;
  isActive: boolean;
  serviceCharges?: ServiceCharge;
  createdAt: string;
}

// ─── Ticket ───────────────────────────────────────────────────────────────────
export type TicketStatus =
  | 'NEW_TICKET' | 'ASSIGNED' | 'ACCEPTED' | 'TRAVELLING'
  | 'REACHED_LOCATION' | 'IN_PROGRESS' | 'PENDING'
  | 'COMPLETED' | 'INVOICE_GENERATED' | 'TICKET_CLOSED' | 'CANCELLED';

export interface StatusLog {
  id: string;
  status: TicketStatus;
  notes?: string;
  createdAt: string;
  updatedBy?: User;
}

export interface TicketImage {
  id: string;
  type: 'BEFORE' | 'AFTER' | 'RAISED' | 'SIGNATURE';
  imageUrl: string;
  createdAt: string;
}

export interface Ticket {
  id: string;
  ticketNumber: string;
  status: TicketStatus;
  description?: string;
  serviceAddress?: string;
  pendingReason?: string;
  pendingNotes?: string;
  customer: Customer;
  technician?: Technician;
  subCategory?: ServiceSubCategory;
  scheduledAt?: string;
  notes?: string;
  statusLogs: StatusLog[];
  images?: TicketImage[];
  payment?: Payment;
  invoice?: Invoice;
  feedback?: Feedback;
  createdAt: string;
  updatedAt: string;
}

// ─── Payment / Invoice ────────────────────────────────────────────────────────
export type PaymentStatus = 'PENDING' | 'COLLECTED' | 'VERIFIED' | 'FAILED';
export type PaymentMethod = 'CASH' | 'UPI' | 'CARD' | 'ONLINE';

export interface Payment {
  id: string;
  ticketId: string;
  ticket?: Ticket;
  amount: number;
  status: PaymentStatus;
  method?: PaymentMethod;
  collectedAt?: string;
  verifiedAt?: string;
  createdAt: string;
}

export interface Invoice {
  id: string;
  ticketId: string;
  ticket?: Ticket;
  invoiceNumber: string;
  amount: number;
  gstAmount?: number;
  totalAmount: number;
  pdfUrl?: string;
  createdAt: string;
}

// ─── Feedback / Attendance ────────────────────────────────────────────────────
export interface Feedback {
  id: string;
  ticketId: string;
  customer?: Customer;
  technician?: Technician;
  rating: number;
  review?: string;
  createdAt: string;
}

export interface Attendance {
  id: string;
  technician: Technician;
  date: string;
  checkInTime?: string;
  checkOutTime?: string;
  checkInLat?: number;
  checkInLng?: number;
}

// ─── Offers ───────────────────────────────────────────────────────────────────
export type DiscountType = 'PERCENTAGE' | 'FLAT';
export type OfferType = 'SERVICE' | 'CATEGORY' | 'GENERAL';

export interface Offer {
  id: string;
  title: string;
  description?: string;
  offerType: OfferType;
  discountType: DiscountType;
  discountValue: number;
  serviceId?: string;
  categoryId?: string;
  startDate: string;
  endDate: string;
  isRecurring: boolean;
  daysOfWeek?: string[];
  isActive: boolean;
  createdAt: string;
}

// ─── Dashboards ───────────────────────────────────────────────────────────────
export interface SuperAdminDashboard {
  totalTenants: number;
  activeTenants: number;
  expiredTenants: number;
  suspendedTenants: number;
  totalRevenue: number;
  activeUsers: number;
}

export interface PlanUsageEntry {
  current: number;
  limit: number | string;
}

export interface PlanUsage {
  plan: string;
  usage: {
    managers: PlanUsageEntry;
    technicians: PlanUsageEntry;
    tickets: PlanUsageEntry;
    storage: PlanUsageEntry;
  };
}

export interface AdminDashboard {
  totalTickets: number;
  openTickets: number;
  totalTechnicians: number;
  totalCustomers: number;
  monthlyRevenue: number;
  planUsage: PlanUsage | null;
  subscription: {
    tenantStatus: TenantStatus | null;
    isTrial: boolean;
    trialDaysLeft: number | null;
    trialEndsAt: string | null;
    currentPlan: { name: string } | null;
  } | null;
}

export interface ManagerDashboard {
  totalTickets: number;
  newTickets: number;
  assignedTickets: number;
  inProgressTickets: number;
  pendingTickets: number;
  completedTickets: number;
  totalTechnicians: number;
  pendingPayments: number;
  planUsage: PlanUsage | null;
}

// ─── Settings ─────────────────────────────────────────────────────────────────
export interface CompanySettings {
  id: string;
  companyName: string;
  email: string;
  phone: string;
  address: string;
  logoUrl?: string;
  contactPerson?: string;
  city?: string;
  state?: string;
  pincode?: string;
}

export interface TenantSettings {
  id: string;
  gstEnabled: boolean;
  gstPercent?: number;
  invoicePrefix?: string;
  invoiceNumberFormat?: string;
  upiId?: string;
  upiAccountName?: string;
  upiQrImageUrl?: string;
}

export interface AppSettings {
  id: string;
  platformFee: number;
  taxPercentage: number;
  shippingCharge: number;
  handlingCharge: number;
  shippingEnabled: boolean;
  handlingEnabled: boolean;
  dailyDiscount: number;
  weeklyDiscount: number;
  monthlyDiscount: number;
  dailyDiscountEnabled: boolean;
  weeklyDiscountEnabled: boolean;
  monthlyDiscountEnabled: boolean;
}

// ─── Reports ──────────────────────────────────────────────────────────────────
export interface RevenueReport {
  payments: Array<{
    id: string;
    ticketNumber: string;
    amount: number;
    method: PaymentMethod;
    date: string;
    customer: string;
  }>;
  total: number;
  byMethod: Partial<Record<PaymentMethod, number>>;
}

export interface TicketReport {
  byStatus: Partial<Record<TicketStatus, number>>;
}

export interface TechnicianReportRow {
  id: string;
  name: string;
  totalTickets: number;
  attendanceDays: number;
  rating: number;
}

export interface AuditLog {
  id: string;
  userId: string;
  user?: User;
  entity: string;
  action: string;
  changes?: Record<string, unknown>;
  createdAt: string;
}
