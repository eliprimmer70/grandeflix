"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toggleContentReminder, type ReminderState } from "@/app/reminders/actions";
import { cn } from "@/lib/utils";

function BellIcon({ filled }: { filled?: boolean }) {
  return (
    <svg className="h-4 w-4 shrink-0" fill={filled ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
      />
    </svg>
  );
}

export function RemindMeButton({
  contentId,
  slug,
  initialReminded,
  signedIn,
  className,
}: {
  contentId: string;
  slug: string;
  initialReminded: boolean;
  signedIn: boolean;
  className?: string;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState<ReminderState, FormData>(
    toggleContentReminder,
    { reminded: initialReminded },
  );

  const reminded = state.reminded ?? initialReminded;

  useEffect(() => {
    if (state.error === "Sign in to set reminders.") {
      router.push(`/?signup=1`);
    }
  }, [state.error, router]);

  if (!signedIn) {
    return (
      <button
        type="button"
        onClick={() => router.push("/?signup=1")}
        className={cn(
          "btn-secondary inline-flex min-h-[44px] items-center gap-2 rounded-lg px-5 py-2.5 text-sm",
          className,
        )}
      >
        <BellIcon />
        Remind me
      </button>
    );
  }

  return (
    <form action={formAction} className={className}>
      <input type="hidden" name="content_id" value={contentId} />
      <input type="hidden" name="slug" value={slug} />
      <button
        type="submit"
        disabled={pending}
        className={cn(
          "inline-flex min-h-[44px] items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium transition disabled:opacity-50",
          reminded
            ? "bg-brand/20 text-brand-bright ring-1 ring-brand/40"
            : "btn-secondary",
        )}
      >
        <BellIcon filled={reminded} />
        {pending ? "Saving…" : reminded ? "Reminder set" : "Remind me"}
      </button>
      {state.error && state.error !== "Sign in to set reminders." && (
        <p className="mt-2 text-xs text-red-300">{state.error}</p>
      )}
    </form>
  );
}
