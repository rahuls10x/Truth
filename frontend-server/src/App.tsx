import { ProtectedRoute, PublicOnlyRoute, RouteLoadingScreen } from "@/components/route-guards";
import { TooltipProvider } from "@/components/ui/tooltip";
import { APP_ROUTES } from "@/config/routes";
import { AuthProvider } from "@/contexts/AuthContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ComingSoonPage, SessionPage } from "@/features/shared/SharedPages";
import PortalLayout from "@/layouts/PortalLayout";
import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

const authPages = () => import("@/features/auth/AuthPages");

const UserLoginPage = lazy(() => authPages().then(module => ({ default: module.UserLoginPage })));
const OrganizationLoginPage = lazy(() => authPages().then(module => ({ default: module.OrganizationLoginPage })));
const UserSignupPage = lazy(() => authPages().then(module => ({ default: module.UserSignupPage })));
const OrganizationSignupPage = lazy(() => authPages().then(module => ({ default: module.OrganizationSignupPage })));
const ConsentPage = lazy(() => authPages().then(module => ({ default: module.ConsentPage })));
const EmailVerificationPage = lazy(() => authPages().then(module => ({ default: module.verifyEmailPage })));
const ClientsPage = lazy(() => import("@/features/organization/OrganizationPages"));
const NotFoundPage = lazy(() => import("@/features/shared/SharedPages").then(module => ({ default: module.NotFoundPage })));

function AppRoutes() {
	return (
		<Suspense fallback={<RouteLoadingScreen />}>
			<Routes>
				<Route path={APP_ROUTES.root} element={<Navigate to={APP_ROUTES.user.login} replace />} />

				<Route element={<PublicOnlyRoute />}>
					<Route path={APP_ROUTES.user.login} element={<UserLoginPage />} />
					<Route path={APP_ROUTES.organization.login} element={<OrganizationLoginPage />} />
					<Route path={APP_ROUTES.user.signup} element={<UserSignupPage />} />
					<Route path={APP_ROUTES.organization.signup} element={<OrganizationSignupPage />} />
					<Route path={APP_ROUTES.emailVerification} element={<EmailVerificationPage/>} />
				</Route>

				<Route element={<ProtectedRoute entityType="user" />}>
					<Route path={APP_ROUTES.consent} element={<ConsentPage />} />
					<Route path={APP_ROUTES.user.portal} element={<PortalLayout entity="user" />}>
						<Route index element={<ComingSoonPage/>} />
						<Route path={APP_ROUTES.user.session} element={<SessionPage />} />
					</Route>
				</Route>

				<Route element={<ProtectedRoute entityType="organization" />}>
					<Route path={APP_ROUTES.organization.portal} element={<PortalLayout entity="organization" />}>
						<Route index element={<ComingSoonPage />} />
						<Route path={APP_ROUTES.organization.clients} element={<ClientsPage />} />
						<Route path={APP_ROUTES.organization.session} element={<SessionPage />} />
					</Route>
				</Route>

				<Route path="*" element={<NotFoundPage />} />
			</Routes>
		</Suspense>
	);
}

export default function App() {
	return (
		<ThemeProvider>
			<TooltipProvider>
				<NotificationProvider>
					<BrowserRouter>
						<AuthProvider>
							<AppRoutes />
						</AuthProvider>
					</BrowserRouter>
				</NotificationProvider>
			</TooltipProvider>
		</ThemeProvider>
	);
}
