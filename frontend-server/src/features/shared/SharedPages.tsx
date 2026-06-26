import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { APP_ROUTES } from "@/config/routes";
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
					<CardDescription className="font-subheading text-base text-muted-foreground">The page you requested does not exist.</CardDescription>
				</CardHeader>
				<CardFooter className="justify-center">
					<Button asChild><Link to={APP_ROUTES.root}>Return Home</Link></Button>
				</CardFooter>
			</Card>
		</main>
	);
}
