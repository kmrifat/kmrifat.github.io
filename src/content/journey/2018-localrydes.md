---
kind: work
title: Technical Lead
org:
  name: Localrydes GmbH
location:
  city: Vienna
  country: Austria
  remote: true
start: '2018-09'
end: '2020-04'
summary: Led engineering on a Vienna-based car reservation SaaS where providers set their own transfer, daily and hourly pricing.
accent: brand
featured: true
tech: [Laravel, Vue.js, Vuex, MySQL, Stripe]
projectSlugs: [localrydes]
highlights:
  - Designed the product architecture for the Localrydes SaaS platform
  - Integrated Stripe Connect so bookings paid providers directly, with commission split automatically
  - Designed the entire database through Laravel migrations
  - Set up CI/CD with Bitbucket Pipelines, plus LAMP server setup and maintenance
  - Broke management requirements into tasks for the team and took the complex parts
---

My first lead role, working remotely from Bangladesh to Vienna.

The interesting problem was payment disbursement: providers connect their own
Stripe account, and when a car is booked the money routes to them directly with
the platform commission taken out automatically — rather than pooling in a
central account and being paid out later.
