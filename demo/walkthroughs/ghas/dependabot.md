# Dependabot

## Existing 3rd Party Vulnerabilities

- **Features:** Dependabot

There are two guaranteed vulnerabilities:

1. **Axios v1.8.1**: In the [frontend/package.json](../../../frontend/package.json), Axios is installed in a Version that contains the [Advisory "CVE-2025-27152"](https://github.com/advisories/GHSA-jr5f-v2jv-69x6)
    - In the repository, navigate to `Security -> Dependabot` to demo the alert
    - In the alert, you can find an EPSS score, CWE and other information you can point to
2. **Dockerfile Alpine:** In the [frontend/Dockerfile](../../../frontend/Dockerfile) and [api/Dockerfile](../../../api/Dockerfile), you'll find that we are using an outdated alpine version. While Dependabot does not Support vulnerability alerts for this, it will open a PR with an update.

> [!NOTE]
> Only the above vulnerabilities are guaranteed to exist in a demo. You might see other dependency vulnerabilities naturally, as we won't be able to always keep all packages of this demo up-to-date. It somewhat adds a bit of non-critical non-determinism to the demo you can just use to your advantage ("this is like in a real project")

## Dependency Review: License Violation with an AGPL-3.0-licensed package

- **Features:** Dependency review, Required workflows, License compliance

1. Search for the PR `feature: Add download of terms and services`
2. The PR was scanned using the required workflow `Dependency Review` (see [actions.md](../../actions.md) for more info on that)
3. The review should've failed, as the PR tries to add the dependency `ua-parser-js` - a library to read user-agent strings, in this case used to prevent SEO- and AI-Parser to download files to prevent DDoS. `ua-parser-js` is licensed under `AGPL-3.0`, which is specifically denied by the `Dependency Review` Workflow

> [!NOTE]
> `GPL-3.0` is a strong Copy-Left license, meaning any derivative work must also be open-sourced under the same license. This means: Customers can not use these libraries to work on their private commercialised applications, and it's a common problem for enterprise to prevent their users from spotting and using these. `ua-parser-js`  uses this to only allow other open source projects from using it for free - non-copy-left licenses are available with a $-Tag.

## Live Demo: Add a vulnerable & blocked action

- **Features:** Dependabot

1. Apply the Patch-Set `GHAS: Inject Dependabot Vulnerable Action`[^1] (ideally, select `Yes` for creating a new Branch)
2. Commit the created workflow file (`.github/workflows/auto-label-by-branch.yml`)
3. Create a PR with this Action
4. You can demo two things:
   1. The Action created a dependabot alert, as the used action `tj-actions/branch-names@v8.2.0` has the existing [Advisory "CVE-2025-54416"](https://github.com/advisories/GHSA-gq52-6phf-x2r6)
   2. The Action was blocked, as it was explicitly blocked through the Actions Allow List - you can demo it by navigating to the Repository `Settings -> Actions -> General`

---------

[^1]: To learn how to apply a patch-set, see [patch-sets.md](../../general/patch-sets.md)
