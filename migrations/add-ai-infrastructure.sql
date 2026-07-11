-- ============================================================================
-- AI INFRASTRUCTURE DEEP COUPLING MIGRATION
-- Transforms AI from optional to core by tracking every AI decision
-- ============================================================================

-- Add AI metadata columns to itinerary_items
ALTER TABLE itinerary_items ADD COLUMN IF NOT EXISTS ai_confidence_score DECIMAL(3,2) DEFAULT NULL;
ALTER TABLE itinerary_items ADD COLUMN IF NOT EXISTS ai_reasoning TEXT DEFAULT NULL;
ALTER TABLE itinerary_items ADD COLUMN IF NOT EXISTS ai_model_version VARCHAR(50) DEFAULT NULL;
ALTER TABLE itinerary_items ADD COLUMN IF NOT EXISTS ai_generated_at TIMESTAMP DEFAULT NULL;
ALTER TABLE itinerary_items ADD COLUMN IF NOT EXISTS ai_generation_id VARCHAR(100) DEFAULT NULL;

-- Create indexes for AI queries
CREATE INDEX IF NOT EXISTS idx_itinerary_items_ai_generated ON itinerary_items(ai_generated_at) WHERE ai_generated_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_itinerary_items_generation_id ON itinerary_items(ai_generation_id) WHERE ai_generation_id IS NOT NULL;

-- ============================================================================
-- AI Generation Feedback Table
-- Tracks user interactions with AI-generated content to learn preferences
-- ============================================================================
CREATE TABLE IF NOT EXISTS ai_generation_feedback (
  id SERIAL PRIMARY KEY,
  trip_id INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  generation_id VARCHAR(100) NOT NULL,
  item_id INTEGER REFERENCES itinerary_items(id) ON DELETE SET NULL,

  -- What happened to the AI suggestion
  feedback_type VARCHAR(20) NOT NULL CHECK (feedback_type IN ('kept', 'edited', 'deleted', 'upvoted', 'downvoted')),

  -- Original AI suggestion
  original_suggestion JSONB NOT NULL,

  -- User's modification (if edited)
  user_modification JSONB DEFAULT NULL,

  -- Modification details
  field_changed VARCHAR(100) DEFAULT NULL, -- e.g., 'price', 'time', 'location'
  change_magnitude DECIMAL(10,2) DEFAULT NULL, -- e.g., price changed by $50

  -- Context at time of feedback
  user_preferences JSONB DEFAULT NULL,
  trip_context JSONB DEFAULT NULL,

  -- Metadata
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  feedback_source VARCHAR(50) DEFAULT 'manual' -- 'manual', 'vote', 'automatic'
);

