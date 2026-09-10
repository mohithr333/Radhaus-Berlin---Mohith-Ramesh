# D2 — Live implementation with a coding agent

**Group work · 60 minutes · everyone types along on their own laptop**

Afterwards each of you demonstrates their own result (5 minutes per person).

---

## Assignment

Take this repository and make the workshop portal do its job properly.

> **Rule: production code is written exclusively by your AI agent.**
> You steer it, check it and correct it. Before the first line of code exists,
> create a rules file for it (`AGENTS.md`, `.cursor/rules`, `CLAUDE.md` —
> whichever you are used to).

---

## What has to hold at the end

1. A customer sees **their own** appointments and can create a new one
   (date, branch, description of the problem).
2. A customer may have at most **3 open appointments**. This rule has to hold
   **server-side** — a manipulated request must not get around it.
3. **No customer may ever see or change another customer's appointment.**
4. A **workshop employee** sees the appointments of their branch and may change
   their status.
5. **Administration** sees both branches.

Sign-in may stay hard-wired (fixed user, switchable) — real authentication is
not the point here.

You decide what to change: the existing code, the database schema, or both.

---

## Handover (5 minutes per person)

- **Demonstrate it once** — including: show us that points 2 and 3 really hold.
  Not the happy path — the attempt that has to fail.
- **Your rules file.**
- **A short list:** what did the agent get wrong, and how did you notice?
- **One line:** what did you deliberately leave out in the 60 minutes?

---

*Your results remain your property. We use them solely to form an impression and
not for our own product.*
