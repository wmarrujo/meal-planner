CREATE TABLE food (
	"fdc_id" BIGINT,
	"data_type" TEXT,
	"description" TEXT,
	"food_category_id" TEXT,
	"publication_date" DATE
);

psql -d usda -c "\copy food FROM 'usda-data/food.csv' CSV HEADER"

SELECT * FROM food;

------------------------------------------------------------------------------

SELECT DISTINCT
	data_type
FROM food
;

CREATE TABLE food_nutrient (
	"id" BIGINT,
	"fdc_id" BIGINT,
	"nutrient_id" BIGINT,
	"amount" DOUBLE PRECISION,
	"data_points" INTEGER,
	"derivation_id" BIGINT,
	"min" DOUBLE PRECISION,
	"max" DOUBLE PRECISION,
	"median" DOUBLE PRECISION,
	"loq" TEXT,
	"footnote" TEXT,
	"min_year_acquired" INTEGER,
	"percent_daily_value" DOUBLE PRECISION
);

psql -d usda -c "\copy food_nutrient FROM 'usda-data/food_nutrient.csv' WITH (FORMAT CSV, HEADER, FORCE_NULL(id, fdc_id, nutrient_id, amount, data_points, derivation_id, min, max, median, loq, footnote, min_year_acquired, percent_daily_value))"

SELECT * FROM food_nutrient;

------------------------------------------------------------------------------

CREATE TABLE food_category (
	"id" BIGINT,
	"code" BIGINT,
	"description" TEXT
);

psql -d usda -c "\copy food_category FROM 'usda-data/food_category.csv' WITH (FORMAT CSV, HEADER)"

SELECT * FROM food_category;

------------------------------------------------------------------------------

CREATE TABLE food_calorie_conversion_factor (
	"food_nutrient_conversion_factor_id" BIGINT,
	"protein_value" DOUBLE PRECISION,
	"fat_value" DOUBLE PRECISION,
	"carbohydrate_value" DOUBLE PRECISION
);

psql -d usda -c "\copy food_calorie_conversion_factor FROM 'usda-data/food_calorie_conversion_factor.csv' WITH (FORMAT CSV, HEADER, FORCE_NULL(protein_value, fat_value, carbohydrate_value))"

SELECT * FROM food_calorie_conversion_factor;

------------------------------------------------------------------------------

CREATE TABLE food_nutrient_conversion_factor (
	"id" BIGINT,
	"fdc_id" BIGINT
);

psql -d usda -c "\copy food_nutrient_conversion_factor FROM 'usda-data/food_nutrient_conversion_factor.csv' WITH (FORMAT CSV, HEADER)"

SELECT * FROM food_nutrient_conversion_factor;

------------------------------------------------------------------------------

CREATE TABLE food_portion (
	"id" BIGINT,
	"fdc_id" BIGINT,
	"seq_num" INTEGER,
	"amount" DOUBLE PRECISION,
	"measure_unit_id" BIGINT,
	"portion_description" TEXT,
	"modifier" TEXT,
	"gram_weight" DOUBLE PRECISION,
	"data_points" INTEGER,
	"footnote" TEXT,
	"min_year_acquired" INTEGER
);

psql -d usda -c "\copy food_portion FROM 'usda-data/food_portion.csv' WITH (FORMAT CSV, HEADER, FORCE_NULL(id, fdc_id, seq_num, amount, measure_unit_id, portion_description, modifier, gram_weight, data_points, footnote, min_year_acquired))"

SELECT * FROM food_portion;

------------------------------------------------------------------------------

CREATE TABLE food_protein_conversion_factor (
	"food_nutrient_conversion_factor_id" BIGINT,
	"value" DOUBLE PRECISION
);

psql -d usda -c "\copy food_protein_conversion_factor FROM 'usda-data/food_protein_conversion_factor.csv' WITH (FORMAT CSV, HEADER)"

SELECT * FROM food_protein_conversion_factor;

------------------------------------------------------------------------------

CREATE TABLE nutrient (
	"id" BIGINT,
	"name" TEXT,
	"unit_name" TEXT,
	"nutrient_nbr" TEXT,
	"rank" DOUBLE PRECISION
);

psql -d usda -c "\copy nutrient FROM 'usda-data/nutrient.csv' WITH (FORMAT CSV, HEADER, FORCE_NULL(id, name, unit_name, nutrient_nbr, rank))"

SELECT * FROM nutrient ORDER BY rank;

------------------------------------------------------------------------------

CREATE TABLE measure_unit (
	"id" BIGINT,
	"name" TEXT
);

psql -d usda -c "\copy measure_unit FROM 'usda-data/measure_unit.csv' WITH (FORMAT CSV, HEADER)"

SELECT * FROM measure_unit;

------------------------------------------------------------------------------

CREATE TABLE food_component (
	"id" BIGINT,
	"fdc_id" BIGINT,
	"name" TEXT,
	"pct_weight" DOUBLE PRECISION,
	"is_refuse" BOOLEAN,
	"gram_weight" DOUBLE PRECISION,
	"data_points" INTEGER,
	"min_year_acquired" INTEGER
);

psql -d usda -c "\copy food_component FROM 'usda-data/food_component.csv' WITH (FORMAT CSV, HEADER, FORCE_NULL(id, fdc_id, name, pct_weight, is_refuse, gram_weight, data_points, min_year_acquired))"

SELECT * FROM food_component;

------------------------------------------------------------------------------

CREATE TABLE input_food (
	"id" BIGINT,
	"fdc_id" BIGINT,
	"fdc_id_of_input_food" BIGINT,
	"seq_num" INTEGER,
	"amount" DOUBLE PRECISION,
	"sr_code" BIGINT,
	"sr_description" TEXT,
	"unit" TEXT,
	"portion_code" BIGINT,
	"portion_description" TEXT,
	"gram_weight" DOUBLE PRECISION,
	"retention_code" BIGINT,
	"survey_flag" TEXT
);

psql -d usda -c "\copy input_food FROM 'usda-data/input_food.csv' WITH (FORMAT CSV, HEADER, FORCE_NULL(id, fdc_id, fdc_id_of_input_food, seq_num, amount, sr_code, sr_description, unit, portion_code, portion_description, gram_weight, retention_code, survey_flag))"

SELECT * FROM input_food;

------------------------------------------------------------------------------

CREATE TABLE branded_food (
	"fdc_id" BIGINT,
	"brand_owner" TEXT,
	"brand_name" TEXT,
	"subbrand_name" TEXT,
	"gtin_upc" TEXT,
	"ingredients" TEXT,
	"not_a_significant_source_of" TEXT,
	"serving_size" DOUBLE PRECISION,
	"serving_size_unit" TEXT,
	"household_serving_fulltext" TEXT,
	"branded_food_category" TEXT,
	"data_source" TEXT,
	"package_weight" TEXT,
	"modified_date" DATE,
	"available_date" DATE,
	"market_country" TEXT,
	"discontinued_date" DATE,
	"preparation_state_code" TEXT,
	"trade_channel" TEXT,
	"short_description" TEXT
);

psql -d usda -c "\copy branded_food FROM 'usda-data/branded_food.csv' WITH (FORMAT CSV, HEADER, FORCE_NULL(fdc_id, brand_owner, brand_name, subbrand_name, gtin_upc, ingredients, not_a_significant_source_of, serving_size, serving_size_unit, household_serving_fulltext, branded_food_category, data_source, package_weight, modified_date, available_date, market_country, discontinued_date, preparation_state_code, trade_channel, short_description))"

SELECT * FROM branded_food;
