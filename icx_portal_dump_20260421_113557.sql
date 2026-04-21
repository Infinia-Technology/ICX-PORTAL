--
-- PostgreSQL database dump
--

\restrict TXxkd0zfH6LEcQwX2wUfZ2c8taN8Jsw7WHS97fgeFYI936Fdb26s9hj5fEwk8UA

-- Dumped from database version 15.17 (Debian 15.17-1.pgdg13+1)
-- Dumped by pg_dump version 15.17 (Debian 15.17-1.pgdg13+1)

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

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: admin
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO admin;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: admin
--

COMMENT ON SCHEMA public IS '';


--
-- Name: KycStatus; Type: TYPE; Schema: public; Owner: admin
--

CREATE TYPE public."KycStatus" AS ENUM (
    'submitted',
    'approved'
);


ALTER TYPE public."KycStatus" OWNER TO admin;

--
-- Name: ListingStatus; Type: TYPE; Schema: public; Owner: admin
--

CREATE TYPE public."ListingStatus" AS ENUM (
    'DRAFT',
    'SUBMITTED',
    'IN_REVIEW',
    'REVISION_REQUESTED',
    'RESUBMITTED',
    'APPROVED',
    'REJECTED',
    'MATCHED',
    'CLOSED',
    'AVAILABLE',
    'RESERVED',
    'SOLD',
    'ARCHIVED'
);


ALTER TYPE public."ListingStatus" OWNER TO admin;

--
-- Name: ListingType; Type: TYPE; Schema: public; Owner: admin
--

CREATE TYPE public."ListingType" AS ENUM (
    'DC_SITE',
    'GPU_CLUSTER'
);


ALTER TYPE public."ListingType" OWNER TO admin;

--
-- Name: OrgStatus; Type: TYPE; Schema: public; Owner: admin
--

CREATE TYPE public."OrgStatus" AS ENUM (
    'PENDING',
    'SUBMITTED',
    'APPROVED',
    'REJECTED',
    'REVISION_REQUESTED'
);


ALTER TYPE public."OrgStatus" OWNER TO admin;

--
-- Name: OrgType; Type: TYPE; Schema: public; Owner: admin
--

CREATE TYPE public."OrgType" AS ENUM (
    'SUPPLIER',
    'BROKER',
    'CUSTOMER'
);


ALTER TYPE public."OrgType" OWNER TO admin;

--
-- Name: Role; Type: TYPE; Schema: public; Owner: admin
--

CREATE TYPE public."Role" AS ENUM (
    'superadmin',
    'admin',
    'supplier',
    'broker',
    'customer',
    'reader',
    'viewer',
    'subordinate'
);


ALTER TYPE public."Role" OWNER TO admin;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: Archive; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public."Archive" (
    id uuid NOT NULL,
    target_model text NOT NULL,
    target_id uuid NOT NULL,
    organization_id uuid,
    reason text,
    reason_text text,
    archived_by uuid,
    archived_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    restored_at timestamp(3) without time zone,
    restored_by uuid,
    "isActive" boolean DEFAULT true NOT NULL
);


ALTER TABLE public."Archive" OWNER TO admin;

