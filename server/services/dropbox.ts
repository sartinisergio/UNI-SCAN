/**
 * Dropbox Integration Service
 * Handles reading files from Dropbox for importing frameworks and manuals
 * Supports OAuth refresh token for automatic token renewal
 */

import { getApiConfig, updateApiConfigTokens } from "../db";

const DROPBOX_API_BASE = "https://api.dropboxapi.com/2";
const DROPBOX_CONTENT_BASE = "https://content.dropboxapi.com/2";
const DROPBOX_OAUTH_BASE = "https://api.dropboxapi.com/oauth2";

// Dropbox App credentials (from user's app)
// These should be stored securely - for now we'll pass them through the config
interface DropboxCredentials {
  accessToken: string;
  refreshToken?: string | null;
  appKey?: string;
  appSecret?: string;
  tokenExpiresAt?: Date | null;
}

interface DropboxEntry {
  ".tag": "file" | "folder";
  name: string;
  path_lower: string;
  path_display: string;
  id: string;
  size?: number;
}

interface DropboxListFolderResponse {
  entries: DropboxEntry[];
  cursor: string;
  has_more: boolean;
}

export interface DropboxFile {
  name: string;
  path_lower: string;
  path_display: string;
  id: string;
  size: number;
  subjectCode?: string;
}

/**
 * Refresh the Dropbox access token using the refresh token
 */
