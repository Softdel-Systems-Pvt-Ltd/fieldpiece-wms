import { delay, http, HttpResponse } from "msw";
import { allowedActions, nextStatus, TRANSITIONS } from "@/features/claims/transitions";
import { env } from "@/lib/env";
import { formatClaimId, normalizeSerial } from "@/lib/format";
import type { ApiErrorBody, Claim, ClaimAction, ClaimEvent, Paginated, RmaAction, RmaStatus } from "@/types";
import { db, type MockUser, SERVICE_CENTER_ADDRESS } from "./data";

// MSW handlers for every endpoint the app uses (Section 9), mirroring the real API's contract: same
// paths, shapes, error codes, scoping and state rules (backend/src/modules/*). They let the frontend run
// and be tested without the backend. When the API changes, change these in the same PR.

const pathOf = (url: string) => new URL(url, "http://localhost").pathname.replace(/\/$/, "");
const api = (path: string) => `*${pathOf(env.apiBaseUrl)}${path}`;
const idp = (path: string) => `*${pathOf(env.oidcAuthority)}${path}`;

const LATENCY = import.meta.env.MODE === "test" ? 0 : 150;
/** Stand-in for an uploaded product photo (mock mode never stores real bytes). */
const MOCK_PHOTO =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect x="30" y="15" width="40" height="70" rx="6" fill="gold" stroke="black" stroke-width="3"/><rect x="37" y="24" width="26" height="18" fill="black"/></svg>',
  );
const SESSION_KEY = "fp-wms-mock-session";

const fail = (status: number, code: string, message: string, extra: Partial<ApiErrorBody> = {}) =>
  HttpResponse.json<ApiErrorBody>({ code, message, requestId: crypto.randomUUID(), ...extra }, { status });

// ── Identity (dev IdP) ───────────────────────────────────────────────

function sessionEmail(): string | null {
  try {
    return globalThis.sessionStorage?.getItem(SESSION_KEY) ?? null;
  } catch {
    return null;
  }
}

function userFrom(request: Request): MockUser | null {
  const email = request.headers.get("authorization")?.replace(/^Bearer mock\./, "");
  return db.users.find((u) => u.email === email) ?? null;
}

const primary = (u: MockUser) =>
  (["admin", "claims_agent", "service_center", "distributor", "technician"] as const).find((r) =>
    u.roles.includes(r),
  ) ?? null;
const isStaff = (u: MockUser) => u.roles.some((r) => r === "claims_agent" || r === "admin");

function page<T>(items: T[], url: URL): Paginated<T> {
  const pageNo = Math.max(1, Number(url.searchParams.get("page")) || 1);
  const pageSize = Math.min(100, Number(url.searchParams.get("pageSize")) || 25);
  return {
    items: items.slice((pageNo - 1) * pageSize, pageNo * pageSize),
    total: items.length,
    page: pageNo,
    pageSize,
  };
}

function sortBy<T>(items: T[], sort: string | null): T[] {
  if (!sort) return items;
  const desc = sort.startsWith("-");
  const key = sort.replace(/^-/, "") as keyof T;
  return [...items].sort((a, b) => {
    const cmp = String(a[key] ?? "").localeCompare(String(b[key] ?? ""));
    return desc ? -cmp : cmp;
  });
}

/** Version check for If-Match (Section 6.5). */
function staleVersion(request: Request, version: number): Response | null {
  const header = request.headers.get("if-match");
  if (!header) return fail(428, "PRECONDITION_REQUIRED", "This change needs an If-Match header.");
  return Number(/"(\d+)"/.exec(header)?.[1]) === version
    ? null
    : fail(409, "STALE_VERSION", "Someone else changed this record. Reload it and try again.");
}

// ── Scoping (backend Section 7.2) ────────────────────────────────────

const claimVisible = (u: MockUser, c: (typeof db.claims)[number]) =>
  isStaff(u) ||
  (u.roles.includes("service_center") && !!c.rma) ||
  (u.roles.includes("distributor") && c.distributorId === u.organization?.id) ||
  c.createdById === u.id;

const registrationVisible = (u: MockUser, r: (typeof db.registrations)[number]) =>
  isStaff(u) ||
  (u.roles.includes("distributor") && r.distributorId === u.organization?.id) ||
  r.createdBy === u.id;

