# MANETHO

## Master Product, UX, Architecture & Engineering Specification

You are the lead software architect, senior Next.js engineer, AI product engineer, UX designer, and technical product manager responsible for building **Manetho**, an AI-powered cultural heritage platform focused initially on Ancient Egyptian civilization and hieroglyphic translation.

Do not build a generic AI chatbot.

Do not build a generic OCR website.

Build a premium cultural-intelligence platform that connects physical heritage objects with AI, historical knowledge, translation, museum navigation, voice interaction, and immersive experiences.

The application must be production-ready, modular, scalable, accessible, responsive, secure, and designed so that future mobile, AR, VR, museum, and institutional integrations can be added without rewriting the core system.

---

# 1. PRODUCT VISION

Manetho exists to make ancient civilization understandable, searchable, interactive, and digitally preservable.

The initial domain is Ancient Egypt.

The core user journey is:

Physical artifact
→ camera/image
→ hieroglyph detection
→ symbol recognition
→ transliteration
→ translation
→ historical/contextual explanation
→ related artifact/civilization knowledge
→ voice interaction
→ museum navigation
→ immersive AR/3D experience.

Manetho should feel like:

* a museum guide
* an Egyptology research assistant
* a hieroglyphic translator
* an AI cultural historian
* a museum navigation system
* an educational platform
* a digital heritage archive

combined into one coherent product.

---

# 2. VERIFIED PRODUCT CAPABILITIES

The public Manetho material describes five major connected experiences:

1. Real-time hieroglyphic translation
2. AI Egyptology assistant
3. Indoor museum map/navigation
4. AR tours
5. AI voice agent

The public Dark Pyramid material additionally describes:

* context-aware civilization assistance
* cultural knowledge
* computer-vision-based hieroglyphic translation
* AR heritage experiences
* VR/immersive heritage experiences
* institutional integration
* museum/research digitization

Treat these as the product's core direction.

Some advanced features may initially be implemented as interfaces/stubs if the underlying AI/AR infrastructure is not yet available.

Never fake AI results.

If a real model/API is unavailable, clearly create an abstraction interface and mock provider for development.

---

# 3. TARGET USERS

Support multiple user types.

## Visitor

A tourist visiting a museum or archaeological site.

Needs:

* scan artifact
* translate inscription
* understand artifact
* ask questions
* hear explanation
* navigate museum
* discover nearby artifacts
* use AR experiences

## Student

Needs:

* simple explanations
* educational content
* vocabulary
* hieroglyph learning
* quizzes
* saved discoveries
* research history

## Researcher

Needs:

* precise recognition
* transliteration
* Gardiner codes
* source references
* alternative interpretations
* confidence scores
* export
* notes
* saved research

## Egyptologist / Specialist

Needs:

* detailed linguistic information
* sign-level information
* historical context
* variant readings
* artifact metadata
* scholarly references

## Museum

Needs:

* artifact management
* digital collection
* visitor analytics
* tours
* maps
* AR experiences
* AI knowledge base
* content management

## Administrator

Needs:

* users
* content
* artifacts
* AI configurations
* museums
* analytics
* moderation
* system health
* permissions

---

# 4. CORE APPLICATION STRUCTURE

Create the following major application areas.

## Public

/
/discover
/translator
/assistant
/museums
/artifacts
/learn
/about
/download
/privacy
/terms

## Authenticated

/app
/app/scan
/app/translate
/app/assistant
/app/history
/app/saved
/app/learn
/app/museums
/app/profile
/app/settings

## Museum

/museum/[museumId]
/museum/[museumId]/map
/museum/[museumId]/artifacts
/museum/[museumId]/tour
/museum/[museumId]/ar

## Artifact

/artifact/[artifactId]

## Admin

/admin
/admin/users
/admin/artifacts
/admin/museums
/admin/content
/admin/translations
/admin/ai
/admin/analytics
/admin/system

---

# 5. HOME PAGE

The homepage must immediately communicate:

"Ancient Egypt, understood through AI."

Hero section:

* cinematic Ancient Egyptian visual
* hieroglyphic motifs
* subtle animated particles
* premium dark archaeological aesthetic
* Manetho branding
* clear CTA: "Scan a Hieroglyph"
* secondary CTA: "Explore Ancient Egypt"

Do not make it look like a generic SaaS landing page.

The visual language should combine:

* archaeological stone
* papyrus
* gold
* dark charcoal
* sandstone
* subtle Egyptian geometric patterns
* modern glass surfaces
* scientific/AI visualization

Avoid excessive stereotypical Egyptian decoration.

Use typography that is modern and highly readable.

---

# 6. HIERGLYPH TRANSLATOR

This is the primary feature.

Route:

/translator

The interface must support:

* camera input
* image upload
* drag/drop
* paste image
* sample images
* crop
* rotate
* zoom
* enhancement
* multiple detected signs
* full inscription detection
* individual sign selection

Flow:

1. User provides image.
2. Upload image.
3. Preprocess image.
4. Detect inscription.
5. Detect individual signs.
6. Recognize signs.
7. Map recognized signs to hieroglyph metadata.
8. Determine sign ordering.
9. Produce transliteration.
10. Produce translation.
11. Produce explanation.
12. Display confidence.
13. Display uncertainty.
14. Link to knowledge base.
15. Allow user to ask AI about result.

Never represent uncertain OCR as fact.

---

# 7. TRANSLATION RESULT UI

Result page should contain:

## Original image

Show original uploaded image.

## Detection overlay

Draw bounding boxes around detected hieroglyphs.

Each box should be clickable.

## Sign sequence

Display:

[sign] [sign] [sign] [sign]

Each sign should expose:

* sign image
* Gardiner code
* Unicode
* transliteration
* phonetic value
* ideogram/determinative information
* confidence

## Transliteration

Example:

`...`

## Translation

Example:

"..."

## Context

Explain:

* who/what is referenced
* historical period
* possible meaning
* grammar/context
* cultural significance

## Confidence

Use:

High
Medium
Low

Never show fake decimal precision unless the model provides it.

## Alternative readings

If multiple readings are plausible:

"Possible interpretations"

Show each with confidence and explanation.

## Sources

Show references when available.

---

# 8. REAL-TIME CAMERA MODE

Create:

/app/scan

This should feel like a modern AR scanner.

UI:

* full-screen camera
* central scanning frame
* detection animation
* detected-sign overlays
* scan button
* flashlight
* gallery button
* history
* settings

When signs are detected:

* show bounding boxes
* highlight individual signs
* show quick translation card
* allow "Explain"
* allow "Open full result"

The architecture must support eventual real-time inference.

For browser MVP, use:

MediaDevices/getUserMedia

and an inference API.

Do not run heavy ML inference on the main browser thread.

---

# 9. AI EGYPTOLOGY ASSISTANT

Route:

/assistant

This is not a generic chatbot.

It is a specialized cultural intelligence assistant.

The assistant should understand:

* Ancient Egypt
* Egyptian dynasties
* pharaohs
* gods
* temples
* tombs
* hieroglyphics
* artifacts
* museums
* archaeological sites
* Egyptian language
* mythology
* historical chronology
* user-scanned artifacts

The assistant should have context.

Example:

User scans an inscription.

Assistant context automatically includes:

* image
* recognized signs
* transliteration
* translation
* artifact
* museum
* historical period

Then the user can ask:

"What does this mean?"

"Who is mentioned here?"

"Why was this written?"

"When was this artifact created?"

"Explain this to a child."

"Give me the academic explanation."

---

# 10. ASSISTANT MODES

Support:

## Simple mode

For tourists and beginners.

Short explanations.

## Educational mode

For students.

Examples and learning explanations.

## Research mode

For researchers.

Detailed terminology, references, alternative interpretations.

## Museum guide mode

Context-aware responses based on museum/location/artifact.

---

# 11. AI CHAT FEATURES

Support:

* streaming responses
* conversation history
* image upload
* artifact context
* translation context
* voice input
* voice output
* regenerate
* copy
* save
* share
* source references
* feedback
* report response

Messages should support:

* Markdown
* citations
* artifact cards
* image cards
* sign cards
* source cards

---

# 12. AI VOICE AGENT

Create a voice assistant interface.

Capabilities:

* speech-to-text
* conversational response
* text-to-speech
* interruption
* streaming
* language selection

UX:

Large microphone button.

States:

IDLE
LISTENING
PROCESSING
SPEAKING
ERROR

Allow:

* Arabic
* English

Design the system so additional languages can be added later.

Voice agent should understand current:

* museum
* artifact
* translation
* tour
* user position

when those contexts are available.

---

# 13. MUSEUM PLATFORM

Create museum entities.

Museum fields:

id
name
slug
description
country
city
address
latitude
longitude
logo
coverImage
openingHours
website
timezone
language
status

A museum can contain:

* floors
* rooms
* zones
* artifacts
* tours
* AR experiences
* routes
* audio guides

---

# 14. INDOOR MUSEUM MAP

Route:

/museum/[museumId]/map

Support:

* floor selection
* rooms
* artifact markers
* current position
* route calculation
* accessibility routes
* search
* category filtering
* nearby artifacts
* recommended route

Map architecture must support:

* SVG floor plans
* GeoJSON
* custom coordinate systems
* future BLE/UWB positioning
* future indoor positioning SDK

Do not hard-code map coordinates in UI.

---

# 15. MUSEUM ARTIFACTS

Artifact entity:

id
museumId
name
slug
description
period
dynasty
dateFrom
dateTo
material
dimensions
creator
culture
location
inventoryNumber
images
model3D
audio
translations
metadata
sources

Artifact page:

/artifact/[artifactId]

Display:

* hero image
* name
* museum
* period
* dynasty
* description
* historical context
* translation
* hieroglyphs
* 3D model
* audio
* AI explanation
* related artifacts
* map location
* AR button

---

# 16. AR EXPERIENCE

Create an AR-ready architecture.

Route:

/museum/[museumId]/ar/[artifactId]

For browser MVP:

* camera
* artifact recognition placeholder
* AR target
* overlay
* information panel

For supported devices later:

