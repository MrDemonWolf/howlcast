import { cn } from "@howlcast/ui/lib/utils";

interface AvatarProps {
	size?: number;
	/** Display name; first 2 chars become the initials when no image is provided. */
	name?: string;
	src?: string | null;
	/** Adds a soft cyan halo (used on the broadcaster avatar). */
	halo?: boolean;
	/** Adds a small live-red dot in the bottom-right corner. */
	live?: boolean;
	/**
	 * OKLCH hue used to derive the gradient when there's no image. Lets us
	 * give different chatters distinct colours without a colour table.
	 */
	hue?: number;
	className?: string;
}

/**
 * HowlCast avatar — circular gradient with initials fallback, optional cyan
 * halo, optional live-dot corner. Matches design-handoff/howcast-v2 prototype.
 */
export function Avatar({
	size = 32,
	name = "WL",
	src,
	halo = false,
	live = false,
	hue = 240,
	className,
}: AvatarProps) {
	const initials = name.slice(0, 2).toUpperCase();
	const bg = `linear-gradient(135deg, oklch(0.65 0.16 ${hue}), oklch(0.45 0.18 ${hue + 28}))`;
	return (
		<span
			data-slot="avatar"
			className={cn("hc-avatar", halo && "halo", className)}
			style={{
				width: size,
				height: size,
				fontSize: size * 0.36,
				background: src ? undefined : bg,
				backgroundImage: src ? `url(${src})` : undefined,
				backgroundSize: "cover",
				backgroundPosition: "center",
			}}
			aria-label={name}
		>
			{!src && initials}
			{live && <span className="live-dot-corner" />}
		</span>
	);
}
