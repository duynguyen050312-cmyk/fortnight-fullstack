-- =====================================================
-- Fortnight database schema
-- Supabase PostgreSQL with Supabase Auth integration
-- =====================================================

-- One profile per authenticated user.
CREATE TABLE IF NOT EXISTS public.profiles (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    visa_type TEXT NOT NULL,
    study_period_start DATE NOT NULL,
    study_period_end DATE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT profiles_study_period_valid
        CHECK (study_period_end >= study_period_start)
);

-- Worked shifts belonging to authenticated users.
CREATE TABLE IF NOT EXISTS public.shifts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    shift_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    hours NUMERIC(5, 2) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT shifts_end_after_start
        CHECK (end_time > start_time),

    CONSTRAINT shifts_hours_valid
        CHECK (hours > 0 AND hours <= 16)
);

-- Supports each user's rolling-date queries and ordered shift list.
CREATE INDEX IF NOT EXISTS shifts_user_id_shift_date_idx
    ON public.shifts (user_id, shift_date);

-- =====================================================
-- Row Level Security
-- =====================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;

-- Profiles: users may access only their own single profile.
DROP POLICY IF EXISTS "Users can select own profile" ON public.profiles;
CREATE POLICY "Users can select own profile"
    ON public.profiles
    FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
    ON public.profiles
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
    ON public.profiles
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own profile" ON public.profiles;
CREATE POLICY "Users can delete own profile"
    ON public.profiles
    FOR DELETE
    USING (auth.uid() = user_id);

-- Shifts: users may access only their own shifts.
DROP POLICY IF EXISTS "Users can select own shifts" ON public.shifts;
CREATE POLICY "Users can select own shifts"
    ON public.shifts
    FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own shifts" ON public.shifts;
CREATE POLICY "Users can insert own shifts"
    ON public.shifts
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own shifts" ON public.shifts;
CREATE POLICY "Users can update own shifts"
    ON public.shifts
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own shifts" ON public.shifts;
CREATE POLICY "Users can delete own shifts"
    ON public.shifts
    FOR DELETE
    USING (auth.uid() = user_id);