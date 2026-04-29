export type ActionResponse = FillFormAction | SendEmailAction | NoAction;

export type FillFormAction = {
  type: "fill_form";
  fields: Record<string, string>;
};

export type SendEmailAction = {
  type: "send_email";
  to: string;
  subject: string;
  body: string;
};

export type NoAction = {
  type: "none";
  reason: string;
};
