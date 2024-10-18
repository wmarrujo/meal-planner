-- ALTER TABLE food ADD CONSTRAINT pk_food PRIMARY KEY(fdc_id);
-- ALTER TABLE food_nutrient ADD CONSTRAINT pk_food_nutrient PRIMARY KEY(id, fdc_id, nutrient_id);
-- CREATE INDEX ON food_nutrient (fdc_id, nutrient_id);
-- CREATE INDEX ON food_nutrient (fdc_id);
-- ALTER TABLE nutrient ADD CONSTRAINT pk_nutrient PRIMARY KEY(id);

CREATE EXTENSION IF NOT EXISTS isn;

DROP TABLE IF EXISTS servings;
DROP TABLE IF EXISTS foods;

--------------------------------------------------------------------------------
-- FOODS
--------------------------------------------------------------------------------
-- nutrients are per 1g or 1ml of the food

CREATE TABLE foods AS
SELECT DISTINCT ON (F.description, BF.upc) -- NOTE: same branded items will have the same UPC codes & the latest one is the correct one
	F.fdc_id AS id,
	F.description AS name,
	F.food_category_id AS category,
	BF.company AS company,
	BF.brand AS brand,
	BF.sub_brand AS sub_brand,
	BF.description AS description,
	BF.upc AS upc,
	BF.country AS country,
	COALESCE(BF.serving_unit = ANY('{ml,MLT,MC,IU}'), FALSE) AS by_volume, -- true if the nutrition is measured by volume (per ml) not by mass (per g)
	(SELECT N.amount FROM food_nutrient AS N WHERE N.fdc_id = F.fdc_id AND N.nutrient_id = 1008 LIMIT 1) / 100 AS calories, -- in kcal
	(SELECT N.amount FROM food_nutrient AS N WHERE N.fdc_id = F.fdc_id AND N.nutrient_id = 1051 LIMIT 1) / 100 AS water, -- in g
	(SELECT N.amount FROM food_nutrient AS N WHERE N.fdc_id = F.fdc_id AND N.nutrient_id = 1003 LIMIT 1) / 100 AS protein, -- in g
	COALESCE(
		(SELECT N.amount FROM food_nutrient AS N WHERE N.fdc_id = F.fdc_id AND N.nutrient_id = 1004 LIMIT 1),
		(SELECT N.amount FROM food_nutrient AS N WHERE N.fdc_id = F.fdc_id AND N.nutrient_id = 1085 LIMIT 1),
		(SELECT N.amount FROM food_nutrient AS N WHERE N.fdc_id = F.fdc_id AND N.nutrient_id = 2044 LIMIT 1)
	) / 100 AS fat, -- in g
	COALESCE(
		(SELECT N.amount FROM food_nutrient AS N WHERE N.fdc_id = F.fdc_id AND N.nutrient_id = 1079 LIMIT 1),
		(SELECT N.amount FROM food_nutrient AS N WHERE N.fdc_id = F.fdc_id AND N.nutrient_id = 2036 LIMIT 1),
		(SELECT N.amount FROM food_nutrient AS N WHERE N.fdc_id = F.fdc_id AND N.nutrient_id = 2035 LIMIT 1),
		(SELECT N.amount FROM food_nutrient AS N WHERE N.fdc_id = F.fdc_id AND N.nutrient_id = 2037 LIMIT 1),
		(SELECT N.amount FROM food_nutrient AS N WHERE N.fdc_id = F.fdc_id AND N.nutrient_id = 1084 LIMIT 1),
		(SELECT N.amount FROM food_nutrient AS N WHERE N.fdc_id = F.fdc_id AND N.nutrient_id = 1082 LIMIT 1)
	) / 100 AS fiber, -- in g
	COALESCE(
		(SELECT N.amount FROM food_nutrient AS N WHERE N.fdc_id = F.fdc_id AND N.nutrient_id = 2039 LIMIT 1),
		(SELECT N.amount FROM food_nutrient AS N WHERE N.fdc_id = F.fdc_id AND N.nutrient_id = 1005 LIMIT 1),
		(SELECT N.amount FROM food_nutrient AS N WHERE N.fdc_id = F.fdc_id AND N.nutrient_id = 1050 LIMIT 1),
		(SELECT N.amount FROM food_nutrient AS N WHERE N.fdc_id = F.fdc_id AND N.nutrient_id = 1072 LIMIT 1)
	) / 100 AS carbohydrates, -- in g
	COALESCE(
		(SELECT N.amount FROM food_nutrient AS N WHERE N.fdc_id = F.fdc_id AND N.nutrient_id = 2000 LIMIT 1),
		(SELECT N.amount FROM food_nutrient AS N WHERE N.fdc_id = F.fdc_id AND N.nutrient_id = 1063 LIMIT 1),
		(SELECT N.amount FROM food_nutrient AS N WHERE N.fdc_id = F.fdc_id AND N.nutrient_id = 1235 LIMIT 1),
		(SELECT N.amount FROM food_nutrient AS N WHERE N.fdc_id = F.fdc_id AND N.nutrient_id = 1236 LIMIT 1)
	) / 100 AS sugar, -- in g
	(SELECT N.amount FROM food_nutrient AS N WHERE N.fdc_id = F.fdc_id AND N.nutrient_id = 1253 LIMIT 1) / 100 AS cholesterol, -- in mg
	(SELECT N.amount FROM food_nutrient AS N WHERE N.fdc_id = F.fdc_id AND N.nutrient_id = 1257 LIMIT 1) / 100 AS trans_fat, -- in g
	(SELECT N.amount FROM food_nutrient AS N WHERE N.fdc_id = F.fdc_id AND N.nutrient_id = 1258 LIMIT 1) / 100 AS saturated_fat, -- in g
	(SELECT N.amount FROM food_nutrient AS N WHERE N.fdc_id = F.fdc_id AND N.nutrient_id = 1292 LIMIT 1) / 100 AS monounsaturated_fat, -- in g
	(SELECT N.amount FROM food_nutrient AS N WHERE N.fdc_id = F.fdc_id AND N.nutrient_id = 1293 LIMIT 1) / 100 AS polyunsaturated_fat, -- in g
	COALESCE(
		(SELECT N.amount FROM food_nutrient AS N WHERE N.fdc_id = F.fdc_id AND N.nutrient_id = 1089 LIMIT 1),
		(SELECT N.amount FROM food_nutrient AS N WHERE N.fdc_id = F.fdc_id AND N.nutrient_id = 1238 LIMIT 1),
		(SELECT N.amount FROM food_nutrient AS N WHERE N.fdc_id = F.fdc_id AND N.nutrient_id = 1240 LIMIT 1),
		(SELECT N.amount FROM food_nutrient AS N WHERE N.fdc_id = F.fdc_id AND N.nutrient_id = 1141 LIMIT 1),
		(SELECT N.amount FROM food_nutrient AS N WHERE N.fdc_id = F.fdc_id AND N.nutrient_id = 1142 LIMIT 1)
	) / 100 AS iron, -- in mg
	(SELECT N.amount FROM food_nutrient AS N WHERE N.fdc_id = F.fdc_id AND N.nutrient_id = 1093 LIMIT 1) / 100 AS sodium, -- in mg
	(SELECT N.amount FROM food_nutrient AS N WHERE N.fdc_id = F.fdc_id AND N.nutrient_id = 1087 LIMIT 1) / 100 AS calcium, -- in mg
	(SELECT N.amount FROM food_nutrient AS N WHERE N.fdc_id = F.fdc_id AND N.nutrient_id = 1092 LIMIT 1) / 100 AS potassium -- in mg
