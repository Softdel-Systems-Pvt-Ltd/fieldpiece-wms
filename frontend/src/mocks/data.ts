import { addDays, addMonths, subDays } from "date-fns";
import { toIsoDate } from "@/lib/format";
import type {
  Address,
  AdminUser,
  Attachment,
  Claim,
  ClaimEvent,
  ClaimStatus,
  Customer,
  FailureCategory,
  Product,
  Registration,
  Rma,
  Role,
  WarrantyPolicy,
} from "@/types";

// In-memory store for MSW, shaped exactly like the API's responses. SAMPLE DATA ONLY. [CONFIRM real SKUs]
// `resetMockDb()` rebuilds it, so each test starts from the same state.

const TODAY = new Date();
const iso = (d: Date) => d.toISOString();

export interface MockUser {
  id: string;
  email: string;
  displayName: string;
  roles: Role[];
  organization: { id: string; name: string; type: "fieldpiece" | "distributor" | "service_center" } | null;
}

const ORG = {
  fieldpiece: { id: "org-fp", name: "Fieldpiece Instruments", type: "fieldpiece" as const },
  distributor: { id: "org-acme", name: "Acme HVAC Supply", type: "distributor" as const },
  serviceCenter: { id: "org-svc", name: "Fieldpiece Service Center", type: "service_center" as const },
};

export const SERVICE_CENTER_ADDRESS: Address = {
  line1: "1636 W Collins Ave",
  city: "Orange",
  region: "CA",
  postalCode: "92867",
  country: "US",
};
const OWNER_ADDRESS: Address = {
  line1: "200 Service Rd",
  city: "Fresno",
  region: "CA",
  postalCode: "93650",
  country: "US",
};

