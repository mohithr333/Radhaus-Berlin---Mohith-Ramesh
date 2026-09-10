# Radhaus Berlin — Workshop Booking Portal

Welcome! This is the example application for the development block of our
assessment day. **Radhaus Berlin** is a fictional bicycle shop with two branches
(Neukoelln and Wedding) and an online portal where customers book workshop
appointments and upload photos of their bicycle.

It is built with **Next.js** (App Router) and a **SQLite** example database, and
it runs entirely on your machine.

---

## Setup

Requirement: **Node.js ≥ 22.5** (the app uses the built-in `node:sqlite`).

```bash
npm install
npm run seed      # creates the example database data/radhaus.db
npm run dev       # starts http://localhost:3000
```

Sign-in is hard-wired for this exercise: pick an account from the selector in the
top right and the portal treats you as that person.

| Account | Role |
|---|---|
| Mira Sandberg, Jonas Kreft, Ayse Demirel | customer |
| Tom Baumgart, Rita Ohlsen | workshop staff |
| Katrin Lubitz | administration |

Pages: `/` (public), `/termine` (own appointments), `/werkstatt` (workshop view),
`/profil`, `/passwort-vergessen`.

---

## The three tasks

They are handed out one after another during the day — please only open the one
you are currently working on.

| | Task | Time | Form |
|---|---|---|---|
| **D0** | [Code reading](aufgaben/D0-code-reading.md) | 15 min | individually, written, no AI |
| **D1** | [Permission concept](aufgaben/D1-permissions.md) | 35 min | group, AI allowed |
| **D2** | [Live implementation](aufgaben/D2-live-build.md) | 60 min | group, everyone on their own laptop |

---

## Please read before you start

This application **deliberately contains security vulnerabilities and mistakes**.
They are realistic and modelled on errors that occur in real projects — finding
and judging them is part of the exercise, so please do not be surprised by them.

All credentials, keys, addresses and accounts in this repository are **entirely
fictional** and belong to no real system.

---

*Your results remain your property. We use them solely to form an impression and
not for our own product — which is why we deliberately work on an unrelated
example.*
