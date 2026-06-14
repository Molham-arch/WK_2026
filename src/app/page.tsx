import { Dashboard } from "@/components/dashboard";
import { getWorldCupData } from "@/lib/world-cup";

export const revalidate = 30;

export default async function Home() {
  const data = await getWorldCupData();

  return <Dashboard data={data} />;
}
