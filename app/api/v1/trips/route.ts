import { withApi } from "@/lib/api-handler";
import { created, ok } from "@/lib/api-response";
import { parseJsonBody, parseQuery } from "@/lib/api-request";
import { listTripsQuerySchema, tripInputSchema } from "@/lib/validations/trip.schema";
import { createTrip, listTrips } from "@/controller/trip.controller";

export const dynamic = "force-dynamic";

export const GET = withApi({ auth: "session" }, async ({ request, actor }) => {
  const query = parseQuery(request, listTripsQuerySchema);
  const result = await listTrips(actor, query);
  return ok(result.items, { page: result.page, pageSize: result.pageSize, total: result.total });
});

export const POST = withApi({ auth: "session" }, async ({ request, actor }) => {
  const input = await parseJsonBody(request, tripInputSchema);
  return created(await createTrip(actor, input));
});