function claimView(u: MockUser, c: (typeof db.claims)[number]): Claim {
  const { createdById: _c, distributorId: _d, ...claim } = c;
  return { ...claim, allowedActions: allowedActions(c.status, u.roles) };
}

function addEvent(claimId: string, u: MockUser, event: Partial<ClaimEvent>) {
  const list = (db.events[claimId] ??= []);
  const created: ClaimEvent = {
    id: `${claimId}-e${list.length + 1}`,
    at: new Date().toISOString(),
    actor: { id: u.id, name: u.displayName, role: primary(u) },
    type: "comment",
    fromStatus: null,
    toStatus: null,
    comment: null,
    internal: false,
    ...event,
  };
  list.push(created);
  return created;
}

// ── Handlers ─────────────────────────────────────────────────────────

const PATH_TO_ACTION = Object.fromEntries(
  (Object.keys(TRANSITIONS) as ClaimAction[]).map((a) => [
    a.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`),
    a,
  ]),
) as Record<string, ClaimAction>;

export const handlers = [
  http.get(idp("/users"), () =>
    HttpResponse.json(db.users.map((u) => ({ email: u.email, displayName: u.displayName, roles: u.roles }))),
  ),
  http.post(idp("/token"), async ({ request }) => {
    const { email } = (await request.json()) as { email: string };
    if (!db.users.some((u) => u.email === email))
      return fail(401, "UNAUTHENTICATED", "Unknown test identity.");
    try {
      globalThis.sessionStorage?.setItem(SESSION_KEY, email);
    } catch {
      // ignore
    }
    return HttpResponse.json({ accessToken: `mock.${email}`, tokenType: "Bearer", expiresIn: 900 });
  }),
  http.post(idp("/refresh"), () => {
    const email = sessionEmail();
    return email
      ? HttpResponse.json({ accessToken: `mock.${email}`, tokenType: "Bearer", expiresIn: 900 })
      : fail(401, "UNAUTHENTICATED", "No session.");
  }),
  http.post(idp("/logout"), () => {
    try {
      globalThis.sessionStorage?.removeItem(SESSION_KEY);
    } catch {
      // ignore
    }
    return new HttpResponse(null, { status: 204 });
  }),

  // Public lookup
  http.get(api("/warranty/check"), async ({ request }) => {
    await delay(LATENCY);
    const serial = normalizeSerial(new URL(request.url).searchParams.get("serial") ?? "");
    if (serial === "RATELIMIT")
      return fail(429, "RATE_LIMITED", "Too many requests. Wait a minute, then try again.");
    const reg = db.registrations.find((r) => r.serialNumber === serial);
    const product = db.products.find((p) => p.sku === (reg?.sku ?? serial.split("-")[0]));
    if (!product)
      return fail(
        404,
        "NOT_FOUND",
        "Serial number not found. Check the label on the back of the unit, or register it first.",
      );
    return HttpResponse.json({
      serialNumber: serial,
      product: { sku: product.sku, name: product.name, family: product.family, imageUrl: product.imageUrl },
      registered: !!reg,
      warrantyStatus: reg?.status ?? "NOT_REGISTERED",
      warrantyEnd: reg?.warrantyEnd ?? null,
    });
  }),

  // Everything below requires a user.
  http.all(api("/*"), ({ request }) =>
    userFrom(request) ? undefined : fail(401, "UNAUTHENTICATED", "Sign in to continue."),
  ),

  http.get(api("/me"), ({ request }) => {
    const u = userFrom(request)!;
    const permissions = isStaff(u) ? ["claims:review", "reports:view"] : [];
    return HttpResponse.json({
      id: u.id,
      email: u.email,
      displayName: u.displayName,
      roles: u.roles,
      primaryRole: primary(u),
      organization: u.organization,
      currency: "USD",
      permissions,
    });
  }),

  http.get(api("/products"), ({ request }) => {
    const url = new URL(request.url);
    const q = url.searchParams.get("q")?.toLowerCase();
    const family = url.searchParams.get("family");
    const items = db.products.filter(
      (p) =>
        (!q || p.sku.toLowerCase().includes(q) || p.name.toLowerCase().includes(q)) &&
        (!family || p.family === family),
    );
    return HttpResponse.json(page(sortBy(items, url.searchParams.get("sort") ?? "sku"), url));
  }),
  // Product photos: presigned PUT to the fake storage host, then attach. Mock mode has no real bytes, so the
  // attached photo is a placeholder image.
  http.post(api("/products/:sku/image/upload-url"), ({ params }) => {
    const key = `products/${String(params.sku)}/${crypto.randomUUID()}`;
    return HttpResponse.json(
      {
        key,
        uploadUrl: `https://mock-storage.local/${key}`,
        method: "PUT",
        headers: { "Content-Type": "image/png" },
        expiresAt: new Date(Date.now() + 300_000).toISOString(),
      },
      { status: 201 },
    );
  }),
  http.put("https://mock-storage.local/products/:sku/:id", () => new HttpResponse(null, { status: 200 })),
  http.put(api("/products/:sku/image"), ({ params }) => {
    const product = db.products.find((x) => x.sku === params.sku);
    if (!product) return fail(404, "NOT_FOUND", "Product not found.");
    product.imageUrl = MOCK_PHOTO;
    return HttpResponse.json(product);
  }),
  http.delete(api("/products/:sku/image"), ({ params }) => {
    const product = db.products.find((x) => x.sku === params.sku);
    if (!product) return fail(404, "NOT_FOUND", "Product not found.");
    product.imageUrl = null;
    return HttpResponse.json(product);
  }),
  http.get(api("/products/:sku"), ({ params }) => {
    const p = db.products.find((x) => x.sku === params.sku);
    return p ? HttpResponse.json(p) : fail(404, "NOT_FOUND", "Product not found.");
  }),
  http.get(api("/failure-categories"), () => HttpResponse.json({ items: db.categories })),

  // Registrations
  http.get(
    api("/registrations/import-template"),
    () =>
      new HttpResponse(
        "serialNumber,sku,purchaseDate,contactName,companyName,email,phone,line1,line2,city,region,postalCode,country\n",
        {
          headers: { "Content-Type": "text/csv" },
        },
      ),
  ),
  http.get(api("/registrations"), async ({ request }) => {
    await delay(LATENCY);
    const u = userFrom(request)!;
    const url = new URL(request.url);
    const q = url.searchParams.get("q")?.toUpperCase();
    const serial = url.searchParams.get("serial")?.toUpperCase();
    const status = url.searchParams.get("status");
    const items = db.registrations.filter(
      (r) =>
        registrationVisible(u, r) &&
        (!q || r.serialNumber.includes(q)) &&
        (!serial || r.serialNumber === serial) &&
        (!status || r.status === status) &&
        (!url.searchParams.get("customerId") || r.customerId === url.searchParams.get("customerId")),
    );
    return HttpResponse.json(
      page(
        sortBy(
          items.map(({ createdBy: _c, ...r }) => r),
          url.searchParams.get("sort") ?? "-createdAt",
        ),
        url,
      ),
    );
  }),
  http.post(api("/registrations"), async ({ request }) => {
    await delay(LATENCY);
    const u = userFrom(request)!;
    const body = (await request.json()) as {
      serialNumber: string;
      sku: string;
      purchaseDate: string;
      customer?: { contactName: string; companyName?: string };
    };
    const existing = db.registrations.find(
      (r) => r.serialNumber === body.serialNumber && r.status !== "VOID",
    );
    if (existing) {
      const ownedByYou = existing.createdBy === u.id;
      return fail(409, "REGISTRATION_DUPLICATE_SERIAL", "This unit is already registered.", {
        details: { ownedByYou, ...(ownedByYou ? { registrationId: existing.id } : {}) },
      });
    }
    const product = db.products.find((p) => p.sku === body.sku);
    if (!product)
      return fail(422, "PRODUCT_NOT_FOUND", "We don't recognise that product.", {
        fieldErrors: { sku: ["Unknown product."] },
      });
    const purchase = new Date(`${body.purchaseDate}T00:00:00Z`);
    const end = new Date(purchase);
    end.setUTCMonth(
      end.getUTCMonth() + (product.warrantyMonths ?? 12) + (product.registrationBonusMonths ?? 0),
    );
    end.setUTCDate(end.getUTCDate() - 1);
    const created = {
      id: `reg-${db.registrations.length + 1}`,
      serialNumber: body.serialNumber,
      sku: product.sku,
      productName: product.name,
      customerId: "c-new",
      customerName: body.customer?.companyName || body.customer?.contactName || u.displayName,
      distributorId: u.roles.includes("distributor") ? (u.organization?.id ?? null) : null,
      policyId: "pol-default",
      purchaseDate: body.purchaseDate,
      warrantyStart: body.purchaseDate,
      warrantyEnd: end.toISOString().slice(0, 10),
      status: "ACTIVE" as const,
      replacesRegistrationId: null,
      certificateReady: false,
      version: 1,
      createdAt: new Date().toISOString(),
      createdBy: u.id,
    };
    db.registrations.unshift(created);
    const { createdBy: _c, ...response } = created;
    return HttpResponse.json(response, { status: 201 });
  }),
  http.get(api("/registrations/:id/certificate"), ({ params }) => {
    const reg = db.registrations.find((r) => r.id === params.id);
    if (!reg) return fail(404, "NOT_FOUND", "Registration not found.");
    return reg.certificateReady
      ? HttpResponse.json({ url: "about:blank", expiresAt: new Date().toISOString() })
      : fail(409, "CERTIFICATE_NOT_READY", "The certificate is still being generated.");
  }),
  http.post(api("/registrations/imports"), () =>
    HttpResponse.json(
      {
        jobId: crypto.randomUUID(),
        state: "queued",
        total: 0,
        processed: 0,
        succeeded: 0,
        failed: 0,
        message: null,
        errorReportUrl: null,
      },
      { status: 201 },
    ),
  ),
  http.get(api("/imports/:jobId"), ({ params }) =>
    HttpResponse.json({
      jobId: params.jobId,
      state: "completed",
      total: 3,
      processed: 3,
      succeeded: 2,
      failed: 1,
      message: null,
      errorReportUrl: "about:blank",
    }),
  ),

  // Claims
  http.get(api("/claims"), async ({ request }) => {
    await delay(LATENCY);
    const u = userFrom(request)!;
    const url = new URL(request.url);
    const q = url.searchParams.get("q")?.toUpperCase();
    const statuses = url.searchParams.get("status")?.split(",");
    const assignedTo = url.searchParams.get("assignedTo");
    const items = db.claims.filter(
      (c) =>
        claimVisible(u, c) &&
        (!q || c.displayNo.includes(q) || c.serialNumber.includes(q)) &&
        (!statuses || statuses.includes(c.status)) &&
        (!url.searchParams.get("displayNo") || c.displayNo === url.searchParams.get("displayNo")) &&
        (!url.searchParams.get("registrationId") ||
          c.registrationId === url.searchParams.get("registrationId")) &&
        (!assignedTo ||
          (assignedTo === "me"
            ? c.assignee?.id === u.id
            : assignedTo === "unassigned"
              ? !c.assignee
              : c.assignee?.id === assignedTo)),
    );
    return HttpResponse.json(
      page(
        sortBy(
          items.map((c) => claimView(u, c)),
          url.searchParams.get("sort") ?? "-updatedAt",
        ),
        url,
      ),
    );
  }),
  http.post(api("/claims"), async ({ request }) => {
    const u = userFrom(request)!;
    const body = (await request.json()) as {
      registrationId?: string;
      serialNumber?: string;
      failureCategory: string;
      failureDate: string;
      description: string;
    };
    const reg = db.registrations.find(
      (r) =>
        (body.registrationId ? r.id === body.registrationId : r.serialNumber === body.serialNumber) &&
        registrationVisible(u, r),
    );
    if (!reg)
      return fail(
        422,
        "REGISTRATION_NOT_FOUND",
        "We couldn't find that unit among your registered products.",
      );
    const n = db.claims.length + 1;
    const now = new Date().toISOString();
    const claim = {
      ...db.claims[0]!,
      ...body,
      id: `claim-${n}`,
      displayNo: formatClaimId(n),
      registrationId: reg.id,
      serialNumber: reg.serialNumber,
      sku: reg.sku,
      productName: reg.productName,
      status: "DRAFT" as const,
      assignee: null,
      slaDueAt: null,
      submittedAt: null,
      createdAt: now,
      updatedAt: now,
      version: 1,
      rma: null,
      attachments: [],
      customerName: reg.customerName,
      createdBy: { id: u.id, name: u.displayName },
      warranty: { status: reg.status, warrantyEnd: reg.warrantyEnd },
      createdById: u.id,
      distributorId: reg.distributorId,
    };
    db.claims.unshift(claim);
    addEvent(claim.id, u, { type: "created", toStatus: "DRAFT" });
    return HttpResponse.json(claimView(u, claim), { status: 201 });
  }),
  http.get(api("/claims/:id"), ({ request, params }) => {
    const u = userFrom(request)!;
    const claim = db.claims.find((c) => c.id === params.id);
    return claim && claimVisible(u, claim)
      ? HttpResponse.json(claimView(u, claim))
      : fail(404, "NOT_FOUND", "Claim not found.");
  }),
  http.patch(api("/claims/:id"), async ({ request, params }) => {
    const u = userFrom(request)!;
    const claim = db.claims.find((c) => c.id === params.id && claimVisible(u, c));
    if (!claim) return fail(404, "NOT_FOUND", "Claim not found.");
    const stale = staleVersion(request, claim.version);
    if (stale) return stale;
    const { attachmentIds: _a, ...body } = (await request.json()) as Record<string, unknown>;
    Object.assign(claim, body, { version: claim.version + 1, updatedAt: new Date().toISOString() });
    return HttpResponse.json(claimView(u, claim));
  }),
  http.get(api("/claims/:id/events"), ({ request, params }) => {
    const u = userFrom(request)!;
    const claim = db.claims.find((c) => c.id === params.id);
    if (!claim || !claimVisible(u, claim)) return fail(404, "NOT_FOUND", "Claim not found.");
    const staff = u.roles.some((r) => r === "claims_agent" || r === "service_center" || r === "admin");
    return HttpResponse.json({
      items: (db.events[claim.id] ?? []).filter((e) => staff || !e.internal),
      nextCursor: null,
    });
  }),
  http.post(api("/claims/:id/comments"), async ({ request, params }) => {
    const u = userFrom(request)!;
    const claim = db.claims.find((c) => c.id === params.id && claimVisible(u, c));
    if (!claim) return fail(404, "NOT_FOUND", "Claim not found.");
    const body = (await request.json()) as { comment: string; internal?: boolean };
    return HttpResponse.json(
      addEvent(claim.id, u, { type: "comment", comment: body.comment, internal: !!body.internal }),
      { status: 201 },
    );
  }),
  http.post(api("/claims/:id/assign"), async ({ request, params }) => {
    const u = userFrom(request)!;
    const claim = db.claims.find((c) => c.id === params.id);
    if (!claim) return fail(404, "NOT_FOUND", "Claim not found.");
    const stale = staleVersion(request, claim.version);
    if (stale) return stale;
    const { assigneeId } = (await request.json()) as { assigneeId: string | null };
    const assignee = db.users.find((x) => x.id === assigneeId);
    Object.assign(claim, {
      assignee: assignee ? { id: assignee.id, name: assignee.displayName } : null,
      version: claim.version + 1,
    });
    return HttpResponse.json(claimView(u, claim));
  }),
  http.post(api("/claims/:id/:action"), async ({ request, params }) => {
    await delay(LATENCY);
    const u = userFrom(request)!;
    const claim = db.claims.find((c) => c.id === params.id && claimVisible(u, c));
    if (!claim) return fail(404, "NOT_FOUND", "Claim not found.");
    const action = PATH_TO_ACTION[String(params.action)];
    if (!action) return fail(404, "NOT_FOUND", "Unknown action.");
    if (!TRANSITIONS[action].roles.some((r) => u.roles.includes(r)))
      return fail(403, "FORBIDDEN", "You can't take this action on the claim.");
    const to = nextStatus(claim.status, action);
    if (!to) return fail(409, "CLAIM_INVALID_TRANSITION", `A claim in status ${claim.status} can't do that.`);
    const stale = staleVersion(request, claim.version);
    if (stale) return stale;
    const body = (await request.json().catch(() => ({}))) as {
      message?: string;
      comment?: string;
      reason?: string;
      resolution?: "repair" | "replace" | "credit";
    };
    const from = claim.status;
    claim.status = to;
    claim.version += 1;
    claim.updatedAt = new Date().toISOString();
    if (action === "submit")
      Object.assign(claim, {
        submittedAt: claim.updatedAt,
        slaDueAt: new Date(Date.now() + 2 * 86_400_000).toISOString(),
      });
    if (action === "startReview" && !claim.assignee) claim.assignee = { id: u.id, name: u.displayName };
    if (action === "reject") claim.rejectionReason = body.reason ?? null;
    addEvent(claim.id, u, {
      type: "status_changed",
      fromStatus: from,
      toStatus: to,
      comment: body.message ?? body.comment ?? null,
    });
    if (action === "approve" && body.resolution) {
      const n = db.rmas.length + 1;
      const rma = {
        ...db.rmas[0]!,
        id: `rma-${n}`,
        displayNo: `RMA-${String(n).padStart(6, "0")}`,
        claimId: claim.id,
        claimDisplayNo: claim.displayNo,
        serialNumber: claim.serialNumber,
        sku: claim.sku,
        productName: claim.productName,
        type: body.resolution,
        status: "ISSUED" as const,
        shipTo: SERVICE_CENTER_ADDRESS,
        inboundTracking: null,
        inboundCarrier: null,
        completedAt: null,
        version: 1,
      };
      db.rmas.unshift(rma);
      Object.assign(claim, {
        resolution: body.resolution,
        status: "RMA_ISSUED",
        rma: { id: rma.id, displayNo: rma.displayNo, status: rma.status, type: rma.type },
      });
      addEvent(claim.id, u, {
        type: "status_changed",
        fromStatus: "APPROVED",
        toStatus: "RMA_ISSUED",
        comment: `RMA ${rma.displayNo} issued`,
      });
    }
    return HttpResponse.json(claimView(u, claim));
  }),

  // RMAs
  http.get(api("/rmas"), ({ request }) => {
    const url = new URL(request.url);
    const statuses = url.searchParams.get("status")?.split(",");
    return HttpResponse.json(
      page(
        db.rmas.filter((r) => !statuses || statuses.includes(r.status)),
        url,
      ),
    );
  }),
  http.get(api("/rmas/:id"), ({ request, params }) => {
    const u = userFrom(request)!;
    const rma = db.rmas.find((r) => r.id === params.id);
    if (!rma) return fail(404, "NOT_FOUND", "RMA not found.");
    const actions: Record<RmaStatus, RmaAction[]> = {
      ISSUED: ["shipInbound", "receive", "cancel"],
      IN_TRANSIT: ["receive", "cancel"],
      RECEIVED: ["inspect", "complete"],
      INSPECTED: ["complete"],
      COMPLETED: [],
      CANCELLED: [],
    };
    const mine =
      isStaff(u) || u.roles.includes("service_center")
        ? actions[rma.status]
        : actions[rma.status].filter((a) => a === "shipInbound");
    return HttpResponse.json({ ...rma, allowedActions: mine });
  }),
  http.post(api("/rmas/:id/:action"), async ({ request, params }) => {
    const rma = db.rmas.find((r) => r.id === params.id);
    if (!rma) return fail(404, "NOT_FOUND", "RMA not found.");
    const stale = staleVersion(request, rma.version);
    if (stale) return stale;
    const next: Record<string, RmaStatus> = {
      "ship-inbound": "IN_TRANSIT",
      receive: "RECEIVED",
      inspect: "INSPECTED",
      complete: "COMPLETED",
      cancel: "CANCELLED",
    };
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    Object.assign(rma, {
      status: next[String(params.action)] ?? rma.status,
      version: rma.version + 1,
      inboundTracking: body.trackingNumber ?? rma.inboundTracking,
      inspectionNotes: body.findings ?? rma.inspectionNotes,
    });
    return HttpResponse.json({ ...rma, allowedActions: [] });
  }),

  // Customers
  http.get(api("/customers"), ({ request }) => HttpResponse.json(page(db.customers, new URL(request.url)))),
  http.get(api("/customers/:id"), ({ params }) => {
    const c = db.customers.find((x) => x.id === params.id);
    return c ? HttpResponse.json(c) : fail(404, "NOT_FOUND", "Customer not found.");
  }),

  // Reports
  http.get(api("/reports/claims-summary"), ({ request }) => {
    const u = userFrom(request)!;
    if (!isStaff(u) && !u.roles.includes("distributor"))
      return fail(403, "FORBIDDEN", "You don't have access to this.");
    const counts = new Map<string, number>();
    db.claims.forEach((c) => counts.set(c.status, (counts.get(c.status) ?? 0) + 1));
    return HttpResponse.json({
      from: "2026-06-25",
      to: "2026-09-23",
      byStatus: [...counts].map(([status, count]) => ({ status, count })),
      claimsSubmitted: { current: 21, previous: 18 },
      registrations: { current: 128, previous: 114 },
      openClaims: db.claims.filter((c) => !["DRAFT", "CLOSED", "REJECTED", "REPAIRED"].includes(c.status))
        .length,
      unassigned: db.claims.filter((c) => !c.assignee).length,
      slaBreached: 3,
      avgResolutionDays: 6.3,
      claimsOverTime: Array.from({ length: 10 }, (_, i) => ({
        date: `2026-09-${String(i + 10).padStart(2, "0")}`,
        count: ((i * 7) % 5) + 1,
      })),
    });
  }),
  http.get(api("/reports/claim-rate-by-sku"), () =>
    HttpResponse.json({
      items: db.products.map((p, i) => ({
        sku: p.sku,
        name: p.name,
        registrations: 40 + i * 5,
        claims: 2 + i,
        rate: (2 + i) / (40 + i * 5),
      })),
    }),
  ),
  http.get(api("/reports/failure-categories"), () =>
    HttpResponse.json({
      items: db.categories.map((c, i) => ({ category: c.code, label: c.label, count: 7 - i })),
    }),
  ),
  http.get(api("/reports/resolution-time"), () =>
    HttpResponse.json({
      items: [
        { week: "2026-08-31", avgDays: 6.1, count: 4 },
        { week: "2026-09-07", avgDays: 5.4, count: 6 },
        { week: "2026-09-14", avgDays: 4.8, count: 5 },
      ],
    }),
  ),
  http.get(api("/reports/cost"), () =>
    HttpResponse.json({
      items: [
        { type: "repair", count: 9, creditTotal: "0", currency: null },
        { type: "credit", count: 2, creditTotal: "498.00", currency: "USD" },
      ],
    }),
  ),

  // Admin
  http.get(api("/users"), ({ request }) => HttpResponse.json(page(db.adminUsers, new URL(request.url)))),
  http.patch(api("/users/:id"), async ({ request, params }) => {
    const user = db.adminUsers.find((x) => x.id === params.id);
    if (!user) return fail(404, "NOT_FOUND", "User not found.");
    Object.assign(user, await request.json());
    return HttpResponse.json(user);
  }),
  http.get(api("/policies"), () => HttpResponse.json({ items: db.policies })),
  http.post(api("/policies"), async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const created = { ...db.policies[0]!, ...body, id: crypto.randomUUID(), productId: null, inUse: false };
    db.policies.push(created as (typeof db.policies)[number]);
    return HttpResponse.json(created, { status: 201 });
  }),

  // Attachments: presigned upload to a fake storage host, confirm, instant CLEAN scan.
  http.post(api("/attachments/upload-url"), async ({ request }) => {
    const u = userFrom(request)!;
    const body = (await request.json()) as {
      fileName: string;
      mimeType: string;
      sizeBytes: number;
      ownerType: "registration" | "claim" | "rma" | "import";
    };
    const attachment = {
      id: crypto.randomUUID(),
      ownerType: body.ownerType,
      ownerId: null,
      fileName: body.fileName,
      mimeType: body.mimeType,
      sizeBytes: body.sizeBytes,
      scanStatus: "PENDING" as const,
      uploaded: false,
      createdAt: new Date().toISOString(),
      uploadedBy: u.id,
    };
    db.attachments.push(attachment);
    const { uploadedBy: _u, ...response } = attachment;
    return HttpResponse.json(
      {
        attachment: response,
        uploadUrl: `https://mock-storage.local/${attachment.id}`,
        method: "PUT",
        headers: { "Content-Type": body.mimeType },
        expiresAt: new Date(Date.now() + 300_000).toISOString(),
      },
      { status: 201 },
    );
  }),
  http.put("https://mock-storage.local/:id", () => new HttpResponse(null, { status: 200 })),
  http.post(api("/attachments/:id/confirm"), ({ params }) => {
    const a = db.attachments.find((x) => x.id === params.id);
    if (!a) return fail(404, "NOT_FOUND", "Attachment not found.");
    Object.assign(a, { uploaded: true, scanStatus: "CLEAN" });
    return HttpResponse.json(a);
  }),
  http.get(api("/attachments/:id"), ({ params }) => {
    const a = db.attachments.find((x) => x.id === params.id);
    return a ? HttpResponse.json(a) : fail(404, "NOT_FOUND", "Attachment not found.");
  }),
  http.get(api("/attachments/:id/download-url"), () =>
    HttpResponse.json({ url: "about:blank", expiresAt: new Date().toISOString() }),
  ),
];
