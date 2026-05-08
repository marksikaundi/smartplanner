import { supabase } from "@/lib/supabase";

export const fetchOpenReports = async () => {
  const { data, error } = await supabase.from("reports").select("*").eq("status", "open");
  if (error) throw error;
  return data ?? [];
};

export const moderateReport = async (reportId: string, action: "resolved" | "dismissed") => {
  const { error } = await supabase.from("reports").update({ status: action }).eq("id", reportId);
  if (error) throw error;
};
