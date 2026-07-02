import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { useApplication } from "@/contexts/ApplicationContext";
import { ProfileSchema, type ProfileSchema as ProfileValues } from "@/types/validation";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircleIcon, type LucideIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";

function ProfileSkeleton() {
	return (
		<div className="space-y-5 px-5" role="status" aria-label="Loading profile">
			{Array.from({ length: 4 }, (_, index) => (
				<div className="space-y-2" key={index}>
					<Skeleton className="h-5 w-24" />
					<Skeleton className="h-9 w-full" />
				</div>
			))}
		</div>
	);
}

export function ProfilePage({ icon: Icon, text }: { icon: LucideIcon; text: string }) {
	const [profileData, setProfileData] = useState<ProfileValues | undefined>(undefined);
	const { profile, updateProfile } = useApplication();
	const [isCreateOpen, setIsCreateOpen] = useState(false);
	const {
		register,
		reset,
		control,
		handleSubmit,
		formState: { errors, isSubmitting, isDirty },
	} = useForm<ProfileValues>({
		defaultValues: { name: "", email: "", age: -1, gender: "Prefer not to say" },
		resolver: zodResolver(ProfileSchema),
	});

	async function handleUpdate(values: ProfileValues) {
		if (await updateProfile(values)) {
			setProfileData(values);
			reset(values);
		}
	}

	useEffect(() => {
		async function fetchProfileDetails() {
			const response = await profile();
			if (response) {
				console.log(response);
				setProfileData(response);
				reset(response);
			}
		}
		fetchProfileDetails();
	}, []);

	return (
		<Sheet open={isCreateOpen} onOpenChange={setIsCreateOpen}>
			<SheetTrigger asChild>
				<Button
					variant={"ghost"}
					className="w-full h-full justify-baseline rounded-md font-normal px-1.5 py-1 hover:bg-accent dark:hover:bg-accent dark:hover:text-accent-foreground hover:text-accent-foreground"
				>
					<Icon /> {text}
				</Button>
			</SheetTrigger>
			<SheetContent showCloseButton={false}>
				<SheetHeader>
					<SheetTitle className="font-heading text-xl">Edit your profile</SheetTitle>
					<SheetDescription className="font-subheading text-sm">You can change you profile details here</SheetDescription>
				</SheetHeader>

				{!profileData && <ProfileSkeleton />}

				{profileData && (
					<form onSubmit={handleSubmit(handleUpdate)} noValidate>
						<FieldGroup className="px-5">
							<Field data-invalid={Boolean(errors.name)}>
								<FieldLabel htmlFor="profile-name">Full name</FieldLabel>
								<Input id="profile-name" autoComplete="name" aria-invalid={Boolean(errors.name)} {...register("name")} />
								<FieldError>{errors.name?.message}</FieldError>
							</Field>
							<Field data-invalid={Boolean(errors.email)} aria-readonly>
								<FieldLabel htmlFor="profile-email">Email</FieldLabel>
								<Input
									id="profile-email"
									type="email"
									autoComplete="email"
									aria-invalid={Boolean(errors.email)}
									readOnly
									{...register("email")}
								/>
								<FieldError>{errors.email?.message}</FieldError>
							</Field>
							<Field data-invalid={Boolean(errors.age)}>
								<FieldLabel htmlFor="profile-age">Age</FieldLabel>

								<Controller
									name="age"
									control={control}
									render={({ field }) => (
										<Input
											id="profile-age"
											type="number"
											min={13}
											max={120}
											aria-invalid={Boolean(errors.age)}
											value={field.value === -1 ? "" : field.value}
											onChange={e => {
												const value = e.target.value;
												field.onChange(value === "" ? -1 : Number(value));
											}}
											onBlur={field.onBlur}
											name={field.name}
											ref={field.ref}
										/>
									)}
								/>

								<FieldError>{errors.age?.message}</FieldError>
							</Field>
							<Field data-invalid={Boolean(errors.gender)}>
								<FieldLabel htmlFor="profile-gender">Gender</FieldLabel>
								<Controller
									name="gender"
									control={control}
									render={({ field }) => (
										<Select value={field.value} onValueChange={field.onChange}>
											<SelectTrigger id="profile-gender" className="w-full" aria-invalid={Boolean(errors.gender)}>
												<SelectValue placeholder="Select gender" />
											</SelectTrigger>
											<SelectContent>
												<SelectGroup>
													<SelectLabel>Gender</SelectLabel>
													<SelectItem value="Male">Male</SelectItem>
													<SelectItem value="Female">Female</SelectItem>
													<SelectItem value="Prefer not to say">Prefer not to say</SelectItem>
												</SelectGroup>
											</SelectContent>
										</Select>
									)}
								/>
								<FieldError>{errors.gender?.message}</FieldError>
							</Field>
							<Field orientation="horizontal">
								<Button type="submit" disabled={isSubmitting || !isDirty}>
									{isSubmitting && <LoaderCircleIcon className="animate-spin" />}
									Save changes
								</Button>
								<Button type="button" variant="outline" disabled={isSubmitting || !isDirty} onClick={() => reset(profileData)}>
									Cancel
								</Button>
							</Field>
						</FieldGroup>
					</form>
				)}
			</SheetContent>
		</Sheet>
	);
}
