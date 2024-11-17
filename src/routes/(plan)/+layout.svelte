<script lang="ts">
	import {base} from "$app/paths"
	import {page} from "$app/stores"
	import {logOut} from "$lib/supabase"
	import {onMount, setContext} from "svelte"
	import {supabase} from "$lib/supabase"
	import {Pencil, Plus} from "lucide-svelte"
	import {toast} from "svelte-sonner"
	import * as y from "yup"
	import {superForm, defaults} from "sveltekit-superforms"
	import {yup} from "sveltekit-superforms/adapters"
	import {households, type Household, type Person, type Meal} from "$lib/cache.svelte.js"
	import {SvelteMap} from "svelte/reactivity"
	
	////////////////////////////////////////////////////////////////////////////////
	
	let {children, data} = $props()
	
	let home: Household | undefined = $state() // the current household selected
	
	$effect(() => { if (0 < households.size) { // on page load (and after we know about some households) load home from the cache, or pick a random one if it's a new browser // NOTE: this must go before the effect below
		const saved = households.get(Number(localStorage.getItem("home")))
		home = saved ? saved : [...households.values()][0]
	}})
	$effect(() => { if (home) localStorage.setItem("home", String(home.id)) }) // put it in local storage to make sure the value is persisted across reloads
	setContext("home", {get value() { return home }}) // make the current hosuehold available on all the pages
	
	// TODO: home = home && home in households ? home : data[0].id // if home is defined and in the set of households already, keep it selected, otherwise pick a random one (the first one)
	
	onMount(() => {
		localStorage.getItem("home")
	})
	
	////////////////////////////////////////////////////////////////////////////////
	
	// home edit
	// def	def	= edit existing
	// def	_	= regular page
	// _	def	= create new (but go back to the id stored in edit as home if canceled
	// _	_	= create new
	
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
		const {data, error} = await supabase
			.from("households")
			.insert({name})
			.select("id, name, head")
			.single()
		if (error) { console.error("Error in setting household name:", error); toast.error("Error in setting household name."); return }
		const h = {...data, people: new SvelteMap<number, Person>(), meals: new SvelteMap<number, Meal>()}
		households.set(data.id, h) // update the local data
		return h
	}
	
	async function updateHousehold(household: number, name: string): Promise<Household | undefined> {
		const {error} = await supabase
			.from("households")
			.update({name})
			.eq("id", household)
		if (error) { console.error("Error in setting household name:", error); toast.error("Error in setting household name."); return }
		const h = households.get(household)
		h!.name = name // update the local data
		return h
	}
</script>

<div>
	<nav class="gap-2 navbar group">
		<h1><a href="{base}/" class="btn btn-ghost">Meal-Planner</a></h1>
		<ul class="flex gap-2">
			<li><a href="{base}/people" class="btn btn-ghost {$page.route.id?.startsWith("/people") && "underline"}">People</a></li>
			<li><a href="{base}/dishes" class="btn btn-ghost {$page.route.id?.startsWith("/dishes") && "underline"}">Dishes</a></li>
			<li><a href="{base}/meals" class="btn btn-ghost {$page.route.id?.startsWith("/meals") && "underline"}">Meals</a></li>
		</ul>
		<div class="grow"></div>
		{#if home}
			<div class="dropdown dropdown-end">
				<div tabindex="0" role="button" class="btn m-1">{home.name}</div>
				<ul class="dropdown-content menu bg-base-200 rounded-box z-[1] p-1 shadow">
					{#if home.head == data.session?.user.id}
						<button class="btn flex-nowrap" onclick={() => { edit = home; $householdFormData = {name: home!.name} }}><Pencil class="h-5" />Edit</button>
					{/if}
					{#each households.values().filter(household => household.id != home?.id) as household (household.id)}
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
		<form use:householdForm.enhance class="flex flex-col justify-center items-center p-4 gap-4">
			<input name="name" type="text" bind:value={$householdFormData.name} placeholder="Household Name" class="input input-bordered text-center text-xl">
			<button type="submit" class="btn btn-primary">{home ? "Update Household" : "Create Household"}</button>
			{#if edit}
				<button type="button" class="btn btn-ghost" onclick={() => { home = edit; edit = undefined }}>Cancel</button>
			{/if}
		</form>
	{/if}
</div>