--
-- Name: AuditLog; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public."AuditLog" (
    id uuid NOT NULL,
    user_id uuid,
    action text NOT NULL,
    target_model text,
    target_id text,
    changes jsonb,
    ip_address text,
    "timestamp" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."AuditLog" OWNER TO admin;

--
-- Name: BrokerDcCompany; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public."BrokerDcCompany" (
    id uuid NOT NULL,
    legal_entity text NOT NULL,
    office_address text NOT NULL,
    country_of_incorp text NOT NULL,
    contact_name text,
    contact_email text,
    contact_mobile text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    organization_id uuid NOT NULL
);


ALTER TABLE public."BrokerDcCompany" OWNER TO admin;

--
-- Name: DcDocument; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public."DcDocument" (
    id uuid NOT NULL,
    site_id uuid NOT NULL,
    document_type text NOT NULL,
    file_name text NOT NULL,
    file_url text NOT NULL,
    file_size integer NOT NULL,
    mime_type text NOT NULL,
    uploaded_by uuid NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."DcDocument" OWNER TO admin;

--
-- Name: DcPhasingSchedule; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public."DcPhasingSchedule" (
    id uuid NOT NULL,
    site_id uuid NOT NULL,
    month timestamp(3) without time zone NOT NULL,
    it_load_mw double precision,
    cumulative_it_load_mw double precision,
    scope_of_works text,
    estimated_capex_musd double precision,
    phase text,
    min_lease_duration_yrs integer,
    nrc_request_musd double precision,
    initial_deposit_musd double precision,
    mrc_request_per_kw double precision,
    mrc_inclusions text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."DcPhasingSchedule" OWNER TO admin;

--
-- Name: DcSite; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public."DcSite" (
    id uuid NOT NULL,
    listing_id uuid NOT NULL,
    site_name text NOT NULL,
    specifications jsonb DEFAULT '{}'::jsonb,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."DcSite" OWNER TO admin;

--
-- Name: Inquiry; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public."Inquiry" (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    type text NOT NULL,
    status text DEFAULT 'NEW'::text NOT NULL,
    specifications jsonb DEFAULT '{}'::jsonb,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    organization_id uuid
);


ALTER TABLE public."Inquiry" OWNER TO admin;

--
-- Name: Listing; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public."Listing" (
    id uuid NOT NULL,
    supplier_id uuid NOT NULL,
    type public."ListingType" DEFAULT 'GPU_CLUSTER'::public."ListingType" NOT NULL,
    data_center_name text,
    country text,
    state text,
    city text,
    total_units integer DEFAULT 0 NOT NULL,
    booked_units integer DEFAULT 0 NOT NULL,
    available_units integer DEFAULT 0 NOT NULL,
    total_mw double precision,
    available_mw double precision,
    price double precision,
    currency text DEFAULT 'USD'::text,
    status public."ListingStatus" DEFAULT 'DRAFT'::public."ListingStatus" NOT NULL,
    specifications jsonb DEFAULT '{}'::jsonb,
    metadata jsonb DEFAULT '{}'::jsonb,
    contract_duration text,
    archived_at timestamp(3) without time zone,
    archive_reason text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    organization_id uuid
);


ALTER TABLE public."Listing" OWNER TO admin;

--
-- Name: ListingDocument; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public."ListingDocument" (
    id uuid NOT NULL,
    listing_id uuid NOT NULL,
    document_type text NOT NULL,
    file_name text NOT NULL,
    file_url text NOT NULL,
    file_size integer NOT NULL,
    mime_type text NOT NULL,
    uploaded_by uuid NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."ListingDocument" OWNER TO admin;

--
-- Name: ListingMember; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public."ListingMember" (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    listing_id uuid NOT NULL,
    user_id uuid NOT NULL,
    role text DEFAULT 'viewer'::text NOT NULL,
    added_by uuid,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."ListingMember" OWNER TO admin;

--
-- Name: Notification; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public."Notification" (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    type text NOT NULL,
    title text NOT NULL,
    message text,
    link text,
    metadata jsonb,
    is_read boolean DEFAULT false NOT NULL,
    sent_via text[] DEFAULT ARRAY['in-app'::text],
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Notification" OWNER TO admin;

--
-- Name: Organization; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public."Organization" (
    id uuid NOT NULL,
    type public."OrgType" NOT NULL,
    status public."OrgStatus" DEFAULT 'PENDING'::public."OrgStatus" NOT NULL,
    vendor_type text,
    mandate_status text,
    nda_required boolean DEFAULT false NOT NULL,
    nda_signed boolean DEFAULT false NOT NULL,
    contact_email text NOT NULL,
    contact_number text,
    company_name text,
    company_type text,
    jurisdiction text,
    industry_sector text,
    tax_vat_number text,
    company_address text,
    website text,
    auth_signatory_name text,
    auth_signatory_title text,
    billing_contact_name text,
    billing_contact_email text,
    primary_use_cases text[],
    location_preferences text[],
    sovereignty_reqs text[],
    compliance_reqs text[],
    budget_range text,
    urgency text,
    flagged_fields text[],
    field_comments jsonb DEFAULT '{}'::jsonb,
    reviewed_by uuid,
    approved_at timestamp(3) without time zone,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Organization" OWNER TO admin;

--
-- Name: Otp; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public."Otp" (
    id uuid NOT NULL,
    email text NOT NULL,
    code text NOT NULL,
    purpose text DEFAULT 'login'::text NOT NULL,
    attempts integer DEFAULT 0 NOT NULL,
    verified boolean DEFAULT false NOT NULL,
    expires_at timestamp(3) without time zone NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Otp" OWNER TO admin;

--
-- Name: QueueItem; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public."QueueItem" (
    id uuid NOT NULL,
    type text NOT NULL,
    reference_id uuid NOT NULL,
    reference_model text NOT NULL,
    status text DEFAULT 'NEW'::text NOT NULL,
    priority integer DEFAULT 0 NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."QueueItem" OWNER TO admin;

--
-- Name: ReportTemplate; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public."ReportTemplate" (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    name text NOT NULL,
    selected_fields jsonb NOT NULL,
    filters jsonb NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    description text,
    export_format text,
    group_by text,
    is_favorite boolean DEFAULT false NOT NULL,
    report_type text DEFAULT 'DC_LISTINGS'::text NOT NULL,
    sort_by text,
    sort_direction text,
    usage_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public."ReportTemplate" OWNER TO admin;

--
-- Name: Reservation; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public."Reservation" (
    id uuid NOT NULL,
    listing_id uuid NOT NULL,
    customer_id uuid NOT NULL,
    reserved_units integer NOT NULL,
    start_date timestamp(3) without time zone NOT NULL,
    end_date timestamp(3) without time zone NOT NULL,
    status text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Reservation" OWNER TO admin;

--
-- Name: TeamInvite; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public."TeamInvite" (
    id uuid NOT NULL,
    organization_id uuid NOT NULL,
    inviter_id uuid NOT NULL,
    email text NOT NULL,
    role text DEFAULT 'subordinate'::text NOT NULL,
    status text DEFAULT 'PENDING'::text NOT NULL,
    accepted_at timestamp(3) without time zone,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    token text,
    expires_at timestamp(3) without time zone
);


ALTER TABLE public."TeamInvite" OWNER TO admin;

--
-- Name: User; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public."User" (
    id uuid NOT NULL,
    name text,
    email text NOT NULL,
    role public."Role" NOT NULL,
    kyc_status public."KycStatus",
    "isActive" boolean DEFAULT true NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    organization_id uuid,
    last_login_at timestamp(3) without time zone
);


ALTER TABLE public."User" OWNER TO admin;

--
-- Name: _AssignedAdmins; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public."_AssignedAdmins" (
    "A" uuid NOT NULL,
    "B" uuid NOT NULL
);


ALTER TABLE public."_AssignedAdmins" OWNER TO admin;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO admin;

--
-- Data for Name: Archive; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public."Archive" (id, target_model, target_id, organization_id, reason, reason_text, archived_by, archived_at, restored_at, restored_by, "isActive") FROM stdin;
\.


--
-- Data for Name: AuditLog; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public."AuditLog" (id, user_id, action, target_model, target_id, changes, ip_address, "timestamp") FROM stdin;
418ea537-5e4a-401a-8780-f308e59d6468	\N	OTP_REQUESTED	\N	\N	{"email": "aastharani07@gmail.com"}	172.21.0.1	2026-04-14 11:47:51.223
4db15a16-f2a0-4256-8b51-9e3309339bbb	\N	OTP_VERIFIED	\N	\N	{"email": "aastharani07@gmail.com"}	172.21.0.1	2026-04-14 11:48:10.704
564dbeb4-cc8d-4b28-8925-1a770a38493d	ac8f3716-a370-43e0-9ab0-096dc36a0b55	LOGIN	\N	\N	null	172.21.0.1	2026-04-14 11:48:10.744
b92d5965-0aa5-49a5-8e2c-f603b3d4af7e	ac8f3716-a370-43e0-9ab0-096dc36a0b55	CREATE_DC_APPLICATION	Listing	04885157-9e47-4748-856a-74d9bcf656bc	null	172.21.0.1	2026-04-14 11:48:29.457
77c3fa30-80d2-4af4-b598-eded1ca7ddd7	ac8f3716-a370-43e0-9ab0-096dc36a0b55	ADD_DC_SITE	DcSite	22333979-4e67-4697-86a3-0aef70f9dfc9	null	172.21.0.1	2026-04-14 11:48:33.733
a0a976be-77e6-4e8f-b822-44a5791eb07d	ac8f3716-a370-43e0-9ab0-096dc36a0b55	UPDATE_DC_APPLICATION	Listing	04885157-9e47-4748-856a-74d9bcf656bc	null	172.21.0.1	2026-04-14 11:48:44.67
6b9132e3-b5c2-487d-8fd5-e8d1980d2378	ac8f3716-a370-43e0-9ab0-096dc36a0b55	UPDATE_DC_APPLICATION	Listing	04885157-9e47-4748-856a-74d9bcf656bc	null	172.21.0.1	2026-04-14 11:48:52.978
8dc626ab-2f5b-48b5-b5e0-cf9c4607da16	ac8f3716-a370-43e0-9ab0-096dc36a0b55	UPDATE_DC_APPLICATION	Listing	04885157-9e47-4748-856a-74d9bcf656bc	null	172.21.0.1	2026-04-14 11:49:08.617
338a9f7e-2122-4726-b742-cb7ce5cf8f70	ac8f3716-a370-43e0-9ab0-096dc36a0b55	UPDATE_DC_APPLICATION	Listing	04885157-9e47-4748-856a-74d9bcf656bc	null	172.21.0.1	2026-04-14 12:01:47.271
44019a99-2e19-4256-9108-167c87798cdf	ac8f3716-a370-43e0-9ab0-096dc36a0b55	UPDATE_DC_APPLICATION	Listing	04885157-9e47-4748-856a-74d9bcf656bc	null	172.21.0.1	2026-04-14 12:06:18.707
36937286-f908-4865-b940-910225f52c5c	ac8f3716-a370-43e0-9ab0-096dc36a0b55	UPDATE_DC_APPLICATION	Listing	04885157-9e47-4748-856a-74d9bcf656bc	null	172.21.0.1	2026-04-14 12:06:28.511
911ed609-8c4b-4475-8034-38b2180af1d9	ac8f3716-a370-43e0-9ab0-096dc36a0b55	UPDATE_DC_APPLICATION	Listing	04885157-9e47-4748-856a-74d9bcf656bc	null	172.21.0.1	2026-04-14 12:07:05.137
3bda3349-528b-4f60-990d-3b505b816bdb	ac8f3716-a370-43e0-9ab0-096dc36a0b55	UPDATE_DC_APPLICATION	Listing	04885157-9e47-4748-856a-74d9bcf656bc	null	172.21.0.1	2026-04-14 12:07:10.198
d5acd119-6190-4943-bca6-01baf0e4fb20	ac8f3716-a370-43e0-9ab0-096dc36a0b55	UPDATE_DC_APPLICATION	Listing	04885157-9e47-4748-856a-74d9bcf656bc	null	172.21.0.1	2026-04-14 12:09:49.029
9406ffc8-70d0-459c-b92d-10b97bae762e	ac8f3716-a370-43e0-9ab0-096dc36a0b55	UPDATE_DC_APPLICATION	Listing	04885157-9e47-4748-856a-74d9bcf656bc	null	172.21.0.1	2026-04-14 12:11:12.372
25c59e02-260f-43ef-b00a-67476b9ec019	ac8f3716-a370-43e0-9ab0-096dc36a0b55	UPDATE_DC_APPLICATION	Listing	04885157-9e47-4748-856a-74d9bcf656bc	null	172.21.0.1	2026-04-14 12:11:54.606
36df0474-c4ca-41d8-ae5c-16e61ffbbe01	ac8f3716-a370-43e0-9ab0-096dc36a0b55	UPDATE_DC_APPLICATION	Listing	04885157-9e47-4748-856a-74d9bcf656bc	null	172.21.0.1	2026-04-14 12:32:21.726
f2d1a837-2edd-48b1-b758-435d20476060	ac8f3716-a370-43e0-9ab0-096dc36a0b55	UPDATE_DC_APPLICATION	Listing	04885157-9e47-4748-856a-74d9bcf656bc	null	172.21.0.1	2026-04-14 12:32:36.193
63858fa9-c7d4-4d8c-931b-1b025b96f643	ac8f3716-a370-43e0-9ab0-096dc36a0b55	UPDATE_DC_APPLICATION	Listing	04885157-9e47-4748-856a-74d9bcf656bc	null	172.21.0.1	2026-04-14 12:32:41.648
6d745e86-3b74-4d8b-9c1d-88bcd2fa5062	ac8f3716-a370-43e0-9ab0-096dc36a0b55	UPDATE_DC_APPLICATION	Listing	04885157-9e47-4748-856a-74d9bcf656bc	null	172.21.0.1	2026-04-14 12:32:49.086
693a3c6c-bbf1-4638-8b47-af13eee508b0	ac8f3716-a370-43e0-9ab0-096dc36a0b55	UPDATE_DC_APPLICATION	Listing	04885157-9e47-4748-856a-74d9bcf656bc	null	172.21.0.1	2026-04-14 12:33:07.56
bcd4e174-62c4-4806-865b-3dfef3b7e354	ac8f3716-a370-43e0-9ab0-096dc36a0b55	UPDATE_DC_APPLICATION	Listing	04885157-9e47-4748-856a-74d9bcf656bc	null	172.21.0.1	2026-04-14 12:33:13.863
ea67e082-d6a6-4f28-afd3-022f054f51e4	ac8f3716-a370-43e0-9ab0-096dc36a0b55	UPDATE_DC_APPLICATION	Listing	04885157-9e47-4748-856a-74d9bcf656bc	null	172.21.0.1	2026-04-14 12:33:32.536
4c0f2fd8-a308-4eca-8ece-f3a04cb6570c	ac8f3716-a370-43e0-9ab0-096dc36a0b55	UPDATE_DC_APPLICATION	Listing	04885157-9e47-4748-856a-74d9bcf656bc	null	172.21.0.1	2026-04-14 12:48:29.871
f143e52f-d99b-42f8-9555-caf30a62c7b4	ac8f3716-a370-43e0-9ab0-096dc36a0b55	UPDATE_DC_APPLICATION	Listing	04885157-9e47-4748-856a-74d9bcf656bc	null	172.21.0.1	2026-04-14 12:48:47.268
377eec5c-86b4-4adb-8e37-ced00c616a1a	ac8f3716-a370-43e0-9ab0-096dc36a0b55	UPDATE_DC_APPLICATION	Listing	04885157-9e47-4748-856a-74d9bcf656bc	null	172.21.0.1	2026-04-14 12:49:14.501
d0e10248-1f74-4248-99aa-d6cfabf01f38	ac8f3716-a370-43e0-9ab0-096dc36a0b55	UPDATE_DC_APPLICATION	Listing	04885157-9e47-4748-856a-74d9bcf656bc	null	172.21.0.1	2026-04-14 12:54:50.768
9eb74b78-d079-4088-86bf-084425e79d8f	ac8f3716-a370-43e0-9ab0-096dc36a0b55	SUBMIT_DC_APPLICATION	Listing	04885157-9e47-4748-856a-74d9bcf656bc	null	172.21.0.1	2026-04-14 12:54:50.887
352d5f73-eeb3-40e7-9170-874928b2bab3	\N	OTP_REQUESTED	\N	\N	{"email": "pradhanaastha24@gmail.com"}	172.21.0.1	2026-04-15 05:33:58.998
40640e9f-6818-436c-8e1c-2cbed4fe14b4	\N	OTP_VERIFIED	\N	\N	{"email": "pradhanaastha24@gmail.com"}	172.21.0.1	2026-04-15 05:34:35.554
491627cd-1658-4d71-8ca3-854b67780d0e	\N	OTP_REQUESTED	\N	\N	{"email": "aastharani07@gmail.com"}	172.21.0.1	2026-04-15 05:35:12.115
f72f5d78-08ba-48af-824b-7f34bb92bf5a	\N	OTP_VERIFIED	\N	\N	{"email": "aastharani07@gmail.com"}	172.21.0.1	2026-04-15 05:35:27.134
82c1dd39-977e-4c6e-89b6-24e4be69261c	ac8f3716-a370-43e0-9ab0-096dc36a0b55	LOGIN	\N	\N	null	172.21.0.1	2026-04-15 05:35:27.168
5e62bea5-0d75-46aa-b95c-989563cdc05f	ac8f3716-a370-43e0-9ab0-096dc36a0b55	CREATE_GPU_CLUSTER	Listing	86e51827-c7c4-4487-9d8c-e0abe65db7dc	null	172.21.0.1	2026-04-15 05:37:00.199
436a8094-f456-4188-a471-256274e83677	ac8f3716-a370-43e0-9ab0-096dc36a0b55	CREATE_GPU_CLUSTER	Listing	a9ef879a-1246-4739-9887-296f939a2e1b	null	172.21.0.1	2026-04-15 05:37:05.12
90e1490f-6e23-490c-8405-0253a14b5645	ac8f3716-a370-43e0-9ab0-096dc36a0b55	CREATE_GPU_CLUSTER	Listing	8a2a2572-3a0d-4b13-9152-f0002df8178d	null	172.21.0.1	2026-04-15 05:37:11.113
0979299f-2d5a-4599-8f50-a44ab4c85e02	ac8f3716-a370-43e0-9ab0-096dc36a0b55	CREATE_DC_APPLICATION	Listing	8f6b85f5-133a-4974-8215-1ff53bd670db	null	172.21.0.1	2026-04-15 05:37:22.151
320a66e0-8ee7-4140-b86a-88cbf0fd68f6	ac8f3716-a370-43e0-9ab0-096dc36a0b55	CREATE_GPU_CLUSTER	Listing	1cdc3eba-ca59-4f76-ae23-ab9250fa8051	null	172.21.0.1	2026-04-15 05:37:39.051
e12ad45a-a457-4c1d-94db-47c8857d4e42	ac8f3716-a370-43e0-9ab0-096dc36a0b55	CREATE_GPU_CLUSTER	Listing	206824e2-5c56-4cd9-a85d-abbd2524fc1c	null	172.21.0.1	2026-04-15 05:37:40.388
37e29ded-38e5-492d-a54d-0ee756b7f632	ac8f3716-a370-43e0-9ab0-096dc36a0b55	CREATE_GPU_CLUSTER	Listing	3eefc27f-e1c1-43e4-a874-23aa5996aacc	null	172.21.0.1	2026-04-15 05:37:41.534
62162fad-7d5e-49f8-99bf-91398880337a	ac8f3716-a370-43e0-9ab0-096dc36a0b55	CREATE_GPU_CLUSTER	Listing	f52b1b52-fd22-4ff1-a15b-904acb7adee4	null	172.21.0.1	2026-04-15 05:37:42.735
6993dea1-fa83-46a1-aab3-689cf36b24d4	ac8f3716-a370-43e0-9ab0-096dc36a0b55	CREATE_GPU_CLUSTER	Listing	a72408ab-ccc6-4064-b57f-c3fbf7c17489	null	172.21.0.1	2026-04-15 05:37:44.043
ecb312cb-861f-42aa-9ba0-c4f23174c199	ac8f3716-a370-43e0-9ab0-096dc36a0b55	CREATE_GPU_CLUSTER	Listing	08bb67f7-12a3-4d44-873e-f259e006441c	null	172.21.0.1	2026-04-15 05:37:45.345
3b1cdbf9-29bd-49ac-8e2a-de8e59f9c237	ac8f3716-a370-43e0-9ab0-096dc36a0b55	CREATE_GPU_CLUSTER	Listing	0fdd7dcb-d39a-4fe4-98f7-816f8763e7ce	null	172.21.0.1	2026-04-15 05:37:46.679
3976b804-1df6-47b3-8d03-f3a8583dc53f	ac8f3716-a370-43e0-9ab0-096dc36a0b55	CREATE_GPU_CLUSTER	Listing	a40f7efc-35a8-4a26-883c-1bbe6f75c24c	null	172.21.0.1	2026-04-15 05:37:48.101
b33e4194-0305-49d5-a32e-3ce27e1a9158	ac8f3716-a370-43e0-9ab0-096dc36a0b55	CREATE_GPU_CLUSTER	Listing	2e976a97-be76-481d-b901-b862775b48a0	null	172.21.0.1	2026-04-15 05:40:00.201
821ddfd1-db11-427f-a117-587246cf64e3	ac8f3716-a370-43e0-9ab0-096dc36a0b55	CREATE_GPU_CLUSTER	Listing	b032349f-42e3-4d7c-a2b2-0d6c6f0a41c4	null	172.21.0.1	2026-04-15 05:40:13.433
4f312865-92ae-4e75-99da-b4a7d8c8d5a8	ac8f3716-a370-43e0-9ab0-096dc36a0b55	CREATE_GPU_CLUSTER	Listing	d6918f10-5538-404a-a472-62cb1881b998	null	172.21.0.1	2026-04-15 05:40:30.699
dc3a5cb8-66b8-429f-b53f-53a0b785da03	ac8f3716-a370-43e0-9ab0-096dc36a0b55	CREATE_GPU_CLUSTER	Listing	09f4b5cf-7b11-4bea-85ce-99faf7027440	null	172.21.0.1	2026-04-15 05:40:38.869
e95c1108-b5a8-4703-9e5c-8206250a03e7	ac8f3716-a370-43e0-9ab0-096dc36a0b55	CREATE_GPU_CLUSTER	Listing	458d2493-8e42-4bec-b76a-549ddde5bac1	null	172.21.0.1	2026-04-15 05:40:46.24
25501a6e-11f5-438c-a885-8e8e2fe2502c	ac8f3716-a370-43e0-9ab0-096dc36a0b55	CREATE_GPU_CLUSTER	Listing	95988d46-d173-4168-bfcd-79df4722f544	null	172.21.0.1	2026-04-15 05:40:50.974
8279efc2-8d90-466e-9f55-a8c78a0bd441	ac8f3716-a370-43e0-9ab0-096dc36a0b55	CREATE_GPU_CLUSTER	Listing	309388b8-cba2-4d0d-944a-e5ab50312a3f	null	172.21.0.1	2026-04-15 05:41:02.654
6c573699-9890-4eab-b905-d7f956712188	ac8f3716-a370-43e0-9ab0-096dc36a0b55	CREATE_GPU_CLUSTER	Listing	478af847-b735-4a9e-919c-8f009845fca4	null	172.21.0.1	2026-04-15 05:41:11.691
ba10fbfd-e756-4201-8fea-9e0cc9acfb56	ac8f3716-a370-43e0-9ab0-096dc36a0b55	CREATE_GPU_CLUSTER	Listing	4d70e635-685d-4555-ba04-e9c56c918b06	null	172.21.0.1	2026-04-15 05:48:15.523
6240fee4-8867-4fac-919e-41ac6cc2a844	ac8f3716-a370-43e0-9ab0-096dc36a0b55	UPDATE_GPU_CLUSTER	Listing	4d70e635-685d-4555-ba04-e9c56c918b06	null	172.21.0.1	2026-04-15 05:48:18.075
935b3059-9ffe-40e2-93dc-35e2bb171e68	ac8f3716-a370-43e0-9ab0-096dc36a0b55	UPDATE_GPU_CLUSTER	Listing	4d70e635-685d-4555-ba04-e9c56c918b06	null	172.21.0.1	2026-04-15 05:48:26.644
22504b2b-eb78-45d9-9452-977a7c02d8d0	ac8f3716-a370-43e0-9ab0-096dc36a0b55	UPDATE_GPU_CLUSTER	Listing	4d70e635-685d-4555-ba04-e9c56c918b06	null	172.21.0.1	2026-04-15 05:48:33.362
68d74d6a-146a-4773-81d0-03cbf67effc1	ac8f3716-a370-43e0-9ab0-096dc36a0b55	UPDATE_GPU_CLUSTER	Listing	4d70e635-685d-4555-ba04-e9c56c918b06	null	172.21.0.1	2026-04-15 05:48:35.921
ad944817-5b96-4b3a-8f5b-f4bbd29b97e0	ac8f3716-a370-43e0-9ab0-096dc36a0b55	UPDATE_GPU_CLUSTER	Listing	4d70e635-685d-4555-ba04-e9c56c918b06	null	172.21.0.1	2026-04-15 05:48:39.657
e905a366-3b7e-4e98-b8cd-d0cfd0f68ef4	ac8f3716-a370-43e0-9ab0-096dc36a0b55	UPDATE_GPU_CLUSTER	Listing	4d70e635-685d-4555-ba04-e9c56c918b06	null	172.21.0.1	2026-04-15 05:48:45.619
95618d24-ac21-4da1-86b6-92f402dca6c5	ac8f3716-a370-43e0-9ab0-096dc36a0b55	UPDATE_GPU_CLUSTER	Listing	4d70e635-685d-4555-ba04-e9c56c918b06	null	172.21.0.1	2026-04-15 05:48:47.429
b019e84e-a803-4aa0-9473-00715c24e920	ac8f3716-a370-43e0-9ab0-096dc36a0b55	UPDATE_GPU_CLUSTER	Listing	4d70e635-685d-4555-ba04-e9c56c918b06	null	172.21.0.1	2026-04-15 05:48:49.994
287ce4ec-7a87-4dbc-b9bc-3db3151e78b1	ac8f3716-a370-43e0-9ab0-096dc36a0b55	UPDATE_GPU_CLUSTER	Listing	4d70e635-685d-4555-ba04-e9c56c918b06	null	172.21.0.1	2026-04-15 05:48:55.975
b6e71fd9-3784-44b0-bfad-b8d459e70ae4	ac8f3716-a370-43e0-9ab0-096dc36a0b55	UPDATE_GPU_CLUSTER	Listing	4d70e635-685d-4555-ba04-e9c56c918b06	null	172.21.0.1	2026-04-15 05:48:58.524
72e04b24-9537-4cb6-937e-1ab92500450c	ac8f3716-a370-43e0-9ab0-096dc36a0b55	UPDATE_GPU_CLUSTER	Listing	4d70e635-685d-4555-ba04-e9c56c918b06	null	172.21.0.1	2026-04-15 05:49:04.921
0bc341c1-0ef2-45fc-a09f-a0b41b99867f	ac8f3716-a370-43e0-9ab0-096dc36a0b55	UPDATE_GPU_CLUSTER	Listing	4d70e635-685d-4555-ba04-e9c56c918b06	null	172.21.0.1	2026-04-15 05:49:07.818
391fdef8-8135-40a7-8f0c-7c3397a2b907	ac8f3716-a370-43e0-9ab0-096dc36a0b55	UPDATE_GPU_CLUSTER	Listing	4d70e635-685d-4555-ba04-e9c56c918b06	null	172.21.0.1	2026-04-15 05:49:10.93
575d762f-13b6-4a38-ac96-0e1d4dba2945	ac8f3716-a370-43e0-9ab0-096dc36a0b55	UPDATE_GPU_CLUSTER	Listing	4d70e635-685d-4555-ba04-e9c56c918b06	null	172.21.0.1	2026-04-15 05:49:13.483
ecb23453-4916-4802-b26f-f1c7146b2b66	ac8f3716-a370-43e0-9ab0-096dc36a0b55	UPDATE_GPU_CLUSTER	Listing	4d70e635-685d-4555-ba04-e9c56c918b06	null	172.21.0.1	2026-04-15 05:49:16.888
2298118b-7353-4e14-82b5-6b7c628d8463	ac8f3716-a370-43e0-9ab0-096dc36a0b55	UPDATE_GPU_CLUSTER	Listing	4d70e635-685d-4555-ba04-e9c56c918b06	null	172.21.0.1	2026-04-15 05:49:19.438
71b2a193-9c56-45a8-8d9e-fff3021dc916	ac8f3716-a370-43e0-9ab0-096dc36a0b55	UPDATE_GPU_CLUSTER	Listing	4d70e635-685d-4555-ba04-e9c56c918b06	null	172.21.0.1	2026-04-15 05:49:28.563
49b21e14-8c53-42b7-a351-9f767e89285c	ac8f3716-a370-43e0-9ab0-096dc36a0b55	SUBMIT_GPU_CLUSTER	Listing	4d70e635-685d-4555-ba04-e9c56c918b06	null	172.21.0.1	2026-04-15 05:49:29.889
9132e23b-3aeb-440c-8714-9c0b9921efe8	\N	OTP_REQUESTED	\N	\N	{"email": "aastha.pradhan@apeiro.digitl"}	172.21.0.1	2026-04-15 06:11:33.857
8e51ab16-a22a-4f4d-97f8-da9e8996f244	\N	OTP_REQUESTED	\N	\N	{"email": "aastha.pradhan@apeiro.digital"}	172.21.0.1	2026-04-15 06:12:30.982
26f71c5d-b76c-46f0-b2bc-2f12c21f89d3	\N	OTP_VERIFIED	\N	\N	{"email": "aastha.pradhan@apeiro.digital"}	172.21.0.1	2026-04-15 06:12:46.65
4c55ddfb-f1da-4179-80a2-8d799ad98456	\N	OTP_REQUESTED	\N	\N	{"email": "aastha.pradhan@apeiro.digital"}	172.21.0.1	2026-04-15 06:13:48.156
b1d85d17-9f49-4967-b1cf-05de8a2791aa	\N	OTP_VERIFIED	\N	\N	{"email": "aastha.pradhan@apeiro.digital"}	172.21.0.1	2026-04-15 06:14:02.279
b826e374-0a7f-427b-9659-84aa838324eb	\N	OTP_REQUESTED	\N	\N	{"email": "aastha.pradhan@apeiro.digital"}	172.21.0.1	2026-04-15 06:14:23.585
9059525f-688b-47f5-bc34-76778d31e7b6	\N	OTP_VERIFIED	\N	\N	{"email": "aastha.pradhan@apeiro.digital"}	172.21.0.1	2026-04-15 06:14:37.7
c5fe4700-9d08-47ad-be3e-0f04000257ad	\N	OTP_REQUESTED	\N	\N	{"email": "aastha.pradhan@apeiro.digital"}	172.21.0.1	2026-04-15 06:24:15.934
673672ed-1a5c-4f7f-a84b-4adb48e98dbf	\N	OTP_VERIFY_FAILED	\N	\N	{"email": "aastha.pradhan@apeiro.digital", "reason": "Invalid OTP. 2 attempt(s) remaining."}	172.21.0.1	2026-04-15 06:24:23.319
1d63ff61-603a-4043-85be-0d688ea05fb0	\N	OTP_VERIFIED	\N	\N	{"email": "aastha.pradhan@apeiro.digital"}	172.21.0.1	2026-04-15 06:24:31.338
d86ab3b8-60bc-4b0c-9d97-23b2275f7884	\N	OTP_REQUESTED	\N	\N	{"email": "aastha.pradhan@apeiro.digital"}	172.21.0.1	2026-04-15 06:26:01.356
7e735089-e714-4830-9b8c-6cd6fc61563b	\N	OTP_VERIFIED	\N	\N	{"email": "aastha.pradhan@apeiro.digital"}	172.21.0.1	2026-04-15 06:26:06.423
9b46e742-d9a8-4555-bc74-714636ee0ac6	\N	OTP_REQUESTED	\N	\N	{"email": "deepanshu.gupta@netgroup.ai"}	172.21.0.1	2026-04-15 06:26:20.5
748d6ef4-a7ea-4ef9-9a0a-a75774ad94fb	\N	OTP_VERIFIED	\N	\N	{"email": "deepanshu.gupta@netgroup.ai"}	172.21.0.1	2026-04-15 06:26:23.576
9855f826-374f-47b8-a491-f7411eed76cb	ec3a00a7-d47b-4b42-a8f2-94091069258f	LOGIN	\N	\N	null	172.21.0.1	2026-04-15 06:26:23.596
46a322c9-bba2-4f6c-8e7a-4b43133336bc	ec3a00a7-d47b-4b42-a8f2-94091069258f	CREATE_USER	User	ef1f3552-1d5a-4c67-9b2f-119462a19ec7	{"role": "reader", "email": "aastha.pradhan@apeiro.digital"}	172.21.0.1	2026-04-15 06:26:50.099
c32be285-22eb-43be-96ff-cdf6472d000d	ec3a00a7-d47b-4b42-a8f2-94091069258f	UPDATE_USER	User	ef1f3552-1d5a-4c67-9b2f-119462a19ec7	{"isActive": false}	172.21.0.1	2026-04-15 06:27:03.632
513b8aac-abad-4015-a709-dd7d7bffa05f	\N	OTP_REQUESTED	\N	\N	{"email": "aastha.pradhan@apeiro.digital"}	172.21.0.1	2026-04-15 06:28:09.073
93fc2dcc-428e-4b87-9148-2f6c4a142ad9	\N	OTP_VERIFIED	\N	\N	{"email": "aastha.pradhan@apeiro.digital"}	172.21.0.1	2026-04-15 06:28:13.063
471a20ec-1432-4b26-a48a-c38b685f3406	\N	OTP_VERIFY_FAILED	\N	\N	{"email": "aastha.pradhan@apeiro.digital", "reason": "OTP expired or not found. Please request a new one."}	172.21.0.1	2026-04-15 06:28:17.037
bf9a7f78-9e1f-45c6-8e26-e159d29b0c85	ec3a00a7-d47b-4b42-a8f2-94091069258f	UPDATE_USER	User	8ef33500-8b08-49ef-a029-5a8160f5c81c	{"isActive": false}	172.21.0.1	2026-04-15 06:28:22.609
e4ea83a8-b409-4d70-b047-9cf4e1220b97	ec3a00a7-d47b-4b42-a8f2-94091069258f	UPDATE_USER	User	8ef33500-8b08-49ef-a029-5a8160f5c81c	{"isActive": true}	172.21.0.1	2026-04-15 06:28:23.384
7e978e80-b57a-4183-944e-3a20e98c8e4c	\N	OTP_VERIFY_FAILED	\N	\N	{"email": "aastha.pradhan@apeiro.digital", "reason": "OTP expired or not found. Please request a new one."}	172.21.0.1	2026-04-15 06:28:26.649
5427ac0c-7fb4-4218-b166-7438d6813b91	\N	OTP_VERIFY_FAILED	\N	\N	{"email": "aastha.pradhan@apeiro.digital", "reason": "OTP expired or not found. Please request a new one."}	172.21.0.1	2026-04-15 06:28:35.68
7c4210ae-734f-4104-8aff-babb89898584	ec3a00a7-d47b-4b42-a8f2-94091069258f	DELETE_USER	\N	\N	{"userId": "8ef33500-8b08-49ef-a029-5a8160f5c81c"}	172.21.0.1	2026-04-15 06:32:48.922
43009f20-bb4a-4f05-a0a6-8b243ece2e54	ec3a00a7-d47b-4b42-a8f2-94091069258f	DELETE_USER	\N	\N	{"userId": "ef1f3552-1d5a-4c67-9b2f-119462a19ec7"}	172.21.0.1	2026-04-15 06:32:55.067
f7aa7dbf-0c96-4068-a59f-14e1c6484deb	ec3a00a7-d47b-4b42-a8f2-94091069258f	CREATE_USER	User	0bd1d22a-e4e3-4dcc-ad62-d49a7c51617e	{"role": "admin", "email": "aastha.pradhan@apeiro.digital"}	172.21.0.1	2026-04-15 06:33:30.981
711d981c-4adc-4e01-9daf-d818f04d887b	\N	OTP_REQUESTED	\N	\N	{"email": "aastha.pradhan@apeiro.digital"}	172.21.0.1	2026-04-15 06:33:54.803
4e86c8a3-b198-4998-b818-826f46e0b69f	\N	OTP_VERIFIED	\N	\N	{"email": "aastha.pradhan@apeiro.digital"}	172.21.0.1	2026-04-15 06:33:58.578
0ccf6c35-90e3-4afe-9c5f-a9d581a4aad8	\N	OTP_REQUESTED	\N	\N	{"email": "deepanshu.gupta@netgroup.ai"}	172.21.0.1	2026-04-15 07:18:54.391
ce058406-c039-4e03-b162-83cae9684861	\N	OTP_VERIFIED	\N	\N	{"email": "deepanshu.gupta@netgroup.ai"}	172.21.0.1	2026-04-15 07:18:58.744
de7349e6-78fc-445f-988c-301a063448f8	ec3a00a7-d47b-4b42-a8f2-94091069258f	LOGIN	\N	\N	null	172.21.0.1	2026-04-15 07:18:58.759
a46fc596-2b1f-4fe1-8bcb-be2eb41cdba9	ec3a00a7-d47b-4b42-a8f2-94091069258f	LOGIN	\N	\N	null	172.21.0.1	2026-04-15 10:55:13.707
627ff230-e7a2-432f-ae23-0ec8311de170	ec3a00a7-d47b-4b42-a8f2-94091069258f	DELETE_INVENTORY	Listing	4d70e635-685d-4555-ba04-e9c56c918b06	null	172.21.0.1	2026-04-15 07:28:58.041
aeece420-130d-4521-95a2-bbaac3f32f05	ec3a00a7-d47b-4b42-a8f2-94091069258f	DELETE_INVENTORY	Listing	309388b8-cba2-4d0d-944a-e5ab50312a3f	null	172.21.0.1	2026-04-15 07:29:01.034
eda44d8b-46f3-4c53-9af7-2e24850cd4c1	ec3a00a7-d47b-4b42-a8f2-94091069258f	DELETE_INVENTORY	Listing	478af847-b735-4a9e-919c-8f009845fca4	null	172.21.0.1	2026-04-15 07:29:03.942
01612638-1ee5-4c1d-9d43-41670c4a7b51	ec3a00a7-d47b-4b42-a8f2-94091069258f	DELETE_INVENTORY	Listing	95988d46-d173-4168-bfcd-79df4722f544	null	172.21.0.1	2026-04-15 07:29:06.87
94658bc8-6450-4a67-b017-997459092fa4	ec3a00a7-d47b-4b42-a8f2-94091069258f	DELETE_INVENTORY	Listing	458d2493-8e42-4bec-b76a-549ddde5bac1	null	172.21.0.1	2026-04-15 07:29:09.427
1bdad850-02ff-4ab6-9f9d-4164a758672d	ec3a00a7-d47b-4b42-a8f2-94091069258f	DELETE_INVENTORY	Listing	09f4b5cf-7b11-4bea-85ce-99faf7027440	null	172.21.0.1	2026-04-15 07:29:11.929
64e9e99c-ca14-4c60-92e7-3a765180a45f	ec3a00a7-d47b-4b42-a8f2-94091069258f	DELETE_INVENTORY	Listing	d6918f10-5538-404a-a472-62cb1881b998	null	172.21.0.1	2026-04-15 07:29:14.407
c4409057-a76a-4947-8b37-4b84f04c19fc	ec3a00a7-d47b-4b42-a8f2-94091069258f	DELETE_INVENTORY	Listing	b032349f-42e3-4d7c-a2b2-0d6c6f0a41c4	null	172.21.0.1	2026-04-15 07:29:17.198
3db98443-d973-4d85-a983-bde15184c846	ec3a00a7-d47b-4b42-a8f2-94091069258f	DELETE_INVENTORY	Listing	2e976a97-be76-481d-b901-b862775b48a0	null	172.21.0.1	2026-04-15 07:29:20.208
51d72320-59cd-41a2-ab6c-f387c7aeb5b0	ec3a00a7-d47b-4b42-a8f2-94091069258f	DELETE_INVENTORY	Listing	0fdd7dcb-d39a-4fe4-98f7-816f8763e7ce	null	172.21.0.1	2026-04-15 07:29:22.967
169a23e4-87c2-480d-b3b6-3d6e56bf9382	ec3a00a7-d47b-4b42-a8f2-94091069258f	DELETE_INVENTORY	Listing	a40f7efc-35a8-4a26-883c-1bbe6f75c24c	null	172.21.0.1	2026-04-15 07:29:25.486
e8be9679-c86d-42b8-a1b0-7d2ec7380d28	ec3a00a7-d47b-4b42-a8f2-94091069258f	DELETE_INVENTORY	Listing	08bb67f7-12a3-4d44-873e-f259e006441c	null	172.21.0.1	2026-04-15 07:29:28.114
19e4efe0-7350-492f-86ef-41eb66eae325	ec3a00a7-d47b-4b42-a8f2-94091069258f	DELETE_INVENTORY	Listing	86e51827-c7c4-4487-9d8c-e0abe65db7dc	null	172.21.0.1	2026-04-15 07:29:32.794
3c2b5d54-57b9-462e-a5e8-f46e59951032	ec3a00a7-d47b-4b42-a8f2-94091069258f	DELETE_INVENTORY	Listing	a9ef879a-1246-4739-9887-296f939a2e1b	null	172.21.0.1	2026-04-15 07:29:42.139
4f839f1c-0280-4300-892e-ffc870692abf	ec3a00a7-d47b-4b42-a8f2-94091069258f	DELETE_INVENTORY	Listing	8f6b85f5-133a-4974-8215-1ff53bd670db	null	172.21.0.1	2026-04-15 07:29:45.133
ece49854-29fc-4a06-80d4-5c0e21dd90e8	ec3a00a7-d47b-4b42-a8f2-94091069258f	DELETE_INVENTORY	Listing	206824e2-5c56-4cd9-a85d-abbd2524fc1c	null	172.21.0.1	2026-04-15 07:29:47.971
d7483d02-b2a5-4c3e-9bc9-a946405f331b	ec3a00a7-d47b-4b42-a8f2-94091069258f	DELETE_INVENTORY	Listing	f52b1b52-fd22-4ff1-a15b-904acb7adee4	null	172.21.0.1	2026-04-15 07:29:50.535
92e15fbb-593c-4b5f-8566-acfdd564dfec	ec3a00a7-d47b-4b42-a8f2-94091069258f	DELETE_INVENTORY	Listing	a72408ab-ccc6-4064-b57f-c3fbf7c17489	null	172.21.0.1	2026-04-15 07:29:53.523
c3466d6b-52d8-483c-94ab-e6fee38c315e	ec3a00a7-d47b-4b42-a8f2-94091069258f	DELETE_INVENTORY	Listing	3eefc27f-e1c1-43e4-a874-23aa5996aacc	null	172.21.0.1	2026-04-15 07:29:56.167
4934158a-9851-4ee4-855e-96391c5f34e9	ec3a00a7-d47b-4b42-a8f2-94091069258f	DELETE_INVENTORY	Listing	1cdc3eba-ca59-4f76-ae23-ab9250fa8051	null	172.21.0.1	2026-04-15 07:29:58.59
460747fa-2086-4b55-b304-be6857f3513e	ec3a00a7-d47b-4b42-a8f2-94091069258f	DELETE_INVENTORY	Listing	8a2a2572-3a0d-4b13-9152-f0002df8178d	null	172.21.0.1	2026-04-15 07:30:01.453
6cd1acf8-f712-4b5d-b023-75dce5b09f25	\N	OTP_REQUESTED	\N	\N	{"email": "aastharani07@gmail.com"}	172.21.0.1	2026-04-15 07:42:28.965
08221f64-649d-4e25-8dd3-703d6725f385	\N	OTP_VERIFIED	\N	\N	{"email": "aastharani07@gmail.com"}	172.21.0.1	2026-04-15 07:42:32.673
a34f8b2b-4cd8-4d89-b14f-50c55009b3e4	ac8f3716-a370-43e0-9ab0-096dc36a0b55	LOGIN	\N	\N	null	172.21.0.1	2026-04-15 07:42:32.691
3b121de4-76b0-4dd9-8c13-5aba35c6c246	ac8f3716-a370-43e0-9ab0-096dc36a0b55	CREATE_INVENTORY	Listing	29ec1a09-8b47-4726-94f7-7e3b12f14d98	{"total_units": 9}	172.21.0.1	2026-04-15 07:48:11.598
6c16ff4f-c148-4535-960e-43cb32ab5ab3	\N	OTP_REQUESTED	\N	\N	{"email": "deepanshu.gupta@netgroup.ai"}	172.21.0.1	2026-04-15 09:19:33.554
64b55356-15fb-481b-b890-bd6083d4733a	\N	OTP_VERIFIED	\N	\N	{"email": "deepanshu.gupta@netgroup.ai"}	172.21.0.1	2026-04-15 09:19:36.688
82326434-3bd0-49e4-96ff-5d48fb1059ab	ec3a00a7-d47b-4b42-a8f2-94091069258f	LOGIN	\N	\N	null	172.21.0.1	2026-04-15 09:19:36.704
ad671d3c-1bda-46e6-94cc-b85700b50803	ec3a00a7-d47b-4b42-a8f2-94091069258f	DELETE_USER	\N	\N	{"userId": "1aa1ba63-e79d-426e-a081-60b6e9839674"}	172.21.0.1	2026-04-15 09:19:57.727
6137c4e1-89a2-42f6-85e0-576c7e94733e	ec3a00a7-d47b-4b42-a8f2-94091069258f	DELETE_USER	\N	\N	{"userId": "0603adb1-3d6c-4337-88be-7b1b0fe46af5"}	172.21.0.1	2026-04-15 09:23:28.087
819a815a-9717-4062-9e63-ba2cbd4d73ee	ec3a00a7-d47b-4b42-a8f2-94091069258f	DELETE_USER	\N	\N	{"userId": "7f30f516-ef59-486b-a1df-9aee6a566a32"}	172.21.0.1	2026-04-15 09:23:33.462
fd0d2749-cfa7-4305-a808-d1df9fbeec74	ec3a00a7-d47b-4b42-a8f2-94091069258f	DELETE_USER	\N	\N	{"userId": "849683f8-d14c-438c-a95b-c199d3da4989"}	172.21.0.1	2026-04-15 09:23:36.683
c369ba8e-9733-4712-a9ca-63563ad7803a	ec3a00a7-d47b-4b42-a8f2-94091069258f	DELETE_USER	\N	\N	{"userId": "d1b2bae9-800e-4ff3-9cf4-be087981b968"}	172.21.0.1	2026-04-15 09:23:41.705
934745ab-5e1f-4710-b37f-cfd9d2bd7bc5	\N	OTP_REQUESTED	\N	\N	{"email": "aastharani07@gmail.com"}	172.21.0.1	2026-04-15 09:31:03.441
aeec9e3b-d924-4c06-bb62-4783d21501f8	\N	OTP_VERIFIED	\N	\N	{"email": "aastharani07@gmail.com"}	172.21.0.1	2026-04-15 09:31:07.661
000eedf4-f4fd-4ef4-9fa8-ddf3cab4c752	ac8f3716-a370-43e0-9ab0-096dc36a0b55	LOGIN	\N	\N	null	172.21.0.1	2026-04-15 09:31:07.681
3d363476-222d-4b70-8738-f64bb0fba734	ac8f3716-a370-43e0-9ab0-096dc36a0b55	DELETE_INVENTORY	Listing	04885157-9e47-4748-856a-74d9bcf656bc	null	172.21.0.1	2026-04-15 09:37:59.253
a714b2d5-8ed0-4e70-835a-1f850923bbaa	\N	OTP_REQUESTED	\N	\N	{"email": "support@iamsaif.ai"}	172.21.0.1	2026-04-15 09:38:36.227
6635f9ba-6cf5-40e3-be7c-0d79a39f478c	\N	OTP_VERIFIED	\N	\N	{"email": "support@iamsaif.ai"}	172.21.0.1	2026-04-15 09:38:38.754
a86d18b1-767f-4a27-955c-16b096cbe9b1	efde422a-a371-494b-96f5-19678cae7eb2	REGISTER_CUSTOMER	User	efde422a-a371-494b-96f5-19678cae7eb2	null	172.21.0.1	2026-04-15 09:40:58.156
e810d0ea-1535-4519-813b-5c6a2bc33a6a	\N	OTP_REQUESTED	\N	\N	{"email": "aastha.pradhan@apeiro.digital"}	172.21.0.1	2026-04-15 09:42:47.743
eb55d2b8-0d57-4a04-97db-a5aecc10f388	\N	OTP_VERIFIED	\N	\N	{"email": "aastha.pradhan@apeiro.digital"}	172.21.0.1	2026-04-15 09:42:50.775
90eff2a3-4f9a-4a7f-863c-c03b0a520030	\N	OTP_REQUESTED	\N	\N	{"email": "support@iamsaif.ai"}	172.21.0.1	2026-04-15 10:00:37.44
128f3226-177c-482b-9f5f-46a6ea56a4a1	\N	OTP_VERIFIED	\N	\N	{"email": "support@iamsaif.ai"}	172.21.0.1	2026-04-15 10:00:40.077
d6eb7fb6-4146-441d-9f7f-e6c96b992992	efde422a-a371-494b-96f5-19678cae7eb2	LOGIN	\N	\N	null	172.21.0.1	2026-04-15 10:00:40.107
7d0b95a2-60ca-4097-b7d9-6c593e47519a	efde422a-a371-494b-96f5-19678cae7eb2	CREATE_GPU_DEMAND	Inquiry	79e99e7e-a502-4641-9c2f-de375b147f82	null	172.21.0.1	2026-04-15 10:06:16.794
9b9cc468-5907-4269-a29a-9d9b5140c221	efde422a-a371-494b-96f5-19678cae7eb2	CREATE_GPU_DEMAND	Inquiry	0e51cdf1-4743-48ab-9b46-fe538a2ed7dd	null	172.21.0.1	2026-04-15 10:09:34.322
0843e6eb-c274-49c6-ba30-e9856030d0f3	efde422a-a371-494b-96f5-19678cae7eb2	CREATE_GPU_DEMAND	Inquiry	f1a4b956-9015-492c-8180-51fbb5babc93	null	172.21.0.1	2026-04-15 10:10:00.395
a3345e00-8b11-41c8-9c01-2d6fca72575e	efde422a-a371-494b-96f5-19678cae7eb2	CREATE_GPU_DEMAND	Inquiry	88ab2481-b070-472c-83f5-507f1253a11a	null	172.21.0.1	2026-04-15 10:21:40.93
3e626a5e-68db-4865-8a63-a51f5ef07a32	efde422a-a371-494b-96f5-19678cae7eb2	SUBMIT_GPU_DEMAND	Inquiry	88ab2481-b070-472c-83f5-507f1253a11a	null	172.21.0.1	2026-04-15 10:21:41
85f2b59d-cc19-40ce-ba2b-838ad87b89c4	efde422a-a371-494b-96f5-19678cae7eb2	CREATE_DC_REQUEST	Inquiry	8acf264c-76bc-4a0e-930f-115b31245499	null	172.21.0.1	2026-04-15 10:30:31.322
859f8fcf-8f01-4761-ace4-838952f447ca	efde422a-a371-494b-96f5-19678cae7eb2	SUBMIT_DC_REQUEST	Inquiry	8acf264c-76bc-4a0e-930f-115b31245499	null	172.21.0.1	2026-04-15 10:30:31.387
5609a7a3-518c-46cb-9746-bd75678b97a5	\N	OTP_REQUESTED	\N	\N	{"email": "aastha.pradhan@apeiro.digital"}	172.21.0.1	2026-04-15 10:53:07.565
c0892d7c-ac06-4e3e-9598-2c69636e5d76	\N	OTP_VERIFIED	\N	\N	{"email": "aastha.pradhan@apeiro.digital"}	172.21.0.1	2026-04-15 10:53:10.338
634ad301-7450-425c-85c2-2d1e709c3a21	\N	OTP_REQUESTED	\N	\N	{"email": "deepanshu.gupta@netgroup.ai"}	172.21.0.1	2026-04-15 10:55:10.96
18206ea1-fc12-4dd5-ac16-92751043385a	\N	OTP_VERIFIED	\N	\N	{"email": "deepanshu.gupta@netgroup.ai"}	172.21.0.1	2026-04-15 10:55:13.693
875ed455-d9be-49e0-8672-5c5b4db0bda6	\N	OTP_REQUESTED	\N	\N	{"email": "aastha.pradhan@apeiro.digital"}	172.21.0.1	2026-04-15 11:00:31.016
6ec24b38-8fce-4375-ab50-a2f903758f58	\N	OTP_VERIFIED	\N	\N	{"email": "aastha.pradhan@apeiro.digital"}	172.21.0.1	2026-04-15 11:00:34.386
fbc92f5a-7e71-4bc3-885e-f4c131ea6d21	\N	OTP_REQUESTED	\N	\N	{"email": "deepanshu.gupta@netgroup.ai"}	172.21.0.1	2026-04-15 11:04:20.405
ec67da31-54f4-4a6d-990f-6ccef6347f5f	\N	OTP_VERIFIED	\N	\N	{"email": "deepanshu.gupta@netgroup.ai"}	172.21.0.1	2026-04-15 11:04:23.44
1efc439f-c6dc-4157-bf11-e1a2480e79cc	ec3a00a7-d47b-4b42-a8f2-94091069258f	LOGIN	\N	\N	null	172.21.0.1	2026-04-15 11:04:23.459
a333e76d-127d-489c-a1e4-52ae58838d7f	\N	OTP_REQUESTED	\N	\N	{"email": "support@iamsaif.ai"}	172.21.0.1	2026-04-15 11:12:38.323
8bcb856f-c869-4076-90f6-95ce1cd1cb7e	\N	OTP_VERIFIED	\N	\N	{"email": "support@iamsaif.ai"}	172.21.0.1	2026-04-15 11:12:40.701
89414517-5e92-44a4-9812-fbfe3bcaa661	efde422a-a371-494b-96f5-19678cae7eb2	LOGIN	\N	\N	null	172.21.0.1	2026-04-15 11:12:40.721
5a920273-d1a2-4668-82e9-b24f3ad5ee8b	\N	OTP_REQUESTED	\N	\N	{"email": "aastha.pradhan@apeiro.digital"}	172.21.0.1	2026-04-15 11:32:06.585
56cdf786-6864-412c-afc4-5277e9c07d5b	\N	OTP_REQUESTED	\N	\N	{"email": "aastha.pradhan@apeiro.digital"}	172.21.0.1	2026-04-15 11:32:24.799
f377aa8f-efc3-4ea6-875f-62802d0c8ca8	\N	OTP_VERIFIED	\N	\N	{"email": "aastha.pradhan@apeiro.digital"}	172.21.0.1	2026-04-15 11:32:26.981
45e3f3fb-22d7-4ced-9bc1-cf5eea7d60a8	\N	OTP_REQUESTED	\N	\N	{"email": "aastharani07@gmail.com"}	172.21.0.1	2026-04-15 11:34:34.431
0cddca9e-d578-4890-9796-18124813db52	\N	OTP_VERIFIED	\N	\N	{"email": "aastharani07@gmail.com"}	172.21.0.1	2026-04-15 11:34:36.25
fc9bb4a8-9052-48f6-9979-a64e7fa1379b	ac8f3716-a370-43e0-9ab0-096dc36a0b55	LOGIN	\N	\N	null	172.21.0.1	2026-04-15 11:34:36.267
8ef0d43f-ba03-4f1d-887c-9dfa2faf386a	\N	OTP_REQUESTED	\N	\N	{"email": "deepanshu.gupta@netgroup.ai"}	172.21.0.1	2026-04-15 12:07:28.197
f217d072-3638-49ce-aeed-5db7bf2d7e4c	\N	OTP_VERIFIED	\N	\N	{"email": "deepanshu.gupta@netgroup.ai"}	172.21.0.1	2026-04-15 12:07:43.327
8eda5c36-7fe9-4392-ab7b-c5173a0ca416	ec3a00a7-d47b-4b42-a8f2-94091069258f	LOGIN	\N	\N	null	172.21.0.1	2026-04-15 12:07:43.343
e0e119e9-8ac7-45ca-95c8-20ac8dad7dc7	ec3a00a7-d47b-4b42-a8f2-94091069258f	GENERATE_REPORT	Report	\N	{"format": "csv", "rowCount": 0, "reportType": "DC_LISTINGS"}	\N	2026-04-15 12:31:11.508
a00c1172-a8dd-47ba-a82c-146cc550a9bc	ec3a00a7-d47b-4b42-a8f2-94091069258f	GENERATE_REPORT	Report	\N	{"format": "csv", "rowCount": 0, "reportType": "DC_LISTINGS"}	\N	2026-04-15 12:40:05.995
3f117382-01c7-4fec-b2e1-d8b89d56b78a	ec3a00a7-d47b-4b42-a8f2-94091069258f	GENERATE_REPORT	Report	\N	{"format": "csv", "rowCount": 0, "reportType": "DC_LISTINGS"}	\N	2026-04-15 15:50:01.556
56c26c2c-0952-447c-b842-18f4a6f25b65	ec3a00a7-d47b-4b42-a8f2-94091069258f	GENERATE_REPORT	Report	\N	{"format": "csv", "rowCount": 0, "reportType": "DC_LISTINGS"}	\N	2026-04-15 15:57:14.671
2d4b72b8-e4b5-43b9-8aa4-be0f1fca0ac8	ec3a00a7-d47b-4b42-a8f2-94091069258f	GENERATE_REPORT	Report	\N	{"format": "csv", "rowCount": 0, "reportType": "DC_LISTINGS"}	\N	2026-04-15 15:57:58.886
445a621a-06b3-4bf8-9def-b80a2b8b46cb	ec3a00a7-d47b-4b42-a8f2-94091069258f	GENERATE_REPORT	Report	\N	{"format": "csv", "rowCount": 0, "reportType": "DC_LISTINGS"}	\N	2026-04-15 16:36:17.276
cebbd0a6-e44e-45d3-8ed8-642694bbed90	ec3a00a7-d47b-4b42-a8f2-94091069258f	GENERATE_REPORT	Report	\N	{"format": "csv", "rowCount": 0, "reportType": "DC_LISTINGS"}	\N	2026-04-15 16:49:46.26
7333c0db-0db8-457c-b32b-5ba24623e6a1	\N	OTP_REQUESTED	\N	\N	{"email": "aastha.pradhan@apeiro.digital"}	172.21.0.1	2026-04-16 04:04:34.954
41c29f42-db9f-4e27-ad71-0f54b0a570a9	\N	OTP_VERIFIED	\N	\N	{"email": "aastha.pradhan@apeiro.digital"}	172.21.0.1	2026-04-16 04:04:37.823
f900db89-a770-452f-a7b1-63c40cd2b22a	\N	OTP_REQUESTED	\N	\N	{"email": "aastharani07@gmail.com"}	172.21.0.1	2026-04-16 04:11:15.74
f40d84e1-ffc5-4d40-bf67-78f7844d591d	\N	OTP_VERIFIED	\N	\N	{"email": "aastharani07@gmail.com"}	172.21.0.1	2026-04-16 04:11:18.887
db9e9995-7329-4757-9f9c-eca86e0fab82	ac8f3716-a370-43e0-9ab0-096dc36a0b55	LOGIN	\N	\N	null	172.21.0.1	2026-04-16 04:11:18.922
5b57cb67-026f-4c25-a8db-8d24ee2459aa	\N	OTP_REQUESTED	\N	\N	{"email": "aastha.pradhan@apeiro.digital"}	172.21.0.1	2026-04-16 04:46:39.406
49073a97-4753-4bc7-9b23-6640a6bb7ac7	\N	OTP_REQUESTED	\N	\N	{"email": "aastha.pradhan@apeiro.digital"}	172.21.0.1	2026-04-16 04:46:52.416
dab0a13c-895a-4709-8df9-0f23cbb35452	\N	OTP_VERIFIED	\N	\N	{"email": "aastha.pradhan@apeiro.digital"}	172.21.0.1	2026-04-16 04:46:54.914
cf2ce0f7-6cb5-4ab0-b242-d4bc66d65dfc	\N	OTP_REQUESTED	\N	\N	{"email": "aastha.pradhan@apeiro.digital"}	172.21.0.1	2026-04-16 05:13:46.705
e33a7c38-41dd-4a0a-b9ab-a73e341a1c3d	\N	OTP_VERIFIED	\N	\N	{"email": "aastha.pradhan@apeiro.digital"}	172.21.0.1	2026-04-16 05:14:17.819
188eae58-7ae0-40e0-b846-03f63fad04e8	\N	OTP_REQUESTED	\N	\N	{"email": "aastha.pradhan@apeiro.digital"}	172.21.0.1	2026-04-16 05:15:00.6
cc27c6da-383a-4d1b-917c-ddd89ddff485	\N	OTP_VERIFIED	\N	\N	{"email": "aastha.pradhan@apeiro.digital"}	172.21.0.1	2026-04-16 05:15:05.482
77efc5f6-3c36-4bae-a38b-c254319023d3	\N	OTP_REQUESTED	\N	\N	{"email": "aastha.pradhan@apeiro.digital"}	172.21.0.1	2026-04-16 05:26:45.976
111a306e-d243-4d27-84af-59d6136ec1fa	\N	OTP_VERIFIED	\N	\N	{"email": "aastha.pradhan@apeiro.digital"}	172.21.0.1	2026-04-16 05:26:49.011
59ecf189-e633-49bc-9d0a-43c99b9b50e0	\N	OTP_REQUESTED	\N	\N	{"email": "aastha.pradhan@apeiro.digital"}	172.21.0.1	2026-04-16 06:09:22.008
69204771-055a-49b5-abcd-1bdb7b9226ce	\N	OTP_VERIFIED	\N	\N	{"email": "aastha.pradhan@apeiro.digital"}	172.21.0.1	2026-04-16 06:09:25.395
0cc7c512-cc42-4adf-b0e4-8472c23fb1dd	\N	OTP_REQUESTED	\N	\N	{"email": "aastharani07@gmail.com"}	172.21.0.1	2026-04-16 06:21:36.045
03b4dd80-ad34-4f2a-88a6-929c8abc870a	\N	OTP_VERIFIED	\N	\N	{"email": "aastharani07@gmail.com"}	172.21.0.1	2026-04-16 06:21:39.813
5c5b7a71-1fec-42f8-957f-de2b4128cbe7	ac8f3716-a370-43e0-9ab0-096dc36a0b55	LOGIN	\N	\N	null	172.21.0.1	2026-04-16 06:21:39.854
36c6d53f-7c06-4a0d-8853-d3da131a700b	ac8f3716-a370-43e0-9ab0-096dc36a0b55	GENERATE_REPORT	Report	\N	{"format": "pdf", "rowCount": 0, "reportType": "GPU_CLUSTERS"}	\N	2026-04-16 06:22:57.893
082b891c-97ad-4544-a136-686a2f6cc43d	\N	OTP_REQUESTED	\N	\N	{"email": "aastha.pradhan@apeiro.digital"}	172.21.0.1	2026-04-16 06:33:49.664
5347673a-2139-47d9-8e93-0fafad2e00c6	\N	OTP_VERIFIED	\N	\N	{"email": "aastha.pradhan@apeiro.digital"}	172.21.0.1	2026-04-16 06:33:53.004
1802bc29-c557-4739-b252-c229b66a6a68	\N	OTP_REQUESTED	\N	\N	{"email": "aastharani07@gmail.com"}	172.21.0.1	2026-04-16 06:41:19.871
3b6cc7e7-2254-4d09-ac78-72b8310fdbef	\N	OTP_VERIFIED	\N	\N	{"email": "aastharani07@gmail.com"}	172.21.0.1	2026-04-16 06:41:22.034
b48ebded-e678-4682-a0d6-faf68f88579f	ac8f3716-a370-43e0-9ab0-096dc36a0b55	LOGIN	\N	\N	null	172.21.0.1	2026-04-16 06:41:22.051
47885394-ba7d-4dfa-a343-5638c365c1a1	\N	OTP_REQUESTED	\N	\N	{"email": "support@iamsaif.ai"}	172.21.0.1	2026-04-16 06:42:38.505
86181a76-debb-4248-8f92-32d9ff62f67b	\N	OTP_VERIFIED	\N	\N	{"email": "support@iamsaif.ai"}	172.21.0.1	2026-04-16 06:42:40.523
a348b241-ae60-44a4-90d6-ca94d6b50795	efde422a-a371-494b-96f5-19678cae7eb2	LOGIN	\N	\N	null	172.21.0.1	2026-04-16 06:42:40.536
4088dee1-e828-4c0f-92d4-3e0c2ed3a4db	\N	OTP_REQUESTED	\N	\N	{"email": "aastha.pradhan@apeiro.digital"}	172.21.0.1	2026-04-16 07:01:37.969
3bee6d1d-a075-45a9-8975-dda385859553	\N	OTP_VERIFIED	\N	\N	{"email": "aastha.pradhan@apeiro.digital"}	172.21.0.1	2026-04-16 07:01:40.668
cf6564fe-b0ac-41ee-9c1e-236fc0883bf2	\N	OTP_REQUESTED	\N	\N	{"email": "aastha.pradhan@apeiro.digital"}	172.21.0.1	2026-04-16 07:18:08.991
456a6b09-31ff-4526-8090-4800960e4954	\N	OTP_VERIFIED	\N	\N	{"email": "aastha.pradhan@apeiro.digital"}	172.21.0.1	2026-04-16 07:18:11.36
75efdbc8-ba11-4399-aa9e-bbefdfec841d	\N	OTP_REQUESTED	\N	\N	{"email": "aastharani07@gmail.com"}	172.21.0.1	2026-04-16 09:30:39.581
c11c1676-2232-4207-8bce-03e85ca8fbfa	\N	OTP_VERIFIED	\N	\N	{"email": "aastharani07@gmail.com"}	172.21.0.1	2026-04-16 09:30:41.65
e16974b4-2e28-483f-97b5-bea7e940ca89	ac8f3716-a370-43e0-9ab0-096dc36a0b55	LOGIN	\N	\N	null	172.21.0.1	2026-04-16 09:30:41.707
658b25bb-1c29-4adc-b63b-c010f667637a	\N	OTP_REQUESTED	\N	\N	{"email": "aastharani07@gmail.com"}	172.21.0.1	2026-04-16 09:56:11.941
f345667c-d12f-45f5-b138-0404fab4d776	\N	OTP_VERIFIED	\N	\N	{"email": "aastharani07@gmail.com"}	172.21.0.1	2026-04-16 09:56:14.358
6fdc3b6e-f177-4d0e-bde6-6b73de8cd287	ac8f3716-a370-43e0-9ab0-096dc36a0b55	LOGIN	\N	\N	null	172.21.0.1	2026-04-16 09:56:14.383
9533880c-25b2-4659-bdd6-988fbe59094d	\N	OTP_REQUESTED	\N	\N	{"email": "pradhanaastha24@gmail.com"}	172.21.0.1	2026-04-16 10:02:41.453
33b0151d-ed15-40f2-984b-d0c006837f5f	\N	OTP_VERIFIED	\N	\N	{"email": "pradhanaastha24@gmail.com"}	172.21.0.1	2026-04-16 10:02:44.403
bfe1f054-dde9-4ae6-934b-cff7d7bafa3f	\N	OTP_REQUESTED	\N	\N	{"email": "aastharani07@gmail.com"}	172.21.0.1	2026-04-16 11:08:33.321
755e6b03-5fb9-453d-b838-9194eea577ef	\N	OTP_VERIFIED	\N	\N	{"email": "aastharani07@gmail.com"}	172.21.0.1	2026-04-16 11:08:35.479
511933ec-6794-4e87-80a4-880699bbebba	ac8f3716-a370-43e0-9ab0-096dc36a0b55	LOGIN	\N	\N	null	172.21.0.1	2026-04-16 11:08:35.528
ea2b3fce-f034-49de-9dff-046773e8a3c1	\N	OTP_REQUESTED	\N	\N	{"email": "aastharani07@gmail.com"}	172.21.0.1	2026-04-16 11:10:20.094
7c3aa576-7c3e-4c38-8fa5-7d3eba82a453	\N	OTP_VERIFIED	\N	\N	{"email": "aastharani07@gmail.com"}	172.21.0.1	2026-04-16 11:10:30.077
f4e55b8a-758a-40f0-8875-897290c9056e	ac8f3716-a370-43e0-9ab0-096dc36a0b55	LOGIN	\N	\N	null	172.21.0.1	2026-04-16 11:10:30.105
6ceabcc2-40b2-4fdc-a33f-13978d6b3f2e	\N	OTP_REQUESTED	\N	\N	{"email": "aastharani07@gmail.com"}	172.21.0.1	2026-04-16 11:39:45.156
09711e95-bf0e-47b7-9afc-8489f363db4c	\N	OTP_VERIFIED	\N	\N	{"email": "aastharani07@gmail.com"}	172.21.0.1	2026-04-16 11:39:49.255
8df5006a-20cc-4982-80b1-e6014d2b0eae	ac8f3716-a370-43e0-9ab0-096dc36a0b55	LOGIN	\N	\N	null	172.21.0.1	2026-04-16 11:39:49.3
9bede8f8-650d-47c5-bc79-ac7c2a473965	\N	OTP_REQUESTED	\N	\N	{"email": "aastharani07@gmail.com"}	172.21.0.1	2026-04-16 11:58:12.151
c426d915-9ec0-49a4-8b83-0cfc0867ad05	\N	OTP_VERIFIED	\N	\N	{"email": "aastharani07@gmail.com"}	172.21.0.1	2026-04-16 11:58:15.663
35ea7f07-e9ea-4cdd-adbc-7db9537c0ceb	ac8f3716-a370-43e0-9ab0-096dc36a0b55	LOGIN	\N	\N	null	172.21.0.1	2026-04-16 11:58:15.705
6cc5e540-6403-4efa-9dcc-3facfee706e2	\N	OTP_REQUESTED	\N	\N	{"email": "aastharani07@gmail.com"}	172.21.0.1	2026-04-16 12:06:16.459
3dcfa3f8-6634-41d1-a952-ba74e6eb378e	\N	OTP_VERIFIED	\N	\N	{"email": "aastharani07@gmail.com"}	172.21.0.1	2026-04-16 12:06:18.106
b1505444-fa74-4f8f-a837-6cb727f8e398	ac8f3716-a370-43e0-9ab0-096dc36a0b55	LOGIN	\N	\N	null	172.21.0.1	2026-04-16 12:06:18.157
e639e998-fd35-42e0-811b-159c893e5d59	\N	OTP_REQUESTED	\N	\N	{"email": "aastharani07@gmail.com"}	172.21.0.1	2026-04-16 12:15:48.155
7e61cdbb-6b4c-4492-86c6-5e8c9ce95ec1	\N	OTP_VERIFIED	\N	\N	{"email": "aastharani07@gmail.com"}	172.21.0.1	2026-04-16 12:15:50.591
e240e7d4-8ed6-4ab3-95e7-61f56dc88978	ac8f3716-a370-43e0-9ab0-096dc36a0b55	LOGIN	\N	\N	null	172.21.0.1	2026-04-16 12:15:50.634
57a7c822-cde4-4e57-a41c-8bcf68a9a24d	\N	OTP_REQUESTED	\N	\N	{"email": "aastharani07@gmail.com"}	172.21.0.1	2026-04-16 12:22:43.452
7a3c48e2-9ffd-461e-a033-cffefece12a1	\N	OTP_VERIFIED	\N	\N	{"email": "aastharani07@gmail.com"}	172.21.0.1	2026-04-16 12:22:45.234
1bab63b4-a296-4f12-89f4-308fb958b914	ac8f3716-a370-43e0-9ab0-096dc36a0b55	LOGIN	\N	\N	null	172.21.0.1	2026-04-16 12:22:45.285
539c37c3-6d60-45cf-b976-dbff9e292cc0	ac8f3716-a370-43e0-9ab0-096dc36a0b55	CREATE_GPU_CLUSTER	Listing	944d0957-8515-405c-b31d-dc1d61916ba3	null	172.21.0.1	2026-04-16 12:23:39.14
d5dc7d58-903b-4a42-b8e8-1bd1a3109b66	ac8f3716-a370-43e0-9ab0-096dc36a0b55	UPDATE_GPU_CLUSTER	Listing	944d0957-8515-405c-b31d-dc1d61916ba3	null	172.21.0.1	2026-04-16 12:23:41.724
dcad2d88-0c29-461e-b2d0-094cc18a15ef	ac8f3716-a370-43e0-9ab0-096dc36a0b55	UPDATE_GPU_CLUSTER	Listing	944d0957-8515-405c-b31d-dc1d61916ba3	null	172.21.0.1	2026-04-16 12:23:48.318
f71cdc15-0b3b-4be8-813f-0892b7c70695	ac8f3716-a370-43e0-9ab0-096dc36a0b55	UPDATE_GPU_CLUSTER	Listing	944d0957-8515-405c-b31d-dc1d61916ba3	null	172.21.0.1	2026-04-16 12:23:50.892
fce8c01d-b35a-4aa7-9f3b-4c3cf271b526	ac8f3716-a370-43e0-9ab0-096dc36a0b55	UPDATE_GPU_CLUSTER	Listing	944d0957-8515-405c-b31d-dc1d61916ba3	null	172.21.0.1	2026-04-16 12:23:56.904
b2233e72-7fe9-402c-a0bb-20cca00f1ccc	ac8f3716-a370-43e0-9ab0-096dc36a0b55	UPDATE_GPU_CLUSTER	Listing	944d0957-8515-405c-b31d-dc1d61916ba3	null	172.21.0.1	2026-04-16 12:23:59.477
b1fcaaaf-fe1a-499c-9957-efe04be9d144	ac8f3716-a370-43e0-9ab0-096dc36a0b55	UPDATE_GPU_CLUSTER	Listing	944d0957-8515-405c-b31d-dc1d61916ba3	null	172.21.0.1	2026-04-16 12:24:04.407
ab836830-428c-4166-970d-df6e52fdb9fe	ac8f3716-a370-43e0-9ab0-096dc36a0b55	UPDATE_GPU_CLUSTER	Listing	944d0957-8515-405c-b31d-dc1d61916ba3	null	172.21.0.1	2026-04-16 12:24:11.017
d79c06bb-55da-4999-96a2-c03a6c2dcfee	ac8f3716-a370-43e0-9ab0-096dc36a0b55	UPDATE_GPU_CLUSTER	Listing	944d0957-8515-405c-b31d-dc1d61916ba3	null	172.21.0.1	2026-04-16 12:24:13.588
907617df-38a0-46dc-8387-48b85791b510	ac8f3716-a370-43e0-9ab0-096dc36a0b55	UPDATE_GPU_CLUSTER	Listing	944d0957-8515-405c-b31d-dc1d61916ba3	null	172.21.0.1	2026-04-16 12:24:19.89
ed32af07-eed5-4e07-8962-44cb29ec34bb	ac8f3716-a370-43e0-9ab0-096dc36a0b55	UPDATE_GPU_CLUSTER	Listing	944d0957-8515-405c-b31d-dc1d61916ba3	null	172.21.0.1	2026-04-16 12:24:22.488
bdc6c2c0-6794-4fbc-8369-2e7c4ac588dd	ac8f3716-a370-43e0-9ab0-096dc36a0b55	UPDATE_GPU_CLUSTER	Listing	944d0957-8515-405c-b31d-dc1d61916ba3	null	172.21.0.1	2026-04-16 12:24:27.197
4e7dfa5a-949e-440e-9ed2-a6a76e32f0f1	\N	LOGIN	\N	\N	null	172.21.0.1	2026-04-16 06:33:53.028
adb2f0e7-cad9-4cd4-b7c6-a32e13434787	ac8f3716-a370-43e0-9ab0-096dc36a0b55	UPDATE_GPU_CLUSTER	Listing	944d0957-8515-405c-b31d-dc1d61916ba3	null	172.21.0.1	2026-04-16 12:24:28.239
d33cd59d-c43f-4c78-bbbe-5c2265f44fc9	ac8f3716-a370-43e0-9ab0-096dc36a0b55	UPDATE_GPU_CLUSTER	Listing	944d0957-8515-405c-b31d-dc1d61916ba3	null	172.21.0.1	2026-04-16 12:24:30.807
d122c91f-ae0c-4e78-b4d7-157d2d1e2378	ac8f3716-a370-43e0-9ab0-096dc36a0b55	UPDATE_GPU_CLUSTER	Listing	944d0957-8515-405c-b31d-dc1d61916ba3	null	172.21.0.1	2026-04-16 12:24:35.335
a9c9fa57-ab00-4c5d-8f6e-489bdff4365b	ac8f3716-a370-43e0-9ab0-096dc36a0b55	UPDATE_GPU_CLUSTER	Listing	944d0957-8515-405c-b31d-dc1d61916ba3	null	172.21.0.1	2026-04-16 12:24:37.909
ac05be12-98cb-49b3-b6d4-9cb7fdbf996c	ac8f3716-a370-43e0-9ab0-096dc36a0b55	UPDATE_GPU_CLUSTER	Listing	944d0957-8515-405c-b31d-dc1d61916ba3	null	172.21.0.1	2026-04-16 12:24:43.277
ee83b771-f04a-45b0-95d0-aa83fa951a3e	ac8f3716-a370-43e0-9ab0-096dc36a0b55	UPDATE_GPU_CLUSTER	Listing	944d0957-8515-405c-b31d-dc1d61916ba3	null	172.21.0.1	2026-04-16 12:24:45.846
c68a2066-09e6-4e9c-a249-93497ecaf2f8	ac8f3716-a370-43e0-9ab0-096dc36a0b55	UPDATE_GPU_CLUSTER	Listing	944d0957-8515-405c-b31d-dc1d61916ba3	null	172.21.0.1	2026-04-16 12:24:52.982
ffcadc3f-0f41-4f8a-ad8e-f40026564bdc	ac8f3716-a370-43e0-9ab0-096dc36a0b55	SUBMIT_GPU_CLUSTER	Listing	944d0957-8515-405c-b31d-dc1d61916ba3	null	172.21.0.1	2026-04-16 12:24:55.034
fc6a8681-aea9-4b71-b746-f6f2ed2b413f	\N	OTP_REQUESTED	\N	\N	{"email": "aastha.pradhan@apeiro.digital"}	172.21.0.1	2026-04-16 12:25:48.685
cb600282-b804-400f-b9d5-27e55ba8a5f6	\N	OTP_VERIFIED	\N	\N	{"email": "aastha.pradhan@apeiro.digital"}	172.21.0.1	2026-04-16 12:25:50.847
5ba858f5-cf8d-49d6-8641-24fab0c5d848	\N	OTP_REQUESTED	\N	\N	{"email": "deepanshu.gupta@netgroup.ai"}	172.21.0.1	2026-04-16 12:31:21.456
04fc7f83-3942-408f-be03-3afe1e57d8eb	\N	OTP_VERIFIED	\N	\N	{"email": "deepanshu.gupta@netgroup.ai"}	172.21.0.1	2026-04-16 12:31:24.038
91fe030e-17a6-4b88-a054-93d5cf492bfc	ec3a00a7-d47b-4b42-a8f2-94091069258f	LOGIN	\N	\N	null	172.21.0.1	2026-04-16 12:31:24.086
041cfcc0-6568-41f5-8a0c-2048b0dd90fa	\N	OTP_REQUESTED	\N	\N	{"email": "support@iamsaif.ai"}	172.21.0.1	2026-04-16 12:31:48.353
7727b9d4-08ea-4360-9e33-8b64253b2f76	\N	OTP_VERIFIED	\N	\N	{"email": "support@iamsaif.ai"}	172.21.0.1	2026-04-16 12:31:51.188
49e30d49-a1f1-404a-a1b7-10db26aa41ab	efde422a-a371-494b-96f5-19678cae7eb2	LOGIN	\N	\N	null	172.21.0.1	2026-04-16 12:31:51.207
b22c641f-3c87-4b81-9b26-0d6f84abc199	\N	OTP_REQUESTED	\N	\N	{"email": "aastha.pradhan@apeiro.digital"}	172.21.0.1	2026-04-16 12:38:02.657
087a31c5-fe7a-4d7a-b152-ee0c90a2169a	\N	OTP_VERIFY_FAILED	\N	\N	{"email": "aastha.pradhan@apeiro.digital", "reason": "Invalid OTP. 2 attempt(s) remaining."}	172.21.0.1	2026-04-16 12:38:05.776
ec6deeea-34fe-451f-b8df-384361c1eb14	\N	OTP_VERIFIED	\N	\N	{"email": "aastha.pradhan@apeiro.digital"}	172.21.0.1	2026-04-16 12:38:20.403
c753262f-3def-43af-a64f-f2fe3c99b899	\N	OTP_REQUESTED	\N	\N	{"email": "aastharani07@gmail.com"}	172.21.0.1	2026-04-16 12:38:37.482
484f64cd-acb0-461b-add0-c8cd7e489d80	\N	OTP_VERIFIED	\N	\N	{"email": "aastharani07@gmail.com"}	172.21.0.1	2026-04-16 12:39:40.646
ac67976e-c2a9-4783-a0bd-6898fe840f49	ac8f3716-a370-43e0-9ab0-096dc36a0b55	LOGIN	\N	\N	null	172.21.0.1	2026-04-16 12:39:40.664
5dc5d3c0-b73a-44b8-8de0-43bc2fa900de	\N	OTP_REQUESTED	\N	\N	{"email": "aastha.pradhan@apeiro.digital"}	172.21.0.1	2026-04-17 04:27:38.899
c73ab7b3-73a1-42ce-8cb5-0d275d665a9c	\N	OTP_VERIFIED	\N	\N	{"email": "aastha.pradhan@apeiro.digital"}	172.21.0.1	2026-04-17 04:27:55.704
f32698ca-7329-4540-8122-baeceaa6e429	\N	OTP_REQUESTED	\N	\N	{"email": "aastharani07@gmail.com"}	172.21.0.1	2026-04-17 05:16:54.591
b8d7e192-f949-4304-bcb4-8a88e04c6171	\N	OTP_VERIFIED	\N	\N	{"email": "aastharani07@gmail.com"}	172.21.0.1	2026-04-17 05:17:20.315
e248e596-e4df-4a8f-9eb7-74dd7c457fa6	ac8f3716-a370-43e0-9ab0-096dc36a0b55	LOGIN	\N	\N	null	172.21.0.1	2026-04-17 05:17:20.362
204b6b7e-1625-4466-a6ef-ed2552190cea	\N	OTP_REQUESTED	\N	\N	{"email": "aastha.pradhan@apeiro.digital"}	172.21.0.1	2026-04-17 05:55:33.273
cf5fac67-0515-4f7c-90cd-00051ec605ce	\N	OTP_VERIFIED	\N	\N	{"email": "aastha.pradhan@apeiro.digital"}	172.21.0.1	2026-04-17 05:55:45.805
b957d860-d5b4-4b58-9f75-122ce9aeb58d	\N	OTP_REQUESTED	\N	\N	{"email": "aastha.pradhan@apeiro.digital"}	172.21.0.1	2026-04-17 08:54:24.39
d35d12d5-38b0-4d2c-a608-3c3d43620af7	\N	OTP_VERIFIED	\N	\N	{"email": "aastha.pradhan@apeiro.digital"}	172.21.0.1	2026-04-17 08:55:06.878
e6ce323f-15da-46cc-b6f6-aa386660e672	\N	OTP_REQUESTED	\N	\N	{"email": "aastha.pradhan@apeiro.digital"}	172.21.0.1	2026-04-17 09:05:39.335
89fd4bd0-b9b3-4c47-9795-cc7352dd8c1f	\N	OTP_VERIFY_FAILED	\N	\N	{"email": "aastha.pradhan@apeiro.digital", "reason": "Invalid OTP. 2 attempt(s) remaining."}	172.21.0.1	2026-04-17 09:06:15.083
4866ac22-3bf8-4ffe-80fd-f2e7f4ef70cc	\N	OTP_RESENT	\N	\N	{"email": "aastha.pradhan@apeiro.digital"}	172.21.0.1	2026-04-17 09:06:59.507
3d13cf1e-2e7d-4df9-a2a6-8aa30078cd19	\N	OTP_VERIFIED	\N	\N	{"email": "aastha.pradhan@apeiro.digital"}	172.21.0.1	2026-04-17 09:07:13.064
3c2e0885-d75c-4f7e-834f-072f46f54198	\N	OTP_REQUESTED	\N	\N	{"email": "aastha.pradhan@apeiro.digital"}	172.21.0.1	2026-04-17 11:54:33.719
019ef738-8c6e-406f-ab7e-472846fdde0e	\N	OTP_VERIFIED	\N	\N	{"email": "aastha.pradhan@apeiro.digital"}	172.21.0.1	2026-04-17 11:54:57.431
8685f606-a452-499d-83f7-f438a543c424	\N	OTP_REQUESTED	\N	\N	{"email": "aastha.pradhan@apeiro.digital"}	172.21.0.1	2026-04-17 12:08:16.147
9ed9473d-ab9e-4968-8f6d-973262b158ba	\N	OTP_VERIFY_FAILED	\N	\N	{"email": "aastha.pradhan@apeiro.digital", "reason": "Invalid OTP. 2 attempt(s) remaining."}	172.21.0.1	2026-04-17 12:08:29.485
3d6f2f9e-20e3-498f-a247-50a9205cec80	\N	OTP_VERIFY_FAILED	\N	\N	{"email": "aastha.pradhan@apeiro.digital", "reason": "Invalid OTP. 1 attempt(s) remaining."}	172.21.0.1	2026-04-17 12:08:41.534
61c9601f-49df-44a3-9b6f-a18a49bed103	\N	OTP_VERIFIED	\N	\N	{"email": "aastha.pradhan@apeiro.digital"}	172.21.0.1	2026-04-17 12:08:55.866
35afa8e5-1b54-4d24-9e0a-42d35ea313db	\N	OTP_REQUESTED	\N	\N	{"email": "pradhanaastha24@gmail.com"}	172.21.0.1	2026-04-17 12:14:19.075
777bc678-c22d-4002-aeba-899bedf92b6a	\N	OTP_VERIFY_FAILED	\N	\N	{"email": "pradhanaastha24@gmail.com", "reason": "Invalid OTP. 2 attempt(s) remaining."}	172.21.0.1	2026-04-17 12:14:56.605
11fdd8f5-1924-42ed-90ac-c40c958129df	\N	OTP_VERIFY_FAILED	\N	\N	{"email": "pradhanaastha24@gmail.com", "reason": "Invalid OTP. 1 attempt(s) remaining."}	172.21.0.1	2026-04-17 12:15:09.252
5c2aa237-67e3-48db-9f98-16b31f605e37	\N	OTP_VERIFIED	\N	\N	{"email": "pradhanaastha24@gmail.com"}	172.21.0.1	2026-04-17 12:15:27.893
aa47687b-08bc-4fee-a865-e6a9a1cafe34	\N	OTP_REQUESTED	\N	\N	{"email": "support@iamsaif.ai"}	172.21.0.1	2026-04-17 12:15:57.216
d39a0b14-f039-47b2-8042-e917b859edd2	\N	OTP_REQUESTED	\N	\N	{"email": "deepanshu.gupta@netgroup.ai"}	172.21.0.1	2026-04-20 12:15:02.93
de2bec18-ef60-4207-9c42-7ab1b7605dbd	\N	OTP_VERIFIED	\N	\N	{"email": "deepanshu.gupta@netgroup.ai"}	172.21.0.1	2026-04-20 12:16:04.832
3830b072-7ca0-4ba4-9ad2-3af83cdcbec3	ec3a00a7-d47b-4b42-a8f2-94091069258f	LOGIN	\N	\N	null	172.21.0.1	2026-04-20 12:16:04.897
5b64ac0f-1aed-4058-a745-41e647723dca	ec3a00a7-d47b-4b42-a8f2-94091069258f	UPDATE_USER	User	efde422a-a371-494b-96f5-19678cae7eb2	{"isActive": false}	172.21.0.1	2026-04-20 12:23:16.097
8538db56-9073-4564-8168-569060a3bb53	ec3a00a7-d47b-4b42-a8f2-94091069258f	UPDATE_USER	User	efde422a-a371-494b-96f5-19678cae7eb2	{"isActive": true}	172.21.0.1	2026-04-20 12:23:17.46
3aff7d84-7857-47a2-b0b3-505f46ea4f7a	\N	LOGIN	\N	\N	null	172.21.0.1	2026-04-15 06:33:58.595
b8eec014-2363-4141-bfa8-629120767270	\N	LOGIN	\N	\N	null	172.21.0.1	2026-04-15 09:42:50.789
5e77faff-4109-4581-b53f-ccdd7a581e9e	\N	LOGIN	\N	\N	null	172.21.0.1	2026-04-15 10:53:10.373
6754fa1c-bd65-4e0a-b341-f990475db548	\N	LOGIN	\N	\N	null	172.21.0.1	2026-04-15 11:00:34.404
855af58e-1187-4991-8224-77c17d08bdde	\N	LOGIN	\N	\N	null	172.21.0.1	2026-04-15 11:32:26.996
7e6125ad-2074-4ab9-ac47-0e0fb90624bc	\N	GENERATE_REPORT	Report	\N	{"format": "csv", "rowCount": 1, "reportType": "DC_LISTINGS"}	\N	2026-04-15 16:44:02.496
93c38530-92c3-4112-8f58-a37b800f511b	\N	LOGIN	\N	\N	null	172.21.0.1	2026-04-16 04:04:37.854
f8a7cc96-f7cc-402b-baa7-707fad5ed509	\N	GENERATE_REPORT	Report	\N	{"format": "csv", "rowCount": 0, "reportType": "DC_LISTINGS"}	\N	2026-04-16 04:16:47.414
fe2809f7-0bff-429a-a1b9-af0269434bea	\N	GENERATE_REPORT	Report	\N	{"format": "pdf", "rowCount": 1, "reportType": "DC_LISTINGS"}	\N	2026-04-16 04:31:15.475
5518192e-d1c0-43e0-b284-96744836e217	\N	GENERATE_REPORT	Report	\N	{"format": "pdf", "rowCount": 0, "reportType": "SUPPLIERS"}	\N	2026-04-16 04:42:09.377
6ed00240-40fc-4485-b0c5-518a9360e389	\N	GENERATE_REPORT	Report	\N	{"format": "pdf", "rowCount": 0, "reportType": "INVENTORY"}	\N	2026-04-16 04:45:27.877
c1c8c9ea-cfbb-4b2b-936e-f46dbd4f750e	\N	GENERATE_REPORT	Report	\N	{"format": "docx", "rowCount": 0, "reportType": "INVENTORY"}	\N	2026-04-16 04:45:32.014
989e0166-f0fd-4485-90af-e832f085876f	\N	LOGIN	\N	\N	null	172.21.0.1	2026-04-16 04:46:54.955
be619cd3-48ea-4e2b-bd86-4c7bcdaa63c0	\N	GENERATE_REPORT	Report	\N	{"format": "pdf", "rowCount": 0, "reportType": "INVENTORY"}	\N	2026-04-16 04:54:08.046
7f19dc20-8f59-493c-967f-aec79dba8c49	\N	GENERATE_REPORT	Report	\N	{"format": "docx", "rowCount": 0, "reportType": "INVENTORY"}	\N	2026-04-16 04:54:27.012
25b60f14-a0fb-4a31-bb34-f87c2a9313e6	\N	GENERATE_REPORT	Report	\N	{"format": "json", "rowCount": 0, "reportType": "INVENTORY"}	\N	2026-04-16 04:54:32.775
e67c988c-451d-4b5c-9a1a-91a28b526b61	\N	LOGIN	\N	\N	null	172.21.0.1	2026-04-16 12:25:50.867
9cfebfc3-f22f-408d-9ac3-88c0deac8d39	\N	GENERATE_REPORT	Report	\N	{"format": "xlsx", "rowCount": 0, "reportType": "INVENTORY"}	\N	2026-04-16 04:55:10.534
b18b6518-f7ff-40f5-bc53-72318036f642	\N	UPDATE_INVENTORY_STATUS	Listing	29ec1a09-8b47-4726-94f7-7e3b12f14d98	{"status": "RESERVED"}	172.21.0.1	2026-04-16 04:56:08.353
96b58542-da86-4dce-b739-e72838deefc3	\N	CREATE_REPORT_TEMPLATE	ReportTemplate	e859d24c-8689-4efa-b32c-7a88e2f942ad	null	\N	2026-04-16 05:12:39.528
317324d5-a4d5-4945-8c56-ee506dcb745e	\N	CREATE_REPORT_TEMPLATE	ReportTemplate	5c8ede51-98b7-48a9-8408-f9a763c1c6a9	null	\N	2026-04-16 05:13:18.979
60536904-7400-4ecd-949e-2d88e40ad3ce	\N	LOGIN	\N	\N	null	172.21.0.1	2026-04-16 05:14:17.837
1b9aae2c-acfb-4d3c-8e9b-62130b12359b	\N	LOGIN	\N	\N	null	172.21.0.1	2026-04-16 05:15:05.501
8dec0776-6662-41b8-a16f-580e01633058	\N	LOGIN	\N	\N	null	172.21.0.1	2026-04-16 05:26:49.036
6350843e-75c1-4d8e-b018-3efe1aaef9b5	\N	LOGIN	\N	\N	null	172.21.0.1	2026-04-16 06:09:25.419
19ef64d7-9444-4794-b252-f9266930b5ad	\N	GENERATE_REPORT	Report	\N	{"format": "pdf", "rowCount": 0, "reportType": "GPU_CLUSTERS"}	\N	2026-04-16 06:35:02.898
1c38a0a0-de9f-491f-b2e8-289b3f8c4af7	\N	LOGIN	\N	\N	null	172.21.0.1	2026-04-16 07:01:40.694
92f0b2d6-84e5-413f-9e40-4e064d0a81c3	\N	GENERATE_REPORT	Report	\N	{"format": "pdf", "rowCount": 0, "reportType": "GPU_CLUSTERS"}	\N	2026-04-16 07:13:08.616
3481bf31-15cc-4584-bb9c-d1ae79e3e4a9	\N	LOGIN	\N	\N	null	172.21.0.1	2026-04-16 07:18:11.383
facce28e-3491-4965-a9a4-78b13de8ffe3	\N	GENERATE_REPORT	Report	\N	{"format": "pdf", "rowCount": 0, "reportType": "SUPPLIERS"}	\N	2026-04-16 07:23:55.872
574d9562-3d06-41cb-b782-f56131045d93	\N	GENERATE_REPORT	Report	\N	{"format": "pdf", "rowCount": 0, "reportType": "SUPPLIERS"}	\N	2026-04-16 07:38:31.984
8c1d7cb3-09db-49fe-a578-b4a389fcf42f	\N	LOGIN	\N	\N	null	172.21.0.1	2026-04-16 12:38:20.444
d8efb372-b994-44ee-82f7-ac11e7f0da3a	\N	LOGIN	\N	\N	null	172.21.0.1	2026-04-17 04:27:55.757
e8a404b7-df4e-4a93-9bd8-71f03b5fa761	\N	LOGIN	\N	\N	null	172.21.0.1	2026-04-17 05:55:45.834
e51d7e25-f4a5-4f03-9ce9-ebbc27d038d2	\N	LOGIN	\N	\N	null	172.21.0.1	2026-04-17 08:55:06.947
9ee66300-342a-4cec-84f6-ae151006b831	\N	LOGIN	\N	\N	null	172.21.0.1	2026-04-17 09:07:13.115
5df781e1-cd01-4a62-8c25-5cd57e671627	\N	LOGIN	\N	\N	null	172.21.0.1	2026-04-17 11:54:57.517
d211a9d8-f693-4c25-879f-c3124e90879d	\N	LOGIN	\N	\N	null	172.21.0.1	2026-04-17 12:08:55.94
0196e6be-0fda-476b-bd51-48cde5b769a1	ec3a00a7-d47b-4b42-a8f2-94091069258f	DELETE_USER	\N	\N	{"userId": "0bd1d22a-e4e3-4dcc-ad62-d49a7c51617e"}	172.21.0.1	2026-04-20 12:30:54.149
2995cb50-33c9-4084-addf-eb6d5c12c594	ec3a00a7-d47b-4b42-a8f2-94091069258f	CREATE_USER	User	2766e2c0-098c-4813-ab2a-a2aad2bf4647	{"role": "admin", "email": "aastha.pradhan@apeiro.digital"}	172.21.0.1	2026-04-20 12:31:18.917
c8fdf827-50a0-4818-9384-ce3f26cf5e3f	\N	OTP_REQUESTED	\N	\N	{"email": "aastha.pradhan@apeiro.digital"}	172.21.0.1	2026-04-20 12:31:40.706
a6a70812-4d9b-46dc-8ffa-bc143f481fc1	\N	OTP_VERIFIED	\N	\N	{"email": "aastha.pradhan@apeiro.digital"}	172.21.0.1	2026-04-20 12:32:07.7
4e492317-d180-4e1d-8574-8e75537e9c57	\N	OTP_VERIFY_FAILED	\N	\N	{"email": "aastha.pradhan@apeiro.digital", "reason": "OTP expired or not found. Please request a new one."}	172.21.0.1	2026-04-20 12:32:22.623
aa1e4ced-1e7a-4842-a368-bc36df3cb2f1	\N	OTP_VERIFY_FAILED	\N	\N	{"email": "aastha.pradhan@apeiro.digital", "reason": "OTP expired or not found. Please request a new one."}	172.21.0.1	2026-04-20 12:32:22.873
7c896613-a7a2-4a4f-b0a6-84db5fd5bf0c	\N	OTP_VERIFY_FAILED	\N	\N	{"email": "aastha.pradhan@apeiro.digital", "reason": "OTP expired or not found. Please request a new one."}	172.21.0.1	2026-04-20 12:32:23.06
de83d91b-d50a-4596-a54b-b92ffaeb3701	\N	OTP_VERIFY_FAILED	\N	\N	{"email": "aastha.pradhan@apeiro.digital", "reason": "OTP expired or not found. Please request a new one."}	172.21.0.1	2026-04-20 12:32:23.924
9cfb796e-4878-4a8d-9b17-4354c433a6ba	\N	OTP_REQUESTED	\N	\N	{"email": "aastha.pradhan@apeiro.digital"}	172.21.0.1	2026-04-20 12:33:39.661
187d470e-a2c1-4b7b-822f-a63408c91b8f	\N	OTP_VERIFIED	\N	\N	{"email": "aastha.pradhan@apeiro.digital"}	172.21.0.1	2026-04-20 12:33:55.046
e3d23de2-f156-4f88-8318-aa2123825840	\N	OTP_REQUESTED	\N	\N	{"email": "aastha.pradhan@apeiro.digital"}	172.21.0.1	2026-04-20 14:04:05.117
27eaa353-c8bd-416f-a816-44f5b1305a64	\N	OTP_VERIFIED	\N	\N	{"email": "aastha.pradhan@apeiro.digital"}	172.21.0.1	2026-04-20 14:04:23.66
eccad1d8-7bd4-4eca-ba76-e9f48ae0cfb9	2766e2c0-098c-4813-ab2a-a2aad2bf4647	LOGIN	\N	\N	null	172.21.0.1	2026-04-20 14:04:23.784
233930d8-4abf-4774-9b87-4f11eaca3b49	\N	OTP_REQUESTED	\N	\N	{"email": "deepanshu.gupta@netgroup.ai"}	172.21.0.1	2026-04-20 14:06:44.787
b13db826-82e7-49d3-8da9-e27335d995aa	\N	OTP_REQUESTED	\N	\N	{"email": "support@iamsaif.ai"}	172.21.0.1	2026-04-20 14:09:21.575
e2e416f4-64dd-4021-a4ae-92f61b2a5416	\N	OTP_VERIFY_FAILED	\N	\N	{"email": "deepanshu.gupta@netgroup.ai", "reason": "Invalid OTP. 2 attempt(s) remaining."}	172.21.0.1	2026-04-20 14:10:15.01
514becb8-2a21-46a8-8cf4-118d2716f5b3	\N	OTP_RESENT	\N	\N	{"email": "deepanshu.gupta@netgroup.ai"}	172.21.0.1	2026-04-20 14:10:21.479
7139ebcf-f370-4575-b493-190bdd64842a	\N	OTP_VERIFY_FAILED	\N	\N	{"email": "support@iamsaif.ai", "reason": "Invalid OTP. 2 attempt(s) remaining."}	172.21.0.1	2026-04-20 14:11:40.458
bf12f6ff-9ebb-4a48-b290-6d3235b23d79	\N	OTP_VERIFIED	\N	\N	{"email": "deepanshu.gupta@netgroup.ai"}	172.21.0.1	2026-04-20 14:11:52.131
2188b593-ce87-4d9b-ba6e-b6f60c622f60	ec3a00a7-d47b-4b42-a8f2-94091069258f	LOGIN	\N	\N	null	172.21.0.1	2026-04-20 14:11:52.176
e675447d-f9f1-40b4-8688-ebc40755f666	\N	OTP_RESENT	\N	\N	{"email": "support@iamsaif.ai"}	172.21.0.1	2026-04-20 14:12:33.054
437dd4a4-a946-4ceb-9375-11e0be0667ec	ec3a00a7-d47b-4b42-a8f2-94091069258f	CREATE_USER	User	1b2a70ea-f189-41b6-a878-866b7e1699cf	{"role": "superadmin", "email": "pradhanaastha24@gmail.com"}	172.21.0.1	2026-04-20 14:13:09.526
79854e7a-ed7b-458b-937d-7d2d0c1ea9a8	\N	OTP_VERIFIED	\N	\N	{"email": "support@iamsaif.ai"}	172.21.0.1	2026-04-20 14:13:25.266
835a4f5c-39b7-4471-aae6-fe98a71c9279	efde422a-a371-494b-96f5-19678cae7eb2	LOGIN	\N	\N	null	172.21.0.1	2026-04-20 14:13:25.283
aa4c7552-6bd3-4cff-b8cb-205bf3fc80a0	\N	OTP_REQUESTED	\N	\N	{"email": "aastha.pradhan@apeiro.digital"}	172.21.0.1	2026-04-20 14:19:26.809
b5e9645b-e528-4572-9511-954c7527edc1	\N	OTP_VERIFIED	\N	\N	{"email": "aastha.pradhan@apeiro.digital"}	172.21.0.1	2026-04-20 14:19:46.091
00b03af2-afca-4bb2-9faa-ea294a932ce5	2766e2c0-098c-4813-ab2a-a2aad2bf4647	LOGIN	\N	\N	null	172.21.0.1	2026-04-20 14:19:46.107
33f2a067-c237-4c40-8d71-11ee09877c51	\N	OTP_REQUESTED	\N	\N	{"email": "deepanshu.gupta@netgroup.ai"}	172.21.0.1	2026-04-20 14:45:26.924
ab62f487-46d3-4036-b418-a655c648c5a2	\N	OTP_REQUESTED	\N	\N	{"email": "pradhanaastha24@gmail.com"}	172.21.0.1	2026-04-20 14:47:19.854
21205d47-c0d8-4875-8310-13445ed8e582	\N	OTP_VERIFIED	\N	\N	{"email": "pradhanaastha24@gmail.com"}	172.21.0.1	2026-04-20 14:47:42.62
d2166eb0-4d80-4b89-a746-8ecd238a8b66	1b2a70ea-f189-41b6-a878-866b7e1699cf	LOGIN	\N	\N	null	172.21.0.1	2026-04-20 14:47:42.662
7d55e963-4a4a-4987-b7d3-5428edd4db3a	\N	OTP_REQUESTED	\N	\N	{"email": "aastha.pradhan@apeiro.digital"}	172.21.0.1	2026-04-20 15:07:57.895
498fecc6-f93b-4dcb-b5d8-9f7c928863d9	\N	OTP_VERIFIED	\N	\N	{"email": "aastha.pradhan@apeiro.digital"}	172.21.0.1	2026-04-20 15:08:22.439
ae1540eb-80bd-4cae-9692-5a19f3342ddc	2766e2c0-098c-4813-ab2a-a2aad2bf4647	LOGIN	\N	\N	null	172.21.0.1	2026-04-20 15:08:22.459
aa3a1533-a893-4cc5-896e-ff6f2aa56d60	\N	OTP_REQUESTED	\N	\N	{"email": "aastha.pradhan@apeiro.digital"}	172.21.0.1	2026-04-21 03:55:19.921
abdecd23-9858-4a35-831f-f63f04ebd75c	\N	OTP_VERIFIED	\N	\N	{"email": "aastha.pradhan@apeiro.digital"}	172.21.0.1	2026-04-21 03:55:55.419
49fe21ae-81cb-4f41-ada8-4554c1730499	2766e2c0-098c-4813-ab2a-a2aad2bf4647	LOGIN	\N	\N	null	172.21.0.1	2026-04-21 03:55:55.478
0d1e4f88-0f60-4712-805b-cc20b97d08f2	\N	OTP_REQUESTED	\N	\N	{"email": "aastharani07@gmail.com"}	172.21.0.1	2026-04-21 03:58:24.013
ddb3b588-1ba6-4661-98c1-da94321899be	\N	OTP_VERIFIED	\N	\N	{"email": "aastharani07@gmail.com"}	172.21.0.1	2026-04-21 03:59:05.283
1a46cd50-59cd-4a96-b7d0-ed87a9b3b9f9	ac8f3716-a370-43e0-9ab0-096dc36a0b55	LOGIN	\N	\N	null	172.21.0.1	2026-04-21 03:59:05.301
fd5af359-42c1-4ab9-b08d-2d55dc26b925	\N	OTP_REQUESTED	\N	\N	{"email": "pradhanaastha24@gmail.com"}	172.21.0.1	2026-04-21 03:59:40.092
9c229469-14ef-4706-bb07-ed9d69305dc8	\N	OTP_VERIFIED	\N	\N	{"email": "pradhanaastha24@gmail.com"}	172.21.0.1	2026-04-21 04:00:12.154
49e78169-da2b-49bd-9648-dcd31f8e3b1d	1b2a70ea-f189-41b6-a878-866b7e1699cf	LOGIN	\N	\N	null	172.21.0.1	2026-04-21 04:00:12.166
ca6fae0c-f857-4bbd-9ada-082184a8c948	1b2a70ea-f189-41b6-a878-866b7e1699cf	ADMIN_CREATE_USER	User	ea3899bd-82bf-44c5-9fd6-81e3724bfbd8	{"role": "broker", "email": "shaswati.sahoo@apeiro.digital"}	172.21.0.1	2026-04-21 04:07:22.513
30d37091-739a-4806-a960-e22fb2e0f90d	\N	OTP_REQUESTED	\N	\N	{"email": "pradhanaastha24@gmail.com"}	172.21.0.1	2026-04-21 04:27:29.667
48f39af4-1702-4bef-b16b-6c00c5e6e496	\N	OTP_VERIFIED	\N	\N	{"email": "pradhanaastha24@gmail.com"}	172.21.0.1	2026-04-21 04:27:54.95
883110f2-1141-48f8-b835-1df9ea1c3ca7	1b2a70ea-f189-41b6-a878-866b7e1699cf	LOGIN	\N	\N	null	172.21.0.1	2026-04-21 04:27:54.988
\.


--
-- Data for Name: BrokerDcCompany; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public."BrokerDcCompany" (id, legal_entity, office_address, country_of_incorp, contact_name, contact_email, contact_mobile, created_at, updated_at, organization_id) FROM stdin;
\.


--
-- Data for Name: DcDocument; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public."DcDocument" (id, site_id, document_type, file_name, file_url, file_size, mime_type, uploaded_by, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: DcPhasingSchedule; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public."DcPhasingSchedule" (id, site_id, month, it_load_mw, cumulative_it_load_mw, scope_of_works, estimated_capex_musd, phase, min_lease_duration_yrs, nrc_request_musd, initial_deposit_musd, mrc_request_per_kw, mrc_inclusions, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: DcSite; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public."DcSite" (id, listing_id, site_name, specifications, created_at, updated_at) FROM stdin;
8fef145a-f257-4e03-9b77-a4936b4b4918	efb1009a-e9c6-460a-98e3-7efdedc423ca	Desert Cloud DC-1 Main Site	{"totalWhiteSpaceSqm": 5000, "rackPowerCapacityKw": 15}	2026-04-14 11:44:45.122	2026-04-14 11:44:45.122
\.


--
-- Data for Name: Inquiry; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public."Inquiry" (id, user_id, type, status, specifications, created_at, updated_at, organization_id) FROM stdin;
79e99e7e-a502-4641-9c2f-de375b147f82	efde422a-a371-494b-96f5-19678cae7eb2	GPU_DEMAND	SUBMITTED	{"latencyMs": "78", "customerName": "aaa", "dcTierMinimum": "", "decisionMaker": "t", "otherComments": "t8", "technologyType": "yytt", "timelineGoLive": "78y78", "clusterSizeGpus": "78y", "customerCountry": "777", "connectivityMbps": "78", "procurementStage": "6t", "targetPriceGpuHr": "t76t", "exportConstraints": "y78", "contractLengthYears": "7877", "idealClusterLocation": "y87"}	2026-04-15 10:06:16.782	2026-04-15 10:06:16.82	32d6fcbf-459c-4e5b-9c50-b277ece93251
0e51cdf1-4743-48ab-9b46-fe538a2ed7dd	efde422a-a371-494b-96f5-19678cae7eb2	GPU_DEMAND	SUBMITTED	{"latencyMs": "576", "customerName": "665", "dcTierMinimum": "Tier I", "decisionMaker": "5r", "otherComments": "uy", "technologyType": "6756", "timelineGoLive": "7", "clusterSizeGpus": "7", "customerCountry": "65", "connectivityMbps": "676", "procurementStage": "5r57r", "targetPriceGpuHr": "t7", "exportConstraints": "r7", "contractLengthYears": "t76", "idealClusterLocation": "665"}	2026-04-15 10:09:34.312	2026-04-15 10:09:34.352	32d6fcbf-459c-4e5b-9c50-b277ece93251
f1a4b956-9015-492c-8180-51fbb5babc93	efde422a-a371-494b-96f5-19678cae7eb2	GPU_DEMAND	SUBMITTED	{"latencyMs": "576", "customerName": "Aastha", "dcTierMinimum": "Tier I", "decisionMaker": "5r", "otherComments": "uy", "technologyType": "6756", "timelineGoLive": "7", "clusterSizeGpus": "7", "customerCountry": "India", "connectivityMbps": "676", "procurementStage": "5r57r", "targetPriceGpuHr": "t7", "exportConstraints": "r7", "contractLengthYears": "t76", "idealClusterLocation": "665"}	2026-04-15 10:10:00.388	2026-04-15 10:10:00.424	32d6fcbf-459c-4e5b-9c50-b277ece93251
88ab2481-b070-472c-83f5-507f1253a11a	efde422a-a371-494b-96f5-19678cae7eb2	GPU_DEMAND	SUBMITTED	{"latencyMs": "6", "customerName": "Aastha", "dcTierMinimum": "Tier II", "decisionMaker": "78gy", "otherComments": "8g6", "technologyType": "7786", "timelineGoLive": "y", "clusterSizeGpus": "68g", "customerCountry": "India", "connectivityMbps": "890", "procurementStage": "g67", "targetPriceGpuHr": "6", "exportConstraints": "g87", "contractLengthYears": "67", "idealClusterLocation": "78y7"}	2026-04-15 10:21:40.918	2026-04-15 10:21:40.963	32d6fcbf-459c-4e5b-9c50-b277ece93251
8acf264c-76bc-4a0e-930f-115b31245499	efde422a-a371-494b-96f5-19678cae7eb2	DC_REQUEST	SUBMITTED	{"country": "India", "budgetRange": "908", "companyName": "Infinia Data Solutions Pvt Ltd", "businessModel": "Powered Shell", "otherComments": "8u8o", "complianceReqs": "", "contractLength": "989", "timelineGoLive": "897", "requiredPowerMw": "767", "sovereigntyReqs": "", "connectivityReqs": "", "dcTierRequirement": "Tier II", "preferredLocation": "", "coolingRequirements": ""}	2026-04-15 10:30:31.311	2026-04-15 10:30:31.354	32d6fcbf-459c-4e5b-9c50-b277ece93251
\.


--
-- Data for Name: Listing; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public."Listing" (id, supplier_id, type, data_center_name, country, state, city, total_units, booked_units, available_units, total_mw, available_mw, price, currency, status, specifications, metadata, contract_duration, archived_at, archive_reason, created_at, updated_at, organization_id) FROM stdin;
efb1009a-e9c6-460a-98e3-7efdedc423ca	ac8f3716-a370-43e0-9ab0-096dc36a0b55	DC_SITE	Desert Cloud DC-1	UAE	Dubai	Al Quoz	100	0	0	20	15	150	USD	APPROVED	{"iso27001": true, "dcTiering": "Tier III", "designPue": 1.4, "powerSource": "Grid", "projectType": "Greenfield", "businessModel": "Colocation (Wholesale/Retail)", "carrierNeutral": true, "powerRedundancy": "2N", "dcTieringCertified": true, "currentProjectStatus": "Live", "sovereigntyRestrictions": "None"}	{}	\N	\N	\N	2026-04-14 11:44:45.111	2026-04-14 11:44:45.111	88a47393-76f8-4f50-8e81-320b7ff97f8e
5f65e16b-1cb3-4538-b12f-b47a7b3b9b14	ac8f3716-a370-43e0-9ab0-096dc36a0b55	GPU_CLUSTER	Desert Cloud GPU Hub	UAE	Dubai	Internet City	256	0	128	\N	\N	2.5	USD	APPROVED	{"cpu": "AMD EPYC 9004", "gpu": "NVIDIA H100 80GB SXM5", "ram": "2TB DDR5 per node", "nics": "8x ConnectX-7 400GbE", "gpuTechnology": "NVIDIA H100 SXM5", "totalGpuCount": 256, "gpuServerModel": "NVIDIA DGX H100", "singleClusterSize": 64, "clusterDescription": "Enterprise-grade H100 GPU cluster path in Dubai.", "computeNetTechnology": "InfiniBand NDR 400Gbps"}	{}	\N	\N	\N	2026-04-14 11:44:45.133	2026-04-14 11:44:45.133	88a47393-76f8-4f50-8e81-320b7ff97f8e
b0b47060-1b96-45cd-8a53-24e06e50b4c1	ac8f3716-a370-43e0-9ab0-096dc36a0b55	GPU_CLUSTER	EuroCloud HPC Center	Germany	Hesse	Frankfurt	512	0	256	\N	\N	3.2	USD	APPROVED	{"cpu": "AMD EPYC 9004", "gpu": "NVIDIA B300 80GB HBM3e", "coolingDesign": "Direct Liquid Cooling (DLC)", "gpuTechnology": "NVIDIA B300", "totalGpuCount": 512, "gpuServerModel": "NVIDIA DGX B200", "singleClusterSize": 128, "clusterDescription": "Next-generation B300 cluster optimized for LLM training."}	{}	\N	\N	\N	2026-04-14 11:44:45.153	2026-04-14 11:44:45.153	88a47393-76f8-4f50-8e81-320b7ff97f8e
29ec1a09-8b47-4726-94f7-7e3b12f14d98	ac8f3716-a370-43e0-9ab0-096dc36a0b55	GPU_CLUSTER	Aastha	BBSR	\N	\N	9	0	9	\N	\N	1000	EUR	RESERVED	{"notes": "", "description": ""}	{}	DAY	\N	\N	2026-04-15 07:48:11.572	2026-04-16 04:56:08.325	\N
944d0957-8515-405c-b31d-dc1d61916ba3	ac8f3716-a370-43e0-9ab0-096dc36a0b55	GPU_CLUSTER	Aastha	India	\N	BBSR	0	0	0	\N	\N	\N	USD	SUBMITTED	{"cpu": "565", "gpu": "875", "ram": "578", "nics": "7857", "notes": "678", "country": "India", "failover": "o", "location": "BBSR", "dcLandlord": "6567575", "redundancy": "ioi", "clusterName": "Aastha", "localStorage": "675", "computeNetQos": "789", "coolingDesign": "789", "gpuTechnology": "465", "mgmtNetLayers": "797", "restrictedUse": "8789", "totalGpuCount": "88686", "googleMapsLink": "https://share.google/uJOA2AFcdDivPtkqg", "gpuServerModel": "3423", "storageOptions": "7897", "mgmtNetTopology": "766", "availabilityDate": "7776-06-06", "backupGenerators": "9789", "computeNetLayers": "79878", "modularDataHalls": "897897", "oobNetTechnology": "8789789", "rackModuleLayout": "789", "upsConfiguration": "878", "clusterIdentifier": "uyuiyuy", "coolingCapacityKw": "789", "dualFeedRedundant": "87", "mgmtNetTechnology": "78678", "powerSupplyStatus": "8789789", "singleClusterSize": "65467", "clusterDescription": "Okay", "computeNetTopology": "8778", "mgmtNetScalability": "9789", "connectivityDetails": "89787", "mgmtNetSwitchVendor": "987", "rackPowerCapacityKw": "8", "computeNetTechnology": "76", "numberOfCoolingUnits": "78", "totalPowerCapacityMw": "87", "computeNetScalability": "789", "powerCapacityPerFloor": "878", "computeNetSwitchVendor": "7878979", "mgmtNetOversubscription": "8978", "futureExpansionCapability": "787", "computeNetOversubscription": "9798", "modularDataHallLayoutPerFloor": "789"}	{}	\N	\N	\N	2026-04-16 12:23:39.105	2026-04-16 12:24:55.012	\N
\.


--
-- Data for Name: ListingDocument; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public."ListingDocument" (id, listing_id, document_type, file_name, file_url, file_size, mime_type, uploaded_by, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: ListingMember; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public."ListingMember" (id, listing_id, user_id, role, added_by, created_at) FROM stdin;
\.


--
-- Data for Name: Notification; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public."Notification" (id, user_id, type, title, message, link, metadata, is_read, sent_via, created_at, updated_at) FROM stdin;
72274653-7cc4-4356-bf45-5099216b5b61	ec3a00a7-d47b-4b42-a8f2-94091069258f	NEW_QUEUE_ITEM	New item in review queue	A new DC LISTING submission is awaiting review.	/admin/queue/4fc5cda8-8212-4606-b28d-f0c3972305fe	\N	f	{in-app}	2026-04-14 12:54:50.943	2026-04-14 12:54:50.943
\.


--
-- Data for Name: Organization; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public."Organization" (id, type, status, vendor_type, mandate_status, nda_required, nda_signed, contact_email, contact_number, company_name, company_type, jurisdiction, industry_sector, tax_vat_number, company_address, website, auth_signatory_name, auth_signatory_title, billing_contact_name, billing_contact_email, primary_use_cases, location_preferences, sovereignty_reqs, compliance_reqs, budget_range, urgency, flagged_fields, field_comments, reviewed_by, approved_at, created_at, updated_at) FROM stdin;
88a47393-76f8-4f50-8e81-320b7ff97f8e	SUPPLIER	APPROVED	Operator	Direct	f	f	aastharani07@gmail.com	+971501234567	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{}	\N	\N	2026-04-14 11:44:45.039	2026-04-14 11:44:45.039
f6935f13-0be8-4100-8be9-2042a6ed3407	BROKER	APPROVED	Broker	Non-exclusive	t	t	broker@test.com	+971502345678	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{}	\N	\N	2026-04-14 11:44:45.049	2026-04-14 11:44:45.049
e3f707ef-8c63-4fd5-a125-075386254f49	CUSTOMER	APPROVED	\N	\N	f	f	Support@iamsaif.ai	\N	Acme Data Corp	Enterprise	UAE	Technology	UAE123456789	Dubai, UAE	\N	John Smith	CEO	Jane Smith	billing@acme.com	{"AI/ML Training",HPC}	\N	\N	\N	\N	\N	\N	{}	\N	\N	2026-04-14 11:44:45.053	2026-04-14 11:44:45.053
f447b79f-36ba-4df5-8d54-ed2cd45c1f43	SUPPLIER	SUBMITTED	Developer	Exclusive	f	f	pending@test.com	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{}	\N	\N	2026-04-14 11:44:45.061	2026-04-14 11:44:45.061
32d6fcbf-459c-4e5b-9c50-b277ece93251	CUSTOMER	APPROVED	\N	\N	f	f	support@iamsaif.ai	\N	Apeiro	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{}	\N	\N	2026-04-15 09:40:58.133	2026-04-15 09:56:44.771
\.


--
-- Data for Name: Otp; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public."Otp" (id, email, code, purpose, attempts, verified, expires_at, created_at, updated_at) FROM stdin;
cc23f6ed-13bb-43cd-87fe-248c249ddf82	aastha.pradhan@apeiro.digital	$2b$10$70cikiT2qNjfPOz.syc1V.78LqItpR4C0j3Koa8Ec9P/S.dJ8JjA.	login	0	t	2026-04-21 04:00:16.93	2026-04-21 03:55:16.932	2026-04-21 03:55:55.403
4ecf4e29-ae62-40f0-88e8-473755946499	aastharani07@gmail.com	$2b$10$R0QHBnohO2/07flCRR.v8O5stCLwwdHZHjO3sf.wYblWxs0caB/xS	login	0	t	2026-04-21 04:03:22.266	2026-04-21 03:58:22.268	2026-04-21 03:59:05.275
1bc7d844-5e2a-4c64-b96e-c80e04c9be4d	pradhanaastha24@gmail.com	$2b$10$4.uzCycx4BZ85MjU0eYYzuLUOnDjNZsPBagXU5/Wamp5LL2CjCa5W	login	0	t	2026-04-21 04:32:27.385	2026-04-21 04:27:27.388	2026-04-21 04:27:54.939
1415ad59-4dae-48b7-99c9-3f7ddd3284f7	aastha.pradhan@apeiro.digitl	$2b$10$gPs/9QmRRv2Dc3NMcb8jIuvIxIeliwmALYqzS3yraaDOSKxlw.4Ie	login	0	f	2026-04-15 06:16:32.903	2026-04-15 06:11:32.905	2026-04-15 06:11:32.905
b45dba57-ca6b-483b-a6da-9e03877b4d09	support@iamsaif.ai	$2b$10$pMr2SMX9Gr8JIS6qjAJKqeWE6Xv7tpb6MRNC.XE/.nndVXHTa7CMe	login	0	t	2026-04-20 14:17:31.806	2026-04-20 14:12:31.808	2026-04-20 14:13:25.252
a74dd987-6025-457c-b60e-48c40771c532	deepanshu.gupta@netgroup.ai	$2b$10$JaXdTcvaLqsgeoIEBF0ckeFcI///8cWjEIcCbo2jfdCUhkgkVUzAm	login	0	f	2026-04-20 14:50:25.163	2026-04-20 14:45:25.165	2026-04-20 14:45:25.165
\.


--
-- Data for Name: QueueItem; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public."QueueItem" (id, type, reference_id, reference_model, status, priority, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: ReportTemplate; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public."ReportTemplate" (id, user_id, name, selected_fields, filters, created_at, updated_at, description, export_format, group_by, is_favorite, report_type, sort_by, sort_direction, usage_count) FROM stdin;
\.


--
-- Data for Name: Reservation; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public."Reservation" (id, listing_id, customer_id, reserved_units, start_date, end_date, status, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: TeamInvite; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public."TeamInvite" (id, organization_id, inviter_id, email, role, status, accepted_at, created_at, updated_at, token, expires_at) FROM stdin;
\.


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public."User" (id, name, email, role, kyc_status, "isActive", created_at, updated_at, organization_id, last_login_at) FROM stdin;
5859e9a1-1d73-4c97-9a43-60e1caf7aadb	Main Customer	Support@iamsaif.ai	customer	\N	t	2026-04-14 11:44:45.085	2026-04-14 11:44:45.085	e3f707ef-8c63-4fd5-a125-075386254f49	\N
ec3a00a7-d47b-4b42-a8f2-94091069258f	\N	deepanshu.gupta@netgroup.ai	superadmin	\N	t	2026-04-14 11:44:45.067	2026-04-20 14:11:52.162	\N	2026-04-20 14:11:52.162
efde422a-a371-494b-96f5-19678cae7eb2	\N	support@iamsaif.ai	customer	submitted	t	2026-04-15 09:40:58.14	2026-04-20 14:13:25.273	32d6fcbf-459c-4e5b-9c50-b277ece93251	2026-04-20 14:13:25.273
2766e2c0-098c-4813-ab2a-a2aad2bf4647	\N	aastha.pradhan@apeiro.digital	admin	\N	t	2026-04-20 12:31:18.906	2026-04-21 03:55:55.461	\N	2026-04-21 03:55:55.461
ac8f3716-a370-43e0-9ab0-096dc36a0b55	Main Supplier	aastharani07@gmail.com	supplier	\N	t	2026-04-14 11:44:45.076	2026-04-21 03:59:05.29	88a47393-76f8-4f50-8e81-320b7ff97f8e	2026-04-21 03:59:05.29
ea3899bd-82bf-44c5-9fd6-81e3724bfbd8	Shaswati Sahoo	shaswati.sahoo@apeiro.digital	broker	\N	t	2026-04-21 04:07:22.494	2026-04-21 04:07:22.494	\N	\N
1b2a70ea-f189-41b6-a878-866b7e1699cf	\N	pradhanaastha24@gmail.com	superadmin	\N	t	2026-04-20 14:13:09.51	2026-04-21 04:27:54.972	\N	2026-04-21 04:27:54.972
\.


--
-- Data for Name: _AssignedAdmins; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public."_AssignedAdmins" ("A", "B") FROM stdin;
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
630e22f5-9479-4c47-a246-3354b64fbda7	f01ec6cb1545436b7972d9b956611011434ecaf1c015a53b601f7509fec6e297	2026-04-16 10:23:02.521293+00	20260413100908_init		\N	2026-04-16 10:23:02.521293+00	0
a3b8ebfa-002e-46c4-8129-8710d978c9c6	a1e6a1dd5fed6e8f9afd0a3257296850d61610dcc5c15dcd1ec90e05af3cce93	2026-04-16 10:23:05.331942+00	20260413103847_add_all_roles		\N	2026-04-16 10:23:05.331942+00	0
c8161ebb-0e04-4ac7-95ca-cd903222b387	ae741dbb24839b0e05f9b37659033d955f7a1fff4fe4d49327e7cd015f099de2	2026-04-16 10:23:08.071797+00	20260413104649_enhance_core_models		\N	2026-04-16 10:23:08.071797+00	0
aa4f9669-3eb2-45ca-aec3-9cfb9d2eb2a1	695b5ccd35a782290b0c4299d8b490a85149b32b097eb3edb6137417d1567e2a	2026-04-16 10:23:10.505798+00	20260414120000_update_org_status_enum		\N	2026-04-16 10:23:10.505798+00	0
25978858-e922-46d2-bbb4-3ad85e34d8f6	7d03d2eb2b1fcd4534089103ad02dc93daf8f0b40d5159ed50ed37479a4649db	2026-04-16 10:23:13.073411+00	20260414130000_add_organization_to_inquiry		\N	2026-04-16 10:23:13.073411+00	0
c9758b16-6bcb-41ca-9a36-111061e9a8df	9510bf67b6d6b4335cf98390e0e0740a971c40dcf3fd31e65c73fc87230fe585	2026-04-16 10:23:16.073913+00	20260415140000_remove_queueitem_listing_fk		\N	2026-04-16 10:23:16.073913+00	0
a4047be7-14e2-4e31-b5cb-4fb4c9423626	d7d6a764a0f4ab39488625b1cff9b90d9904a7441ac82a2a43b050c7a1e4a9ab	2026-04-16 10:23:19.124531+00	20260415160000_add_invite_token		\N	2026-04-16 10:23:19.124531+00	0
754c7684-88d1-4c40-8ff6-56ea0ea04932	3524564eb2262b1816704f120e2c6e3159d50fa0f538713ffafadf9dff7417c5	2026-04-20 12:36:26.993175+00	20260420100000_add_last_login_at	\N	\N	2026-04-20 12:36:26.966228+00	1
82779106-11c0-4f16-87f0-c454a50feff7	b729ab52b2aa61563fb84f4c4f6513c06aeda0e6901f6f02abf20b57da8fcc6a	\N	20260420200000_add_listing_members	A migration failed to apply. New migrations cannot be applied before the error is recovered from. Read more about how to resolve migration issues in a production database: https://pris.ly/d/migrate-resolve\n\nMigration name: 20260420200000_add_listing_members\n\nDatabase error code: 42P07\n\nDatabase error:\nERROR: relation "ListingMember" already exists\n\nDbError { severity: "ERROR", parsed_severity: Some(Error), code: SqlState(E42P07), message: "relation \\"ListingMember\\" already exists", detail: None, hint: None, position: None, where_: None, schema: None, table: None, column: None, datatype: None, constraint: None, file: Some("heap.c"), line: Some(1150), routine: Some("heap_create_with_catalog") }\n\n   0: sql_schema_connector::apply_migration::apply_script\n           with migration_name="20260420200000_add_listing_members"\n             at schema-engine/connectors/sql-schema-connector/src/apply_migration.rs:106\n   1: schema_core::commands::apply_migrations::Applying migration\n           with migration_name="20260420200000_add_listing_members"\n             at schema-engine/core/src/commands/apply_migrations.rs:91\n   2: schema_core::state::ApplyMigrations\n             at schema-engine/core/src/state.rs:226	2026-04-20 15:03:54.809967+00	2026-04-20 15:03:26.543897+00	0
940bd3d0-69c5-42b2-ae89-ab059c04b199	b729ab52b2aa61563fb84f4c4f6513c06aeda0e6901f6f02abf20b57da8fcc6a	2026-04-20 15:03:54.817547+00	20260420200000_add_listing_members		\N	2026-04-20 15:03:54.817547+00	0
\.


--
-- Name: Archive Archive_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."Archive"
    ADD CONSTRAINT "Archive_pkey" PRIMARY KEY (id);


--
-- Name: AuditLog AuditLog_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."AuditLog"
    ADD CONSTRAINT "AuditLog_pkey" PRIMARY KEY (id);


--
-- Name: BrokerDcCompany BrokerDcCompany_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."BrokerDcCompany"
    ADD CONSTRAINT "BrokerDcCompany_pkey" PRIMARY KEY (id);


--
-- Name: DcDocument DcDocument_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."DcDocument"
    ADD CONSTRAINT "DcDocument_pkey" PRIMARY KEY (id);


--
-- Name: DcPhasingSchedule DcPhasingSchedule_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."DcPhasingSchedule"
    ADD CONSTRAINT "DcPhasingSchedule_pkey" PRIMARY KEY (id);


--
-- Name: DcSite DcSite_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."DcSite"
    ADD CONSTRAINT "DcSite_pkey" PRIMARY KEY (id);


--
-- Name: Inquiry Inquiry_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."Inquiry"
    ADD CONSTRAINT "Inquiry_pkey" PRIMARY KEY (id);


--
-- Name: ListingDocument ListingDocument_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."ListingDocument"
    ADD CONSTRAINT "ListingDocument_pkey" PRIMARY KEY (id);


--
-- Name: ListingMember ListingMember_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."ListingMember"
    ADD CONSTRAINT "ListingMember_pkey" PRIMARY KEY (id);


--
-- Name: Listing Listing_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."Listing"
    ADD CONSTRAINT "Listing_pkey" PRIMARY KEY (id);


--
-- Name: Notification Notification_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."Notification"
    ADD CONSTRAINT "Notification_pkey" PRIMARY KEY (id);


--
-- Name: Organization Organization_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."Organization"
    ADD CONSTRAINT "Organization_pkey" PRIMARY KEY (id);


--
-- Name: Otp Otp_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."Otp"
    ADD CONSTRAINT "Otp_pkey" PRIMARY KEY (id);


--
-- Name: QueueItem QueueItem_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."QueueItem"
    ADD CONSTRAINT "QueueItem_pkey" PRIMARY KEY (id);


--
-- Name: ReportTemplate ReportTemplate_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."ReportTemplate"
    ADD CONSTRAINT "ReportTemplate_pkey" PRIMARY KEY (id);


--
-- Name: Reservation Reservation_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."Reservation"
    ADD CONSTRAINT "Reservation_pkey" PRIMARY KEY (id);


--
-- Name: TeamInvite TeamInvite_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."TeamInvite"
    ADD CONSTRAINT "TeamInvite_pkey" PRIMARY KEY (id);


--
-- Name: TeamInvite TeamInvite_token_key; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."TeamInvite"
    ADD CONSTRAINT "TeamInvite_token_key" UNIQUE (token);


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: Archive_organization_id_idx; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX "Archive_organization_id_idx" ON public."Archive" USING btree (organization_id);


--
-- Name: Archive_target_id_idx; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX "Archive_target_id_idx" ON public."Archive" USING btree (target_id);


--
-- Name: BrokerDcCompany_organization_id_idx; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX "BrokerDcCompany_organization_id_idx" ON public."BrokerDcCompany" USING btree (organization_id);


--
-- Name: DcDocument_site_id_idx; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX "DcDocument_site_id_idx" ON public."DcDocument" USING btree (site_id);


--
-- Name: DcPhasingSchedule_site_id_idx; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX "DcPhasingSchedule_site_id_idx" ON public."DcPhasingSchedule" USING btree (site_id);


--
-- Name: DcSite_listing_id_idx; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX "DcSite_listing_id_idx" ON public."DcSite" USING btree (listing_id);


--
-- Name: Inquiry_organization_id_idx; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX "Inquiry_organization_id_idx" ON public."Inquiry" USING btree (organization_id);


--
-- Name: Inquiry_user_id_idx; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX "Inquiry_user_id_idx" ON public."Inquiry" USING btree (user_id);


--
-- Name: ListingDocument_listing_id_idx; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX "ListingDocument_listing_id_idx" ON public."ListingDocument" USING btree (listing_id);


--
-- Name: ListingMember_listing_id_idx; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX "ListingMember_listing_id_idx" ON public."ListingMember" USING btree (listing_id);


--
-- Name: ListingMember_listing_id_user_id_key; Type: INDEX; Schema: public; Owner: admin
--

CREATE UNIQUE INDEX "ListingMember_listing_id_user_id_key" ON public."ListingMember" USING btree (listing_id, user_id);


--
-- Name: ListingMember_user_id_idx; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX "ListingMember_user_id_idx" ON public."ListingMember" USING btree (user_id);


--
-- Name: Listing_organization_id_idx; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX "Listing_organization_id_idx" ON public."Listing" USING btree (organization_id);


--
-- Name: Listing_status_idx; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX "Listing_status_idx" ON public."Listing" USING btree (status);


--
-- Name: Listing_supplier_id_idx; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX "Listing_supplier_id_idx" ON public."Listing" USING btree (supplier_id);


--
-- Name: Listing_type_idx; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX "Listing_type_idx" ON public."Listing" USING btree (type);


--
-- Name: Otp_email_idx; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX "Otp_email_idx" ON public."Otp" USING btree (email);


--
-- Name: QueueItem_reference_id_idx; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX "QueueItem_reference_id_idx" ON public."QueueItem" USING btree (reference_id);


--
-- Name: TeamInvite_email_idx; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX "TeamInvite_email_idx" ON public."TeamInvite" USING btree (email);


--
-- Name: TeamInvite_organization_id_idx; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX "TeamInvite_organization_id_idx" ON public."TeamInvite" USING btree (organization_id);


--
-- Name: User_email_key; Type: INDEX; Schema: public; Owner: admin
--

CREATE UNIQUE INDEX "User_email_key" ON public."User" USING btree (email);


--
-- Name: User_organization_id_idx; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX "User_organization_id_idx" ON public."User" USING btree (organization_id);


--
-- Name: _AssignedAdmins_AB_unique; Type: INDEX; Schema: public; Owner: admin
--

CREATE UNIQUE INDEX "_AssignedAdmins_AB_unique" ON public."_AssignedAdmins" USING btree ("A", "B");


--
-- Name: _AssignedAdmins_B_index; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX "_AssignedAdmins_B_index" ON public."_AssignedAdmins" USING btree ("B");


--
-- Name: Archive Archive_archived_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."Archive"
    ADD CONSTRAINT "Archive_archived_by_fkey" FOREIGN KEY (archived_by) REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Archive Archive_restored_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."Archive"
    ADD CONSTRAINT "Archive_restored_by_fkey" FOREIGN KEY (restored_by) REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: AuditLog AuditLog_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."AuditLog"
    ADD CONSTRAINT "AuditLog_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: BrokerDcCompany BrokerDcCompany_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."BrokerDcCompany"
    ADD CONSTRAINT "BrokerDcCompany_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES public."Organization"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: DcDocument DcDocument_site_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."DcDocument"
    ADD CONSTRAINT "DcDocument_site_id_fkey" FOREIGN KEY (site_id) REFERENCES public."DcSite"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: DcPhasingSchedule DcPhasingSchedule_site_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."DcPhasingSchedule"
    ADD CONSTRAINT "DcPhasingSchedule_site_id_fkey" FOREIGN KEY (site_id) REFERENCES public."DcSite"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: DcSite DcSite_listing_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."DcSite"
    ADD CONSTRAINT "DcSite_listing_id_fkey" FOREIGN KEY (listing_id) REFERENCES public."Listing"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Inquiry Inquiry_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."Inquiry"
    ADD CONSTRAINT "Inquiry_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES public."Organization"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Inquiry Inquiry_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."Inquiry"
    ADD CONSTRAINT "Inquiry_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ListingDocument ListingDocument_listing_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."ListingDocument"
    ADD CONSTRAINT "ListingDocument_listing_id_fkey" FOREIGN KEY (listing_id) REFERENCES public."Listing"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ListingMember ListingMember_listing_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."ListingMember"
    ADD CONSTRAINT "ListingMember_listing_id_fkey" FOREIGN KEY (listing_id) REFERENCES public."Listing"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ListingMember ListingMember_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."ListingMember"
    ADD CONSTRAINT "ListingMember_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Listing Listing_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."Listing"
    ADD CONSTRAINT "Listing_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES public."Organization"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Listing Listing_supplier_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."Listing"
    ADD CONSTRAINT "Listing_supplier_id_fkey" FOREIGN KEY (supplier_id) REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Notification Notification_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."Notification"
    ADD CONSTRAINT "Notification_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ReportTemplate ReportTemplate_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."ReportTemplate"
    ADD CONSTRAINT "ReportTemplate_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Reservation Reservation_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."Reservation"
    ADD CONSTRAINT "Reservation_customer_id_fkey" FOREIGN KEY (customer_id) REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Reservation Reservation_listing_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."Reservation"
    ADD CONSTRAINT "Reservation_listing_id_fkey" FOREIGN KEY (listing_id) REFERENCES public."Listing"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: TeamInvite TeamInvite_email_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."TeamInvite"
    ADD CONSTRAINT "TeamInvite_email_fkey" FOREIGN KEY (email) REFERENCES public."User"(email) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: TeamInvite TeamInvite_inviter_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."TeamInvite"
    ADD CONSTRAINT "TeamInvite_inviter_id_fkey" FOREIGN KEY (inviter_id) REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: TeamInvite TeamInvite_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."TeamInvite"
    ADD CONSTRAINT "TeamInvite_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES public."Organization"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: User User_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES public."Organization"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: _AssignedAdmins _AssignedAdmins_A_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."_AssignedAdmins"
    ADD CONSTRAINT "_AssignedAdmins_A_fkey" FOREIGN KEY ("A") REFERENCES public."QueueItem"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: _AssignedAdmins _AssignedAdmins_B_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."_AssignedAdmins"
    ADD CONSTRAINT "_AssignedAdmins_B_fkey" FOREIGN KEY ("B") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: admin
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;


--
-- PostgreSQL database dump complete
--

\unrestrict TXxkd0zfH6LEcQwX2wUfZ2c8taN8Jsw7WHS97fgeFYI936Fdb26s9hj5fEwk8UA

