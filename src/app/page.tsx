import { getTrendingTokens } from "@/services/birdeye/client";
import RadarDashboard from "@/components/dashboard/RadarDashboard";

export default async function HomePage() {
  // İlk veri yüklemesi (Server Component içerisinde yapıldığı için çok hızlıdır ve SEO dostudur)
  let initialTrending = [];
  try {
    initialTrending = await getTrendingTokens();
  } catch (error) {
    console.error("Failed to fetch initial trending tokens:", error);
  }

  return <RadarDashboard initialTrending={initialTrending} />;
}
