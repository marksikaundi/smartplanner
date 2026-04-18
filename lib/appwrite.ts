import { Account, Client, ID } from "appwrite";

const client = new Client()
  .setEndpoint("https://fra.cloud.appwrite.io/v1")
  .setProject("69e351c40030ad9ed4d3")
  .setPlatform("com.lupleg.org");

export const account = new Account(client);
export { ID };
