export type SmtpErrorDetails = {
  code: string;
  enhancedCode: string;
  message: string;
};

export class SmtpError extends Error {
  code: string;
  responseCode: number;
  enhancedCode: string;

  constructor({ code, enhancedCode, message }: SmtpErrorDetails) {
    super(message);
    this.name = "SmtpError";
    this.code = code;
    this.responseCode = Number(code);
    this.enhancedCode = enhancedCode;
  }
}

export function smtpError(code: string, enhancedCode: string, message: string): SmtpError {
  return new SmtpError({ code, enhancedCode, message });
}
