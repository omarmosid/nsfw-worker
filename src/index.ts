export interface Env {
  // Example binding to KV. Learn more at https://developers.cloudflare.com/workers/runtime-apis/kv/
  // MY_KV_NAMESPACE: KVNamespace;
  //
  // Example binding to Durable Object. Learn more at https://developers.cloudflare.com/workers/runtime-apis/durable-objects/
  // MY_DURABLE_OBJECT: DurableObjectNamespace;
  //
  // Example binding to R2. Learn more at https://developers.cloudflare.com/workers/runtime-apis/r2/
  // MY_BUCKET: R2Bucket;
  //
  // Example binding to a Service. Learn more at https://developers.cloudflare.com/workers/runtime-apis/service-bindings/
  // MY_SERVICE: Fetcher;

  API_USER: string;

  API_SECRET: string;

  API_WORKFLOW: string;

  APP_SECRET: string;
}

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    const url = new URL(request.url);
    const imageUrl = url.searchParams.get("imageUrl");
    const secret = url.searchParams.get("secret");
    const nsfwMessage = "This image is NSFW";
    const message = url.searchParams.get("message") || "Hola!";

    if (!imageUrl) {
      return new Response("No Image url", { status: 400 });
    }
    if (!secret || secret !== env.APP_SECRET) {
      return new Response("No Secret or Invalid secret", { status: 400 });
    }

    checkImage(imageUrl);

    const models = "nudity-2.0,wad,offensive";
    const sightengineApiUser = env.API_USER;
    const sightengineApiSecret = env.API_SECRET;
    const sightengineWorkflow = env.API_WORKFLOW;
    const sightengineUrl = `https://api.sightengine.com/1.0/check-workflow.json?workflow=${sightengineWorkflow}&url=${imageUrl}&api_user=${sightengineApiUser}&api_secret=${sightengineApiSecret}`;

    const response = await fetch(sightengineUrl);
    const data: any = await response.json();

    // If there is an error return a generic album art image
    if (data.error) {
      const { imageBuffer, imageType } = await getImage(
        `https://placehold.co/400x400/444/BBB/png?text=${message}`
      );
      return new Response(imageBuffer, {
        headers: {
          "Content-Type": imageType,
          body: JSON.stringify({ error: data.error }),
        },
      });
    }

    if (data.summary.action === "reject") {
      const { imageBuffer, imageType } = await getImage(
        `https://placehold.co/400x400/222222/EEEEEE/png?text=${nsfwMessage}`
      );
      return new Response(imageBuffer, {
        headers: { "Content-Type": imageType, body: JSON.stringify(data) },
      });
    } else {
      const { imageBuffer, imageType } = await getImage(imageUrl);
      return new Response(imageBuffer, {
        headers: { "Content-Type": imageType, body: JSON.stringify(data) },
      });
    }
  },
};

const checkImage = async (imageUrl: string) => {
  const imageResponse = await fetch(imageUrl);
  const imageType = imageResponse.headers.get("Content-Type") || "";
  const validImageTypes = ["image/jpeg", "image/png"];
  if (!validImageTypes.includes(imageType)) {
    return new Response("Bad Image. Please supply only jpeg or png format", {
      status: 400,
    });
  }
};

const getImage = async (imageUrl: string) => {
  const imageResponse = await fetch(imageUrl);
  const imageBuffer = await imageResponse.arrayBuffer();
  const imageType = imageResponse.headers.get("Content-Type") || "";
  return { imageBuffer, imageType };
};