FROM
	food AS F
	LEFT JOIN (
		SELECT
			fdc_id AS id,
			brand_owner AS company,
			brand_name AS brand,
			subbrand_name AS sub_brand,
			short_description AS description,
			branded_food_category AS category,
			gtin_upc AS upc,
			market_country AS country,
			discontinued_date AS discontinued,
			serving_size_unit AS serving_unit
		FROM branded_food
	) AS BF ON BF.id = F.fdc_id
WHERE
	F.description <> '' -- get rid of the annoying empty one
	AND BF.discontinued IS NULL
ORDER BY
	F.description,
	BF.upc,
	publication_date DESC -- take only the latest version of a branded food
;

ALTER TABLE foods ADD CONSTRAINT pk_id PRIMARY KEY(id);

-- SELECT * FROM foods;

--------------------------------------------------------------------------------
-- SERVINGS
--------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION try_parse_number(text) RETURNS DOUBLE PRECISION AS $$ BEGIN
	RETURN (COALESCE(NULLIF(SPLIT_PART($1, '/', 1), '')::NUMERIC, 1) / COALESCE(NULLIF(NULLIF(SPLIT_PART($1, '/', 2), '')::NUMERIC, 0), 1))::DOUBLE PRECISION;
END; $$ LANGUAGE plpgsql;

CREATE TABLE servings AS
SELECT
	FP.fdc_id AS food,
	FP.gram_weight AS amount, -- g or ml (coincides with whatever the food uses)
	FP.amount AS amount_of_unit, -- how many of the unit (so like 2 waffles or 1/8 of a 9-inch pie)
	CASE WHEN MU.name = 'undetermined' THEN FP.modifier ELSE MU.name END AS unit, -- the unit (so "waffle" or "9-inch pie")
	CASE WHEN MU.name = 'undetermined' THEN NULL ELSE FP.modifier END AS modifier
FROM
	food_portion AS FP
	INNER JOIN foods AS CF ON CF.id = FP.fdc_id
	LEFT JOIN measure_unit AS MU ON MU.id = FP.measure_unit_id
WHERE
	amount IS NOT NULL

UNION ALL

SELECT
	BF.fdc_id AS food,
	BF.serving_size AS amount,
	try_parse_number((REGEXP_MATCHES(BF.household_serving_fulltext, '^(\d+(?:[\/.])?\d*)', 'gm'))[1]) AS amount_of_unit,
	(REGEXP_MATCHES(BF.household_serving_fulltext, '^(?:\d+(?:[\/.])?\d*)?\s+(.*)'))[1] AS unit,
	NULL AS modifier
FROM
	branded_food AS BF
	INNER JOIN foods AS CF ON CF.id = BF.fdc_id
WHERE
	BF.discontinued_date IS NULL
;

CREATE INDEX ON servings (food);
ALTER TABLE servings ADD CONSTRAINT fk_food FOREIGN KEY (food) REFERENCES foods ON UPDATE CASCADE ON DELETE CASCADE;

-- SELECT * FROM servings;
