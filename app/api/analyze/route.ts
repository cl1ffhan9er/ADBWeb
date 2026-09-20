export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file");

  if (!file || !(file instanceof Blob)) {
    return Response.json(
      { error: "No file received" },
      { status: 400 }
    );
  }

  // Forward the file to the FastAPI inference service
  const fastApiFormData = new FormData();
  fastApiFormData.append("file", file);

  const fastApiUrl = process.env.FASTAPI_URL;
  const response = await fetch(`${fastApiUrl}/infer`, {
    method: "POST",
    body: fastApiFormData,
  });

  if (!response.ok) {
    return Response.json(
      { error: "Inference service failed" },
      { status: 502 }
    );
  }

  const result = await response.json();
  return Response.json(result);
}