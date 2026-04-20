# Appwrite collection columns (draft)

Create each collection, then add these columns (attributes). After that, add documents (rows).

## Assignments collection (ID: assignments)

Columns:

- title (string, required)
- subtitle (string, required)
- status (string, required) or type (string, required) - either works; UI prefers type
- fileId (string, optional)
- fileName (string, optional)

Example document:

```json
{
  "title": "Week 2 ICU Case Review",
  "subtitle": "Sepsis management plan submission",
  "status": "Pending",
  "type": "PDF",
  "fileId": "65f0a3b2e1f7c9d001",
  "fileName": "icu-week2.pdf"
}
```

## Materials collection (ID: materials)

Columns:

- title (string, required)
- description (string, required) or subtitle (string, required)
- type (string, required) or format (string, required)
- fileId (string, optional)
- fileName (string, optional)

Example document:

```json
{
  "title": "Ventilation Basics",
  "description": "Lecture slides and summary notes",
  "type": "PPT",
  "fileId": "65f0a4c9b1d2e3f004",
  "fileName": "ventilation-basics.pptx"
}
```

## Notes collection (ID: notes)

Columns:

- title (string, required)
- body (string, required)
- updatedAt (string, optional) - UI falls back to $updatedAt if missing

Example document:

```json
{
  "title": "Sepsis Management Notes",
  "body": "Key points on early recognition and treatment of sepsis...",
  "updatedAt": "2024-06-15T14:30:00Z"
}
```

## Resources collection (ID: resources)

Columns:

- title (string, required)
- subtitle (string, required) or summary (string, required) or description (string, required)
- icon (string, required) - one of: archive, book, clipboard, edit-2, edit-3, file, file-text, folder, grid, help-circle, upload, user, bell
- type (string, optional)
- fileId (string, optional)
- fileName (string, optional)
- programName (string, optional) - used for filtering when navigating with programName in the URL

Example document:

```json
{
  "title": "ICU Drug Dosing Guide",
  "subtitle": "Quick-reference PDF",
  "icon": "book",
  "type": "PDF",
  "fileId": "65f0a5d0c7e1a2b009",
  "fileName": "icu-dosing.pdf",
  "programName": "Adult ICU"
}
```
