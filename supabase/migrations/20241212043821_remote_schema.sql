

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pgsodium" WITH SCHEMA "pgsodium";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "isn" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pg_trgm" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgjwt" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."restriction" AS ENUM (
    'exactly',
    'no_more_than',
    'no_less_than'
);


ALTER TYPE "public"."restriction" OWNER TO "postgres";


COMMENT ON TYPE "public"."restriction" IS 'Restriction on an amount for a given unit (kcal, g or ml, or percent)';



CREATE OR REPLACE FUNCTION "public"."add_head_as_member_trigger"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$BEGIN

INSERT INTO members (household, "user") VALUES (NEW.id, NEW.head);

RETURN NEW;
END;$$;


ALTER FUNCTION "public"."add_head_as_member_trigger"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_member_id_by_email"("email" character varying) RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $_$BEGIN

RETURN (SELECT U.id FROM auth.users AS U WHERE U."email" = $1);

END;$_$;


ALTER FUNCTION "public"."get_member_id_by_email"("email" character varying) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."my_households"() RETURNS SETOF bigint
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN

RETURN QUERY
  SELECT M.household
  FROM members AS M
  WHERE M.user = (SELECT auth.uid())
;

END
$$;


ALTER FUNCTION "public"."my_households"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."my_housemates"() RETURNS SETOF "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'auth'
    AS $$
BEGIN

RETURN QUERY
  SELECT DISTINCT M.user
  FROM members AS M
  WHERE M.household IN (SELECT my_households())
;

END
$$;


ALTER FUNCTION "public"."my_housemates"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."dishes" (
    "id" bigint NOT NULL,
    "name" "text" NOT NULL,
    "description" "text" DEFAULT ''::"text" NOT NULL,
    "manager" "uuid" DEFAULT "auth"."uid"(),
    "public" boolean DEFAULT true NOT NULL,
    "locked" boolean DEFAULT false NOT NULL
);


ALTER TABLE "public"."dishes" OWNER TO "postgres";


COMMENT ON COLUMN "public"."dishes"."manager" IS 'Who has the rights to modify this dish (null is managed by the database administrators)';



COMMENT ON COLUMN "public"."dishes"."locked" IS 'if true, then roommates cannot even edit this dish';



CREATE OR REPLACE FUNCTION "public"."search_dishes_by_name"("search" "text", "page_index" integer, "page_size" integer) RETURNS SETOF "public"."dishes"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'extensions'
    AS $$
BEGIN

RETURN QUERY
  SELECT D.*
  FROM dishes AS D
  WHERE
    D.name %> search
  ORDER BY
    similarity(search, D.name) DESC
  LIMIT page_size
  OFFSET page_index * page_size
;

END
$$;


ALTER FUNCTION "public"."search_dishes_by_name"("search" "text", "page_index" integer, "page_size" integer) OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."foods" (
    "id" bigint NOT NULL,
    "name" "text" NOT NULL,
    "category" "text",
    "company" "text",
    "brand" "text",
    "sub_brand" "text",
    "description" "text",
    "upc" "text",
    "country" "text",
    "by_volume" boolean NOT NULL,
    "calories" double precision,
    "water" double precision,
    "protein" double precision,
    "fat" double precision,
    "fiber" double precision,
    "carbohydrates" double precision,
    "sugar" double precision,
    "cholesterol" double precision,
    "trans_fat" double precision,
    "saturated_fat" double precision,
    "monounsaturated_fat" double precision,
    "polyunsaturated_fat" double precision,
    "iron" double precision,
    "sodium" double precision,
    "calcium" double precision,
    "potassium" double precision,
    "manager" "uuid",
    "public" boolean DEFAULT true NOT NULL,
    "generic" boolean DEFAULT false NOT NULL
);


ALTER TABLE "public"."foods" OWNER TO "postgres";


COMMENT ON TABLE "public"."foods" IS 'Individual foods, generic and branded, with nutrition values';



COMMENT ON COLUMN "public"."foods"."id" IS 'The FDC id';



