import { PageEditor } from "../PageEditor";

type Props = { params: Promise<{ id: string }> };

export default async function EditBlogPagePage({ params }: Props) {
  const { id } = await params;
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-[#0d2137]">Seite bearbeiten</h1>
      <PageEditor pageId={id} />
    </div>
  );
}
