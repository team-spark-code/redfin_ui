// app/api/contact/route.ts
import { NextResponse } from "next/server";
import * as z from "zod";
import nodemailer from "nodemailer";

export const runtime = "nodejs"; // ✅ nodemailer는 edge에서 동작 X

const ContactSchema = z.object({
  name: z.string().min(1, "이름을 입력해주세요."),
  email: z.string().email("이메일 형식이 올바르지 않습니다."),
  message: z.string().min(10, "문의 내용은 10자 이상 입력해주세요."),
});

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const parsed = ContactSchema.safeParse(json);
    if (!parsed.success) {
      const msg = parsed.error.issues.map(i => i.message).join(", ");
      return NextResponse.json({ ok: false, error: msg }, { status: 400 });
    }

    const { name, email, message } = parsed.data;

    // ✅ 환경변수 체크
    const {
      MAIL_HOST,
      MAIL_PORT,
      MAIL_SECURE,
      MAIL_USER,
      MAIL_PASS,
      MAIL_TO,
    } = process.env;

    if (!MAIL_HOST || !MAIL_PORT || !MAIL_USER || !MAIL_PASS || !MAIL_TO) {
      return NextResponse.json(
        { ok: false, error: "메일 서버 설정이 누락되었습니다(.env 확인)." },
        { status: 500 }
      );
    }

    const transporter = nodemailer.createTransport({
      host: MAIL_HOST,
      port: Number(MAIL_PORT),
      secure: MAIL_SECURE === "true", // 465면 true, 587이면 false
      auth: {
        user: MAIL_USER,
        pass: MAIL_PASS,
      },
    });

    // 받는 주소는 환경변수에서 관리(지원 메일)
    const to = MAIL_TO;

    const info = await transporter.sendMail({
      from: `"문의폼" <${MAIL_USER}>`,
      to,
      replyTo: email, // 수신자가 바로 문의자에게 답장 가능
      subject: `문의: ${name}`,
      text: `보낸사람: ${name} <${email}>\n\n${message}`,
      html: `
        <p><strong>보낸사람:</strong> ${name} &lt;${email}&gt;</p>
        <pre style="white-space:pre-wrap;font-family:inherit">${message}</pre>
      `,
    });

    return NextResponse.json({ ok: true, messageId: info.messageId });
  } catch (err: any) {
    console.error("[/api/contact] error:", err);
    return NextResponse.json(
      { ok: false, error: "메일 발송 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
