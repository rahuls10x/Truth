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
import { Blocks, UserRoundKey } from "lucide-react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { Separator } from "./ui/separator";
import Logo from "@/assets/Logo";

export function AppSidebar({ entity, ...props }: { entity: EntityType }) {
	const { entity: entityDetails, entityType } = useAuth();
	const location = useLocation();
	const navItems =
		entity === "user"
			? [ 
				{ title: "Session Management", url: APP_ROUTES.user.session, icon: UserRoundKey }
			]
			: [
				{ title: "Clients", url: APP_ROUTES.organization.clients, icon: Blocks },
				{ title: "Session Management", url: APP_ROUTES.organization.session, icon: UserRoundKey },
			];

	return (
		<Sidebar collapsible="icon" {...props}>
			<SidebarHeader>
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton size="lg" className="active:bg-transparent hover:bg-transparent" asChild>
							<Link to={getPortalRoute(entity)}>
								<div className="flex items-center justify-center rounded-lg bg-transparent gap-1 ml-1">
									<Logo className="size-6.5! text-primary/90" />
									<span className="truncate font-heading text-primary font-bold text-lg">Truth</span>
								</div>
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
								<SidebarMenuButton isActive={location.pathname === item.url} tooltip={item.title} className="text-base font-button" asChild>
									<NavLink to={item.url}>
										<item.icon className="text-semibold" />
										<span>{item.title}</span>
									</NavLink>
								</SidebarMenuButton>
							</SidebarMenuItem>
						))}
					</SidebarMenu>
				</SidebarGroup>
			</SidebarContent>
			<Separator/>
			<SidebarFooter>
				<NavEntity
					entity={{
						name: entityDetails?.name ?? "Unknown account",
						email: entityDetails?.email ?? "",
						avatar: "/avatars/hinata.jpg",
						entityType:entityType
					}}
				/>
			</SidebarFooter>
			<SidebarRail />
		</Sidebar>
	);
}
