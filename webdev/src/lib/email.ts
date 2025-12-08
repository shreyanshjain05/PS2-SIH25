import nodemailer from "nodemailer";

export async function sendEmail(to: string, subject: string, html: string) {
  try {
    if (process.env.SMTP_HOST) {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || "587"),
        secure: process.env.SMTP_SECURE === "true",
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      const info = await transporter.sendMail({
        from: '"Gov Command Center" <alert@gov.in>',
        to,
        subject,
        html,
      });
      console.log("Message sent: %s", info.messageId);
      return info;
    } else {
      // Mock email sending
      console.log("---------------------------------------------------");
      console.log(`[EMAIL SENT]`);
      console.log(`To: ${to}`);
      console.log(`Subject: ${subject}`);
      console.log(`Body:`);
      console.log(html);
      console.log("---------------------------------------------------");
      return { messageId: "mock-id-" + Date.now() };
    }
  } catch (error) {
    console.error("Failed to send email:", error);
    throw error;
  }
}
