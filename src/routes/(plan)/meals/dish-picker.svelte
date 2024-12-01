<script lang="ts">
	import {createCombobox} from "svelte-headlessui"
	import {Plus} from "lucide-svelte"
	import {debounce} from "ts-debounce"
	import {supabase} from "$lib/supabase"
	
	////////////////////////////////////////////////////////////////////////////////
	
	type Option = {id: number, name: string}
	
	let {
		selected = $bindable(),
		value = $bindable(),
		name,
		form,
		class: customClasses = "",
		onselect = () => {},
	}: {
		selected?: Option
		value?: number
		name?: string
		form?: string
		class?: string
		onselect?: (dish: number) => void
	} = $props()
	
	let options: Array<Option> = $state([])
	
	const combobox = createCombobox({label: "Actions", selected})
	
	const search = debounce(async (search: string) => {
		const {data, error} = await supabase
			.rpc("search_dishes_by_name", {search, page_index: 0, page_size: 50})
			.select("id, name")
		if (error) { console.error("Error in searching dishes by name:", error); return }
		options = data
	}, 200)
	
	function onChange(e: Event) {
		selected = (e as CustomEvent).detail.selected
		value = selected?.id
	}
</script>

<div class="relative {customClasses}">
	<!-- TODO: put a button in front that shows the name, then when you click it it hides and shows the text input underneath, then when you get out of the text input it shows again -->
	<label class="input input-bordered flex items-center gap-2 pr-2">
		<input
			type="text"
			{name}
			{form}
			use:combobox.input
			value={$combobox.selected?.name}
			oninput={event => search(event.currentTarget.value)}
			onchange={onChange}
			autocomplete="off"
			class="grow"
		/>
		<button use:combobox.button><Plus /></button>
	</label>
	
	<div class="absolute mt-1 max-h-40 overflow-scroll w-full p-2 bg-base-300 text-base-content rounded-b-lg {!$combobox.expanded && "hidden"}">
		<!-- TODO: put in yours vs. others button -->
		<!-- TODO: put in some buttons to say how we're searching. like for who it's by -->
		<div use:combobox.items role="list">
			{#each options as option, index (index)}
				<button use:combobox.item={{value: option}} onclick={() => onselect(option.id)} class="p-2 w-full text-left hover:bg-primary hover:text-primary-content cursor-pointer rounded-md">
					{option.name}
				</button>
				<!-- TODO: add pagination -->
			{:else}
				<span class="p-2">
					No items
				</span>
			{/each}
		</div>
	</div>
</div>
