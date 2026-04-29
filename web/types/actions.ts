export type ActionResponse = FillFormAction | SendEmailAction;

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