* WebXR
* image targets
* surface detection
* 3D models
* spatial audio
* animations

An AR experience can include:

* animated statue
* historical character
* reconstructed scene
* narrated story
* translations
* interactive hotspots

Example experience:

A statue becomes animated and speaks to the visitor while contextual information appears.

This type of artifact storytelling has been publicly demonstrated as part of Manetho's direction.

---

# 17. VR / 3D

Architecture must be ready for:

* 3D artifacts
* reconstructed temples
* tomb walkthroughs
* historical scenes
* virtual museums

Use:

Three.js
React Three Fiber
@react-three/drei

Do not load large 3D assets eagerly.

Use:

* lazy loading
* progressive loading
* Draco compression
* GLTF/GLB
* CDN

---

# 18. DISCOVER

Create:

/discover

Sections:

* Featured artifacts
* Recently discovered
* Egyptian gods
* Pharaohs
* Dynasties
* Temples
* Tombs
* Museums
* Popular translations
* Educational content

Cards should be highly visual.

---

# 19. LEARNING SYSTEM

Create:

/learn

Learning modules:

* Introduction to hieroglyphs
* Gardiner signs
* Egyptian gods
* Pharaohs
* Dynasties
* Egyptian mythology
* Egyptian language
* Temples
* Tombs
* Daily life
* Ancient Egyptian writing

Features:

* lessons
* quizzes
* progress
* streaks
* achievements
* saved lessons

---

# 20. HIEROGlyph KNOWLEDGE DATABASE

Create a dedicated sign database.

HieroglyphSign:

id
gardinerCode
unicode
image
name
description
category
phoneticValues
ideographicMeaning
determinativeMeaning
variants
era
sources

Categories may include:

* A: Man and his occupations
* B: Woman and her occupations
* C: Anthropomorphic deities
* D: Parts of the human body
* E: Mammals
* F: Parts of mammals
* G: Birds
* H: Parts of birds
* I: Amphibians/reptiles
* K: Fish
* L: Invertebrates
* M: Plants
* N: Sky/Earth/Water
* O: Buildings
* P: Boats
* Q: Furniture
* R: Temple furniture
* S: Crowns/dresses
* T: Warfare/hunting
* U: Agriculture/crafts
* V: Rope/baskets
* W: Vessels
* X: Bread/cakes
* Y: Writing/games/music
* Z: Strokes/geometric signs
* Aa: unclassified signs

The database must support variants and historical differences.

---

# 21. AI TRANSLATION PIPELINE

Do not make the frontend responsible for AI logic.

Architecture:

Next.js
|
API
|
AI Gateway
|
-

|         |             |
OCR       Vision        LLM
|         |             |
Sign DB   Detection     Knowledge DB
|
Translation Engine
|
Result Normalizer
|
Next.js

Each AI provider must be replaceable.

Create interfaces:

VisionProvider
OCRProvider
TranslationProvider
EmbeddingProvider
LLMProvider
SpeechToTextProvider
TextToSpeechProvider

Never tightly couple application logic to one AI vendor.

---

# 22. AI RESULT SCHEMA

Every recognition response should follow a structured schema.

Example:

{
"requestId": "...",
"imageId": "...",
"status": "completed",
"detections": [
{
"id": "...",
"boundingBox": {
"x": 0,
"y": 0,
"width": 0,
"height": 0
},
"gardinerCode": "...",
"unicode": "...",
"transliteration": "...",
"phoneticValues": [],
"confidence": 0.0
}
],
"transliteration": "...",
"translation": "...",
"alternatives": [],
"explanation": "...",
"sources": []
}

Validate all AI output using Zod.

Never trust model-generated JSON without validation.

---

# 23. AI SAFETY / ACCURACY

Cultural and historical accuracy is critical.

The assistant must:

* distinguish known facts from interpretation
* show uncertainty
* avoid hallucinated historical claims
* provide sources when possible
* distinguish modern reconstruction from archaeological evidence
* distinguish scholarly consensus from disputed theories

For translation:

Never claim 100% certainty unless explicitly justified.

When recognition is poor:

"I couldn't confidently read this inscription."

Offer:

* better image
* crop
* retry
* manual selection

Do not invent a translation.

---

# 24. KNOWLEDGE / RAG

Create a retrieval system.

Knowledge sources may include:

* museum records
* academic sources
* approved Egyptology references
* artifact metadata
* internal Manetho knowledge base
* curated historical datasets

Pipeline:

Question
→ classify intent
→ retrieve relevant documents
→ retrieve artifact context
→ retrieve sign context
→ construct grounded prompt
→ LLM
→ validate
→ citations
→ response

Use vector search.

Recommended:

PostgreSQL + pgvector

or a dedicated vector database later.

---

# 25. USER AUTHENTICATION

Support:

* email/password
* Google
* Apple
* anonymous guest mode

Guest users should be able to try the translator.

Authenticated users can access:

* history
* saved translations
* conversations
* learning progress
* preferences

Roles:

USER
RESEARCHER
MUSEUM_EDITOR
MUSEUM_ADMIN
CONTENT_EDITOR
SUPER_ADMIN

