# to create package-lock.json for CI/CD

```
docker run --rm -v "$(pwd):/app" -w /app node:20 npm install --package-lock-only
```

# steps:

- run ci/cd
- add submodules:

```
# git submodule add -b <branch where workflows build the website> git@github.com:<username>/<repos>.git static/<page-name>
git submodule add -b build git@github.com:garnajee/cookie-converter.git static/cookie-converter
```


