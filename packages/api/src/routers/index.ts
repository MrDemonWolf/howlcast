import { protectedProcedure, publicProcedure, router } from "../index";
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
});
export type AppRouter = typeof appRouter;