-- Indexes for learning queries
CREATE INDEX IF NOT EXISTS idx_ai_feedback_user ON ai_generation_feedback(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_feedback_trip ON ai_generation_feedback(trip_id);
CREATE INDEX IF NOT EXISTS idx_ai_feedback_type ON ai_generation_feedback(feedback_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_feedback_generation ON ai_generation_feedback(generation_id);

-- ============================================================================
-- AI Cost Log Table
-- Tracks every AI operation cost for optimization and billing
-- ============================================================================
CREATE TABLE IF NOT EXISTS ai_cost_log (
  id SERIAL PRIMARY KEY,

  -- Operation details
  trip_id INTEGER REFERENCES trips(id) ON DELETE SET NULL,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  operation VARCHAR(50) NOT NULL, -- 'itinerary_gen', 'conflict_resolution', etc.
  generation_id VARCHAR(100) DEFAULT NULL,

  -- Model info
  model VARCHAR(50) NOT NULL,
  model_version VARCHAR(50) DEFAULT NULL,

  -- Token usage
  input_tokens INTEGER NOT NULL,
  output_tokens INTEGER NOT NULL,
  total_tokens INTEGER GENERATED ALWAYS AS (input_tokens + output_tokens) STORED,

  -- Cost calculation
  cost_usd DECIMAL(10,6) NOT NULL,
  cached BOOLEAN DEFAULT FALSE,

  -- Performance
  duration_ms INTEGER DEFAULT NULL,
  attempts INTEGER DEFAULT 1,
  success BOOLEAN NOT NULL DEFAULT TRUE,
  error_type VARCHAR(100) DEFAULT NULL,

  -- Metadata
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  context JSONB DEFAULT NULL
);

-- Indexes for cost analysis
CREATE INDEX IF NOT EXISTS idx_ai_cost_operation ON ai_cost_log(operation, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_cost_user ON ai_cost_log(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_cost_trip ON ai_cost_log(trip_id);
CREATE INDEX IF NOT EXISTS idx_ai_cost_date ON ai_cost_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_cost_model ON ai_cost_log(model, created_at DESC);

-- ============================================================================
-- AI User Preferences Table
-- Learned preferences from user behavior (proprietary dataset)
-- ============================================================================
CREATE TABLE IF NOT EXISTS ai_user_preferences (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Preference type
  preference_category VARCHAR(50) NOT NULL, -- 'budget', 'dining', 'activities', 'timing', etc.
  preference_key VARCHAR(100) NOT NULL,

  -- Learned value
  preference_value JSONB NOT NULL,
  confidence_score DECIMAL(3,2) NOT NULL DEFAULT 0.5, -- 0.0 to 1.0

  -- Learning metadata
  sample_size INTEGER NOT NULL DEFAULT 1, -- How many trips this is based on
  last_confirmed_at TIMESTAMP DEFAULT NULL,
  last_violated_at TIMESTAMP DEFAULT NULL,

  -- Context
  learned_from_trips INTEGER[] DEFAULT ARRAY[]::INTEGER[],
  destinations_applicable VARCHAR(100)[] DEFAULT NULL, -- NULL = global, else specific

  -- Metadata
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

  -- Unique constraint per user + category + key
  UNIQUE(user_id, preference_category, preference_key)
);

-- Indexes for preference lookup
CREATE INDEX IF NOT EXISTS idx_ai_prefs_user ON ai_user_preferences(user_id, confidence_score DESC);
CREATE INDEX IF NOT EXISTS idx_ai_prefs_category ON ai_user_preferences(preference_category, confidence_score DESC);
CREATE INDEX IF NOT EXISTS idx_ai_prefs_updated ON ai_user_preferences(updated_at DESC);

-- ============================================================================
-- Atlas Monitoring State Table
-- Tracks proactive monitoring state and interventions
-- ============================================================================
CREATE TABLE IF NOT EXISTS atlas_monitoring_state (
  id SERIAL PRIMARY KEY,
  trip_id INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,

  -- Last check
  last_checked_at TIMESTAMP NOT NULL DEFAULT NOW(),
  next_check_at TIMESTAMP NOT NULL DEFAULT NOW() + INTERVAL '15 minutes',

  -- Trip health metrics (cached)
  completion_percentage DECIMAL(5,2) DEFAULT 0.0,
  budget_usage_percentage DECIMAL(5,2) DEFAULT 0.0,
  days_until_trip INTEGER DEFAULT NULL,
  stuck_votes_count INTEGER DEFAULT 0,
  inactive_days INTEGER DEFAULT 0,

  -- Intervention history
  last_intervention_at TIMESTAMP DEFAULT NULL,
  last_intervention_type VARCHAR(50) DEFAULT NULL,
  intervention_count INTEGER DEFAULT 0,

  -- Suppression (don't notify too much)
  suppressed_until TIMESTAMP DEFAULT NULL,
  suppression_reason VARCHAR(100) DEFAULT NULL,

  -- Metadata
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

  UNIQUE(trip_id)
);

-- Indexes for monitoring queries
CREATE INDEX IF NOT EXISTS idx_atlas_next_check ON atlas_monitoring_state(next_check_at) WHERE suppressed_until IS NULL OR suppressed_until < NOW();
CREATE INDEX IF NOT EXISTS idx_atlas_trip ON atlas_monitoring_state(trip_id);

-- ============================================================================
-- Atlas Interventions Table
-- Log of all Atlas AI interventions
-- ============================================================================
CREATE TABLE IF NOT EXISTS atlas_interventions (
  id SERIAL PRIMARY KEY,
  trip_id INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,

  -- Intervention details
  intervention_type VARCHAR(50) NOT NULL, -- 'budget_alert', 'deadline_warning', 'vote_deadlock', etc.
  trigger_condition VARCHAR(100) NOT NULL,
  severity VARCHAR(20) NOT NULL CHECK (severity IN ('info', 'warning', 'urgent')),

  -- AI-generated message
  message TEXT NOT NULL,
  suggested_actions JSONB DEFAULT NULL, -- Array of action objects

  -- User interaction
  viewed BOOLEAN DEFAULT FALSE,
  viewed_at TIMESTAMP DEFAULT NULL,
  dismissed BOOLEAN DEFAULT FALSE,
  dismissed_at TIMESTAMP DEFAULT NULL,
  action_taken VARCHAR(50) DEFAULT NULL,

  -- AI metadata
  model_used VARCHAR(50) DEFAULT NULL,
  generation_id VARCHAR(100) DEFAULT NULL,
  confidence_score DECIMAL(3,2) DEFAULT NULL,

  -- Metadata
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP DEFAULT NULL
);

-- Indexes for intervention queries
CREATE INDEX IF NOT EXISTS idx_atlas_interventions_trip ON atlas_interventions(trip_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_atlas_interventions_active ON atlas_interventions(trip_id) WHERE NOT dismissed AND (expires_at IS NULL OR expires_at > NOW());
CREATE INDEX IF NOT EXISTS idx_atlas_interventions_type ON atlas_interventions(intervention_type, created_at DESC);

-- ============================================================================
-- Views for analytics
-- ============================================================================

-- AI Cost Summary View
CREATE OR REPLACE VIEW ai_cost_summary AS
SELECT
  operation,
  model,
  DATE(created_at) as date,
  COUNT(*) as total_operations,
  SUM(CASE WHEN success THEN 1 ELSE 0 END) as successful_operations,
  SUM(CASE WHEN cached THEN 1 ELSE 0 END) as cached_operations,
  SUM(input_tokens) as total_input_tokens,
  SUM(output_tokens) as total_output_tokens,
  SUM(cost_usd) as total_cost_usd,
  AVG(duration_ms) as avg_duration_ms,
  AVG(attempts) as avg_attempts
FROM ai_cost_log
GROUP BY operation, model, DATE(created_at)
ORDER BY date DESC, total_cost_usd DESC;

-- User Learning Progress View
CREATE OR REPLACE VIEW ai_learning_progress AS
SELECT
  u.id as user_id,
  u.name as user_name,
  COUNT(DISTINCT ap.id) as learned_preferences_count,
  AVG(ap.confidence_score) as avg_confidence,
  COUNT(DISTINCT ap.preference_category) as categories_learned,
  MAX(ap.updated_at) as last_learning_at,
  SUM(ap.sample_size) as total_samples
FROM users u
LEFT JOIN ai_user_preferences ap ON u.id = ap.user_id
GROUP BY u.id, u.name;

-- Atlas Monitoring Dashboard View
CREATE OR REPLACE VIEW atlas_dashboard AS
SELECT
  t.id as trip_id,
  t.destination,
  t.start_date,
  ams.completion_percentage,
  ams.budget_usage_percentage,
  ams.days_until_trip,
  ams.stuck_votes_count,
  ams.inactive_days,
  ams.last_intervention_at,
  ams.intervention_count,
  COUNT(ai.id) as active_interventions
FROM trips t
LEFT JOIN atlas_monitoring_state ams ON t.id = ams.trip_id
LEFT JOIN atlas_interventions ai ON t.id = ai.trip_id AND NOT ai.dismissed
WHERE t.status = 'planning'
GROUP BY t.id, t.destination, t.start_date, ams.completion_percentage,
         ams.budget_usage_percentage, ams.days_until_trip, ams.stuck_votes_count,
         ams.inactive_days, ams.last_intervention_at, ams.intervention_count;

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON TABLE ai_generation_feedback IS 'Tracks user modifications to AI suggestions for learning';
COMMENT ON TABLE ai_cost_log IS 'Logs every AI operation cost for optimization and billing';
COMMENT ON TABLE ai_user_preferences IS 'Learned user preferences - proprietary competitive dataset';
COMMENT ON TABLE atlas_monitoring_state IS 'Atlas AI proactive monitoring state per trip';
COMMENT ON TABLE atlas_interventions IS 'Log of Atlas AI proactive interventions';

COMMENT ON COLUMN itinerary_items.ai_confidence_score IS 'AI confidence in this suggestion (0.0-1.0)';
COMMENT ON COLUMN itinerary_items.ai_reasoning IS 'Why AI chose this item (for transparency)';
COMMENT ON COLUMN itinerary_items.ai_model_version IS 'Model version that generated this (claude-sonnet-4-5, etc)';
COMMENT ON COLUMN itinerary_items.ai_generation_id IS 'Links items from same generation batch';
