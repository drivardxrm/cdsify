import { SetupGlobalContext } from "../../../cdsnode/SetupGlobalContext";
import { setMetadataCache } from "../../../metadata/MetadataCache";
import { accountMetadata, Account } from "../../../cds-generated/entities/Account";
import { XrmContextCdsServiceClient } from "../..";
import { Entity } from "../../../types/Entity";
import * as config from "config";
import { NodeXrmConfig } from "../../../cdsnode/config/NodeXrmConfig";
import { opportunityMetadata, Opportunity } from "../../../cds-generated/entities/Opportunity";
import { opportunitycloseMetadata } from "../../../cds-generated/entities/OpportunityClose";
import { WinOpportunityMetadata, WinOpportunityRequest } from "../../../cds-generated/actions/WinOpportunity";
describe("winopportunity", () => {
  const configFile = config.get("nodecds") as NodeXrmConfig;
  beforeAll(async () => {
    if (!configFile.runIntegrationTests) return;
    // Is this running inside NodeJS?
    if (typeof Xrm == "undefined") {
      try {
        // Set up the Node Xrm global context
        await SetupGlobalContext();
      } catch (ex) {
        fail(ex);
      }
    }
  }, 30000);
  test("WinOpportunity", async () => {
    if (!configFile.runIntegrationTests) return;
    setMetadataCache({
      entities: {
        account: accountMetadata,
        opportunity: opportunityMetadata,
        opportunityclose: opportunitycloseMetadata,
      },
      actions: { WinOpportunity: WinOpportunityMetadata },
    });

    const account1 = {
      logicalName: accountMetadata.logicalName,
      name: "Account 1",
    } as Account;

    const opportunity1 = {
      logicalName: opportunityMetadata.logicalName,
      name: "Opportunity 1",
    } as Opportunity;

    const cdsServiceClient = new XrmContextCdsServiceClient(Xrm.WebApi);
    try {
      // Create account
      account1.id = await cdsServiceClient.create(account1);

      // Assign parent customer
      opportunity1.customerid = Entity.toEntityReference(account1);

      // Create opportunity
      opportunity1.id = await cdsServiceClient.create(opportunity1);

      // WinOpportunity
      const winRequest = {
        logicalName: "WinOpportunity",
        Status: 3,
        OpportunityClose: {
          logicalName: opportunitycloseMetadata.logicalName,
          description: "Sample Opportunity Close",
          subject: "Sample",

          opportunityid: Entity.toEntityReference(opportunity1),
        },
      } as WinOpportunityRequest;

      const winResponse = await cdsServiceClient.execute(winRequest);
      console.log(winResponse);
    } catch (ex) {
      fail(ex);
    } finally {
      if (opportunity1.id) {
        // Tidy up
        await cdsServiceClient.delete(opportunity1);
      }
      if (account1.id) {
        // Tidy up
        await cdsServiceClient.delete(account1);
      }
    }
  }, 30000);
});
