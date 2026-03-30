


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


CREATE EXTENSION IF NOT EXISTS "pgsodium";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgjwt" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."rls_auto_enable"() RETURNS "event_trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog'
    AS $$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$$;


ALTER FUNCTION "public"."rls_auto_enable"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."save_new_project_with_materials_and_subprojects"("p_user_id" "uuid", "p_payload" "jsonb") RETURNS "jsonb"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
declare
  v_project_id uuid;
  v_project_material jsonb;
  v_subproject jsonb;
  v_subproject_id uuid;
  v_subproject_material jsonb;
begin
  if auth.uid() is null or auth.uid() <> p_user_id then
    return jsonb_build_object(
      'success',
      false,
      'error',
      'Authentication required and user must match payload'
    );
  end if;

  if coalesce(trim(p_payload->>'name'), '') = '' then
    return jsonb_build_object(
      'success',
      false,
      'error',
      'Project name is required'
    );
  end if;

  insert into public.projects (
    user_id,
    name,
    description,
    estimated_time,
    is_public
  )
  values (
    p_user_id,
    trim(p_payload->>'name'),
    nullif(trim(coalesce(p_payload->>'description', '')), ''),
    case
      when nullif(trim(coalesce(p_payload->>'estimated_time', '')), '') is null then null
      else greatest((p_payload->>'estimated_time')::numeric, 0)
    end,
    coalesce((p_payload->>'is_public')::boolean, false)
  )
  returning id into v_project_id;

  for v_project_material in
    select value from jsonb_array_elements(coalesce(p_payload->'materials', '[]'::jsonb))
  loop
    if coalesce(trim(v_project_material->>'inventory_item_id'), '') = '' then
      continue;
    end if;

    insert into public.project_materials (
      project_id,
      subproject_id,
      inventory_item_id,
      quantity_needed,
      is_fulfilled
    )
    values (
      v_project_id,
      null,
      (v_project_material->>'inventory_item_id')::uuid,
      greatest((v_project_material->>'quantity_needed')::numeric, 0),
      coalesce((v_project_material->>'is_fulfilled')::boolean, false)
    );
  end loop;

  for v_subproject in
    select value from jsonb_array_elements(coalesce(p_payload->'subprojects', '[]'::jsonb))
  loop
    insert into public.subprojects (
      project_id,
      name,
      description,
      estimated_time,
      order_index
    )
    values (
      v_project_id,
      trim(coalesce(v_subproject->>'name', '')),
      nullif(trim(coalesce(v_subproject->>'description', '')), ''),
      case
        when nullif(trim(coalesce(v_subproject->>'estimated_time', '')), '') is null then null
        else greatest((v_subproject->>'estimated_time')::numeric, 0)
      end,
      greatest(coalesce((v_subproject->>'order_index')::integer, 0), 0)
    )
    returning id into v_subproject_id;

    for v_subproject_material in
      select value from jsonb_array_elements(coalesce(v_subproject->'materials', '[]'::jsonb))
    loop
      if coalesce(trim(v_subproject_material->>'inventory_item_id'), '') = '' then
        continue;
      end if;

      insert into public.project_materials (
        project_id,
        subproject_id,
        inventory_item_id,
        quantity_needed,
        is_fulfilled
      )
      values (
        null,
        v_subproject_id,
        (v_subproject_material->>'inventory_item_id')::uuid,
        greatest((v_subproject_material->>'quantity_needed')::numeric, 0),
        coalesce((v_subproject_material->>'is_fulfilled')::boolean, false)
      );
    end loop;
  end loop;

  return jsonb_build_object(
    'success',
    true,
    'project_id',
    v_project_id
  );
exception
  when others then
    return jsonb_build_object(
      'success',
      false,
      'error',
      sqlerrm
    );
end;
$$;


