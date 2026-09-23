import { isRouteErrorResponse, useRouteError } from "react-router-dom";
import { ErrorState } from "@/components/feedback";

/** Router errorElement: covers render errors and failed lazy chunk loads. */
export function RouteError() {
  const error = useRouteError();
  const message = isRouteErrorResponse(error) ? `${error.status} ${error.statusText}` : undefined;
  return (
    <div className="p-6">
      <ErrorState message={message} onRetry={() => window.location.reload()} />
    </div>
  );
}
