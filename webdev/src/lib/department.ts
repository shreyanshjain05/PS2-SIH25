export const DEPARTMENT_EMAILS: Record<string, string> = {
  "Health Dept": process.env.EMAIL_HEALTH || "health-dept@example.com",
  "Traffic Police": process.env.EMAIL_TRAFFIC || "traffic-police@example.com",
  "Education Board":
    process.env.EMAIL_EDUCATION || "education-board@example.com",
  "Industrial Control":
    process.env.EMAIL_INDUSTRY || "industrial-control@example.com",
};

export function getDepartmentEmail(department: string): string {
  return (
    DEPARTMENT_EMAILS[department] ||
    process.env.EMAIL_DEFAULT_ALERT ||
    "alert-fallback@example.com"
  );
}
