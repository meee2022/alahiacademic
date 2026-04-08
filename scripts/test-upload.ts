import { insforge } from "../src/lib/insforge/client";
import { readFileSync } from "fs";

async function test() {
  const buf = Buffer.from("fake image content");
  const { data, error } = await insforge.storage.from("members-docs").upload("profiles/test-image.jpg", buf, { contentType: 'image/jpeg', upsert: true });
  console.log("Upload result:");
  console.log("Data:", data);
  console.log("Error:", error);

  if (data) {
    const { data: publicUrlData } = insforge.storage.from("members-docs").getPublicUrl(data.path || (data as any).key || "profiles/test-image.jpg");
    console.log("Public URL:", publicUrlData.publicUrl);
  }
}
test();
