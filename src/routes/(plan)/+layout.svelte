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
	import {Pencil, Plus, X, Trash2} from "lucide-svelte"
	import {SvelteSet} from "svelte/reactivity"
	
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
	
	// home edit
	// def	def	= edit existing
	// def	_	= regular page
	// _	def	= create new (but go back to the id stored in edit as home if canceled
	// _	_	= create new
	
	// ADD
	
	const householdSchema = y.object({
		name: y.string().required(),
	})
	
	const householdForm = superForm(defaults(yup(householdSchema)), {SPA: true, validators: yup(householdSchema),
			async onUpdate({form}) {
				if (!form.valid) { toast.error("Invalid"); return }
				home = await (home ? updateHousehold(home.id, form.data.name) : addHousehold(form.data.name)) // make the change, and go to any new household
				edit = undefined // close the editor
			},
		}), {form: householdFormData} = householdForm
	
	let edit: Household | undefined = $state() // if we're editing a household
	
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
	
	async function updateHousehold(household: Household["id"], name: string): Promise<Household | undefined> {
		const {error} = await supabase
			.from("households")
			.update({name})
			.eq("id", household)
		if (error) { console.error("Error in setting household name:", error); toast.error("Error in setting household name."); return }
		households[household].name = name // update the local data
		return households[household]
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
	
	// TODO: manage members
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
						<button class="btn flex-nowrap" onclick={() => { edit = home; $householdFormData = {name: home!.name} }}><Pencil class="h-5" />Edit</button>
					{/if}
					{#each Object.values(households).filter(household => household.id != home?.id) as household (household.id)}
						<li class="flex flex-nowrap">
							<button onclick={() => home = household} class="btn text-nowrap">{household.name}</button>
						</li>
					{/each}
					<li><button class="btn flex-nowrap" onclick={() => { edit = home; home = undefined; $householdFormData = {name: ""} }}><Plus class="h-5" />New</button></li>
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
			{/if}
			<div class="flex">
				<div class="flex-1">
					<form use:householdForm.enhance class="flex flex-col justify-center items-center p-4 gap-4">
						<input name="name" type="text" bind:value={$householdFormData.name} placeholder="Household Name" class="input input-bordered text-center text-xl">
						<button type="submit" class="btn btn-primary">{home ? "Update Household" : "Create Household"}</button>
					</form>
					{#if edit}
						<div class="w-full flex flex-col items-center gap-4 py-4">
							<h2>Danger Zone:</h2>
							<button onclick={() => removeHousehold(edit!.id)} class="btn btn-error"><Trash2 />Delete</button>
						</div>
					{/if}
				</div>
				<div class="flex-1">
					TODO: manage members
				</div>
			</div>
		</main>
	{/if}
</div>
