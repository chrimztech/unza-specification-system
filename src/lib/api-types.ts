/** Mirrors the Spring backend's DTOs (backend/src/main/java/.../dto/**). */

export type AppRole =
  | "requester"
  | "manager"
  | "cict_reviewer"
  | "cict_manager"
  | "procurement"
  | "stores"
  | "cict_support"
  | "auditor"
  | "admin";

export type RequestStatus =
  | "draft"
  | "pending_manager"
  | "pending_cict"
  | "needs_clarification"
  | "approved"
  | "procurement"
  | "purchased"
  | "in_stores"
  | "completed"
  | "return_required"
  | "rejected"
  | "withdrawn";

export type OrgUnitResponse = {
  id: string;
  code: string;
  name: string;
  unitType: string;
  parentId: string | null;
  campus: string | null;
  active: boolean;
  createdAt: string;
};

export type UserRefResponse = {
  id: string;
  fullName: string;
  email: string;
};

export type UserResponse = {
  id: string;
  email: string;
  fullName: string;
  staffNumber: string | null;
  jobTitle: string | null;
  positionLevel: string | null;
  phone: string | null;
  campus: string | null;
  orgUnit: OrgUnitResponse | null;
  active: boolean;
  roles: AppRole[];
  createdAt: string;
  updatedAt: string;
};

export type UserRoleResponse = {
  id: string;
  userId: string;
  role: AppRole;
};

export type LoginResponse = {
  token: string;
  user: UserResponse;
};

export type LookupValueResponse = {
  id: string;
  listKey: string;
  value: string;
  label: string;
  sortOrder: number;
  active: boolean;
};

export type AppSettingResponse = {
  key: string;
  value: string;
  description: string | null;
};

export type EquipmentCategoryResponse = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  icon: string | null;
  assetClass: string | null;
  typicalLifespanYears: number | null;
  standardWarrantyMonths: number | null;
  indicativeUnitCost: number | null;
  requiresCictReview: boolean;
  requiresNetworkPort: boolean;
  requiresSoftwareLicence: boolean;
  eligiblePositionLevels: string[];
  procurementLeadTimeDays: number | null;
  supportNotes: string | null;
  policyReference: string | null;
  active: boolean;
  sortOrder: number;
};

export type SpecProfileResponse = {
  id: string;
  categoryId: string;
  categoryCode: string;
  categoryName: string;
  tier: string;
  name: string;
  summary: string | null;
  specs: Record<string, unknown>;
  suitsPositionLevels: string[];
  version: number;
  active: boolean;
  createdAt: string;
};

export type RequestItemResponse = {
  id: string;
  categoryId: string | null;
  categoryCode: string | null;
  categoryName: string | null;
  quantity: number;
  intendedUsers: string | null;
  location: string | null;
  isShared: boolean;
  purpose: string | null;
  requiredSoftware: string | null;
  proposedSpec: string | null;
  recommendedProfile: SpecProfileResponse | null;
  approvedProfile: SpecProfileResponse | null;
  approvedSpecSnapshot: Record<string, unknown> | null;
  exceptionJustification: string | null;
  reviewerNote: string | null;
  sortOrder: number;
};

export type RequestResponse = {
  id: string;
  reference: string;
  requester: UserRefResponse;
  submittedBy: UserRefResponse;
  requestedFor: string | null;
  onBehalfOf: UserRefResponse | null;
  orgUnit: OrgUnitResponse | null;
  orgUnitName: string | null;
  manager: UserRefResponse | null;
  title: string | null;
  justification: string | null;
  requestType: string | null;
  businessContext: string | null;
  impactIfNotProvided: string | null;
  priority: string | null;
  priorityReason: string | null;
  requiredBy: string | null;
  fundingSource: string | null;
  costCentre: string | null;
  budgetStatus: string | null;
  estimatedBudget: number | null;
  existingAssetTag: string | null;
  existingAssetDetails: string | null;
  replacementReason: string | null;
  declarationAccepted: boolean;
  declarationAt: string | null;
  status: RequestStatus;
  managerDecisionNote: string | null;
  managerDecidedAt: string | null;
  cictDecisionNote: string | null;
  cictDecidedBy: UserRefResponse | null;
  cictDecidedAt: string | null;
  submittedAt: string | null;
  createdAt: string;
  updatedAt: string;
  items: RequestItemResponse[];
};

export type RequestEventResponse = {
  id: string;
  actorId: string | null;
  actorName: string | null;
  action: string;
  fromStatus: RequestStatus | null;
  toStatus: RequestStatus | null;
  comment: string | null;
  createdAt: string;
};

export type RequestAttachmentResponse = {
  id: string;
  requestId: string;
  fileName: string;
  contentType: string | null;
  sizeBytes: number | null;
  kind: string;
  uploadedById: string;
  createdAt: string;
};

export type DelegationResponse = {
  id: string;
  delegator: UserRefResponse;
  delegate: UserRefResponse;
  reason: string | null;
  startsAt: string | null;
  endsAt: string | null;
  active: boolean;
  createdAt: string;
};

export type AuditLogResponse = {
  id: string;
  actorId: string | null;
  actorEmail: string | null;
  entityType: string;
  entityId: string | null;
  action: string;
  details: string | null;
  createdAt: string;
};

export type NotificationResponse = {
  id: string;
  requestId: string | null;
  title: string;
  body: string;
  category: string | null;
  readAt: string | null;
  createdAt: string;
};

export type EvaluationResult = "pass" | "fail";
export type VerificationResult = "pass" | "needs_return";

export type EvaluationResponse = {
  id: string;
  reference: string;
  quotationId: string;
  result: EvaluationResult;
  notes: string | null;
  evaluatedBy: UserRefResponse | null;
  evaluatedAt: string;
};

export type QuotationResponse = {
  id: string;
  requestId: string;
  vendorName: string;
  amount: number;
  currency: string;
  notes: string | null;
  submittedBy: UserRefResponse | null;
  createdAt: string;
  evaluations: EvaluationResponse[];
};

export type PurchaseResponse = {
  id: string;
  requestId: string;
  quotationId: string | null;
  purchaseOrderNumber: string | null;
  vendorName: string;
  amount: number;
  currency: string;
  purchasedBy: UserRefResponse | null;
  purchasedAt: string;
  notes: string | null;
};

export type StoresReceiptResponse = {
  id: string;
  requestId: string;
  purchaseId: string | null;
  receivedBy: UserRefResponse | null;
  receivedAt: string;
  conditionNotes: string | null;
};

export type VerificationResponse = {
  id: string;
  reference: string;
  requestId: string;
  storesReceiptId: string | null;
  result: VerificationResult;
  notes: string | null;
  verifiedBy: UserRefResponse | null;
  verifiedAt: string;
};
