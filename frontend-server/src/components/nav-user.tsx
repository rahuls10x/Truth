import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { BadgeCheckIcon, ChevronsUpDownIcon, LogOutIcon, MoonIcon, SunIcon } from "lucide-react";
import { Link } from "react-router-dom";

interface NavEntityProps {
	entity: {
		name: string;
		email: string;
		avatar: string;
		action: string;
		actionLabel: string;
	};
}

function getInitials(name: string): string {
	return name
		.split(/\s+/)
		.filter(Boolean)
		.slice(0, 2)
		.map(part => part[0]?.toUpperCase())
		.join("") || "TR";
}

export function NavEntity({ entity }: NavEntityProps) {
	const { isMobile } = useSidebar();
	const { logout } = useAuth();
	const { theme, toggleTheme } = useTheme();


	return (
		<SidebarMenu>
			<SidebarMenuItem>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<SidebarMenuButton size="lg" className="hover:bg-accent data-[state=open]:bg-accent data-[state=open]:text-accent-foreground">
							<Avatar className="h-8 w-8 rounded-lg">
								<AvatarImage src={entity.avatar} alt="" />
								<AvatarFallback className="rounded-lg">{getInitials(entity.name)}</AvatarFallback>
							</Avatar>
							<div className="grid flex-1 text-left text-sm leading-tight">
								<span className="truncate font-medium">{entity.name}</span>
								<span className="truncate text-xs">{entity.email}</span>
							</div>
							<ChevronsUpDownIcon className="ml-auto size-4" />
						</SidebarMenuButton>
					</DropdownMenuTrigger>
					<DropdownMenuContent className="min-w-56 rounded-lg" side={isMobile ? "bottom" : "right"} align="end" sideOffset={4}>
						<DropdownMenuLabel className="font-normal">
							<p className="truncate text-sm font-medium">{entity.name}</p>
							<p className="truncate text-xs text-muted-foreground">{entity.email}</p>
						</DropdownMenuLabel>
						<DropdownMenuSeparator />
						<DropdownMenuGroup>
							<DropdownMenuItem asChild>
								<Link to={entity.action}>
									<BadgeCheckIcon />
									{entity.actionLabel}
								</Link>
							</DropdownMenuItem>
							<DropdownMenuItem onClick={toggleTheme}>
								{theme === "dark" ? <SunIcon /> : <MoonIcon />}
								{theme === "dark" ? "Light theme" : "Dark theme"}
							</DropdownMenuItem>
						</DropdownMenuGroup>
						<DropdownMenuSeparator />
						<DropdownMenuItem onClick={() => void logout()}>
							<LogOutIcon />
							Log out
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</SidebarMenuItem>
		</SidebarMenu>
	);
}
