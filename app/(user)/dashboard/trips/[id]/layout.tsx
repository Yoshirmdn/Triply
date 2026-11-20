import { TripTabs } from "@/components/fragment/trip-tabs";

type TripLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
};

export default async function TripLayout({
  children,
  params,
}: TripLayoutProps) {
  const { id } = await params;

  return (
    <div>
      <TripTabs tripId={id} />
      {children}
    </div>
  );
}
