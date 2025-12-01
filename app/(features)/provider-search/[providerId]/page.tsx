import { ProviderProfilePage } from "@/features/provider-search/components/ProviderProfilePage";

interface ProviderProfilePageProps {
  params: Promise<{
    providerId: string;
  }>;
  searchParams: Promise<{
    [key: string]: string | string[] | undefined;
  }>;
}

export default async function ProviderProfileRoute({
  params,
  searchParams,
}: ProviderProfilePageProps) {
  const { providerId } = await params;
  const resolvedSearchParams = await searchParams;

  return (
    <ProviderProfilePage
      providerId={providerId}
      searchParams={resolvedSearchParams}
    />
  );
}