Use RBAC.

Never rely on frontend role checks alone.

---

# 26. USER PROFILE

Profile fields:

id
name
email
avatar
preferredLanguage
preferredAssistantMode
createdAt

Settings:

* language
* theme
* voice
* notifications
* privacy
* data controls

---

# 27. HISTORY

Route:

/app/history

Save:

* scanned images
* translation results
* assistant conversations
* artifacts viewed
* museum visits
* tours

Allow:

* search
* filter
* delete
* save/favorite
* export

---

# 28. FAVORITES

Users can save:

* artifacts
* translations
* hieroglyphs
* lessons
* museums
* conversations

Create a generic SavedItem abstraction.

---

# 29. INTERNATIONALIZATION

Initial languages:

English
Arabic

Architecture must support:

French
German
Spanish
Chinese
Japanese

Use:

next-intl

RTL must be first-class.

Arabic UI must not be an afterthought.

Support:

* RTL layouts
* Arabic fonts
* mixed Arabic/English text
* hieroglyphic text
* transliteration

---

# 30. DESIGN SYSTEM

Create a consistent design system.

Colors:

Primary:
deep charcoal / obsidian

Secondary:
sandstone

Accent:
ancient gold

Supporting:
papyrus / ivory

Use CSS variables.

Do not hard-code colors throughout components.

Typography:

Modern sans-serif for UI.

Use an appropriate Egyptian/hieroglyphic display treatment only for decorative headings.

Do not sacrifice readability.

---

# 31. COMPONENT SYSTEM

Create reusable components:

Button
IconButton
Card
ArtifactCard
MuseumCard
HieroglyphCard
SignBadge
ConfidenceBadge
TranslationResult
DetectionOverlay
Scanner
CameraView
UploadZone
AIChat
ChatMessage
VoiceButton
AudioPlayer
Map
MuseumMap
ArtifactMarker
Timeline
SourceList
Citation
Quiz
ProgressBar
Modal
Drawer
Sheet
Tooltip
CommandPalette
Search
EmptyState
LoadingState
ErrorState

---

# 32. SCANNER COMPONENT

Scanner states:

idle
initializing
scanning
detecting
processing
completed
error

Display appropriate visual feedback.

Never leave users staring at an unexplained loading spinner.

---

# 33. RESPONSIVE DESIGN

Must work on:

mobile
tablet
desktop
large desktop

Mobile is extremely important.

The scanner must feel like a mobile application even inside a browser.

Desktop should provide richer research interfaces.

---

# 34. PWA

Configure Manetho as a Progressive Web App.

Features:

* installable
* offline shell
* cached museum content
* cached lessons
* cached artifact metadata
* camera support
* responsive mobile UI

Do not cache private AI conversations insecurely.

---

# 35. OFFLINE MODE

Architecture should allow selected functionality offline.

Potential offline capabilities:

* previously downloaded museum maps
* artifact metadata
* learning content
* selected sign database
* cached translations

AI inference may require network access unless a local model is later provided.

Clearly communicate offline limitations.

---

# 36. SEARCH

Global search:

Search:

* artifacts
* hieroglyphs
* museums
* pharaohs
* gods
* dynasties
* lessons

Use:

Postgres full-text search initially.

Prepare architecture for:

Elasticsearch/OpenSearch later.

---

# 37. ANALYTICS

Track product events.

Examples:

translator_opened
image_uploaded
scan_started
sign_detected
translation_completed
translation_failed
assistant_opened
assistant_message_sent
voice_started
artifact_opened
museum_opened
map_opened
route_started
ar_started
lesson_started
lesson_completed
favorite_created

Do not collect unnecessary personal data.

Analytics must respect privacy settings.

---

# 38. ERROR HANDLING

Every feature needs:

* loading state
* empty state
* error state
* retry
* graceful fallback

AI errors should be human-readable.

Bad:

"500 INTERNAL SERVER ERROR"

Good:

"We couldn't process this inscription right now. Please try again."

---

# 39. SECURITY

Implement:

* secure HTTP headers
* CSRF protection where applicable
* rate limiting
* upload validation
* MIME validation
* image size limits
* malware scanning architecture
* signed object-storage URLs
* server-side authorization
* API authentication
* secret management
* audit logging
* abuse prevention

Never expose:

* API keys
* model credentials
* database credentials
* service tokens

to the browser.

---

# 40. IMAGE UPLOAD SECURITY

Accept only:

JPEG
PNG
WEBP

Validate:

* extension
* MIME
* file signature
* size
* dimensions

Generate normalized images server-side.

Strip unnecessary metadata.

Store originals separately from processed images.

---

# 41. DATABASE

Use PostgreSQL.

Core models:

User
Session
Museum
MuseumFloor
MuseumRoom
Artifact
ArtifactImage
ArtifactTranslation
HieroglyphSign
HieroglyphDetection
TranslationRequest
TranslationResult
Conversation
Message
LearningCourse
LearningLesson
Quiz
QuizQuestion
UserProgress
SavedItem
MuseumTour
TourStop
ARExperience
ThreeDAsset
KnowledgeDocument
KnowledgeChunk
Citation
AIRequest
AIUsage
Feedback
AuditLog

