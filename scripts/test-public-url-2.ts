import { insforge } from "../src/lib/insforge/client";

async function test() {
  const result = insforge.storage.from("members-docs").getPublicUrl("profiles/test-image.jpg");
  console.log("Result:", result);
}
test();
