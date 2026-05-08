import { Listing } from "@/types/models";

export const categories = [
  "Phones",
  "Furniture",
  "Notes",
  "Electronics",
  "Fashion",
  "Hostel items",
  "Bikes",
  "Books",
  "Accessories",
  "Miscellaneous",
] as const;

const seller = {
  id: "u1",
  username: "Ari.n",
  rating: 4.8,
  verified: true,
  campus: "Nairobi Campus",
};

export const listingsMock: Listing[] = Array.from({ length: 18 }).map((_, i) => ({
  id: `l-${i + 1}`,
  title: i % 2 === 0 ? "iPhone 13 Pro 128GB" : "Ergonomic Study Chair",
  description: "Clean condition, student-owned, available for meetup around campus.",
  category: i % 2 === 0 ? "Phones" : "Furniture",
  condition: i % 2 === 0 ? "good" : "like_new",
  price: i % 2 === 0 ? 620 : 90,
  negotiable: true,
  location: "Nairobi Campus",
  images: ["https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=1200"],
  createdAt: new Date(Date.now() - i * 1000 * 60 * 24).toISOString(),
  seller,
  featured: i < 3,
}));
