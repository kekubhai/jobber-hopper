# AI Browser Agent Web

## Environment

Create `web/.env.local`:

```bash
OPENAI_API_KEY=sk-your-key
OPENAI_MODEL=gpt-4o-mini
```

## Run

```bash
npm install
npm run dev
```

The API runs at:

```txt
http://localhost:3000/api/analyze
```

## API

Request:

```json
{
  "text": "page text"
}
```

Responses:

```json
{
  "type": "fill_form",
  "fields": {
    "name": "",
    "email": ""
  }
}
```

```json
{
  "type": "send_email",
  "to": "",
  "subject": "",
  "body": ""
}
```
