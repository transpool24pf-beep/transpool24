import { PostEditor } from "../PostEditor";

type Props = { params: Promise<{ id: string }> };

export default async function EditBlogPostPage({ params }: Props) {
  const { id } = await params;
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-[#0d2137]">Artikel bearbeiten</h1>
      <PostEditor postId={id} />
    </div>
  );
}
