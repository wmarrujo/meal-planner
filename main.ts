import {Command} from "jsr:@cliffy/command@1.0.0-rc.7";
import * as YAML from "jsr:@std/yaml"
import {Plan} from "./types.ts"
import plan from "./plan.ts"

////////////////////////////////////////////////////////////////////////////////

await new Command()
	.name("meal-planner")
	.version("0.1.0")
	.description("Plan your meals, find your macros, & get fit.")
	.command("plan", new Command()
		.description("Plan out meals")
		.arguments("[file]")
		.option("-o, --output [file]", "the file to output the plan to (if not specified, will overwrite the inputted plan file, and if one doesn't exist it will write to ./plan.yaml)")
		.action(async (options, ...args) => {
			const final = await plan(args[0] ? readPlan(args[0]) : undefined)
			options.output ? writePlan(final, typeof options.output == "string" ? options.output : args[0] ?? "./plan.yaml") : console.log(final)
		})
	)
	// .command("calculate")
	.parse(Deno.args)

////////////////////////////////////////////////////////////////////////////////

function readPlan(file: string): Plan {
	return YAML.parse(Deno.readTextFileSync(file)) as Plan
	// TODO: check validity
}

function writePlan(plan: Plan, file: string) {
	Deno.writeTextFileSync(file, YAML.stringify(plan, {sortKeys: true, compatMode: false, condenseFlow: true}))
}