COMMENT ON COLUMN "public"."foods"."upc" IS 'barcode number';



COMMENT ON COLUMN "public"."foods"."by_volume" IS 'whether the nutrition values are measured per gram or milliliter, false = per gram, true = per milliliter';



COMMENT ON COLUMN "public"."foods"."calories" IS 'in kcal';



COMMENT ON COLUMN "public"."foods"."water" IS 'in g';



COMMENT ON COLUMN "public"."foods"."protein" IS 'in g';



COMMENT ON COLUMN "public"."foods"."fat" IS 'in g';



COMMENT ON COLUMN "public"."foods"."fiber" IS 'in g';



COMMENT ON COLUMN "public"."foods"."carbohydrates" IS 'in g';



COMMENT ON COLUMN "public"."foods"."sugar" IS 'in g';



COMMENT ON COLUMN "public"."foods"."cholesterol" IS 'in mg';



COMMENT ON COLUMN "public"."foods"."trans_fat" IS 'in g';



COMMENT ON COLUMN "public"."foods"."saturated_fat" IS 'in g';



COMMENT ON COLUMN "public"."foods"."monounsaturated_fat" IS 'in g';



COMMENT ON COLUMN "public"."foods"."polyunsaturated_fat" IS 'in g';



COMMENT ON COLUMN "public"."foods"."iron" IS 'in mg';



COMMENT ON COLUMN "public"."foods"."sodium" IS 'in mg';



COMMENT ON COLUMN "public"."foods"."calcium" IS 'in mg';



COMMENT ON COLUMN "public"."foods"."potassium" IS 'in mg';



COMMENT ON COLUMN "public"."foods"."manager" IS 'Which user manages this food, usually the person who inserted it (null is managed by the database administrators)';



COMMENT ON COLUMN "public"."foods"."public" IS 'Whether the food is publicly visible. Private is used for when people have a specific food or nutritional thing they have that they want to include, but not share.';



CREATE OR REPLACE FUNCTION "public"."search_generic_foods_by_name"("search" "text", "page_index" integer, "page_size" integer) RETURNS SETOF "public"."foods"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'extensions'
    AS $$
BEGIN

RETURN QUERY
  SELECT F.*
  FROM foods AS F
  WHERE
    generic
    AND F.name %> search
  ORDER BY
    similarity(search, F.name) DESC
  LIMIT page_size
  OFFSET page_index * page_size
;

END
$$;


ALTER FUNCTION "public"."search_generic_foods_by_name"("search" "text", "page_index" integer, "page_size" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_member_email_trigger"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$BEGIN

NEW.email := (SELECT email FROM auth.users WHERE id = NEW.user)::TEXT;

RETURN NEW;
END;$$;


ALTER FUNCTION "public"."set_member_email_trigger"() OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."components" (
    "meal" bigint NOT NULL,
    "dish" bigint NOT NULL,
    "amount" double precision DEFAULT '1'::double precision NOT NULL,
    "percent" boolean,
    "restriction" "public"."restriction"
);


ALTER TABLE "public"."components" OWNER TO "postgres";


COMMENT ON TABLE "public"."components" IS 'The dishes that make up a meal';



COMMENT ON COLUMN "public"."components"."percent" IS 'How to measure the restriction on the amount, true is by percent, false is by kcal. When this is null it means the amount refers to the number of servings of the dish.';



COMMENT ON COLUMN "public"."components"."restriction" IS 'The restriction applied to the amount specified. If null, no restriction is specified and the amount is allowed to vary.';



ALTER TABLE "public"."dishes" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."dishes_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."eaters" (
    "meal" bigint NOT NULL,
    "eater" bigint NOT NULL
);


ALTER TABLE "public"."eaters" OWNER TO "postgres";


COMMENT ON TABLE "public"."eaters" IS 'The people which are eating the meal that normally aren''t or not eating the meal that normally are. Their presence in this table indicates the opposite of the visiting value in the people table.';