async function refreshAccessToken(
  refreshToken: string,
  appKey: string,
  appSecret: string
): Promise<{ accessToken: string; expiresIn: number }> {
  const response = await fetch(`${DROPBOX_OAUTH_BASE}/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: appKey,
      client_secret: appSecret,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("[Dropbox] Token refresh failed:", error);
    throw new Error(`Failed to refresh Dropbox token: ${error}`);
  }

  const data = await response.json();
  return {
    accessToken: data.access_token,
    expiresIn: data.expires_in || 14400, // Default 4 hours
  };
}

/**
 * Get Dropbox credentials for a user, refreshing token if needed
 */
async function getDropboxCredentials(userId: number): Promise<DropboxCredentials | null> {
  const config = await getApiConfig(userId, "dropbox");
  if (!config?.apiKey) {
    return null;
  }

  const credentials: DropboxCredentials = {
    accessToken: config.apiKey,
    refreshToken: config.refreshToken,
    tokenExpiresAt: config.tokenExpiresAt,
    appKey: config.appKey || undefined,
    appSecret: config.appSecret || undefined,
  };

  // Check if we have a refresh token and if the access token is expired or about to expire
  if (credentials.refreshToken && credentials.tokenExpiresAt) {
    const now = new Date();
    const expiresAt = new Date(credentials.tokenExpiresAt);
    const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);

    if (expiresAt < fiveMinutesFromNow) {
      console.log("[Dropbox] Access token expired or expiring soon, refreshing...");
      
      // Use app credentials from database (saved during OAuth flow)
      const appKey = credentials.appKey;
      const appSecret = credentials.appSecret;

      if (appKey && appSecret) {
        try {
          const { accessToken, expiresIn } = await refreshAccessToken(
            credentials.refreshToken,
            appKey,
            appSecret
          );

          // Update the stored token
          const newExpiresAt = new Date(now.getTime() + expiresIn * 1000);
          await updateApiConfigTokens(userId, "dropbox", accessToken, newExpiresAt);

          credentials.accessToken = accessToken;
          credentials.tokenExpiresAt = newExpiresAt;
          console.log("[Dropbox] Token refreshed successfully");
        } catch (error) {
          console.error("[Dropbox] Failed to refresh token:", error);
          // Continue with the old token, it might still work
        }
      } else {
        console.warn("[Dropbox] Cannot refresh token: appKey or appSecret not found in database. Please re-authenticate.");
      }
    }
  }

  return credentials;
}

/**
 * Get Dropbox access token for a user
 */
async function getDropboxToken(userId: number): Promise<string | null> {
  const credentials = await getDropboxCredentials(userId);
  return credentials?.accessToken || null;
}

/**
 * List files in a Dropbox folder (non-recursive)
 */
async function listFolderDirect(
  token: string,
  path: string
): Promise<DropboxEntry[]> {
  const response = await fetch(`${DROPBOX_API_BASE}/files/list_folder`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      path: path,
      recursive: false,
      include_media_info: false,
      include_deleted: false,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error(`[Dropbox] API error for path ${path}:`, error);
    throw new Error(`Dropbox API error: ${error}`);
  }

  const data: DropboxListFolderResponse = await response.json();
  return data.entries;
}

/**
 * List files in a Dropbox folder
 */
export async function listDropboxFolder(
  userId: number,
  path: string
): Promise<DropboxFile[]> {
  const token = await getDropboxToken(userId);
  if (!token) {
    throw new Error("Dropbox API key not configured");
  }

  const entries = await listFolderDirect(token, path);
  console.log(`[Dropbox] Successfully listed folder: ${path}`);

  // Filter only JSON files
  const jsonFiles = entries
    .filter((entry) => entry[".tag"] === "file" && entry.name.endsWith(".json"))
    .map((entry) => ({
      name: entry.name,
      path_lower: entry.path_lower,
      path_display: entry.path_display,
      id: entry.id,
      size: entry.size || 0,
    }));
  
  console.log(`[Dropbox] Found ${jsonFiles.length} JSON files in ${path}`);
  return jsonFiles;
}

/**
 * List all subfolders in a Dropbox folder
 */
async function listSubfolders(
  token: string,
  path: string
): Promise<string[]> {
  const entries = await listFolderDirect(token, path);
  return entries
    .filter((entry) => entry[".tag"] === "folder")
    .map((entry) => entry.path_lower);
}

/**
 * List files recursively from subfolders (one level deep)
 */
export async function listDropboxFolderRecursive(
  userId: number,
  basePath: string
): Promise<DropboxFile[]> {
  const token = await getDropboxToken(userId);
  if (!token) {
    throw new Error("Dropbox API key not configured");
  }

  const allFiles: DropboxFile[] = [];

  // First, get subfolders (one for each subject)
  const subfolders = await listSubfolders(token, basePath);
  console.log(`[Dropbox] Found ${subfolders.length} subfolders in ${basePath}`);

  // Then, list files in each subfolder
  for (const subfolder of subfolders) {
    try {
      const entries = await listFolderDirect(token, subfolder);
      
      // Extract subject code from subfolder name
      const subfolderName = subfolder.split("/").pop() || "";
      const subjectCode = subfolderName.toLowerCase().replace(/ /g, "_");
      
      const jsonFiles = entries
        .filter((entry) => entry[".tag"] === "file" && entry.name.endsWith(".json"))
        .map((entry) => ({
          name: entry.name,
          path_lower: entry.path_lower,
          path_display: entry.path_display,
          id: entry.id,
          size: entry.size || 0,
          subjectCode,
        }));
      
      console.log(`[Dropbox] Found ${jsonFiles.length} JSON files in ${subfolder}`);
      allFiles.push(...jsonFiles);
    } catch (error) {
      console.error(`[Dropbox] Error listing subfolder ${subfolder}:`, error);
    }
  }

  return allFiles;
}

/**
 * Download a file from Dropbox
 */
export async function downloadDropboxFile(
  userId: number,
  path: string
): Promise<any> {
  const token = await getDropboxToken(userId);
  if (!token) {
    throw new Error("Dropbox API key not configured");
  }

  const response = await fetch(`${DROPBOX_CONTENT_BASE}/files/download`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Dropbox-API-Arg": JSON.stringify({ path }),
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Dropbox download error: ${error}`);
  }

  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`Invalid JSON in file: ${path}`);
  }
}

/**
 * Get all frameworks from Dropbox
 */
export async function getFrameworksFromDropbox(userId: number) {
  const files = await listDropboxFolder(userId, "/1_framework");
  
  const frameworks = [];
  for (const file of files) {
    try {
      const content = await downloadDropboxFile(userId, file.path_lower);
      const subjectCode = file.name.replace(".json", "").toLowerCase().replace(/ /g, "_");
      frameworks.push({
        subjectCode,
        fileName: file.name,
        content,
      });
    } catch (error) {
      console.error(`Error loading framework ${file.name}:`, error);
    }
  }
  
  return frameworks;
}

