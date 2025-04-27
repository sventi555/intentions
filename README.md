# Fullstack Template

## Releasing

This will be a brief guide on how to deploy the client and api applications to google cloud run.

1. Create a new project in google cloud.
2. Add a new artifact repo. I recommend enabling a cleanup policy where only the 3 most recent image tags are retained.
3. Create cloud run applications for the client and api named ‘client’ and ‘api’, respectively. You can use the demo container as a placeholder.
4. Add any required environment variables to the cloud run functions.
5. Add custom domain mappings for each service. This will require adding dns records to your domain provider.
6. Make a service account for GitHub actions. Give it cloud run admin, artifact registry writer, and iam service account user roles.
7. Encode the service account key in base64 then add it as a repository secret with the name GCP_CREDS.
8. Add artifact registry identifier as a repository variable named IMAGE_REGISTRY.
9. Cut a release on GitHub, triggering the release workflow and populating the cloud run functions with applications from this repo!
