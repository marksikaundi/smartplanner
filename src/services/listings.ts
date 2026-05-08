import { supabase } from "@/lib/supabase";
import { listingsMock } from "@/services/mock";
import { Listing } from "@/types/models";

export const fetchListings = async (query?: string) => {
  const q = query?.trim();
  const sql = supabase
    .from("listings")
    .select("id,title,description,price,condition,negotiable,location,images,created_at,seller:users!listings_seller_id_fkey(id,username,avatar_url,rating,verified,campus)")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(40);
  if (q) {
    sql.ilike("title", `%${q}%`);
  }
  const { data, error } = await sql;
  if (error || !data?.length) {
    const fallback = listingsMock;
    return q ? fallback.filter((item) => item.title.toLowerCase().includes(q.toLowerCase())) : fallback;
  }
  return data.map((row) => ({
    id: row.id,
    title: row.title,
    description: row.description,
    category: "Miscellaneous",
    condition: row.condition as Listing["condition"],
    price: Number(row.price),
    negotiable: row.negotiable,
    location: row.location,
    images: row.images ?? [],
    createdAt: row.created_at,
    seller: {
      id: row.seller?.id ?? "",
      username: row.seller?.username ?? "seller",
      avatarUrl: row.seller?.avatar_url ?? undefined,
      rating: Number(row.seller?.rating ?? 5),
      verified: Boolean(row.seller?.verified),
      campus: row.seller?.campus ?? "",
    },
  })) as Listing[];
};

export const fetchListingById = async (id: string): Promise<Listing | null> => {
  const found = (await fetchListings()).find((x) => x.id === id);
  return found ?? null;
};

export const createListing = async (payload: Partial<Listing>) => {
  const { data: authData } = await supabase.auth.getUser();
  const authId = authData.user?.id;
  if (!authId) throw new Error("Please sign in to post listings.");
  const { data: me } = await supabase.from("users").select("id,campus").eq("auth_user_id", authId).single();
  if (!me?.id) throw new Error("Profile missing. Complete account setup.");

  const { error } = await supabase.from("listings").insert({
    seller_id: me.id,
    title: payload.title,
    description: payload.description,
    price: payload.price,
    condition: payload.condition,
    negotiable: payload.negotiable,
    location: payload.location,
    campus: me.campus,
    images: payload.images,
  });
  if (error) throw error;
  return true;
};
