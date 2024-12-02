<script lang="ts">
	import {base} from "$app/paths"
	import {page} from "$app/stores"
	import {logOut} from "$lib/supabase"
	import {setContext} from "svelte"
	import {supabase} from "$lib/supabase"
	import {toast} from "svelte-sonner"
	import * as y from "yup"
	import {superForm, defaults} from "sveltekit-superforms"
	import {yup} from "sveltekit-superforms/adapters"
	import {households, type Household} from "$lib/cache.svelte"
	import {Pencil, Plus, X, Trash2, Star} from "lucide-svelte"
	
	////////////////////////////////////////////////////////////////////////////////
	
	let {children, data} = $props()
	
	let home: Household | undefined = $state() // the current household selected
	
	$effect(() => { if (0 < Object.keys(households).length) { // on page load (and after we know about some households) load home from the cache, or pick a random one if it's a new browser // NOTE: this must go before the effect below
		const saved = localStorage.getItem("home")
		home = saved && !isNaN(Number(saved)) && households[Number(saved)] ? households[Number(saved)] : Object.values(households)[0]
	}})
	$effect(() => { if (home) localStorage.setItem("home", String(home.id)) }) // put it in local storage to make sure the value is persisted across reloads
	setContext("home", {get value() { return home }}) // make the current hosuehold available on all the pages
	
	////////////////////////////////////////////////////////////////////////////////
	// HOUSEHOLD
	////////////////////////////////////////////////////////////////////////////////
	
	let edit: Household | undefined = $state() // if we're editing a household
	
	// home edit
	// def	def	= edit existing
	// def	_	= regular page
	// _	def	= create new (but go back to the id stored in edit as home if canceled
	// _	_	= create new
	
	// ADD
	
	const addHouseholdSchema = y.object({
		name: y.string().required(),
	})
	
	const addHouseholdForm = superForm(defaults(yup(addHouseholdSchema)), {SPA: true, validators: yup(addHouseholdSchema),
			async onUpdate({form}) {
				if (!form.valid) { toast.error("Invalid"); return }
				home = await addHousehold(form.data.name) // make the change, and go to the new household
				edit = undefined // close the editor
			},
		}), {form: addHouseholdFormData} = addHouseholdForm
	
	async function addHousehold(name: string): Promise<Household | undefined> {
		const {data: householdData, error} = await supabase
			.from("households")
			.insert({name})
			.select("id, name, head")
			.single()
		if (error) { console.error("Error in setting household name:", error); toast.error("Error in setting household name."); return }
		const h = {
			...householdData,
			members: {[data.session!.user.id]: { // because we know the only member will be ourselves, let's not send another query to get this information
				household: householdData.id,
				user: data.session!.user.id,
				email: data.session!.user.email,
			}},
			people: {},
			meals: {}
		} as Household
		households[householdData.id] = h // update the local data
		return h
	}
	
	// EDIT
	
	async function setHouseholdName(household: Household["id"], name: string) {
		const {error} = await supabase
			.from("households")
			.update({name})
			.eq("id", household)
		if (error) { console.error("Error in setting household name:", error); toast.error("Error in setting household name."); return }
		households[household].name = name // update the local data
	}
	
	// REMOVE
	
	async function removeHousehold(household: Household["id"]) {
		if (!confirm("Are you sure you want to remove this household? All its data will be lost and irrecoverable.")) return
		const {error} = await supabase
			.from("households")
			.delete()
			.eq("id", household)
		if (error) { console.error("Error in removing household", error); toast.error("Error in removing household."); return }
		delete households[household] // update the local cache
		home = 0 < Object.keys(households).length ? Object.values(households)[0] : undefined // default to showing another home
		edit = undefined // stop editing
	}
	
	////////////////////////////////////////////////////////////////////////////////
	// MEMBERS
	////////////////////////////////////////////////////////////////////////////////
	
	// ADD
	
	const memberSchema = y.object({
		email: y.string().email().required(),
	})
	
	const memberForm = superForm(defaults(yup(memberSchema)), {SPA: true, validators: yup(memberSchema),
			async onUpdate({form}) {
				if (!form.valid) { toast.error("Invalid"); return }
				if (!edit) { toast.error("No household"); return }
				addMember(edit.id, form.data.email) // make the change, and go to any new member
			},
		}), {form: memberFormData} = memberForm
	
	async function addMember(household: Household["id"], email: string) {
		const {data: user, error: emailError} = await supabase
			.rpc("get_member_id_by_email", {email})
		if (emailError || !user) { toast.error("Did not find a user with that email. Ask them to sign up if they haven't already."); return }
		const {data: member, error: memberError} = await supabase
			.from("members")
			.insert({household, user})
			.select()
			.single()
		if (memberError) { console.error("Error in adding member."); toast.error("Error in adding member."); return }
		households[household].members[member.user] = member
	}
	
	// REMOVE
	
	async function removeMember(household: Household["id"], user: string) {
		const {error} = await supabase
			.from("members")
			.delete()
			.eq("user", user)
		if (error) { console.error("Error in deleting member.", error); toast.error("Error in deleting member."); return }
		delete households[household].members[user]
	}
