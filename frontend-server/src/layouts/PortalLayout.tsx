import { AppSidebar } from "@/components/app-sidebar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { ApplicationProvider } from "@/contexts/ApplicationContext";
import type { EntityType } from "@/types";
import { Outlet, useLocation } from "react-router-dom";

function getPageTitle(pathname: string): string {
	if (pathname.endsWith("/clients")) return "OAuth Clients";
	if (pathname.endsWith("/session")) return "Session Management";
	return "Portal";
}

export default function PortalLayout({ entity }: { entity: EntityType }) {
	const location = useLocation();

	return (
		<ApplicationProvider>
			<SidebarProvider>
				<AppSidebar entity={entity} />
				<SidebarInset className="min-w-0">
					<header className="flex h-16 shrink-0 items-center border-b bg-background/95 backdrop-blur">
						<div className="flex items-center gap-2 px-4">
							<SidebarTrigger className="-ml-1" />
							<Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
							<h1 className="text-sm font-heading font-semibold">{getPageTitle(location.pathname)}</h1>
						</div>
					</header>
					<ScrollArea className="h-[calc(100dvh-4rem)]">
						<main className="mx-auto w-full max-w-6xl p-4 md:p-6">
							<Outlet />
						</main>
					</ScrollArea>
				</SidebarInset>
			</SidebarProvider>
		</ApplicationProvider>
	);
}
