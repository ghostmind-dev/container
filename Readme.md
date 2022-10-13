# dvc

:evergreen_tree: devcontainer docker image

## notes

- `TARGETPLATFORM` is the platform of the image that is being built
- `BUILDPLATFORM` is the platform of the machine that is building the image

## docker login to gcr.io from host

`cat service_account.json | docker login -u _json_key --password-stdin https://gcr.io`

## docker buildx

- `docker buildx create --use`
- `docker buildx build --platform=linux/amd64,linux/arm64 -t ghcr.io/ghostmind-dev/dvc:latest --push .`
