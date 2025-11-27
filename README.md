# to create package-lock.json for CI/CD

```
docker run --rm -v "$(pwd):/app" -w /app node:20 npm install --package-lock-only
```

