import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { APP_ROUTES } from "@/config/routes";
import { Link } from "react-router-dom";


export function ComingSoonPage() {
	return (
		<>
			<div className="h-[80dvh] flex items-center justify-center rounded-xl md:min-h-min">
				<Card>
					<CardHeader className="text-2xl text-center">Coming Soon</CardHeader>
					<CardContent>
						Application is being constantly updated. Hold tight!
					</CardContent>
				</Card>
			</div>
		</>
	);
}

export function NotFoundPage() {
	return (
		<main className="flex min-h-dvh items-center justify-center p-4">
			<Card className="w-full max-w-md text-center">
				<CardHeader>
					<CardTitle>Page not found</CardTitle>
					<CardDescription>The page you requested does not exist.</CardDescription>
				</CardHeader>
				<CardFooter className="justify-center">
					<Button asChild><Link to={APP_ROUTES.root}>Return home</Link></Button>
				</CardFooter>
			</Card>
		</main>
	);
}