ALTER FUNCTION "public"."save_new_project_with_materials_and_subprojects"("p_user_id" "uuid", "p_payload" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_project_with_materials_and_subprojects"("p_project_id" "uuid", "p_user_id" "uuid", "p_payload" "jsonb") RETURNS "jsonb"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
declare
  v_project_id uuid;
  v_project_material jsonb;
  v_project_material_id uuid;
  v_desired_project_material_ids uuid[] := array[]::uuid[];
  v_subproject jsonb;
  v_subproject_id uuid;
  v_desired_subproject_ids uuid[] := array[]::uuid[];
  v_subproject_material jsonb;
  v_subproject_material_id uuid;
  v_desired_subproject_material_ids uuid[];
begin
  if auth.uid() is null or auth.uid() <> p_user_id then
    return jsonb_build_object(
      'success',
      false,
      'error',
      'Authentication required and user must match payload'
    );
  end if;

  if coalesce(trim(p_payload->>'name'), '') = '' then
    return jsonb_build_object(
      'success',
      false,
      'error',
      'Project name is required'
    );
  end if;

  update public.projects
  set
    name = trim(p_payload->>'name'),
    description = nullif(trim(coalesce(p_payload->>'description', '')), ''),
    estimated_time = case
      when nullif(trim(coalesce(p_payload->>'estimated_time', '')), '') is null then null
      else greatest((p_payload->>'estimated_time')::numeric, 0)
    end,
    is_public = coalesce((p_payload->>'is_public')::boolean, false),
    updated_at = now()
  where id = p_project_id
    and user_id = p_user_id
  returning id into v_project_id;

  if v_project_id is null then
    return jsonb_build_object(
      'success',
      false,
      'error',
      'Project not found or access denied'
    );
  end if;

  for v_project_material in
    select value from jsonb_array_elements(coalesce(p_payload->'materials', '[]'::jsonb))
  loop
    v_project_material_id := nullif(v_project_material->>'id', '')::uuid;
    if v_project_material_id is not null then
      v_desired_project_material_ids := array_append(
        v_desired_project_material_ids,
        v_project_material_id
      );
    end if;
  end loop;

  delete from public.project_materials pm
  where pm.project_id = v_project_id
    and pm.subproject_id is null
    and (
      array_length(v_desired_project_material_ids, 1) is null
      or not (pm.id = any(v_desired_project_material_ids))
    );

  for v_project_material in
    select value from jsonb_array_elements(coalesce(p_payload->'materials', '[]'::jsonb))
  loop
    if coalesce(trim(v_project_material->>'inventory_item_id'), '') = '' then
      continue;
    end if;

    v_project_material_id := nullif(v_project_material->>'id', '')::uuid;
    if v_project_material_id is not null then
      update public.project_materials
      set
        inventory_item_id = (v_project_material->>'inventory_item_id')::uuid,
        quantity_needed = greatest((v_project_material->>'quantity_needed')::numeric, 0),
        is_fulfilled = coalesce((v_project_material->>'is_fulfilled')::boolean, false),
        updated_at = now()
      where id = v_project_material_id
        and project_id = v_project_id
        and subproject_id is null;

      if found then
        continue;
      end if;
    end if;

    insert into public.project_materials (
      project_id,
      subproject_id,
      inventory_item_id,
      quantity_needed,
      is_fulfilled
    )
    values (
      v_project_id,
      null,
      (v_project_material->>'inventory_item_id')::uuid,
      greatest((v_project_material->>'quantity_needed')::numeric, 0),
      coalesce((v_project_material->>'is_fulfilled')::boolean, false)
    );
  end loop;

  for v_subproject in
    select value from jsonb_array_elements(coalesce(p_payload->'subprojects', '[]'::jsonb))
  loop
    v_subproject_id := nullif(v_subproject->>'id', '')::uuid;
    if v_subproject_id is not null then
      v_desired_subproject_ids := array_append(v_desired_subproject_ids, v_subproject_id);
    end if;
  end loop;

  delete from public.project_materials pm
  using public.subprojects s
  where pm.subproject_id = s.id
    and s.project_id = v_project_id
    and (
      array_length(v_desired_subproject_ids, 1) is null
      or not (s.id = any(v_desired_subproject_ids))
    );

  delete from public.subprojects s
  where s.project_id = v_project_id
    and (
      array_length(v_desired_subproject_ids, 1) is null
      or not (s.id = any(v_desired_subproject_ids))
    );

  for v_subproject in
    select value from jsonb_array_elements(coalesce(p_payload->'subprojects', '[]'::jsonb))
  loop
    v_subproject_id := nullif(v_subproject->>'id', '')::uuid;

    if v_subproject_id is not null then
      update public.subprojects
      set
        name = trim(coalesce(v_subproject->>'name', '')),
        description = nullif(trim(coalesce(v_subproject->>'description', '')), ''),
        estimated_time = case
          when nullif(trim(coalesce(v_subproject->>'estimated_time', '')), '') is null then null
          else greatest((v_subproject->>'estimated_time')::numeric, 0)
        end,
        order_index = greatest(coalesce((v_subproject->>'order_index')::integer, 0), 0),
        updated_at = now()
      where id = v_subproject_id
        and project_id = v_project_id;

      if not found then
        insert into public.subprojects (
          project_id,
          name,
          description,
          estimated_time,
          order_index
        )
        values (
          v_project_id,
          trim(coalesce(v_subproject->>'name', '')),
          nullif(trim(coalesce(v_subproject->>'description', '')), ''),
          case
            when nullif(trim(coalesce(v_subproject->>'estimated_time', '')), '') is null then null
            else greatest((v_subproject->>'estimated_time')::numeric, 0)
          end,
          greatest(coalesce((v_subproject->>'order_index')::integer, 0), 0)
        )
        returning id into v_subproject_id;
      end if;
    else
      insert into public.subprojects (
        project_id,
        name,
        description,
        estimated_time,
        order_index
      )
      values (
        v_project_id,
        trim(coalesce(v_subproject->>'name', '')),
        nullif(trim(coalesce(v_subproject->>'description', '')), ''),
        case
          when nullif(trim(coalesce(v_subproject->>'estimated_time', '')), '') is null then null
          else greatest((v_subproject->>'estimated_time')::numeric, 0)
        end,
        greatest(coalesce((v_subproject->>'order_index')::integer, 0), 0)
      )
      returning id into v_subproject_id;
    end if;

    v_desired_subproject_material_ids := array[]::uuid[];
    for v_subproject_material in
      select value from jsonb_array_elements(coalesce(v_subproject->'materials', '[]'::jsonb))
    loop
      v_subproject_material_id := nullif(v_subproject_material->>'id', '')::uuid;
      if v_subproject_material_id is not null then
        v_desired_subproject_material_ids := array_append(
          v_desired_subproject_material_ids,
          v_subproject_material_id
        );
      end if;
    end loop;

    delete from public.project_materials pm
    where pm.subproject_id = v_subproject_id
      and pm.project_id is null
      and (
        array_length(v_desired_subproject_material_ids, 1) is null
        or not (pm.id = any(v_desired_subproject_material_ids))
      );

    for v_subproject_material in
      select value from jsonb_array_elements(coalesce(v_subproject->'materials', '[]'::jsonb))
    loop
      if coalesce(trim(v_subproject_material->>'inventory_item_id'), '') = '' then
        continue;
      end if;

      v_subproject_material_id := nullif(v_subproject_material->>'id', '')::uuid;
      if v_subproject_material_id is not null then
        update public.project_materials
        set
          inventory_item_id = (v_subproject_material->>'inventory_item_id')::uuid,
          quantity_needed = greatest((v_subproject_material->>'quantity_needed')::numeric, 0),
          is_fulfilled = coalesce((v_subproject_material->>'is_fulfilled')::boolean, false),
          updated_at = now()
        where id = v_subproject_material_id
          and subproject_id = v_subproject_id
          and project_id is null;

        if found then
          continue;
        end if;
      end if;

      insert into public.project_materials (
        project_id,
        subproject_id,
        inventory_item_id,
        quantity_needed,
        is_fulfilled
      )
      values (
        null,
        v_subproject_id,
        (v_subproject_material->>'inventory_item_id')::uuid,
        greatest((v_subproject_material->>'quantity_needed')::numeric, 0),
        coalesce((v_subproject_material->>'is_fulfilled')::boolean, false)
      );
    end loop;
  end loop;

  return jsonb_build_object(
    'success',
    true,
    'project_id',
    v_project_id
  );
exception
  when others then
    return jsonb_build_object(
      'success',
      false,
      'error',
      sqlerrm
    );
end;
$$;


ALTER FUNCTION "public"."update_project_with_materials_and_subprojects"("p_project_id" "uuid", "p_user_id" "uuid", "p_payload" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'pg_catalog'
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."inventory_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "quantity" numeric DEFAULT 0 NOT NULL,
    "unit" "text" NOT NULL,
    "unit_cost" numeric DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."inventory_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."project_files" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid",
    "subproject_id" "uuid",
    "file_path" "text" NOT NULL,
    "file_type" "text" NOT NULL,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "project_or_subproject" CHECK (((("project_id" IS NOT NULL) AND ("subproject_id" IS NULL)) OR (("project_id" IS NULL) AND ("subproject_id" IS NOT NULL))))
);


ALTER TABLE "public"."project_files" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."project_materials" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid",
    "subproject_id" "uuid",
    "inventory_item_id" "uuid" NOT NULL,
    "quantity_needed" numeric NOT NULL,
    "is_fulfilled" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "project_or_subproject" CHECK (((("project_id" IS NOT NULL) AND ("subproject_id" IS NULL)) OR (("project_id" IS NULL) AND ("subproject_id" IS NOT NULL))))
);