ALTER TABLE "public"."foods" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."foods_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."households" (
    "id" bigint NOT NULL,
    "name" "text" NOT NULL,
    "head" "uuid" DEFAULT "auth"."uid"() NOT NULL
);


ALTER TABLE "public"."households" OWNER TO "postgres";


ALTER TABLE "public"."households" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."households_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."ingredients" (
    "dish" bigint NOT NULL,
    "food" bigint NOT NULL,
    "serving" bigint,
    "amount" double precision NOT NULL
);


ALTER TABLE "public"."ingredients" OWNER TO "postgres";


COMMENT ON COLUMN "public"."ingredients"."serving" IS 'which serving the food amount is specified in. null means it is in grams or milliliters depending on the food by_volume field.';



COMMENT ON COLUMN "public"."ingredients"."amount" IS 'the number of servings';



CREATE TABLE IF NOT EXISTS "public"."meals" (
    "day" "date",
    "name" "text" NOT NULL,
    "amount" double precision DEFAULT '1'::double precision NOT NULL,
    "percent" boolean DEFAULT true NOT NULL,
    "restriction" "public"."restriction",
    "id" bigint NOT NULL,
    "household" bigint NOT NULL,
    "time" time without time zone
);


ALTER TABLE "public"."meals" OWNER TO "postgres";


COMMENT ON COLUMN "public"."meals"."day" IS 'The day the meal will be on. If null, that means it is a "favorited" meal, which saves it for later copying.';



ALTER TABLE "public"."meals" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."meals_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."members" (
    "user" "uuid" NOT NULL,
    "household" bigint NOT NULL,
    "email" "text" DEFAULT ''::"text" NOT NULL
);


ALTER TABLE "public"."members" OWNER TO "postgres";


COMMENT ON TABLE "public"."members" IS 'The users that have access to household information';



COMMENT ON COLUMN "public"."members"."email" IS 'the user''s email';



CREATE TABLE IF NOT EXISTS "public"."people" (
    "id" bigint NOT NULL,
    "name" "text" NOT NULL,
    "sex" real NOT NULL,
    "height" real NOT NULL,
    "weight" real NOT NULL,
    "activity" real NOT NULL,
    "goal" real NOT NULL,
    "household" bigint NOT NULL,
    "visiting" boolean DEFAULT false NOT NULL,
    "age" real NOT NULL
);


ALTER TABLE "public"."people" OWNER TO "postgres";


COMMENT ON COLUMN "public"."people"."household" IS 'The household this person is a part of';



COMMENT ON COLUMN "public"."people"."visiting" IS 'if the person is just visiting the household (that they shouldn''t be added to meals by default)';



COMMENT ON COLUMN "public"."people"."age" IS 'in years';



ALTER TABLE "public"."people" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."people_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."servings" (
    "food" bigint NOT NULL,
    "amount" double precision NOT NULL,
    "amount_of_unit" double precision NOT NULL,
    "unit" "text",
    "modifier" "text",
    "id" bigint NOT NULL
);


ALTER TABLE "public"."servings" OWNER TO "postgres";


COMMENT ON TABLE "public"."servings" IS 'The serving amounts specified for the various foods';



COMMENT ON COLUMN "public"."servings"."amount" IS 'the amount of grams or milliliters (depending on what the food is measured in, see the by_volume column)';



COMMENT ON COLUMN "public"."servings"."amount_of_unit" IS 'the number of the unit that make up "1 serving"';



COMMENT ON COLUMN "public"."servings"."unit" IS 'the colloquial units the servings are measured in. null stands for "each", where it makes sense to say a number of the food without qualifiers.';



COMMENT ON COLUMN "public"."servings"."modifier" IS 'extra detail on how the units are measured, for actual use';



ALTER TABLE "public"."servings" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."servings_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



ALTER TABLE ONLY "public"."components"
    ADD CONSTRAINT "components_pkey" PRIMARY KEY ("meal", "dish");



ALTER TABLE ONLY "public"."dishes"
    ADD CONSTRAINT "dishes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."eaters"
    ADD CONSTRAINT "eaters_pkey" PRIMARY KEY ("meal", "eater");



