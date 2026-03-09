--
-- PostgreSQL database dump
--

\restrict GajW9cZ1Cl76JCIZ7oOLCZtKn488122as2wRRT9f29ka6JHIGij6G7M4SHh9QFK

-- Dumped from database version 18.1
-- Dumped by pg_dump version 18.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: postgres
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO postgres;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: postgres
--

COMMENT ON SCHEMA public IS '';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: Ad; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Ad" (
    id text NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    headline text,
    impressions integer DEFAULT 0 NOT NULL,
    clicks integer DEFAULT 0 NOT NULL,
    spend double precision DEFAULT 0.0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    ad_name text NOT NULL,
    ad_type text NOT NULL,
    campaign_id text NOT NULL,
    cta_type text,
    destination_url text,
    media_url text,
    primary_text text NOT NULL,
    thumbnail_url text
);


ALTER TABLE public."Ad" OWNER TO postgres;

--
-- Name: AdAccount; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."AdAccount" (
    id text NOT NULL,
    "businessId" text NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    currency text DEFAULT 'USD'::text NOT NULL,
    balance double precision DEFAULT 0.0 NOT NULL,
    "paymentMethod" text,
    "paymentDetails" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."AdAccount" OWNER TO postgres;

--
-- Name: ApiKey; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."ApiKey" (
    id text NOT NULL,
    name text NOT NULL,
    "keyHash" text NOT NULL,
    "keyPrefix" text NOT NULL,
    environment text DEFAULT 'dev'::text NOT NULL,
    scopes text[],
    "rateLimit" integer DEFAULT 100 NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    "lastUsedAt" timestamp(3) without time zone,
    "expiresAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."ApiKey" OWNER TO postgres;

--
-- Name: AuditLog; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."AuditLog" (
    id text NOT NULL,
    "adminId" text NOT NULL,
    action text NOT NULL,
    "targetType" text,
    "targetId" text,
    details text,
    "ipAddress" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."AuditLog" OWNER TO postgres;

--
-- Name: BroadcastNotification; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."BroadcastNotification" (
    id text NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    "targetType" text DEFAULT 'all'::text NOT NULL,
    "authorId" text NOT NULL,
    status text DEFAULT 'sent'::text NOT NULL,
    metrics text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."BroadcastNotification" OWNER TO postgres;

--
-- Name: BusinessMember; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."BusinessMember" (
    id text NOT NULL,
    "businessId" text NOT NULL,
    "userId" text NOT NULL,
    role text DEFAULT 'member'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."BusinessMember" OWNER TO postgres;

--
-- Name: BusinessProfile; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."BusinessProfile" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "companyName" text NOT NULL,
    industry text,
    location text,
    website text,
    "isVerified" boolean DEFAULT false NOT NULL,
    "verificationDoc" text,
    status text DEFAULT 'pending'::text NOT NULL,
    "totalSpent" text DEFAULT '0'::text NOT NULL,
    "totalImpressions" text DEFAULT '0'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."BusinessProfile" OWNER TO postgres;

--
-- Name: Campaign; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Campaign" (
    id text NOT NULL,
    "adAccountId" text NOT NULL,
    name text NOT NULL,
    type text NOT NULL,
    status text DEFAULT 'draft'::text NOT NULL,
    "dailyBudget" double precision NOT NULL,
    "totalBudget" double precision,
    "startTime" timestamp(3) without time zone NOT NULL,
    "endTime" timestamp(3) without time zone,
    targeting text,
    impressions integer DEFAULT 0 NOT NULL,
    clicks integer DEFAULT 0 NOT NULL,
    spend double precision DEFAULT 0.0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Campaign" OWNER TO postgres;

--
-- Name: Community; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Community" (
    id text NOT NULL,
    name text NOT NULL,
    description text NOT NULL,
    avatar text,
    banner text,
    "membersCount" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Community" OWNER TO postgres;

--
-- Name: CommunityMember; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."CommunityMember" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "communityId" text NOT NULL,
    "joinedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."CommunityMember" OWNER TO postgres;

--
-- Name: CommunityModerator; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."CommunityModerator" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "communityId" text NOT NULL
);


ALTER TABLE public."CommunityModerator" OWNER TO postgres;

--
-- Name: CommunityPost; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."CommunityPost" (
    id text NOT NULL,
    "communityId" text NOT NULL,
    "postId" text NOT NULL
);


ALTER TABLE public."CommunityPost" OWNER TO postgres;

--
-- Name: Conversation; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Conversation" (
    id text NOT NULL,
    type text DEFAULT 'direct'::text NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "lastMessageAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "lastMessageId" text
);


ALTER TABLE public."Conversation" OWNER TO postgres;

--
-- Name: Follow; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Follow" (
    id text NOT NULL,
    "followerId" text NOT NULL,
    "followingId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Follow" OWNER TO postgres;

--
-- Name: Like; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Like" (
    id text NOT NULL,
    "postId" text NOT NULL,
    "userId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Like" OWNER TO postgres;

--
-- Name: List; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."List" (
    id text NOT NULL,
    "ownerId" text NOT NULL,
    name text NOT NULL,
    description text,
    "isPrivate" boolean DEFAULT false NOT NULL,
    banner text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."List" OWNER TO postgres;

--
-- Name: ListFollower; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."ListFollower" (
    id text NOT NULL,
    "listId" text NOT NULL,
    "userId" text NOT NULL,
    "followedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."ListFollower" OWNER TO postgres;

--
-- Name: ListMember; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."ListMember" (
    id text NOT NULL,
    "listId" text NOT NULL,
    "userId" text NOT NULL,
    "addedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."ListMember" OWNER TO postgres;

--
-- Name: Message; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Message" (
    id text NOT NULL,
    "conversationId" text NOT NULL,
    "senderId" text NOT NULL,
    content text,
    type text DEFAULT 'text'::text NOT NULL,
    "mediaUrl" text,
    "thumbnailUrl" text,
    duration integer,
    size integer,
    "mimeType" text,
    status text DEFAULT 'sent'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Message" OWNER TO postgres;

--
-- Name: MonetizationProfile; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."MonetizationProfile" (
    id text NOT NULL,
    "userId" text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    balance double precision DEFAULT 0.0 NOT NULL,
    "lifetimeEarnings" double precision DEFAULT 0.0 NOT NULL,
    "payoutMethod" text,
    "payoutDetails" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."MonetizationProfile" OWNER TO postgres;

--
-- Name: Notification; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Notification" (
    id text NOT NULL,
    "userId" text NOT NULL,
    type text NOT NULL,
    "actorId" text NOT NULL,
    "postId" text,
    read boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Notification" OWNER TO postgres;

--
-- Name: Participant; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Participant" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "conversationId" text NOT NULL,
    "lastReadAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Participant" OWNER TO postgres;

--
-- Name: Post; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Post" (
    id text NOT NULL,
    "userId" text NOT NULL,
    content text NOT NULL,
    "mediaUrls" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "replyToId" text
);


ALTER TABLE public."Post" OWNER TO postgres;

--
-- Name: PostMedia; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."PostMedia" (
    id text NOT NULL,
    "postId" text NOT NULL,
    "mediaType" text NOT NULL,
    "mediaUrl" text NOT NULL,
    "thumbnailUrl" text,
    width integer NOT NULL,
    height integer NOT NULL,
    duration double precision,
    size integer NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."PostMedia" OWNER TO postgres;

--
-- Name: Profile; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Profile" (
    id text NOT NULL,
    "userId" text NOT NULL,
    name text NOT NULL,
    handle text NOT NULL,
    bio text,
    avatar text,
    banner text,
    location text,
    website text,
    birthdate timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Profile" OWNER TO postgres;

--
-- Name: PushConfig; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."PushConfig" (
    id text NOT NULL,
    provider text NOT NULL,
    credentials text NOT NULL,
    enabled boolean DEFAULT true NOT NULL,
    "allowedTypes" text[],
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."PushConfig" OWNER TO postgres;

--
-- Name: PushTemplate; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."PushTemplate" (
    id text NOT NULL,
    name text NOT NULL,
    title text NOT NULL,
    body text NOT NULL,
    category text DEFAULT 'system'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."PushTemplate" OWNER TO postgres;

--
-- Name: RefreshToken; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."RefreshToken" (
    id text NOT NULL,
    "userId" text NOT NULL,
    token text NOT NULL,
    "expiresAt" timestamp(3) without time zone NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."RefreshToken" OWNER TO postgres;

--
-- Name: Report; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Report" (
    id text NOT NULL,
    type text DEFAULT 'report'::text NOT NULL,
    "targetId" text NOT NULL,
    "targetType" text NOT NULL,
    "reporterId" text NOT NULL,
    reason text,
    status text DEFAULT 'pending'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Report" OWNER TO postgres;

--
-- Name: Retweet; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Retweet" (
    id text NOT NULL,
    "postId" text NOT NULL,
    "userId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Retweet" OWNER TO postgres;

--
-- Name: Space; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Space" (
    id text NOT NULL,
    title text NOT NULL,
    "hostId" text NOT NULL,
    topics text[],
    privacy text DEFAULT 'public'::text NOT NULL,
    status text DEFAULT 'live'::text NOT NULL,
    "isLive" boolean DEFAULT false NOT NULL,
    "time" text,
    "scheduledAt" timestamp(3) without time zone,
    "startedAt" timestamp(3) without time zone,
    "endedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Space" OWNER TO postgres;

--
-- Name: Subscription; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Subscription" (
    id text NOT NULL,
    "tierId" text NOT NULL,
    "subscriberId" text NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    "currentPeriodStart" timestamp(3) without time zone NOT NULL,
    "currentPeriodEnd" timestamp(3) without time zone NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Subscription" OWNER TO postgres;

--
-- Name: SubscriptionTier; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."SubscriptionTier" (
    id text NOT NULL,
    "monetizationProfileId" text NOT NULL,
    name text NOT NULL,
    description text,
    price double precision NOT NULL,
    perks text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."SubscriptionTier" OWNER TO postgres;

--
-- Name: Transaction; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Transaction" (
    id text NOT NULL,
    "monetizationProfileId" text,
    "subscriptionId" text,
    type text NOT NULL,
    amount double precision NOT NULL,
    currency text DEFAULT 'USD'::text NOT NULL,
    status text DEFAULT 'completed'::text NOT NULL,
    "processorId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Transaction" OWNER TO postgres;

--
-- Name: Trend; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Trend" (
    id text NOT NULL,
    category text NOT NULL,
    topic text NOT NULL,
    posts integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Trend" OWNER TO postgres;

--
-- Name: User; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."User" (
    id text NOT NULL,
    email text NOT NULL,
    "passwordHash" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    role text DEFAULT 'USER'::text NOT NULL,
    status text DEFAULT 'ACTIVE'::text NOT NULL,
    "lastActiveAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "preferredLanguage" text DEFAULT 'en'::text NOT NULL
);


ALTER TABLE public."User" OWNER TO postgres;

--
-- Name: VerificationRequest; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."VerificationRequest" (
    id text NOT NULL,
    "userId" text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."VerificationRequest" OWNER TO postgres;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public._prisma_migrations OWNER TO postgres;

--
-- Data for Name: Ad; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Ad" (id, status, headline, impressions, clicks, spend, "createdAt", "updatedAt", ad_name, ad_type, campaign_id, cta_type, destination_url, media_url, primary_text, thumbnail_url) FROM stdin;
514465ff-1b0a-4b40-a2f7-3f5e2ef2edc9	active		0	0	0	2026-02-13 10:03:14.709	2026-02-13 10:03:14.709	holi sale Ad	image	f3c546d0-c9f6-403c-9717-228b5ff65c16	LEARN_MORE	\N	https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800&q=80		\N
5bd12617-86aa-4d2e-9311-482a9cef4482	active	holi	0	0	0	2026-02-13 10:03:59.89	2026-02-13 10:03:59.89	holi	video	f3c546d0-c9f6-403c-9717-228b5ff65c16	SHOP_NOW		ww.werfie.com	holi sale is live	
68b7d16c-8778-43c3-a1f0-80e372601eac	active		0	0	0	2026-02-13 10:07:58.034	2026-02-13 10:07:58.034	12345	image	f3c546d0-c9f6-403c-9717-228b5ff65c16	LEARN_MORE		https://i.natgeofe.com/k/aa3a7720-96bd-4bb7-b765-226d052b354e/holi-kids-in-circle_4x3.jpg	1234	
\.


--
-- Data for Name: AdAccount; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."AdAccount" (id, "businessId", status, currency, balance, "paymentMethod", "paymentDetails", "createdAt", "updatedAt") FROM stdin;
5eee1652-217f-4ad4-8366-94651fbf0cc1	039229da-2e8c-4b32-877c-d202881e49a4	active	USD	0	card	{"upiId":"","cardName":"qwert1","cardNumber":"1234567890-q23456","expiry":"2345","cvv":"124"}	2026-02-13 07:36:23.651	2026-02-13 07:36:38.773
0fe65878-c4ac-4858-bd65-68b8692dbcbf	b69babee-74d3-48ca-84f5-559a9f87c818	active	USD	0	\N	\N	2026-02-13 09:53:38.79	2026-02-13 09:53:38.79
bfa417ad-0a23-4c64-b620-e4b7cf9e6472	d8c376ac-5fd5-4277-b049-fb833cd2322c	active	USD	0	card	{"upiId":"","cardName":"yash","cardNumber":"1234567891234566","expiry":"11/27","cvv":"231"}	2026-02-13 10:02:51.824	2026-02-13 10:04:34.481
\.


--
-- Data for Name: ApiKey; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."ApiKey" (id, name, "keyHash", "keyPrefix", environment, scopes, "rateLimit", status, "lastUsedAt", "expiresAt", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: AuditLog; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."AuditLog" (id, "adminId", action, "targetType", "targetId", details, "ipAddress", "createdAt") FROM stdin;
\.


--
-- Data for Name: BroadcastNotification; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."BroadcastNotification" (id, title, message, "targetType", "authorId", status, metrics, "createdAt") FROM stdin;
\.


--
-- Data for Name: BusinessMember; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."BusinessMember" (id, "businessId", "userId", role, "createdAt", "updatedAt") FROM stdin;
1cfbb752-658a-49e6-9c7e-e429dde9db32	039229da-2e8c-4b32-877c-d202881e49a4	2def704a-bb45-4236-8081-127083acc86b	member	2026-02-13 08:11:27.134	2026-02-13 08:11:27.134
6c053e14-893f-4fe0-824f-686d461335da	d8c376ac-5fd5-4277-b049-fb833cd2322c	03eae847-3a7c-46c9-a4a1-1fddb44a657b	member	2026-02-13 10:05:09.737	2026-02-13 10:05:09.737
\.


--
-- Data for Name: BusinessProfile; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."BusinessProfile" (id, "userId", "companyName", industry, location, website, "isVerified", "verificationDoc", status, "totalSpent", "totalImpressions", "createdAt", "updatedAt") FROM stdin;
039229da-2e8c-4b32-877c-d202881e49a4	89eaec47-3a52-4f04-8885-f2b0f2f7aac1	PAnjwani Travels	fintech	Vadodara	fdvd	f	\N	pending	0	0	2026-02-13 07:36:15.743	2026-02-13 08:14:02.528
b69babee-74d3-48ca-84f5-559a9f87c818	7d784861-2cba-437c-8149-179aadb4b2fc	werfie	technologies	Vadodara	ww.werfie.com	f	\N	pending	0	0	2026-02-13 09:53:34.432	2026-02-13 09:53:34.432
d8c376ac-5fd5-4277-b049-fb833cd2322c	2def704a-bb45-4236-8081-127083acc86b	werfie	technologies	Vadodara	ww.werfie.com	f	\N	pending	0	0	2026-02-13 10:02:47.548	2026-02-13 10:02:47.548
\.


--
-- Data for Name: Campaign; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Campaign" (id, "adAccountId", name, type, status, "dailyBudget", "totalBudget", "startTime", "endTime", targeting, impressions, clicks, spend, "createdAt", "updatedAt") FROM stdin;
71ad786a-7c30-4b43-a56f-8e789926801a	0fe65878-c4ac-4858-bd65-68b8692dbcbf	holi sale	awareness	active	0	\N	2026-02-13 09:54:06.751	\N	{"locations":["Global"]}	0	0	0	2026-02-13 09:54:06.81	2026-02-13 09:54:06.81
7df8bafe-3edf-41b1-b8e9-811e9ed60976	0fe65878-c4ac-4858-bd65-68b8692dbcbf	holi sale	awareness	active	0	\N	2026-02-13 09:54:15.346	\N	{"locations":["Global"]}	0	0	0	2026-02-13 09:54:15.374	2026-02-13 09:54:15.374
c87f5847-e617-4036-816d-83d31b655c91	0fe65878-c4ac-4858-bd65-68b8692dbcbf	holi sale	awareness	active	0	\N	2026-02-13 09:54:19.974	\N	{"locations":["Global"]}	0	0	0	2026-02-13 09:54:19.994	2026-02-13 09:54:19.994
d11f1f87-d202-4f1e-91aa-368a78f72e59	0fe65878-c4ac-4858-bd65-68b8692dbcbf	holi sale	awareness	active	0	\N	2026-02-13 09:54:24.685	\N	{"locations":["Global"]}	0	0	0	2026-02-13 09:54:24.718	2026-02-13 09:54:24.718
f08485f7-f5b3-4a7e-9ac9-bde7e596572d	0fe65878-c4ac-4858-bd65-68b8692dbcbf	holi sale	awareness	active	0	\N	2026-02-13 09:54:34.393	\N	{"locations":["Global"]}	0	0	0	2026-02-13 09:54:34.436	2026-02-13 09:54:34.436
f3c546d0-c9f6-403c-9717-228b5ff65c16	bfa417ad-0a23-4c64-b620-e4b7cf9e6472	holi sale	awareness	active	500	\N	2026-02-13 10:03:14.533	\N	{"locations":["Global"]}	0	0	0	2026-02-13 10:03:14.645	2026-02-13 10:03:14.645
\.


--
-- Data for Name: Community; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Community" (id, name, description, avatar, banner, "membersCount", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: CommunityMember; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."CommunityMember" (id, "userId", "communityId", "joinedAt") FROM stdin;
\.


--
-- Data for Name: CommunityModerator; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."CommunityModerator" (id, "userId", "communityId") FROM stdin;
\.


--
-- Data for Name: CommunityPost; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."CommunityPost" (id, "communityId", "postId") FROM stdin;
\.


--
-- Data for Name: Conversation; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Conversation" (id, type, "updatedAt", "lastMessageAt", "lastMessageId") FROM stdin;
\.


--
-- Data for Name: Follow; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Follow" (id, "followerId", "followingId", "createdAt") FROM stdin;
f77e71c6-8af0-4012-834c-2b181af55d8a	2def704a-bb45-4236-8081-127083acc86b	89eaec47-3a52-4f04-8885-f2b0f2f7aac1	2026-02-13 08:12:55.105
\.


--
-- Data for Name: Like; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Like" (id, "postId", "userId", "createdAt") FROM stdin;
\.


--
-- Data for Name: List; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."List" (id, "ownerId", name, description, "isPrivate", banner, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: ListFollower; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."ListFollower" (id, "listId", "userId", "followedAt") FROM stdin;
\.


--
-- Data for Name: ListMember; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."ListMember" (id, "listId", "userId", "addedAt") FROM stdin;
\.


--
-- Data for Name: Message; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Message" (id, "conversationId", "senderId", content, type, "mediaUrl", "thumbnailUrl", duration, size, "mimeType", status, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: MonetizationProfile; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."MonetizationProfile" (id, "userId", status, balance, "lifetimeEarnings", "payoutMethod", "payoutDetails", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Notification; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Notification" (id, "userId", type, "actorId", "postId", read, "createdAt") FROM stdin;
63c883ee-ae6f-42b6-bbc9-6021ad499a66	89eaec47-3a52-4f04-8885-f2b0f2f7aac1	follow	2def704a-bb45-4236-8081-127083acc86b	\N	f	2026-02-13 08:12:55.125
\.


--
-- Data for Name: Participant; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Participant" (id, "userId", "conversationId", "lastReadAt") FROM stdin;
\.


--
-- Data for Name: Post; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Post" (id, "userId", content, "mediaUrls", "createdAt", "updatedAt", "replyToId") FROM stdin;
bc854363-5920-4ed0-9fb2-0442349d683b	46c25209-b6c8-46fa-9de1-9b4fd3cef226	This is a seeded post from Seeded User 1. It contains a nice image! #seeded #test_0	\N	2026-02-16 06:52:50.476	2026-02-16 06:52:50.476	\N
fd3787a4-ae7a-41b9-92b7-3f85b55239f9	63a2429a-ae99-4d46-b63d-420ea926e63b	This is a seeded post from Seeded User 2. It contains a nice video! #seeded #test_1	\N	2026-02-16 06:53:07.813	2026-02-16 06:53:07.813	\N
a1e18a42-3274-4451-a17f-58e8c1321cbd	f2dc578a-2756-4a60-ac61-5e85c08b0122	This is a seeded post from Seeded User 3. It contains a nice image! #seeded #test_2	\N	2026-02-16 06:53:15.008	2026-02-16 06:53:15.008	\N
61c8ddc0-1521-40cb-af81-d6f977df6dfa	d8afb039-51c7-4231-a911-42cb4517336a	This is a seeded post from Seeded User 4. It contains a nice video! #seeded #test_3	\N	2026-02-16 06:53:29.741	2026-02-16 06:53:29.741	\N
df0c412c-00bb-4bfd-86c3-afcae1058024	a60ef065-0c4a-4f70-8cee-04b4b025869e	This is a seeded post from Seeded User 5. It contains a nice image! #seeded #test_4	\N	2026-02-16 06:53:51.592	2026-02-16 06:53:51.592	\N
eb0f1b00-c3fe-4917-b2bf-a2c7209f532b	90b90fdc-26b6-4601-9630-9d50f6b38d54	This is a seeded post from Seeded User 6. It contains a nice video! #seeded #test_5	\N	2026-02-16 06:54:10.463	2026-02-16 06:54:10.463	\N
3ac748db-d844-46e6-a3bf-80e56efbde6e	dc9744ef-7f5d-498f-bbdc-d84367d7087b	This is a seeded post from Seeded User 7. It contains a nice image! #seeded #test_6	\N	2026-02-16 06:54:26.374	2026-02-16 06:54:26.374	\N
6cd27226-5816-4f64-821a-c30d821f2d16	f2a154ee-4be8-42c8-b35b-20f367333b37	This is a seeded post from Seeded User 8. It contains a nice video! #seeded #test_7	\N	2026-02-16 06:54:44.664	2026-02-16 06:54:44.664	\N
a2393b7b-2c35-44ee-aaaa-58555bd5fb74	d2ec979c-2dde-492e-8caa-990ebb975dd0	This is a seeded post from Seeded User 9. It contains a nice image! #seeded #test_8	\N	2026-02-16 06:55:05.983	2026-02-16 06:55:05.983	\N
43bfe21b-cf2f-448b-9bd9-0a053eeee41f	d28a67b1-384d-4429-8396-aaf9e828e171	This is a seeded post from Seeded User 10. It contains a nice video! #seeded #test_9	\N	2026-02-16 06:55:20.91	2026-02-16 06:55:20.91	\N
\.


--
-- Data for Name: PostMedia; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."PostMedia" (id, "postId", "mediaType", "mediaUrl", "thumbnailUrl", width, height, duration, size, "createdAt") FROM stdin;
01c688be-c166-4de0-b291-b69acd779379	bc854363-5920-4ed0-9fb2-0442349d683b	image	https://pub-2358eaa2410b49978f2040fef6f8f1af.r2.dev/werfie/images/bd8116b4-1010-46e8-8d8e-c2bdf8adeb45.59c3b33b-3031-432c-b7a4-1ae074b89451.webp	\N	1080	1080	\N	10406	2026-02-16 06:52:51.289
4e9ea052-70e5-4477-ac7a-4e09dc032171	a1e18a42-3274-4451-a17f-58e8c1321cbd	image	https://pub-2358eaa2410b49978f2040fef6f8f1af.r2.dev/werfie/images/22048387-acde-4412-9571-612bf6a995d2.95c0eba5-6dc0-4eb6-8d64-a473a05dadf6.webp	\N	1080	1080	\N	10406	2026-02-16 06:53:15.608
bce4e47e-0b4c-4b7f-b0a1-001aa2ba1e51	61c8ddc0-1521-40cb-af81-d6f977df6dfa	video	https://pub-2358eaa2410b49978f2040fef6f8f1af.r2.dev/werfie/videos/35ea9547-119b-43c7-998c-d8caa4e21a20.mp4	https://pub-2358eaa2410b49978f2040fef6f8f1af.r2.dev/werfie/thumbnails/b4daf34c-fa63-4f7b-bcfd-8fbece7735b8.jpg	640	480	14.582132	0	2026-02-16 06:53:34.161
1991c2f6-fb66-4235-9d92-e347564c8bb0	df0c412c-00bb-4bfd-86c3-afcae1058024	image	https://pub-2358eaa2410b49978f2040fef6f8f1af.r2.dev/werfie/images/35e62a69-b97f-466c-bf7b-33c8527c248a.d07b0555-f043-4ed2-9ccc-640ba1f49111.webp	\N	1080	1080	\N	10406	2026-02-16 06:53:52.228
c3d47373-663a-4574-8933-649d27b13137	eb0f1b00-c3fe-4917-b2bf-a2c7209f532b	video	https://pub-2358eaa2410b49978f2040fef6f8f1af.r2.dev/werfie/videos/76249846-9ff5-4c77-bb84-dc82ccd1b048.mp4	https://pub-2358eaa2410b49978f2040fef6f8f1af.r2.dev/werfie/thumbnails/a3cf37c3-475c-46c3-90b9-b700c2988215.jpg	640	480	14.582132	0	2026-02-16 06:54:13.715
9db67c48-86cd-44a3-8ebe-1acfbfc5f01e	3ac748db-d844-46e6-a3bf-80e56efbde6e	image	https://pub-2358eaa2410b49978f2040fef6f8f1af.r2.dev/werfie/images/7cacc4db-ec33-48bb-a436-02a4bb663cf3.6157bf1e-39ca-4c41-b663-9ab60cd1f72c.webp	\N	1080	1080	\N	10406	2026-02-16 06:54:26.924
1ecede2c-ab7e-46e8-a29c-12dcf66ba939	6cd27226-5816-4f64-821a-c30d821f2d16	video	https://pub-2358eaa2410b49978f2040fef6f8f1af.r2.dev/werfie/videos/3c3443be-679c-49c2-8917-656d1331b873.mp4	https://pub-2358eaa2410b49978f2040fef6f8f1af.r2.dev/werfie/thumbnails/dd7c255c-01b2-4ed0-978f-c3978bcfe5b5.jpg	640	480	14.582132	0	2026-02-16 06:54:50.012
df2bb602-99ab-431c-8144-673dca5652df	a2393b7b-2c35-44ee-aaaa-58555bd5fb74	image	https://pub-2358eaa2410b49978f2040fef6f8f1af.r2.dev/werfie/images/34a72252-f0a6-47eb-86f0-5d8e8d11614a.a20f0ab6-7a25-46ed-bf0b-9720b1fb776d.webp	\N	1080	1080	\N	10406	2026-02-16 06:55:06.63
afa25d71-4607-4e92-a3c3-dfa0bf5f2ce4	43bfe21b-cf2f-448b-9bd9-0a053eeee41f	video	https://pub-2358eaa2410b49978f2040fef6f8f1af.r2.dev/werfie/videos/64adcadf-eb43-41e7-81a8-c7b538d1aff9.mp4	https://pub-2358eaa2410b49978f2040fef6f8f1af.r2.dev/werfie/thumbnails/16da9d3d-0ab6-434c-8f22-ed653c261ae7.jpg	640	480	14.582132	0	2026-02-16 06:55:25.772
\.


--
-- Data for Name: Profile; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Profile" (id, "userId", name, handle, bio, avatar, banner, location, website, birthdate, "createdAt", "updatedAt") FROM stdin;
2b1a0484-a5fb-404c-bb64-4a41099dc3e5	89eaec47-3a52-4f04-8885-f2b0f2f7aac1	User1	user1	\N	\N	\N	\N	\N	\N	2026-02-13 07:34:56.33	2026-02-13 07:34:56.33
2b5de52e-3da8-47ca-942f-ea1023c87d41	8c7d937e-7937-40fe-a8b2-018f3bc44ad6	User2	user2	\N	\N	\N	\N	\N	\N	2026-02-13 07:34:56.425	2026-02-13 07:34:56.425
0f781d15-a2ff-41c3-92c8-4731df3a3d9d	8f6e3778-0927-415e-b1f1-835238f74aa6	User3	user3	\N	\N	\N	\N	\N	\N	2026-02-13 07:34:56.5	2026-02-13 07:34:56.5
bff58b21-f69f-4a11-a47d-398fd8db4735	1121d2bc-d95c-4d94-a235-564f37f23818	User4	user4	\N	\N	\N	\N	\N	\N	2026-02-13 07:34:56.577	2026-02-13 07:34:56.577
01e797fe-5baf-4698-8ddd-9b3b45c49b73	46a11b35-e002-4951-91a9-1e3858d94e51	User5	user5	\N	\N	\N	\N	\N	\N	2026-02-13 07:34:56.649	2026-02-13 07:34:56.649
588f04cc-d844-417f-a8b8-30d73b30af9f	7d784861-2cba-437c-8149-179aadb4b2fc	User6	user6	\N	\N	\N	\N	\N	\N	2026-02-13 07:34:56.725	2026-02-13 07:34:56.725
21ebcd9c-4e6d-415f-8490-094d131ba08b	0b16e54e-2cc2-4876-af1b-19b38dc7e64b	User7	user7	\N	\N	\N	\N	\N	\N	2026-02-13 07:34:56.802	2026-02-13 07:34:56.802
7f35e72c-7103-4626-910b-28aed19ed3b1	71be6ae4-8cb8-4b0a-9a34-f30117de683f	User8	user8	\N	\N	\N	\N	\N	\N	2026-02-13 07:34:56.877	2026-02-13 07:34:56.877
ce842ac2-6ed2-449d-80af-c90ec4c42df8	a4cc95d9-9418-4f9a-9c9c-58c8065f3664	User9	user9	\N	\N	\N	\N	\N	\N	2026-02-13 07:34:56.946	2026-02-13 07:34:56.946
c93938f3-ee48-4bbc-9f23-da3a98d6c0a0	82f600f6-39d9-49c3-89d5-ac4e29dc2ebf	User10	user10	\N	\N	\N	\N	\N	\N	2026-02-13 07:34:57.013	2026-02-13 07:34:57.013
657e09cb-1c07-46fb-9edc-bebb145b3c4f	15bc5dc9-1012-4883-809e-33ed43b1b825	User11	user11	\N	\N	\N	\N	\N	\N	2026-02-13 07:34:57.081	2026-02-13 07:34:57.081
7c19978d-add5-4fbf-95bf-cd7c9787ebff	65e55936-8860-4319-a05e-cf16018e881e	User12	user12	\N	\N	\N	\N	\N	\N	2026-02-13 07:34:57.147	2026-02-13 07:34:57.147
ba188cfd-a8a3-493b-9e4c-0524a16ed4e8	af035db2-8b72-4af5-b4cc-144d37667d5d	User13	user13	\N	\N	\N	\N	\N	\N	2026-02-13 07:34:57.214	2026-02-13 07:34:57.214
dfa84d0d-5581-487d-91eb-d074edca0855	86c62ca6-3c33-4927-bfe3-7286993c0db6	User14	user14	\N	\N	\N	\N	\N	\N	2026-02-13 07:34:57.283	2026-02-13 07:34:57.283
1dd7715b-bff5-4b74-94fb-db1d2f809ca9	567abd64-e4ea-46b8-ba94-b5f371bc1044	User15	user15	\N	\N	\N	\N	\N	\N	2026-02-13 07:34:57.351	2026-02-13 07:34:57.351
16fa8bce-9200-44d3-a0ed-62065c759530	65aabba9-80d5-4cfb-a8a2-f6b26fcdaaa7	User16	user16	\N	\N	\N	\N	\N	\N	2026-02-13 07:34:57.418	2026-02-13 07:34:57.418
2b25c6c0-27ad-4611-b3cb-7e5845673faa	c201d03b-c51b-4789-9673-0e73040580c7	User17	user17	\N	\N	\N	\N	\N	\N	2026-02-13 07:34:57.483	2026-02-13 07:34:57.483
a798c77d-213a-4487-b9e2-c21ff5a5c47d	9193d18a-7b88-4525-b1b5-def43ae823af	User18	user18	\N	\N	\N	\N	\N	\N	2026-02-13 07:34:57.548	2026-02-13 07:34:57.548
ace95627-a05d-4c7d-8446-3be222137fcc	9d602694-52db-48d3-b31e-59a1061c7aad	User19	user19	\N	\N	\N	\N	\N	\N	2026-02-13 07:34:57.614	2026-02-13 07:34:57.614
40478131-02c8-4e94-99f6-220d74667b46	cc31f858-e5dd-4758-a078-67494637695a	User20	user20	\N	\N	\N	\N	\N	\N	2026-02-13 07:34:57.68	2026-02-13 07:34:57.68
e326b214-cd41-48b1-96ee-6ccd833bc9f3	6bd53601-b4c4-46db-a6ff-a86d5186a898	User21	user21	\N	\N	\N	\N	\N	\N	2026-02-13 07:34:57.747	2026-02-13 07:34:57.747
d52566c9-8ea9-4e92-a109-be9e89027bfd	2def704a-bb45-4236-8081-127083acc86b	User22	user22	\N	\N	\N	\N	\N	\N	2026-02-13 07:34:57.814	2026-02-13 07:34:57.814
e47c5e8e-4c5a-45b5-bf9a-73df6893e6b9	6459a7bb-e9ca-4b29-aa74-476e5b2a0604	User23	user23	\N	\N	\N	\N	\N	\N	2026-02-13 07:34:57.881	2026-02-13 07:34:57.881
413fec31-d7fe-4837-812c-90d0427b2901	24036fdd-104c-4715-919b-fe984200ea62	User24	user24	\N	\N	\N	\N	\N	\N	2026-02-13 07:34:57.948	2026-02-13 07:34:57.948
9370b659-ad97-4535-8d96-ec0bf1bb1236	03eae847-3a7c-46c9-a4a1-1fddb44a657b	User25	user25	\N	\N	\N	\N	\N	\N	2026-02-13 07:34:58.023	2026-02-13 07:34:58.023
686de891-59be-4857-80d7-cacec5e938ca	9737b04c-41c7-4d45-9666-495714816ac5	User26	user26	\N	\N	\N	\N	\N	\N	2026-02-13 07:34:58.088	2026-02-13 07:34:58.088
b632330d-f87f-4ec7-a5cf-b8a00bf351d0	ad7f059d-c79e-4dee-b35e-79a8d890159c	User27	user27	\N	\N	\N	\N	\N	\N	2026-02-13 07:34:58.156	2026-02-13 07:34:58.156
9611e3c0-12b5-4388-94e0-b758d50dc71c	20ccc387-9723-4dd7-b065-54850d217448	User28	user28	\N	\N	\N	\N	\N	\N	2026-02-13 07:34:58.222	2026-02-13 07:34:58.222
4a136510-2655-49bd-8ee4-f0b3323cfdf4	6c790152-af53-4590-90e9-cdcd41377bcf	User29	user29	\N	\N	\N	\N	\N	\N	2026-02-13 07:34:58.289	2026-02-13 07:34:58.289
fa1a404a-1772-452d-9ec0-be52e61b5a5b	f722d71f-3b20-4488-9a55-f23f40635d01	User30	user30	\N	\N	\N	\N	\N	\N	2026-02-13 07:34:58.354	2026-02-13 07:34:58.354
10b1d666-34d4-4998-8477-c469db17284c	d454ca87-5582-4d0b-a955-10be038aa300	User31	user31	\N	\N	\N	\N	\N	\N	2026-02-13 07:34:58.42	2026-02-13 07:34:58.42
a6f73d27-d7ce-4e11-b06f-a3257e2f852e	ac0fdf99-1f5b-4014-861f-029b1a7d7c86	User32	user32	\N	\N	\N	\N	\N	\N	2026-02-13 07:34:58.485	2026-02-13 07:34:58.485
54e6eeb4-4692-412a-9d2d-0c624f0fb632	327555ab-f96b-42a8-aee7-9fcfd20eb462	User33	user33	\N	\N	\N	\N	\N	\N	2026-02-13 07:34:58.551	2026-02-13 07:34:58.551
479af88f-1126-46a8-a8a4-bd740bca79f1	9d179ac2-153c-4cda-8bb6-acda03178f4d	User34	user34	\N	\N	\N	\N	\N	\N	2026-02-13 07:34:58.616	2026-02-13 07:34:58.616
b9c7b216-726b-48d4-a162-28edc394edf4	aba2c69b-10d9-41e6-be18-503b3504e565	User35	user35	\N	\N	\N	\N	\N	\N	2026-02-13 07:34:58.682	2026-02-13 07:34:58.682
42650330-06d9-45a7-bd4e-45856761f4e7	80295c5e-b05e-470b-b48a-858695a9d9ff	User36	user36	\N	\N	\N	\N	\N	\N	2026-02-13 07:34:58.748	2026-02-13 07:34:58.748
27379769-08d3-4eab-a2bf-2b4c94efce08	fc0cf2f3-d2f6-4567-9129-b01af2a4215d	User37	user37	\N	\N	\N	\N	\N	\N	2026-02-13 07:34:58.814	2026-02-13 07:34:58.814
36cef87d-376a-409c-b48c-7b6952546e5f	acfd61dc-781b-4fee-a2e1-ac5914dfd6d2	User38	user38	\N	\N	\N	\N	\N	\N	2026-02-13 07:34:58.88	2026-02-13 07:34:58.88
04aec070-9976-49c3-93e7-2fbde81f54ea	582b8066-699c-4d7d-8fc5-12932fc709c4	User39	user39	\N	\N	\N	\N	\N	\N	2026-02-13 07:34:58.947	2026-02-13 07:34:58.947
85a6ecb6-718d-4ce2-bc59-55289295e209	895f36ab-1724-4ae6-9546-6c1426f847df	User40	user40	\N	\N	\N	\N	\N	\N	2026-02-13 07:34:59.019	2026-02-13 07:34:59.019
e91fcbd7-62e0-4612-b845-a50c87654a42	0b42f4fb-020d-42f8-b7e1-5129afd74369	User41	user41	\N	\N	\N	\N	\N	\N	2026-02-13 07:34:59.085	2026-02-13 07:34:59.085
fd3c227c-374c-43f4-97fe-2f2ba3e531b5	f4528bdc-7476-48a8-8895-d5e0b2afc776	User42	user42	\N	\N	\N	\N	\N	\N	2026-02-13 07:34:59.15	2026-02-13 07:34:59.15
07bb89a8-0543-47c5-8ff5-0e1b8ca5668b	d27e36e7-09d2-4400-8207-b343866044cd	User43	user43	\N	\N	\N	\N	\N	\N	2026-02-13 07:34:59.217	2026-02-13 07:34:59.217
c0cfced9-f9b2-4b59-9d30-14127a4e861e	15ca20cc-ca0e-422d-a242-0b11b0478f31	User44	user44	\N	\N	\N	\N	\N	\N	2026-02-13 07:34:59.294	2026-02-13 07:34:59.294
2bcf36e3-0992-4be9-9f41-290e2953b61e	1264f8cb-8009-476d-9486-d7c17bc5c3fb	User45	user45	\N	\N	\N	\N	\N	\N	2026-02-13 07:34:59.36	2026-02-13 07:34:59.36
b4376a4a-9b5a-4437-b5b3-4df826710dd0	9eb598ff-d969-41b4-8716-7f9ecd263841	User46	user46	\N	\N	\N	\N	\N	\N	2026-02-13 07:34:59.425	2026-02-13 07:34:59.425
bf668d29-ed08-48b2-bd8f-c885035f0712	0205b312-bd33-4bce-9f86-c35295beeefe	User47	user47	\N	\N	\N	\N	\N	\N	2026-02-13 07:34:59.491	2026-02-13 07:34:59.491
c0c6af01-f67f-4f84-b9ab-77f5b5504b28	19b1025a-8b3a-4c34-b08e-a0edf0f41d07	User48	user48	\N	\N	\N	\N	\N	\N	2026-02-13 07:34:59.557	2026-02-13 07:34:59.557
4a46773a-93e6-4492-8893-b283dc5b858c	88fcd25a-146f-43de-ba88-7474efbdfa93	User49	user49	\N	\N	\N	\N	\N	\N	2026-02-13 07:34:59.622	2026-02-13 07:34:59.622
c52108a2-2f0b-4491-ac04-3da1c132a9d7	56534c56-3c4b-49bf-912c-ddb78e15c549	User50	user50	\N	\N	\N	\N	\N	\N	2026-02-13 07:34:59.687	2026-02-13 07:34:59.687
da6fcbaf-c56b-4f41-8453-2d64350269e3	61f683e2-1203-452b-a637-53429b67ac6b	Seeded User 1	user_seed_1771224469605	\N	\N	\N	\N	\N	\N	2026-02-16 06:47:49.767	2026-02-16 06:47:49.767
ba7958b1-22b3-4847-970c-8c8bb7472192	33ac3758-54df-4719-a14d-ff9262a51a76	Seeded User 2	user_seed_1771224469860	\N	\N	\N	\N	\N	\N	2026-02-16 06:47:49.98	2026-02-16 06:47:49.98
db277279-f621-45a0-8021-ff8b1af1e91f	d661946d-d6c7-4847-adec-d279d139947d	Seeded User 3	user_seed_1771224470038	\N	\N	\N	\N	\N	\N	2026-02-16 06:47:50.163	2026-02-16 06:47:50.163
36afdd5d-d514-41e2-9393-74b2a1fe11c0	c7b389bd-2036-4170-8b2d-8b232df39c14	Seeded User 4	user_seed_1771224470200	\N	\N	\N	\N	\N	\N	2026-02-16 06:47:50.312	2026-02-16 06:47:50.312
4216ecfa-ba50-4db5-8d84-f6b88c50c430	a3f1933f-244c-42fd-8ae7-29fac64268d8	Seeded User 5	user_seed_1771224470364	\N	\N	\N	\N	\N	\N	2026-02-16 06:47:50.479	2026-02-16 06:47:50.479
a9d9ee73-3a93-465c-a2b7-c734be8db950	c05fee46-e614-44b5-ae3e-9475eacb3e23	Seeded User 6	user_seed_1771224470506	\N	\N	\N	\N	\N	\N	2026-02-16 06:47:50.625	2026-02-16 06:47:50.625
6384322c-4f81-466a-bd73-11d816280ce1	9786dd2c-7021-4948-a3db-17a14318edb0	Seeded User 7	user_seed_1771224470688	\N	\N	\N	\N	\N	\N	2026-02-16 06:47:50.81	2026-02-16 06:47:50.81
b0b3388f-da9b-4dc5-885a-2d4204346020	2ec81ee3-3de4-456e-8cb3-327747ece04c	Seeded User 8	user_seed_1771224470838	\N	\N	\N	\N	\N	\N	2026-02-16 06:47:50.944	2026-02-16 06:47:50.944
a8d9fc05-9f2c-4a82-9b90-cb8e9632c87c	9d57e20d-4791-4937-afe2-31eb1c6a6971	Seeded User 9	user_seed_1771224470994	\N	\N	\N	\N	\N	\N	2026-02-16 06:47:51.105	2026-02-16 06:47:51.105
ef8f7bee-8e61-4e2b-ad4e-74e6fc6113c3	7c3a4bfd-6033-4a79-b2a8-a4c6ac5d23bf	Seeded User 10	user_seed_1771224471167	\N	\N	\N	\N	\N	\N	2026-02-16 06:47:51.272	2026-02-16 06:47:51.272
0c4bc1f5-63b5-48bb-8293-045c18c2bd25	46c25209-b6c8-46fa-9de1-9b4fd3cef226	Seeded User 1	user_seed_1771224770138	\N	\N	\N	\N	\N	\N	2026-02-16 06:52:50.395	2026-02-16 06:52:50.395
ce28a64f-7002-4b2c-ad35-7723ea5cde01	63a2429a-ae99-4d46-b63d-420ea926e63b	Seeded User 2	user_seed_1771224787619	\N	\N	\N	\N	\N	\N	2026-02-16 06:53:07.757	2026-02-16 06:53:07.757
34065d7b-4e9a-4c82-9362-502f2e3616fc	f2dc578a-2756-4a60-ac61-5e85c08b0122	Seeded User 3	user_seed_1771224794862	\N	\N	\N	\N	\N	\N	2026-02-16 06:53:14.987	2026-02-16 06:53:14.987
f0d777de-60c7-4784-a992-2e81138d6686	d8afb039-51c7-4231-a911-42cb4517336a	Seeded User 4	user_seed_1771224809577	\N	\N	\N	\N	\N	\N	2026-02-16 06:53:29.703	2026-02-16 06:53:29.703
a9c61654-f07e-44c5-9b35-9d48c49cd98f	a60ef065-0c4a-4f70-8cee-04b4b025869e	Seeded User 5	user_seed_1771224831432	\N	\N	\N	\N	\N	\N	2026-02-16 06:53:51.559	2026-02-16 06:53:51.559
81079d8b-f762-4dd6-befe-034a397ef8da	90b90fdc-26b6-4601-9630-9d50f6b38d54	Seeded User 6	user_seed_1771224850276	\N	\N	\N	\N	\N	\N	2026-02-16 06:54:10.4	2026-02-16 06:54:10.4
64bf94a6-b6ec-4dc6-ba08-99d5f59e4fd3	dc9744ef-7f5d-498f-bbdc-d84367d7087b	Seeded User 7	user_seed_1771224866211	\N	\N	\N	\N	\N	\N	2026-02-16 06:54:26.333	2026-02-16 06:54:26.333
a098678b-5b37-4a41-a05d-25a52c196c14	f2a154ee-4be8-42c8-b35b-20f367333b37	Seeded User 8	user_seed_1771224884480	\N	\N	\N	\N	\N	\N	2026-02-16 06:54:44.603	2026-02-16 06:54:44.603
c6affb18-2ffc-424b-9ff6-3d3632c60c5f	d2ec979c-2dde-492e-8caa-990ebb975dd0	Seeded User 9	user_seed_1771224905824	\N	\N	\N	\N	\N	\N	2026-02-16 06:55:05.943	2026-02-16 06:55:05.943
ae456186-d6b9-48cd-9dba-13be8cf89fc2	d28a67b1-384d-4429-8396-aaf9e828e171	Seeded User 10	user_seed_1771224920734	\N	\N	\N	\N	\N	\N	2026-02-16 06:55:20.851	2026-02-16 06:55:20.851
\.


--
-- Data for Name: PushConfig; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."PushConfig" (id, provider, credentials, enabled, "allowedTypes", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: PushTemplate; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."PushTemplate" (id, name, title, body, category, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: RefreshToken; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."RefreshToken" (id, "userId", token, "expiresAt", "createdAt") FROM stdin;
e0d84fa7-229b-463c-98e0-2d4cc14471c7	89eaec47-3a52-4f04-8885-f2b0f2f7aac1	eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiI4OWVhZWM0Ny0zYTUyLTRmMDQtODg4NS1mMmIwZjJmN2FhYzEiLCJlbWFpbCI6InVzZXIxQHhjbG9uZS5jb20iLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTc3MDk2ODA5NiwianRpIjoiNmZiYzY5NTItNDY0My00MGMzLWI2YWEtNGQ5YWU1NGI4NWRmIiwiZXhwIjoxNzcxNTcyODk2fQ.9ASltn4_HPJWiDNnaZf8YI5trdcMw1kaGQlRGKxa3DE	2026-02-20 07:34:56.343	2026-02-13 07:34:56.345
06a604d1-7695-4aa2-9d3d-30fda2ccd397	8c7d937e-7937-40fe-a8b2-018f3bc44ad6	eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiI4YzdkOTM3ZS03OTM3LTQwZmUtYThiMi0wMThmM2JjNDRhZDYiLCJlbWFpbCI6InVzZXIyQHhjbG9uZS5jb20iLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTc3MDk2ODA5NiwianRpIjoiMjMxMWM3NTUtOWYyNS00ZjIxLWExZmEtYzZlZDlkYmI4MjA1IiwiZXhwIjoxNzcxNTcyODk2fQ.Dmik6O8M8F7Hd55Q8WDZwLQ9IBjGKuNE4naeogaHwTM	2026-02-20 07:34:56.431	2026-02-13 07:34:56.432
3eb028dc-b8be-4d8c-99be-b7214e22edb1	8f6e3778-0927-415e-b1f1-835238f74aa6	eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiI4ZjZlMzc3OC0wOTI3LTQxNWUtYjFmMS04MzUyMzhmNzRhYTYiLCJlbWFpbCI6InVzZXIzQHhjbG9uZS5jb20iLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTc3MDk2ODA5NiwianRpIjoiMzk0ZTY4YzItYjFhZC00OWIxLWI4MTAtOGVkY2ZmOGY2ZjgzIiwiZXhwIjoxNzcxNTcyODk2fQ.x1rz4g1MkK3D9Ma2BkntyZYzgcEZjkkx3-NVBeoQZkQ	2026-02-20 07:34:56.504	2026-02-13 07:34:56.505
2985e52e-7983-46ee-94e4-2b1cb8f50888	1121d2bc-d95c-4d94-a235-564f37f23818	eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMTIxZDJiYy1kOTVjLTRkOTQtYTIzNS01NjRmMzdmMjM4MTgiLCJlbWFpbCI6InVzZXI0QHhjbG9uZS5jb20iLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTc3MDk2ODA5NiwianRpIjoiYzA5MTZmYTAtYWRiNS00Mjk1LWE2NTMtM2ZjZTdiNDI4MGVhIiwiZXhwIjoxNzcxNTcyODk2fQ.NlvfAWrhKCZHzSIGcoqlSA1uOKXylGPh_SzAkzCMsxs	2026-02-20 07:34:56.581	2026-02-13 07:34:56.582
36440b4e-cc1c-4bea-b272-f7c270a4f2cf	46a11b35-e002-4951-91a9-1e3858d94e51	eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiI0NmExMWIzNS1lMDAyLTQ5NTEtOTFhOS0xZTM4NThkOTRlNTEiLCJlbWFpbCI6InVzZXI1QHhjbG9uZS5jb20iLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTc3MDk2ODA5NiwianRpIjoiMjNlMzJjNjEtOTJlOS00ZDRhLWFiMmQtNWNhZDE3ZWViMWUwIiwiZXhwIjoxNzcxNTcyODk2fQ.iiaN5_akNUvqtthPtShb2tnpv6m84bKZoTMK2tcRm7U	2026-02-20 07:34:56.651	2026-02-13 07:34:56.652
852aa620-a196-4d8d-bb03-4dc09a93a2c4	7d784861-2cba-437c-8149-179aadb4b2fc	eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiI3ZDc4NDg2MS0yY2JhLTQzN2MtODE0OS0xNzlhYWRiNGIyZmMiLCJlbWFpbCI6InVzZXI2QHhjbG9uZS5jb20iLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTc3MDk2ODA5NiwianRpIjoiNmFkYzNjMmQtMGI0Yy00NWZiLWJhNzEtYTkxMGQxMmQwNGQ2IiwiZXhwIjoxNzcxNTcyODk2fQ.G2ra-lWTlUHFgov7lwvwr5FkfuB9ZcwbWDhJswJENdw	2026-02-20 07:34:56.73	2026-02-13 07:34:56.731
9fed9034-8767-4e78-93f3-6498a6b459aa	0b16e54e-2cc2-4876-af1b-19b38dc7e64b	eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIwYjE2ZTU0ZS0yY2MyLTQ4NzYtYWYxYi0xOWIzOGRjN2U2NGIiLCJlbWFpbCI6InVzZXI3QHhjbG9uZS5jb20iLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTc3MDk2ODA5NiwianRpIjoiMTA5MWZkMWUtNGYwMy00MDg2LTllOTEtZmM3OTJkMTUzOTc5IiwiZXhwIjoxNzcxNTcyODk2fQ.LVZvPiaWQiy3qe2tQ_DvXu6wlxi-wbbnWQMdt9K4ME8	2026-02-20 07:34:56.804	2026-02-13 07:34:56.805
ba631b91-c396-48b8-a05e-13073666332d	71be6ae4-8cb8-4b0a-9a34-f30117de683f	eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiI3MWJlNmFlNC04Y2I4LTRiMGEtOWEzNC1mMzAxMTdkZTY4M2YiLCJlbWFpbCI6InVzZXI4QHhjbG9uZS5jb20iLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTc3MDk2ODA5NiwianRpIjoiNjg1ZmQyN2UtZjNjZi00NWE5LThkYTMtOTc2ZDM3MjRjZmM0IiwiZXhwIjoxNzcxNTcyODk2fQ.wqu4Rd6Il3C6Af5KuhQWM11-jQShjS63lpEXtD192IQ	2026-02-20 07:34:56.879	2026-02-13 07:34:56.88
0b1e0976-99b4-4f17-bdca-f070a921248a	a4cc95d9-9418-4f9a-9c9c-58c8065f3664	eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJhNGNjOTVkOS05NDE4LTRmOWEtOWM5Yy01OGM4MDY1ZjM2NjQiLCJlbWFpbCI6InVzZXI5QHhjbG9uZS5jb20iLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTc3MDk2ODA5NiwianRpIjoiMGUyNGUzODktMDk2MC00Y2MyLTkzNzAtODNiMWFmZGJjZDlmIiwiZXhwIjoxNzcxNTcyODk2fQ.VveM6oU-Uqqdi8qdmrj7_DEtmoz-5pQP78xWB8mJJxU	2026-02-20 07:34:56.948	2026-02-13 07:34:56.949
b2e7d9cd-cc7d-4cc4-854a-f5ca875cd0ca	82f600f6-39d9-49c3-89d5-ac4e29dc2ebf	eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiI4MmY2MDBmNi0zOWQ5LTQ5YzMtODlkNS1hYzRlMjlkYzJlYmYiLCJlbWFpbCI6InVzZXIxMEB4Y2xvbmUuY29tIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3NzA5NjgwOTcsImp0aSI6ImZiMzYyZTZkLWQwM2QtNGVhZC1hMDYxLTFlMmY2NGE2ZGNiNyIsImV4cCI6MTc3MTU3Mjg5N30.nCUnR1x1clDgxskjjTjHAndhmWxSD2MRar2xp68x1GY	2026-02-20 07:34:57.016	2026-02-13 07:34:57.017
6ed1d2cc-7278-45c2-a320-f777cdcc5fd1	15bc5dc9-1012-4883-809e-33ed43b1b825	eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxNWJjNWRjOS0xMDEyLTQ4ODMtODA5ZS0zM2VkNDNiMWI4MjUiLCJlbWFpbCI6InVzZXIxMUB4Y2xvbmUuY29tIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3NzA5NjgwOTcsImp0aSI6IjcwOGM1ODFmLWZmMjEtNGYwNi1hYWY4LTFhMjI0ZDMzZmI2YSIsImV4cCI6MTc3MTU3Mjg5N30.OtaIwLgP4XAQBcPFrTlNhdzXam4SjLcZuGiMEV74mWE	2026-02-20 07:34:57.083	2026-02-13 07:34:57.084
e20f346e-8a57-4b7a-a21d-a06180808ae3	65e55936-8860-4319-a05e-cf16018e881e	eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiI2NWU1NTkzNi04ODYwLTQzMTktYTA1ZS1jZjE2MDE4ZTg4MWUiLCJlbWFpbCI6InVzZXIxMkB4Y2xvbmUuY29tIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3NzA5NjgwOTcsImp0aSI6ImM3YTZkNjUyLTFjNGQtNGNiOS1hODM1LWY1ZjI1ZTM2Mzc0MCIsImV4cCI6MTc3MTU3Mjg5N30.Wqqax0fY-WZwtweM4DZ_04Px218O-z538um2ZXOsqQo	2026-02-20 07:34:57.15	2026-02-13 07:34:57.151
571b6a1f-fa1e-43be-85a4-e6b3a58a6b92	af035db2-8b72-4af5-b4cc-144d37667d5d	eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJhZjAzNWRiMi04YjcyLTRhZjUtYjRjYy0xNDRkMzc2NjdkNWQiLCJlbWFpbCI6InVzZXIxM0B4Y2xvbmUuY29tIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3NzA5NjgwOTcsImp0aSI6ImVmMWMyODAxLWZkOGMtNDlhMS1hMmMwLTdmYWRhMTc5YTg4OCIsImV4cCI6MTc3MTU3Mjg5N30.tGZ-Mc-8wuWGqZSEMa506ZAXgm9uNiL0slw_aNHosCU	2026-02-20 07:34:57.217	2026-02-13 07:34:57.218
887758d7-5988-42d6-a35f-d86572990bd8	86c62ca6-3c33-4927-bfe3-7286993c0db6	eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiI4NmM2MmNhNi0zYzMzLTQ5MjctYmZlMy03Mjg2OTkzYzBkYjYiLCJlbWFpbCI6InVzZXIxNEB4Y2xvbmUuY29tIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3NzA5NjgwOTcsImp0aSI6ImY1YjY5NGJiLTQ5ZmItNGQ1ZS04ZThkLTc3ZjlhMjg4ZDM2MCIsImV4cCI6MTc3MTU3Mjg5N30.u7NN9oMhIAWio2qY7QcfnlDYm_aiTvNqbe4DsbUhEEI	2026-02-20 07:34:57.286	2026-02-13 07:34:57.287
352b33fe-7b3d-4c69-983a-40c88d20e311	567abd64-e4ea-46b8-ba94-b5f371bc1044	eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiI1NjdhYmQ2NC1lNGVhLTQ2YjgtYmE5NC1iNWYzNzFiYzEwNDQiLCJlbWFpbCI6InVzZXIxNUB4Y2xvbmUuY29tIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3NzA5NjgwOTcsImp0aSI6IjZhZDM0NWQ5LTIwNjEtNDk4MC1iMTE2LTg4YzA0NmQxZGE0MCIsImV4cCI6MTc3MTU3Mjg5N30.pMF1sedW_SJcY-gA1dHdLa75DIKPyDPPluJRFLQcpls	2026-02-20 07:34:57.353	2026-02-13 07:34:57.354
e05d2a16-fd7e-4074-8faa-380bd22084de	65aabba9-80d5-4cfb-a8a2-f6b26fcdaaa7	eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiI2NWFhYmJhOS04MGQ1LTRjZmItYThhMi1mNmIyNmZjZGFhYTciLCJlbWFpbCI6InVzZXIxNkB4Y2xvbmUuY29tIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3NzA5NjgwOTcsImp0aSI6IjNiYTAyNmIwLTkzODYtNDMyOC04ZDg3LTliYzBjZWY3OWRlMiIsImV4cCI6MTc3MTU3Mjg5N30.Rz64hjta7T_jZWJ8YC9vaCfFZuK4BsWkoIteFs76fsc	2026-02-20 07:34:57.42	2026-02-13 07:34:57.421
0b585919-6b95-4caa-b3e4-59b942845173	c201d03b-c51b-4789-9673-0e73040580c7	eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJjMjAxZDAzYi1jNTFiLTQ3ODktOTY3My0wZTczMDQwNTgwYzciLCJlbWFpbCI6InVzZXIxN0B4Y2xvbmUuY29tIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3NzA5NjgwOTcsImp0aSI6IjMyZDY1NmQ2LTRjYjctNDg3Ny04MmVjLTc3MGRhYzRlOGM2MSIsImV4cCI6MTc3MTU3Mjg5N30.mrTOCZ7amhe5a5uUZzHAVHU68QFGpp9-1D6wdyazWT0	2026-02-20 07:34:57.485	2026-02-13 07:34:57.486
0f369c90-612d-48fb-8669-a824d41a934e	9193d18a-7b88-4525-b1b5-def43ae823af	eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiI5MTkzZDE4YS03Yjg4LTQ1MjUtYjFiNS1kZWY0M2FlODIzYWYiLCJlbWFpbCI6InVzZXIxOEB4Y2xvbmUuY29tIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3NzA5NjgwOTcsImp0aSI6ImI3YTAxOGMzLTQ4NGQtNDVkZS05Y2IyLTQ0Y2VhYmFlNmRiOSIsImV4cCI6MTc3MTU3Mjg5N30.ChPrHlFpBu4TJiWqVJtQGADcymjsi4zsUv2As7fLQyI	2026-02-20 07:34:57.551	2026-02-13 07:34:57.552
6bde7dd4-7783-4cc8-8887-c4d043ba4954	9d602694-52db-48d3-b31e-59a1061c7aad	eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiI5ZDYwMjY5NC01MmRiLTQ4ZDMtYjMxZS01OWExMDYxYzdhYWQiLCJlbWFpbCI6InVzZXIxOUB4Y2xvbmUuY29tIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3NzA5NjgwOTcsImp0aSI6ImEyOTgyZjg1LTYzZGEtNGMzNi1hMDk0LWVhOGE1MzEzODU5YSIsImV4cCI6MTc3MTU3Mjg5N30.5P5NWig1rfOzxMqYo9JVdqBGsix6c7GiC_po3WQHPe8	2026-02-20 07:34:57.617	2026-02-13 07:34:57.618
eb486340-7d69-43e4-824b-d6db7c954022	cc31f858-e5dd-4758-a078-67494637695a	eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJjYzMxZjg1OC1lNWRkLTQ3NTgtYTA3OC02NzQ5NDYzNzY5NWEiLCJlbWFpbCI6InVzZXIyMEB4Y2xvbmUuY29tIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3NzA5NjgwOTcsImp0aSI6ImRjZmQzM2JiLWVjOWUtNDlhMC1iZmE4LTRmMjZkZjc2MmEwYyIsImV4cCI6MTc3MTU3Mjg5N30.w2In7ojIxxXEACk2d8Oybqjtgz2kStuIAm0x6oGGEeA	2026-02-20 07:34:57.682	2026-02-13 07:34:57.683
fd56d2ba-e1cb-4cbd-9cc6-29ef195fe452	6bd53601-b4c4-46db-a6ff-a86d5186a898	eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiI2YmQ1MzYwMS1iNGM0LTQ2ZGItYTZmZi1hODZkNTE4NmE4OTgiLCJlbWFpbCI6InVzZXIyMUB4Y2xvbmUuY29tIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3NzA5NjgwOTcsImp0aSI6ImMxMTZkMWFhLTJjMmUtNDViYy1hN2Y1LWFhZjdhNmIwNGVjMSIsImV4cCI6MTc3MTU3Mjg5N30.Hdq9ZmiP2m6jLfAa1V5s0FdWMlm9kU_91YufIkvbeCo	2026-02-20 07:34:57.75	2026-02-13 07:34:57.751
9bfbfd1c-b248-4969-a7ba-8c2f230f6078	2def704a-bb45-4236-8081-127083acc86b	eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIyZGVmNzA0YS1iYjQ1LTQyMzYtODA4MS0xMjcwODNhY2M4NmIiLCJlbWFpbCI6InVzZXIyMkB4Y2xvbmUuY29tIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3NzA5NjgwOTcsImp0aSI6ImE5MTZlYzY2LTgxMzAtNGMyMy04OTM5LWJhNDk0NDM2Y2EwMSIsImV4cCI6MTc3MTU3Mjg5N30.oFJocHCMT8WLrwDmlX8XvhiML9U3dOEYFlDwW2Qw-_g	2026-02-20 07:34:57.816	2026-02-13 07:34:57.818
c8f1714a-2ed5-45fe-8c17-569a16707cf9	6459a7bb-e9ca-4b29-aa74-476e5b2a0604	eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiI2NDU5YTdiYi1lOWNhLTRiMjktYWE3NC00NzZlNWIyYTA2MDQiLCJlbWFpbCI6InVzZXIyM0B4Y2xvbmUuY29tIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3NzA5NjgwOTcsImp0aSI6ImU3MGY2MWZlLWMzNmEtNGFlZi04MTUyLTVlOWY4YjRjZDMwNiIsImV4cCI6MTc3MTU3Mjg5N30.rJYJ1d2CNg-e2xS9a1vXI18oishgXfAs0Zufs_q96XU	2026-02-20 07:34:57.884	2026-02-13 07:34:57.885
9b531a27-4836-4d58-86d1-827eb3038e22	03eae847-3a7c-46c9-a4a1-1fddb44a657b	eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIwM2VhZTg0Ny0zYTdjLTQ2YzktYTRhMS0xZmRkYjQ0YTY1N2IiLCJlbWFpbCI6InVzZXIyNUB4Y2xvbmUuY29tIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3NzA5NjgwOTgsImp0aSI6IjNmZjllY2MzLTJmOTQtNGNiZi04MjliLTkwOTFlYzVjNTc2YSIsImV4cCI6MTc3MTU3Mjg5OH0.D43mT6mZmFxzG9hUpbjb0SbAVf2ZHNJnIoE1JAsbTxs	2026-02-20 07:34:58.025	2026-02-13 07:34:58.026
b3266edc-4eba-471e-9d37-d712031f7a0d	9737b04c-41c7-4d45-9666-495714816ac5	eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiI5NzM3YjA0Yy00MWM3LTRkNDUtOTY2Ni00OTU3MTQ4MTZhYzUiLCJlbWFpbCI6InVzZXIyNkB4Y2xvbmUuY29tIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3NzA5NjgwOTgsImp0aSI6IjE4NzA4ODI5LWRiM2EtNGFiYi05NmJkLWQwNDZlNjMyNzRhMiIsImV4cCI6MTc3MTU3Mjg5OH0.C1--PZRplEseEK2Y_YzshUQiV28IgO8a5t4rShx_tN4	2026-02-20 07:34:58.091	2026-02-13 07:34:58.092
7efbbd92-f2c1-4630-b418-1813ec40fcab	ad7f059d-c79e-4dee-b35e-79a8d890159c	eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJhZDdmMDU5ZC1jNzllLTRkZWUtYjM1ZS03OWE4ZDg5MDE1OWMiLCJlbWFpbCI6InVzZXIyN0B4Y2xvbmUuY29tIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3NzA5NjgwOTgsImp0aSI6Ijk1YmM3YWVmLTc4ZTItNDFmZi1hMDlmLWI0ZDczYWM2YTcwYSIsImV4cCI6MTc3MTU3Mjg5OH0.8e_SCCDQW2yMoS1cVq-Bdfl-m1NaMIoYmpzEDgiROE4	2026-02-20 07:34:58.158	2026-02-13 07:34:58.159
aa439aea-0a51-4c65-84fd-598b0b1350dc	20ccc387-9723-4dd7-b065-54850d217448	eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIyMGNjYzM4Ny05NzIzLTRkZDctYjA2NS01NDg1MGQyMTc0NDgiLCJlbWFpbCI6InVzZXIyOEB4Y2xvbmUuY29tIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3NzA5NjgwOTgsImp0aSI6ImU2NjI5OGNmLTM2MTQtNGJhZC05NGMzLTE1YmQzNzExNDQwNCIsImV4cCI6MTc3MTU3Mjg5OH0.aHVjvULnjiUs1Tw63Sf7oqZCqxyrxQvuWkncAilVtHY	2026-02-20 07:34:58.225	2026-02-13 07:34:58.226
4e124cd1-893a-45cd-95c4-fed2cd1dee01	6c790152-af53-4590-90e9-cdcd41377bcf	eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiI2Yzc5MDE1Mi1hZjUzLTQ1OTAtOTBlOS1jZGNkNDEzNzdiY2YiLCJlbWFpbCI6InVzZXIyOUB4Y2xvbmUuY29tIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3NzA5NjgwOTgsImp0aSI6IjZmYTFmZDI1LTc2MTEtNDc2Zi04Mjc4LTE3YjlkYjVkNWNkNiIsImV4cCI6MTc3MTU3Mjg5OH0.g3FohsMebJLGt8WHrannY2lP38Uwmm7k3SKUNYHbnqU	2026-02-20 07:34:58.291	2026-02-13 07:34:58.292
604a25ad-fcb7-4e99-84f9-3444cc68f81c	d454ca87-5582-4d0b-a955-10be038aa300	eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJkNDU0Y2E4Ny01NTgyLTRkMGItYTk1NS0xMGJlMDM4YWEzMDAiLCJlbWFpbCI6InVzZXIzMUB4Y2xvbmUuY29tIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3NzA5NjgwOTgsImp0aSI6IjIyZWNjZDc2LTVkMTYtNDJlMi05OTMyLTA1MWEyY2ZmNjQ0OSIsImV4cCI6MTc3MTU3Mjg5OH0.rSyeLhGm_w68C8IQ9cRtYf09bI_yz2Cm2_NaOg-7k3I	2026-02-20 07:34:58.422	2026-02-13 07:34:58.423
d04a7e64-d32b-4c74-8167-8c3461990728	327555ab-f96b-42a8-aee7-9fcfd20eb462	eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIzMjc1NTVhYi1mOTZiLTQyYTgtYWVlNy05ZmNmZDIwZWI0NjIiLCJlbWFpbCI6InVzZXIzM0B4Y2xvbmUuY29tIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3NzA5NjgwOTgsImp0aSI6Ijg4MmU1M2JmLWNjODgtNDdiZi1hYzIwLWY1YWM0NTVhOTMwOSIsImV4cCI6MTc3MTU3Mjg5OH0.Rg0rCiXmGUN6vxVvzsSn-ISXr0O_iZUrNKeAt_Oitd0	2026-02-20 07:34:58.553	2026-02-13 07:34:58.554
76f0bc65-e79d-4971-a94f-f31dc5adad38	9d179ac2-153c-4cda-8bb6-acda03178f4d	eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiI5ZDE3OWFjMi0xNTNjLTRjZGEtOGJiNi1hY2RhMDMxNzhmNGQiLCJlbWFpbCI6InVzZXIzNEB4Y2xvbmUuY29tIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3NzA5NjgwOTgsImp0aSI6IjY1NDhmMzJkLTVhMzItNDVkYi1iZThiLTBhODdkZThiNDVkNyIsImV4cCI6MTc3MTU3Mjg5OH0.Xm-BTofKVU-YsoyX6N6BCJ1VmOTVTqlILSiLX5aNPcU	2026-02-20 07:34:58.618	2026-02-13 07:34:58.619
8de8ade4-03ee-48cf-a12d-7a57273a8c1a	aba2c69b-10d9-41e6-be18-503b3504e565	eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJhYmEyYzY5Yi0xMGQ5LTQxZTYtYmUxOC01MDNiMzUwNGU1NjUiLCJlbWFpbCI6InVzZXIzNUB4Y2xvbmUuY29tIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3NzA5NjgwOTgsImp0aSI6IjdiYTI5N2Q3LWRkOWEtNDQzMC05OGYzLWRiNzBhMDZjZjEyZCIsImV4cCI6MTc3MTU3Mjg5OH0.cX_kT34gMWQiMsxfFYMNQgQp35QshP066NUqnlvGnP0	2026-02-20 07:34:58.684	2026-02-13 07:34:58.685
dd8df631-8ae9-42ca-bdb3-c932a25fb210	fc0cf2f3-d2f6-4567-9129-b01af2a4215d	eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJmYzBjZjJmMy1kMmY2LTQ1NjctOTEyOS1iMDFhZjJhNDIxNWQiLCJlbWFpbCI6InVzZXIzN0B4Y2xvbmUuY29tIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3NzA5NjgwOTgsImp0aSI6ImNkMmMwMGUxLWZjZjctNDhhYi04MGE5LTIzNGNmZGQ4NWU1ZiIsImV4cCI6MTc3MTU3Mjg5OH0.jKmbEzVWSfntX7K7QnPcdfVb4rjEg5YrWMLzfrk2Ce8	2026-02-20 07:34:58.816	2026-02-13 07:34:58.817
06a4ef0c-cabf-4adb-90ed-7701f5e1d1ef	582b8066-699c-4d7d-8fc5-12932fc709c4	eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiI1ODJiODA2Ni02OTljLTRkN2QtOGZjNS0xMjkzMmZjNzA5YzQiLCJlbWFpbCI6InVzZXIzOUB4Y2xvbmUuY29tIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3NzA5NjgwOTgsImp0aSI6ImMzMmY2NDg2LTQ5ZTYtNGJhZC1hYzY2LWMzNjNjMjM5MjM5YiIsImV4cCI6MTc3MTU3Mjg5OH0.hAUCHHZoNKrOJ2NWf-RtL5P-rTIBTlQoPycw4x1hN7I	2026-02-20 07:34:58.95	2026-02-13 07:34:58.951
7949a6f4-2d7e-47a6-9d93-46e9d03e23db	0b42f4fb-020d-42f8-b7e1-5129afd74369	eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIwYjQyZjRmYi0wMjBkLTQyZjgtYjdlMS01MTI5YWZkNzQzNjkiLCJlbWFpbCI6InVzZXI0MUB4Y2xvbmUuY29tIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3NzA5NjgwOTksImp0aSI6ImE4ZjhjMjNhLTM0MTctNDlhNC1hYWQ3LTRlOWEzYmMwMTQ5NCIsImV4cCI6MTc3MTU3Mjg5OX0.AbgBzb2qtAJR2ztdnNPQ2rZPgdAwwws9opHHjtI2p1I	2026-02-20 07:34:59.087	2026-02-13 07:34:59.088
4ba5985c-5393-436f-9190-b283414a9f17	f4528bdc-7476-48a8-8895-d5e0b2afc776	eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJmNDUyOGJkYy03NDc2LTQ4YTgtODg5NS1kNWUwYjJhZmM3NzYiLCJlbWFpbCI6InVzZXI0MkB4Y2xvbmUuY29tIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3NzA5NjgwOTksImp0aSI6IjNhMGM4MDJhLTZiNTUtNDMwNy1hY2FhLWQ1YTYzNmM4YjA2MyIsImV4cCI6MTc3MTU3Mjg5OX0.L6oW1ikencOPC5lh3gpvVWVhzNhoFzU6mhL9WA0gDTs	2026-02-20 07:34:59.153	2026-02-13 07:34:59.154
3a93ecf4-a10e-4c41-8a38-cd7676a18920	15ca20cc-ca0e-422d-a242-0b11b0478f31	eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxNWNhMjBjYy1jYTBlLTQyMmQtYTI0Mi0wYjExYjA0NzhmMzEiLCJlbWFpbCI6InVzZXI0NEB4Y2xvbmUuY29tIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3NzA5NjgwOTksImp0aSI6Ijc0ZTM0OTI1LTA4ZDYtNGRiYS05NDM4LTBjYTE4NmJjNGE4YiIsImV4cCI6MTc3MTU3Mjg5OX0.s7ugQuQHyDwRA65afGLmVvFGYigvCqU5cg1cKhYV6eM	2026-02-20 07:34:59.296	2026-02-13 07:34:59.298
c85cc70b-b4a4-42ca-847a-b52f0283fcfe	1264f8cb-8009-476d-9486-d7c17bc5c3fb	eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjY0ZjhjYi04MDA5LTQ3NmQtOTQ4Ni1kN2MxN2JjNWMzZmIiLCJlbWFpbCI6InVzZXI0NUB4Y2xvbmUuY29tIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3NzA5NjgwOTksImp0aSI6IjI3MWI4OGYxLWE3NDQtNDFjZi1iNDk0LTZjNWRlNjdlMDMyZiIsImV4cCI6MTc3MTU3Mjg5OX0.ZFZA3g_vgdD8b0HrlAl-MGe3X9Dp-62-Mgj77Kp1MR8	2026-02-20 07:34:59.363	2026-02-13 07:34:59.364
fda48f33-441a-49c4-af78-9e94e277f746	24036fdd-104c-4715-919b-fe984200ea62	eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIyNDAzNmZkZC0xMDRjLTQ3MTUtOTE5Yi1mZTk4NDIwMGVhNjIiLCJlbWFpbCI6InVzZXIyNEB4Y2xvbmUuY29tIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3NzA5NjgwOTcsImp0aSI6IjY3YzQ1ZjFjLWM4ZWItNGFlMS1hMDg4LTQ1MGQwMWFmMzA3YyIsImV4cCI6MTc3MTU3Mjg5N30.IOXd5bJg7jMpvqMtlBxFESv1RoQpGSzER1GgFe1ZelI	2026-02-20 07:34:57.95	2026-02-13 07:34:57.951
f20a8885-c4a2-465c-b412-2e30d9ff5a51	f722d71f-3b20-4488-9a55-f23f40635d01	eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJmNzIyZDcxZi0zYjIwLTQ0ODgtOWE1NS1mMjNmNDA2MzVkMDEiLCJlbWFpbCI6InVzZXIzMEB4Y2xvbmUuY29tIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3NzA5NjgwOTgsImp0aSI6ImJlMWE1ZTBlLWJhMWItNDMwNy04MDMwLTRiYTg2NDY5NWFlNSIsImV4cCI6MTc3MTU3Mjg5OH0.weUipXRjZ5FcDaoLq8hFHupRA-WFlLttDY5GGQEWHPU	2026-02-20 07:34:58.357	2026-02-13 07:34:58.358
1aa36889-f5d4-4067-b2d7-4de72945314d	ac0fdf99-1f5b-4014-861f-029b1a7d7c86	eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJhYzBmZGY5OS0xZjViLTQwMTQtODYxZi0wMjliMWE3ZDdjODYiLCJlbWFpbCI6InVzZXIzMkB4Y2xvbmUuY29tIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3NzA5NjgwOTgsImp0aSI6ImYyOGEzMTA2LTgwYzItNDk2Ny04M2E5LTBkYzVhNDUyMmNiOSIsImV4cCI6MTc3MTU3Mjg5OH0.mai-Guj3p2jH6mHcFvJKilEfgRN5whn1xy_u4rqTYB0	2026-02-20 07:34:58.487	2026-02-13 07:34:58.488
f95e1838-11b6-4861-a859-e6209089cfef	80295c5e-b05e-470b-b48a-858695a9d9ff	eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiI4MDI5NWM1ZS1iMDVlLTQ3MGItYjQ4YS04NTg2OTVhOWQ5ZmYiLCJlbWFpbCI6InVzZXIzNkB4Y2xvbmUuY29tIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3NzA5NjgwOTgsImp0aSI6IjEwMWY5MWU4LTdlOWUtNGUyOC1iMzIzLTJhYmM4YTExZjBiNiIsImV4cCI6MTc3MTU3Mjg5OH0.y_IqU4GWIF_QvTUAw-cFegAbNtSepIlBhfi3djasx10	2026-02-20 07:34:58.75	2026-02-13 07:34:58.751
7a1448e0-52d7-4ae2-93ee-45964ddcd122	acfd61dc-781b-4fee-a2e1-ac5914dfd6d2	eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJhY2ZkNjFkYy03ODFiLTRmZWUtYTJlMS1hYzU5MTRkZmQ2ZDIiLCJlbWFpbCI6InVzZXIzOEB4Y2xvbmUuY29tIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3NzA5NjgwOTgsImp0aSI6ImRjNDM3NTIyLTk5NzYtNGNkZS05YTVmLWRjMDYxYjkyZmE2ZCIsImV4cCI6MTc3MTU3Mjg5OH0.slNlJKRlmXhh3LV827WcPfdxLcluqcBUHU5TV4YFE-s	2026-02-20 07:34:58.882	2026-02-13 07:34:58.883
31a78544-5d83-4669-bc42-15c013f62752	895f36ab-1724-4ae6-9546-6c1426f847df	eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiI4OTVmMzZhYi0xNzI0LTRhZTYtOTU0Ni02YzE0MjZmODQ3ZGYiLCJlbWFpbCI6InVzZXI0MEB4Y2xvbmUuY29tIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3NzA5NjgwOTksImp0aSI6IjUzNDAzNTBjLTQyNzgtNDU5Yi1iYzhkLWU1NWJjMGNjOWYyMyIsImV4cCI6MTc3MTU3Mjg5OX0.zQiVhWEUEPLLoPJpon9h0FkdPu-MXQitcxdntYT8og0	2026-02-20 07:34:59.021	2026-02-13 07:34:59.022
be40f2a0-23e0-4a6c-a58b-3675bef5bac9	d27e36e7-09d2-4400-8207-b343866044cd	eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJkMjdlMzZlNy0wOWQyLTQ0MDAtODIwNy1iMzQzODY2MDQ0Y2QiLCJlbWFpbCI6InVzZXI0M0B4Y2xvbmUuY29tIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3NzA5NjgwOTksImp0aSI6Ijc0OTlhM2FhLTU4NGUtNDdlNC05NjAwLTMzOTBhM2YzNDc1MSIsImV4cCI6MTc3MTU3Mjg5OX0.B3nyQ1AcoUxOSewsOtIwVHbjrU9UD7B8QP717KbQovk	2026-02-20 07:34:59.229	2026-02-13 07:34:59.23
a531a45b-dc2e-49b3-a589-3388810b6726	9eb598ff-d969-41b4-8716-7f9ecd263841	eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiI5ZWI1OThmZi1kOTY5LTQxYjQtODcxNi03ZjllY2QyNjM4NDEiLCJlbWFpbCI6InVzZXI0NkB4Y2xvbmUuY29tIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3NzA5NjgwOTksImp0aSI6ImEyNTIyMmY3LTk3NTQtNDk1Ny05NjMyLTM0YzFmYTg3ZTIxZiIsImV4cCI6MTc3MTU3Mjg5OX0.THoYhkAWU_bsCohQV3mniRPyR8ES0Sa8Dm_ujSJHx7I	2026-02-20 07:34:59.427	2026-02-13 07:34:59.428
13b4bf59-698b-4f48-9977-1880e7e4ab17	0205b312-bd33-4bce-9f86-c35295beeefe	eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIwMjA1YjMxMi1iZDMzLTRiY2UtOWY4Ni1jMzUyOTViZWVlZmUiLCJlbWFpbCI6InVzZXI0N0B4Y2xvbmUuY29tIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3NzA5NjgwOTksImp0aSI6IjI2MGMyNmU1LTdmNzUtNDNmYi05NzhmLWExMWZmYWM4MmExOCIsImV4cCI6MTc3MTU3Mjg5OX0.28wO_IWit6B3gu0XXpCs4wK8djXliEpMmVXagMD9CdY	2026-02-20 07:34:59.493	2026-02-13 07:34:59.495
50d7c0ab-3a79-41c2-a59e-773a707e2c0f	19b1025a-8b3a-4c34-b08e-a0edf0f41d07	eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxOWIxMDI1YS04YjNhLTRjMzQtYjA4ZS1hMGVkZjBmNDFkMDciLCJlbWFpbCI6InVzZXI0OEB4Y2xvbmUuY29tIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3NzA5NjgwOTksImp0aSI6ImJmYzc2NmNmLTRmNjgtNDFkNS1hYTdlLWE2MTNiZTE2NjFiMiIsImV4cCI6MTc3MTU3Mjg5OX0.3ljtbXe_zW0I8sAhl-_WXryYVAkFYRRrmZtoOJ3ae4c	2026-02-20 07:34:59.559	2026-02-13 07:34:59.56
d458124e-a8d6-42eb-83ac-2bf068a28f9e	88fcd25a-146f-43de-ba88-7474efbdfa93	eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiI4OGZjZDI1YS0xNDZmLTQzZGUtYmE4OC03NDc0ZWZiZGZhOTMiLCJlbWFpbCI6InVzZXI0OUB4Y2xvbmUuY29tIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3NzA5NjgwOTksImp0aSI6ImVmNzA2MmZlLWZkMzYtNGIwYS04YTA0LWMzN2YyM2RhMjlhNSIsImV4cCI6MTc3MTU3Mjg5OX0.WTMqGaJBKWZbvAlY_RaKCSeeOz-GsCJa_N4Xls9l4ZY	2026-02-20 07:34:59.624	2026-02-13 07:34:59.625
29972b3c-ada9-43b4-b4e7-2696d051507a	56534c56-3c4b-49bf-912c-ddb78e15c549	eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiI1NjUzNGM1Ni0zYzRiLTQ5YmYtOTEyYy1kZGI3OGUxNWM1NDkiLCJlbWFpbCI6InVzZXI1MEB4Y2xvbmUuY29tIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3NzA5NjgwOTksImp0aSI6IjNmNDM3NGM2LTU5MDYtNGMwOS05MDY2LTNmYzJiMjQ2MzZjZSIsImV4cCI6MTc3MTU3Mjg5OX0.SAfxSDPIVyzNf8Ya-jlF4HvqQDZm8-zLjW2cluUGy9A	2026-02-20 07:34:59.69	2026-02-13 07:34:59.691
abe5d6a3-2cf9-4a2d-9f0e-b6d4fe057904	89eaec47-3a52-4f04-8885-f2b0f2f7aac1	eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiI4OWVhZWM0Ny0zYTUyLTRmMDQtODg4NS1mMmIwZjJmN2FhYzEiLCJlbWFpbCI6InVzZXIxQHhjbG9uZS5jb20iLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTc3MTIyNDM0MSwianRpIjoiODVhYTdlZmUtOTY5OS00OGMzLThjODEtM2Y4MDEyM2Y4MDMwIiwiZXhwIjoxNzcxODI5MTQxfQ.Ia8tOyZpHvcwQ5BxxjBJMItrii11w8A1H0X8s1QUjaU	2026-02-23 06:45:41.074	2026-02-16 06:45:41.078
a6d9ff59-5e13-4448-97de-496e3ef55979	61f683e2-1203-452b-a637-53429b67ac6b	eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiI2MWY2ODNlMi0xMjAzLTQ1MmItYTYzNy01MzQyOWI2N2FjNmIiLCJlbWFpbCI6InNlZWRlZF91c2VyXzE3NzEyMjQ0Njk2MDVAZXhhbXBsZS5jb20iLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTc3MTIyNDQ2OSwianRpIjoiNjNhMGFlNmYtZTJjMy00MWViLThkMjQtYWZjMDgzYzhlZmNkIiwiZXhwIjoxNzcxODI5MjY5fQ.e2q6mgOTr61xrMf60RMA1bwxnX_Z38WOBc8SOz2ILJU	2026-02-23 06:47:49.795	2026-02-16 06:47:49.797
57a08491-6375-4eef-8cbf-c0517a82ef23	33ac3758-54df-4719-a14d-ff9262a51a76	eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIzM2FjMzc1OC01NGRmLTQ3MTktYTE0ZC1mZjkyNjJhNTFhNzYiLCJlbWFpbCI6InNlZWRlZF91c2VyXzE3NzEyMjQ0Njk4NjBAZXhhbXBsZS5jb20iLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTc3MTIyNDQ2OSwianRpIjoiMjE2ZmE1OTItNjk3NC00OTU5LTkyZjctYjUwMGFlYzhkODRiIiwiZXhwIjoxNzcxODI5MjY5fQ.DzkjKQyvoELy85w5z_cW2f2YlrQPZIhGjSEHH7QBdhQ	2026-02-23 06:47:49.999	2026-02-16 06:47:50.002
d0fb570c-4ca0-48b5-8a86-87239eeac047	d661946d-d6c7-4847-adec-d279d139947d	eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJkNjYxOTQ2ZC1kNmM3LTQ4NDctYWRlYy1kMjc5ZDEzOTk0N2QiLCJlbWFpbCI6InNlZWRlZF91c2VyXzE3NzEyMjQ0NzAwMzhAZXhhbXBsZS5jb20iLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTc3MTIyNDQ3MCwianRpIjoiM2U1NDJiNzMtZjJhOS00NDcwLWIzMTctYzNhM2Q5NWJiYmYxIiwiZXhwIjoxNzcxODI5MjcwfQ.x-wYYGNib_XN3gyV304wIfHOsY8CzR_06NJC6spf5ww	2026-02-23 06:47:50.18	2026-02-16 06:47:50.182
b19e521d-ed17-414c-b82b-f6510d283acd	c7b389bd-2036-4170-8b2d-8b232df39c14	eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJjN2IzODliZC0yMDM2LTQxNzAtOGIyZC04YjIzMmRmMzljMTQiLCJlbWFpbCI6InNlZWRlZF91c2VyXzE3NzEyMjQ0NzAyMDBAZXhhbXBsZS5jb20iLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTc3MTIyNDQ3MCwianRpIjoiMWY3YTNmYzItMjFkOC00NDc3LTk1MzQtODdiMzIwYzRkNjM4IiwiZXhwIjoxNzcxODI5MjcwfQ.PnAt6Lqqe8oEYh998t6_gucCG5QdVl_GJdbqpx2m4Lk	2026-02-23 06:47:50.329	2026-02-16 06:47:50.332
bd7a96e8-719d-4de8-a72e-2fe2e88f0131	a3f1933f-244c-42fd-8ae7-29fac64268d8	eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJhM2YxOTMzZi0yNDRjLTQyZmQtOGFlNy0yOWZhYzY0MjY4ZDgiLCJlbWFpbCI6InNlZWRlZF91c2VyXzE3NzEyMjQ0NzAzNjRAZXhhbXBsZS5jb20iLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTc3MTIyNDQ3MCwianRpIjoiZDczZDU5OWQtZWU1MS00MzI0LTg5NDAtNDE5NzRiNTMxMTk4IiwiZXhwIjoxNzcxODI5MjcwfQ.ydgoAeuNvFYEVNLLS074JHqPb3m2MHSFt_gijok-chg	2026-02-23 06:47:50.482	2026-02-16 06:47:50.485
b58b4bbe-1c0f-42fb-9fb7-7c4736c400b4	c05fee46-e614-44b5-ae3e-9475eacb3e23	eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJjMDVmZWU0Ni1lNjE0LTQ0YjUtYWUzZS05NDc1ZWFjYjNlMjMiLCJlbWFpbCI6InNlZWRlZF91c2VyXzE3NzEyMjQ0NzA1MDZAZXhhbXBsZS5jb20iLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTc3MTIyNDQ3MCwianRpIjoiNzk0N2ZjNTgtMTUzMi00M2ZlLWFiMDQtNzVmOTllN2Q3OTExIiwiZXhwIjoxNzcxODI5MjcwfQ.he9Wq25-uTQB1-6-K2L_BOn_9q8cUkmIht1rzt23U_U	2026-02-23 06:47:50.642	2026-02-16 06:47:50.645
2a9980ad-94af-47d0-bd37-9e44e1dd1d91	9786dd2c-7021-4948-a3db-17a14318edb0	eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiI5Nzg2ZGQyYy03MDIxLTQ5NDgtYTNkYi0xN2ExNDMxOGVkYjAiLCJlbWFpbCI6InNlZWRlZF91c2VyXzE3NzEyMjQ0NzA2ODhAZXhhbXBsZS5jb20iLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTc3MTIyNDQ3MCwianRpIjoiYTAxYmExZjAtOTViNi00ZTBhLTk1ZmUtNWNlZThlODUwNzc3IiwiZXhwIjoxNzcxODI5MjcwfQ.e39V-TDf7hLOhu5ANsmnboWXXMmj3lApD_8_ZF9N9Ss	2026-02-23 06:47:50.815	2026-02-16 06:47:50.817
e8162b16-c4da-48f3-88e6-9174a9f35837	9d57e20d-4791-4937-afe2-31eb1c6a6971	eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiI5ZDU3ZTIwZC00NzkxLTQ5MzctYWZlMi0zMWViMWM2YTY5NzEiLCJlbWFpbCI6InNlZWRlZF91c2VyXzE3NzEyMjQ0NzA5OTRAZXhhbXBsZS5jb20iLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTc3MTIyNDQ3MSwianRpIjoiZTcxODU3MTAtMjQ2Ni00ZTgzLTg1ODYtMjI1YzNhZDVhMWVmIiwiZXhwIjoxNzcxODI5MjcxfQ.4LVs28zY5FUVyoyiQsnGLGAf4zDfyEEuDFt_jA3I-Eg	2026-02-23 06:47:51.139	2026-02-16 06:47:51.141
58e59b97-06f2-48a1-b511-0ed807863458	7c3a4bfd-6033-4a79-b2a8-a4c6ac5d23bf	eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiI3YzNhNGJmZC02MDMzLTRhNzktYjJhOC1hNGM2YWM1ZDIzYmYiLCJlbWFpbCI6InNlZWRlZF91c2VyXzE3NzEyMjQ0NzExNjdAZXhhbXBsZS5jb20iLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTc3MTIyNDQ3MSwianRpIjoiOWI0NTgwY2YtZjhmYS00MGExLThmOTAtMmQzMDE1YTUxM2QxIiwiZXhwIjoxNzcxODI5MjcxfQ.0K1HGK9h4-NVaJRnfq79Z6DPqQCOwbuavnuWS-JVZWw	2026-02-23 06:47:51.275	2026-02-16 06:47:51.277
c97af509-ab4e-4ab9-8bc9-d68521d5acca	2ec81ee3-3de4-456e-8cb3-327747ece04c	eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIyZWM4MWVlMy0zZGU0LTQ1NmUtOGNiMy0zMjc3NDdlY2UwNGMiLCJlbWFpbCI6InNlZWRlZF91c2VyXzE3NzEyMjQ0NzA4MzhAZXhhbXBsZS5jb20iLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTc3MTIyNDQ3MCwianRpIjoiOWU5NzkxYTItZDIwYS00ZDU0LTlhODktNmY2ZDk2YWYyODEwIiwiZXhwIjoxNzcxODI5MjcwfQ.dLSsPmTb4TXj4dVzV_OyckSUs65EMJaTKsy92a70AYw	2026-02-23 06:47:50.963	2026-02-16 06:47:50.965
7127f872-f7df-4c01-bf67-f66f0de27f58	2ec81ee3-3de4-456e-8cb3-327747ece04c	eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIyZWM4MWVlMy0zZGU0LTQ1NmUtOGNiMy0zMjc3NDdlY2UwNGMiLCJlbWFpbCI6InNlZWRlZF91c2VyXzE3NzEyMjQ0NzA4MzhAZXhhbXBsZS5jb20iLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTc3MTIyNDcxNiwianRpIjoiOWNkNGE3NzQtN2I5OS00YWM1LTg3ODEtMDI0YzE5NTViMWJmIiwiZXhwIjoxNzcxODI5NTE2fQ.TA1-XNG7HBHS83qqE4_CBCmUfcINHACWwJD9ztk4sR4	2026-02-23 06:51:56.837	2026-02-16 06:51:56.838
58757e15-125a-4ff6-9d26-bd699bf63aca	46c25209-b6c8-46fa-9de1-9b4fd3cef226	eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiI0NmMyNTIwOS1iNmM4LTQ2ZmEtOWRlMS05YjRmZDNjZWYyMjYiLCJlbWFpbCI6InNlZWRlZF91c2VyXzE3NzEyMjQ3NzAxMzhAZXhhbXBsZS5jb20iLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTc3MTIyNDc3MCwianRpIjoiNTQzMjA0N2UtN2MwNS00YmFhLWEyMDMtMzkyM2MzZWIxMTg3IiwiZXhwIjoxNzcxODI5NTcwfQ.EzssiHtMMkOlZF9sAx0TpiK_o1YNA8YkcJgCLnRdgrY	2026-02-23 06:52:50.431	2026-02-16 06:52:50.432
bce95970-0f35-47cd-82ff-9d7a7a5877d6	63a2429a-ae99-4d46-b63d-420ea926e63b	eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiI2M2EyNDI5YS1hZTk5LTRkNDYtYjYzZC00MjBlYTkyNmU2M2IiLCJlbWFpbCI6InNlZWRlZF91c2VyXzE3NzEyMjQ3ODc2MTlAZXhhbXBsZS5jb20iLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTc3MTIyNDc4NywianRpIjoiYWRjMjYzZTMtZDBhZi00OTU0LTk5YzctNTU3MjQ4ZjdmMTdmIiwiZXhwIjoxNzcxODI5NTg3fQ.UylZ5FZIwZeCsxROZ5PcfPSeDqHE2yCDY2CeQ02am1I	2026-02-23 06:53:07.766	2026-02-16 06:53:07.768
75ec96d7-d8e0-4a93-9dd3-15f937d17c96	f2dc578a-2756-4a60-ac61-5e85c08b0122	eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJmMmRjNTc4YS0yNzU2LTRhNjAtYWM2MS01ZTg1YzA4YjAxMjIiLCJlbWFpbCI6InNlZWRlZF91c2VyXzE3NzEyMjQ3OTQ4NjJAZXhhbXBsZS5jb20iLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTc3MTIyNDc5NCwianRpIjoiZTE5ZWIzYWMtMTMyZC00ZTU5LThhY2UtYjc5YTcwMzEzYmQ5IiwiZXhwIjoxNzcxODI5NTk0fQ.7V65u0-ZNJF26xMpg66cmXAVvaT6D2Xb6vGlSm7miLA	2026-02-23 06:53:14.992	2026-02-16 06:53:14.994
e8657713-a055-4778-92e7-d460df1963c9	d8afb039-51c7-4231-a911-42cb4517336a	eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJkOGFmYjAzOS01MWM3LTQyMzEtYTkxMS00MmNiNDUxNzMzNmEiLCJlbWFpbCI6InNlZWRlZF91c2VyXzE3NzEyMjQ4MDk1NzdAZXhhbXBsZS5jb20iLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTc3MTIyNDgwOSwianRpIjoiZDYwOTYxMmItZGUxMy00ZmE4LWIzZDAtZDE1YzE0NjkzN2UwIiwiZXhwIjoxNzcxODI5NjA5fQ.Qa03RmAPYIFtudZ6kvs7g82Aj7ZaVwMMNLKf7Yv2ftk	2026-02-23 06:53:29.708	2026-02-16 06:53:29.709
f7aa6f7c-cc7d-4b96-92ab-11d09a002d15	a60ef065-0c4a-4f70-8cee-04b4b025869e	eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJhNjBlZjA2NS0wYzRhLTRmNzAtOGNlZS0wNGI0YjAyNTg2OWUiLCJlbWFpbCI6InNlZWRlZF91c2VyXzE3NzEyMjQ4MzE0MzJAZXhhbXBsZS5jb20iLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTc3MTIyNDgzMSwianRpIjoiYmQ1ZGUwMTktNjcxMy00ZjRjLWExZTktYzUyNTNmOWYxOTUzIiwiZXhwIjoxNzcxODI5NjMxfQ.GLbhEhYfYuyXutzJk1-w7LYVLTdG1EuGBylhKeGp2hw	2026-02-23 06:53:51.566	2026-02-16 06:53:51.568
b9faf980-fdf1-42f0-aa7e-4969713537d6	90b90fdc-26b6-4601-9630-9d50f6b38d54	eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiI5MGI5MGZkYy0yNmI2LTQ2MDEtOTYzMC05ZDUwZjZiMzhkNTQiLCJlbWFpbCI6InNlZWRlZF91c2VyXzE3NzEyMjQ4NTAyNzZAZXhhbXBsZS5jb20iLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTc3MTIyNDg1MCwianRpIjoiMDIxYTFjMTEtNGRiZC00ZTk5LThhODEtNTQyMmE4ZmRiMDU4IiwiZXhwIjoxNzcxODI5NjUwfQ.yz9wKj2xkLz-Ft3eOmqf0pbglyKo4NDxn-tvjfgMaks	2026-02-23 06:54:10.419	2026-02-16 06:54:10.42
8691dbfe-119d-4f2c-9c5b-a9b5f51ee7e1	dc9744ef-7f5d-498f-bbdc-d84367d7087b	eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJkYzk3NDRlZi03ZjVkLTQ5OGYtYmJkYy1kODQzNjdkNzA4N2IiLCJlbWFpbCI6InNlZWRlZF91c2VyXzE3NzEyMjQ4NjYyMTFAZXhhbXBsZS5jb20iLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTc3MTIyNDg2NiwianRpIjoiNDlmN2YwNWEtMjU0YS00ZjJlLWE5NzEtY2M0Mjc2OWNiZmQ4IiwiZXhwIjoxNzcxODI5NjY2fQ.mF51XlBBEB4TO9YGIgCPdMz1fn7KnEn6aq9BWYfTtXs	2026-02-23 06:54:26.353	2026-02-16 06:54:26.354
93318915-55cd-4437-b5c2-ab2a66c242f5	f2a154ee-4be8-42c8-b35b-20f367333b37	eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJmMmExNTRlZS00YmU4LTQyYzgtYjM1Yi0yMGYzNjczMzNiMzciLCJlbWFpbCI6InNlZWRlZF91c2VyXzE3NzEyMjQ4ODQ0ODBAZXhhbXBsZS5jb20iLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTc3MTIyNDg4NCwianRpIjoiMDgxZTY3MTMtMDFiMi00ZjEwLWFlYzItNzgyN2ZkYjMzYTg4IiwiZXhwIjoxNzcxODI5Njg0fQ.ol4_Dppz4cqemg9IwvMCYk3pwOAqUp1KbFXOTsBb4KA	2026-02-23 06:54:44.622	2026-02-16 06:54:44.624
d56ec2a6-e7a1-4eb8-9034-23bb3c0b7dc6	d2ec979c-2dde-492e-8caa-990ebb975dd0	eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJkMmVjOTc5Yy0yZGRlLTQ5MmUtOGNhYS05OTBlYmI5NzVkZDAiLCJlbWFpbCI6InNlZWRlZF91c2VyXzE3NzEyMjQ5MDU4MjRAZXhhbXBsZS5jb20iLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTc3MTIyNDkwNSwianRpIjoiN2MwZGQ3ODYtMDZlMi00NTU5LTlhZDAtYjVlODM0OTVmNDViIiwiZXhwIjoxNzcxODI5NzA1fQ.Q_W_0LColUnNFKzq-sTStEShmYQzHBPJoH_awhKFstA	2026-02-23 06:55:05.962	2026-02-16 06:55:05.964
95af2de5-ee43-465e-b420-bf09149b2e93	d28a67b1-384d-4429-8396-aaf9e828e171	eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJkMjhhNjdiMS0zODRkLTQ0MjktODM5Ni1hYWY5ZTgyOGUxNzEiLCJlbWFpbCI6InNlZWRlZF91c2VyXzE3NzEyMjQ5MjA3MzRAZXhhbXBsZS5jb20iLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTc3MTIyNDkyMCwianRpIjoiZGI5ZGQ3OGMtNjk4Zi00MDZkLTkyZGItZTBhYTkyNzk2Nzk3IiwiZXhwIjoxNzcxODI5NzIwfQ.n4QEOAonE4D7RrfKVhRQAEDrUx86yRC_cAVHZWUC0fc	2026-02-23 06:55:20.87	2026-02-16 06:55:20.872
477bba0a-341c-46a5-a50e-6867eaa8e13f	2ec81ee3-3de4-456e-8cb3-327747ece04c	eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIyZWM4MWVlMy0zZGU0LTQ1NmUtOGNiMy0zMjc3NDdlY2UwNGMiLCJlbWFpbCI6InNlZWRlZF91c2VyXzE3NzEyMjQ0NzA4MzhAZXhhbXBsZS5jb20iLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTc3MTIyNDk1NywianRpIjoiNTcxZTRmNDctMDQ1OC00YTM2LTg1NTUtYTdiMWU0YTRkMjY3IiwiZXhwIjoxNzcxODI5NzU3fQ.xhirAICsaJNjx60YukmYUp0_G3a9Mr94ctpaYXXq_6o	2026-02-23 06:55:57.261	2026-02-16 06:55:57.262
\.


--
-- Data for Name: Report; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Report" (id, type, "targetId", "targetType", "reporterId", reason, status, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Retweet; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Retweet" (id, "postId", "userId", "createdAt") FROM stdin;
\.


--
-- Data for Name: Space; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Space" (id, title, "hostId", topics, privacy, status, "isLive", "time", "scheduledAt", "startedAt", "endedAt", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Subscription; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Subscription" (id, "tierId", "subscriberId", status, "currentPeriodStart", "currentPeriodEnd", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: SubscriptionTier; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."SubscriptionTier" (id, "monetizationProfileId", name, description, price, perks, "isActive", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Transaction; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Transaction" (id, "monetizationProfileId", "subscriptionId", type, amount, currency, status, "processorId", "createdAt") FROM stdin;
\.


--
-- Data for Name: Trend; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Trend" (id, category, topic, posts, "createdAt", "updatedAt") FROM stdin;
trend_seededtrend	trending	SeededTrend	100	2026-02-16 07:00:43.606	2026-02-16 07:00:43.606
trend_werfietest	trending	WerfieTest	10	2026-02-16 07:00:43.62	2026-02-16 07:00:43.62
trend_mixedmedia	trending	MixedMedia	85	2026-02-16 07:00:43.623	2026-02-16 07:00:43.623
trend_botseeding	news	BotSeeding	42	2026-02-16 07:00:43.626	2026-02-16 07:00:43.626
trend_antigravitylive	entertainment	AntigravityLive	156	2026-02-16 07:00:43.628	2026-02-16 07:00:43.628
trend_microserviceolympics	sports	MicroserviceOlympics	30	2026-02-16 07:00:43.631	2026-02-16 07:00:43.631
\.


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."User" (id, email, "passwordHash", "createdAt", "updatedAt", role, status, "lastActiveAt", "preferredLanguage") FROM stdin;
89eaec47-3a52-4f04-8885-f2b0f2f7aac1	user1@xclone.com	$2b$10$3vyZdr4d9ajNdCZ2ApaRGeE.FY3furyMem.bIPy1sTPR8XRf5bCZ2	2026-02-13 07:34:56.33	2026-02-13 07:34:56.33	USER	ACTIVE	2026-02-13 13:04:56.333	en
8c7d937e-7937-40fe-a8b2-018f3bc44ad6	user2@xclone.com	$2b$10$ChfdEJ9NgNlxpeM8iZENW.c9ssxIimgORQAzvhENNeN.rpqTgzimC	2026-02-13 07:34:56.425	2026-02-13 07:34:56.425	USER	ACTIVE	2026-02-13 13:04:56.426	en
8f6e3778-0927-415e-b1f1-835238f74aa6	user3@xclone.com	$2b$10$6tiN4x5Q2lvC7mwJ0cr44uLZ7uxekGCwokxiyyZnoxezVyG55/LvW	2026-02-13 07:34:56.5	2026-02-13 07:34:56.5	USER	ACTIVE	2026-02-13 13:04:56.5	en
1121d2bc-d95c-4d94-a235-564f37f23818	user4@xclone.com	$2b$10$pDRcPke9SstGkf2yV3FZReA9JgSlMLPGu7RBRsXacJ.GT2AINPJy.	2026-02-13 07:34:56.577	2026-02-13 07:34:56.577	USER	ACTIVE	2026-02-13 13:04:56.578	en
46a11b35-e002-4951-91a9-1e3858d94e51	user5@xclone.com	$2b$10$2eaydZXcjKUVI8E4hyEvXeg77cX6TN0fzt.FikUvjeFOQfMBbwQ7K	2026-02-13 07:34:56.649	2026-02-13 07:34:56.649	USER	ACTIVE	2026-02-13 13:04:56.649	en
7d784861-2cba-437c-8149-179aadb4b2fc	user6@xclone.com	$2b$10$u.3EgVcMt/IuTVx7haAZguFrm7XWOyCKViKvH2NonJz.ywfJ/TAUW	2026-02-13 07:34:56.725	2026-02-13 07:34:56.725	USER	ACTIVE	2026-02-13 13:04:56.725	en
0b16e54e-2cc2-4876-af1b-19b38dc7e64b	user7@xclone.com	$2b$10$BWNi0T8.Clsiq/ufJ9hwuOya4DReupQDJF6qbaqg8zqUq3kYWd2s.	2026-02-13 07:34:56.802	2026-02-13 07:34:56.802	USER	ACTIVE	2026-02-13 13:04:56.802	en
71be6ae4-8cb8-4b0a-9a34-f30117de683f	user8@xclone.com	$2b$10$F8x.8Uy5rGSXuQuqwGkYdOrgkd.mKhyRJCyvnxf3AmunTUJM9GJOa	2026-02-13 07:34:56.877	2026-02-13 07:34:56.877	USER	ACTIVE	2026-02-13 13:04:56.877	en
a4cc95d9-9418-4f9a-9c9c-58c8065f3664	user9@xclone.com	$2b$10$OIJA.9XCpSIkTdCJLqOx6u4JmRdh1q/IOO676WG1NHrpEe5a04Slu	2026-02-13 07:34:56.946	2026-02-13 07:34:56.946	USER	ACTIVE	2026-02-13 13:04:56.946	en
82f600f6-39d9-49c3-89d5-ac4e29dc2ebf	user10@xclone.com	$2b$10$1IeQ8eAuzP51myknlXTqpOWb9bWcP5YuEuc/xvt3YL51eoqgBKoc2	2026-02-13 07:34:57.013	2026-02-13 07:34:57.013	USER	ACTIVE	2026-02-13 13:04:57.013	en
15bc5dc9-1012-4883-809e-33ed43b1b825	user11@xclone.com	$2b$10$fAPqM8EwXpRFMnSmz81ybuwt80lZz.7pQY4sDi7Q0dJHysoJAbwlC	2026-02-13 07:34:57.081	2026-02-13 07:34:57.081	USER	ACTIVE	2026-02-13 13:04:57.081	en
65e55936-8860-4319-a05e-cf16018e881e	user12@xclone.com	$2b$10$VL06ImGWrIdrEpnKjEzz.e4ydT598Qha30kvYa3RxNa/oWLIzFQTm	2026-02-13 07:34:57.147	2026-02-13 07:34:57.147	USER	ACTIVE	2026-02-13 13:04:57.147	en
af035db2-8b72-4af5-b4cc-144d37667d5d	user13@xclone.com	$2b$10$NpVQNit.mn/XFgZHOf623egpTdYEULPZ9IAsvpafbjRt17U0oFVyC	2026-02-13 07:34:57.214	2026-02-13 07:34:57.214	USER	ACTIVE	2026-02-13 13:04:57.215	en
86c62ca6-3c33-4927-bfe3-7286993c0db6	user14@xclone.com	$2b$10$dxOlRrUAFPaqYMUjPLo9r.mOHtIl9PL8ZYEJkZ3hH6c06I5y8la4S	2026-02-13 07:34:57.283	2026-02-13 07:34:57.283	USER	ACTIVE	2026-02-13 13:04:57.283	en
567abd64-e4ea-46b8-ba94-b5f371bc1044	user15@xclone.com	$2b$10$bMZgLoEi7yAKls7sCajXUOl/oj1ByrFdP097Pa4egKYwTFKg85.fy	2026-02-13 07:34:57.351	2026-02-13 07:34:57.351	USER	ACTIVE	2026-02-13 13:04:57.352	en
65aabba9-80d5-4cfb-a8a2-f6b26fcdaaa7	user16@xclone.com	$2b$10$ZqWdP9XLV7EAeAXlSLy5.eQJD8srm0RRTXoEV81jAh1hw6aOCHe5q	2026-02-13 07:34:57.418	2026-02-13 07:34:57.418	USER	ACTIVE	2026-02-13 13:04:57.418	en
c201d03b-c51b-4789-9673-0e73040580c7	user17@xclone.com	$2b$10$gtXE0C96hpG1sBTkKzGDQ.N70EZy8Jm1iEcavnmGrMAoZYxNH6JCK	2026-02-13 07:34:57.483	2026-02-13 07:34:57.483	USER	ACTIVE	2026-02-13 13:04:57.483	en
9193d18a-7b88-4525-b1b5-def43ae823af	user18@xclone.com	$2b$10$kl4j5jfFUbxuZtdJu2CJ3.kOqmxkJF2kuEBr6g9okOLXL/mpwVjy2	2026-02-13 07:34:57.548	2026-02-13 07:34:57.548	USER	ACTIVE	2026-02-13 13:04:57.549	en
9d602694-52db-48d3-b31e-59a1061c7aad	user19@xclone.com	$2b$10$aBvJyjgT5KswnCebXPmmNex42JOCd3MuZFRn8bD3UqnFptwbNiBCu	2026-02-13 07:34:57.614	2026-02-13 07:34:57.614	USER	ACTIVE	2026-02-13 13:04:57.615	en
cc31f858-e5dd-4758-a078-67494637695a	user20@xclone.com	$2b$10$dkqVCAxZlASxRGA5yYt0PepvDiWXtsb/OLi/GEhvZDlhDVs47.H/G	2026-02-13 07:34:57.68	2026-02-13 07:34:57.68	USER	ACTIVE	2026-02-13 13:04:57.68	en
6bd53601-b4c4-46db-a6ff-a86d5186a898	user21@xclone.com	$2b$10$FIFaGPg1LR3NqeQc1J1bFOTsXjj8jFWDtZtdsGtKLr.gqwsIsiV/6	2026-02-13 07:34:57.747	2026-02-13 07:34:57.747	USER	ACTIVE	2026-02-13 13:04:57.748	en
2def704a-bb45-4236-8081-127083acc86b	user22@xclone.com	$2b$10$zS7GKmVeIN2nbwUpZTVnIuUt2.U/en7aNr/OVrIzIeAL48bu9skIe	2026-02-13 07:34:57.814	2026-02-13 07:34:57.814	USER	ACTIVE	2026-02-13 13:04:57.814	en
6459a7bb-e9ca-4b29-aa74-476e5b2a0604	user23@xclone.com	$2b$10$7KYqzz5VPmUC1eAtrPap9.S.hetFIwdZtnasAXm4CEith4mXjxLPO	2026-02-13 07:34:57.881	2026-02-13 07:34:57.881	USER	ACTIVE	2026-02-13 13:04:57.882	en
24036fdd-104c-4715-919b-fe984200ea62	user24@xclone.com	$2b$10$WSzqjo9MFLORrUyiuSCnIeVC5lzN5Ke.qI78K/MhW6rLR9JwdR5ci	2026-02-13 07:34:57.948	2026-02-13 07:34:57.948	USER	ACTIVE	2026-02-13 13:04:57.948	en
03eae847-3a7c-46c9-a4a1-1fddb44a657b	user25@xclone.com	$2b$10$axIzl2fFcXIHuIin/VXhmeEJ5y8vJsOEcBVGtuqkRAdsm52Olvw2q	2026-02-13 07:34:58.023	2026-02-13 07:34:58.023	USER	ACTIVE	2026-02-13 13:04:58.023	en
9737b04c-41c7-4d45-9666-495714816ac5	user26@xclone.com	$2b$10$THxaMRh8cZGnFQwLuMDhmueAv7xcaAJHz8hI4UHdOGYogh.vEylmu	2026-02-13 07:34:58.088	2026-02-13 07:34:58.088	USER	ACTIVE	2026-02-13 13:04:58.089	en
ad7f059d-c79e-4dee-b35e-79a8d890159c	user27@xclone.com	$2b$10$pGzDR/a89B7fu/.k/Vs3xOnd4p5e6EJcnvTJktk13ZvUC3RsT.0Tu	2026-02-13 07:34:58.156	2026-02-13 07:34:58.156	USER	ACTIVE	2026-02-13 13:04:58.156	en
20ccc387-9723-4dd7-b065-54850d217448	user28@xclone.com	$2b$10$30xY9G.KiWpakMbneJlVoeO5v257/3NpuyYjwBQ/JAglJUflf/J0G	2026-02-13 07:34:58.222	2026-02-13 07:34:58.222	USER	ACTIVE	2026-02-13 13:04:58.223	en
6c790152-af53-4590-90e9-cdcd41377bcf	user29@xclone.com	$2b$10$V9uDsH94w4/E4Vy3zoaAwOPT1a2yGadcYUN.RqdA5VUVGAzyN54oy	2026-02-13 07:34:58.289	2026-02-13 07:34:58.289	USER	ACTIVE	2026-02-13 13:04:58.289	en
f722d71f-3b20-4488-9a55-f23f40635d01	user30@xclone.com	$2b$10$6lkj2X48zzcELMPrfIR4ZOMWJJWLnTMrWCWNJOJjlAJO3wROyHWQS	2026-02-13 07:34:58.354	2026-02-13 07:34:58.354	USER	ACTIVE	2026-02-13 13:04:58.355	en
d454ca87-5582-4d0b-a955-10be038aa300	user31@xclone.com	$2b$10$/JonTyWWjHv7X6yKtvuBOeffkX50bU1TaGFIwxQ1dh1fmubLecO1K	2026-02-13 07:34:58.42	2026-02-13 07:34:58.42	USER	ACTIVE	2026-02-13 13:04:58.421	en
ac0fdf99-1f5b-4014-861f-029b1a7d7c86	user32@xclone.com	$2b$10$s1V5DCHUcJRSGGjSVriyo.pQiPX1XTOoZwBLuxegv.7wDL4YlAJKG	2026-02-13 07:34:58.485	2026-02-13 07:34:58.485	USER	ACTIVE	2026-02-13 13:04:58.485	en
327555ab-f96b-42a8-aee7-9fcfd20eb462	user33@xclone.com	$2b$10$n.XHpSKm4Q/qYziWvzBgdOHBnRJ01s0YVyWLBd6CKN0j8B42J3mFC	2026-02-13 07:34:58.551	2026-02-13 07:34:58.551	USER	ACTIVE	2026-02-13 13:04:58.551	en
9d179ac2-153c-4cda-8bb6-acda03178f4d	user34@xclone.com	$2b$10$nqb7mitVd.uJAtPYFSR3qu/V8Kw4bYMtVFE43/GNm5Q5NplzTiAo.	2026-02-13 07:34:58.616	2026-02-13 07:34:58.616	USER	ACTIVE	2026-02-13 13:04:58.616	en
aba2c69b-10d9-41e6-be18-503b3504e565	user35@xclone.com	$2b$10$H7UKmCAwxhmt0ViY4q3RBuzcYlz/4qvfDp8GnKBkmsGVZYfKv1q62	2026-02-13 07:34:58.682	2026-02-13 07:34:58.682	USER	ACTIVE	2026-02-13 13:04:58.682	en
80295c5e-b05e-470b-b48a-858695a9d9ff	user36@xclone.com	$2b$10$xS0/E.AV3N5z6Dsw7HAsDutslFET9HP5rVJufyO7EpvezVOKQIo7K	2026-02-13 07:34:58.748	2026-02-13 07:34:58.748	USER	ACTIVE	2026-02-13 13:04:58.748	en
fc0cf2f3-d2f6-4567-9129-b01af2a4215d	user37@xclone.com	$2b$10$tdleW/boLiEyAXQTtvnvI.0K4qDXJgSGIQZIFEyPnhf5VHICcOBsS	2026-02-13 07:34:58.814	2026-02-13 07:34:58.814	USER	ACTIVE	2026-02-13 13:04:58.814	en
acfd61dc-781b-4fee-a2e1-ac5914dfd6d2	user38@xclone.com	$2b$10$ovmPW5j60HfwVLI/0OK8Q.6t.CBXzHbnsziC/MdnAkrdC2.JMPCUK	2026-02-13 07:34:58.88	2026-02-13 07:34:58.88	USER	ACTIVE	2026-02-13 13:04:58.88	en
582b8066-699c-4d7d-8fc5-12932fc709c4	user39@xclone.com	$2b$10$t4gw43PZ9AjgYNOiorAgQ.1Pcp6UHENrk68KbnkqFp4k4uRjttHTC	2026-02-13 07:34:58.947	2026-02-13 07:34:58.947	USER	ACTIVE	2026-02-13 13:04:58.948	en
895f36ab-1724-4ae6-9546-6c1426f847df	user40@xclone.com	$2b$10$8.Gp9R//..LEZ6VL8OEQ.OQ7VWEsqXwDB212dAPn7kPkPbuZBk4Tm	2026-02-13 07:34:59.019	2026-02-13 07:34:59.019	USER	ACTIVE	2026-02-13 13:04:59.019	en
0b42f4fb-020d-42f8-b7e1-5129afd74369	user41@xclone.com	$2b$10$AcR0stGsiDWteNZR8YAKGubY7ZleEZkSjcEuopzFNhACsYFcXSPF.	2026-02-13 07:34:59.085	2026-02-13 07:34:59.085	USER	ACTIVE	2026-02-13 13:04:59.085	en
f4528bdc-7476-48a8-8895-d5e0b2afc776	user42@xclone.com	$2b$10$e1Gd.zobeobR2CWJODZMOOMsHeeb.IAGnXow8ySoAyn08TOaIMG0G	2026-02-13 07:34:59.15	2026-02-13 07:34:59.15	USER	ACTIVE	2026-02-13 13:04:59.151	en
15ca20cc-ca0e-422d-a242-0b11b0478f31	user44@xclone.com	$2b$10$VkNdLcLccV8xBffKzXYpSO2KiOjTPbNZ7Koei7ysCSTTl6ey0BmK.	2026-02-13 07:34:59.294	2026-02-13 07:34:59.294	USER	ACTIVE	2026-02-13 13:04:59.295	en
1264f8cb-8009-476d-9486-d7c17bc5c3fb	user45@xclone.com	$2b$10$ra19acdaq4/ky0fGB4UTmOgLmoxR0u1RXiVI057ToGoClCT4GfZ0S	2026-02-13 07:34:59.36	2026-02-13 07:34:59.36	USER	ACTIVE	2026-02-13 13:04:59.361	en
9eb598ff-d969-41b4-8716-7f9ecd263841	user46@xclone.com	$2b$10$U0lGvEamr/AEgeQ2rxnZkuxv6FyUBNt3/P9tSmAsduOugM5Iff6bq	2026-02-13 07:34:59.425	2026-02-13 07:34:59.425	USER	ACTIVE	2026-02-13 13:04:59.426	en
0205b312-bd33-4bce-9f86-c35295beeefe	user47@xclone.com	$2b$10$EfXMr6ZhsObNQKWPNwX1o.AORAYXtAWlqCdHsLGKYVgmK.QN8uN3W	2026-02-13 07:34:59.491	2026-02-13 07:34:59.491	USER	ACTIVE	2026-02-13 13:04:59.492	en
19b1025a-8b3a-4c34-b08e-a0edf0f41d07	user48@xclone.com	$2b$10$1.43VCC0k.rRtwTXwhETyeQYkyrv1OOBPuBBZHvAZTuw3eLZLnsQ2	2026-02-13 07:34:59.557	2026-02-13 07:34:59.557	USER	ACTIVE	2026-02-13 13:04:59.557	en
88fcd25a-146f-43de-ba88-7474efbdfa93	user49@xclone.com	$2b$10$bAWZF1XP1kQq9XldbSPEnOXem7HbONde5aDEoQvIRTeAW5fcAk2EO	2026-02-13 07:34:59.622	2026-02-13 07:34:59.622	USER	ACTIVE	2026-02-13 13:04:59.622	en
56534c56-3c4b-49bf-912c-ddb78e15c549	user50@xclone.com	$2b$10$y37s6o1Reu76b4DNiSqHEutpCIbEdzwMWzcQbfub9E0rSNWrk0DXW	2026-02-13 07:34:59.687	2026-02-13 07:34:59.687	USER	ACTIVE	2026-02-13 13:04:59.688	en
d27e36e7-09d2-4400-8207-b343866044cd	user43@xclone.com	$2b$10$anF.nGG6xlF5onqrV351Mum5iuCaSFXsISmElaBXtMFNcpkbCayDa	2026-02-13 07:34:59.217	2026-02-13 07:34:59.217	USER	ACTIVE	2026-02-13 13:04:59.217	en
61f683e2-1203-452b-a637-53429b67ac6b	seeded_user_1771224469605@example.com	$2b$10$dlQkSnTOqulY..Bljo5f.eFGZK7Nwt1ILtFIM5TOs0HCVvNtTBZ.G	2026-02-16 06:47:49.767	2026-02-16 06:47:49.767	USER	ACTIVE	2026-02-16 12:17:49.771	en
33ac3758-54df-4719-a14d-ff9262a51a76	seeded_user_1771224469860@example.com	$2b$10$2Ug2uK9K2bRrcNapHZ0KcuHxVGoy6grIai8fiMV4JidSEeMJF4mVG	2026-02-16 06:47:49.98	2026-02-16 06:47:49.98	USER	ACTIVE	2026-02-16 12:17:49.981	en
d661946d-d6c7-4847-adec-d279d139947d	seeded_user_1771224470038@example.com	$2b$10$mSxS/Mjec5OcrwPVZojXJOH.M2lZO/Z0ag/Lqi/L0rA8y83mFuSqW	2026-02-16 06:47:50.163	2026-02-16 06:47:50.163	USER	ACTIVE	2026-02-16 12:17:50.163	en
c7b389bd-2036-4170-8b2d-8b232df39c14	seeded_user_1771224470200@example.com	$2b$10$x6SRtwvlWIr9Pm1kBo6oNe0CVZLuR2IezMxiX7lvJOfhfATQOyVeS	2026-02-16 06:47:50.312	2026-02-16 06:47:50.312	USER	ACTIVE	2026-02-16 12:17:50.313	en
a3f1933f-244c-42fd-8ae7-29fac64268d8	seeded_user_1771224470364@example.com	$2b$10$ASyOJkCB0rA.TVgk4BvgauGke81ZiCbzOeqaXMB6xGrhIPmGu7M7q	2026-02-16 06:47:50.479	2026-02-16 06:47:50.479	USER	ACTIVE	2026-02-16 12:17:50.48	en
c05fee46-e614-44b5-ae3e-9475eacb3e23	seeded_user_1771224470506@example.com	$2b$10$qO5GhgorcMRe0WmxXBc3.OUoc8Mj5JEADghiIaIjFB7LDgOGJ8xzG	2026-02-16 06:47:50.625	2026-02-16 06:47:50.625	USER	ACTIVE	2026-02-16 12:17:50.626	en
9786dd2c-7021-4948-a3db-17a14318edb0	seeded_user_1771224470688@example.com	$2b$10$9T0Sii67N/RIQ1.2ZCopjOrTMNg9i0pujRKcRnbseeHubTlt2A5uq	2026-02-16 06:47:50.81	2026-02-16 06:47:50.81	USER	ACTIVE	2026-02-16 12:17:50.811	en
2ec81ee3-3de4-456e-8cb3-327747ece04c	seeded_user_1771224470838@example.com	$2b$10$EF1GhJjxj/.Gb2FguT1xJu1oGq2qMCyepg4DkAzU2SBARqlM0aWsO	2026-02-16 06:47:50.944	2026-02-16 06:47:50.944	USER	ACTIVE	2026-02-16 12:17:50.944	en
9d57e20d-4791-4937-afe2-31eb1c6a6971	seeded_user_1771224470994@example.com	$2b$10$FJyhf3ickiDxfwojd.Qf4OXkFVeJBGM0DhAOWD5XeaK59g7QjeyQe	2026-02-16 06:47:51.105	2026-02-16 06:47:51.105	USER	ACTIVE	2026-02-16 12:17:51.106	en
7c3a4bfd-6033-4a79-b2a8-a4c6ac5d23bf	seeded_user_1771224471167@example.com	$2b$10$45cV1NU5eLa/KUSZqcOVt.FtyZXS6lBTrn59N2DfMNGEbebmNyoDa	2026-02-16 06:47:51.272	2026-02-16 06:47:51.272	USER	ACTIVE	2026-02-16 12:17:51.273	en
46c25209-b6c8-46fa-9de1-9b4fd3cef226	seeded_user_1771224770138@example.com	$2b$10$WknooIOxXfg2gBzFTL/5R.L.mXZcJ9MwvROUr1TyiuPe0H2jfNg3u	2026-02-16 06:52:50.395	2026-02-16 06:52:50.395	USER	ACTIVE	2026-02-16 12:22:50.395	en
63a2429a-ae99-4d46-b63d-420ea926e63b	seeded_user_1771224787619@example.com	$2b$10$x8LoNCCLeGbSVO9pOhv.iemBwN9OfnESAZzp8Lx/XN7EYLw6y2WuW	2026-02-16 06:53:07.757	2026-02-16 06:53:07.757	USER	ACTIVE	2026-02-16 12:23:07.758	en
f2dc578a-2756-4a60-ac61-5e85c08b0122	seeded_user_1771224794862@example.com	$2b$10$GywPTvZHjIfN21PsI9mrh.t46LZ9pyZbHYPwgrUyZ.glDfxB92ap.	2026-02-16 06:53:14.987	2026-02-16 06:53:14.987	USER	ACTIVE	2026-02-16 12:23:14.988	en
d8afb039-51c7-4231-a911-42cb4517336a	seeded_user_1771224809577@example.com	$2b$10$2puMxXt5FlYDBbR8gs7CouGg25d6ycnWvY9puUr0FUzkKINvjn6bS	2026-02-16 06:53:29.703	2026-02-16 06:53:29.703	USER	ACTIVE	2026-02-16 12:23:29.704	en
a60ef065-0c4a-4f70-8cee-04b4b025869e	seeded_user_1771224831432@example.com	$2b$10$jYY1CUeRy/jsGPcfaIYsyOjbpuZ0f7GWhykOSXNr1G/Ds40lhlWUa	2026-02-16 06:53:51.559	2026-02-16 06:53:51.559	USER	ACTIVE	2026-02-16 12:23:51.559	en
90b90fdc-26b6-4601-9630-9d50f6b38d54	seeded_user_1771224850276@example.com	$2b$10$G/YX7gWswWgBmkBlAPZsD.OndqhXViBilejCobQx7ZohbRl8x1hFi	2026-02-16 06:54:10.4	2026-02-16 06:54:10.4	USER	ACTIVE	2026-02-16 12:24:10.4	en
dc9744ef-7f5d-498f-bbdc-d84367d7087b	seeded_user_1771224866211@example.com	$2b$10$yu2r7zcCPFj9.32QAd36Yu.IqX3Sjt9cmOcYo3NPYodS92bHkGD7a	2026-02-16 06:54:26.333	2026-02-16 06:54:26.333	USER	ACTIVE	2026-02-16 12:24:26.333	en
f2a154ee-4be8-42c8-b35b-20f367333b37	seeded_user_1771224884480@example.com	$2b$10$R/vIanKjiRDomRbQqWluhukkFHHYFfqtuZRH7YhOepJt5Gk2o5BOu	2026-02-16 06:54:44.603	2026-02-16 06:54:44.603	USER	ACTIVE	2026-02-16 12:24:44.604	en
d2ec979c-2dde-492e-8caa-990ebb975dd0	seeded_user_1771224905824@example.com	$2b$10$E7eLvp.SljQ79tUd0/IQQeYpFBB8/BYnt3hMscWPRwC2Z3qoVcX6a	2026-02-16 06:55:05.943	2026-02-16 06:55:05.943	USER	ACTIVE	2026-02-16 12:25:05.944	en
d28a67b1-384d-4429-8396-aaf9e828e171	seeded_user_1771224920734@example.com	$2b$10$r7hxOCVIosPo5r/c8n.6eeUh3PrdaYUijITy3.fWa09z8Yta8d9Du	2026-02-16 06:55:20.851	2026-02-16 06:55:20.851	USER	ACTIVE	2026-02-16 12:25:20.853	en
\.


--
-- Data for Name: VerificationRequest; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."VerificationRequest" (id, "userId", status, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
13b8eed5-d3a6-4ded-bf4c-64c69ba7189b	7b878ab3345a5ec4ab4354a5744dae88f4b3b4559d3472b6e131c4efea4b85f0	2026-02-13 13:01:32.546353+05:30	20260213073132_add_payout_fields	\N	\N	2026-02-13 13:01:32.161115+05:30	1
\.


--
-- Name: AdAccount AdAccount_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."AdAccount"
    ADD CONSTRAINT "AdAccount_pkey" PRIMARY KEY (id);


--
-- Name: Ad Ad_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Ad"
    ADD CONSTRAINT "Ad_pkey" PRIMARY KEY (id);


--
-- Name: ApiKey ApiKey_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ApiKey"
    ADD CONSTRAINT "ApiKey_pkey" PRIMARY KEY (id);


--
-- Name: AuditLog AuditLog_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."AuditLog"
    ADD CONSTRAINT "AuditLog_pkey" PRIMARY KEY (id);


--
-- Name: BroadcastNotification BroadcastNotification_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."BroadcastNotification"
    ADD CONSTRAINT "BroadcastNotification_pkey" PRIMARY KEY (id);


--
-- Name: BusinessMember BusinessMember_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."BusinessMember"
    ADD CONSTRAINT "BusinessMember_pkey" PRIMARY KEY (id);


--
-- Name: BusinessProfile BusinessProfile_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."BusinessProfile"
    ADD CONSTRAINT "BusinessProfile_pkey" PRIMARY KEY (id);


--
-- Name: Campaign Campaign_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Campaign"
    ADD CONSTRAINT "Campaign_pkey" PRIMARY KEY (id);


--
-- Name: CommunityMember CommunityMember_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."CommunityMember"
    ADD CONSTRAINT "CommunityMember_pkey" PRIMARY KEY (id);


--
-- Name: CommunityModerator CommunityModerator_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."CommunityModerator"
    ADD CONSTRAINT "CommunityModerator_pkey" PRIMARY KEY (id);


--
-- Name: CommunityPost CommunityPost_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."CommunityPost"
    ADD CONSTRAINT "CommunityPost_pkey" PRIMARY KEY (id);


--
-- Name: Community Community_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Community"
    ADD CONSTRAINT "Community_pkey" PRIMARY KEY (id);


--
-- Name: Conversation Conversation_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Conversation"
    ADD CONSTRAINT "Conversation_pkey" PRIMARY KEY (id);


--
-- Name: Follow Follow_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Follow"
    ADD CONSTRAINT "Follow_pkey" PRIMARY KEY (id);


--
-- Name: Like Like_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Like"
    ADD CONSTRAINT "Like_pkey" PRIMARY KEY (id);


--
-- Name: ListFollower ListFollower_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ListFollower"
    ADD CONSTRAINT "ListFollower_pkey" PRIMARY KEY (id);


--
-- Name: ListMember ListMember_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ListMember"
    ADD CONSTRAINT "ListMember_pkey" PRIMARY KEY (id);


--
-- Name: List List_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."List"
    ADD CONSTRAINT "List_pkey" PRIMARY KEY (id);


--
-- Name: Message Message_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Message"
    ADD CONSTRAINT "Message_pkey" PRIMARY KEY (id);


--
-- Name: MonetizationProfile MonetizationProfile_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."MonetizationProfile"
    ADD CONSTRAINT "MonetizationProfile_pkey" PRIMARY KEY (id);


--
-- Name: Notification Notification_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Notification"
    ADD CONSTRAINT "Notification_pkey" PRIMARY KEY (id);


--
-- Name: Participant Participant_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Participant"
    ADD CONSTRAINT "Participant_pkey" PRIMARY KEY (id);


--
-- Name: PostMedia PostMedia_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PostMedia"
    ADD CONSTRAINT "PostMedia_pkey" PRIMARY KEY (id);


--
-- Name: Post Post_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Post"
    ADD CONSTRAINT "Post_pkey" PRIMARY KEY (id);


--
-- Name: Profile Profile_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Profile"
    ADD CONSTRAINT "Profile_pkey" PRIMARY KEY (id);


--
-- Name: PushConfig PushConfig_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PushConfig"
    ADD CONSTRAINT "PushConfig_pkey" PRIMARY KEY (id);


--
-- Name: PushTemplate PushTemplate_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PushTemplate"
    ADD CONSTRAINT "PushTemplate_pkey" PRIMARY KEY (id);


--
-- Name: RefreshToken RefreshToken_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."RefreshToken"
    ADD CONSTRAINT "RefreshToken_pkey" PRIMARY KEY (id);


--
-- Name: Report Report_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Report"
    ADD CONSTRAINT "Report_pkey" PRIMARY KEY (id);


--
-- Name: Retweet Retweet_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Retweet"
    ADD CONSTRAINT "Retweet_pkey" PRIMARY KEY (id);


--
-- Name: Space Space_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Space"
    ADD CONSTRAINT "Space_pkey" PRIMARY KEY (id);


--
-- Name: SubscriptionTier SubscriptionTier_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."SubscriptionTier"
    ADD CONSTRAINT "SubscriptionTier_pkey" PRIMARY KEY (id);


--
-- Name: Subscription Subscription_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Subscription"
    ADD CONSTRAINT "Subscription_pkey" PRIMARY KEY (id);


--
-- Name: Transaction Transaction_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Transaction"
    ADD CONSTRAINT "Transaction_pkey" PRIMARY KEY (id);


--
-- Name: Trend Trend_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Trend"
    ADD CONSTRAINT "Trend_pkey" PRIMARY KEY (id);


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- Name: VerificationRequest VerificationRequest_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."VerificationRequest"
    ADD CONSTRAINT "VerificationRequest_pkey" PRIMARY KEY (id);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: ApiKey_keyHash_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "ApiKey_keyHash_idx" ON public."ApiKey" USING btree ("keyHash");


--
-- Name: ApiKey_keyHash_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "ApiKey_keyHash_key" ON public."ApiKey" USING btree ("keyHash");


--
-- Name: AuditLog_adminId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "AuditLog_adminId_idx" ON public."AuditLog" USING btree ("adminId");


--
-- Name: AuditLog_createdAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "AuditLog_createdAt_idx" ON public."AuditLog" USING btree ("createdAt");


--
-- Name: BusinessMember_businessId_userId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "BusinessMember_businessId_userId_key" ON public."BusinessMember" USING btree ("businessId", "userId");


--
-- Name: BusinessProfile_userId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "BusinessProfile_userId_key" ON public."BusinessProfile" USING btree ("userId");


--
-- Name: CommunityMember_communityId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "CommunityMember_communityId_idx" ON public."CommunityMember" USING btree ("communityId");


--
-- Name: CommunityMember_userId_communityId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "CommunityMember_userId_communityId_key" ON public."CommunityMember" USING btree ("userId", "communityId");


--
-- Name: CommunityMember_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "CommunityMember_userId_idx" ON public."CommunityMember" USING btree ("userId");


--
-- Name: CommunityModerator_communityId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "CommunityModerator_communityId_idx" ON public."CommunityModerator" USING btree ("communityId");


--
-- Name: CommunityModerator_userId_communityId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "CommunityModerator_userId_communityId_key" ON public."CommunityModerator" USING btree ("userId", "communityId");


--
-- Name: CommunityModerator_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "CommunityModerator_userId_idx" ON public."CommunityModerator" USING btree ("userId");


--
-- Name: CommunityPost_communityId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "CommunityPost_communityId_idx" ON public."CommunityPost" USING btree ("communityId");


--
-- Name: CommunityPost_communityId_postId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "CommunityPost_communityId_postId_key" ON public."CommunityPost" USING btree ("communityId", "postId");


--
-- Name: Community_createdAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Community_createdAt_idx" ON public."Community" USING btree ("createdAt");


--
-- Name: Conversation_lastMessageId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Conversation_lastMessageId_key" ON public."Conversation" USING btree ("lastMessageId");


--
-- Name: Follow_followerId_followingId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Follow_followerId_followingId_key" ON public."Follow" USING btree ("followerId", "followingId");


--
-- Name: Like_postId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Like_postId_idx" ON public."Like" USING btree ("postId");


--
-- Name: Like_postId_userId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Like_postId_userId_key" ON public."Like" USING btree ("postId", "userId");


--
-- Name: Like_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Like_userId_idx" ON public."Like" USING btree ("userId");


--
-- Name: ListFollower_listId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "ListFollower_listId_idx" ON public."ListFollower" USING btree ("listId");


--
-- Name: ListFollower_listId_userId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "ListFollower_listId_userId_key" ON public."ListFollower" USING btree ("listId", "userId");


--
-- Name: ListFollower_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "ListFollower_userId_idx" ON public."ListFollower" USING btree ("userId");


--
-- Name: ListMember_listId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "ListMember_listId_idx" ON public."ListMember" USING btree ("listId");


--
-- Name: ListMember_listId_userId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "ListMember_listId_userId_key" ON public."ListMember" USING btree ("listId", "userId");


--
-- Name: ListMember_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "ListMember_userId_idx" ON public."ListMember" USING btree ("userId");


--
-- Name: List_ownerId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "List_ownerId_idx" ON public."List" USING btree ("ownerId");


--
-- Name: Message_conversationId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Message_conversationId_idx" ON public."Message" USING btree ("conversationId");


--
-- Name: Message_createdAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Message_createdAt_idx" ON public."Message" USING btree ("createdAt");


--
-- Name: Message_senderId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Message_senderId_idx" ON public."Message" USING btree ("senderId");


--
-- Name: MonetizationProfile_userId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "MonetizationProfile_userId_key" ON public."MonetizationProfile" USING btree ("userId");


--
-- Name: Notification_actorId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Notification_actorId_idx" ON public."Notification" USING btree ("actorId");


--
-- Name: Notification_createdAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Notification_createdAt_idx" ON public."Notification" USING btree ("createdAt");


--
-- Name: Notification_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Notification_userId_idx" ON public."Notification" USING btree ("userId");


--
-- Name: Participant_userId_conversationId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Participant_userId_conversationId_key" ON public."Participant" USING btree ("userId", "conversationId");


--
-- Name: Participant_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Participant_userId_idx" ON public."Participant" USING btree ("userId");


--
-- Name: PostMedia_postId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "PostMedia_postId_idx" ON public."PostMedia" USING btree ("postId");


--
-- Name: Post_createdAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Post_createdAt_idx" ON public."Post" USING btree ("createdAt");


--
-- Name: Post_replyToId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Post_replyToId_idx" ON public."Post" USING btree ("replyToId");


--
-- Name: Post_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Post_userId_idx" ON public."Post" USING btree ("userId");


--
-- Name: Profile_handle_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Profile_handle_idx" ON public."Profile" USING btree (handle);


--
-- Name: Profile_handle_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Profile_handle_key" ON public."Profile" USING btree (handle);


--
-- Name: Profile_userId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Profile_userId_key" ON public."Profile" USING btree ("userId");


--
-- Name: PushTemplate_name_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "PushTemplate_name_key" ON public."PushTemplate" USING btree (name);


--
-- Name: RefreshToken_token_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "RefreshToken_token_key" ON public."RefreshToken" USING btree (token);


--
-- Name: RefreshToken_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "RefreshToken_userId_idx" ON public."RefreshToken" USING btree ("userId");


--
-- Name: Report_reporterId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Report_reporterId_idx" ON public."Report" USING btree ("reporterId");


--
-- Name: Report_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Report_status_idx" ON public."Report" USING btree (status);


--
-- Name: Report_targetId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Report_targetId_idx" ON public."Report" USING btree ("targetId");


--
-- Name: Retweet_postId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Retweet_postId_idx" ON public."Retweet" USING btree ("postId");


--
-- Name: Retweet_postId_userId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Retweet_postId_userId_key" ON public."Retweet" USING btree ("postId", "userId");


--
-- Name: Retweet_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Retweet_userId_idx" ON public."Retweet" USING btree ("userId");


--
-- Name: Space_hostId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Space_hostId_idx" ON public."Space" USING btree ("hostId");


--
-- Name: Space_isLive_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Space_isLive_idx" ON public."Space" USING btree ("isLive");


--
-- Name: Space_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Space_status_idx" ON public."Space" USING btree (status);


--
-- Name: Trend_category_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Trend_category_idx" ON public."Trend" USING btree (category);


--
-- Name: Trend_createdAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Trend_createdAt_idx" ON public."Trend" USING btree ("createdAt");


--
-- Name: User_email_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "User_email_key" ON public."User" USING btree (email);


--
-- Name: VerificationRequest_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "VerificationRequest_status_idx" ON public."VerificationRequest" USING btree (status);


--
-- Name: AdAccount AdAccount_businessId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."AdAccount"
    ADD CONSTRAINT "AdAccount_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES public."BusinessProfile"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Ad Ad_campaign_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Ad"
    ADD CONSTRAINT "Ad_campaign_id_fkey" FOREIGN KEY (campaign_id) REFERENCES public."Campaign"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: BusinessMember BusinessMember_businessId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."BusinessMember"
    ADD CONSTRAINT "BusinessMember_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES public."BusinessProfile"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: BusinessMember BusinessMember_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."BusinessMember"
    ADD CONSTRAINT "BusinessMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: BusinessProfile BusinessProfile_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."BusinessProfile"
    ADD CONSTRAINT "BusinessProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Campaign Campaign_adAccountId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Campaign"
    ADD CONSTRAINT "Campaign_adAccountId_fkey" FOREIGN KEY ("adAccountId") REFERENCES public."AdAccount"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: CommunityMember CommunityMember_communityId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."CommunityMember"
    ADD CONSTRAINT "CommunityMember_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES public."Community"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: CommunityMember CommunityMember_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."CommunityMember"
    ADD CONSTRAINT "CommunityMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: CommunityModerator CommunityModerator_communityId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."CommunityModerator"
    ADD CONSTRAINT "CommunityModerator_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES public."Community"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: CommunityModerator CommunityModerator_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."CommunityModerator"
    ADD CONSTRAINT "CommunityModerator_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: CommunityPost CommunityPost_communityId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."CommunityPost"
    ADD CONSTRAINT "CommunityPost_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES public."Community"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: CommunityPost CommunityPost_postId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."CommunityPost"
    ADD CONSTRAINT "CommunityPost_postId_fkey" FOREIGN KEY ("postId") REFERENCES public."Post"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Conversation Conversation_lastMessageId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Conversation"
    ADD CONSTRAINT "Conversation_lastMessageId_fkey" FOREIGN KEY ("lastMessageId") REFERENCES public."Message"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Follow Follow_followerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Follow"
    ADD CONSTRAINT "Follow_followerId_fkey" FOREIGN KEY ("followerId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Follow Follow_followingId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Follow"
    ADD CONSTRAINT "Follow_followingId_fkey" FOREIGN KEY ("followingId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Like Like_postId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Like"
    ADD CONSTRAINT "Like_postId_fkey" FOREIGN KEY ("postId") REFERENCES public."Post"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Like Like_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Like"
    ADD CONSTRAINT "Like_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ListFollower ListFollower_listId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ListFollower"
    ADD CONSTRAINT "ListFollower_listId_fkey" FOREIGN KEY ("listId") REFERENCES public."List"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ListFollower ListFollower_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ListFollower"
    ADD CONSTRAINT "ListFollower_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ListMember ListMember_listId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ListMember"
    ADD CONSTRAINT "ListMember_listId_fkey" FOREIGN KEY ("listId") REFERENCES public."List"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ListMember ListMember_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ListMember"
    ADD CONSTRAINT "ListMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: List List_ownerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."List"
    ADD CONSTRAINT "List_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Message Message_conversationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Message"
    ADD CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES public."Conversation"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Message Message_senderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Message"
    ADD CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: MonetizationProfile MonetizationProfile_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."MonetizationProfile"
    ADD CONSTRAINT "MonetizationProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Notification Notification_actorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Notification"
    ADD CONSTRAINT "Notification_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Notification Notification_postId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Notification"
    ADD CONSTRAINT "Notification_postId_fkey" FOREIGN KEY ("postId") REFERENCES public."Post"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Notification Notification_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Notification"
    ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Participant Participant_conversationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Participant"
    ADD CONSTRAINT "Participant_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES public."Conversation"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Participant Participant_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Participant"
    ADD CONSTRAINT "Participant_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: PostMedia PostMedia_postId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PostMedia"
    ADD CONSTRAINT "PostMedia_postId_fkey" FOREIGN KEY ("postId") REFERENCES public."Post"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Post Post_replyToId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Post"
    ADD CONSTRAINT "Post_replyToId_fkey" FOREIGN KEY ("replyToId") REFERENCES public."Post"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Post Post_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Post"
    ADD CONSTRAINT "Post_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Profile Profile_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Profile"
    ADD CONSTRAINT "Profile_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: RefreshToken RefreshToken_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."RefreshToken"
    ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Report Report_reporterId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Report"
    ADD CONSTRAINT "Report_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Retweet Retweet_postId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Retweet"
    ADD CONSTRAINT "Retweet_postId_fkey" FOREIGN KEY ("postId") REFERENCES public."Post"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Retweet Retweet_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Retweet"
    ADD CONSTRAINT "Retweet_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Space Space_hostId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Space"
    ADD CONSTRAINT "Space_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: SubscriptionTier SubscriptionTier_monetizationProfileId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."SubscriptionTier"
    ADD CONSTRAINT "SubscriptionTier_monetizationProfileId_fkey" FOREIGN KEY ("monetizationProfileId") REFERENCES public."MonetizationProfile"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Subscription Subscription_subscriberId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Subscription"
    ADD CONSTRAINT "Subscription_subscriberId_fkey" FOREIGN KEY ("subscriberId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Subscription Subscription_tierId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Subscription"
    ADD CONSTRAINT "Subscription_tierId_fkey" FOREIGN KEY ("tierId") REFERENCES public."SubscriptionTier"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Transaction Transaction_monetizationProfileId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Transaction"
    ADD CONSTRAINT "Transaction_monetizationProfileId_fkey" FOREIGN KEY ("monetizationProfileId") REFERENCES public."MonetizationProfile"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Transaction Transaction_subscriptionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Transaction"
    ADD CONSTRAINT "Transaction_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES public."Subscription"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: VerificationRequest VerificationRequest_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."VerificationRequest"
    ADD CONSTRAINT "VerificationRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: postgres
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;


--
-- PostgreSQL database dump complete
--

\unrestrict GajW9cZ1Cl76JCIZ7oOLCZtKn488122as2wRRT9f29ka6JHIGij6G7M4SHh9QFK