ALTER TABLE "public"."project_materials" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."projects" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "name" character varying,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT ("now"() AT TIME ZONE 'utc'::"text") NOT NULL,
    "updated_at" timestamp with time zone DEFAULT ("now"() AT TIME ZONE 'utc'::"text"),
    "estimated_time" numeric,
    "is_public" boolean DEFAULT false NOT NULL
);


ALTER TABLE "public"."projects" OWNER TO "postgres";


COMMENT ON TABLE "public"."projects" IS 'Main projects table containing DIY project details';



COMMENT ON COLUMN "public"."projects"."id" IS 'Unique identifier for the project';



COMMENT ON COLUMN "public"."projects"."user_id" IS 'Reference to the user who created this project';



COMMENT ON COLUMN "public"."projects"."name" IS 'Name of the project';



COMMENT ON COLUMN "public"."projects"."description" IS 'Detailed description of the project, including goals and overview';



COMMENT ON COLUMN "public"."projects"."estimated_time" IS 'Estimated time to complete the project in hours';



CREATE TABLE IF NOT EXISTS "public"."subprojects" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "estimated_time" numeric,
    "order_index" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."subprojects" OWNER TO "postgres";


ALTER TABLE ONLY "public"."inventory_items"
    ADD CONSTRAINT "inventory_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."project_files"
    ADD CONSTRAINT "project_files_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."project_materials"
    ADD CONSTRAINT "project_materials_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."projects"
    ADD CONSTRAINT "projects_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."subprojects"
    ADD CONSTRAINT "subprojects_pkey" PRIMARY KEY ("id");



