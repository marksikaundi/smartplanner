import { supabase } from "@/lib/supabase";

export const createFeaturedListingPayment = async ({
  userId,
  listingId,
  amount,
}: {
  userId: string;
  listingId: string;
  amount: number;
}) => {
  const { error } = await supabase.from("featured_payments").insert({
    user_id: userId,
    listing_id: listingId,
    amount,
    currency: "USD",
    status: "pending",
    provider: "stripe",
  });
  if (error) throw error;
};

export const subscribeSellerPlan = async (userId: string, plan: "basic" | "premium") => {
  const { error } = await supabase.from("subscriptions").insert({
    user_id: userId,
    plan,
    active: true,
  });
  if (error) throw error;
};
