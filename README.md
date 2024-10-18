# Meal Planner

- you plan out each day
- there are multiple meals a day
- meals are made up of multiple dishes
- a dish is made up of ingredients with amounts
- everything uses SI units preferring g, cm, and kcal

## Setup

download the USDA's food database from [here](https://fdc.nal.usda.gov/fdc-datasets/FoodData_Central_csv_2024-04-18.zip), open the zip, and put the csv files into the folder `/supabase/data/cache/usda-data` in this project.
Then, with a postgres server on your machine, run the various import sequences in `seed.sql`, then run the sequences in `transform.sql`.
Finally, to copy the data, run `pg_dump -a -t foods <local-database> | psql -h <remote-host> -p <remote-port> -d postgres -U <remote-user>` (tables must have the same name).

## useful links
- [Goblin Tools Chef](https://goblin.tools/Chef)
- [Just the Recipe](https://www.justtherecipe.com/)
