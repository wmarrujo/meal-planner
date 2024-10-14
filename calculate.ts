import {Plan} from "./types.ts"
import {default as Solver, Model} from "npm:javascript-lp-solver@0.4.24"

////////////////////////////////////////////////////////////////////////////////
// DATA
////////////////////////////////////////////////////////////////////////////////

// const foods: Array<Food> = await NDJSON.readNdjson("./data/foods.ndjson")
let plan: Plan = {people: {}, days: {}, dishes: {}, foods: {}}

////////////////////////////////////////////////////////////////////////////////

export default function main(plan: Plan) {
	console.log("TODO: incomplete")
	// const model = setup()
	// const results = Solver.solve(model)
}

function setup(): Model {
	return {
		optimize: "difference",
		opType: "min",
		variables: {},
		constraints: {},
	}
}
