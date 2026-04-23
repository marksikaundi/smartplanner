import { APPWRITE_IDS } from "@/lib/appwrite-ids";
import {
  Account,
  Client,
  Databases,
  ID,
  InputFile,
  Permission,
  Query,
  Role,
  Storage,
} from "appwrite";

const client = new Client()
  .setEndpoint(APPWRITE_IDS.endpoint)
  .setProject(APPWRITE_IDS.projectId);

export { client };
export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);
export { ID, InputFile, Permission, Query, Role };
