import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function generateId(prefix = ""): string {
	const id = Math.random().toString(36).slice(2, 9) + Math.random().toString(36).slice(2, 9);
	return prefix ? `${prefix}_${id}` : id;
}

const rtf = new Intl.RelativeTimeFormat("en", {
	numeric: "always",
});

export function formatRelativeTime(date: Date | string | number): string {
	const now = Date.now();
	const time = new Date(date).getTime();
	const diff = time - now;

	const units = [
		{ unit: "year", ms: 1000 * 60 * 60 * 24 * 365 },
		{ unit: "month", ms: 1000 * 60 * 60 * 24 * 30 },
		{ unit: "week", ms: 1000 * 60 * 60 * 24 * 7 },
		{ unit: "day", ms: 1000 * 60 * 60 * 24 },
		{ unit: "hour", ms: 1000 * 60 * 60 },
		{ unit: "minute", ms: 1000 * 60 },
		{ unit: "second", ms: 1000 },
	] as const;

	for (const { unit, ms } of units) {
		const value = diff / ms;

		if (Math.abs(value) >= 1) {
			return rtf.format(Math.round(value), unit);
		}
	}

	return "Just now";
}
