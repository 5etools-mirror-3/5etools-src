#!/bin/bash

set -e

sed -e '/^\*/d' -e 's/^!/+ /' .dockerignore > .rsync-filter
echo -e "\n- /*" >> .rsync-filter
