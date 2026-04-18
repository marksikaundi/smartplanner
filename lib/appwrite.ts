import { Account, Client, ID } from "appwrite";

const client = new Client()
  .setEndpoint("https://fra.cloud.appwrite.io/v1")
  .setProject("69e351c40030ad9ed4d3");

export const account = new Account(client);
export { ID };
