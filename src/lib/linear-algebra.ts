export type Variable = string

export class LinearExpression {
	constant: number = 0
	terms: Map<Variable, number> = new Map()
	
	toString() {
		const terms = [...this.terms.entries()].map(([variable, value]) => `${variable} * ${value}`).join(" + ")
		return `${terms} + ${this.constant}`
	}
	
	plus(expression: LinearExpression | number): LinearExpression {
		const temp = new LinearExpression()
		temp.terms = new Map(this.terms) // work with a copy of the left's terms
		if (typeof expression === "number") {
			temp.constant = this.constant + expression
		} else {
			temp.constant = this.constant + expression.constant
			expression.terms.forEach((value, variable) => temp.terms.set(variable, (temp.terms.get(variable) ?? 0) + value)) // add on the right's values by term
		}
		return temp
	}
	
	minus(expression: LinearExpression | number): LinearExpression {
		const temp = new LinearExpression()
		temp.terms = new Map(this.terms) // work with a copy of the left's terms
		if (typeof expression === "number") {
			temp.constant = this.constant - expression
		} else {
			temp.constant = this.constant - expression.constant
			expression.terms.forEach((value, variable) => temp.terms.set(variable, (temp.terms.get(variable) ?? 0) - value)) // subtract the right's values by term
		}
		return temp
	}
	
	times(scalar: number): LinearExpression {
		const temp = new LinearExpression()
		temp.constant = this.constant * scalar
		this.terms.forEach((value, variable) => temp.terms.set(variable, value * scalar))
		return temp
	}
}

export class LinearEquation {
	left: LinearExpression
	evaluator: "=" | "<" | ">"
	right: LinearExpression
	
	constructor(left: LinearExpression | number, evaluator: "=" | "<" | ">", right: LinearExpression | number) {
		this.evaluator = evaluator
		if (typeof left === "number") { const e = new LinearExpression(); e.constant = left; this.left = e } else { this.left = left }
		if (typeof right === "number") { const e = new LinearExpression(); e.constant = right; this.right = e } else { this.right = right }
	}
	
	toString() {
		return `${this.left} ${this.evaluator} ${this.right}`
	}
	
	// Export for YALPS
	// turn: A + (Bx+Cy) = D + (Ex+Fy)
	// into: A - D = (Ex+Fy) - (Bx+Cy)
	// then: {variables: {x: E - B, y: F - C}, constraint: {equal: A - D}}
	
	get constraint(): {equal: number} | {min: number} | {max: number} {
		const constant = this.left.constant - this.right.constant
		return this.evaluator == "=" ? {equal: constant} : this.evaluator == "<" ? {min: constant} : {max: constant}
	}
	
	get variables(): Map<Variable, number> {
		const terms = new Map(this.right.terms)
		this.left.terms.forEach((value, variable) => terms.set(variable, (terms.get(variable) ?? 0) - value))
		return terms
	}
}

// BUILDERS

export function TERMS(expression: Record<Variable, number> | number): LinearExpression {
	const temp = new LinearExpression()
	if (typeof expression === "number") temp.constant = expression
	else Object.entries(expression).forEach(([variable, value]) => temp.terms.set(variable, value))
	return temp
}

export function CONST(constant: number): LinearExpression {
	const temp = new LinearExpression()
	temp.constant = constant
	return temp
}

export function EQ(left: LinearExpression | number, evaluator: "=" | "<" | ">", right: LinearExpression | number): LinearEquation {
	return new LinearEquation(left, evaluator, right)
}

export function TERM(variable: Variable, scalar?: number): LinearExpression {
	return TERMS({[variable]: scalar ?? 1})
}

export function SUM<T>(iterable: Iterable<T>, linearize: (item: T) => LinearExpression | number): LinearExpression {
	let temp = new LinearExpression()
	for (const t of iterable) { temp = temp.plus(linearize(t)) }
	return temp
}