CREATE OR REPLACE TRIGGER "update_inventory_items_updated_at" BEFORE UPDATE ON "public"."inventory_items" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_project_files_updated_at" BEFORE UPDATE ON "public"."project_files" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_project_materials_updated_at" BEFORE UPDATE ON "public"."project_materials" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_projects_updated_at" BEFORE UPDATE ON "public"."projects" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_subprojects_updated_at" BEFORE UPDATE ON "public"."subprojects" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."inventory_items"
    ADD CONSTRAINT "inventory_items_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."project_files"
    ADD CONSTRAINT "project_files_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_files"
    ADD CONSTRAINT "project_files_subproject_id_fkey" FOREIGN KEY ("subproject_id") REFERENCES "public"."subprojects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_materials"
    ADD CONSTRAINT "project_materials_inventory_item_id_fkey" FOREIGN KEY ("inventory_item_id") REFERENCES "public"."inventory_items"("id");



ALTER TABLE ONLY "public"."project_materials"
    ADD CONSTRAINT "project_materials_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_materials"
    ADD CONSTRAINT "project_materials_subproject_id_fkey" FOREIGN KEY ("subproject_id") REFERENCES "public"."subprojects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."projects"
    ADD CONSTRAINT "projects_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON UPDATE CASCADE ON DELETE SET NULL;



ALTER TABLE ONLY "public"."subprojects"
    ADD CONSTRAINT "subprojects_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



