import { insforge } from "../src/lib/insforge/client";

async function test() {
  const result = insforge.storage.from("members-docs").getPublicUrl("profiles/test-image.jpg");
  // The SDK returns a string directly or an object based on the version. 
  // Based on the error, it's returning a String object.
  console.log("Public URL:", result);
}
test();
