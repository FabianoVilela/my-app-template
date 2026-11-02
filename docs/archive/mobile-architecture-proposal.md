# Initial mobile architecture proposal (historical)

This is a condensed English record of the initial Portuguese discussion.
It is superseded by [Application architecture](../architecture/AGENTS.md) and
[Project conventions](../conventions/AGENTS.md). It is background only: do not use
its examples as implementation instructions or a list of files to create.
The original discussion remains available in Git history.

## Original direction and rationale

- Organize code by business capability, keeping related changes close together.
  Within a module, introduce domain, application, infrastructure and presentation
  responsibilities as needed.
- Separate navigation from business organization: a capability may appear in
  tabs, modals and several routes. Keep route files small.
- Keep client business rules independent of React, navigation, HTTP and storage.
  Use types and functions by default; richer models should protect invariants.
- Distinguish domain rules, application workflows and presentation reactions.
  A cancellation policy, requesting cancellation and navigating afterward have
  different owners.
- Define ports beside the policy that needs them and inject implementations.
  Runtime calls through an injected adapter do not justify importing the adapter
  into the core.
- Use bootstrap for composition and required startup, without a global service
  locator or a dependency-injection framework by default.
- Share technical infrastructure only when consumers actually need it. Share
  business models only when their meaning and reasons to change agree.
- A code module need not be a DDD Bounded Context. Keep public APIs small,
  preserve layer boundaries and avoid cyclic cross-module dependencies.
- Add offline queues and synchronization only for explicit product requirements,
  with consistency, retry and conflict policies.

The original orders/catalog/account tree illustrated possible responsibilities,
not business features to add to this template. The current numbered placeholders
and supported infrastructure are documented in the active architecture.

## Background references

- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Ports and Adapters](https://alistair.cockburn.us/hexagonal-architecture)
- [Bounded Context](https://martinfowler.com/bliki/BoundedContext.html)
