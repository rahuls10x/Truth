import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { APP_ROUTES } from "@/config/routes";
import { useApplication } from "@/contexts/ApplicationContext";
import { formatRelativeTime } from "@/lib/utils";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

export function ComingSoonPage() {
	return (
		<>
			<div className="h-[80dvh] flex items-center justify-center rounded-xl md:min-h-min">
				<Card className="text-accent-foreground bg-accent">
					<CardHeader className="text-xl md:text-2xl text-center font-subheading font-bold">Coming Soon</CardHeader>
					<CardContent className="text-base md:text-lg font-text text-center">
						Application is being constantly updated. <br />
						Hold tight!
					</CardContent>
				</Card>
			</div>
		</>
	);
}

export function NotFoundPage() {
	return (
		<main className="flex min-h-dvh items-center justify-center p-4">
			<Card className="w-full max-w-md text-center bg-accent text-accent-foreground">
				<CardHeader>
					<CardTitle className="font-heading text-2xl">Page not found</CardTitle>
					<CardDescription className="font-subheading text-base text-muted-foreground">
						The page you requested does not exist.
					</CardDescription>
				</CardHeader>
				<CardFooter className="justify-center">
					<Button asChild>
						<Link to={APP_ROUTES.root}>Return Home</Link>
					</Button>
				</CardFooter>
			</Card>
		</main>
	);
}

export function SessionPage() {
	const { sessionMethods } = useApplication();
	const { sessionsData, sessions, revokeSession, revokeAllSessions } = sessionMethods;
	const [isLoadingId, setIsLoadingId] = useState<boolean | string>(false);

	async function handleRevokeSession(sessionRef: string) {
		setIsLoadingId(sessionRef);
		await revokeSession(sessionRef);
		setIsLoadingId(false);
	}

	async function handleRevokeAllSessions() {
		setIsLoadingId(true);
		await revokeAllSessions();
		setIsLoadingId(false);
	}

	useEffect(() => {
		sessions();
	}, [sessions]);
	return (
		<section className="space-y-5">
			<div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
				<div>
					<h2 className="text-2xl font-semibold tracking-tight">Active Sessions</h2>
					<p className="text-sm text-muted-foreground">Manage all your active sessions here.</p>
				</div>
				<Button variant={"destructive"} size="lg" onClick={handleRevokeAllSessions}>
					Revoke All
				</Button>
			</div>

			{!sessionsData && (
				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3" role="status" aria-label="Loading clients">
					{Array.from({ length: 3 }, (_, index) => (
						<Skeleton className="h-44 w-full" key={index} />
					))}
				</div>
			)}

			{sessionsData && sessionsData.length > 0 && (
				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
					{sessionsData.map(session => (
						<Card key={session.sessionRef} className="bg-background drop-shadow-accent drop-shadow-xs hover:drop-shadow-sm">
							<CardHeader>
								<CardTitle className="flex">
									{session.hardware.client.name ?? "Unknown"} {session.isCurrent && <Badge className="ml-2">Active</Badge>}
								</CardTitle>
								<CardDescription>{session.hardware.os.name ?? "Unknown OS"}</CardDescription>
							</CardHeader>
							<CardContent>
								<div className="flex font-subheading">
									<h3 className="text-xs">IP Address: </h3>
									<span className="ml-2 text-xs">{session.ip}</span>
								</div>
								<div className="flex font-subheading">
									<h3 className="text-xs">Expires</h3>
									<span className="ml-0.5 text-xs">{formatRelativeTime(new Date(session.expiresAt))}</span>
								</div>
								<div className="flex font-subheading">
									<h3 className="text-xs">Logged in</h3>
									<span className="ml-0.5 text-xs">{formatRelativeTime(new Date(session.createdAt))}</span>
								</div>
							</CardContent>
							<CardFooter>
								<Button
									variant={session.isCurrent ? "ghost" : "default"}
									disabled={session.isCurrent || isLoadingId === session.sessionRef || isLoadingId === true}
									onClick={() => handleRevokeSession(session.sessionRef)}
								>
									{session.isCurrent && "Active"} 
									{!session.isCurrent && (isLoadingId !== session.sessionRef && isLoadingId !== true) && "Revoke"}
									{(isLoadingId === session.sessionRef || isLoadingId === true) && !session.isCurrent && "Revoking..." }
								</Button>
							</CardFooter>
						</Card>
					))}
				</div>
			)}
		</section>
	);
}