CREATE POLICY "Users can delete their own inventory" ON "public"."inventory_items" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own projects" ON "public"."projects" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their project's subprojects" ON "public"."subprojects" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."projects"
  WHERE (("projects"."id" = "subprojects"."project_id") AND ("projects"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can insert subprojects to their projects" ON "public"."subprojects" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."projects"
  WHERE (("projects"."id" = "subprojects"."project_id") AND ("projects"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can insert their own inventory" ON "public"."inventory_items" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own projects" ON "public"."projects" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage their project's files" ON "public"."project_files" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."projects"
  WHERE ((("projects"."id" = "project_files"."project_id") OR ("projects"."id" = ( SELECT "subprojects"."project_id"
           FROM "public"."subprojects"
          WHERE ("subprojects"."id" = "project_files"."subproject_id")))) AND ("projects"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can manage their project's materials" ON "public"."project_materials" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."projects"
  WHERE ((("projects"."id" = "project_materials"."project_id") OR ("projects"."id" = ( SELECT "subprojects"."project_id"
           FROM "public"."subprojects"
          WHERE ("subprojects"."id" = "project_materials"."subproject_id")))) AND ("projects"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can update their own inventory" ON "public"."inventory_items" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own projects" ON "public"."projects" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their project's subprojects" ON "public"."subprojects" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."projects"
  WHERE (("projects"."id" = "subprojects"."project_id") AND ("projects"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can view their own inventory" ON "public"."inventory_items" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own projects" ON "public"."projects" FOR SELECT TO "authenticated" USING ((("auth"."uid"() = "user_id") OR ("is_public" = true)));



CREATE POLICY "Users can view their project's files" ON "public"."project_files" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."projects"
  WHERE ((("projects"."id" = "project_files"."project_id") OR ("projects"."id" = ( SELECT "subprojects"."project_id"
           FROM "public"."subprojects"
          WHERE ("subprojects"."id" = "project_files"."subproject_id")))) AND (("projects"."user_id" = "auth"."uid"()) OR ("projects"."is_public" = true))))));



CREATE POLICY "Users can view their project's materials" ON "public"."project_materials" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."projects"
  WHERE ((("projects"."id" = "project_materials"."project_id") OR ("projects"."id" = ( SELECT "subprojects"."project_id"
           FROM "public"."subprojects"
          WHERE ("subprojects"."id" = "project_materials"."subproject_id")))) AND (("projects"."user_id" = "auth"."uid"()) OR ("projects"."is_public" = true))))));



CREATE POLICY "Users can view their project's subprojects" ON "public"."subprojects" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."projects"
  WHERE (("projects"."id" = "subprojects"."project_id") AND (("projects"."user_id" = "auth"."uid"()) OR ("projects"."is_public" = true))))));



ALTER TABLE "public"."inventory_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."project_files" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."project_materials" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."projects" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."subprojects" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;
























































































































SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;



SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;



SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;



SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;

































SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;















GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "anon";
GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."save_new_project_with_materials_and_subprojects"("p_user_id" "uuid", "p_payload" "jsonb") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."save_new_project_with_materials_and_subprojects"("p_user_id" "uuid", "p_payload" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."save_new_project_with_materials_and_subprojects"("p_user_id" "uuid", "p_payload" "jsonb") TO "service_role";



REVOKE ALL ON FUNCTION "public"."update_project_with_materials_and_subprojects"("p_project_id" "uuid", "p_user_id" "uuid", "p_payload" "jsonb") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."update_project_with_materials_and_subprojects"("p_project_id" "uuid", "p_user_id" "uuid", "p_payload" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_project_with_materials_and_subprojects"("p_project_id" "uuid", "p_user_id" "uuid", "p_payload" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";



SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;



SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;



SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;


















GRANT ALL ON TABLE "public"."inventory_items" TO "anon";
GRANT ALL ON TABLE "public"."inventory_items" TO "authenticated";
GRANT ALL ON TABLE "public"."inventory_items" TO "service_role";



GRANT ALL ON TABLE "public"."project_files" TO "anon";
GRANT ALL ON TABLE "public"."project_files" TO "authenticated";
GRANT ALL ON TABLE "public"."project_files" TO "service_role";



GRANT ALL ON TABLE "public"."project_materials" TO "anon";
GRANT ALL ON TABLE "public"."project_materials" TO "authenticated";
GRANT ALL ON TABLE "public"."project_materials" TO "service_role";



GRANT ALL ON TABLE "public"."projects" TO "anon";
GRANT ALL ON TABLE "public"."projects" TO "authenticated";
GRANT ALL ON TABLE "public"."projects" TO "service_role";



GRANT ALL ON TABLE "public"."subprojects" TO "anon";
GRANT ALL ON TABLE "public"."subprojects" TO "authenticated";
GRANT ALL ON TABLE "public"."subprojects" TO "service_role";



SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;



SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";



































drop extension if exists "pg_net";


