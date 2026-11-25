#!/bin/bash

set -Eeuo pipefail

sed -e '/^\*/d' -e 's/^!/+ /' .dockerignore > .rsync-filter
echo -e "\n- /*" >> .rsync-filter
