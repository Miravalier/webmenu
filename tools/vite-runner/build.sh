IMAGE="vite-runner"

cd $(dirname -- "$(readlink -f -- $0)")

set -eux

docker build . --tag "$IMAGE:latest"