function build() {
  const users: MockUser[] = [
    {
      id: "u-tech",
      email: "tech@example.com",
      displayName: "Sam Tech",
      roles: ["technician"],
      organization: null,
    },
    {
      id: "u-dist",
      email: "dist@example.com",
      displayName: "Dana Distributor",
      roles: ["distributor"],
      organization: ORG.distributor,
    },
    {
      id: "u-agent",
      email: "agent@example.com",
      displayName: "Casey Agent",
      roles: ["claims_agent"],
      organization: ORG.fieldpiece,
    },
    {
      id: "u-svc",
      email: "svc@example.com",
      displayName: "Riley Bench",
      roles: ["service_center"],
      organization: ORG.serviceCenter,
    },
    {
      id: "u-admin",
      email: "admin@example.com",
      displayName: "Alex Admin",
      roles: ["admin"],
      organization: ORG.fieldpiece,
    },
  ];

  const product = (
    i: number,
    sku: string,
    name: string,
    family: Product["family"],
    months: number,
    launch: string,
  ): Product => ({
    id: `p-${i}`,
    sku,
    name,
    family,
    serialPattern: null,
    launchDate: launch,
    imageUrl: null,
    isActive: true,
    warrantyMonths: months,
    registrationBonusMonths: 12,
  });
  const products: Product[] = [
    product(1, "SC680", "Wireless clamp meter", "meters", 36, "2019-01-15"),
    product(2, "SMAN460", "Wireless digital manifold", "gauges", 36, "2018-06-01"),
    product(3, "VP85", "Vacuum pump, 8 CFM", "vacuum", 24, "2017-03-01"),
    product(4, "DR82", "Refrigerant leak detector", "leak_detection", 12, "2020-02-01"),
    product(5, "CAT45", "Combustion analyzer", "combustion", 24, "2021-05-01"),
    product(6, "STA2", "Hot wire anemometer", "airflow", 12, "2016-09-01"),
  ];

  const policies: WarrantyPolicy[] = [
    {
      id: "pol-default",
      productId: null,
      sku: null,
      baseMonths: 12,
      registrationBonusMonths: 12,
      registrationWindowDays: 60,
      coverage: ["manufacturing_defects"],
      exclusions: ["physical_damage", "misuse", "consumables"],
      effectiveFrom: "2015-01-01",
      effectiveTo: null,
      inUse: true,
    },
  ];

  const categories: FailureCategory[] = [
    { code: "connectivity", label: "Connectivity", requiresPhoto: false },
    { code: "display", label: "Display", requiresPhoto: true },
    { code: "inaccurate_reading", label: "Inaccurate reading", requiresPhoto: false },
    { code: "leak", label: "Leak", requiresPhoto: false },
    { code: "no_power", label: "No power", requiresPhoto: false },
    { code: "other", label: "Other", requiresPhoto: false },
    { code: "physical", label: "Physical damage", requiresPhoto: true },
  ];

  const customers: Customer[] = [
    {
      id: "c-1",
      companyName: null,
      contactName: "Sam Tech",
      email: "tech@example.com",
      phone: null,
      address: OWNER_ADDRESS,
      distributorId: null,
      hasLogin: true,
      createdAt: iso(subDays(TODAY, 400)),
    },
    {
      id: "c-2",
      companyName: "Northside Heating & Air",
      contactName: "Jordan Lee",
      email: "jordan@example.com",
      phone: "555-0100",
      address: OWNER_ADDRESS,
      distributorId: ORG.distributor.id,
      hasLogin: false,
      createdAt: iso(subDays(TODAY, 300)),
    },
    {
      id: "c-3",
      companyName: "Coastal Refrigeration",
      contactName: "Morgan Diaz",
      email: "morgan@example.com",
      phone: null,
      address: { ...OWNER_ADDRESS, city: "San Diego" },
      distributorId: ORG.distributor.id,
      hasLogin: false,
      createdAt: iso(subDays(TODAY, 200)),
    },
  ];

  const registration = (
    i: number,
    sku: string,
    daysAgo: number,
    customer: Customer,
    createdBy: string,
  ): Registration & { createdBy: string } => {
    const p = products.find((x) => x.sku === sku)!;
    const purchase = subDays(TODAY, daysAgo);
    const end = subDays(addMonths(purchase, p.warrantyMonths ?? 12), 1);
    const daysLeft = (end.getTime() - TODAY.getTime()) / 86_400_000;
    return {
      id: `reg-${i}`,
      serialNumber: `${sku}-${String(100000 + i * 37)}`,
      sku,
      productName: p.name,
      customerId: customer.id,
      customerName: customer.companyName ?? customer.contactName,
      distributorId: customer.distributorId,
      policyId: "pol-default",
      purchaseDate: toIsoDate(purchase),
      warrantyStart: toIsoDate(purchase),
      warrantyEnd: toIsoDate(end),
      status: daysLeft < 0 ? "EXPIRED" : daysLeft <= 60 ? "EXPIRING_SOON" : "ACTIVE",
      replacesRegistrationId: null,
      certificateReady: true,
      version: 1,
      createdAt: iso(addDays(purchase, 3)),
      createdBy,
    };
  };
  const registrations = [
    registration(1, "SC680", 120, customers[0]!, "u-tech"),
    registration(2, "SMAN460", 700, customers[0]!, "u-tech"),
    registration(3, "VP85", 690, customers[1]!, "u-dist"),
    registration(4, "DR82", 30, customers[1]!, "u-dist"),
    registration(5, "STA2", 500, customers[2]!, "u-dist"),
    registration(6, "CAT45", 200, customers[2]!, "u-dist"),
  ];

  const statuses: ClaimStatus[] = [
    "SUBMITTED",
    "IN_REVIEW",
    "NEEDS_INFO",
    "APPROVED",
    "RMA_ISSUED",
    "IN_TRANSIT",
    "RECEIVED",
    "REPAIRED",
    "REJECTED",
    "CLOSED",
    "DRAFT",
  ];
  const claimCategories = [
    "no_power",
    "inaccurate_reading",
    "display",
    "connectivity",
    "physical",
    "leak",
    "other",
  ];
  const events: Record<string, ClaimEvent[]> = {};
  const claims: (Claim & { createdById: string; distributorId: string | null })[] = Array.from(
    { length: 24 },
    (_, index) => {
      const reg = registrations[index % registrations.length]!;
      const status = statuses[index % statuses.length]!;
      const created = subDays(TODAY, (index * 3) % 45);
      const id = `claim-${index + 1}`;
      const creator = users.find((u) => u.id === reg.createdBy)!;
      events[id] = [
        {
          id: `${id}-e1`,
          at: iso(created),
          actor: { id: creator.id, name: creator.displayName, role: creator.roles[0]! },
          type: "created",
          fromStatus: null,
          toStatus: "DRAFT",
          comment: null,
          internal: false,
        },
        {
          id: `${id}-e2`,
          at: iso(addDays(created, 1)),
          actor: { id: "u-agent", name: "Casey Agent", role: "claims_agent" },
          type: "comment",
          fromStatus: null,
          toStatus: null,
          comment: "Checked the serial against the batch recall list: not affected.",
          internal: true,
        },
      ];
      return {
        id,
        displayNo: `CLM-${String(index + 1).padStart(6, "0")}`,
        registrationId: reg.id,
        serialNumber: reg.serialNumber,
        sku: reg.sku,
        productName: reg.productName,
        failureCategory: claimCategories[index % claimCategories.length]!,
        status,
        inWarranty: reg.status !== "EXPIRED",
        assignee: index % 3 === 0 ? null : { id: "u-agent", name: "Casey Agent" },
        slaDueAt: status === "DRAFT" ? null : iso(addDays(created, 3)),
        submittedAt: status === "DRAFT" ? null : iso(created),
        createdAt: iso(created),
        updatedAt: iso(addDays(created, 1)),
        version: 1,
        description:
          "Unit powers on but the reading drifts after a few minutes on the job. Checked against a second meter.",
        failureDate: toIsoDate(subDays(created, 2)),
        preferredResolution: "repair",
        resolution: null,
        rejectionReason: status === "REJECTED" ? "physical_damage" : null,
        returnAddress: OWNER_ADDRESS,
        customerName: reg.customerName,
        createdBy: { id: creator.id, name: creator.displayName },
        warranty: { status: reg.status, warrantyEnd: reg.warrantyEnd },
        rma: null,
        attachments: [],
        allowedActions: [],
        createdById: creator.id,
        distributorId: reg.distributorId,
      };
    },
  );

  const rmas: Rma[] = [];
  for (const claim of claims.filter((c) =>
    ["RMA_ISSUED", "IN_TRANSIT", "RECEIVED", "REPAIRED"].includes(c.status),
  )) {
    const status =
      claim.status === "RMA_ISSUED"
        ? "ISSUED"
        : claim.status === "REPAIRED"
          ? "COMPLETED"
          : (claim.status as "IN_TRANSIT" | "RECEIVED");
    const rma: Rma = {
      id: `rma-${rmas.length + 1}`,
      displayNo: `RMA-${String(rmas.length + 1).padStart(6, "0")}`,
      claimId: claim.id,
      claimDisplayNo: claim.displayNo,
      serialNumber: claim.serialNumber,
      sku: claim.sku,
      productName: claim.productName,
      type: "repair",
      status,
      serviceCenter: { id: ORG.serviceCenter.id, name: ORG.serviceCenter.name },
      shipTo: SERVICE_CENTER_ADDRESS,
      returnAddress: claim.returnAddress,
      inboundCarrier: status === "ISSUED" ? null : "UPS",
      inboundTracking: status === "ISSUED" ? null : "1Z999AA10123456784",
      outboundCarrier: null,
      outboundTracking: null,
      inspectionNotes: null,
      rootCause: null,
      partsUsed: [],
      replacementSerial: null,
      creditAmount: null,
      creditCurrency: null,
      completedAt: status === "COMPLETED" ? claim.updatedAt : null,
      version: 1,
      createdAt: claim.updatedAt,
      updatedAt: claim.updatedAt,
    };
    rmas.push(rma);
    claim.rma = { id: rma.id, displayNo: rma.displayNo, status: rma.status, type: rma.type };
  }

  const adminUsers: AdminUser[] = users.map((u) => ({
    id: u.id,
    email: u.email,
    displayName: u.displayName,
    roles: u.roles,
    organizationId: u.organization?.id ?? null,
    organizationName: u.organization?.name ?? null,
    isActive: true,
    lastLoginAt: iso(subDays(TODAY, 1)),
    createdAt: iso(subDays(TODAY, 500)),
  }));

  return {
    users,
    products,
    policies,
    categories,
    customers,
    registrations,
    claims,
    events,
    rmas,
    adminUsers,
    attachments: [] as (Attachment & { uploadedBy: string })[],
  };
}

export let db = build();

export function resetMockDb(): void {
  db = build();
}
