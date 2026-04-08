import { insforge } from "../src/lib/insforge/client";

async function test() {
  const { data } = insforge.storage.from("members-docs").getPublicUrl("profiles/test-image.jpg");
  console.log("Public URL:", data?.publicUrl);
}
test();
