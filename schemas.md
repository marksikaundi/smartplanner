## Assignments (collection ID: assignments)

title (string, required)
subtitle (string, required)
status (string, required) or type (string, required)
fileId (string, optional)
fileName (string, optional)

## Materials (collection ID: materials)

title (string, required)
description (string, required) or subtitle (string, required)
type (string, required) or format (string, required)
fileId (string, optional)
fileName (string, optional)

## Notes (collection ID: notes)

title (string, required)
body (string, required)
updatedAt (string, optional) — UI also uses $updatedAt

## Resources (collection ID: resources)

title (string, required)
subtitle (string, required) or summary (string, required) or description (string, required)
icon (string, required) — one of: archive, book, clipboard, edit-2, edit-3, file, file-text, folder, grid, help-circle, upload, user, bell
type (string, optional)
fileId (string, optional)
fileName (string, optional)
programName (string, optional)
