import transporter from "../config/nodeMailer.js";
import nodemailer from "nodemailer";

jest.mock("nodemailer", () => {
  return {
    createTransport: jest.fn().mockReturnValue({
      sendMail: jest.fn().mockResolvedValue({ messageId: "real-id" }),
      verify: jest.fn().mockImplementation((cb) => cb(null, true)),
    }),
  };
});

describe("nodeMailer lazy initialization test", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should export a transporter object with sendMail and verify methods", () => {
    expect(transporter).toBeDefined();
    expect(typeof transporter.sendMail).toBe("function");
    expect(typeof transporter.verify).toBe("function");
  });

  test("should resolve verify and sendMail when SMTP is in mock mode", async () => {
    const spyLog = jest.spyOn(console, "log").mockImplementation(() => {});
    
    // Test verify
    const verifyCallback = jest.fn();
    transporter.verify(verifyCallback);
    expect(verifyCallback).toHaveBeenCalledWith(null, true);

    // Test sendMail
    const mailOptions = { to: "test@example.com", subject: "Test", text: "Hello" };
    const result = await transporter.sendMail(mailOptions);
    expect(result.messageId).toContain("mock-id-");
    expect(spyLog).toHaveBeenCalledWith("✉️ MOCK EMAIL SENT");

    spyLog.mockRestore();
  });

  test("should initialize real transport only when real SMTP variables are defined and method is called", async () => {
    // Save original env variables
    const originalEnv = { ...process.env };
    
    // Set dummy SMTP credentials so SMTP is not mocked
    process.env.SMTP_USER = "test@example.com";
    process.env.SMTP_PASS = "securepassword";
    process.env.SMTP_HOST = "smtp.example.com";
    process.env.SMTP_PORT = "465";
    process.env.SMTP_SECURE = "true";

    // Re-verify that createTransport was NOT called simply by loading/setting env
    expect(nodemailer.createTransport).not.toHaveBeenCalled();

    // Call sendMail (which should trigger lazy initialization of real transporter)
    const mailOptions = { to: "user@example.com", subject: "Real SMTP Test", text: "Real mail contents" };
    const res = await transporter.sendMail(mailOptions);

    // Assert createTransport was called with correct configuration
    expect(nodemailer.createTransport).toHaveBeenCalledTimes(1);
    expect(nodemailer.createTransport).toHaveBeenCalledWith({
      host: "smtp.example.com",
      port: 465,
      secure: true,
      auth: {
        user: "test@example.com",
        pass: "securepassword",
      },
      connectionTimeout: 5000,
      greetingTimeout: 5000,
      socketTimeout: 10000,
    });

    // Clean up/restore env
    process.env = originalEnv;
  });
});