ALTER TABLE ONLY "public"."foods"
    ADD CONSTRAINT "foods_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."households"
    ADD CONSTRAINT "households_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ingredients"
    ADD CONSTRAINT "ingredients_pkey" PRIMARY KEY ("dish", "food");



ALTER TABLE ONLY "public"."meals"
    ADD CONSTRAINT "meals_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."members"
    ADD CONSTRAINT "members_pkey" PRIMARY KEY ("user", "household");



ALTER TABLE ONLY "public"."people"
    ADD CONSTRAINT "people_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."servings"
    ADD CONSTRAINT "servings_pkey" PRIMARY KEY ("id");



CREATE INDEX "foods_brand_trgm" ON "public"."foods" USING "gin" ("brand" "extensions"."gin_trgm_ops");



CREATE INDEX "foods_company_trgm" ON "public"."foods" USING "gin" ("company" "extensions"."gin_trgm_ops");



CREATE INDEX "foods_description_trgm" ON "public"."foods" USING "gin" ("description" "extensions"."gin_trgm_ops");



CREATE INDEX "foods_expr_idx" ON "public"."foods" USING "btree" ((1)) WHERE "generic";



CREATE INDEX "foods_name_trgm" ON "public"."foods" USING "gin" ("name" "extensions"."gin_trgm_ops");



CREATE INDEX "foods_sub_brand_trgm" ON "public"."foods" USING "gin" ("sub_brand" "extensions"."gin_trgm_ops");



CREATE OR REPLACE TRIGGER "add_head_as_member" AFTER INSERT ON "public"."households" FOR EACH ROW EXECUTE FUNCTION "public"."add_head_as_member_trigger"();



CREATE OR REPLACE TRIGGER "set_member_email" BEFORE INSERT OR UPDATE ON "public"."members" FOR EACH ROW EXECUTE FUNCTION "public"."set_member_email_trigger"();



ALTER TABLE ONLY "public"."components"
    ADD CONSTRAINT "components_dish_fkey" FOREIGN KEY ("dish") REFERENCES "public"."dishes"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."components"
    ADD CONSTRAINT "components_meal_fkey" FOREIGN KEY ("meal") REFERENCES "public"."meals"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."dishes"
    ADD CONSTRAINT "dishes_manager_fkey" FOREIGN KEY ("manager") REFERENCES "auth"."users"("id") ON UPDATE CASCADE ON DELETE SET NULL;



ALTER TABLE ONLY "public"."eaters"
    ADD CONSTRAINT "eaters_eater_fkey" FOREIGN KEY ("eater") REFERENCES "public"."people"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."eaters"
    ADD CONSTRAINT "eaters_meal_fkey" FOREIGN KEY ("meal") REFERENCES "public"."meals"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."foods"
    ADD CONSTRAINT "foods_manager_fkey" FOREIGN KEY ("manager") REFERENCES "auth"."users"("id") ON UPDATE CASCADE ON DELETE SET NULL;



ALTER TABLE ONLY "public"."households"
    ADD CONSTRAINT "households_head_fkey" FOREIGN KEY ("head") REFERENCES "auth"."users"("id") ON UPDATE CASCADE;



ALTER TABLE ONLY "public"."ingredients"
    ADD CONSTRAINT "ingredients_dish_fkey" FOREIGN KEY ("dish") REFERENCES "public"."dishes"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ingredients"
    ADD CONSTRAINT "ingredients_food_fkey" FOREIGN KEY ("food") REFERENCES "public"."foods"("id") ON UPDATE RESTRICT ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."ingredients"
    ADD CONSTRAINT "ingredients_serving_fkey" FOREIGN KEY ("serving") REFERENCES "public"."servings"("id") ON UPDATE RESTRICT ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."meals"
    ADD CONSTRAINT "meals_household_fkey" FOREIGN KEY ("household") REFERENCES "public"."households"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."members"
    ADD CONSTRAINT "members_household_fkey" FOREIGN KEY ("household") REFERENCES "public"."households"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."members"
    ADD CONSTRAINT "members_user_fkey" FOREIGN KEY ("user") REFERENCES "auth"."users"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."people"
    ADD CONSTRAINT "people_household_fkey" FOREIGN KEY ("household") REFERENCES "public"."households"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."servings"
    ADD CONSTRAINT "servings_food_fkey" FOREIGN KEY ("food") REFERENCES "public"."foods"("id") ON UPDATE CASCADE ON DELETE CASCADE;