</script>

<div>
	<nav class="gap-2 navbar group">
		<h1><a href="{base}/" class="btn btn-ghost">Meal-Planner</a></h1>
		<div class="h-10 w-px bg-base-300"></div>
		<ul class="flex gap-2">
			<li><a href="{base}/people" class="btn btn-ghost {$page.route.id?.startsWith("/people") && "underline"}">People</a></li>
			<li><a href="{base}/dishes" class="btn btn-ghost {$page.route.id?.startsWith("/dishes") && "underline"}">Dishes</a></li>
			<li><a href="{base}/meals" class="btn btn-ghost {$page.route.id?.startsWith("/meals") && "underline"}">Meals</a></li>
			<div class="h-10 w-px bg-base-300"></div>
			<li><a href="{base}/groceries" class="btn btn-ghost {$page.route.id?.startsWith("/groceries") && "underline"}">Groceries</a></li>
			<li><a href="{base}/cooking" class="btn btn-ghost {$page.route.id?.startsWith("/cooking") && "underline"}">Cooking</a></li>
			<li><a href="{base}/eating" class="btn btn-ghost {$page.route.id?.startsWith("/eating") && "underline"}">Eating</a></li>
		</ul>
		<div class="grow"></div>
		{#if home}
			<div class="dropdown dropdown-end">
				<div tabindex="0" role="button" class="btn m-1">{home.name}</div>
				<ul class="dropdown-content menu bg-base-200 rounded-box z-[1] p-1 shadow">
					{#if home.head === data.session?.user.id}
						<button class="btn flex-nowrap" onclick={() => { edit = home; $addHouseholdFormData = {name: home!.name} }}><Pencil class="h-5" />Edit</button>
					{/if}
					{#each Object.values(households).filter(household => household.id != home?.id) as household (household.id)}
						<li class="flex flex-nowrap">
							<button onclick={() => home = household} class="btn text-nowrap">{household.name}</button>
						</li>
					{/each}
					<li><button class="btn flex-nowrap" onclick={() => { edit = home; home = undefined; $addHouseholdFormData = {name: ""} }}><Plus class="h-5" />New</button></li>
				</ul>
			</div>
		{/if}
		{#if $page.data.session?.user}
			<button onclick={logOut} class="btn btn-ghost">Log Out</button>
		{:else}
			<a href="{base}/signup" class="btn btn-ghost">Sign Up</a>
		{/if}
	</nav>
	{#if home && !edit}
		{@render children()}
	{:else}
		<main class="bg-base-200 flex flex-col container">
			{#if edit}
				<div class="flex justify-end">
					<button type="button" class="btn btn-ghost btn-square btn-sm my-4" onclick={() => { home = edit; edit = undefined }}><X /></button>
				</div>
				<div class="flex">
					<div class="flex-1 flex flex-col items-center gap-4 p-4">
						<label for="household-name">Household Name</label>
						<input id="household-name" type="text" value={edit.name} onchange={event => setHouseholdName(edit!.id, event.currentTarget.value)} placeholder="Name" class="input input-bordered text-center text-xl">
						{#if data.session?.user.id == edit.head}
							<div class="flex flex-col items-center border-t border-base-300 mt-4 pt-2 w-full">
								<h2 class="text-error">Danger Zone:</h2>
								<button onclick={() => removeHousehold(edit!.id)} class="btn btn-error"><Trash2 />Delete</button>
								<!-- TODO: transfer ownership -->
							</div>
						{/if}
					</div>
					{#if data.session?.user.id == edit.head}
						<div class="flex-1 flex flex-col items-center gap-4 p-4">
							<div class="flex flex-col gap-2">
								{#each Object.values(edit.members) as member}
									<div class="group flex items-center gap-2">
										{#if member.user == edit.head}
											<div class="w-8 h-8 flex justify-center items-center"><Star /></div>
										{:else}
											<button onclick={() => removeMember(edit!.id, member.user)} class="btn btn-square btn-sm invisible group-hover:visible hover:btn-error"><Trash2 /></button>
										{/if}
										<div class="grow">{member.email}</div>
									</div>
								{/each}
							</div>
							<form use:memberForm.enhance class="flex gap-2">
								<input name="email" type="text" bind:value={$memberFormData.email} placeholder="E-Mail" class="input input-bordered">
								<button class="btn btn-square btn-primary"><Plus /></button>
							</form>
						</div>
					{/if}
				</div>
			{:else}
				<form use:addHouseholdForm.enhance class="flex flex-col justify-center items-center p-4 gap-4">
					<input name="name" type="text" bind:value={$addHouseholdFormData.name} placeholder="Household Name" class="input input-bordered text-center text-xl">
					<button type="submit" class="btn btn-primary">{home ? "Update Household" : "Create Household"}</button>
				</form>
			{/if}
		</main>
	{/if}
</div>
