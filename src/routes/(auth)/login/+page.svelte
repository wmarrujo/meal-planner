<script lang="ts">
	import {base} from "$app/paths"
	import {goto, invalidateAll} from "$app/navigation"
	import {supabase} from "$lib/supabase"
	import * as y from "yup"
	import {superForm, defaults, setError} from "sveltekit-superforms"
	import {yup} from "sveltekit-superforms/adapters"
	import {toast} from "svelte-sonner"
	import {ArrowLeft, Mail, KeyRound, LogIn} from "lucide-svelte"
	
	////////////////////////////////////////////////////////////////////////////////
	
	export let data
	
	const logInSchema = y.object({
		email: y.string().email().required(),
		password: y.string().required().min(16, "Password must be longer than 16 characters"),
	})
	
	const logInForm = superForm(defaults(yup(logInSchema)), {SPA: true, validators: yup(logInSchema),
			async onUpdate({form}) {
				console.log("BLARGH!", form.valid)
				if (!form.valid) { toast.error("Incorrect Log In Credentials"); return }
				
				const {error} = await supabase.auth.signInWithPassword({
					email: form.data.email,
					password: form.data.password,
				})
				if (error) { toast.error("Incorrect Log In Credentials"); setError(form, "Incorrect Log In Credentials") }
				else goto(`${base}/meals`, {invalidateAll: true}) // go to a logged in page & force the page to check the session, since it has been updated
			},
		}), {form: logInFormData, errors: logInFormErrors} = logInForm
</script>

<main class="flex flex-col max-w-96 gap-4 container my-20">
	<!-- TODO: show that we are logged in, or redirect -->
	{data.session?.user?.id}
	<a href="{base}/" class="btn btn-ghost"><ArrowLeft />Back to Home</a>
	<form use:logInForm.enhance class="flex flex-col gap-2">
		<label for="email" class="input input-bordered flex items-center gap-2">
			<Mail />
			<input type="text" name="email" bind:value={$logInFormData.email} placeholder="E-Mail" />
		</label>
		<label for="password" class="input input-bordered flex items-center gap-2">
			<KeyRound />
			<input type="password" name="password" bind:value={$logInFormData.password} placeholder="Password" />
		</label>
		<button type="submit" class="btn btn-primary"><LogIn />Log In</button>
	</form>
	<div class="flex gap-2">
		<a href="{base}/signup" class="btn flex-1">Sign Up</a>
		<button class="btn flex-1" disabled={!$logInFormData.email || Boolean($logInFormErrors.email)}>Forgot Password</button>
		<!-- TODO: forgot password -->
	</div>
</main>
