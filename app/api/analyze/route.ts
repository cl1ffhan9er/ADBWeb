export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file");

  if (!file || !(file instanceof Blob)) {
    return Response.json({ error: "No file received" }, { status: 400 });
  }

  const fastApiFormData = new FormData();
  fastApiFormData.append("file", file);

  const fastApiUrl = process.env.FASTAPI_URL;

  let response: Response;
  try {
    response = await fetch(`${fastApiUrl}/infer`, {
      method: "POST",
      body: fastApiFormData,
    });
  } catch {
    // FastAPI is unreachable entirely (not running, wrong port, network issue)
    return Response.json(
      { error: "The analysis service is currently unavailable. Please try again shortly." },
      { status: 503 }
    );
  }

  if (!response.ok) {
    return Response.json(
      { error: "The analysis service returned an unexpected error." },
      { status: 502 }
    );
  }

  let result: unknown;
  try {
    result = await response.json();
  } catch {
    // FastAPI responded, but not with valid JSON -- shouldn't happen, but guard anyway
    return Response.json(
      { error: "Received an invalid response from the analysis service." },
      { status: 502 }
    );
  }

  // FastAPI itself can return a 200 with an {"error": "..."} body
  // (see audio_utils.py's ValueError handling in main.py) -- pass that through as-is
  return Response.json(result);
}