type ActionResponse = FillFormAction | SendEmailAction | NoAction;

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

type NoAction = {
  type: "none";
  reason: string;
};
