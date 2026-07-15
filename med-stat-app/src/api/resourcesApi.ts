import api from "./axios";

export interface Resource {
  id: number;
  title: string;
  original_filename: string;
  lesson_id: number | null;
  lesson_title: string | null;
  exam_id: number | null;
  exam_title: string | null;
  url: string;
  uploaded_at: string;
  /** Only meaningful for students; professors/admins always get true. */
  unlocked: boolean;
  lock_reason: "complete_lesson" | "take_exam" | null;
}

export async function getResources(params?: {
  lesson_id?: number;
  exam_id?: number;
}): Promise<Resource[]> {
  const response = await api.get<{ resources: Resource[] }>("/resources", {
    params,
  });

  return response.data.resources;
}

export async function uploadResource(
  file: File,
  target: { lesson_id?: number; exam_id?: number; title?: string }
): Promise<Resource> {
  const formData = new FormData();
  formData.append("file", file);

  if (target.lesson_id) formData.append("lesson_id", String(target.lesson_id));
  if (target.exam_id) formData.append("exam_id", String(target.exam_id));
  if (target.title) formData.append("title", target.title);

  const response = await api.post<{ resource: Resource; message: string }>(
    "/resources",
    formData,
    { headers: { "Content-Type": "multipart/form-data" } }
  );

  return response.data.resource;
}

export async function deleteResource(resourceId: number): Promise<void> {
  await api.delete(`/resources/${resourceId}`);
}

/**
 * The file-serving endpoint requires a bearer token and enforces the same
 * lock rules server-side, so a plain <a href> can't be used (no way to
 * attach the Authorization header to a browser navigation). Fetch it as a
 * blob through the authenticated axios instance instead, then trigger a
 * normal save-as via a temporary object URL.
 */
export async function downloadResourceFile(resource: Resource): Promise<void> {
  const response = await api.get(resource.url.replace(/^\/api/, ""), {
    responseType: "blob",
  });

  const blobUrl = window.URL.createObjectURL(response.data);
  const link = document.createElement("a");
  link.href = blobUrl;
  link.download = resource.original_filename || `${resource.title}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(blobUrl);
}
