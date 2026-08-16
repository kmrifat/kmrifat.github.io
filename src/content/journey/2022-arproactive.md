---
kind: work
title: Senior Software Engineer
org:
  name: AR Proactive
  url: https://www.arproactive.com/
start: '2022-12'
end: '2025-03'
summary: Senior engineer on AR Proactive's medical-billing SaaS — AR aging reports, tasks and workflows, plus the scrapers that fed them.
accent: brand
featured: true
tech: [PHP, Laravel, MySQL, Angular, Bootstrap, SASS, Python, Selenium]
links:
  - label: arproactive.com
    url: https://www.arproactive.com/
highlights:
  - Built AR Aging Workflows — a SaaS handling AR aging reports, tasks and workflows for medical billing, on an API-first Laravel and MySQL backend with an Angular frontend
  - Integrated third-party clinical systems, including Point Click Care and Clinicient
  - Wrote a Python and Selenium scraper that pulled data out of Klein System (NCS), PointClickCare, FrameworkLTC and Clinicient and imported it as CSV to populate AR Aging
---

Medical billing runs on data that lives in other people's systems. The product
side of the job was AR Aging Workflows — reports, tasks and workflows over
accounts receivable — built API-first so the Laravel backend and the Angular
frontend stayed independent of each other.

The harder half was getting the data in. Several of the clinical systems offered
no usable export, so a Python and Selenium scraper logged in, pulled the records
out as CSV and imported them, which is what made the aging reports possible at
all.
