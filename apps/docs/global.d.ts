declare module "*.css" {}

declare module "@/.source/*" {
	export const docs: import("fumadocs-mdx/runtime/server").DocsSource;
}
