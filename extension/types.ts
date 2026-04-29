type ActionResponse = FillFormAction | SendEmailAction;

type FillFormAction = {
  type: "fill_form";
  fields: Record<string, string>;
};

type SendEmailAction = {
  type: "send_email";
  to: string;
  subject: string;
  body: string;
};
