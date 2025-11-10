import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/_index.tsx"),
  route("admin", "routes/admin.tsx", [
    index("routes/admin/dashboard.tsx"),
    route("users", "routes/admin/users.tsx"),
    route("memberships", "routes/admin/memberships.tsx"),
    route("memberships/:id", "routes/admin/membership-detail.tsx"),
    route("benefits", "routes/admin/benefits.tsx"),
    route("benefits/:id", "routes/admin/benefit-detail.tsx"),
    route("services", "routes/admin/services.tsx"),
    route("services/:id", "routes/admin/service-detail.tsx"),
    route("credentials", "routes/admin/credentials.tsx"),
    route("credentials/:id", "routes/admin/credential-detail.tsx"),
  ]),
  route("client", "routes/client.tsx", [
    route("benefits", "routes/client/benefits.tsx"),
    route("membership", "routes/client/membership.tsx"),
    route("checkin", "routes/client/checkin.tsx"),
  ]),
  // Legacy dashboard route for backwards compatibility
  route("dashboard", "routes/dashboard.tsx", [
    route("users", "routes/users.tsx"),
    route("memberships", "routes/memberships.tsx"),
    route("memberships/:id", "routes/membership-detail.tsx"),
    route("credentials", "routes/credentials.tsx"),
    route("credentials/:id", "routes/credential-detail.tsx"),
    route("tools", "routes/tools.tsx"),
  ]),
] satisfies RouteConfig;
