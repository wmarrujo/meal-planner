<script lang="ts">
	import {base} from "$app/paths"
	import {supabase} from "$lib/supabase"
	import {invalidateAll} from "$app/navigation"
	import * as y from "yup"
	import {superForm, defaults, setError} from "sveltekit-superforms"
	import {yup} from "sveltekit-superforms/adapters"
	import {toast} from "svelte-sonner"
	import {ArrowLeft, Mail, KeyRound, LogIn} from "lucide-svelte"
	
	////////////////////////////////////////////////////////////////////////////////
	
	const signUpSchema = y.object({
		email: y.string().email().required(),
		password: y.string().required(),
	})
	
	const signUpForm = superForm(defaults(yup(signUpSchema)), {SPA: true, validators: yup(signUpSchema),
			async onUpdate({form}) {
				if (!form.valid) { toast.error("Invalid Credentials"); return }
				
				const {error} = await supabase.auth.signUp({
					email: form.data.email,
					password: form.data.password,
					// TODO: include redirect to people page
				})
				if (error) { toast.error("Failed to Sign Up"); setError(form, "Failed to Sign Up") }
				else toast.success("Registered! Check your E-Mail to Verify", {duration: Number.POSITIVE_INFINITY})
			},
		}), {form: signUpFormData, errors: signUpFormErrors} = signUpForm
</script>

<main class="flex flex-col max-w-96 gap-4 container my-20">
	<!-- TODO: show that we are logged in, or redirect -->
	<a href="{base}/" class="btn btn-ghost"><ArrowLeft />Back to Home</a>
	<form use:signUpForm.enhance class="flex flex-col gap-2">
		<label for="email" class="input input-bordered flex items-center gap-2 {$signUpFormErrors.email && "input-error"}">
			<Mail />
			<input type="text" name="email" bind:value={$signUpFormData.email} placeholder="E-Mail" />
		</label>
		<label for="password" class="input input-bordered flex items-center gap-2 {$signUpFormErrors.password && "input-error"}">
			<KeyRound />
			<input type="password" name="password" bind:value={$signUpFormData.password} placeholder="Password" />
		</label>
		<button type="submit" class="btn btn-primary"><LogIn />Sign Up</button>
	</form>
	<div class="flex gap-2">
		<a href="{base}/login" class="btn flex-1">Log In</a>
		<button class="btn flex-1">Try It Out</button>
	</div>
</main>
