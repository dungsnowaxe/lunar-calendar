import { n as TSS_SERVER_FUNCTION, r as getServerFnById, t as createServerFn } from "../server.js";
import { z } from "zod";
//#region ../../node_modules/.pnpm/@tanstack+start-server-core@1.169.34/node_modules/@tanstack/start-server-core/dist/esm/createSsrRpc.js
var createSsrRpc = (functionId) => {
	const url = "/_serverFn/" + functionId;
	const serverFnMeta = { id: functionId };
	const fn = async (...args) => {
		return (await getServerFnById(functionId, { origin: "server" }))(...args);
	};
	return Object.assign(fn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
//#endregion
//#region src/server/events.ts
/**
* Memorial events (ngày giỗ) — one shared list for the whole family. The
* lunar date below is the canonical, stored representation; occurrences
* always follow the regular month (tháng thường) and solar dates are
* computed with @lunar/core, never persisted.
*/
var eventIdSchema = z.string().uuid("Sự kiện không hợp lệ");
var listEventsFn = createServerFn({ method: "GET" }).handler(createSsrRpc("843a52cf3611e3d4a5fb527b96a2e54ba850c2fcf02b4d8da39aa1dab5a5c224"));
var createEventFn = createServerFn({ method: "POST" }).validator((d) => d).handler(createSsrRpc("c70d2f796367565e1cab2630f01fdabdd62b38543ded06532a5cc005564593b3"));
var updateEventFn = createServerFn({ method: "POST" }).validator((d) => d).handler(createSsrRpc("0bbd6b1cc8e058c8ae1252211c0e38d9de1018694f719f4ca829b993838e2020"));
var deleteEventFn = createServerFn({ method: "POST" }).validator((d) => eventIdSchema.safeParse(d)).handler(createSsrRpc("2aa734092e26281bb25f1a6b2551eb4f4b734fb1bfb3d17cc28775863e075f11"));
//#endregion
export { updateEventFn as i, deleteEventFn as n, listEventsFn as r, createEventFn as t };