Use proper indexes.

Use UUIDs.

Use timestamps.

Use soft deletion where appropriate.

---

# 42. API DESIGN

Use typed server APIs.

Potential routes:

POST /api/translate
POST /api/translate/image
GET /api/translate/[id]

POST /api/assistant
POST /api/assistant/stream

GET /api/artifacts
GET /api/artifacts/[id]

GET /api/museums
GET /api/museums/[id]
GET /api/museums/[id]/map

GET /api/hieroglyphs
GET /api/hieroglyphs/[id]

POST /api/voice/stt
POST /api/voice/tts

GET /api/history
POST /api/saved
DELETE /api/saved/[id]

Admin APIs must be protected by RBAC.

---

# 43. REAL-TIME COMMUNICATION

Use streaming for:

* AI assistant
* translation progress
* voice responses
* live scanner results

Preferred:

Server-Sent Events for simple AI streaming.

WebSockets when true bidirectional real-time functionality becomes necessary.

Do not introduce WebSockets everywhere unnecessarily.

---

# 44. FILE STORAGE

Use S3-compatible storage.

Buckets/logical areas:

/uploads
/processed
/artifacts
/3d
/audio
/museum-assets
/avatars

Use signed URLs.

Never expose private bucket credentials.

---

# 45. CACHING

Use Redis for:

* rate limits
* session-related ephemeral data
* AI response caching where safe
* museum content caching
* job status
* request deduplication

Do not cache user-specific sensitive data globally.

---

# 46. BACKGROUND JOBS

AI image processing should not block HTTP requests indefinitely.

Create job architecture.

Example:

Upload
→ create TranslationJob
→ queue
→ AI worker
→ save result
→ notify frontend

Use:

BullMQ + Redis

or another queue abstraction.

---

# 47. OBSERVABILITY

Integrate:

Sentry
PostHog
structured logs

Track:

* errors
* AI latency
* inference failures
* upload failures
* translation success rate
* token usage
* API latency
* queue latency

Do not log sensitive image contents or private conversations unnecessarily.

---

# 48. ADMIN DASHBOARD

Admin dashboard must include:

Overview

* active users
* translations
* AI requests
* museums
* artifacts
* errors

Content:

* artifacts
* hieroglyphs
* lessons
* knowledge documents

AI:

* model configuration
* provider configuration
* prompts
* usage
* failures

Museum:

* museums
* floors
* rooms
* maps
* tours
* AR experiences

Users:

* users
* roles
* moderation

System:

* jobs
* errors
* health

---

# 49. CMS

Museum/content editors need an interface to create:

* artifacts
* descriptions
* translations
* images
* sources
* tours
* lessons
* AR experiences

Use draft/published workflow.

Statuses:

DRAFT
REVIEW
PUBLISHED
ARCHIVED

---

# 50. SOURCE/CITATION SYSTEM

Every scholarly content item should be able to have sources.

Source:

id
title
author
publisher
url
publicationDate
type
citationText

Types:

BOOK
PAPER
MUSEUM
DATABASE
WEBSITE
CATALOG
ARCHIVE

The AI assistant should reference these sources when answers rely on them.

---

# 51. DESIGN PHILOSOPHY

Manetho should feel premium.

Avoid:

* generic SaaS gradients
* excessive rounded cards
* meaningless glassmorphism
* cartoon Egypt
* excessive gold
* clutter
* huge meaningless dashboards

Use:

* strong typography
* cinematic imagery
* subtle motion
* archaeological textures
* generous spacing
* high contrast
* intelligent data visualization

The application should feel like:

"the future of understanding the ancient world."

---

# 52. ANIMATION

Use Framer Motion.

Animations:

* page transitions
* scanner pulse
* detection boxes
* artifact reveal
* map transitions
* assistant message appearance
* loading states

Animations must respect:

prefers-reduced-motion.

---

# 53. ACCESSIBILITY

Target WCAG 2.2 AA.

Support:

* keyboard navigation
* screen readers
* focus states
* reduced motion
* high contrast
* semantic HTML
* accessible forms
* accessible dialogs
* accessible camera controls

Do not rely solely on color to communicate confidence/status.

---

# 54. PERFORMANCE

Target:

LCP < 2.5s
CLS < 0.1
INP < 200ms

Use:

* Next.js Server Components
* dynamic imports
* image optimization
* lazy loading
* streaming
* caching
* CDN
* compressed assets

Heavy 3D/AI features must load only when requested.

---

# 55. SEO

Public pages must support:

* metadata
* OpenGraph
* Twitter cards
* structured data
* sitemap
* robots
* canonical URLs

Artifact pages should be indexable.

Museum pages should be indexable.

Learning pages should be indexable.

Private application pages should not be indexed.

---

# 56. NEXT.JS ARCHITECTURE

Use App Router.

Suggested:

app/
(marketing)/
(app)/
museum/
artifact/
admin/
api/

components/
ui/
scanner/
translator/
assistant/
museum/
artifact/
learning/
map/
ar/
voice/

