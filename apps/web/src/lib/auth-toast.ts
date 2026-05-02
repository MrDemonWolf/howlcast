import { toast } from "sonner";

// Better Auth surfaces errors in two shapes depending on call site:
//   - Direct API result: `{ data, error: { message?, statusText? } | null }`
//   - Callback option:  `{ error: { message?, statusText? } }` passed to `onError`
// `formatAuthError` accepts either and returns a display string. Falls back when fields are missing.

type AuthErrorLike =
	| { error?: { message?: string | null; statusText?: string | null } | null }
	| { message?: string | null }
	| null
	| undefined;

export function formatAuthError(input: unknown, fallback: string): string {
	if (!input || typeof input !== "object") return fallback;
	const wrapper = input as AuthErrorLike;
	const inner =
		wrapper && "error" in wrapper && wrapper.error ? wrapper.error : wrapper;
	if (!inner || typeof inner !== "object") return fallback;
	const obj = inner as { message?: string | null; statusText?: string | null };
	return obj.message ?? obj.statusText ?? fallback;
}

// Convenience: show the error toast directly. Returns whether an error was present.
export function toastAuthError(input: unknown, fallback: string): boolean {
	const wrapper = input as { error?: unknown };
	const hasError =
		!!wrapper && typeof wrapper === "object" && wrapper.error != null;
	if (!hasError) return false;
	toast.error(formatAuthError(input, fallback));
	return true;
}
