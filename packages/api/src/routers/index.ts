import { protectedProcedure, publicProcedure, router } from "../index";
import { channelRouter } from "./channel";
import { streamRouter } from "./stream";

export const appRouter = router({
	healthCheck: publicProcedure.query(() => {
		return "OK";
	}),
	privateData: protectedProcedure.query(({ ctx }) => {
		return {
			message: "This is private",
			user: ctx.session.user,
		};
	}),
	stream: streamRouter,
	channel: channelRouter,
});
export type AppRouter = typeof appRouter;
