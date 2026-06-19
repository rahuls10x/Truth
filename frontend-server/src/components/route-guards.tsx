import { Skeleton } from "@/components/ui/skeleton";
import { getLoginRoute, getPortalRoute } from "@/config/routes";
import { useAuth } from "@/contexts/AuthContext";
import type { EntityType } from "@/types";
import { Navigate, Outlet, useLocation } from "react-router-dom";

export function RouteLoadingScreen() {
	return (
		<div className="flex min-h-dvh items-center justify-center" role="status" aria-label="Loading application">
			<div className="w-full max-w-sm space-y-4 px-6">
				<Skeleton className="mx-auto h-8 w-32" />
				<Skeleton className="h-40 w-full" />
			</div>
		</div>
	);
}

export function PublicOnlyRoute() {
	const { entityType , isAuthenticated } = useAuth();
	if ( isAuthenticated && entityType) return <Navigate to={getPortalRoute(entityType)} replace />;

	return <Outlet />;
}

export function ProtectedRoute({ entityType }: { entityType: EntityType }) {
	const auth = useAuth();
	const location = useLocation();

	if (!auth.isAuthenticated || !auth.entityType) {
		return <Navigate to={getLoginRoute(entityType)} replace state={{ from: location }} />;
	}

	if (auth.entityType !== entityType) {
		return <Navigate to={getPortalRoute(auth.entityType)} replace />;
	}

	return <Outlet />;
}
