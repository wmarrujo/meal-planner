<script lang="ts">
	import {base} from "$app/paths"
	import {redirect} from "@sveltejs/kit"
	import {supabase} from "$lib/supabase"
	import * as y from "yup"
	import {superForm, defaults, setError} from "sveltekit-superforms"
	import {yup} from "sveltekit-superforms/adapters"
	import {toast} from "svelte-sonner"
	import {Mail, KeyRound, LogIn} from "lucide-svelte"
	
	////////////////////////////////////////////////////////////////////////////////
	
	const logInSchema = y.object({
		email: y.string().email().required(),
		password: y.string().required().min(16, "Password must be longer than 16 characters"),
	})
	
	const logInForm = superForm(defaults(yup(logInSchema)), {SPA: true, validators: yup(logInSchema),
			async onUpdate({form}) {
				if (!form.valid) { toast.error("Incorrect Log In Credentials"); return }
				
				const {error} = await supabase.auth.signInWithPassword({
					email: form.data.email,
					password: form.data.password,
				})
				if (error) { toast.error("Incorrect Log In Credentials"); setError(form, "Incorrect Log In Credentials") }
				else throw redirect(302, `${base}/meals`)
			},
		}), {form: logInFormData} = logInForm
</script>

<main class="flex flex-col max-w-96 gap-4 container my-20">
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
		<button class="btn flex-1">Forgot Password</button>
	</div>
</main>
