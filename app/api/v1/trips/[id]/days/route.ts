import { withApi } from "@/lib/api-handler";
import { ok } from "@/lib/api-response";
import { listTripDays, regenerateTripDays } from "@/controller/trip.controller";

export const dynamic = "force-dynamic";

export const GET = withApi({ auth: "session" }, async ({ actor, params }) => {
  return ok(await listTripDays(actor, params.id));
});

export const POST = withApi({ auth: "session" }, async ({ actor, params }) => {
  return ok(await regenerateTripDays(actor, params.id));
});