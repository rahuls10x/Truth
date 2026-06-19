import { NavEntity } from "@/components/nav-user";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarRail,
} from "@/components/ui/sidebar";
import { APP_ROUTES, getPortalRoute } from "@/config/routes";
import { useAuth } from "@/contexts/AuthContext";
import type { EntityType } from "@/types";
import { AudioLinesIcon, Blocks, UsersRound } from "lucide-react";
import { Link, NavLink, useLocation } from "react-router-dom";

export function AppSidebar({ entity, ...props }: { entity: EntityType }) {
	const { entity: entityDetails } = useAuth();
	const location = useLocation();
	const navItems =
		entity === "user"
			? [{ title: "Profile settings", url: APP_ROUTES.user.profile, icon: UsersRound }]
			: [{ title: "Clients", url: APP_ROUTES.organization.clients, icon: Blocks }];
	const accountAction = entity === "user" ? APP_ROUTES.user.profile : APP_ROUTES.organization.clients;

	return (
		<Sidebar collapsible="icon" {...props}>
			<SidebarHeader>
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton size="lg" asChild>
							<Link to={getPortalRoute(entity)}>
								<div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
									<AudioLinesIcon className="size-4" />
								</div>
								<span className="truncate font-semibold">Truth</span>
							</Link>
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarHeader>
			<SidebarContent>
				<SidebarGroup>
					<SidebarMenu>
						{navItems.map(item => (
							<SidebarMenuItem key={item.url}>
								<SidebarMenuButton isActive={location.pathname === item.url} tooltip={item.title} asChild>
									<NavLink to={item.url}>
										<item.icon />
										<span>{item.title}</span>
									</NavLink>
								</SidebarMenuButton>
							</SidebarMenuItem>
						))}
					</SidebarMenu>
				</SidebarGroup>
			</SidebarContent>
			<SidebarFooter>
				<NavEntity
					entity={{
						name: entityDetails?.name ?? "Unknown account",
						email: entityDetails?.email ?? "",
						avatar: "/avatars/hinata.jpg",
						action: accountAction,
						actionLabel: entity === "user" ? "Profile" : "Clients",
					}}
				/>
			</SidebarFooter>
			<SidebarRail />
		</Sidebar>
	);
}
