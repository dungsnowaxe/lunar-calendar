import { a as setCookie, i as getCookies, n as TSS_SERVER_FUNCTION, t as createServerFn } from "../server.js";
import { z } from "zod";
import { createServerClient } from "@supabase/ssr";
//#region ../../node_modules/.pnpm/@tanstack+start-server-core@1.169.34/node_modules/@tanstack/start-server-core/dist/esm/createServerRpc.js
var createServerRpc = (serverFnMeta, splitImportFn) => {
	const url = "/_serverFn/" + serverFnMeta.id;
	return Object.assign(splitImportFn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
//#endregion
//#region src/utils/supabase.ts
function getSupabaseServerClient() {
	return createServerClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, { cookies: {
		getAll() {
			return Object.entries(getCookies()).map(([name, value]) => ({
				name,
				value
			}));
		},
		setAll(cookies) {
			cookies.forEach((cookie) => {
				setCookie(cookie.name, cookie.value);
			});
		}
	} });
}
//#endregion
//#region src/server/events.ts?tss-serverfn-split
/**
* Memorial events (ngày giỗ) — one shared list for the whole family. The
* lunar date below is the canonical, stored representation; occurrences
* always follow the regular month (tháng thường) and solar dates are
* computed with @lunar/core, never persisted.
*/
var eventInputSchema = z.object({
	title: z.string().trim().min(1, "Vui lòng nhập tên sự kiện").max(120, "Tên sự kiện tối đa 120 ký tự"),
	lunarDay: z.number().int("Ngày âm lịch không hợp lệ").min(1, "Ngày âm lịch phải từ 1 đến 30").max(30, "Ngày âm lịch phải từ 1 đến 30"),
	lunarMonth: z.number().int("Tháng âm lịch không hợp lệ").min(1, "Tháng âm lịch phải từ 1 đến 12").max(12, "Tháng âm lịch phải từ 1 đến 12"),
	notes: z.string().trim().max(500, "Ghi chú tối đa 500 ký tự").nullish().transform((v) => v || null)
});
var eventIdSchema = z.string().uuid("Sự kiện không hợp lệ");
var eventInputSchemaWithId = eventInputSchema.extend({ id: eventIdSchema });
function firstIssue(error) {
	return error.issues[0]?.message ?? "Dữ liệu không hợp lệ";
}
function mapRow(row) {
	return {
		id: row.id,
		title: row.title,
		lunarDay: row.lunar_day,
		lunarMonth: row.lunar_month,
		notes: row.notes,
		createdAt: row.created_at
	};
}
var listEventsFn_createServerFn_handler = createServerRpc({
	id: "843a52cf3611e3d4a5fb527b96a2e54ba850c2fcf02b4d8da39aa1dab5a5c224",
	name: "listEventsFn",
	filename: "src/server/events.ts"
}, (opts) => listEventsFn.__executeServer(opts));
var listEventsFn = createServerFn({ method: "GET" }).handler(listEventsFn_createServerFn_handler, async () => {
	const { data, error } = await getSupabaseServerClient().from("memorial_events").select("id, title, lunar_day, lunar_month, notes, created_at").order("lunar_month", { ascending: true }).order("lunar_day", { ascending: true });
	if (error) throw new Error(`Không thể tải sự kiện: ${error.message}`);
	return data.map(mapRow);
});
var createEventFn_createServerFn_handler = createServerRpc({
	id: "c70d2f796367565e1cab2630f01fdabdd62b38543ded06532a5cc005564593b3",
	name: "createEventFn",
	filename: "src/server/events.ts"
}, (opts) => createEventFn.__executeServer(opts));
var createEventFn = createServerFn({ method: "POST" }).validator((d) => d).handler(createEventFn_createServerFn_handler, async ({ data }) => {
	const parsed = eventInputSchema.safeParse(data);
	if (!parsed.success) return { error: firstIssue(parsed.error) };
	const { data: row, error } = await getSupabaseServerClient().from("memorial_events").insert({
		title: parsed.data.title,
		lunar_day: parsed.data.lunarDay,
		lunar_month: parsed.data.lunarMonth,
		notes: parsed.data.notes
	}).select("id, title, lunar_day, lunar_month, notes, created_at").single();
	if (error) return { error: `Không thể tạo sự kiện: ${error.message}` };
	return { event: mapRow(row) };
});
var updateEventFn_createServerFn_handler = createServerRpc({
	id: "0bbd6b1cc8e058c8ae1252211c0e38d9de1018694f719f4ca829b993838e2020",
	name: "updateEventFn",
	filename: "src/server/events.ts"
}, (opts) => updateEventFn.__executeServer(opts));
var updateEventFn = createServerFn({ method: "POST" }).validator((d) => d).handler(updateEventFn_createServerFn_handler, async ({ data }) => {
	const parsed = eventInputSchemaWithId.safeParse(data);
	if (!parsed.success) return { error: firstIssue(parsed.error) };
	const { data: row, error } = await getSupabaseServerClient().from("memorial_events").update({
		title: parsed.data.title,
		lunar_day: parsed.data.lunarDay,
		lunar_month: parsed.data.lunarMonth,
		notes: parsed.data.notes
	}).eq("id", parsed.data.id).select("id, title, lunar_day, lunar_month, notes, created_at").single();
	if (error) return { error: `Không thể cập nhật sự kiện: ${error.message}` };
	return { event: mapRow(row) };
});
var deleteEventFn_createServerFn_handler = createServerRpc({
	id: "2aa734092e26281bb25f1a6b2551eb4f4b734fb1bfb3d17cc28775863e075f11",
	name: "deleteEventFn",
	filename: "src/server/events.ts"
}, (opts) => deleteEventFn.__executeServer(opts));
var deleteEventFn = createServerFn({ method: "POST" }).validator((d) => eventIdSchema.safeParse(d)).handler(deleteEventFn_createServerFn_handler, async ({ data }) => {
	if (!data.success) return { error: firstIssue(data.error) };
	const { error } = await getSupabaseServerClient().from("memorial_events").delete().eq("id", data.data);
	if (error) return { error: `Không thể xóa sự kiện: ${error.message}` };
	return { ok: true };
});
//#endregion
export { createEventFn_createServerFn_handler, deleteEventFn_createServerFn_handler, listEventsFn_createServerFn_handler, updateEventFn_createServerFn_handler };
