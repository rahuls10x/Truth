import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { useApplication } from "@/contexts/ApplicationContext";
import type { Client } from "@/types";
import { CreateClientSchema, type CreateClientSchema as CreateClientValues } from "@/types/validation";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircleIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";

function formatCreatedAt(value: string): string {
	const date = new Date(value);
	return Number.isNaN(date.getTime()) ? "Unknown date" : new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(date);
}

function ClientDetails({ client }: { client: Client }) {
	const idPrefix = `client-${client.clientId}`;

	return (
		<Sheet>
			<SheetTrigger asChild>
				<Button variant="outline" size="sm" className="w-full">See details</Button>
			</SheetTrigger>
			<SheetContent className="overflow-y-auto">
				<SheetHeader>
					<SheetTitle>Client details</SheetTitle>
					<SheetDescription>Credentials and authorization settings for {client.clientName}.</SheetDescription>
				</SheetHeader>
				<div className="grid gap-5 px-4">
					<Field>
						<FieldLabel htmlFor={`${idPrefix}-name`}>Name</FieldLabel>
						<Input id={`${idPrefix}-name`} value={client.clientName} readOnly />
					</Field>
					<Field>
						<FieldLabel htmlFor={`${idPrefix}-id`}>Client ID</FieldLabel>
						<Input id={`${idPrefix}-id`} value={client.clientId} readOnly />
					</Field>
					<Field>
						<FieldLabel htmlFor={`${idPrefix}-redirect`}>Redirect URI</FieldLabel>
						<Input id={`${idPrefix}-redirect`} value={client.redirectUri} readOnly />
					</Field>
					<Field>
						<FieldLabel htmlFor={`${idPrefix}-secret`}>Client secret</FieldLabel>
						<Input id={`${idPrefix}-secret`} value={client.clientSecret} readOnly />
					</Field>
					<Field>
						<FieldLabel>Scopes</FieldLabel>
						<div className="flex flex-wrap gap-1">
							{client.scopes.map(scope => <Badge key={scope}>{scope}</Badge>)}
						</div>
					</Field>
				</div>
				<SheetFooter>
					<SheetClose asChild><Button type="button" variant="outline">Close</Button></SheetClose>
				</SheetFooter>
			</SheetContent>
		</Sheet>
	);
}

export default function ClientsPage() {
	const [clientData, setClientData] = useState<Client[] | undefined>(undefined);
	const [isCreateOpen, setIsCreateOpen] = useState(false);
	const { clients, createClient } = useApplication();
	const {
		register,
		reset,
		control,
		handleSubmit,
		formState: { errors, isSubmitting },
	} = useForm<CreateClientValues>({
		defaultValues: { clientName: "", responseType: "code", scopes: [], redirectUri: "" },
		resolver: zodResolver(CreateClientSchema),
	});

	async function handleCreateNewClient(values: CreateClientValues) {
		const createdClient = await createClient(values);

		if(createdClient){
			setClientData(current => [...(current ?? []), createdClient]);
			reset();
			setIsCreateOpen(false);
		}
	}

	useEffect(() => {
		async function fetchClients() {
			const response = await clients();
			if(response){
				setClientData(response);
			}
		}

		fetchClients();
	}, []);

	return (
		<section className="space-y-5">
			<div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
				<div>
					<h2 className="text-2xl font-semibold tracking-tight">Clients</h2>
					<p className="text-sm text-muted-foreground">Manage the OAuth clients registered to your organization.</p>
				</div>
				<Sheet open={isCreateOpen} onOpenChange={setIsCreateOpen}>
					<SheetTrigger asChild><Button size="sm">Create new client</Button></SheetTrigger>
					<SheetContent className="overflow-y-auto">
						<form onSubmit={handleSubmit(handleCreateNewClient)} noValidate>
							<SheetHeader>
								<SheetTitle>Create OAuth client</SheetTitle>
								<SheetDescription>Register the callback and data scopes required by your application.</SheetDescription>
							</SheetHeader>
							<FieldGroup className="px-4">
								<Field data-invalid={Boolean(errors.clientName)}>
									<FieldLabel htmlFor="new-client-name">Client name</FieldLabel>
									<Input id="new-client-name" placeholder="My application" aria-invalid={Boolean(errors.clientName)} {...register("clientName")} />
									<FieldError>{errors.clientName?.message}</FieldError>
								</Field>
								<Field data-invalid={Boolean(errors.redirectUri)}>
									<FieldLabel htmlFor="new-client-redirect">Redirect URI</FieldLabel>
									<Input id="new-client-redirect" type="url" placeholder="https://example.com/callback" aria-invalid={Boolean(errors.redirectUri)} {...register("redirectUri")} />
									<FieldError>{errors.redirectUri?.message}</FieldError>
								</Field>
								<Field data-invalid={Boolean(errors.responseType)}>
									<FieldLabel htmlFor="new-client-response-type">Response type</FieldLabel>
									<Controller
										name="responseType"
										control={control}
										render={({ field }) => (
											<Select value={field.value} onValueChange={field.onChange}>
												<SelectTrigger id="new-client-response-type" className="w-full"><SelectValue /></SelectTrigger>
												<SelectContent>
													<SelectGroup>
														<SelectLabel>Response types</SelectLabel>
														<SelectItem value="code">Authorization code</SelectItem>
													</SelectGroup>
												</SelectContent>
											</Select>
										)}
									/>
									<FieldError>{errors.responseType?.message}</FieldError>
								</Field>
								<Field data-invalid={Boolean(errors.scopes)}>
									<FieldLabel htmlFor="new-client-scopes">Scopes</FieldLabel>
									<Input
										id="new-client-scopes"
										placeholder="name email"
										aria-invalid={Boolean(errors.scopes)}
										{...register("scopes", { setValueAs: (value: string) => (value.length > 0 ? value.trim().split(" ").filter(Boolean) : []) })}
									/>
									<p className="text-xs text-muted-foreground">Separate scopes with spaces.</p>
									<FieldError>{errors.scopes?.message}</FieldError>
								</Field>
							</FieldGroup>
							<SheetFooter>
								<Button type="submit" disabled={isSubmitting}>
									{isSubmitting && <LoaderCircleIcon className="animate-spin" />}
									Create client
								</Button>
								<SheetClose asChild><Button type="button" variant="outline" disabled={isSubmitting}>Cancel</Button></SheetClose>
							</SheetFooter>
						</form>
					</SheetContent>
				</Sheet>
			</div>

			{!clientData && (
				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3" role="status" aria-label="Loading clients">
					{Array.from({ length: 3 }, (_, index) => <Skeleton className="h-44 w-full" key={index} />)}
				</div>
			)}

			{clientData && clientData.length === 0 && (
				<Card className="border-dashed">
					<CardHeader>
						<CardTitle>No clients yet</CardTitle>
						<CardDescription>Create a client to begin an OAuth integration.</CardDescription>
					</CardHeader>
				</Card>
			)}

			{ clientData && clientData.length > 0 && (
				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
					{clientData.map(client => (
						<Card size="sm" key={client.clientId}>
							<CardHeader>
								<CardTitle>{client.clientName}</CardTitle>
								<CardDescription className="flex flex-wrap gap-1">
									{client.scopes.map(scope => <Badge key={scope}>{scope}</Badge>)}
								</CardDescription>
							</CardHeader>
							<CardContent className="text-sm text-muted-foreground">Created {formatCreatedAt(client.createdAt)}</CardContent>
							<CardFooter><ClientDetails client={client} /></CardFooter>
						</Card>
					))}
				</div>
			)}
		</section>
	);
}
