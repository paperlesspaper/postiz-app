import { internalFetch } from '@gitroom/helpers/utils/internal.fetch';
import { notFound, redirect } from 'next/navigation';
import { ReelHandoff } from '@gitroom/frontend/components/reels/reel-handoff';

export default async function ReelPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const response = await internalFetch(
    `/posts/${encodeURIComponent(id)}/reel-handoff`
  );
  if (response.status === 401) redirect('/auth/logout');
  if (response.status === 404) notFound();
  if (!response.ok) throw new Error('Could not load reel draft');
  const draft = await response.json();
  return <ReelHandoff key={`${draft.id}:${draft.video}`} draft={draft} />;
}
