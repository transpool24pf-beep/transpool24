import { afterEach, describe, expect, it } from "vitest";
import {
  getInfoFromEmail,
  getSupportFromEmail,
  getCustomerReplyToEmail,
  getSupportInboxEmail,
  manualCustomerEmailSendOptions,
  transactionalEmailSendOptions,
} from "./email-addresses";

describe("email-addresses", () => {
  const env = process.env;

  afterEach(() => {
    process.env = { ...env };
  });

  it("splits info@ transactional vs support@ manual compose", () => {
    process.env.RESEND_FROM_EMAIL = "TransPool24 <info@transpool24.com>";
    process.env.RESEND_SUPPORT_FROM_EMAIL = "TransPool24 Support <support@transpool24.com>";
    process.env.REPLY_TO_EMAIL = "transpool24pf@gmail.com";
    process.env.SUPPORT_EMAIL = "transpool24pf@gmail.com";

    expect(getInfoFromEmail()).toBe("TransPool24 <info@transpool24.com>");
    expect(getSupportFromEmail()).toBe("TransPool24 Support <support@transpool24.com>");
    expect(getCustomerReplyToEmail()).toBe("transpool24pf@gmail.com");
    expect(getSupportInboxEmail()).toBe("transpool24pf@gmail.com");
    expect(transactionalEmailSendOptions()).toEqual({
      from: "TransPool24 <info@transpool24.com>",
      replyTo: "transpool24pf@gmail.com",
    });
    expect(manualCustomerEmailSendOptions()).toEqual({
      from: "TransPool24 Support <support@transpool24.com>",
      replyTo: "transpool24pf@gmail.com",
    });
  });

  it("falls back to public contact email when env is unset", () => {
    delete process.env.REPLY_TO_EMAIL;
    delete process.env.SUPPORT_EMAIL;
    delete process.env.SUPPORT_INBOX_EMAIL;
    delete process.env.PUBLIC_CONTACT_EMAIL;
    delete process.env.NEXT_PUBLIC_CONTACT_EMAIL;
    expect(getCustomerReplyToEmail()).toBe("hello@transpool24.com");
    expect(getSupportInboxEmail()).toBe("hello@transpool24.com");
  });
});
