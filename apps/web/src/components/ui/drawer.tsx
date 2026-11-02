import * as React from "react";

import { cn } from "cn";

import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "~/components/ui/sheet";

function Drawer(props: React.ComponentProps<typeof Sheet>) {
  return <Sheet data-slot="drawer" {...props} />;
}

function DrawerTrigger(props: React.ComponentProps<typeof SheetTrigger>) {
  return <SheetTrigger data-slot="drawer-trigger" {...props} />;
}

function DrawerClose(props: React.ComponentProps<typeof SheetClose>) {
  return <SheetClose data-slot="drawer-close" {...props} />;
}

function DrawerContent({
  className,
  children,
  showCloseButton = true,
  ...props
}: React.ComponentProps<typeof SheetContent>) {
  return (
    <SheetContent
      side="bottom"
      showCloseButton={showCloseButton}
      className={cn(
        "rounded-t-[28px] border-[var(--border-warm)] bg-[var(--cream-elevated)] p-0 shadow-[var(--shadow-float)] duration-[280ms]",
        className,
      )}
      {...props}
    >
      <div
        className="mx-auto mt-3 mb-1 h-1.5 w-10 shrink-0 rounded-full bg-[var(--border-warm)]"
        aria-hidden
      />
      {children}
    </SheetContent>
  );
}

function DrawerHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <SheetHeader className={cn("px-5 pt-2 pb-0", className)} {...props} />;
}

function DrawerFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <SheetFooter
      className={cn("px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))]", className)}
      {...props}
    />
  );
}

function DrawerTitle({ className, ...props }: React.ComponentProps<typeof SheetTitle>) {
  return <SheetTitle className={cn("font-heading text-xl", className)} {...props} />;
}

function DrawerDescription({ className, ...props }: React.ComponentProps<typeof SheetDescription>) {
  return <SheetDescription className={className} {...props} />;
}

export {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
};
