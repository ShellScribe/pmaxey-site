---
layout: page
title: Selected Projects
description: Selected cloud, automation, migration, search, and reporting projects from Paul Maxey's platform engineering portfolio.
permalink: /projects/
---

Selected work across cloud infrastructure, automation, public web platforms, data migration, search, and crisis-response reporting systems.

## Azure Disaster Recovery and Platform Foundations

**Problem**  
Enterprise cloud workloads need infrastructure patterns that can support regional recovery, secure connectivity, and day-to-day operations without becoming difficult to understand.

**Approach**  
Designed and supported Azure platform foundations involving disaster recovery, hybrid networking, DNS, firewall policy, governance, and deployment support across a large enterprise environment.

**Outcome**  
Helped standardize shared cloud patterns and gave engineering teams clearer paths for deployment, troubleshooting, and recovery planning.

## ServiceNow Table Load Automation

**Problem**  
A recurring table-load process required manual effort from senior staff and created an avoidable operational handoff.

**Approach**  
Built an automation workflow using cloud storage, Logic Apps, and ServiceNow integration to ingest structured data and load it into the target table.

**Outcome**  
Reduced recurring manual work and made the process more repeatable, easier to review, and easier to hand off.

## Managed Identity Runbook Integration

**Problem**  
A data warehouse team needed to call existing automation from Bash-based workflows without managing long-lived credentials.

**Approach**  
Configured virtual machines to use managed identity for Automation Account runbook access, then wrote the Bash logic to request tokens and invoke the runbooks from their existing scripts.

**Outcome**  
Allowed the team to integrate runbook execution into their current workflow while avoiding embedded credentials.

## Certified Media Platform

**Problem**  
A public media workflow needed a way to publish signed images without requiring manual site updates for each upload.

**Approach**  
Built an Azure-based workflow where users uploaded images to storage, Event Grid triggered processing, a Function App signed the images using a C2PA-based authenticity workflow, and the static site updated from storage-backed content.

**Outcome**  
Created a maintainable publishing path where non-developers could upload content and have the public gallery update automatically.

## Large Archive Migration

**Problem**  
A large digital archive needed to move from OneDrive to Amazon S3 while dealing with transfer reliability, throttling behavior, and cost constraints.

**Approach**  
Used automation and a cost-conscious transfer setup to migrate a 22TB+ archive to S3.

**Outcome**  
Completed the migration under the projected budget while keeping the transfer process controlled and repeatable.

## Enterprise Intranet Search Migration

**Problem**  
A legacy search product was approaching the end of its licensing window, and policy teams still needed accurate search across internal policy content for audit and operational use.

**Approach**  
Built an in-house search replacement using Apache Solr, Apache Nutch, Ubuntu Linux, scheduled crawling, and a JavaScript frontend that queried Solr JSON responses.

**Outcome**  
Preserved internal search access during the licensing transition and supported policy search needs with an in-house platform.

## Statewide COVID Reporting Dashboard

**Problem**  
During a major public-health crisis, regular users needed a way to submit COVID-related data and publish it into a statewide dashboard without a traditional development cycle for every update.

**Approach**  
Built a Drupal-based dashboard that accepted submitted data and displayed facility-level testing information through an interactive map and supporting charts.

**Outcome**  
Gave non-technical users a way to populate a public dashboard during a fast-moving operational need.
