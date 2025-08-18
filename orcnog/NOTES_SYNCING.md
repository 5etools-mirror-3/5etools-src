# Syncing this repo to the mirror...

## Premise
It may not be the most elegant, but here's the architecture:
* The *orcnog.github.io* repo is set up as a **fork** of the *5etools-mirror-3* repo for the purposes of having access to directly pull in the code, ***but*** the `main` branch in the orcnog repo is not the branch that is *in sync* with the mirror repo. 

    | Branch                              | Synced With | Function            |
    |-------------------------------------|-------------|--------|
    | [`orcnog.github.io/main`](https://github.com/orcnog/orcnog.github.io/tree/main)             |       -      | The production branch of [5e.orcnog.com](5e.orcnog.com), which is 5etools.com with my own code tweaks and customizations. |
    | [`orcnog.github.io/5etools-mirror-3`](https://github.com/orcnog/orcnog.github.io/tree/5etools-mirror-3) | [`5etools-mirror-3/5etools-2014-src/main`](https://github.com/5etools-mirror-3/5etools-2014-src) | Intended to be directly, manually synced with the fork source repo, [5etools-mirror-3/5etools-2014-src](https://github.com/5etools-mirror-3/5etools-2014-src). |
    | [`orcnog.github.io/staging`](https://github.com/orcnog/orcnog.github.io/tree/staging)  | [`orcnog.github.io/main`](https://github.com/orcnog/orcnog.github.io/tree/main)   | For merge conflicts coming from the mirror, and reexecuting build scripts. Intended to stay synced with [orcnog.github.io/main](https://github.com/orcnog/orcnog.github.io/tree/main)   |

* The [`5etools-mirror-3`](https://github.com/orcnog/orcnog.github.io/tree/5etools-mirror-3) branch *is intended* to always be synced with the mirror's [`main`](https://github.com/5etools-mirror-3/5etools-2014-src/tree/main) branch.  This has to be done manually (because I'm too stupid to figure out how to automate it via github actions), following the step-by-step instructions below (see: A Guide).

* The [`staging`](https://github.com/orcnog/orcnog.github.io/tree/staging) branch is intended to always be synced with [`main`](https://github.com/orcnog/orcnog.github.io/tree/main). It's the target branch for [`5etools-mirror-3`](https://github.com/orcnog/orcnog.github.io/tree/5etools-mirror-3) branch PRs, and functions as a safe space to resolve merge conflicts. 
  > Could I attempt to merge the `orcnog/5etools-mirror-3` branch directly into the `orcnog/main` branch and just resolve conflicts there? Yes... but having a staging branch let's me run build scripts after merging (like compiling scss), to give me a cleaner merge to `main`.  It also (obv) provides one more layer of redundancy & security... just feels more responsible.

* The "synced" [`5etools-mirror-3`](https://github.com/orcnog/orcnog.github.io/tree/5etools-mirror-3) branch is then PR'ed into, [`staging`](https://github.com/orcnog/orcnog.github.io/tree/staging). Conflicts are resolved here, and then build scripts are run.

* After conflicts are resolved and build scripts are run in [`staging`](https://github.com/orcnog/orcnog.github.io/tree/staging), that branch can then be pulled into [`main`](https://github.com/orcnog/orcnog.github.io/tree/main).

* And voila.  It's messy, manual, and prone to lots of error.  But so far it works, as long as I'm careful.

## A Guide
1. Open the [5etools-mirror-3](https://github.com/orcnog/orcnog.github.io/tree/5etools-mirror-3) branch in the github repo online.

2. Click the "[#] commits behind" link near the top.
   ![alt text](<Screenshot 2024-10-18 100017.jpg>)

3. Create a PR, and ***ensure that*** the target repo/branch is<br/>
   > base reposity: **orcnog.orcnog.github.io** | base: **5etools-mirror-3**

   ![alt text](<Screenshot 2024-10-18 101007.jpg>)

4. Fix any conflicts?  (There truly shouldn't be any in *this* PR, as the [5etools-mirror-3](https://github.com/orcnog/orcnog.github.io/tree/5etools-mirror-3) branch should only *ever* be updated with code directly from the [latest fork](https://github.com/5etools-mirror-3/5etools-2014-src/tree/main).)

5. In VSCode, checkout the `5etools-mirror-3` branch , then  `git pull` the latest code.
6. Then, checkout the `staging` branch, pull the latest code, and then `git merge 5etools-mirror-3` into it.
7. **Resolve any conflicts.** Ignore raw css file conflicts... they'll be overwritten by the scss compile.
8. Re-run `npm run build`
9. Test out the site: `npm run serve:dev`
10. If satisfied, pull `staging` into `main` and push both up.
11. DON'T run any of the github actions (yml scripts). At this time, they aren't nec for my ver of the site.