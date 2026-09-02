import { afterEach, describe, expect, it } from "vitest";
import {
  customerEmailSendOptions,
  getCustomerReplyToEmail,
  getResendFromEmail,
  getSupportInboxEmail,
} from "./email-addresses";

describe("email-addresses", () => {
  const env = process.env;

  afterEach(() => {
    process.env = { ...env };
  });

  it("uses support@ as From and Gmail as Reply-To when configured", () => {
    process.env.RESEND_FROM_EMAIL = "TransPool24 Support <support@transpool24.com>";
    process.env.REPLY_TO_EMAIL = "transpool24pf@gmail.com";
    process.env.SUPPORT_EMAIL = "transpool24pf@gmail.com";

    expect(getResendFromEmail()).toBe("TransPool24 Support <support@transpool24.com>");
    expect(getCustomerReplyToEmail()).toBe("transpool24pf@gmail.com");
    expect(getSupportInboxEmail()).toBe("transpool24pf@gmail.com");
    expect(customerEmailSendOptions()).toEqual({
      from: "TransPool24 Support <support@transpool24.com>",
      replyTo: "transpool24pf@gmail.com",
    });
  });
});
