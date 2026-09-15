import { HeadContent, Scripts, createRootRoute } from "@tanstack/react-router";
export const Route = createRootRoute({ shellComponent: RootDocument });
function RootDocument({ children }: { children: React.ReactNode }) {
  return <html lang="en"><head><HeadContent /></head><body>{children}<Scripts /></body></html>;
}
