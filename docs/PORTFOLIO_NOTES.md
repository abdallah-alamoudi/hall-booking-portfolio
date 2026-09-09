# Portfolio snapshot notes

## Provenance

Prepared from source commit `7a1cd43d2cf4f393d555a3968e8581e1590eef9e`. Only file contents were copied; original commits, branches, issues, and private repository history were not imported.

This repository demonstrates project implementation. It does not establish which contributor wrote each feature or how much assistance was used; individual contributions should be described accurately in an application or interview.

## Changes made for sharing

- Removed build/analyzer logs, a local editor setting, and one-off diagnostic scripts.
- Removed prefilled dashboard login credentials.
- Replaced seeded email domains with reserved `example.com` addresses.
- Made the demo seed require a locally supplied password and refuse production mode.
- Expanded ignore rules for environment files, credentials, upload directories, and temporary output.
- Added configurable mobile API URL through Dart defines and used FVM in the mobile command.
- Rewrote the introduction and setup documentation, distinguishing implemented behavior from known limitations.

## Review scope

- Text files were checked for common credential/token patterns, private-key markers, connection strings, email addresses, private network addresses, and external URL hosts.
- Matches in tests and documentation were reviewed as fixtures or examples. No real credentials or customer uploads were identified in this snapshot.
- Included binary files are application icons and launch images; the copy contains no receipt images or database dumps.
- All downloaded source files were verified against their Git blob hashes before edits.
- This is a targeted review, not a guarantee that every possible sensitive value or defect has been detected.

## Validation performed

- `npm ci --ignore-scripts` completed.
- `npm run build` completed, including the Vite dashboard production build. Vite reported a large-bundle advisory; the build succeeded.
- `node --check` passed for 39 API source/seed files.
- Prisma generation could not complete because the required network approval was cancelled. MySQL integration tests and Flutter builds were not run.
