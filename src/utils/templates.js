export const messageTemplates = {
  guest: `
🏨 *RESERVATION CONFIRMED*
Dear {{name}} {{surname}},

Your stay details are below:
{{#each rooms}}
--- Stay {{@index}} ---
🛏️ *Room:* {{type}}
📅 *Dates:* {{dates}}
👥 *Guests:* {{adults}} Adults{{#if children}}, {{children}} Children{{/if}}
{{/each}}

💰 *Total:* {{total}}₺
💳 *Balance:* {{balance}}₺

Processed by: {{staffName}}
We look forward to seeing you!`.trim(),

  reception: `
📝 *NEW BOOKING LOG*
Guest: {{name}} {{surname}}
Processed by: {{staffName}}
---
Rooms:
{{#each rooms}}
- {{type}} ({{dates}})
{{/each}}
Phone: {{phone}}
Total: {{total}}₺`.trim()
};