-- User activity audit log
CREATE TABLE IF NOT EXISTS "UserActivities" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES "Users"(id) ON DELETE RESTRICT,
    action VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NULL,
    details VARCHAR(1000) NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS ix_user_activities_user_id ON "UserActivities"(user_id);
CREATE INDEX IF NOT EXISTS ix_user_activities_action ON "UserActivities"(action);
CREATE INDEX IF NOT EXISTS ix_user_activities_created_at ON "UserActivities"(created_at DESC);
