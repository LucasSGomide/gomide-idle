CREATE TABLE "server_meta" (
	"id" integer PRIMARY KEY DEFAULT 1,
	"socket_protocol_version" integer NOT NULL,
	"content_pack_version" text NOT NULL,
	"build_id" text NOT NULL,
	CONSTRAINT "server_meta_singleton" CHECK ("id" = 1)
);

--> statement-breakpoint
-- FR.10.2: seed exactly one row. socket_protocol_version is stack-api.md rule
-- 15's permanent integer (libs/contracts SOCKET_PROTOCOL_VERSION). build_id is a
-- placeholder — the running API reports env.BUILD_ID (see resolve-build-id.ts).
INSERT INTO "server_meta" ("id", "socket_protocol_version", "content_pack_version", "build_id")
VALUES (1, 1, '0.1.0', 'unknown');
