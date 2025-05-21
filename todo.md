Top of queue:
- convert pages to nicer designs
    - intention page
    - profile tab scrolling properly
    - profile intention tab
- clean up optional checks in use query hooks (use throws instead)
- immediately update feed after following someone public

Next:
- set up expo build for proper development builds to test native constructs
- release with expo build services

Get around to eventually:
- generalize 'ownerId' field on post(s), intention(s) queries to allow for clean removal after unfollow
- error handling for failed fetch? Make a pattern for this? Use a library?
- set email field to be private (or just remove from BE, use auth as source of truth)
- tests for storage rules
- bulk writer create/update type safety?
