import { getApiConfig } from "./server/db.ts";

async function testDownload() {
  try {
    // Get the Dropbox token
    const config = await getApiConfig(1, "dropbox");
    if (!config || !config.accessToken) {
      console.log("Dropbox token not found");
      return;
    }

    const token = config.accessToken;
    console.log("Token found, testing download...");

    // Download the Economia Politica framework
    const response = await fetch("https://content.dropboxapi.com/2/files/download", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Dropbox-API-Arg": JSON.stringify({ path: "/1_framework/framework_Economia_politica.json" }),
      },
    });

    if (!response.ok) {
      const error = await response.text();
      console.log("Download error:", error);
      return;
    }

    const text = await response.text();
    console.log("Downloaded text length:", text.length);
    console.log("Downloaded text starts with:", text.substring(0, 100));
    console.log("Downloaded text ends with:", text.substring(text.length - 100));

    // Try to parse
    try {
      const json = JSON.parse(text);
      console.log("\nJSON parsed successfully!");
      console.log("First keys:", Object.keys(json).slice(0, 5));
      console.log("Last keys:", Object.keys(json).slice(-5));
    } catch (e) {
      console.log("JSON parse error:", e.message);
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

testDownload();