lib/
ai/
auth/
db/
storage/
search/
maps/
analytics/
security/
validation/

server/
services/
repositories/
jobs/

types/

hooks/

config/

public/

---

# 57. PACKAGE REQUIREMENTS

Use modern stable versions compatible with the selected Next.js version.

Core:

next
react
react-dom
typescript

UI:

tailwindcss
shadcn/ui
radix-ui
lucide-react

Forms/validation:

react-hook-form
zod
@hookform/resolvers

State:

zustand

Server data:

@tanstack/react-query

Database:

prisma
@prisma/client

Authentication:

Auth.js or Better Auth

Animation:

framer-motion

3D:

three
@react-three/fiber
@react-three/drei

Maps:

maplibre-gl
react-map-gl

Internationalization:

next-intl

AI:

Use an abstraction layer around the selected AI provider.

Do not spread provider-specific SDK calls across the application.

Storage:

AWS SDK S3-compatible client

Jobs:

bullmq
ioredis

Testing:

vitest
@testing-library/react
playwright

Monitoring:

@sentry/nextjs

Analytics:

PostHog

PWA:

Use a maintained Next.js-compatible PWA solution.

Do not blindly install packages.

Before installation, verify compatibility with the selected Next.js version.

---

# 58. AI PROVIDER ABSTRACTION

Create:

lib/ai/providers/

OpenAIProvider
HuaweiProvider
LocalProvider
MockProvider

Interfaces:

LLMProvider
VisionProvider
EmbeddingProvider
STTProvider
TTSProvider

Environment variables:

AI_PROVIDER=
LLM_MODEL=
VISION_MODEL=
EMBEDDING_MODEL=
STT_PROVIDER=
TTS_PROVIDER=

The frontend must never know which provider is active.

---

# 59. HUAWEI CLOUD COMPATIBILITY

The original Manetho implementation has publicly been described as using Huawei Cloud, ModelArts, and MindSpore.

Therefore the new architecture must be capable of connecting to Huawei AI infrastructure.

Do not make Huawei Cloud mandatory for local development.

Development:

Mock/local provider.

Production:

Huawei or another approved provider.

---

# 60. ENVIRONMENT VARIABLES

Create:

.env.example

Include:

DATABASE_URL=
DIRECT_DATABASE_URL=

REDIS_URL=

AUTH_SECRET=

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

S3_ENDPOINT=
S3_REGION=
S3_ACCESS_KEY=
S3_SECRET_KEY=
S3_BUCKET=

AI_PROVIDER=
AI_API_KEY=
AI_MODEL=

HUAWEI_CLOUD_REGION=
HUAWEI_CLOUD_ACCESS_KEY=
HUAWEI_CLOUD_SECRET_KEY=

MAP_PROVIDER=
MAP_TOKEN=

SENTRY_DSN=

POSTHOG_KEY=
POSTHOG_HOST=

Never commit .env.

---

# 61. LOCAL DEVELOPMENT

The entire project must run with:

npm install
npm run dev

Prefer Docker Compose for:

Postgres
Redis
optional local object storage

Provide:

docker-compose.yml

Commands:

npm run dev
npm run build
npm run start
npm run lint
npm run typecheck
npm run test
npm run test:e2e
npm run db:migrate
npm run db:seed

---

# 62. SEED DATA

Provide development seed data.

Create:

3 museums
20 artifacts
100+ hieroglyph signs
10 learning lessons
5 tours
sample translations
sample AI conversations

Include realistic but clearly marked demo data.

Do not invent claims about real archaeological artifacts and present them as verified historical facts.

---

# 63. DEMO MODE

Create a demo mode.

Users can try:

* sample hieroglyph image
* sample translation
* sample museum
* sample artifact
* sample AI conversation

This allows the UI to be evaluated without an AI API.

---

# 64. MOCK AI MODE

Create:

MockVisionProvider
MockTranslationProvider
MockLLMProvider

Mock responses must use deterministic fixtures.

This is essential for tests.

---

# 65. TESTING

Unit tests:

* translation schema
* sign normalization
* confidence handling
* authorization
* validation
* source handling

Integration tests:

* image upload
* translation API
* assistant API
* museum API

E2E:

* visitor opens translator
* uploads image
* sees result
* opens assistant
* asks question
* opens artifact
* opens museum map
* starts tour

---

# 66. QUALITY REQUIREMENTS

Before considering a feature complete:

* TypeScript passes
* ESLint passes
* unit tests pass
* E2E tests pass
* responsive design verified
* keyboard accessibility verified
* loading state implemented
* error state implemented
* empty state implemented
* authorization verified
* API validation verified
* no secret leakage
* no console errors

---

# 67. PRODUCT PHASES

Do not attempt to implement everything simultaneously.

## Phase 1 — Foundation

Build:

* Next.js project
* design system
* authentication
* database
* storage
* i18n
* landing page
* application shell
* responsive navigation

## Phase 2 — Translator

Build:

* upload
* camera
* processing
* detection visualization
* translation result
* sign details
* history

Use mock AI initially.

## Phase 3 — AI Assistant

Build:

* chat
* streaming
* artifact context
* translation context
* citations
* image upload
* conversation history

