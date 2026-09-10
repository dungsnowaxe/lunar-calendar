import { i as updateEventFn, n as deleteEventFn, t as createEventFn } from "./events-6t-XPqrQ.js";
import { n as Route } from "./router-8IzMn_pU.js";
import { O as solarToday, T as formatSolar, a as CardHeader, d as eventRuleLabel, g as nextOccurrences, i as CardDescription, l as daysBetween, n as CardAction, o as CardTitle, r as CardContent, s as Button, t as Card, u as daysUntilLabel } from "./card-D6B8JYSP.js";
import { useState } from "react";
import { useRouter } from "@tanstack/react-router";
import { jsx, jsxs } from "react/jsx-runtime";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowDown01Icon, ArrowUp01Icon, CakeIcon, Cancel01Icon, Delete02Icon, Edit02Icon, PlusSignIcon, Tick02Icon, UnfoldMoreIcon } from "@hugeicons/core-free-icons";
import { toast } from "sonner";
import { cn } from "cn";
import { Dialog } from "@base-ui/react/dialog";
import { Input } from "@base-ui/react/input";
import { Select } from "@base-ui/react/select";
import { AlertDialog } from "@base-ui/react/alert-dialog";
//#region src/components/ui/dialog.tsx
function Dialog$1({ ...props }) {
	return /* @__PURE__ */ jsx(Dialog.Root, {
		"data-slot": "dialog",
		...props
	});
}
function DialogPortal({ ...props }) {
	return /* @__PURE__ */ jsx(Dialog.Portal, {
		"data-slot": "dialog-portal",
		...props
	});
}
function DialogOverlay({ className, ...props }) {
	return /* @__PURE__ */ jsx(Dialog.Backdrop, {
		"data-slot": "dialog-overlay",
		className: cn("fixed inset-0 isolate z-50 bg-black/80 duration-100 supports-backdrop-filter:backdrop-blur-xs data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0", className),
		...props
	});
}
function DialogContent({ className, children, showCloseButton = true, ...props }) {
	return /* @__PURE__ */ jsxs(DialogPortal, { children: [/* @__PURE__ */ jsx(DialogOverlay, {}), /* @__PURE__ */ jsxs(Dialog.Popup, {
		"data-slot": "dialog-content",
		className: cn("fixed top-1/2 left-1/2 z-50 grid w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 gap-6 rounded-4xl bg-popover p-6 text-sm text-popover-foreground ring-1 ring-foreground/5 duration-100 outline-none sm:max-w-md data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95", className),
		...props,
		children: [children, showCloseButton && /* @__PURE__ */ jsxs(Dialog.Close, {
			"data-slot": "dialog-close",
			render: /* @__PURE__ */ jsx(Button, {
				variant: "ghost",
				className: "absolute top-4 right-4",
				size: "icon-sm"
			}),
			children: [/* @__PURE__ */ jsx(HugeiconsIcon, {
				icon: Cancel01Icon,
				strokeWidth: 2
			}), /* @__PURE__ */ jsx("span", {
				className: "sr-only",
				children: "Close"
			})]
		})]
	})] });
}
function DialogHeader({ className, ...props }) {
	return /* @__PURE__ */ jsx("div", {
		"data-slot": "dialog-header",
		className: cn("flex flex-col gap-2", className),
		...props
	});
}
function DialogFooter({ className, showCloseButton = false, children, ...props }) {
	return /* @__PURE__ */ jsxs("div", {
		"data-slot": "dialog-footer",
		className: cn("flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", className),
		...props,
		children: [children, showCloseButton && /* @__PURE__ */ jsx(Dialog.Close, {
			render: /* @__PURE__ */ jsx(Button, { variant: "outline" }),
			children: "Close"
		})]
	});
}
function DialogTitle({ className, ...props }) {
	return /* @__PURE__ */ jsx(Dialog.Title, {
		"data-slot": "dialog-title",
		className: cn("font-heading text-base leading-none font-medium", className),
		...props
	});
}
function DialogDescription({ className, ...props }) {
	return /* @__PURE__ */ jsx(Dialog.Description, {
		"data-slot": "dialog-description",
		className: cn("text-sm text-muted-foreground *:[a]:underline *:[a]:underline-offset-3 *:[a]:hover:text-foreground", className),
		...props
	});
}
//#endregion
//#region src/components/ui/input.tsx
function Input$1({ className, type, ...props }) {
	return /* @__PURE__ */ jsx(Input, {
		type,
		"data-slot": "input",
		className: cn("h-9 w-full min-w-0 rounded-4xl border border-input bg-input/30 px-3 py-1 text-base transition-colors outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-[3px] aria-invalid:ring-destructive/20 md:text-sm dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40", className),
		...props
	});
}
//#endregion
//#region src/components/ui/label.tsx
function Label({ className, ...props }) {
	return /* @__PURE__ */ jsx("label", {
		"data-slot": "label",
		className: cn("flex items-center gap-2 text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50", className),
		...props
	});
}
//#endregion
//#region src/components/ui/select.tsx
var Select$1 = Select.Root;
function SelectValue({ className, ...props }) {
	return /* @__PURE__ */ jsx(Select.Value, {
		"data-slot": "select-value",
		className: cn("flex flex-1 text-left", className),
		...props
	});
}
function SelectTrigger({ className, size = "default", children, ...props }) {
	return /* @__PURE__ */ jsxs(Select.Trigger, {
		"data-slot": "select-trigger",
		"data-size": size,
		className: cn("flex w-fit items-center justify-between gap-1.5 rounded-4xl border border-input bg-input/30 px-3 py-2 text-sm whitespace-nowrap transition-colors outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-[3px] aria-invalid:ring-destructive/20 data-placeholder:text-muted-foreground data-[size=default]:h-9 data-[size=sm]:h-8 *:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-1.5 dark:hover:bg-input/50 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4", className),
		...props,
		children: [children, /* @__PURE__ */ jsx(Select.Icon, { render: /* @__PURE__ */ jsx(HugeiconsIcon, {
			icon: UnfoldMoreIcon,
			strokeWidth: 2,
			className: "pointer-events-none size-4 text-muted-foreground"
		}) })]
	});
}
function SelectContent({ className, children, side = "bottom", sideOffset = 4, align = "center", alignOffset = 0, alignItemWithTrigger = true, ...props }) {
	return /* @__PURE__ */ jsx(Select.Portal, { children: /* @__PURE__ */ jsx(Select.Positioner, {
		side,
		sideOffset,
		align,
		alignOffset,
		alignItemWithTrigger,
		className: "isolate z-50",
		children: /* @__PURE__ */ jsxs(Select.Popup, {
			"data-slot": "select-content",
			"data-align-trigger": alignItemWithTrigger,
			className: cn("relative isolate z-50 max-h-(--available-height) w-(--anchor-width) min-w-36 origin-(--transform-origin) overflow-x-hidden overflow-y-auto rounded-2xl bg-popover text-popover-foreground shadow-2xl ring-1 ring-foreground/5 duration-100 data-[align-trigger=true]:animate-none data-[side=bottom]:slide-in-from-top-2 data-[side=inline-end]:slide-in-from-left-2 data-[side=inline-start]:slide-in-from-right-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95", className),
			...props,
			children: [
				/* @__PURE__ */ jsx(SelectScrollUpButton, {}),
				/* @__PURE__ */ jsx(Select.List, { children }),
				/* @__PURE__ */ jsx(SelectScrollDownButton, {})
			]
		})
	}) });
}
function SelectItem({ className, children, ...props }) {
	return /* @__PURE__ */ jsxs(Select.Item, {
		"data-slot": "select-item",
		className: cn("relative flex w-full cursor-default items-center gap-2.5 rounded-xl py-2 pr-8 pl-3 text-sm outline-hidden select-none focus:bg-accent focus:text-accent-foreground not-data-[variant=destructive]:focus:**:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 *:[span]:last:flex *:[span]:last:items-center *:[span]:last:gap-2", className),
		...props,
		children: [/* @__PURE__ */ jsx(Select.ItemText, {
			className: "flex flex-1 shrink-0 gap-2 whitespace-nowrap",
			children
		}), /* @__PURE__ */ jsx(Select.ItemIndicator, {
			render: /* @__PURE__ */ jsx("span", { className: "pointer-events-none absolute right-2 flex size-4 items-center justify-center" }),
			children: /* @__PURE__ */ jsx(HugeiconsIcon, {
				icon: Tick02Icon,
				strokeWidth: 2,
				className: "pointer-events-none"
			})
		})]
	});
}
function SelectScrollUpButton({ className, ...props }) {
	return /* @__PURE__ */ jsx(Select.ScrollUpArrow, {
		"data-slot": "select-scroll-up-button",
		className: cn("top-0 z-10 flex w-full cursor-default items-center justify-center bg-popover py-1 [&_svg:not([class*='size-'])]:size-4", className),
		...props,
		children: /* @__PURE__ */ jsx(HugeiconsIcon, {
			icon: ArrowUp01Icon,
			strokeWidth: 2
		})
	});
}
function SelectScrollDownButton({ className, ...props }) {
	return /* @__PURE__ */ jsx(Select.ScrollDownArrow, {
		"data-slot": "select-scroll-down-button",
		className: cn("bottom-0 z-10 flex w-full cursor-default items-center justify-center bg-popover py-1 [&_svg:not([class*='size-'])]:size-4", className),
		...props,
		children: /* @__PURE__ */ jsx(HugeiconsIcon, {
			icon: ArrowDown01Icon,
			strokeWidth: 2
		})
	});
}
//#endregion
//#region src/components/ui/textarea.tsx
function Textarea({ className, ...props }) {
	return /* @__PURE__ */ jsx("textarea", {
		"data-slot": "textarea",
		className: cn("flex field-sizing-content min-h-16 w-full resize-none rounded-xl border border-input bg-input/30 px-3 py-3 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-[3px] aria-invalid:ring-destructive/20 md:text-sm dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40", className),
		...props
	});
}
//#endregion
//#region src/components/event-form-dialog.tsx
var DAYS = Array.from({ length: 30 }, (_, i) => String(i + 1));
var MONTHS = Array.from({ length: 12 }, (_, i) => String(i + 1));
var dayItems = Object.fromEntries(DAYS.map((day) => [day, `Ngày ${day}`]));
var monthItems = Object.fromEntries(MONTHS.map((month) => [month, `Tháng ${month}`]));
function EventFormDialog({ open, onOpenChange, event, onSaved }) {
	const [title, setTitle] = useState(event?.title ?? "");
	const [lunarDay, setLunarDay] = useState(String(event?.lunarDay ?? 10));
	const [lunarMonth, setLunarMonth] = useState(String(event?.lunarMonth ?? 1));
	const [notes, setNotes] = useState(event?.notes ?? "");
	const [pending, setPending] = useState(false);
	const [error, setError] = useState(null);
	const nextOccurrence = nextOccurrences({
		lunarDay: Number(lunarDay),
		lunarMonth: Number(lunarMonth)
	}, solarToday(), 1)[0];
	async function handleSubmit(e) {
		e.preventDefault();
		setPending(true);
		setError(null);
		const payload = {
			title,
			lunarDay: Number(lunarDay),
			lunarMonth: Number(lunarMonth),
			notes: notes || null
		};
		let result;
		try {
			result = event ? await updateEventFn({ data: {
				...payload,
				id: event.id
			} }) : await createEventFn({ data: payload });
		} catch {
			setPending(false);
			setError("Không thể kết nối máy chủ. Vui lòng thử lại.");
			return;
		}
		setPending(false);
		if (result.error) {
			setError(result.error);
			return;
		}
		toast.success(event ? "Đã cập nhật sự kiện" : "Đã thêm sự kiện");
		onOpenChange(false);
		await onSaved();
	}
	return /* @__PURE__ */ jsx(Dialog$1, {
		open,
		onOpenChange,
		children: /* @__PURE__ */ jsxs(DialogContent, { children: [/* @__PURE__ */ jsxs(DialogHeader, { children: [/* @__PURE__ */ jsx(DialogTitle, { children: event ? "Sửa sự kiện" : "Thêm sự kiện giỗ" }), /* @__PURE__ */ jsx(DialogDescription, { children: "Nhập ngày âm lịch — ngày giỗ sẽ lặp lại đúng ngày đó mỗi năm." })] }), /* @__PURE__ */ jsxs("form", {
			onSubmit: handleSubmit,
			className: "flex flex-col gap-4",
			children: [
				/* @__PURE__ */ jsxs("div", {
					className: "flex flex-col gap-2",
					children: [/* @__PURE__ */ jsx(Label, {
						htmlFor: "event-title",
						children: "Tên sự kiện"
					}), /* @__PURE__ */ jsx(Input$1, {
						id: "event-title",
						value: title,
						onChange: (e) => setTitle(e.target.value),
						placeholder: "VD: Giỗ tổ, giỗ ông nội, giỗ bà ngoại…",
						required: true,
						maxLength: 120
					})]
				}),
				/* @__PURE__ */ jsxs("div", {
					className: "grid grid-cols-2 gap-3",
					children: [/* @__PURE__ */ jsxs("div", {
						className: "flex flex-col gap-2",
						children: [/* @__PURE__ */ jsx(Label, {
							htmlFor: "event-day",
							children: "Ngày âm lịch"
						}), /* @__PURE__ */ jsxs(Select$1, {
							items: dayItems,
							value: lunarDay,
							onValueChange: (value) => {
								if (value != null) setLunarDay(String(value));
							},
							children: [/* @__PURE__ */ jsx(SelectTrigger, {
								id: "event-day",
								className: "w-full",
								children: /* @__PURE__ */ jsx(SelectValue, {})
							}), /* @__PURE__ */ jsx(SelectContent, { children: DAYS.map((day) => /* @__PURE__ */ jsx(SelectItem, {
								value: day,
								children: dayItems[day]
							}, day)) })]
						})]
					}), /* @__PURE__ */ jsxs("div", {
						className: "flex flex-col gap-2",
						children: [/* @__PURE__ */ jsx(Label, {
							htmlFor: "event-month",
							children: "Tháng âm lịch"
						}), /* @__PURE__ */ jsxs(Select$1, {
							items: monthItems,
							value: lunarMonth,
							onValueChange: (value) => {
								if (value != null) setLunarMonth(String(value));
							},
							children: [/* @__PURE__ */ jsx(SelectTrigger, {
								id: "event-month",
								className: "w-full",
								children: /* @__PURE__ */ jsx(SelectValue, {})
							}), /* @__PURE__ */ jsx(SelectContent, { children: MONTHS.map((month) => /* @__PURE__ */ jsx(SelectItem, {
								value: month,
								children: monthItems[month]
							}, month)) })]
						})]
					})]
				}),
				/* @__PURE__ */ jsxs("div", {
					className: "flex flex-col gap-2",
					children: [/* @__PURE__ */ jsx(Label, {
						htmlFor: "event-notes",
						children: "Ghi chú"
					}), /* @__PURE__ */ jsx(Textarea, {
						id: "event-notes",
						value: notes,
						onChange: (e) => setNotes(e.target.value),
						placeholder: "VD: Cúng vào buổi trưa, dâng hương ở nhà thờ…",
						maxLength: 500
					})]
				}),
				nextOccurrence && /* @__PURE__ */ jsxs("p", {
					className: "text-sm text-muted-foreground",
					children: [
						"Lần tới vào:",
						" ",
						/* @__PURE__ */ jsx("span", {
							className: "font-medium text-foreground",
							children: formatSolar(nextOccurrence)
						})
					]
				}),
				error && /* @__PURE__ */ jsx("p", {
					className: "text-sm text-destructive",
					children: error
				}),
				/* @__PURE__ */ jsxs(DialogFooter, { children: [/* @__PURE__ */ jsx(Button, {
					type: "button",
					variant: "outline",
					onClick: () => onOpenChange(false),
					disabled: pending,
					children: "Hủy"
				}), /* @__PURE__ */ jsx(Button, {
					type: "submit",
					disabled: pending,
					children: pending ? "Đang lưu…" : event ? "Lưu thay đổi" : "Thêm sự kiện"
				})] })
			]
		})] })
	});
}
//#endregion
//#region src/components/ui/alert-dialog.tsx
function AlertDialog$1({ ...props }) {
	return /* @__PURE__ */ jsx(AlertDialog.Root, {
		"data-slot": "alert-dialog",
		...props
	});
}
function AlertDialogPortal({ ...props }) {
	return /* @__PURE__ */ jsx(AlertDialog.Portal, {
		"data-slot": "alert-dialog-portal",
		...props
	});
}
function AlertDialogOverlay({ className, ...props }) {
	return /* @__PURE__ */ jsx(AlertDialog.Backdrop, {
		"data-slot": "alert-dialog-overlay",
		className: cn("fixed inset-0 isolate z-50 bg-black/80 duration-100 supports-backdrop-filter:backdrop-blur-xs data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0", className),
		...props
	});
}
function AlertDialogContent({ className, size = "default", ...props }) {
	return /* @__PURE__ */ jsxs(AlertDialogPortal, { children: [/* @__PURE__ */ jsx(AlertDialogOverlay, {}), /* @__PURE__ */ jsx(AlertDialog.Popup, {
		"data-slot": "alert-dialog-content",
		"data-size": size,
		className: cn("group/alert-dialog-content fixed top-1/2 left-1/2 z-50 grid w-full -translate-x-1/2 -translate-y-1/2 gap-6 rounded-4xl bg-popover p-6 text-popover-foreground ring-1 ring-foreground/5 duration-100 outline-none data-[size=default]:max-w-xs data-[size=sm]:max-w-xs data-[size=default]:sm:max-w-md data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95", className),
		...props
	})] });
}
function AlertDialogHeader({ className, ...props }) {
	return /* @__PURE__ */ jsx("div", {
		"data-slot": "alert-dialog-header",
		className: cn("grid grid-rows-[auto_1fr] place-items-center gap-1.5 text-center has-data-[slot=alert-dialog-media]:grid-rows-[auto_auto_1fr] has-data-[slot=alert-dialog-media]:gap-x-6 sm:group-data-[size=default]/alert-dialog-content:place-items-start sm:group-data-[size=default]/alert-dialog-content:text-left sm:group-data-[size=default]/alert-dialog-content:has-data-[slot=alert-dialog-media]:grid-rows-[auto_1fr]", className),
		...props
	});
}
function AlertDialogFooter({ className, ...props }) {
	return /* @__PURE__ */ jsx("div", {
		"data-slot": "alert-dialog-footer",
		className: cn("flex flex-col-reverse gap-2 group-data-[size=sm]/alert-dialog-content:grid group-data-[size=sm]/alert-dialog-content:grid-cols-2 sm:flex-row sm:justify-end", className),
		...props
	});
}
function AlertDialogTitle({ className, ...props }) {
	return /* @__PURE__ */ jsx(AlertDialog.Title, {
		"data-slot": "alert-dialog-title",
		className: cn("font-heading text-lg font-medium sm:group-data-[size=default]/alert-dialog-content:group-has-data-[slot=alert-dialog-media]/alert-dialog-content:col-start-2", className),
		...props
	});
}
function AlertDialogDescription({ className, ...props }) {
	return /* @__PURE__ */ jsx(AlertDialog.Description, {
		"data-slot": "alert-dialog-description",
		className: cn("text-sm text-balance text-muted-foreground md:text-pretty *:[a]:underline *:[a]:underline-offset-3 *:[a]:hover:text-foreground", className),
		...props
	});
}
function AlertDialogAction({ className, ...props }) {
	return /* @__PURE__ */ jsx(Button, {
		"data-slot": "alert-dialog-action",
		className: cn(className),
		...props
	});
}
function AlertDialogCancel({ className, variant = "outline", size = "default", ...props }) {
	return /* @__PURE__ */ jsx(AlertDialog.Close, {
		"data-slot": "alert-dialog-cancel",
		className: cn(className),
		render: /* @__PURE__ */ jsx(Button, {
			variant,
			size
		}),
		...props
	});
}
//#endregion
//#region src/routes/su-kien.tsx?tsr-split=component
function EventsPage() {
	const router = useRouter();
	const events = Route.useLoaderData();
	const [formOpen, setFormOpen] = useState(false);
	const [editing, setEditing] = useState(void 0);
	function refresh() {
		return router.invalidate();
	}
	return /* @__PURE__ */ jsxs("main", {
		className: "mx-auto w-full max-w-6xl flex-1 px-4 py-6 lg:px-6",
		children: [
			/* @__PURE__ */ jsxs("div", {
				className: "mb-6 flex flex-wrap items-center justify-between gap-3",
				children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("h1", {
					className: "font-heading text-xl font-semibold",
					children: "Sự kiện giỗ"
				}), /* @__PURE__ */ jsx("p", {
					className: "text-sm text-muted-foreground",
					children: "Lưu theo ngày âm lịch — ngày dương lịch được tính tự động mỗi năm."
				})] }), /* @__PURE__ */ jsxs(Button, {
					onClick: () => setFormOpen(true),
					children: [/* @__PURE__ */ jsx(HugeiconsIcon, {
						icon: PlusSignIcon,
						strokeWidth: 2,
						"data-icon": "inline-start"
					}), "Thêm sự kiện"]
				})]
			}),
			events.length === 0 ? /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(CardContent, {
				className: "flex flex-col items-center gap-3 py-10 text-center",
				children: [
					/* @__PURE__ */ jsx(HugeiconsIcon, {
						icon: CakeIcon,
						className: "size-8 text-muted-foreground",
						strokeWidth: 1.5
					}),
					/* @__PURE__ */ jsx("p", {
						className: "text-sm text-muted-foreground",
						children: "Chưa có sự kiện nào. Thêm ngày giỗ đầu tiên của gia đình bạn."
					}),
					/* @__PURE__ */ jsxs(Button, {
						variant: "outline",
						onClick: () => setFormOpen(true),
						children: [/* @__PURE__ */ jsx(HugeiconsIcon, {
							icon: PlusSignIcon,
							strokeWidth: 2,
							"data-icon": "inline-start"
						}), "Thêm sự kiện"]
					})
				]
			}) }) : /* @__PURE__ */ jsx("div", {
				className: "grid gap-4 md:grid-cols-2",
				children: events.map((event) => /* @__PURE__ */ jsx(EventCard, {
					event,
					onEdit: () => {
						setEditing(event);
						setFormOpen(true);
					}
				}, event.id))
			}),
			/* @__PURE__ */ jsx(EventFormDialog, {
				open: formOpen,
				onOpenChange: setFormOpen,
				event: editing,
				onSaved: refresh
			})
		]
	});
}
function EventCard({ event, onEdit }) {
	const router = useRouter();
	const [confirmOpen, setConfirmOpen] = useState(false);
	const today = solarToday();
	const upcoming = nextOccurrences({
		lunarDay: event.lunarDay,
		lunarMonth: event.lunarMonth
	}, today, 3);
	async function handleDelete() {
		let result;
		try {
			result = await deleteEventFn({ data: event.id });
		} catch {
			toast.error("Không thể kết nối máy chủ. Vui lòng thử lại.");
			return;
		}
		if (result.error) {
			toast.error(result.error);
			return;
		}
		toast.success(`Đã xóa "${event.title}"`);
		setConfirmOpen(false);
		await router.invalidate();
	}
	return /* @__PURE__ */ jsxs(Card, { children: [
		/* @__PURE__ */ jsxs(CardHeader, { children: [
			/* @__PURE__ */ jsxs(CardTitle, {
				className: "flex items-center gap-2",
				children: [/* @__PURE__ */ jsx(HugeiconsIcon, {
					icon: CakeIcon,
					className: "size-4 shrink-0 text-primary",
					strokeWidth: 2
				}), /* @__PURE__ */ jsx("span", {
					className: "truncate",
					children: event.title
				})]
			}),
			/* @__PURE__ */ jsx(CardDescription, { children: eventRuleLabel(event) }),
			/* @__PURE__ */ jsx(CardAction, { children: /* @__PURE__ */ jsxs("div", {
				className: "flex gap-1",
				children: [/* @__PURE__ */ jsx(Button, {
					variant: "ghost",
					size: "icon-sm",
					"aria-label": `Sửa ${event.title}`,
					onClick: onEdit,
					children: /* @__PURE__ */ jsx(HugeiconsIcon, {
						icon: Edit02Icon,
						strokeWidth: 2
					})
				}), /* @__PURE__ */ jsx(Button, {
					variant: "ghost",
					size: "icon-sm",
					"aria-label": `Xóa ${event.title}`,
					onClick: () => setConfirmOpen(true),
					children: /* @__PURE__ */ jsx(HugeiconsIcon, {
						icon: Delete02Icon,
						strokeWidth: 2
					})
				})]
			}) })
		] }),
		/* @__PURE__ */ jsxs(CardContent, { children: [
			/* @__PURE__ */ jsx("p", {
				className: "mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase",
				children: "Ba lần tới"
			}),
			/* @__PURE__ */ jsx("ul", {
				className: "flex flex-wrap gap-2",
				children: upcoming.map((date) => {
					const days = daysBetween(today, date);
					return /* @__PURE__ */ jsxs("li", {
						className: "rounded-xl bg-muted/60 px-2.5 py-1 text-xs",
						children: [formatSolar(date), /* @__PURE__ */ jsxs("span", {
							className: "ml-1.5 text-muted-foreground",
							children: [
								"(",
								daysUntilLabel(days),
								")"
							]
						})]
					}, `${date.day}-${date.month}-${date.year}`);
				})
			}),
			event.notes && /* @__PURE__ */ jsx("p", {
				className: "mt-3 text-sm text-muted-foreground",
				children: event.notes
			})
		] }),
		/* @__PURE__ */ jsx(AlertDialog$1, {
			open: confirmOpen,
			onOpenChange: setConfirmOpen,
			children: /* @__PURE__ */ jsxs(AlertDialogContent, { children: [/* @__PURE__ */ jsxs(AlertDialogHeader, { children: [/* @__PURE__ */ jsx(AlertDialogTitle, { children: "Xóa sự kiện?" }), /* @__PURE__ */ jsxs(AlertDialogDescription, { children: [
				"Bạn có chắc muốn xóa \"",
				event.title,
				"\"? Thao tác này không thể hoàn tác."
			] })] }), /* @__PURE__ */ jsxs(AlertDialogFooter, { children: [/* @__PURE__ */ jsx(AlertDialogCancel, { children: "Giữ lại" }), /* @__PURE__ */ jsx(AlertDialogAction, {
				onClick: handleDelete,
				children: "Xóa"
			})] })] })
		})
	] });
}
//#endregion
export { EventsPage as component };
