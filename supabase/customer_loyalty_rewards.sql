-- =============================================
-- CUSTOMER LOYALTY & LUCKY SCRATCH CARD REWARDS
-- =============================================

-- 1. Create user_rewards table
CREATE TABLE IF NOT EXISTS public.user_rewards (
  user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  stars_count INT NOT NULL DEFAULT 0,
  scratch_cards_unlocked INT NOT NULL DEFAULT 0,
  total_credit_earned NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Create loyalty_star_logs table to track order stars awarded (min order ₹150)
CREATE TABLE IF NOT EXISTS public.loyalty_star_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  order_id UUID UNIQUE NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  order_amount NUMERIC(10,2) NOT NULL,
  stars_awarded INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Create claimed_scratch_cards table
CREATE TABLE IF NOT EXISTS public.claimed_scratch_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  reward_amount NUMERIC(10,2) NOT NULL,
  claimed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Row Level Security (RLS) Policies
ALTER TABLE public.user_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_star_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.claimed_scratch_cards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read user_rewards" ON public.user_rewards;
CREATE POLICY "Public read user_rewards" ON public.user_rewards FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users manage user_rewards" ON public.user_rewards;
CREATE POLICY "Users manage user_rewards" ON public.user_rewards FOR ALL USING (true);

DROP POLICY IF EXISTS "Public read loyalty_star_logs" ON public.loyalty_star_logs;
CREATE POLICY "Public read loyalty_star_logs" ON public.loyalty_star_logs FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users insert loyalty_star_logs" ON public.loyalty_star_logs;
CREATE POLICY "Users insert loyalty_star_logs" ON public.loyalty_star_logs FOR ALL USING (true);

DROP POLICY IF EXISTS "Public read claimed_scratch_cards" ON public.claimed_scratch_cards;
CREATE POLICY "Public read claimed_scratch_cards" ON public.claimed_scratch_cards FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users insert claimed_scratch_cards" ON public.claimed_scratch_cards;
CREATE POLICY "Users insert claimed_scratch_cards" ON public.claimed_scratch_cards FOR ALL USING (true);
