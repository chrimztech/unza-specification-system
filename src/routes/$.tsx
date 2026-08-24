import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/$")({
  head: () => ({
    meta: [
      { title: "Page not found · UNZA CICT Specification System" },
      {
        name: "description",
        content: "The page you requested does not exist in the UNZA CICT specification system.",
      },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Page not found · UNZA CICT" },
      { property: "og:description", content: "This page is not part of the CICT specification system." },
    ],
  }),
  component: NotFoundPage,
});

function NotFoundPage() {
  return (
    <div className="grid min-h-screen place-items-center px-4">
      <div className="max-w-md text-center">
        <p className="label-caps">Error 404</p>
        <h1 className="mt-2 font-display text-3xl">This page could not be found</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          The address may have changed, or you may not have access to that record. Return to the
          dashboard or contact CICT if you believe this is an error.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Button asChild>
            <Link to="/dashboard">Go to dashboard</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/">Home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