## Phase 4 — Museum

Build:

* museum database
* artifact database
* artifact pages
* map
* tours

## Phase 5 — Voice

Build:

* STT
* TTS
* voice agent
* contextual voice interaction

## Phase 6 — AR/3D

Build:

* 3D artifact viewer
* AR-ready architecture
* WebXR where supported
* interactive experiences

## Phase 7 — Institutional Platform

Build:

* CMS
* museum admin
* analytics
* roles
* content workflows
* knowledge management

---

# 68. MVP DEFINITION

The first production MVP must include:

1. Landing page
2. Authentication
3. Hieroglyph image upload
4. Camera scanning
5. Recognition result UI
6. Translation result
7. Sign-level information
8. AI Egyptology assistant
9. Image-aware AI chat
10. Translation history
11. Artifact pages
12. Museum pages
13. Basic museum map
14. Arabic/English
15. Responsive mobile UI
16. Admin dashboard
17. AI provider abstraction
18. PostgreSQL
19. Object storage
20. Monitoring
21. Tests
22. PWA

AR/VR can initially be feature-flagged.

---

# 69. FEATURE FLAGS

Create feature flags:

ENABLE_TRANSLATOR
ENABLE_AI_ASSISTANT
ENABLE_VOICE
ENABLE_MUSEUM_MAP
ENABLE_AR
ENABLE_VR
ENABLE_LEARNING
ENABLE_RESEARCH_MODE
ENABLE_OFFLINE_MODE

The product must be deployable with different feature combinations.

---

# 70. API CONTRACTS

All APIs must have:

* request validation
* response validation
* typed responses
* error codes
* rate limiting
* authorization
* logging

Use consistent errors:

{
"error": {
"code": "TRANSLATION_FAILED",
"message": "Unable to process the inscription.",
"requestId": "..."
}
}

---

# 71. AI REQUEST TRACKING

Every AI request gets:

id
userId
type
provider
model
status
latency
inputTokens
outputTokens
cost
createdAt

Do not store raw user images in AI logs.

---

# 72. PRIVACY

Provide:

* privacy policy
* delete account
* delete history
* export user data
* cookie preferences
* AI data settings

Users must understand whether uploaded images are stored.

Default to minimum necessary retention.

---

# 73. CONTENT MODERATION

AI assistant should have basic abuse/safety handling.

Prevent:

* prompt injection against internal tools
* unauthorized database access
* leaking system prompts
* malicious file uploads
* tool abuse

The AI must never execute arbitrary code from user messages.

---

# 74. PROMPT ARCHITECTURE

Keep system prompts in version-controlled files.

Example:

prompts/
egyptology-assistant/
system.md
visitor.md
educational.md
research.md

translation/
system.md

voice/
system.md

Every prompt should have a version.

AI requests should record prompt version.

---

# 75. ASSISTANT SYSTEM PROMPT

The Egyptology assistant should follow this behavior:

"You are Manetho, a specialized AI cultural heritage assistant.

Your purpose is to help users understand Ancient Egyptian civilization, hieroglyphic writing, artifacts, museums, archaeology, history, language, and related cultural heritage.

You must distinguish established historical knowledge from interpretation.

When information is uncertain or disputed, explicitly say so.

When a user provides a hieroglyphic translation result, use that result as contextual evidence but do not blindly trust it.

Never fabricate archaeological evidence, inscriptions, dates, artifacts, museum records, or scholarly citations.

When sources are available, cite them.

Explain complex concepts according to the user's selected mode:

visitor
educational
research

Remain respectful toward cultural heritage.

Do not claim that AI interpretation is equivalent to expert Egyptological scholarship."

---

# 76. TRANSLATION SYSTEM PROMPT

The translation model must:

* analyze detected signs
* consider sign order
* consider determinatives
* consider context
* distinguish transliteration from translation
* identify uncertainty
* provide alternatives
* never fabricate missing signs

Output structured JSON only.

Validate with Zod.

---

# 77. UX FOR FAILED RECOGNITION

If recognition fails:

Show:

"We couldn't confidently read this inscription."

Then:

* Try another photo
* Improve lighting
* Crop inscription
* Move closer
* Upload higher resolution image

Never show a fabricated translation.

---

# 78. MOBILE-FIRST SCANNER UX

On mobile:

bottom controls:

Gallery | Scan | History

Top:

Back | Flash | Settings

Detection:

floating result card

Swipe up:

full translation

Long press:

sign details

---

# 79. DESKTOP TRANSLATOR UX

Three-column layout:

LEFT:
original image

CENTER:
detection / sign sequence

RIGHT:
translation / explanation

Below:

sources
assistant
related artifacts

---

# 80. RESEARCH MODE

Research mode should expose:

* sign sequence
* Gardiner codes
* transliteration
* grammar notes
* alternative readings
* confidence
* source references
* artifact metadata
* export

Export:

PDF
JSON
CSV

---

# 81. EXPORT

Users can export translations.

PDF should contain:

Manetho branding
original image
detected signs
transliteration
translation
explanation
sources
date
confidence

Research export JSON:

