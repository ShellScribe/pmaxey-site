---
layout: page
title: Contact
description: Contact information and professional profile links for Paul Maxey.
permalink: /contact/
---

For professional conversations, project follow-up, or public profile links.

## Get in touch

<ul>
  <li><a href="https://www.linkedin.com/in/paul-maxey">LinkedIn</a>.</li>
  <li><a href="https://github.com/shellscribe">GitHub</a>.</li>
  <li data-contact-gate data-endpoint="{{ '/api/contact' | relative_url }}" data-sitekey="{{ site.turnstile_sitekey | escape }}" data-action="{{ site.turnstile_action | escape }}">
    Email: <button class="contact-reveal" type="button" data-contact-start hidden>Reveal email address</button><span data-contact-result hidden></span>
    <small data-contact-status role="status" aria-live="polite" aria-atomic="true">Email is unavailable. Please use a profile link above.</small>
    <div data-contact-widget hidden></div>
    <noscript><small>Email verification needs JavaScript. You can still use the profile links above.</small></noscript>
  </li>
</ul>
<script src="{{ '/assets/js/contact-gate.js' | relative_url }}" defer></script>
