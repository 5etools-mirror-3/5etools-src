#!/usr/bin/env bash

SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )

bb "${SCRIPT_DIR}"/../.github/generate-merged-json.bb
jq -n --arg hb_dir "${SCRIPT_DIR}/../homebrew/sns.json" '{"full-source":{"homebrew":[$hb_dir]}}' > "${SCRIPT_DIR}/config.json"

ttrpg-convert \
    --index \
    -o "${SCRIPT_DIR}/generated" \
    -c "${SCRIPT_DIR}/config.json" \
    "${SCRIPT_DIR}/../data"
