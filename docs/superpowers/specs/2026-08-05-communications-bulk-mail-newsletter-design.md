# Communications: Bulk Mail and Newsletter Design

The Communications product has three primary sections: **Overview**, **Bulk Mail**, and **Newsletter**.

Bulk Mail accepts existing Nyumba Zetu leads, CSV/Excel uploads, or saved mailing lists. Every recipient receives an individual personalised email. Users choose an approved sender, may add approved attachments up to 10 MB, and may send now or schedule. The initial recipient limit is 2,000 and remains admin-configurable.

Newsletter starts from a template and allows free editing of the headline, content, call-to-action, sender, audience, and schedule. Newsletter audiences may come from existing leads, uploaded contacts, or saved lists. Unsubscribed, suppressed, and hard-bounced recipients are excluded automatically.

Admins and managers manage approved sender addresses. Other authorised users may send directly without a separate approval step. Both workflows track sent, delivered, opened, clicked, bounced, and unsubscribed results.

This frontend integration is an interactive design preview. It never sends real email. Development mode uses sample recipient counts; production keeps final send actions disabled until backend send contracts are wired and verified.
