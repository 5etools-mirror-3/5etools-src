#!/bin/bash

set -e

if [[ $# -eq 0 ]]; then
    echo "No arguments provided. Usage: set-img-root.sh <repositoryOwner>"
    exit 1
fi

repo_owner=$1

sed -i 's#DEPLOYED_IMG_ROOT\s*=\s*undefined#DEPLOYED_IMG_ROOT='"\"https://raw.githubusercontent.com/${repo_owner}/5etools-img/main/\""'#g' js/utils.js
