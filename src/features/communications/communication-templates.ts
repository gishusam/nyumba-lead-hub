export type CommunicationTemplate = {
  id: "cold" | "followup";
  label: string;
  subject: string;
  body: string;
};

export function applyCommunicationTemplate(
  current: {
    subject: string;
    body: string;
  },
  template: CommunicationTemplate,
) {
  return {
    ...current,
    subject: template.subject,
    body: template.body,
  };
}

export type EmailSettingsResponse = {
  sender_name: string;
  template_cold: {
    label: string;
    subject: string;
    body: string;
  };
  template_followup: {
    label: string;
    subject: string;
    body: string;
  };
  placeholders: Record<string, string>;
};

export function mapEmailSettingsToCommunicationTemplates(
  settings: EmailSettingsResponse,
): CommunicationTemplate[] {
  return [
    {
      id: "cold",
      label: settings.template_cold.label,
      subject: settings.template_cold.subject,
      body: settings.template_cold.body,
    },
    {
      id: "followup",
      label: settings.template_followup.label,
      subject: settings.template_followup.subject,
      body: settings.template_followup.body,
    },
  ];
}

