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
    if (!imageUrl) {
      return new Response("No Image url", { status: 500 });
    }
    if (!secret || secret !== env.APP_SECRET) {
      return new Response("No Secret or Invalid secret", { status: 500 });
    }

    const models = "nudity-2.0,wad,offensive";
    const sightengineApiUser = env.API_USER;
    const sightengineApiSecret = env.API_SECRET;
    const sightengineUrl = `https://api.sightengine.com/1.0/nudity.json?models=${models}&url=${imageUrl}&api_user=${sightengineApiUser}&api_secret=${sightengineApiSecret}`;

    const response = await fetch(sightengineUrl);
    const data: any = await response.json();

    if (data.error) {
      return new Response("Error", { status: 500 });
    }

    if (data.nudity.raw >= 0.5) {
      return new Response(
        JSON.stringify({
          isNSFW: true,
          imageUrl: "https://placehold.co/400x400?text=NSFW",
        }),
        { status: 200 }
      );
    } else {
      return new Response(
        JSON.stringify({
          isNSFW: false,
          imageUrl: imageUrl,
        }),
        { status: 200 }
      );
    }
  },
};