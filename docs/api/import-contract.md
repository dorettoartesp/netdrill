# API Contract: Bulk Ingestion (`/api/import`)

## Endpoint Specification
- **Method:** `POST`
- **Path:** `/api/import`
- **Content-Type:** `application/json`

## Request Schema

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "BulkImportPayload",
  "type": "object",
  "required": ["topic", "module", "items"],
  "properties": {
    "topic": {
      "type": "string",
      "description": "Unique topic slug in lowercase (e.g., 'linux', 'fortigate', 'kubernetes')"
    },
    "topic_title": {
      "type": "string",
      "description": "Human-readable topic title"
    },
    "topic_description": {
      "type": "string",
      "description": "Optional summary of the topic"
    },
    "module": {
      "type": "string",
      "description": "Unique module slug within the topic (e.g., 'troubleshooting', 'routing')"
    },
    "module_title": {
      "type": "string",
      "description": "Human-readable module title"
    },
    "items": {
      "type": "array",
      "minItems": 1,
      "items": {
        "type": "object",
        "required": ["type", "title", "prompt", "target"],
        "properties": {
          "type": {
            "type": "string",
            "enum": ["command", "block", "cloze", "quiz"]
          },
          "title": { "type": "string" },
          "prompt": { "type": "string" },
          "target": { "type": "string" },
          "explanation": { "type": "string" },
          "image_url": { "type": "string" },
          "tags": { "type": "string" }
        }
      }
    }
  }
}
```

## Responses
- **200 OK:**
  ```json
  {
    "message": "Importação realizada com sucesso: 10 itens cadastrados.",
    "importedCount": 10
  }
  ```
- **400 Bad Request:**
  ```json
  {
    "error": "Payload inválido: topic, module e items com pelo menos 1 item são obrigatórios."
  }
  ```
- **500 Internal Server Error:**
  ```json
  {
    "error": "Falha ao processar importação"
  }
  ```
