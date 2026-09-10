import { r as listEventsFn } from "./events-6t-XPqrQ.js";
import "react";
import { HeadContent, Link, Outlet, Scripts, createFileRoute, createRootRoute, createRouter, lazyRouteComponent, useLocation, useRouter } from "@tanstack/react-router";
import { jsx, jsxs } from "react/jsx-runtime";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { HugeiconsIcon } from "@hugeicons/react";
import { Alert02Icon, CheckmarkCircle02Icon, InformationCircleIcon, Loading03Icon, Moon02Icon, MultiplicationSignCircleIcon } from "@hugeicons/core-free-icons";
import { useTheme } from "next-themes";
import { Toaster } from "sonner";
//#region \0rolldown/runtime.js
var __defProp = Object.defineProperty;
var __exportAll = (all, no_symbols) => {
	let target = {};
	for (var name in all) __defProp(target, name, {
		get: all[name],
		enumerable: true
	});
	if (!no_symbols) __defProp(target, Symbol.toStringTag, { value: "Module" });
	return target;
};
//#endregion
//#region src/components/DefaultCatchBoundary.tsx
function DefaultCatchBoundary({ error }) {
	const router = useRouter();
	const isRoot = useLocation({ select: (location) => location.pathname === "/" });
	console.error(error);
	return /* @__PURE__ */ jsxs("div", {
		className: "min-w-0 flex-1 p-4 flex flex-col items-center justify-center gap-6",
		children: [/* @__PURE__ */ jsxs("div", {
			className: "flex flex-col items-center gap-3 text-center",
			children: [/* @__PURE__ */ jsx("h1", {
				className: "font-heading text-xl font-semibold",
				children: "Đã xảy ra lỗi!"
			}), /* @__PURE__ */ jsx("p", {
				className: "max-w-xl rounded-xl bg-destructive/10 px-4 py-3 font-mono text-sm text-destructive",
				children: error instanceof Error ? error.message : String(error)
			})]
		}), /* @__PURE__ */ jsxs("div", {
			className: "flex gap-2 items-center flex-wrap",
			children: [/* @__PURE__ */ jsx("button", {
				onClick: () => {
					router.invalidate();
				},
				className: `px-2 py-1 bg-gray-600 dark:bg-gray-700 rounded-sm text-white uppercase font-extrabold`,
				children: "Thử lại"
			}), isRoot ? /* @__PURE__ */ jsx(Link, {
				to: "/",
				className: `px-2 py-1 bg-gray-600 dark:bg-gray-700 rounded-sm text-white uppercase font-extrabold`,
				children: "Trang chủ"
			}) : /* @__PURE__ */ jsx(Link, {
				to: "/",
				className: `px-2 py-1 bg-gray-600 dark:bg-gray-700 rounded-sm text-white uppercase font-extrabold`,
				onClick: (e) => {
					e.preventDefault();
					window.history.back();
				},
				children: "Quay lại"
			})]
		})]
	});
}
//#endregion
//#region src/components/NotFound.tsx
function NotFound({ children }) {
	return /* @__PURE__ */ jsxs("div", {
		className: "space-y-2 p-2",
		children: [/* @__PURE__ */ jsx("div", {
			className: "text-gray-600 dark:text-gray-400",
			children: children || /* @__PURE__ */ jsx("p", { children: "Trang bạn tìm không tồn tại." })
		}), /* @__PURE__ */ jsxs("p", {
			className: "flex items-center gap-2 flex-wrap",
			children: [/* @__PURE__ */ jsx("button", {
				onClick: () => window.history.back(),
				className: "bg-emerald-500 text-white px-2 py-1 rounded-sm uppercase font-black text-sm",
				children: "Quay lại"
			}), /* @__PURE__ */ jsx(Link, {
				to: "/",
				className: "bg-cyan-600 text-white px-2 py-1 rounded-sm uppercase font-black text-sm",
				children: "Về trang chủ"
			})]
		})]
	});
}
//#endregion
//#region src/components/ui/sonner.tsx
var Toaster$1 = ({ ...props }) => {
	const { theme = "system" } = useTheme();
	return /* @__PURE__ */ jsx(Toaster, {
		theme,
		className: "toaster group",
		icons: {
			success: /* @__PURE__ */ jsx(HugeiconsIcon, {
				icon: CheckmarkCircle02Icon,
				strokeWidth: 2,
				className: "size-4"
			}),
			info: /* @__PURE__ */ jsx(HugeiconsIcon, {
				icon: InformationCircleIcon,
				strokeWidth: 2,
				className: "size-4"
			}),
			warning: /* @__PURE__ */ jsx(HugeiconsIcon, {
				icon: Alert02Icon,
				strokeWidth: 2,
				className: "size-4"
			}),
			error: /* @__PURE__ */ jsx(HugeiconsIcon, {
				icon: MultiplicationSignCircleIcon,
				strokeWidth: 2,
				className: "size-4"
			}),
			loading: /* @__PURE__ */ jsx(HugeiconsIcon, {
				icon: Loading03Icon,
				strokeWidth: 2,
				className: "size-4 animate-spin"
			})
		},
		style: {
			"--normal-bg": "var(--popover)",
			"--normal-text": "var(--popover-foreground)",
			"--normal-border": "var(--border)",
			"--border-radius": "var(--radius)"
		},
		toastOptions: { classNames: { toast: "cn-toast" } },
		...props
	});
};
//#endregion
//#region src/styles/app.css?url
var app_default = "/assets/app-baD9ZKan.css";
//#endregion
//#region src/utils/seo.ts
var seo = ({ title, description, keywords, image }) => {
	return [
		{ title },
		{
			name: "description",
			content: description
		},
		{
			name: "keywords",
			content: keywords
		},
		{
			name: "twitter:title",
			content: title
		},
		{
			name: "twitter:description",
			content: description
		},
		{
			name: "twitter:creator",
			content: "@tannerlinsley"
		},
		{
			name: "twitter:site",
			content: "@tannerlinsley"
		},
		{
			name: "og:type",
			content: "website"
		},
		{
			name: "og:title",
			content: title
		},
		{
			name: "og:description",
			content: description
		},
		...image ? [
			{
				name: "twitter:image",
				content: image
			},
			{
				name: "twitter:card",
				content: "summary_large_image"
			},
			{
				name: "og:image",
				content: image
			}
		] : []
	];
};
//#endregion
//#region src/routes/__root.tsx
var Route$2 = createRootRoute({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1"
			},
			...seo({
				title: "Lịch Âm | Nhớ ngày giỗ, không bỏ lỡ",
				description: "Xem lịch âm Việt Nam, lưu ngày giỗ theo âm lịch và nhận nhắc dịp giỗ sắp tới mỗi năm."
			})
		],
		links: [{
			rel: "stylesheet",
			href: app_default
		}]
	}),
	errorComponent: (props) => {
		return /* @__PURE__ */ jsx(RootDocument, { children: /* @__PURE__ */ jsx(DefaultCatchBoundary, { ...props }) });
	},
	notFoundComponent: () => /* @__PURE__ */ jsx(NotFound, {}),
	component: RootComponent
});
function RootComponent() {
	return /* @__PURE__ */ jsx(RootDocument, { children: /* @__PURE__ */ jsx(Outlet, {}) });
}
function RootDocument({ children }) {
	return /* @__PURE__ */ jsxs("html", {
		lang: "vi",
		children: [/* @__PURE__ */ jsx("head", { children: /* @__PURE__ */ jsx(HeadContent, {}) }), /* @__PURE__ */ jsxs("body", { children: [
			/* @__PURE__ */ jsxs("div", {
				className: "flex min-h-svh flex-col",
				children: [/* @__PURE__ */ jsx("header", {
					className: "sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur",
					children: /* @__PURE__ */ jsxs("div", {
						className: "mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3 lg:px-6",
						children: [/* @__PURE__ */ jsxs(Link, {
							to: "/",
							className: "flex items-center gap-2 font-heading text-base font-semibold tracking-tight",
							children: [/* @__PURE__ */ jsx(HugeiconsIcon, {
								icon: Moon02Icon,
								className: "size-5 text-primary",
								strokeWidth: 2
							}), "Lịch Âm"]
						}), /* @__PURE__ */ jsxs("nav", {
							className: "flex items-center gap-1",
							children: [/* @__PURE__ */ jsx(NavLink, {
								to: "/",
								children: "Lịch"
							}), /* @__PURE__ */ jsx(NavLink, {
								to: "/su-kien",
								children: "Sự kiện"
							})]
						})]
					})
				}), children]
			}),
			/* @__PURE__ */ jsx(Toaster$1, {
				position: "top-center",
				richColors: true
			}),
			/* @__PURE__ */ jsx(TanStackRouterDevtools, { position: "bottom-right" }),
			/* @__PURE__ */ jsx(Scripts, {})
		] })]
	});
}
function NavLink({ to, children }) {
	return /* @__PURE__ */ jsx(Link, {
		to,
		activeProps: { className: "bg-muted text-foreground" },
		activeOptions: { exact: to === "/" },
		className: "rounded-4xl px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
		children
	});
}
//#endregion
//#region src/routes/index.tsx
var $$splitComponentImporter$1 = () => import("./routes-B8y6o5vi.js");
var Route$1 = createFileRoute("/")({
	loader: () => listEventsFn(),
	component: lazyRouteComponent($$splitComponentImporter$1, "component")
});
//#endregion
//#region src/routes/su-kien.tsx
var $$splitComponentImporter = () => import("./su-kien-BRfmFGhR.js");
var Route = createFileRoute("/su-kien")({
	loader: () => listEventsFn(),
	component: lazyRouteComponent($$splitComponentImporter, "component")
});
//#endregion
//#region src/routeTree.gen.ts
var rootRouteChildren = {
	IndexRoute: Route$1.update({
		id: "/",
		path: "/",
		getParentRoute: () => Route$2
	}),
	SuKienRoute: Route.update({
		id: "/su-kien",
		path: "/su-kien",
		getParentRoute: () => Route$2
	})
};
var routeTree = Route$2._addFileChildren(rootRouteChildren)._addFileTypes();
//#endregion
//#region src/router.tsx
var router_exports = /* @__PURE__ */ __exportAll({ getRouter: () => getRouter });
function getRouter() {
	return createRouter({
		routeTree,
		scrollRestoration: true
	});
}
//#endregion
export { getRouter, Route as n, Route$1 as r, router_exports as t };