CREATE POLICY "Allow all for head" ON "public"."households" TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "head")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "head"));



CREATE POLICY "Allow all for head" ON "public"."people" TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = ( SELECT "households"."head"
   FROM "public"."households"
  WHERE ("households"."id" = "people"."household")))) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = ( SELECT "households"."head"
   FROM "public"."households"
  WHERE ("households"."id" = "people"."household"))));



CREATE POLICY "Allow all for head for household" ON "public"."members" TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = ( SELECT "households"."head"
   FROM "public"."households"
  WHERE ("households"."id" = "members"."household"))));



CREATE POLICY "Allow all for manager" ON "public"."dishes" TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "manager")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "manager"));



CREATE POLICY "Allow all for manager" ON "public"."foods" TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "manager")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "manager"));



CREATE POLICY "Allow all for manager" ON "public"."ingredients" TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = ( SELECT "dishes"."manager"
   FROM "public"."dishes"
  WHERE ("dishes"."id" = "ingredients"."dish")))) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = ( SELECT "dishes"."manager"
   FROM "public"."dishes"
  WHERE ("dishes"."id" = "ingredients"."dish"))));



CREATE POLICY "Allow all for members" ON "public"."components" TO "authenticated" USING ((( SELECT "meals"."household"
   FROM "public"."meals"
  WHERE ("meals"."id" = "components"."meal")) IN ( SELECT "public"."my_households"() AS "my_households"))) WITH CHECK ((( SELECT "meals"."household"
   FROM "public"."meals"
  WHERE ("meals"."id" = "components"."meal")) IN ( SELECT "public"."my_households"() AS "my_households")));



CREATE POLICY "Allow all for members" ON "public"."eaters" TO "authenticated" USING ((( SELECT "meals"."household"
   FROM "public"."meals"
  WHERE ("meals"."id" = "eaters"."meal")) IN ( SELECT "public"."my_households"() AS "my_households"))) WITH CHECK ((( SELECT "meals"."household"
   FROM "public"."meals"
  WHERE ("meals"."id" = "eaters"."meal")) IN ( SELECT "public"."my_households"() AS "my_households")));



CREATE POLICY "Allow all for members" ON "public"."meals" TO "authenticated" USING (("household" IN ( SELECT "public"."my_households"() AS "my_households"))) WITH CHECK (("household" IN ( SELECT "public"."my_households"() AS "my_households")));



CREATE POLICY "Allow all for members" ON "public"."people" TO "authenticated" USING (("household" IN ( SELECT "public"."my_households"() AS "my_households"))) WITH CHECK (("household" IN ( SELECT "public"."my_households"() AS "my_households")));



CREATE POLICY "Allow select for everyone" ON "public"."foods" FOR SELECT USING (true);



CREATE POLICY "Allow select for everyone" ON "public"."ingredients" FOR SELECT USING (true);



CREATE POLICY "Allow select for everyone if public" ON "public"."dishes" FOR SELECT USING ("public");



CREATE POLICY "Allow select for housemates" ON "public"."dishes" FOR SELECT TO "authenticated" USING (("manager" IN ( SELECT "public"."my_housemates"() AS "my_housemates")));



CREATE POLICY "Allow select for members" ON "public"."households" FOR SELECT TO "authenticated" USING (("id" IN ( SELECT "public"."my_households"() AS "my_households")));



ALTER TABLE "public"."components" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."dishes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."eaters" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."foods" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."households" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ingredients" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."meals" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."members" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."people" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."servings" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."people";



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";
















































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































