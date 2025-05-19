Top of queue:
- finish profile intentions tab
- convert pages to nicer designs
- clean up optional checks in use query hooks (use throws instead)
- immediately update feed after following someone public

Next:
- set up expo build for proper development builds to test native constructs

Get around to eventually:
- generalize 'ownerId' field on post(s), intention(s) queries to allow for clean removal after unfollow
- error handling for failed fetch? Make a pattern for this? Use a library?
- set email field to be private (or just remove from BE, use auth as source of truth)
- tests for storage rules

