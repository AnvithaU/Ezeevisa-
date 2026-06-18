import axios from "axios";
import fs from "fs";
import path from "path";

export async function extractPassportData(imagePaths: string[]) {
  // Convert local files to Base64 Data URLs (data:image/jpeg;base64,...)
  const dataUrls = imagePaths.map((filePath) => {
    const fileBuffer = fs.readFileSync(filePath);
    const base64Data = fileBuffer.toString("base64");

    // Determine the mime type based on file extension
    const ext = path.extname(filePath).toLowerCase();
    const mimeType = ext === ".png" ? "image/png" : "image/jpeg";

    return `data:${mimeType};base64,${base64Data}`;
  });

  // Send as a JSON payload to match what Python expects
  const response = await axios.post(
    "http://localhost:5001/extract-passport",
    {
      files: dataUrls,
    },
    {
      headers: {
        "Content-Type": "application/json",
      },
      timeout: 60000,
    },
  );

  return response.data;
}