/**
 * Get all Zanichelli manuals from Dropbox (with subfolders)
 */
export async function getZanichelliManualsFromDropbox(userId: number) {
  const files = await listDropboxFolderRecursive(userId, "/2_Manuali_Zanichelli");
  
  const manuals = [];
  for (const file of files) {
    try {
      const content = await downloadDropboxFile(userId, file.path_lower);
      manuals.push({
        fileName: file.name,
        subjectCode: file.subjectCode,
        type: "zanichelli" as const,
        content,
      });
    } catch (error) {
      console.error(`Error loading Zanichelli manual ${file.name}:`, error);
    }
  }
  
  return manuals;
}

/**
 * Get all competitor manuals from Dropbox (with subfolders)
 */
export async function getCompetitorManualsFromDropbox(userId: number) {
  const files = await listDropboxFolderRecursive(userId, "/3_manuali_competitor");
  
  const manuals = [];
  for (const file of files) {
    try {
      const content = await downloadDropboxFile(userId, file.path_lower);
      manuals.push({
        fileName: file.name,
        subjectCode: file.subjectCode,
        type: "competitor" as const,
        content,
      });
    } catch (error) {
      console.error(`Error loading competitor manual ${file.name}:`, error);
    }
  }
  
  return manuals;
}

/**
 * Get folder structure from Dropbox (including subfolders count)
 */
export async function getDropboxFolderStructure(userId: number) {
  const token = await getDropboxToken(userId);
  if (!token) {
    throw new Error("Dropbox API key not configured");
  }

  try {
    const structure: Record<string, { files: DropboxFile[]; subfolderCount: number }> = {};

    // Framework folder (direct files)
    try {
      const frameworkFiles = await listDropboxFolder(userId, "/1_framework");
      structure["/1_framework"] = { files: frameworkFiles, subfolderCount: 0 };
    } catch {
      structure["/1_framework"] = { files: [], subfolderCount: 0 };
    }

    // Zanichelli manuals (recursive)
    try {
      const zanichelliFiles = await listDropboxFolderRecursive(userId, "/2_Manuali_Zanichelli");
      const zanichelliSubfolders = await listSubfolders(token, "/2_Manuali_Zanichelli");
      structure["/2_Manuali_Zanichelli"] = { 
        files: zanichelliFiles, 
        subfolderCount: zanichelliSubfolders.length 
      };
    } catch {
      structure["/2_Manuali_Zanichelli"] = { files: [], subfolderCount: 0 };
    }

    // Competitor manuals (recursive)
    try {
      const competitorFiles = await listDropboxFolderRecursive(userId, "/3_manuali_competitor");
      const competitorSubfolders = await listSubfolders(token, "/3_manuali_competitor");
      structure["/3_manuali_competitor"] = { 
        files: competitorFiles, 
        subfolderCount: competitorSubfolders.length 
      };
    } catch {
      structure["/3_manuali_competitor"] = { files: [], subfolderCount: 0 };
    }

    return structure;
  } catch (error) {
    throw error;
  }
}

/**
 * Generate Dropbox OAuth authorization URL
 */
export function getDropboxAuthUrl(appKey: string, redirectUri: string, state: string): string {
  const params = new URLSearchParams({
    client_id: appKey,
    response_type: "code",
    redirect_uri: redirectUri,
    token_access_type: "offline", // This gives us a refresh token
    state: state,
  });
  
  return `https://www.dropbox.com/oauth2/authorize?${params.toString()}`;
}

/**
 * Exchange authorization code for tokens
 */
export async function exchangeCodeForTokens(
  code: string,
  appKey: string,
  appSecret: string,
  redirectUri: string
): Promise<{
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}> {
  const response = await fetch(`${DROPBOX_OAUTH_BASE}/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code: code,
      client_id: appKey,
      client_secret: appSecret,
      redirect_uri: redirectUri,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to exchange code for tokens: ${error}`);
  }

  const data = await response.json();
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in || 14400,
  };
}
