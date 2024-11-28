# Solver

Solved *per day*, *per person*

## Constants

$N$ = set of nutrients ($c$ = calories, $p$ = protein)

$\Bbb{N}^n$ = the target amount of nutrient $n$ per day

$\blacklozenge_n$ = how much we care about hitting nutrient $n$ target (a number from 1 to 10)

$M$ = set of meals in the day

$D_m$ = set of dishes (components) in meal $m$

$N^n_d$ = the nutrient

$R^c_m$ = the calorie restriction of meal $m$ (not defined for all meals)

$R^{c\%}_m$ = the calorie percentage restriction of meal $m$ (not defined for all meals)

$R^s_{md}$ = the serving restriction of dish $d$ in meal $m$ (not defined for all meal components)

$R^c_{md}$ = the calorie restriction of dish $d$ in meal $m$ (not defined for all meal components)

$R^{c\%}_{md}$ = the calorie percentage restriction of dish $d$ in meal $m$ (not defined for all meal components)

## Variables

$e_n$ = nutrient $n$ error (percentage difference with the target)

$s_{md}$ = the number of servings of dish $d$ in meal $m$

## Objective

**Minimize**

```math
\sum_{n \in N}\left(\blacklozenge_n \cdot e_n\right)
```

## Constraints

### Define error variables as an absolute value

```math
e_n \geq \frac{\sum_{m \in M}\left(\sum_{d \in D_m}\left(N^n_d \cdot s_{md}\right)\right) - \Bbb{N}^n}{\Bbb{N}^n} \qquad \forall n \in N
```

```math
e_n \geq -\frac{\sum_{m \in M}\left(\sum_{d \in D_m}\left(N^n_d \cdot s_{md}\right)\right) - \Bbb{N}^n}{\Bbb{N}^n} \qquad \forall n \in N
```

Define the error ($e = |\frac{a - t}{t}|$) as the absolute value of the percentage error from the target nutrition amount.

NOTE: this works because the objective function is trying to minimize this value

### Sanity Checks

```math
0 \leq s_{md} \qquad \forall m \in M, d \in D_m
```

No negative servings.


### Restrict servings for meals that are explicitly restricted

NOTE: only defined for restrictions that exist

NOTE: for the restrictions, replace the $=$ with $\geq$ if the restriction says to have "no less than" or $\leq$ for "no more than"

#### if the restriction is for the calories of the meal in the day

```math
\sum_{d \in D_m}\left(N^c_d \cdot s_{md}\right) = R^c_m \qquad \forall m \in M
```

#### if the restriction is for the percentage of calories of the meal in the day

```math
\sum_{}\left(N^c_d \cdot s_{md}\right) = R^{c\%}_m \cdot \sum_{x \in M}\left(\sum_{y \in D_m}\left(N^c_y \cdot s_{xy}\right)\right) \qquad \forall m \in M
```


### Restrict servings for dishes that are explicitly restricted

NOTE: only defined for restrictions that exist

NOTE: for the restrictions, replace the $=$ with $\geq$ if the restriction says to have "no less than" or $\leq$ for "no more than"

#### if the restriction is for the number of servings of the dish

```math
s_{md} = R^s_{md} \qquad \forall m \in M, d \in D_m
```

#### if the restriction is for the calories of the dish in the meal

```math
N^c_d \cdot s_{md} = R^c_{md} \qquad \forall m \in M, d \in D_m
```

#### if the restriction is for the percentage of calories of the dish in the meal

```math
N^c_d \cdot s_{md} = R^{c\%}_{md} \cdot \sum_{y \in D_m}\left(N^c_y \cdot s_{my}\right) \qquad \forall m \in M, d \in D_m
```