GRANT ALL ON FUNCTION "public"."add_head_as_member_trigger"() TO "anon";
GRANT ALL ON FUNCTION "public"."add_head_as_member_trigger"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."add_head_as_member_trigger"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_member_id_by_email"("email" character varying) TO "anon";
GRANT ALL ON FUNCTION "public"."get_member_id_by_email"("email" character varying) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_member_id_by_email"("email" character varying) TO "service_role";



GRANT ALL ON FUNCTION "public"."my_households"() TO "anon";
GRANT ALL ON FUNCTION "public"."my_households"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."my_households"() TO "service_role";



GRANT ALL ON FUNCTION "public"."my_housemates"() TO "anon";
GRANT ALL ON FUNCTION "public"."my_housemates"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."my_housemates"() TO "service_role";



GRANT ALL ON TABLE "public"."dishes" TO "anon";
GRANT ALL ON TABLE "public"."dishes" TO "authenticated";
GRANT ALL ON TABLE "public"."dishes" TO "service_role";



GRANT ALL ON FUNCTION "public"."search_dishes_by_name"("search" "text", "page_index" integer, "page_size" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."search_dishes_by_name"("search" "text", "page_index" integer, "page_size" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."search_dishes_by_name"("search" "text", "page_index" integer, "page_size" integer) TO "service_role";



GRANT ALL ON TABLE "public"."foods" TO "anon";
GRANT ALL ON TABLE "public"."foods" TO "authenticated";
GRANT ALL ON TABLE "public"."foods" TO "service_role";



GRANT ALL ON FUNCTION "public"."search_generic_foods_by_name"("search" "text", "page_index" integer, "page_size" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."search_generic_foods_by_name"("search" "text", "page_index" integer, "page_size" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."search_generic_foods_by_name"("search" "text", "page_index" integer, "page_size" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."set_member_email_trigger"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_member_email_trigger"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_member_email_trigger"() TO "service_role";


















GRANT ALL ON TABLE "public"."components" TO "anon";
GRANT ALL ON TABLE "public"."components" TO "authenticated";
GRANT ALL ON TABLE "public"."components" TO "service_role";



GRANT ALL ON SEQUENCE "public"."dishes_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."dishes_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."dishes_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."eaters" TO "anon";
GRANT ALL ON TABLE "public"."eaters" TO "authenticated";
GRANT ALL ON TABLE "public"."eaters" TO "service_role";



GRANT ALL ON SEQUENCE "public"."foods_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."foods_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."foods_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."households" TO "anon";
GRANT ALL ON TABLE "public"."households" TO "authenticated";
GRANT ALL ON TABLE "public"."households" TO "service_role";



GRANT ALL ON SEQUENCE "public"."households_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."households_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."households_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."ingredients" TO "anon";
GRANT ALL ON TABLE "public"."ingredients" TO "authenticated";
GRANT ALL ON TABLE "public"."ingredients" TO "service_role";



GRANT ALL ON TABLE "public"."meals" TO "anon";
GRANT ALL ON TABLE "public"."meals" TO "authenticated";
GRANT ALL ON TABLE "public"."meals" TO "service_role";



GRANT ALL ON SEQUENCE "public"."meals_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."meals_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."meals_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."members" TO "anon";
GRANT ALL ON TABLE "public"."members" TO "authenticated";
GRANT ALL ON TABLE "public"."members" TO "service_role";



GRANT ALL ON TABLE "public"."people" TO "anon";
GRANT ALL ON TABLE "public"."people" TO "authenticated";
GRANT ALL ON TABLE "public"."people" TO "service_role";



GRANT ALL ON SEQUENCE "public"."people_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."people_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."people_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."servings" TO "anon";
GRANT ALL ON TABLE "public"."servings" TO "authenticated";
GRANT ALL ON TABLE "public"."servings" TO "service_role";



GRANT ALL ON SEQUENCE "public"."servings_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."servings_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."servings_id_seq" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";






























RESET ALL;