{
artifact,
image,
detections,
transliteration,
translation,
alternatives,
sources
}

---

# 82. NOTIFICATION SYSTEM

Support:

* translation complete
* processing failed
* learning reminder
* museum tour reminder

Keep notifications optional.

---

# 83. SEARCH EXPERIENCE

Global command palette:

Cmd/Ctrl + K

Search:

Artifacts
Hieroglyphs
Museums
Lessons
Pharaohs
Gods

Provide keyboard navigation.

---

# 84. DESIGN DETAILS

Use subtle Egyptian-inspired motifs.

Possible UI elements:

* hieroglyph separators
* papyrus texture
* archaeological scan lines
* stone-inspired cards
* gold accent lines
* artifact silhouettes

But keep the application modern.

The product should look credible to:

* tourists
* universities
* museums
* researchers
* technology companies

not like a themed entertainment website.

---

# 85. BRAND POSITIONING

Primary statement:

"Decode the past. Understand civilization."

Alternative:

"Ancient Egypt, understood through AI."

Product description:

"Manetho is an AI-powered cultural heritage platform that transforms ancient artifacts, hieroglyphic inscriptions, museums, and historical knowledge into interactive digital experiences."

---

# 86. IMPORTANT IMPLEMENTATION RULE

Do not build fake functionality.

If a feature requires infrastructure that is not yet available:

1. Create the correct interface.
2. Create a provider abstraction.
3. Create a mock implementation.
4. Build the complete UI.
5. Clearly mark the feature as development/demo.
6. Make production integration straightforward.

Never pretend a mock AI model is a real translation model.

---

# 87. IMPORTANT ENGINEERING RULE

Do not create a giant monolithic page.

Use:

* feature modules
* reusable components
* services
* repositories
* providers
* typed schemas
* server actions/API routes where appropriate

Business logic must not live inside React components.

---

# 88. IMPORTANT AI RULE

Do not call an LLM directly from random UI components.

Correct:

UI
→ application service
→ AI gateway
→ provider
→ normalized result

Incorrect:

React component
→ fetch OpenAI/Huawei API directly

---

# 89. IMPORTANT DATABASE RULE

Do not store AI responses as arbitrary JSON blobs when the data should be queryable.

Use normalized relational data for:

* artifacts
* signs
* museums
* users
* translations
* sources

Use JSON only for genuinely flexible provider metadata.

---

# 90. IMPORTANT FUTURE ARCHITECTURE

The system must eventually support:

Mobile app
Web app
Museum kiosk
Museum tablet
AR glasses
VR
API for museums
Institutional dashboard
Research platform

Therefore:

The backend must be API-first.

The Next.js web application is one client, not the entire system.

---

# 91. FINAL BUILD COMMAND

After understanding this specification:

1. Inspect the repository.
2. Identify existing code.
3. Do not destroy existing functionality without reason.
4. Create a technical implementation plan.
5. Create the architecture.
6. Install only necessary packages.
7. Build the design system.
8. Build the database schema.
9. Build authentication.
10. Build the application shell.
11. Build translator MVP.
12. Build AI assistant.
13. Build artifact system.
14. Build museum system.
15. Add testing.
16. Add monitoring.
17. Add documentation.

At every stage:

* run type checking
* run linting
* run tests
* fix errors before continuing

Do not leave TypeScript errors.

Do not leave broken imports.

Do not leave placeholder UI where a real component is expected.

---

# 92. DEFINITION OF DONE

The application is considered successful when a new visitor can:

1. Open Manetho.
2. Understand what it does immediately.
3. Start the translator without creating an account.
4. Upload or capture a hieroglyphic image.
5. See recognition results.
6. See individual detected signs.
7. See transliteration.
8. See translation.
9. See confidence/uncertainty.
10. Ask the AI Egyptology assistant about the inscription.
11. Receive contextual information.
12. Open the associated artifact.
13. Explore the museum.
14. View its map.
15. Start a museum tour.
16. Use voice interaction where enabled.
17. Save the discovery after signing in.
18. Return to it later.
19. Use the product comfortably in Arabic or English.

The product should feel like a real, premium cultural technology platform rather than a prototype.

---

# 93. SOURCE OF TRUTH

Public product information used to establish this specification includes:

Dark Pyramid official product/project information:
https://www.darkpyramid.net/projects

Dark Pyramid case studies:
https://www.darkpyramid.net/case-studies

Dark Pyramid product information:
https://www.darkpyramid.net/products

Dark Pyramid homepage:
https://www.darkpyramid.net/

Public Manetho App Store listing:
https://apps.apple.com/eg/app/mannetho/id6741394696

Huawei public description of Manetho:
https://www.linkedin.com/posts/huawei_manetho-ai-powered-hieroglyphic-translation-activity-7470348255000846337-7bx6

IMPORTANT:
Public sources describe the product direction and existing capabilities, but they do not expose the complete private production architecture.

Do not infer undocumented internal implementation details as fact.

Where this specification adds new functionality, treat it as the planned next-generation implementation rather than an assertion that the existing Manetho system already contains that feature.

END OF SPECIFICATION.
